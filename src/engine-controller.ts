import { spawn, type ChildProcess } from 'node:child_process'
import { constants as fsConstants } from 'node:fs'
import { access } from 'node:fs/promises'
import { freemem, totalmem } from 'node:os'
import { basename, delimiter, dirname, extname, isAbsolute, join, resolve } from 'node:path'
import { createInterface, type Interface as ReadLineInterface } from 'node:readline'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

export type LaunchMode = 'connect' | 'prompt' | 'auto' | 'managed'
export type EffectiveLaunchMode = Exclude<LaunchMode, 'managed'>

export type EnginePhase =
  | 'checking'
  | 'ready'
  | 'offline'
  | 'starting'
  | 'resource-warning'
  | 'missing-executable'
  | 'missing-arguments'
  | 'duplicate-process'
  | 'error'

export interface EngineConfig {
  mode?: LaunchMode
  protocol?: 'http' | 'https'
  host?: string
  port?: number
  apiBasePath?: string
  /** Advanced compatibility override. When set, it wins over protocol, host, port and apiBasePath. */
  endpoint?: string
  executable?: string
  arguments?: string[]
  workingDirectory?: string
  apiKeyEnv?: string
  allowRemoteEndpoint?: boolean
  processNames?: string[]
  minimumFreeRamFraction?: number
  minimumFreeVramFraction?: number
  promptWhenBusy?: boolean
  resourceProbeTimeoutMs?: number
  startupTimeoutMs?: number
  healthTimeoutMs?: number
  pollIntervalMs?: number
  shutdownTimeoutMs?: number
  stopOnUnload?: boolean
  logOutput?: boolean
}

export interface EngineLogger {
  info(message: string): void
  warn(message: string): void
  error(message: string | Error): void
}

export interface RunningProcess {
  name: string
  pid: number
}

export interface ResourceSnapshot {
  ramTotalBytes: number
  ramAvailableBytes: number
  vramTotalBytes: number
  vramAvailableBytes: number
  vramLive: boolean
  device?: string
  deviceName?: string
}

export interface StartupPrompt {
  reasons: string[]
  resources?: ResourceSnapshot
}

export interface EngineRuntimeStatus {
  phase: EnginePhase
  endpoint: string
  mode: EffectiveLaunchMode
  ready: boolean
  canStart: boolean
  executable?: string
  message?: string
  reasons?: string[]
  resources?: ResourceSnapshot
  processes?: RunningProcess[]
}

export interface EngineStartResult {
  ok: boolean
  status: EngineRuntimeStatus
}

export interface EngineControllerDependencies {
  detectProcesses(processNames: string[]): Promise<RunningProcess[]>
  probeResources(executable: string, config: EngineConfig): Promise<ResourceSnapshot>
}

export const DEFAULT_CONFIG = {
  mode: 'prompt',
  protocol: 'http',
  host: '127.0.0.1',
  port: 8080,
  apiBasePath: '/v1',
  endpoint: '',
  executable: '',
  arguments: [],
  workingDirectory: '',
  apiKeyEnv: '',
  allowRemoteEndpoint: false,
  processNames: ['infr.exe', 'moe4all.exe', 'infr', 'moe4all'],
  minimumFreeRamFraction: 0.5,
  minimumFreeVramFraction: 0.5,
  promptWhenBusy: true,
  resourceProbeTimeoutMs: 10_000,
  startupTimeoutMs: 120_000,
  healthTimeoutMs: 2_000,
  pollIntervalMs: 500,
  shutdownTimeoutMs: 5_000,
  stopOnUnload: true,
  logOutput: true,
} as const satisfies Required<EngineConfig>

type ResolvedEngineConfig = {
  [Key in keyof Required<EngineConfig>]: Required<EngineConfig>[Key]
}

interface CapturedProcess {
  exitCode: number
  stdout: string
  stderr: string
}

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function resolvedConfig(config: EngineConfig): ResolvedEngineConfig {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    arguments: [...(config.arguments ?? DEFAULT_CONFIG.arguments)],
    processNames: [...(config.processNames ?? DEFAULT_CONFIG.processNames)],
  }
}

