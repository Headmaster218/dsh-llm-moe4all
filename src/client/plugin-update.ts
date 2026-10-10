export const PLUGIN_PACKAGE_NAME = 'dsh-llm-moe4all'
export const CHECK_PLUGIN_UPDATE_EVENT = 'moe4all-check-plugin-update'

const UPDATE_SCHEMA = 'dsh-market/update-api/v1'
const API_PREFIX = '/dsh-market/api/v1/'

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export interface MarketUpdateCapabilities {
  endpoints: {
    updates: string
    operations: string
    restart: string
  }
  restartSupported: boolean
}

export interface PluginUpdateStatus {
  source: string
  installedVersion: string | null
  latestVersion: string | null
  updateAvailable: boolean
}

export interface PluginUpdateOperation {
  operationId: string
  state: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'rolled-back'
  installedVersion: string | null
  progress: {
    phase: string | null
    percent: number | null
    detail: string | null
  }
  outcome: {
    refreshRequired: boolean
    restartRequired: boolean
  }
  failure: {
    message: string
    retryable: boolean
  } | null
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function endpoint(value: unknown): string {
  const path = text(value)
  if (path === null || !path.startsWith(API_PREFIX) || path.includes('://')) {
    throw new Error('DSH Market returned an invalid update endpoint.')
  }
  return path
}

function schemaBody(value: unknown): Record<string, unknown> {
  const body = record(value)
  if (body === null || body.schema !== UPDATE_SCHEMA) {
    throw new Error('DSH Market returned an unsupported update response.')
  }
  return body
}

function operationOf(value: unknown): PluginUpdateOperation {
  const operation = record(value)
  const progress = record(operation?.progress)
  const outcome = record(operation?.outcome)
  const failure = record(operation?.failure)
  const state = text(operation?.state)
  const operationId = text(operation?.operationId)
  if (operationId === null || !['queued', 'running', 'succeeded', 'failed', 'cancelled', 'rolled-back'].includes(state ?? '')) {
    throw new Error('DSH Market returned an invalid update operation.')
  }
  return {
    operationId,
    state: state as PluginUpdateOperation['state'],
    installedVersion: text(operation?.installedVersion),
    progress: {
      phase: text(progress?.phase),
      percent: typeof progress?.percent === 'number' ? progress.percent : null,
      detail: text(progress?.detail),
    },
    outcome: {
      refreshRequired: outcome?.refreshRequired === true,
      restartRequired: outcome?.restartRequired === true,
    },
    failure: failure === null ? null : {
      message: text(failure.message) ?? 'Plugin update failed.',
      retryable: failure.retryable === true,
    },
  }
}

export class MarketPluginUpdateApi {
  private capabilities: MarketUpdateCapabilities | null = null

  constructor(
    private readonly fetcher: FetchLike = (input, init) => fetch(input, init),
    private readonly delay: (milliseconds: number) => Promise<void> = milliseconds => (
      new Promise(resolve => setTimeout(resolve, milliseconds))
    ),
    private readonly requestTimeoutMilliseconds = 15_000,
  ) {}

  private request(path: string, init?: RequestInit): Promise<Response> {
    const timeout = AbortSignal.timeout(this.requestTimeoutMilliseconds)
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout
    return this.fetcher(path, { cache: 'no-store', credentials: 'same-origin', ...init, signal })
  }

  private async json(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
    const response = await this.request(path, init)
    let value: unknown = null
    try {
      value = await response.json()
    } catch {
      // The public API promises JSON. Preserve a useful HTTP error below.
    }
    if (!response.ok) {
      const body = record(value)
      throw new Error(text(body?.error) ?? `Plugin update request failed with HTTP ${String(response.status)}.`)
    }
    return schemaBody(value)
  }

  async discover(): Promise<MarketUpdateCapabilities | null> {
    const response = await this.request('/dsh-market/api/v1/capabilities')
    if (response.status === 404) return null
    let value: unknown = null
    try {
      value = await response.json()
    } catch {
      throw new Error('DSH Market returned an unreadable update response.')
    }
    if (!response.ok) {
      const body = record(value)
      throw new Error(text(body?.error) ?? `Plugin update discovery failed with HTTP ${String(response.status)}.`)
    }
    const body = schemaBody(value)
    const features = record(body.features)
    const endpoints = record(body.endpoints)
    const restart = record(body.restart)
    if (features?.check !== true || features.update !== true || endpoints === null) return null
    this.capabilities = {
      endpoints: {
        updates: endpoint(endpoints.updates),
        operations: endpoint(endpoints.operations),
        restart: endpoint(endpoints.restart),
      },
      restartSupported: restart?.supported === true,
    }
    return this.capabilities
  }

  private ready(): MarketUpdateCapabilities {
    if (this.capabilities === null) throw new Error('Plugin update service is unavailable.')
    return this.capabilities
  }

