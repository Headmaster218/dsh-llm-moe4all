import type { Context } from '@deepseek-ai/cordis'
import type { CredentialProvider } from '@deepseek-ai/dsh-credentials'
import type { WebServer } from '@deepseek-ai/dsh-host-webserver'
import type { SettingsNamespace } from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'

import { ApiKeyManager, DEFAULT_API_KEY_REF } from './api-key.js'
import { EngineController, endpointFromConfig, validateEndpoint, type EngineConfig } from './engine-controller.js'
import { EngineReleaseManager } from './engine-release.js'
import { makeEngineRoutes } from './host-routes.js'
import { ModelDownloadManager } from './model-download.js'
import { ModelProviderBridge, type ModelProviderConfig, type ProviderSettingsLike } from './model-provider.js'
import { settingsNamespace } from './settings-compat.js'
import { cliPluginUpdateTarget, desktopPluginCommand, PluginReleaseUpdater, type DesktopPluginInstaller, type PluginUpdateTarget } from './plugin-release-update.js'
import { makePluginUpdateRoutes } from './plugin-update-routes.js'
import { allowsPluginSelfUpdate, shouldBootstrapEngine } from './distribution-policy.js'

export const name = 'moe4all-engine'
export const inject = ['settings', 'credentials']
export const SETTINGS_NAMESPACE = settingsNamespace('moe4all-engine')

export interface Config extends EngineConfig, ModelProviderConfig {
  modelDirectory?: string
  modelDirectories?: string[]
  modelDirectoriesConfigured?: boolean
  statusDisplay?: 'hover' | 'always' | 'hidden'
  bundledDistribution?: boolean
  bootstrapEngineOnStart?: boolean
}

interface OptionalVolatileSchema {
  volatile?(): unknown
}

function editable<TSchema extends object>(schema: TSchema): TSchema {
  const optional = schema as TSchema & OptionalVolatileSchema
  return (typeof optional.volatile === 'function' ? optional.volatile() : schema) as TSchema
}

export const Config = z.object({
  mode: editable(z.union(['connect', 'prompt', 'auto', 'managed']).default('prompt')),
  protocol: editable(z.union(['http', 'https']).default('http')),
  host: editable(z.string().default('127.0.0.1')),
  port: editable(z.number().step(1).min(1).max(65_535).default(8080)),
  apiBasePath: editable(z.string().default('/v1')),
  endpoint: editable(z.string().default('')),
  executable: editable(z.string().role('path').default('')),
  arguments: editable(z.array(z.string()).default([])),
  workingDirectory: editable(z.string().role('path').default('')),
  apiKeyEnv: editable(z.string().default(DEFAULT_API_KEY_REF)),
  allowRemoteEndpoint: editable(z.boolean().default(false)),
  minimumFreeRamFraction: editable(z.number().min(0).max(1).default(0.5)),
  minimumFreeVramFraction: editable(z.number().min(0).max(1).default(0.5)),
  resourceProbeTimeoutMs: editable(z.number().step(1).min(100).default(10_000)),
  startupTimeoutMs: editable(z.number().step(1).min(1000).default(120_000)),
  healthTimeoutMs: editable(z.number().step(1).min(100).default(2_000)),
  pollIntervalMs: editable(z.number().step(1).min(50).default(500)),
  shutdownTimeoutMs: editable(z.number().step(1).min(100).default(5_000)),
  stopOnUnload: editable(z.boolean().default(true)),
  logOutput: editable(z.boolean().default(true)),
  contextWindow: editable(z.number().step(1).min(1).default(163_840)),
  maxTokens: editable(z.number().step(1).min(1).default(102_400)),
  modelDirectory: editable(z.string().role('path').default('')),
  modelDirectories: editable(z.array(z.string()).default([])),
  modelDirectoriesConfigured: editable(z.boolean().default(false)),
  vision: editable(z.boolean().default(true)),
  excludeModelNameContains: editable(z.array(z.string()).default(['embed', 'embedding'])),
  modelRefreshIntervalMs: editable(z.number().step(1).min(1_000).default(15_000)),
  modelDiscoveryTimeoutMs: editable(z.number().step(1).min(100).default(3_000)),
  statusDisplay: editable(z.union(['hover', 'always', 'hidden']).default('hover')),
  bundledDistribution: editable(z.boolean().default(false)),
  bootstrapEngineOnStart: editable(z.boolean().default(false)),
})

interface ActiveRuntime {
  controller: EngineController
  provider: ModelProviderBridge
  startup: Promise<boolean>
  discovery: Promise<void>
}

interface PluginSettingsScope<T> {
  get(): T
  watch(callback: (next: T, previous: T) => void | Promise<void>): () => void
  update(patch: object): Promise<void>
}

interface PluginSettingsLike extends ProviderSettingsLike {
  register?<T>(
    namespace: SettingsNamespace,
    schema: z<T>,
    options?: { base?: Partial<T> },
  ): PluginSettingsScope<T>
  configure?(presentation: { auto?: boolean }, owner?: Context['fiber']): () => void
}

function normalizedConfig(config: Config): Config {
  return { ...config, apiKeyEnv: config.apiKeyEnv?.trim() || DEFAULT_API_KEY_REF }
}