export function effectiveLaunchMode(mode: LaunchMode | undefined): EffectiveLaunchMode {
  return mode === 'managed' ? 'prompt' : mode ?? DEFAULT_CONFIG.mode
}

function isLoopback(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return host === 'localhost' || host === '::1' || host === '[::1]' || /^127(?:\.|$)/.test(host)
}

function urlHost(host: string): string {
  const trimmed = host.trim()
  return trimmed.includes(':') && !trimmed.startsWith('[') ? `[${trimmed}]` : trimmed
}

export function endpointFromConfig(config: EngineConfig): string {
  const explicit = config.endpoint?.trim()
  if (explicit) return explicit
  const protocol = config.protocol ?? DEFAULT_CONFIG.protocol
  const host = config.host ?? DEFAULT_CONFIG.host
  const port = config.port ?? DEFAULT_CONFIG.port
  const rawPath = config.apiBasePath ?? DEFAULT_CONFIG.apiBasePath
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  return `${protocol}://${urlHost(host)}:${port}${path}`
}

export function validateEndpoint(endpoint: string, allowRemoteEndpoint = false): URL {
  const parsed = new URL(endpoint)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`MoE4All endpoint must use http or https: ${endpoint}`)
  }
  if (parsed.username || parsed.password) {
    throw new Error('MoE4All endpoint must not contain credentials')
  }
  if (!allowRemoteEndpoint && !isLoopback(parsed.hostname)) {
    throw new Error(`MoE4All endpoint is not loopback: ${parsed.hostname}`)
  }
  return parsed
}

function healthUrl(endpoint: URL): URL {
  return new URL('/health', endpoint.origin)
}

function authorizationHeader(apiKeyEnv: string): Record<string, string> {
  if (!apiKeyEnv) return {}
  const value = process.env[apiKeyEnv]
  return value ? { authorization: `Bearer ${value}` } : {}
}

export async function probeHealth(
  endpoint: URL,
  timeoutMs: number,
  apiKeyEnv = '',
  parentSignal?: AbortSignal,
): Promise<boolean> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const signal = parentSignal === undefined
    ? timeoutSignal
    : AbortSignal.any([parentSignal, timeoutSignal])

  try {
    const response = await fetch(healthUrl(endpoint), {
      method: 'GET',
      headers: authorizationHeader(apiKeyEnv),
      signal,
    })
    return response.ok
  } catch (error) {
    if (parentSignal?.aborted) throw error
    return false
  }
}

async function existingFile(candidate: string): Promise<string | undefined> {
  try {
    await access(candidate, fsConstants.F_OK)
    return candidate
  } catch {
    return undefined
  }
}

function executableNames(command: string): string[] {
  if (process.platform !== 'win32' || extname(command)) return [command]
  const extensions = (process.env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM')
    .split(';')
    .filter(Boolean)
  return [command, ...extensions.map((extension) => `${command}${extension.toLowerCase()}`)]
}

async function searchPath(command: string): Promise<string | undefined> {
  const pathEntries = (process.env.PATH ?? '').split(delimiter).filter(Boolean)
  for (const directory of pathEntries) {
    for (const name of executableNames(command)) {
      const hit = await existingFile(join(directory, name))
      if (hit !== undefined) return hit
    }
  }
  return undefined
}

export async function resolveEngineExecutable(config: EngineConfig): Promise<string | undefined> {
  const workingDirectory = config.workingDirectory || process.cwd()
  const explicit = config.executable?.trim() || process.env.MOE4ALL_ENGINE?.trim()
  if (explicit) {
    const candidate = isAbsolute(explicit) ? explicit : resolve(workingDirectory, explicit)
    return existingFile(candidate)
  }

  const binary = process.platform === 'win32' ? 'infr.exe' : 'infr'
  const bundled = await existingFile(join(packageRoot, 'engine', binary))
  if (bundled !== undefined) return bundled

  const adjacent = await existingFile(resolve(workingDirectory, binary))
  if (adjacent !== undefined) return adjacent
  return searchPath(binary)
}

function captureProcess(
  executable: string,
  arguments_: string[],
  timeoutMs: number,
  workingDirectory?: string,
): Promise<CapturedProcess> {
  return new Promise((resolveCapture, reject) => {
    const child = spawn(executable, arguments_, {
      cwd: workingDirectory || undefined,
      env: process.env,
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout?.setEncoding('utf8')
    child.stderr?.setEncoding('utf8')
    child.stdout?.on('data', (chunk: string) => { stdout += chunk })
    child.stderr?.on('data', (chunk: string) => { stderr += chunk })
    const timer = setTimeout(() => child.kill(), timeoutMs)
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('close', (code) => {
      clearTimeout(timer)
      resolveCapture({ exitCode: code ?? -1, stdout, stderr })
    })
  })
}

export function parseTasklistCsv(output: string): RunningProcess[] {
  const processes: RunningProcess[] = []
  for (const line of output.split(/\r?\n/u)) {
    const match = /^"((?:[^"]|"")*)","(\d+)"/u.exec(line.trim())
    if (match === null) continue
    processes.push({ name: match[1]!.replaceAll('""', '"'), pid: Number(match[2]) })
  }
  return processes
}

