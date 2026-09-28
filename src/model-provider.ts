import { setTimeout as delay } from 'node:timers/promises'

import type { EngineLogger } from './engine-controller.js'

export interface ModelProviderConfig {
  apiKeyEnv?: string
  contextWindow?: number
  maxTokens?: number
  vision?: boolean
  excludeModelNameContains?: string[]
  modelRefreshIntervalMs?: number
  modelDiscoveryTimeoutMs?: number
}

export interface DiscoveredModel {
  id: string
  name: string
}

interface FiberLike {
  update(config: unknown, noSave?: boolean): void | Promise<void>
  await?(): Promise<unknown>
}

interface LoaderEntryLike {
  options: { config?: unknown }
  fiber?: FiberLike
}

export interface LoaderLike {
  resolve(id: string): LoaderEntryLike
}

interface ProviderProfile {
  displayName: string
  api: 'openai-completions'
  baseURL: string
  apiKeyEnv?: string
  defaultContextWindow: number
  defaultMaxTokens: number
  defaultInput: ('text' | 'image')[]
  models: Array<{
    id: string
    name: string
    contextWindow: number
    maxTokens: number
    input: ('text' | 'image')[]
    reasoningEfforts: false
  }>
}

interface PiAiConfig {
  providers?: Record<string, unknown>
  [key: string]: unknown
}

