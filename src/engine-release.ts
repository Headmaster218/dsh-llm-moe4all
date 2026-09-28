import { createHash, randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { constants as fsConstants, createReadStream } from 'node:fs'
import { access, mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'

const RELEASE_API = 'https://api.github.com/repos/Headmaster218/MoE4All/releases/latest'
const RELEASE_LATEST_PAGE = 'https://github.com/Headmaster218/MoE4All/releases/latest'
const WINDOWS_ASSET = /^MoE4All-Windows-x86_64-v.+\.zip$/iu

export interface GitHubReleaseAsset {
  name: string
  browser_download_url: string
  size: number
}

export interface GitHubRelease {
  tag_name: string
  name?: string
  html_url: string
  published_at?: string
  assets: GitHubReleaseAsset[]
}

export interface SelectedRelease {
  tag: string
  name: string
  pageUrl: string
  publishedAt?: string
  archive: GitHubReleaseAsset
  checksum?: GitHubReleaseAsset
}

export interface InstalledEngine {
  tag: string
  name: string
  executable: string
  workingDirectory: string
  installedAt: string
  sourceUrl: string
}

export type EngineInstallStage =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'verifying'
  | 'extracting'
  | 'finalizing'
  | 'complete'
  | 'cancelled'
  | 'error'

export interface EngineInstallProgress {
  stage: EngineInstallStage
  downloadedBytes: number
  totalBytes?: number
  percent?: number
  message?: string
  error?: string
}

export interface EngineReleaseStatus {
  supported: boolean
  managed: boolean
  installed?: InstalledEngine
  versions: InstalledEngine[]
  latest?: SelectedRelease
  updateAvailable: boolean
  install: EngineInstallProgress
  message?: string
}

export interface EngineReleaseDependencies {
  fetch(input: string | URL, init?: RequestInit): Promise<Response>
  expandArchive(archive: string, destination: string, signal?: AbortSignal): Promise<void>
}

function defaultRoot(): string {
  const dshHome = process.env.DSH_HOME?.trim()
  return join(dshHome ? resolve(dshHome) : join(homedir(), '.dsh'), 'moe4all-engine')
}

function assertInside(root: string, path: string): void {
  const delta = relative(resolve(root), resolve(path))
  if (delta === '' || delta === '..' || delta.startsWith(`..${sep}`) || isAbsolute(delta)) {
    if (resolve(root) !== resolve(path)) throw new Error(`unsafe MoE4All engine path: ${path}`)
  }
}

function safeTag(tag: string): string {
  const value = tag.replace(/[^a-zA-Z0-9._-]/gu, '_')
  if (value === '' || value === '.' || value === '..') throw new Error(`invalid release tag: ${tag}`)
  return value
}

async function responseBytes(response: Response, label: string): Promise<Uint8Array> {
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`)
  return new Uint8Array(await response.arrayBuffer())
}

async function expandArchiveWithPowerShell(archive: string, destination: string, signal?: AbortSignal): Promise<void> {
  if (process.platform !== 'win32') throw new Error('Automatic MoE4All installation currently supports Windows x86_64 only.')
  const script = [
    "$ErrorActionPreference = 'Stop'",
    'Expand-Archive -LiteralPath $env:MOE4ALL_ARCHIVE -DestinationPath $env:MOE4ALL_DESTINATION -Force',
  ].join('; ')
  await new Promise<void>((resolveRun, reject) => {
    const child = spawn('powershell.exe', [
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      script,
    ], {
      env: {
        ...process.env,
        MOE4ALL_ARCHIVE: archive,
        MOE4ALL_DESTINATION: destination,
      },
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'ignore', 'pipe'],
    })
    let stderr = ''
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk: string) => { stderr += chunk })
    const cancel = (): void => { child.kill() }
    signal?.addEventListener('abort', cancel, { once: true })
    child.once('error', reject)
    child.once('close', (code) => {
      signal?.removeEventListener('abort', cancel)
      if (signal?.aborted === true) {
        reject(new DOMException('The engine installation was cancelled.', 'AbortError'))
        return
      }
      if (code === 0) resolveRun()
      else reject(new Error(`Expand-Archive failed (${String(code)}): ${stderr.trim()}`))
    })
  })
}

const DEFAULT_DEPENDENCIES: EngineReleaseDependencies = {
  fetch: (input, init) => fetch(input, init),
  expandArchive: expandArchiveWithPowerShell,
}

export function selectRelease(release: GitHubRelease): SelectedRelease {
  const archive = release.assets.find((asset) => WINDOWS_ASSET.test(asset.name))
  if (archive === undefined) throw new Error('The latest MoE4All release has no Windows x86_64 ZIP asset.')
  const checksum = release.assets.find((asset) => asset.name === `${archive.name}.sha256`)
  return {
    tag: release.tag_name,
    name: release.name?.trim() || release.tag_name,
    pageUrl: release.html_url,
    ...(release.published_at === undefined ? {} : { publishedAt: release.published_at }),
    archive,
    ...(checksum === undefined ? {} : { checksum }),
  }
}

export function releaseFromTag(tag: string): SelectedRelease {
  const version = tag.replace(/^release-/iu, '').replace(/^v/iu, '')
  if (!/^\d+(?:\.\d+)+(?:[-+][a-zA-Z0-9.-]+)?$/u.test(version)) {
    throw new Error(`The latest MoE4All release has an unsupported tag: ${tag}`)
  }
  const encodedTag = encodeURIComponent(tag)
  const name = `MoE4All-Windows-x86_64-v${version}.zip`
  const base = `https://github.com/Headmaster218/MoE4All/releases/download/${encodedTag}`
  return {
    tag,
    name: `MoE4All v${version}`,
    pageUrl: `https://github.com/Headmaster218/MoE4All/releases/tag/${encodedTag}`,
    archive: { name, browser_download_url: `${base}/${name}`, size: 0 },
    checksum: { name: `${name}.sha256`, browser_download_url: `${base}/${name}.sha256`, size: 0 },
  }
}

async function findExecutable(root: string): Promise<string | undefined> {
  const pending = [root]
  while (pending.length > 0) {
    const directory = pending.shift()!
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) pending.push(path)
      else if (entry.isFile() && entry.name.toLowerCase() === 'infr.exe') return path
    }
  }
  return undefined
}