export async function detectRunningEngines(processNames: string[]): Promise<RunningProcess[]> {
  const wanted = new Set(processNames.map((name) => basename(name).toLowerCase()))
  let result: CapturedProcess
  let processes: RunningProcess[]
  if (process.platform === 'win32') {
    result = await captureProcess('tasklist.exe', ['/FO', 'CSV', '/NH'], 5_000)
    processes = parseTasklistCsv(result.stdout)
  } else {
    result = await captureProcess('ps', ['-A', '-o', 'pid=,comm='], 5_000)
    processes = result.stdout.split(/\r?\n/u).flatMap((line) => {
      const match = /^\s*(\d+)\s+(.+?)\s*$/u.exec(line)
      return match === null ? [] : [{ pid: Number(match[1]), name: basename(match[2]!) }]
    })
  }
  if (result.exitCode !== 0) {
    throw new Error(`process inspection failed (${result.exitCode}): ${result.stderr.trim()}`)
  }
  return processes.filter((item) => item.pid !== process.pid && wanted.has(item.name.toLowerCase()))
}

function probeArguments(arguments_: string[]): string[] {
  const result = ['resources']
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]!
    if (/^--(?:dev|config|test-resource-profile)=/u.test(argument)) {
      result.push(argument)
      continue
    }
    if (argument === '--dev' || argument === '--config' || argument === '--test-resource-profile') {
      const value = arguments_[index + 1]
      if (value !== undefined) {
        result.push(argument, value)
        index += 1
      }
      continue
    }
    if (argument === '--set') {
      const value = arguments_[index + 1]
      if (value?.startsWith('device.dev=')) result.push(argument, value)
      if (value !== undefined) index += 1
    }
  }
  return result
}

function finiteBytes(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`invalid ${field} in infr resources output`)
  }
  return value
}

export async function probeEngineResources(
  executable: string,
  config: EngineConfig,
): Promise<ResourceSnapshot> {
  const result = await captureProcess(
    executable,
    probeArguments(config.arguments ?? []),
    config.resourceProbeTimeoutMs ?? DEFAULT_CONFIG.resourceProbeTimeoutMs,
    config.workingDirectory,
  )
  if (result.exitCode !== 0) {
    throw new Error(`infr resource probe failed (${result.exitCode}): ${result.stderr.trim()}`)
  }
  const raw = JSON.parse(result.stdout.trim()) as Record<string, unknown>
  const device = typeof raw.device === 'string' ? raw.device : undefined
  const deviceName = typeof raw.device_name === 'string' ? raw.device_name : undefined
  return {
    ramTotalBytes: typeof raw.ram_total_bytes === 'number' ? raw.ram_total_bytes : totalmem(),
    ramAvailableBytes: typeof raw.ram_available_bytes === 'number' ? raw.ram_available_bytes : freemem(),
    vramTotalBytes: finiteBytes(raw.vram_total_bytes, 'vram_total_bytes'),
    vramAvailableBytes: finiteBytes(raw.vram_available_bytes, 'vram_available_bytes'),
    vramLive: raw.vram_live === true,
    ...(device === undefined ? {} : { device }),
    ...(deviceName === undefined ? {} : { deviceName }),
  }
}

