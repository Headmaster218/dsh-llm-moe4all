import type { Context } from '@deepseek-ai/cordis'
import type { CredentialProvider } from '@deepseek-ai/dsh-credentials'
import type { WebServer } from '@deepseek-ai/dsh-host-webserver'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'

import { ApiKeyManager, DEFAULT_API_KEY_REF } from './api-key.js'
import { EngineController, endpointFromConfig, validateEndpoint, type EngineConfig } from './engine-controller.js'
import { EngineReleaseManager } from './engine-release.js'
import { makeEngineRoutes } from './host-routes.js'
import { ModelDownloadManager } from './model-download.js'
import { ModelProviderBridge, type ModelProviderConfig, type ProviderSettingsLike } from './model-provider.js'

export const name = 'moe4all-engine'
export const inject = ['settings', 'credentials']
export const SETTINGS_NAMESPACE = settingsNamespace('moe4all-engine')

export interface Config extends EngineConfig, ModelProviderConfig {
  modelDirectory?: string
  modelDirectories?: string[]
  modelDirectoriesConfigured?: boolean
  statusDisplay?: 'hover' | 'always' | 'hidden'
}

export const Config = z.object({
  mode: z.union(['connect', 'prompt', 'auto', 'managed']).default('prompt'),
  protocol: z.union(['http', 'https']).default('http'),
  host: z.string().default('127.0.0.1'),
  port: z.number().step(1).min(1).max(65_535).default(8080),
  apiBasePath: z.string().default('/v1'),
  endpoint: z.string().default(''),
  executable: z.string().role('path').default(''),
  arguments: z.array(z.string()).default([]),
  workingDirectory: z.string().role('path').default(''),
  apiKeyEnv: z.string().default(DEFAULT_API_KEY_REF),
  allowRemoteEndpoint: z.boolean().default(false),
  processNames: z.array(z.string()).default(['infr.exe', 'moe4all.exe', 'infr', 'moe4all']),
  minimumFreeRamFraction: z.number().min(0).max(1).default(0.5),
  minimumFreeVramFraction: z.number().min(0).max(1).default(0.5),
  promptWhenBusy: z.boolean().default(true),
  resourceProbeTimeoutMs: z.number().step(1).min(100).default(10_000),
  startupTimeoutMs: z.number().step(1).min(1000).default(120_000),
  healthTimeoutMs: z.number().step(1).min(100).default(2_000),
  pollIntervalMs: z.number().step(1).min(50).default(500),
  shutdownTimeoutMs: z.number().step(1).min(100).default(5_000),
  stopOnUnload: z.boolean().default(true),
  logOutput: z.boolean().default(true),
  contextWindow: z.number().step(1).min(1).default(163_840),
  maxTokens: z.number().step(1).min(1).default(102_400),
  modelDirectory: z.string().role('path').default(''),
  modelDirectories: z.array(z.string()).default([]),
  modelDirectoriesConfigured: z.boolean().default(false),
  vision: z.boolean().default(true),
  excludeModelNameContains: z.array(z.string()).default(['embed', 'embedding']),
  modelRefreshIntervalMs: z.number().step(1).min(1_000).default(15_000),
  modelDiscoveryTimeoutMs: z.number().step(1).min(100).default(3_000),
  statusDisplay: z.union(['hover', 'always', 'hidden']).default('hover'),
})

interface ActiveRuntime {
  controller: EngineController
  provider: ModelProviderBridge
  startup: Promise<boolean>
  discovery: Promise<void>
}

function normalizedConfig(config: Config): Config {
  return { ...config, apiKeyEnv: config.apiKeyEnv?.trim() || DEFAULT_API_KEY_REF }
}

function startRuntime(
  ctx: Context,
  settings: ProviderSettingsLike,
  config: Config,
  apiKeys: ApiKeyManager,
  allowAutomatic = true,
): ActiveRuntime {
  const resolved = normalizedConfig(config)
  const controller = new EngineController(resolved, ctx.logger, {
    resolveApiKey: () => apiKeys.backendKey(resolved),
  })
  const provider = new ModelProviderBridge(
    settings,
    controller.endpoint,
    resolved,
    ctx.logger,
    () => apiKeys.clientKey(resolved),
  )
  const startup = controller.ensureReady(allowAutomatic).catch((error: unknown) => {
    ctx.logger.error(error instanceof Error ? error : new Error(String(error)))
    return false
  })
  const discovery = provider.run().catch((error: unknown) => {
    ctx.logger.error(error instanceof Error ? error : new Error(String(error)))
  })
  void startup.then((ready) => ready ? provider.refreshNow() : undefined)
  return { controller, provider, startup, discovery }
}

async function stopRuntime(runtime: ActiveRuntime, forceStop = false): Promise<void> {
  await runtime.provider.dispose()
  await runtime.controller.dispose(forceStop)
  await Promise.all([runtime.startup, runtime.discovery])
}

function configSignature(config: Config): string {
  const {
    modelDirectory: _,
    modelDirectories: __,
    modelDirectoriesConfigured: ___,
    statusDisplay: ____,
    ...runtime
  } = config
  return JSON.stringify(runtime)
}