export function resolvePluginConfig(config: Config): Config {
  return Object.fromEntries(Object.entries(config as Record<string, unknown>).map(([key, value]) => [
    key,
    typeof value === 'object' && value !== null && 'get' in value && typeof value.get === 'function'
      ? value.get()
      : value,
  ])) as Config
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
    () => resolved.mode === 'connect' || controller.ownsProcess,
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
  const settings = (ctx as Context & { settings: PluginSettingsLike }).settings
  const credentials = (ctx as Context & { credentials: CredentialProvider }).credentials
  const apiKeys = new ApiKeyManager(credentials)
  const releases = new EngineReleaseManager()
  const downloads = new ModelDownloadManager()
  const initialConfig = resolvePluginConfig(config)
  let source = (): Config => initialConfig
  let active: ActiveRuntime | undefined = startRuntime(ctx, settings, initialConfig, apiKeys)
  let activeSignature = configSignature(initialConfig)
  let activeConfig = initialConfig
  let transition = Promise.resolve()
  let restartTimer: ReturnType<typeof setTimeout> | undefined
  let disposed = false
  let desktopTarget: PluginUpdateTarget | undefined
  const pluginUpdates = new PluginReleaseUpdater({
    target: () => !allowsPluginSelfUpdate(source()) ? undefined
      : ctx.get('desktopProfiles') ? desktopTarget : cliPluginUpdateTarget(),
    busy: () => {
      if (active?.controller.ownsProcess || active?.controller.isStarting) return true
      const agents = ctx.get('agents') as { list?(): { status?: string }[] } | undefined
      return agents?.list?.().some(agent => agent.status === 'running') ?? false
    },
  })
  ctx.inject(['desktopProfiles', 'desktopPnpm'], desktopCtx => {
    const profiles = desktopCtx.get('desktopProfiles') as { current: { dir: string } }
    const installer = desktopCtx.get('desktopPnpm') as DesktopPluginInstaller
    desktopTarget = { profileDirectory: profiles.current.dir, run: desktopPluginCommand(installer, profiles.current.dir) }
    desktopCtx.effect(() => () => { desktopTarget = undefined }, 'moe4all-engine: Desktop plugin update target')
  })

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

  let stopSettingsWatch = () => {}
  let updateSettings: ((patch: object) => Promise<void>) | undefined
  if (settings.register !== undefined) {
    const settingsScope = settings.register(SETTINGS_NAMESPACE, Config, { base: initialConfig })
    source = () => settingsScope.get()
    updateSettings = patch => settingsScope.update(patch)
    stopSettingsWatch = settingsScope.watch(scheduleRestart)
    scheduleRestart()
  } else if (settings.configure !== undefined) {
    source = () => resolvePluginConfig(config)
    const configure = settings.configure.bind(settings)
    ctx.effect(
      () => configure({ auto: false }, ctx.fiber),
      'moe4all-engine: custom settings page',
    )
    const on = ctx.on as unknown as (name: string, callback: () => void) => void
    on.call(ctx, 'loader/volatile-update', scheduleRestart)
  }
  const bootstrapConfig = source()
  if (shouldBootstrapEngine(bootstrapConfig)) {
    void releases.bootstrapLatest().then(async (result) => {
      if (result.started) ctx.logger.info('First MoE4All setup: downloading the latest official engine release.')
      const completed = result.started ? await releases.waitForInstall() : undefined
      const refreshed = completed === undefined && result.started ? await releases.status() : result.status
      const installed = completed ?? refreshed.installed ?? refreshed.versions[0]
      if (disposed || installed === undefined || source().executable?.trim() || source().mode === 'connect' || !updateSettings) return
      await updateSettings({
        executable: installed.executable,
        workingDirectory: installed.workingDirectory,
      })
      ctx.logger.info(`First MoE4All setup: selected engine ${installed.tag}.`)
    }).catch((error: unknown) => {
      ctx.logger.error(error instanceof Error ? error : new Error(String(error)))
    })
  }

  ctx.inject(['webServer'], (routeCtx: Context) => {
    const webServer = (routeCtx as Context & { webServer: WebServer }).webServer
    const routes = makeEngineRoutes({
      controller: () => active?.controller,
      models: () => active?.provider.models ?? [],
      refreshModels: async () => { await active?.provider.refreshNow() },
      activateDefaultModel: async () => { await active?.provider.activateDefaultModel() },
      configuredExecutable: () => source().executable ?? '',
      pendingChanges: () => activeSignature !== configSignature(source()),
      prepareStart: () => {
        if (pluginUpdates.updating) throw new Error('Wait for the plugin update to finish before starting the Engine.')
        return applySettings()
      },
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
      const disposers = [...routes, ...makePluginUpdateRoutes(pluginUpdates)].map((route) => webServer.register(route))
      return () => { for (const dispose of disposers) dispose() }
    }, 'moe4all-engine: local control routes')
  })

  return async () => {
    disposed = true
    await pluginUpdates.dispose()
    stopSettingsWatch()
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
  effectiveLaunchMode,
  endpointFromConfig,
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
} from './engine-controller.js'
export { EngineReleaseManager, releaseFromTag, selectRelease } from './engine-release.js'
export type { EngineBootstrapResult, EngineInstallProgress, EngineInstallStage, EngineReleaseStatus, InstalledEngine, SelectedRelease } from './engine-release.js'
export { ENGINE_PATHS, isLoopbackRequest, makeEngineRoutes } from './host-routes.js'
export { ModelDownloadManager, RECOMMENDED_MODELS } from './model-download.js'
export type { ModelDownloadProgress, RecommendedModel, RecommendedModelKind } from './model-download.js'
export { discoverModels, ModelProviderBridge, providerProfile } from './model-provider.js'
export type { DiscoveredModel, ModelProviderConfig, ProviderSettingsLike } from './model-provider.js'