function percent(available: number, total: number): string {
  return `${(available / total * 100).toFixed(1)}%`
}

const DEFAULT_DEPENDENCIES: EngineControllerDependencies = {
  detectProcesses: detectRunningEngines,
  probeResources: probeEngineResources,
}

function pipeLines(stream: NodeJS.ReadableStream | null, write: (line: string) => void): ReadLineInterface | undefined {
  if (stream === null) return undefined
  const reader = createInterface({ input: stream })
  reader.on('line', write)
  return reader
}

async function waitForExit(child: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) return true
  return new Promise((resolveExit) => {
    const timer = setTimeout(() => {
      cleanup()
      resolveExit(false)
    }, timeoutMs)
    const onExit = () => {
      cleanup()
      resolveExit(true)
    }
    const cleanup = () => {
      clearTimeout(timer)
      child.off('exit', onExit)
    }
    child.once('exit', onExit)
  })
}

export class EngineController {
  readonly config: ResolvedEngineConfig
  readonly endpoint: URL
  private readonly abort = new AbortController()
  private readonly dependencies: EngineControllerDependencies
  private child: ChildProcess | undefined
  private readers: ReadLineInterface[] = []
  private initialPromise?: Promise<boolean>
  private startPromise: Promise<EngineStartResult> | undefined
  private stopping = false
  private currentStatus: EngineRuntimeStatus

  constructor(
    config: EngineConfig,
    private readonly logger: EngineLogger = console,
    dependencies: Partial<EngineControllerDependencies> = {},
  ) {
    this.config = resolvedConfig(config)
    this.endpoint = validateEndpoint(endpointFromConfig(this.config), this.config.allowRemoteEndpoint)
    this.dependencies = { ...DEFAULT_DEPENDENCIES, ...dependencies }
    this.currentStatus = {
      phase: 'checking',
      endpoint: this.endpoint.href.replace(/\/$/u, ''),
      mode: effectiveLaunchMode(this.config.mode),
      ready: false,
      canStart: false,
    }
  }

  statusSnapshot(): EngineRuntimeStatus {
    return structuredClone(this.currentStatus)
  }

  async refreshStatus(): Promise<EngineRuntimeStatus> {
    if (await probeHealth(
      this.endpoint,
      this.config.healthTimeoutMs,
      this.config.apiKeyEnv,
      this.abort.signal,
    )) {
      return this.setStatus({
        phase: 'ready',
        ready: true,
        canStart: false,
        message: `Connected to MoE4All at ${this.endpoint.origin}`,
      })
    }

    if (this.currentStatus.phase === 'starting' || this.currentStatus.phase === 'resource-warning') {
      return this.statusSnapshot()
    }
    if (!isLoopback(this.endpoint.hostname)) {
      return this.setStatus({
        phase: 'offline',
        ready: false,
        canStart: false,
        message: 'The configured remote MoE4All endpoint is not reachable.',
      })
    }
    const executable = await resolveEngineExecutable(this.config)
    if (executable === undefined) {
      return this.setStatus({
        phase: 'missing-executable',
        ready: false,
        canStart: false,
        message: 'MoE4All is not installed or its executable path is not configured.',
      })
    }
    if (this.config.arguments.length === 0) {
      return this.setStatus({
        phase: 'missing-arguments',
        ready: false,
        canStart: false,
        executable,
        message: 'Configure serve arguments and a model path before starting MoE4All.',
      })
    }
    return this.setStatus({
      phase: 'offline',
      ready: false,
      canStart: true,
      executable,
      message: 'MoE4All is configured and ready to start.',
    })
  }

  ensureReady(): Promise<boolean> {
    this.initialPromise ??= this.initialize()
    return this.initialPromise
  }

  requestStart(force = false): Promise<EngineStartResult> {
    if (this.startPromise !== undefined) return this.startPromise
    const run = this.start(force).catch((error: unknown) => {
      if (this.abort.signal.aborted) return { ok: false, status: this.statusSnapshot() }
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(error instanceof Error ? error : new Error(message))
      return {
        ok: false,
        status: this.setStatus({
          phase: 'error',
          ready: false,
          canStart: true,
          message,
        }),
      }
    }).finally(() => {
      if (this.startPromise === run) this.startPromise = undefined
    })
    this.startPromise = run
    return run
  }