function expectedChecksum(text: string, archiveName: string): string {
  const match = /\b([a-fA-F0-9]{64})\b/u.exec(text)
  if (match === null) throw new Error(`Invalid SHA-256 file for ${archiveName}.`)
  return match[1]!.toLowerCase()
}

async function fileChecksum(path: string): Promise<string> {
  const hash = createHash('sha256')
  await new Promise<void>((resolveRead, reject) => {
    const input = createReadStream(path)
    input.on('data', chunk => { hash.update(chunk) })
    input.once('error', reject)
    input.once('end', resolveRead)
  })
  return hash.digest('hex')
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

function progress(stage: EngineInstallStage, downloadedBytes = 0, totalBytes?: number, message?: string): EngineInstallProgress {
  const percent = totalBytes === undefined || totalBytes <= 0
    ? undefined
    : Math.min(100, Math.round(downloadedBytes * 1000 / totalBytes) / 10)
  return {
    stage,
    downloadedBytes,
    ...(totalBytes === undefined ? {} : { totalBytes }),
    ...(percent === undefined ? {} : { percent }),
    ...(message === undefined ? {} : { message }),
  }
}

function localArchiveIdentity(path: string): { tag: string, name: string } {
  const file = basename(path)
  const stem = file.replace(/\.zip$/iu, '')
  const version = /(?:^|[-_])v?(\d+(?:\.\d+)+(?:[-+][a-zA-Z0-9.-]+)?)$/iu.exec(stem)?.[1]
  if (version !== undefined) return { tag: `release-${version}`, name: `MoE4All v${version}` }
  return { tag: `local-${safeTag(stem)}`, name: `MoE4All (${file})` }
}

function releaseIdentity(tag: string): { name: string, sourceUrl: string } {
  const version = tag.replace(/^release-/iu, '').replace(/^v/iu, '')
  if (/^\d+(?:\.\d+)+(?:[-+][a-zA-Z0-9.-]+)?$/u.test(version)) {
    return {
      name: `MoE4All v${version}`,
      sourceUrl: `https://github.com/Headmaster218/MoE4All/releases/tag/release-${encodeURIComponent(version)}`,
    }
  }
  return { name: `MoE4All ${tag}`, sourceUrl: '' }
}

export class EngineReleaseManager {
  readonly root: string
  private readonly dependencies: EngineReleaseDependencies
  private latestCache?: { at: number, value: SelectedRelease }
  private latestPromise: Promise<SelectedRelease> | undefined
  private installPromise: Promise<InstalledEngine> | undefined
  private installProgress: EngineInstallProgress = progress('idle')
  private installAbort: AbortController | undefined

  constructor(root = defaultRoot(), dependencies: Partial<EngineReleaseDependencies> = {}) {
    this.root = resolve(root)
    this.dependencies = { ...DEFAULT_DEPENDENCIES, ...dependencies }
  }

  private get metadataPath(): string {
    return join(this.root, 'installed.json')
  }

  private setProgress(next: EngineInstallProgress): void {
    this.installProgress = next
  }

  private progressSnapshot(): EngineInstallProgress {
    return { ...this.installProgress }
  }

  async latest(force = false): Promise<SelectedRelease> {
    if (!force && this.latestCache !== undefined && Date.now() - this.latestCache.at < 60 * 60 * 1000) {
      return this.latestCache.value
    }
    if (this.latestPromise !== undefined) return this.latestPromise
    const run = (async () => {
      const response = await this.dependencies.fetch(RELEASE_API, {
        headers: {
          accept: 'application/vnd.github+json',
          'user-agent': 'dsh-llm-moe4all',
          'x-github-api-version': '2022-11-28',
        },
        signal: AbortSignal.timeout(15_000),
      })
      let selected: SelectedRelease
      if (response.ok) {
        selected = selectRelease(await response.json() as GitHubRelease)
      } else {
        const page = await this.dependencies.fetch(RELEASE_LATEST_PAGE, {
          headers: { 'user-agent': 'dsh-llm-moe4all' },
          redirect: 'follow',
          signal: AbortSignal.timeout(15_000),
        })
        if (!page.ok) {
          throw new Error(`GitHub release check returned HTTP ${response.status}; release page returned HTTP ${page.status}`)
        }
        const match = /\/releases\/tag\/([^/?#]+)/u.exec(page.url)
        if (match === null) throw new Error('GitHub did not redirect to a tagged MoE4All release.')
        selected = releaseFromTag(decodeURIComponent(match[1]!))
      }
      this.latestCache = { at: Date.now(), value: selected }
      return selected
    })().finally(() => {
      if (this.latestPromise === run) this.latestPromise = undefined
    })
    this.latestPromise = run
    return run
  }

  async installed(): Promise<InstalledEngine | undefined> {
    try {
      const value = JSON.parse(await readFile(this.metadataPath, 'utf8')) as Partial<InstalledEngine>
      if (
        typeof value.tag !== 'string'
        || typeof value.name !== 'string'
        || typeof value.executable !== 'string'
        || typeof value.workingDirectory !== 'string'
        || typeof value.installedAt !== 'string'
        || typeof value.sourceUrl !== 'string'
        || !await exists(value.executable)
      ) return undefined
      return value as InstalledEngine
    } catch {
      return undefined
    }
  }

  async versions(): Promise<InstalledEngine[]> {
    const versions = new Map<string, InstalledEngine>()
    const selected = await this.installed()
    if (selected !== undefined) versions.set(resolve(selected.executable).toLowerCase(), selected)
    const releasesRoot = join(this.root, 'releases')
    try {
      for (const entry of await readdir(releasesRoot, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        const directory = join(releasesRoot, entry.name)
        const executable = await findExecutable(directory)
        if (executable === undefined) continue
        const key = resolve(executable).toLowerCase()
        if (versions.has(key)) continue
        const identity = releaseIdentity(entry.name)
        const details = await stat(directory)
        versions.set(key, {
          tag: entry.name,
          name: identity.name,
          executable,
          workingDirectory: dirname(executable),
          installedAt: details.birthtime.toISOString(),
          sourceUrl: identity.sourceUrl,
        })
      }
    } catch {}
    return [...versions.values()].sort((left, right) => right.installedAt.localeCompare(left.installedAt))
  }

  async status(currentExecutable = '', force = false): Promise<EngineReleaseStatus> {
    if (process.platform !== 'win32' || process.arch !== 'x64') {
      return {
        supported: false,
        managed: false,
        versions: [],
        updateAvailable: false,
        install: this.progressSnapshot(),
        message: 'Automatic MoE4All installation currently supports Windows x86_64 only.',
      }
    }
    const [installed, versions] = await Promise.all([this.installed(), this.versions()])
    let latest = this.latestCache?.value
    let message: string | undefined
    if (force) {
      try { latest = await this.latest(true) }
      catch (error) { message = error instanceof Error ? error.message : String(error) }
    }
    const managed = installed !== undefined && (
      currentExecutable.trim() === ''
      || resolve(currentExecutable) === resolve(installed.executable)
    )
    return {
      supported: true,
      managed,
      ...(installed === undefined ? {} : { installed }),
      versions,
      ...(latest === undefined ? {} : { latest }),
      ...(message === undefined ? {} : { message }),
      updateAvailable: latest !== undefined && versions.find(item => resolve(item.executable) === resolve(currentExecutable || installed?.executable || '.'))?.tag !== latest.tag,
      install: this.progressSnapshot(),
    }
  }

  installLatest(): Promise<InstalledEngine> {
    return this.runInstall(async (signal) => {
      this.setProgress(progress('checking', 0, undefined, 'Checking the latest official release...'))
      const release = await this.latest(true)
      signal.throwIfAborted()
      const releasesRoot = join(this.root, 'releases')
      const target = join(releasesRoot, safeTag(release.tag))
      assertInside(this.root, target)
      await mkdir(releasesRoot, { recursive: true })

      const existing = await exists(target) ? await findExecutable(target) : undefined
      if (existing !== undefined) return this.finishInstall(release.tag, release.name, existing, release.pageUrl)

      const staging = join(this.root, `.install-${randomUUID()}`)
      const archivePath = join(staging, basename(release.archive.name))
      assertInside(this.root, staging)
      await mkdir(staging, { recursive: true })
      try {
        const actual = await this.downloadArchive(release, archivePath, signal)
        this.setProgress(progress('verifying', this.installProgress.downloadedBytes, this.installProgress.totalBytes, 'Verifying SHA-256...'))
        if (release.checksum !== undefined) {
          const checksumResponse = await this.dependencies.fetch(release.checksum.browser_download_url, {
            headers: { 'user-agent': 'dsh-llm-moe4all' },
            signal,
          })
          const checksumText = new TextDecoder().decode(await responseBytes(checksumResponse, release.checksum.name))
          const expected = expectedChecksum(checksumText, release.archive.name)
          if (actual !== expected) throw new Error(`SHA-256 verification failed for ${release.archive.name}.`)
        }
        const executable = await this.extractArchive(archivePath, target, staging, signal)
        return this.finishInstall(release.tag, release.name, executable, release.pageUrl)
      } finally {
        await rm(staging, { recursive: true, force: true })
      }
    })
  }

  installFromLocal(input: string): Promise<InstalledEngine> {
    return this.runInstall(async (signal) => {
      if (input.trim() === '') throw new Error('Enter a ZIP, extracted directory, or infr.exe path.')
      const path = resolve(input.trim())
      this.setProgress(progress('checking', 0, undefined, 'Checking the local engine path...'))
      let details
      try {
        details = await stat(path)
      } catch {
        throw new Error(`Local MoE4All path does not exist: ${path}`)
      }

      if (details.isDirectory()) {
        const executable = await findExecutable(path)
        if (executable === undefined) throw new Error(`No infr.exe was found under ${path}.`)
        return this.finishInstall('local', 'MoE4All (local)', executable, path)
      }
      if (!details.isFile()) throw new Error(`Unsupported local MoE4All path: ${path}`)
      if (basename(path).toLowerCase() === 'infr.exe') {
        return this.finishInstall('local', 'MoE4All (local)', path, path)
      }
      if (extname(path).toLowerCase() !== '.zip') {
        throw new Error('The local file must be an official MoE4All ZIP or infr.exe.')
      }

      const identity = localArchiveIdentity(path)
      const target = join(this.root, 'releases', safeTag(identity.tag))
      const staging = join(this.root, `.install-${randomUUID()}`)
      assertInside(this.root, target)
      assertInside(this.root, staging)
      await mkdir(staging, { recursive: true })
      try {
        const adjacentChecksum = `${path}.sha256`
        if (await exists(adjacentChecksum)) {
          this.setProgress(progress('verifying', details.size, details.size, 'Verifying the local SHA-256 file...'))
          const expected = expectedChecksum(await readFile(adjacentChecksum, 'utf8'), basename(path))
          const actual = await fileChecksum(path)
          if (actual !== expected) throw new Error(`SHA-256 verification failed for ${basename(path)}.`)
        }
        const executable = await this.extractArchive(path, target, staging, signal)
        return this.finishInstall(identity.tag, identity.name, executable, path)
      } finally {
        await rm(staging, { recursive: true, force: true })
      }
    })
  }

  cancelInstall(): EngineInstallProgress {
    this.installAbort?.abort()
    if (['checking', 'downloading', 'verifying', 'extracting', 'finalizing'].includes(this.installProgress.stage)) {
      this.installProgress = { ...this.installProgress, stage: 'cancelled', message: 'Engine installation cancelled.' }
    }
    return this.progressSnapshot()
  }

  async remove(tag: string, currentExecutable = ''): Promise<void> {
    const version = (await this.versions()).find(item => item.tag === tag)
    if (version === undefined) throw new Error(`Unknown managed engine version: ${tag}`)
    if (currentExecutable.trim() !== '' && resolve(currentExecutable) === resolve(version.executable)) {
      throw new Error('Select another engine version before deleting the configured version.')
    }
    const releasesRoot = resolve(join(this.root, 'releases'))
    const target = resolve(join(releasesRoot, safeTag(version.tag)))
    assertInside(releasesRoot, target)
    if (!resolve(version.executable).toLowerCase().startsWith(`${target.toLowerCase()}${sep}`)) {
      throw new Error('Only plugin-managed engine versions can be deleted.')
    }
    await rm(target, { recursive: true, force: true })
    const selected = await this.installed()
    if (selected !== undefined && resolve(selected.executable) === resolve(version.executable)) {
      await rm(this.metadataPath, { force: true })
    }
  }

  private runInstall(task: (signal: AbortSignal) => Promise<InstalledEngine>): Promise<InstalledEngine> {
    if (this.installPromise !== undefined) return this.installPromise
    const abort = new AbortController()
    this.installAbort = abort
    const run = task(abort.signal).catch((error: unknown) => {
      const cancelled = abort.signal.aborted
      this.installProgress = {
        ...this.installProgress,
        stage: cancelled ? 'cancelled' : 'error',
        ...(cancelled ? { message: 'Engine installation cancelled.' } : { error: error instanceof Error ? error.message : String(error) }),
      }
      throw error
    }).finally(() => {
      if (this.installPromise === run) this.installPromise = undefined
      if (this.installAbort === abort) this.installAbort = undefined
    })
    this.installPromise = run
    return run
  }

  private async downloadArchive(release: SelectedRelease, archivePath: string, signal: AbortSignal): Promise<string> {
    const response = await this.dependencies.fetch(release.archive.browser_download_url, {
      headers: { 'user-agent': 'dsh-llm-moe4all' },
      signal,
    })
    if (!response.ok) throw new Error(`${release.archive.name} returned HTTP ${response.status}`)
    const headerSize = Number(response.headers.get('content-length'))
    const totalBytes = release.archive.size > 0
      ? release.archive.size
      : Number.isFinite(headerSize) && headerSize > 0 ? headerSize : undefined
    this.setProgress(progress('downloading', 0, totalBytes, `Downloading ${release.archive.name}...`))

    const output = await open(archivePath, 'w')
    const hash = createHash('sha256')
    let downloaded = 0
    try {
      if (response.body === null) throw new Error(`No response body was returned for ${release.archive.name}.`)
      const reader = response.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        await output.write(value)
        hash.update(value)
        downloaded += value.byteLength
        this.setProgress(progress('downloading', downloaded, totalBytes, `Downloading ${release.archive.name}...`))
      }
    } finally {
      await output.close()
    }
    if (release.archive.size > 0 && downloaded !== release.archive.size) {
      throw new Error(`Downloaded ${release.archive.name} has the wrong size.`)
    }
    return hash.digest('hex')
  }

  private async extractArchive(archivePath: string, target: string, staging: string, signal: AbortSignal): Promise<string> {
    const extracted = join(staging, 'extracted')
    assertInside(this.root, target)
    assertInside(this.root, extracted)
    await mkdir(extracted, { recursive: true })
    this.setProgress(progress('extracting', this.installProgress.downloadedBytes, this.installProgress.totalBytes, 'Extracting MoE4All...'))
    signal.throwIfAborted()
    await this.dependencies.expandArchive(archivePath, extracted, signal)
    signal.throwIfAborted()
    const stagedExecutable = await findExecutable(extracted)
    if (stagedExecutable === undefined) throw new Error('The MoE4All archive contains no infr.exe.')
    this.setProgress(progress('finalizing', this.installProgress.downloadedBytes, this.installProgress.totalBytes, 'Finalizing the installation...'))
    await mkdir(dirname(target), { recursive: true })
    if (await exists(target)) await rm(target, { recursive: true, force: true })
    await rename(extracted, target)
    return join(target, relative(extracted, stagedExecutable))
  }

  private async finishInstall(tag: string, name: string, executable: string, sourceUrl: string): Promise<InstalledEngine> {
    const installed: InstalledEngine = {
      tag,
      name,
      executable,
      workingDirectory: dirname(executable),
      installedAt: new Date().toISOString(),
      sourceUrl,
    }
    await mkdir(this.root, { recursive: true })
    await writeFile(this.metadataPath, `${JSON.stringify(installed, null, 2)}\n`, 'utf8')
    this.setProgress(progress('complete', this.installProgress.downloadedBytes, this.installProgress.totalBytes, 'MoE4All is ready to configure.'))
    return installed
  }
}
