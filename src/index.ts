import type { Context } from '@deepseek-ai/cordis'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'

import { EngineController, type EngineConfig } from './engine-controller.js'
import { ModelProviderBridge, type LoaderLike, type ModelProviderConfig } from './model-provider.js'

export const name = 'moe4all-engine'
export const inject = ['loader']
export const SETTINGS_NAMESPACE = settingsNamespace('moe4all-engine')

export interface Config extends EngineConfig, ModelProviderConfig {}

export const Config = z.object({
  mode: z.union(['connect', 'auto', 'managed']).default('connect'),
  protocol: z.union(['http', 'https']).default('http'),
  host: z.string().default('127.0.0.1'),
  port: z.number().step(1).min(1).max(65_535).default(8080),
  apiBasePath: z.string().default('/v1'),
  endpoint: z.string().default(''),
  executable: z.string().role('path').default(''),
  arguments: z.array(z.string()).default([]),
  workingDirectory: z.string().role('path').default(''),
  apiKeyEnv: z.string().default(''),
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
  contextWindow: z.number().step(1).min(1).default(262_144),
  maxTokens: z.number().step(1).min(1).default(102_400),
  vision: z.boolean().default(true),
  excludeModelNameContains: z.array(z.string()).default(['embed', 'embedding']),
  modelRefreshIntervalMs: z.number().step(1).min(1_000).default(15_000),
  modelDiscoveryTimeoutMs: z.number().step(1).min(100).default(3_000),
})

interface ActiveRuntime {
  controller: EngineController
  provider: ModelProviderBridge
  startup: Promise<boolean>
  discovery: Promise<void>
}

function startRuntime(ctx: Context, loader: LoaderLike, config: Config): ActiveRuntime {
  const controller = new EngineController(config, ctx.logger)
  const provider = new ModelProviderBridge(loader, controller.endpoint, config, ctx.logger)
  const startup = controller.ensureReady().catch((error: unknown) => {
    ctx.logger.error(error instanceof Error ? error : new Error(String(error)))
    return false
  })
  const discovery = startup.then(() => provider.run()).catch((error: unknown) => {
    ctx.logger.error(error instanceof Error ? error : new Error(String(error)))
  })
  return { controller, provider, startup, discovery }
}

async function stopRuntime(runtime: ActiveRuntime): Promise<void> {
  await runtime.provider.dispose()
  await runtime.controller.dispose()
  await Promise.all([runtime.startup, runtime.discovery])
}

function configSignature(config: Config): string {
  return JSON.stringify(config)
}

export function apply(ctx: Context, config: Config): () => Promise<void> {
  const loader = (ctx as Context & { loader: LoaderLike }).loader
  let source = (): Config => config
  let active: ActiveRuntime | undefined = startRuntime(ctx, loader, config)
  let activeSignature = configSignature(config)
  let transition = Promise.resolve()
  let restartTimer: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  const scheduleRestart = (): void => {
    if (restartTimer !== undefined) clearTimeout(restartTimer)
    restartTimer = setTimeout(() => {
      restartTimer = undefined
      const next = source()
      const nextSignature = configSignature(next)
      if (disposed || nextSignature === activeSignature) return
      transition = transition.then(async () => {
        if (disposed) return
        const previous = active
        active = undefined
        if (previous !== undefined) await stopRuntime(previous)
        if (disposed) return
        active = startRuntime(ctx, loader, next)
        activeSignature = nextSignature
      }).catch((error: unknown) => {
        ctx.logger.error(error instanceof Error ? error : new Error(String(error)))
      })
    }, 250)
  }

  installSettingsSection(ctx, SETTINGS_NAMESPACE, Config, config, {
    setSource(current) {
      source = current
    },
    onChange: scheduleRestart,
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
  endpointFromConfig,
  parseTasklistCsv,
  probeEngineResources,
  probeHealth,
  resolveEngineExecutable,
  validateEndpoint,
} from './engine-controller.js'
export type {
  EngineConfig,
  EngineLogger,
  LaunchMode,
  ResourceSnapshot,
  RunningProcess,
} from './engine-controller.js'
export { discoverModels, ModelProviderBridge, providerProfile } from './model-provider.js'
export type { DiscoveredModel, LoaderLike, ModelProviderConfig } from './model-provider.js'