  private async initialize(): Promise<boolean> {
    const status = await this.refreshStatus()
    if (status.ready) {
      this.logger.info(`MoE4All engine connected at ${this.endpoint.origin}`)
      return true
    }
    if (effectiveLaunchMode(this.config.mode) !== 'auto') {
      this.logger.info(`MoE4All engine is waiting at ${this.endpoint.origin}; launch mode is ${effectiveLaunchMode(this.config.mode)}`)
      return false
    }
    return (await this.requestStart(false)).ok
  }

  private setStatus(next: Omit<EngineRuntimeStatus, 'endpoint' | 'mode'>): EngineRuntimeStatus {
    this.currentStatus = {
      endpoint: this.endpoint.href.replace(/\/$/u, ''),
      mode: effectiveLaunchMode(this.config.mode),
      ...next,
    }
    return this.statusSnapshot()
  }

  private processNames(executable: string): string[] {
    return [...new Set([...this.config.processNames, basename(executable)])]
  }

  private async findExistingEngine(executable: string): Promise<RunningProcess[]> {
    return this.dependencies.detectProcesses(this.processNames(executable))
  }

  private async resourceWarning(executable: string): Promise<StartupPrompt | undefined> {
    let resources: ResourceSnapshot | undefined
    const reasons: string[] = []
    try {
      resources = await this.dependencies.probeResources(executable, this.config)
      if (resources.ramAvailableBytes / resources.ramTotalBytes <= this.config.minimumFreeRamFraction) {
        reasons.push(`RAM free is ${percent(resources.ramAvailableBytes, resources.ramTotalBytes)}; more than ${this.config.minimumFreeRamFraction * 100}% is required.`)
      }
      if (!resources.vramLive) {
        reasons.push('The Vulkan driver did not provide a live VRAM availability measurement.')
      } else if (resources.vramAvailableBytes / resources.vramTotalBytes <= this.config.minimumFreeVramFraction) {
        reasons.push(`VRAM free is ${percent(resources.vramAvailableBytes, resources.vramTotalBytes)}; more than ${this.config.minimumFreeVramFraction * 100}% is required.`)
      }
    } catch (error) {
      reasons.push(`Resource usage could not be measured: ${error instanceof Error ? error.message : String(error)}`)
    }
    if (reasons.length === 0) return undefined
    return { reasons, ...(resources === undefined ? {} : { resources }) }
  }

