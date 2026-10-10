import { spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { mkdir, open, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { homedir } from 'node:os'
import semver from 'semver'
import { Parser } from 'tar'
import { fetchDirectThenSystemProxy } from './network-fetch.js'
import type { PluginUpdateOperation, PluginUpdateStatus } from './client/plugin-update.js'

export const PLUGIN_NAME = 'dsh-llm-moe4all'
export const PLUGIN_UPDATE_SCHEMA = 'moe4all/plugin-update/v1'
export const PLUGIN_UPDATE_PATH = '/api/moe4all/plugin-update'
const REPOSITORY = 'Headmaster218/dsh-llm-moe4all'
const API = `https://api.github.com/repos/${REPOSITORY}/releases/latest`
const MAX_ARCHIVE_BYTES = 32 * 1024 * 1024
const MAX_UNPACKED_BYTES = 128 * 1024 * 1024

interface Release {
  version: string
  archiveUrl: string
  checksumUrl: string
  size: number
}
export type PluginCommand = (args: string[], signal: AbortSignal, log: (line: string) => void) => Promise<void>
export interface PluginUpdateTarget { profileDirectory: string; run: PluginCommand; dshVersion?: string }
interface UpdateOptions {
  target: () => PluginUpdateTarget | undefined
  busy?: () => boolean
  fetch?: (input: string | URL, init?: RequestInit) => Promise<Response>
  runningVersion?: string
}
export interface ReleaseUpdateStatus extends PluginUpdateStatus {
  supported: boolean
  reason: string | null
  releaseUrl: string
  operation: PluginUpdateOperation | null
}

function manifest(bytes: Buffer | string): Record<string, any> {
  const value: unknown = JSON.parse(bytes.toString())
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid package manifest.')
  return value as Record<string, any>
}

function localArchive(spec: unknown, profileDirectory: string): string | null {
  if (typeof spec !== 'string' || !spec.startsWith('file:') || !spec.endsWith('.tgz')) return null
  return resolve(profileDirectory, spec.slice(5))
}

function releaseAsset(value: unknown, tag: string): string {
  if (typeof value !== 'string') throw new Error('Missing official plugin release asset.')
  const url = new URL(value)
  if (url.origin !== 'https://github.com' || url.username || url.password || url.search || url.hash
    || !url.pathname.startsWith(`/${REPOSITORY}/releases/download/${tag}/`)) {
    throw new Error('Plugin update asset is not from the official release.')
  }
  return value
}

export function selectPluginRelease(value: unknown): Release {
  const body = manifest(JSON.stringify(value))
  const tag = typeof body.tag_name === 'string' ? body.tag_name : ''
  const version = semver.valid(tag.replace(/^(?:release-|v)/, ''))
  if (body.draft || body.prerelease || !version || semver.prerelease(version)) {
    throw new Error('Only stable plugin releases can be installed automatically.')
  }
  const assets = Array.isArray(body.assets) ? body.assets : []
  const archive = assets.find(asset => asset.name === `${PLUGIN_NAME}.tgz`)
  const checksum = assets.find(asset => asset.name === 'SHA256SUMS.txt')
  if (!Number.isSafeInteger(archive?.size) || archive.size <= 0 || archive.size > MAX_ARCHIVE_BYTES) {
    throw new Error('The plugin release archive is missing or too large.')
  }
  return {
    version,
    archiveUrl: releaseAsset(archive?.browser_download_url, tag),
    checksumUrl: releaseAsset(checksum?.browser_download_url, tag),
    size: archive.size,
  }
}

export async function validatePluginArchive(file: string, version: string, dshVersion?: string): Promise<void> {
  let packageInfo: Record<string, any> | undefined
  let unpackedBytes = 0
  const names = new Set<string>()
  await new Promise<void>((done, reject) => {
    const stream = createReadStream(file)
    const parser = new Parser({ strict: true, maxMetaEntrySize: 64 * 1024, maxDecompressionRatio: 200, onReadEntry(entry) {
      const name = entry.path
      if (!name.startsWith('package/') || name.includes('\\') || name.split('/').includes('..')
        || names.has(name) || !['File', 'Directory'].includes(entry.type)) {
        parser.abort(new Error('Unsafe plugin archive entry.')); return
      }
      names.add(name)
      unpackedBytes += entry.size
      if (names.size > 4096 || unpackedBytes > MAX_UNPACKED_BYTES) {
        parser.abort(new Error('Plugin archive exceeds unpacking limits.')); return
      }
      if (name === 'package/package.json') {
        if (entry.size > 64 * 1024) { parser.abort(new Error('Plugin manifest is too large.')); return }
        const chunks: Buffer[] = []
        entry.on('data', chunk => chunks.push(Buffer.from(chunk)))
        entry.on('end', () => {
          try { packageInfo = manifest(Buffer.concat(chunks)) }
          catch (error) { parser.abort(error instanceof Error ? error : new Error(String(error))) }
        })
      }
      entry.resume()
    } })
    stream.on('error', error => parser.abort(error))
    parser.on('error', error => { stream.destroy(); reject(error) })
    parser.on('end', done)
    stream.pipe(parser)
  })
  if (packageInfo?.name !== PLUGIN_NAME || packageInfo.version !== version
    || packageInfo.dsh?.bundle?.patch !== './cordis.patch.yml'
    || !names.has('package/lib/index.js') || !names.has('package/lib/client.js')
    || !names.has('package/cordis.patch.yml') || packageInfo.scripts?.install || packageInfo.scripts?.postinstall) {
    throw new Error('Release archive does not contain the expected prebuilt plugin.')
  }
  if (dshVersion && typeof packageInfo.engines?.dsh === 'string'
    && !semver.satisfies(dshVersion, packageInfo.engines.dsh, { includePrerelease: true })) {
    throw new Error(`This plugin release does not support DSH ${dshVersion}. Update DSH or use a compatible plugin release.`)
  }
}

function sameOtherSettings(before: Record<string, any>, after: Record<string, any>): boolean {
  const withoutPlugin = (value: Record<string, any>) => ({
    ...value, dependencies: { ...value.dependencies, [PLUGIN_NAME]: undefined },
  })
  return isDeepStrictEqual(withoutPlugin(before), withoutPlugin(after))
}

export class PluginReleaseUpdater {
  private readonly fetcher: (input: string | URL, init?: RequestInit) => Promise<Response>
  private readonly runningVersion: string
  private checkedAt = 0
  private candidate: Release | undefined
  private operation: PluginUpdateOperation | null = null
  private abort: AbortController | undefined
  private job: Promise<void> | undefined

  constructor(private readonly options: UpdateOptions) {
    this.fetcher = options.fetch ?? fetchDirectThenSystemProxy
    this.runningVersion = options.runningVersion ?? manifest(readFileSync(new URL('../package.json', import.meta.url))).version
  }

  private async installation(): Promise<{ target: PluginUpdateTarget; spec: string; version: string } | null> {
    const target = this.options.target()
    if (!target) return null
    const profile = manifest(await readFile(join(target.profileDirectory, 'package.json')))
    const spec = profile.dependencies?.[PLUGIN_NAME]
    if (!localArchive(spec, target.profileDirectory)) return null
    const packageFile = join(target.profileDirectory, 'node_modules', PLUGIN_NAME, 'package.json')
    const installed = manifest(await readFile(packageFile))
    const actualRoot = await realpath(dirname(packageFile))
    const inside = relative(await realpath(join(target.profileDirectory, 'node_modules')), actualRoot)
    if (inside.startsWith('..') || isAbsolute(inside)) return null
    // Never replace a source checkout linked into a profile, even if its spec was edited.
    const moduleRoot = await realpath(dirname(fileURLToPath(new URL('../package.json', import.meta.url))))
    if (this.options.runningVersion === undefined && moduleRoot !== actualRoot
      && !(this.operation?.outcome.restartRequired && this.operation.installedVersion === installed.version)) return null
    return { target, spec, version: installed.version }
  }

  async status(): Promise<ReleaseUpdateStatus> {
    // pnpm can briefly truncate a manifest while writing it. Poll the operation, not that file.
    const working = !!this.job && this.operation?.state === 'running'
    const installed = working ? null : await this.installation()
    return {
      source: installed || working ? 'github-release' : 'managed-elsewhere',
      installedVersion: installed?.version ?? this.operation?.installedVersion ?? this.runningVersion,
      latestVersion: this.candidate?.version ?? null,
      updateAvailable: !!installed && !!this.candidate && semver.gt(this.candidate.version, installed.version),
      supported: installed !== null || working,
      reason: installed || working ? null : 'Use DSH Market or the installer for this installation source or host.',
      releaseUrl: `https://github.com/${REPOSITORY}/releases`,
      operation: this.operation === null ? null : structuredClone(this.operation),
    }
  }

  private async response(url: string, signal: AbortSignal): Promise<Response> {
    const response = await this.fetcher(url, {
      headers: { accept: 'application/vnd.github+json' },
      signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
    })
    if (!response.ok) throw new Error(`Plugin release request failed (HTTP ${response.status}). Retry or open the release page.`)
    return response
  }

  private async bytes(url: string, maximum: number, signal: AbortSignal, progress?: (bytes: number) => void): Promise<Buffer> {
    const response = await this.response(url, signal)
    if (!response.body) throw new Error('Plugin release download returned an empty body.')
    const reader = response.body.getReader()
    const chunks: Buffer[] = []
    let size = 0
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > maximum) throw new Error('Plugin release download exceeds its size limit.')
        chunks.push(Buffer.from(value))
        progress?.(size)
      }
    } catch (error) { await reader.cancel().catch(() => {}); throw error }
    finally { reader.releaseLock() }
    return Buffer.concat(chunks)
  }

  async check(force = false): Promise<ReleaseUpdateStatus> {
    if (!(await this.status()).supported) return this.status()
    if (force || Date.now() - this.checkedAt > 30 * 60_000) {
      this.candidate = selectPluginRelease(JSON.parse((await this.bytes(API, 1024 * 1024, new AbortController().signal)).toString()))
      this.checkedAt = Date.now()
    }
    return this.status()
  }

  async start(): Promise<PluginUpdateOperation> {
    if (this.job) throw new Error('A plugin update is already running.')
    if (this.options.busy?.()) throw new Error('Stop the managed Engine and finish active agent runs before updating this plugin.')
    const status = await this.check()
    if (!status.updateAvailable || !this.candidate) throw new Error('No newer stable plugin release is available.')
    if (this.job) throw new Error('A plugin update is already running.')
    const release = this.candidate
    this.abort = new AbortController()
    this.operation = {
      operationId: randomUUID(), state: 'running', installedVersion: status.installedVersion,
      progress: { phase: 'download', percent: 0, detail: 'Downloading the official plugin release...' },
      outcome: { refreshRequired: false, restartRequired: false }, failure: null,
    }
    this.job = this.install(release, this.abort.signal).catch(error => {
      this.operation!.state = 'failed'
      this.operation!.failure = { message: String(error), retryable: true }
    }).finally(() => { this.job = undefined; this.abort = undefined })
    return structuredClone(this.operation)
  }

  cancel(): void {
    if (this.operation?.progress.phase === 'install' || this.operation?.progress.phase === 'rollback') {
      throw new Error('Installation is finishing. Do not interrupt DSH until it completes.')
    }
    this.abort?.abort()
  }

  get updating(): boolean { return this.job !== undefined }

  private progress(phase: string, percent: number | null, detail: string): void {
    if (this.operation) this.operation.progress = { phase, percent, detail }
  }

  private async runInstaller(target: PluginUpdateTarget, args: string[], signal: AbortSignal, log: (line: string) => void): Promise<void> {
    for (let attempt = 0; ; attempt++) {
      signal.throwIfAborted()
      try { await target.run(args, signal, log); return }
      catch (error) {
        if (attempt >= 2 || !/\b(?:EPERM|EBUSY)\b/i.test(String(error))) throw error
        log('A temporary file lock interrupted DSH installation. Retrying...')
        await new Promise(done => setTimeout(done, 500 * (attempt + 1)))
      }
    }
  }

  private async install(release: Release, signal: AbortSignal): Promise<void> {
    let lock: Awaited<ReturnType<typeof open>> | undefined
    let lockPath: string | undefined
    let backup: { target: PluginUpdateTarget; packageBytes: Buffer; lockBytes: Buffer; oldArchive: string } | undefined
    let mutated = false
    try {
      const installed = await this.installation()
      if (!installed) throw new Error('Plugin installation source changed. Update cancelled.')
      const { target } = installed
      const archive = await this.bytes(release.archiveUrl, MAX_ARCHIVE_BYTES, signal, bytes => {
        this.progress('download', Math.min(80, bytes / release.size * 80), `${bytes} / ${release.size} bytes`)
      })
      if (archive.length !== release.size) throw new Error('Plugin archive size does not match the release.')
      this.progress('verify', 82, 'Verifying SHA256 and the prebuilt plugin...')
      const sums = (await this.bytes(release.checksumUrl, 64 * 1024, signal)).toString()
      const matches = sums.split(/\r?\n/).map(line => /^([a-f0-9]{64})\s+\*?dsh-llm-moe4all\.tgz$/i.exec(line)).filter(Boolean)
      if (matches.length !== 1 || createHash('sha256').update(archive).digest('hex') !== matches[0]![1]!.toLowerCase()) {
        throw new Error('Plugin release SHA256 verification failed. No installation was changed.')
      }
      const directory = join(target.profileDirectory, '.moe4all-plugin-updates')
      await mkdir(directory, { recursive: true })
      const staged = join(directory, `${PLUGIN_NAME}-${release.version}.tgz`)
      await writeFile(`${staged}.partial`, archive)
      await rename(`${staged}.partial`, staged)
      await validatePluginArchive(staged, release.version, target.dshVersion)
      signal.throwIfAborted()
      if (this.options.busy?.()) throw new Error('The Engine or an agent became active. Retry after it finishes.')
      lockPath = join(directory, 'install.lock')
      try { lock = await open(lockPath, 'wx') } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
        const pid = Number(await readFile(lockPath, 'utf8'))
        try { process.kill(pid, 0); throw new Error('Another plugin update is still running.') }
        catch (probe) {
          if ((probe as NodeJS.ErrnoException).code !== 'ESRCH') throw probe
          await rm(lockPath)
          lock = await open(lockPath, 'wx')
        }
      }
      await lock.writeFile(String(process.pid))
      const packagePath = join(target.profileDirectory, 'package.json')
      const packageBytes = await readFile(packagePath)
      const lockBytes = await readFile(join(target.profileDirectory, 'pnpm-lock.yaml'))
      const before = manifest(packageBytes)
      const oldArchive = localArchive(before.dependencies?.[PLUGIN_NAME], target.profileDirectory)
      if (!oldArchive || before.dependencies[PLUGIN_NAME] !== installed.spec) throw new Error('Plugin source changed during download.')
      // Keep an independent copy: later cleanup of a download folder must not break rollback.
      const retained = join(directory, `rollback-${this.operation!.operationId}.tgz`)
      await writeFile(retained, await readFile(oldArchive))
      backup = { target, packageBytes, lockBytes, oldArchive: retained }
      await writeFile(join(directory, 'package.before.json'), packageBytes)
      await writeFile(join(directory, 'pnpm-lock.before.yaml'), lockBytes)
      before.dependencies[PLUGIN_NAME] = `file:${staged.replaceAll('\\', '/')}`
      this.progress('install', 90, 'Installing through this DSH profile. Keep DSH open...')
      mutated = true
      await writeFile(packagePath, `${JSON.stringify(before, null, 2)}\n`)
      await this.runInstaller(target, ['install', '--prefer-offline', '--ignore-scripts', '--no-frozen-lockfile'], signal, line => {
        this.progress('install', 90, line)
      })
      const after = manifest(await readFile(packagePath))
      if (!sameOtherSettings(manifest(packageBytes), after)) throw new Error('The profile changed during plugin update.')
      const actual = manifest(await readFile(join(target.profileDirectory, 'node_modules', PLUGIN_NAME, 'package.json')))
      if (actual.name !== PLUGIN_NAME || actual.version !== release.version) throw new Error('DSH did not activate the expected package on disk.')
      await writeFile(join(directory, 'last-success.json'), JSON.stringify({ version: release.version, previousVersion: installed.version, backupArchive: retained }))
      this.operation!.state = 'succeeded'
      this.operation!.installedVersion = release.version
      this.operation!.outcome.restartRequired = true
      this.progress('complete', 100, 'Plugin installed. Restart DSH manually to load the new version.')
    } catch (error) {
      let message = error instanceof Error ? error.message : String(error)
      let rolledBack = false
      if (mutated && backup) {
        this.progress('rollback', null, 'Restoring the previous plugin...')
        try {
          const packagePath = join(backup.target.profileDirectory, 'package.json')
          const current = manifest(await readFile(packagePath))
          const previous = manifest(backup.packageBytes)
          if (!sameOtherSettings(previous, current) || !existsSync(localArchive(previous.dependencies?.[PLUGIN_NAME], backup.target.profileDirectory) ?? '')) {
            current.dependencies[PLUGIN_NAME] = `file:${backup.oldArchive.replaceAll('\\', '/')}`
            await writeFile(packagePath, `${JSON.stringify(current, null, 2)}\n`)
            await this.runInstaller(backup.target, ['install', '--prefer-offline', '--ignore-scripts', '--no-frozen-lockfile'], AbortSignal.timeout(120_000), () => {})
          } else {
            await writeFile(packagePath, backup.packageBytes)
            await writeFile(join(backup.target.profileDirectory, 'pnpm-lock.yaml'), backup.lockBytes)
            await this.runInstaller(backup.target, ['install', '--offline', '--ignore-scripts', '--frozen-lockfile'], AbortSignal.timeout(120_000), () => {})
          }
          const restored = manifest(await readFile(join(backup.target.profileDirectory, 'node_modules', PLUGIN_NAME, 'package.json')))
          if (restored.version !== this.operation!.installedVersion) throw new Error('Previous package version was not restored.')
          rolledBack = true
        } catch (rollbackError) { message += ` Rollback failed: ${String(rollbackError)}. Use the saved archive and the Windows installer.` }
      }
      this.operation!.state = rolledBack ? 'rolled-back' : signal.aborted && !mutated ? 'cancelled' : 'failed'
      this.operation!.failure = { message, retryable: true }
      this.progress(this.operation!.state, null, message)
    } finally {
      if (lock) { await lock.close(); await rm(lockPath!, { force: true }) }
    }
  }

  async dispose(): Promise<void> {
    if (this.operation?.progress.phase !== 'install' && this.operation?.progress.phase !== 'rollback') this.abort?.abort()
    await this.job
  }
}