const DEFAULTS = {
  contextWindow: 163_840,
  maxTokens: 102_400,
  vision: true,
  excludeModelNameContains: ['embed', 'embedding'],
  modelRefreshIntervalMs: 15_000,
  modelDiscoveryTimeoutMs: 3_000,
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function authorizationHeader(apiKeyEnv: string): Record<string, string> {
  if (!apiKeyEnv) return {}
  const value = process.env[apiKeyEnv]
  return value ? { authorization: `Bearer ${value}` } : {}
}

export async function discoverModels(
  endpoint: URL,
  config: ModelProviderConfig = {},
  parentSignal?: AbortSignal,
): Promise<DiscoveredModel[]> {
  const timeout = AbortSignal.timeout(config.modelDiscoveryTimeoutMs ?? DEFAULTS.modelDiscoveryTimeoutMs)
  const signal = parentSignal === undefined ? timeout : AbortSignal.any([parentSignal, timeout])
  const url = new URL('models', endpoint.href.endsWith('/') ? endpoint.href : `${endpoint.href}/`)
  const response = await fetch(url, {
    headers: authorizationHeader(config.apiKeyEnv ?? ''),
    signal,
  })
  if (!response.ok) throw new Error(`model discovery returned HTTP ${response.status}`)
  const body = await response.json() as unknown
  if (!isRecord(body) || !Array.isArray(body.data)) {
    throw new Error('model discovery response has no data array')
  }
  const excluded = (config.excludeModelNameContains ?? DEFAULTS.excludeModelNameContains)
    .map((value) => value.toLowerCase())
  const seen = new Set<string>()
  const models: DiscoveredModel[] = []
  for (const value of body.data) {
    if (!isRecord(value) || typeof value.id !== 'string' || value.id.trim() === '') continue
    const id = value.id.trim()
    const lower = id.toLowerCase()
    if (excluded.some((part) => part !== '' && lower.includes(part)) || seen.has(id)) continue
    seen.add(id)
    models.push({ id, name: id })
  }
  if (models.length === 0) throw new Error('model discovery returned no chat models')
  return models
}

export function providerProfile(
  endpoint: URL,
  models: DiscoveredModel[],
  config: ModelProviderConfig = {},
): ProviderProfile {
  const contextWindow = config.contextWindow ?? DEFAULTS.contextWindow
  const maxTokens = config.maxTokens ?? DEFAULTS.maxTokens
  const input: ('text' | 'image')[] = config.vision ?? DEFAULTS.vision
    ? ['text', 'image']
    : ['text']
  return {
    displayName: 'MoE4All',
    api: 'openai-completions',
    baseURL: endpoint.href.replace(/\/$/u, ''),
    ...(config.apiKeyEnv ? { apiKeyEnv: config.apiKeyEnv } : {}),
    defaultContextWindow: contextWindow,
    defaultMaxTokens: maxTokens,
    defaultInput: input,
    models: models.map((model) => ({
      ...model,
      contextWindow,
      maxTokens,
      input,
      reasoningEfforts: false,
    })),
  }
}

function configWithProvider(base: unknown, profile: ProviderProfile): PiAiConfig {
  const config: PiAiConfig = isRecord(base) ? { ...base } : {}
  const providers = isRecord(config.providers) ? { ...config.providers } : {}
  providers.moe4all = profile
  config.providers = providers
  return config
}

async function waitForAdapter(loader: LoaderLike, signal: AbortSignal): Promise<LoaderEntryLike> {
  while (!signal.aborted) {
    try {
      const entry = loader.resolve('llm-pi-ai')
      if (entry.fiber !== undefined) {
        await entry.fiber.await?.()
        return entry
      }
    } catch {
      // The bundle entries are mounted concurrently; the adapter may not exist yet.
    }
    await delay(100, undefined, { signal })
  }
  throw signal.reason
}

export class ModelProviderBridge {
  private readonly abort = new AbortController()
  private entry?: LoaderEntryLike
  private originalConfig: unknown
  private signature = ''
  private lastError = ''
  private syncInFlight: Promise<void> | undefined
  private didUpdate = false
  private discovered: DiscoveredModel[] = []

  constructor(
    private readonly loader: LoaderLike,
    private readonly endpoint: URL,
    private readonly config: ModelProviderConfig,
    private readonly logger: EngineLogger,
  ) {}

  async run(): Promise<void> {
    try {
      this.entry = await waitForAdapter(this.loader, this.abort.signal)
      this.originalConfig = this.entry.options.config
      while (!this.abort.signal.aborted) {
        await this.refreshNow()
        if (this.abort.signal.aborted) break
        await delay(
          this.config.modelRefreshIntervalMs ?? DEFAULTS.modelRefreshIntervalMs,
          undefined,
          { signal: this.abort.signal },
        )
      }
    } catch (error) {
      if (!this.abort.signal.aborted) throw error
    }
  }

  get models(): DiscoveredModel[] {
    return this.discovered.map((model) => ({ ...model }))
  }

  async refreshNow(): Promise<void> {
    const deadline = Date.now() + (this.config.modelDiscoveryTimeoutMs ?? DEFAULTS.modelDiscoveryTimeoutMs)
    while (this.entry === undefined && !this.abort.signal.aborted && Date.now() < deadline) {
      try {
        await delay(50, undefined, { signal: this.abort.signal })
      } catch (error) {
        if (this.abort.signal.aborted) return
        throw error
      }
    }
    if (this.entry === undefined || this.abort.signal.aborted) return
    if (this.syncInFlight !== undefined) return this.syncInFlight
    const sync = this.syncOnce().finally(() => {
      if (this.syncInFlight === sync) this.syncInFlight = undefined
    })
    this.syncInFlight = sync
    await sync
  }

  private async syncOnce(): Promise<void> {
    try {
      const models = await discoverModels(this.endpoint, this.config, this.abort.signal)
      const profile = providerProfile(this.endpoint, models, this.config)
      const signature = JSON.stringify(profile)
      if (signature === this.signature) return
      const fiber = this.entry?.fiber
      if (fiber === undefined) throw new Error('llm-pi-ai adapter is not active')
      await fiber.update(configWithProvider(this.entry?.options.config, profile), true)
      this.didUpdate = true
      await fiber.await?.()
      this.discovered = models
      this.signature = signature
      this.lastError = ''
      this.logger.info(`MoE4All discovered ${models.length} chat model(s): ${models.map((model) => model.id).join(', ')}`)
    } catch (error) {
      if (this.abort.signal.aborted) return
      const detail = error instanceof Error ? error.message : String(error)
      if (detail !== this.lastError) {
        this.logger.warn(`MoE4All model discovery is waiting for the configured endpoint: ${detail}`)
        this.lastError = detail
      }
    }
  }

  async dispose(): Promise<void> {
    this.abort.abort()
    await this.syncInFlight
    const fiber = this.entry?.fiber
    if (fiber === undefined || !this.didUpdate) return
    await fiber.update(this.originalConfig, true)
    await fiber.await?.()
  }
}