  private async start(force: boolean): Promise<EngineStartResult> {
    const status = await this.refreshStatus()
    if (status.ready) return { ok: true, status }
    if (!isLoopback(this.endpoint.hostname)) {
      return {
        ok: false,
        status: this.setStatus({
          phase: 'error',
          ready: false,
          canStart: false,
          message: 'MoE4All will not start a local engine for a remote endpoint.',
        }),
      }
    }

    const executable = await resolveEngineExecutable(this.config)
    if (executable === undefined) {
      return {
        ok: false,
        status: this.setStatus({
          phase: 'missing-executable',
          ready: false,
          canStart: false,
          message: 'MoE4All is not installed or its executable path is not configured.',
        }),
      }
    }
    if (this.config.arguments.length === 0) {
      return {
        ok: false,
        status: this.setStatus({
          phase: 'missing-arguments',
          ready: false,
          canStart: false,
          executable,
          message: 'Configure serve arguments and a model path before starting MoE4All.',
        }),
      }
    }

    const existing = await this.findExistingEngine(executable)
    if (existing.length > 0) {
      const detail = existing.map((item) => `${item.name} (PID ${item.pid})`).join(', ')
      return {
        ok: false,
        status: this.setStatus({
          phase: 'duplicate-process',
          ready: false,
          canStart: false,
          executable,
          processes: existing,
          message: `Another MoE4All engine process already exists: ${detail}. Configure its actual IP and port instead.`,
        }),
      }
    }

    const warning = await this.resourceWarning(executable)
    if (warning !== undefined && !force) {
      this.logger.warn(`MoE4All startup requires confirmation: ${warning.reasons.join(' ')}`)
      return {
        ok: false,
        status: this.setStatus({
          phase: 'resource-warning',
          ready: false,
          canStart: true,
          executable,
          reasons: warning.reasons,
          ...(warning.resources === undefined ? {} : { resources: warning.resources }),
          message: 'Available RAM or VRAM is below the configured startup threshold.',
        }),
      }
    }

    const raced = await this.findExistingEngine(executable)
    if (raced.length > 0) {
      const detail = raced.map((item) => `${item.name} (PID ${item.pid})`).join(', ')
      return {
        ok: false,
        status: this.setStatus({
          phase: 'duplicate-process',
          ready: false,
          canStart: false,
          executable,
          processes: raced,
          message: `Another MoE4All engine appeared during startup: ${detail}.`,
        }),
      }
    }

    this.setStatus({
      phase: 'starting',
      ready: false,
      canStart: false,
      executable,
      ...(warning?.resources === undefined ? {} : { resources: warning.resources }),
      message: 'MoE4All is starting.',
    })
    const child = this.launch(executable)
    const deadline = Date.now() + this.config.startupTimeoutMs
    while (Date.now() < deadline) {
      if (this.abort.signal.aborted) return { ok: false, status: this.statusSnapshot() }
      if (child.exitCode !== null || child.signalCode !== null) {
        throw new Error(`MoE4All engine exited before becoming ready (code ${String(child.exitCode)})`)
      }
      if (await probeHealth(
        this.endpoint,
        this.config.healthTimeoutMs,
        this.config.apiKeyEnv,
        this.abort.signal,
      )) {
        this.logger.info(`MoE4All engine ready at ${this.endpoint.origin}`)
        const ready = this.setStatus({
          phase: 'ready',
          ready: true,
          canStart: false,
          executable,
          message: `MoE4All is ready at ${this.endpoint.origin}.`,
        })
        return { ok: true, status: ready }
      }
      await delay(this.config.pollIntervalMs, undefined, { signal: this.abort.signal })
    }
    throw new Error(`MoE4All engine did not become healthy within ${this.config.startupTimeoutMs} ms`)
  }

  private launch(executable: string): ChildProcess {
    const persistent = !this.config.stopOnUnload
    const captureOutput = this.config.logOutput && !persistent
    this.logger.info(`Starting MoE4All engine: ${executable}`)
    this.child = spawn(executable, this.config.arguments, {
      cwd: this.config.workingDirectory || undefined,
      env: process.env,
      shell: false,
      windowsHide: true,
      detached: persistent,
      stdio: captureOutput ? ['ignore', 'pipe', 'pipe'] : 'ignore',
    })

    this.child.on('error', (error) => {
      if (!this.stopping) this.logger.error(error)
    })
    this.child.on('exit', (code, signal) => {
      if (!this.stopping) {
        this.logger.warn(`MoE4All engine exited (code=${String(code)}, signal=${String(signal)})`)
        this.setStatus({
          phase: 'offline',
          ready: false,
          canStart: true,
          executable,
          message: `MoE4All exited (code=${String(code)}, signal=${String(signal)}).`,
        })
      }
    })
    if (captureOutput) {
      this.readers = [
        pipeLines(this.child.stdout, (line) => this.logger.info(`[MoE4All] ${line}`)),
        pipeLines(this.child.stderr, (line) => this.logger.warn(`[MoE4All] ${line}`)),
      ].filter((reader): reader is ReadLineInterface => reader !== undefined)
    }
    if (persistent) this.child.unref()
    return this.child
  }

  async dispose(): Promise<void> {
    if (this.stopping) return
    this.stopping = true
    this.abort.abort()
    for (const reader of this.readers) reader.close()
    this.readers = []

    const child = this.child
    this.child = undefined
    if (child === undefined || !this.config.stopOnUnload) return
    if (child.exitCode !== null || child.signalCode !== null) return

    child.kill()
    if (await waitForExit(child, this.config.shutdownTimeoutMs)) return
    child.kill('SIGKILL')
    await waitForExit(child, this.config.shutdownTimeoutMs)
  }
}