export interface DesktopPluginInstaller {
  runPlugin(args: readonly string[], cwd: string, signal?: AbortSignal): {
    stdout: NodeJS.ReadableStream; stderr: NodeJS.ReadableStream
    done: Promise<{ exitCode: number | null }>
    cancel(): void
  }
}

export function desktopPluginCommand(service: DesktopPluginInstaller, directory: string): PluginCommand {
  return async (args, signal, log) => {
    const handle = service.runPlugin(args, directory, signal)
    const timer = setTimeout(() => handle.cancel(), 120_000)
    handle.stdout.on('data', chunk => log(String(chunk).trim().slice(-400)))
    handle.stderr.on('data', chunk => log(String(chunk).trim().slice(-400)))
    try {
      const result = await handle.done
      if (result.exitCode !== 0) throw new Error(`DSH plugin install failed (exit ${result.exitCode}).`)
    } finally { clearTimeout(timer) }
  }
}

export function cliPluginUpdateTarget(): PluginUpdateTarget | undefined {
  const argv = process.argv.slice(2)
  const flag = argv.indexOf('--profile')
  const profile = flag >= 0 ? argv[flag + 1] : argv[0] === 'web' ? 'web' : undefined
  const home = process.env.DSH_HOME ? resolve(process.env.DSH_HOME) : join(homedir(), '.dsh')
  const entry = process.argv[1]
  if (!home || !isAbsolute(home) || !profile || !/^[\w.-]+$/.test(profile) || ['.', '..', 'node_modules'].includes(profile)
    || !entry || !/[\\/]bin\.js$/.test(entry) || !existsSync(entry)) return undefined
  const profileDirectory = join(home, 'profiles', profile)
  if (relative(home, profileDirectory).startsWith('..')) return undefined
  let packageDirectory = dirname(resolve(entry))
  let dshVersion: string | undefined
  for (let i = 0; i < 6; i++) {
    const packageFile = join(packageDirectory, 'package.json')
    if (existsSync(packageFile)) {
      const info = manifest(readFileSync(packageFile))
      if (info.name === '@deepseek-ai/dsh') { dshVersion = semver.valid(info.version) ?? undefined; break }
    }
    packageDirectory = dirname(packageDirectory)
  }
  if (!dshVersion) return undefined
  return { profileDirectory, dshVersion, run: (args, signal, log) => new Promise((done, reject) => {
    const child = spawn(process.execPath, [resolve(entry), 'plugin', '--profile', profile, ...args], {
      cwd: dirname(resolve(entry)), windowsHide: true, shell: false,
      env: { ...process.env, CI: 'true', DSH_HOME: home }, stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    let cancelled = false
    const feed = (chunk: Buffer) => {
      const line = chunk.toString().trim().replace(/([?&]token=)[^\s]+/gi, '$1<redacted>')
      output = (output + line).slice(-16_000)
      log(line.slice(-400))
    }
    child.stdout.on('data', feed)
    child.stderr.on('data', feed)
    const stop = () => {
      cancelled = true
      if (process.platform === 'win32' && child.pid) {
        spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' })
      } else child.kill()
    }
    signal.addEventListener('abort', stop, { once: true })
    const timer = setTimeout(stop, 120_000)
    child.once('error', reject)
    child.once('close', code => {
      clearTimeout(timer); signal.removeEventListener('abort', stop)
      if (code === 0 && !cancelled) done()
      else reject(new Error(`DSH plugin install ${cancelled ? 'timed out or was interrupted' : `failed (exit ${code})`}: ${output}`))
    })
  }) }
}