export function apply(ctx: Context, config: Config): () => Promise<void> {
  const settings = (ctx as Context & { settings: ProviderSettingsLike }).settings
  const credentials = (ctx as Context & { credentials: CredentialProvider }).credentials
  const apiKeys = new ApiKeyManager(credentials)
  const releases = new EngineReleaseManager()
  const downloads = new ModelDownloadManager()
  if (config.mode !== 'connect' && !config.executable?.trim()) {
    void releases.bootstrapLatest().then((result) => {
      if (result.started) ctx.logger.info('First MoE4All setup: downloading the latest official engine release.')
    }).catch((error: unknown) => {
      ctx.logger.error(error instanceof Error ? error : new Error(String(error)))
    })
  }
  let source = (): Config => config
  let active: ActiveRuntime | undefined = startRuntime(ctx, settings, config, apiKeys)
  let activeSignature = configSignature(config)
  let activeConfig = config
  let transition = Promise.resolve()
  let restartTimer: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  const applySettings = (stopOwned = false): Promise<void> => {
    if (restartTimer !== undefined) { clearTimeout(restartTimer); restartTimer = undefined }
    const run = transition.then(async () => {
      if (disposed) return
      let next = source()
      let signature = configSignature(next)
      if (!stopOwned && signature === activeSignature) return
      try { validateEndpoint(endpointFromConfig(next), next.allowRemoteEndpoint) }
      catch (error) {
        if (!stopOwned) throw error
        next = activeConfig
        signature = activeSignature
      }
      if (!stopOwned && (active?.controller.ownsProcess || active?.controller.isStarting)) return
      const previous = active
      active = undefined
      if (previous !== undefined) await stopRuntime(previous, stopOwned)
      if (disposed) return
      active = startRuntime(ctx, settings, next, apiKeys, false)
      activeSignature = signature
      activeConfig = next
    })
    transition = run.catch(error => { ctx.logger.error(error instanceof Error ? error : new Error(String(error))) })
    return run
  }

  const scheduleRestart = (): void => {
    if (restartTimer !== undefined) clearTimeout(restartTimer)
    restartTimer = setTimeout(() => {
      restartTimer = undefined
      void applySettings().catch(() => {})
    }, 250)
  }

  installSettingsSection(ctx, SETTINGS_NAMESPACE, Config, config, {
    setSource(current) {
      source = current
    },
    onChange: scheduleRestart,
  })

  ctx.inject(['webServer'], (routeCtx: Context) => {
    const webServer = (routeCtx as Context & { webServer: WebServer }).webServer
    const routes = makeEngineRoutes({
      controller: () => active?.controller,
      models: () => active?.provider.models ?? [],
      refreshModels: async () => { await active?.provider.refreshNow() },
      activateDefaultModel: async () => { await active?.provider.activateDefaultModel() },
      configuredExecutable: () => source().executable ?? '',
      pendingChanges: () => activeSignature !== configSignature(source()),
      prepareStart: () => applySettings(),
      stop: async () => {
        if (!active?.controller.ownsProcess && !active?.controller.isStarting) throw new Error('Only an engine started by this plugin can be stopped.')
        await applySettings(true)
      },
      apiKeys,
      config: source,
      releases,
      downloads,
    })
    routeCtx.effect(() => {
      const disposers = routes.map((route) => webServer.register(route))
      return () => { for (const dispose of disposers) dispose() }
    }, 'moe4all-engine: local control routes')
  })

  return async () => {
    disposed = true
    if (restartTimer !== undefined) clearTimeout(restartTimer)
    await transition
    const current = active
    active = undefined
    if (current !== undefined) await stopRuntime(current)
  }
}

const plugin = { name, inject, Config, apply }

export default plugin
export {
  EngineController,
  detectRunningEngines,
  effectiveLaunchMode,
  endpointFromConfig,
  parseTasklistCsv,
  probeEngineResources,
  probeHealth,
  resolveEngineExecutable,
  validateEndpoint,
} from './engine-controller.js'
export type {
  EffectiveLaunchMode,
  EngineConfig,
  EngineLogger,
  EnginePhase,
  EngineRuntimeStatus,
  EngineStartResult,
  LaunchMode,
  ResourceSnapshot,
  RunningProcess,
} from './engine-controller.js'
export { EngineReleaseManager, releaseFromTag, selectRelease } from './engine-release.js'
export type { EngineBootstrapResult, EngineInstallProgress, EngineInstallStage, EngineReleaseStatus, InstalledEngine, SelectedRelease } from './engine-release.js'
export { ENGINE_PATHS, isLoopbackRequest, makeEngineRoutes } from './host-routes.js'
export { ModelDownloadManager, RECOMMENDED_MODELS } from './model-download.js'
export type { ModelDownloadProgress, RecommendedModel, RecommendedModelKind } from './model-download.js'
export { discoverModels, ModelProviderBridge, providerProfile } from './model-provider.js'
export type { DiscoveredModel, ModelProviderConfig, ProviderSettingsLike } from './model-provider.js'