  async check(force = false): Promise<PluginUpdateStatus> {
    const capabilities = this.ready()
    const query = new URLSearchParams({ name: PLUGIN_PACKAGE_NAME })
    if (force) query.set('force', '1')
    const body = await this.json(`${capabilities.endpoints.updates}?${query.toString()}`)
    const item = record(body.package)
    if (item === null || text(item.name) !== PLUGIN_PACKAGE_NAME) {
      throw new Error('DSH Market returned an invalid plugin update status.')
    }
    return {
      source: text(item.source) ?? 'unknown',
      installedVersion: text(item.installedVersion),
      latestVersion: text(item.latestVersion),
      updateAvailable: item.updateAvailable === true,
    }
  }

  async start(): Promise<PluginUpdateOperation> {
    const capabilities = this.ready()
    const body = await this.json(capabilities.endpoints.updates, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ packageName: PLUGIN_PACKAGE_NAME }),
    })
    return operationOf(body.operation)
  }

  async operation(operationId: string): Promise<PluginUpdateOperation> {
    const capabilities = this.ready()
    const query = new URLSearchParams({ operationId })
    const body = await this.json(`${capabilities.endpoints.operations}?${query.toString()}`)
    return operationOf(body.operation)
  }

  async waitForCompletion(
    operationId: string,
    onProgress: (operation: PluginUpdateOperation) => void,
    timeoutMilliseconds = 10 * 60 * 1000,
  ): Promise<PluginUpdateOperation> {
    const deadline = Date.now() + timeoutMilliseconds
    while (Date.now() < deadline) {
      const operation = await this.operation(operationId)
      onProgress(operation)
      if (!['queued', 'running'].includes(operation.state)) return operation
      await this.delay(750)
    }
    throw new Error('Plugin update timed out. You can retry from DSH Market.')
  }

  async restart(): Promise<void> {
    const capabilities = this.ready()
    if (!capabilities.restartSupported) throw new Error('This DSH host must be restarted manually.')
    await this.json(capabilities.endpoints.restart, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })
  }
}

export function compactUpdateVersion(value: string | null): string {
  if (value === null) return '?'
  return /^[0-9a-f]{40}$/i.test(value) ? value.slice(0, 10) : value
}

/** A local archive has its own release source; never migrate a Market/source install silently. */
export class PluginUpdateApi {
  private readonly market: MarketPluginUpdateApi
  private local = false
  constructor(private readonly fetcher: FetchLike = (input, init) => fetch(input, init)) {
    this.market = new MarketPluginUpdateApi(fetcher)
  }

  private async localJson(query = '', init?: RequestInit): Promise<Record<string, unknown>> {
    const response = await this.fetcher(`/api/moe4all/plugin-update${query}`, {
      cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(40_000), ...init,
    })
    const body = record(await response.json())
    if (!response.ok) throw new Error(text(body?.error) ?? `Plugin update request failed (HTTP ${response.status}).`)
    if (body?.schema !== 'moe4all/plugin-update/v1') throw new Error('Invalid plugin release update response.')
    return body
  }

  async discover(): Promise<MarketUpdateCapabilities | null> {
    try {
      const body = await this.localJson()
      if (record(body.status)?.supported === true) {
        this.local = true
        return { endpoints: { updates: '/api/moe4all/plugin-update', operations: '/api/moe4all/plugin-update', restart: '' }, restartSupported: false }
      }
    } catch { /* Unsupported hosts can still use the public Market API. */ }
    this.local = false
    return this.market.discover()
  }

  async check(force = false): Promise<PluginUpdateStatus> {
    if (!this.local) return this.market.check(force)
    const status = record((await this.localJson(`?check=1${force ? '&force=1' : ''}`)).status)
    if (!status || status.source !== 'github-release') throw new Error('This plugin installation is no longer managed by the release updater.')
    return {
      source: 'github-release', installedVersion: text(status.installedVersion), latestVersion: text(status.latestVersion),
      updateAvailable: status.updateAvailable === true,
    }
  }

  async start(): Promise<PluginUpdateOperation> {
    return this.local ? operationOf((await this.localJson('', { method: 'POST' })).operation) : this.market.start()
  }
  async operation(id: string): Promise<PluginUpdateOperation> {
    if (!this.local) return this.market.operation(id)
    const operation = operationOf(record((await this.localJson()).status)?.operation)
    if (operation.operationId !== id) throw new Error('The plugin update operation changed. Check its status before retrying.')
    return operation
  }
  async waitForCompletion(id: string, progress: (operation: PluginUpdateOperation) => void): Promise<PluginUpdateOperation> {
    if (!this.local) return this.market.waitForCompletion(id, progress)
    const deadline = Date.now() + 10 * 60_000
    while (Date.now() < deadline) {
      const operation = await this.operation(id)
      progress(operation)
      if (!['queued', 'running'].includes(operation.state)) return operation
      await new Promise(done => setTimeout(done, 750))
    }
    throw new Error('Plugin update timed out. Check the update status before retrying.')
  }
  async cancel(): Promise<void> {
    if (!this.local) throw new Error('Cancel this update through DSH Market.')
    await this.localJson('?cancel=1', { method: 'POST' })
  }
  restart(): Promise<void> { return this.market.restart() }
}
