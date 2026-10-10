import z from '@deepseek-ai/schemastery';
import { ApiKeyManager, DEFAULT_API_KEY_REF } from './api-key.js';
import { EngineController, endpointFromConfig, validateEndpoint } from './engine-controller.js';
import { EngineReleaseManager } from './engine-release.js';
import { makeEngineRoutes } from './host-routes.js';
import { ModelDownloadManager } from './model-download.js';
import { ModelProviderBridge } from './model-provider.js';
import { settingsNamespace } from './settings-compat.js';
export const name = 'moe4all-engine';
export const inject = ['settings', 'credentials'];
export const SETTINGS_NAMESPACE = settingsNamespace('moe4all-engine');
function editable(schema) {
    const optional = schema;
    return (typeof optional.volatile === 'function' ? optional.volatile() : schema);
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
});
function normalizedConfig(config) {
    return { ...config, apiKeyEnv: config.apiKeyEnv?.trim() || DEFAULT_API_KEY_REF };
}
export function resolvePluginConfig(config) {
    return Object.fromEntries(Object.entries(config).map(([key, value]) => [
        key,
        typeof value === 'object' && value !== null && 'get' in value && typeof value.get === 'function'
            ? value.get()
            : value,
    ]));
}
function startRuntime(ctx, settings, config, apiKeys, allowAutomatic = true) {
    const resolved = normalizedConfig(config);
    const controller = new EngineController(resolved, ctx.logger, {
        resolveApiKey: () => apiKeys.backendKey(resolved),
    });
    const provider = new ModelProviderBridge(settings, controller.endpoint, resolved, ctx.logger, () => apiKeys.clientKey(resolved), () => resolved.mode === 'connect' || controller.ownsProcess);
    const startup = controller.ensureReady(allowAutomatic).catch((error) => {
        ctx.logger.error(error instanceof Error ? error : new Error(String(error)));
        return false;
    });
    const discovery = provider.run().catch((error) => {
        ctx.logger.error(error instanceof Error ? error : new Error(String(error)));
    });
    void startup.then((ready) => ready ? provider.refreshNow() : undefined);
    return { controller, provider, startup, discovery };
}
async function stopRuntime(runtime, forceStop = false) {
    await runtime.provider.dispose();
    await runtime.controller.dispose(forceStop);
    await Promise.all([runtime.startup, runtime.discovery]);
}
function configSignature(config) {
    const { modelDirectory: _, modelDirectories: __, modelDirectoriesConfigured: ___, statusDisplay: ____, ...runtime } = config;
    return JSON.stringify(runtime);
}
export function apply(ctx, config) {
    const settings = ctx.settings;
    const credentials = ctx.credentials;
    const apiKeys = new ApiKeyManager(credentials);
    const releases = new EngineReleaseManager();
    const downloads = new ModelDownloadManager();
    const initialConfig = resolvePluginConfig(config);
    if (initialConfig.mode !== 'connect' && !initialConfig.executable?.trim()) {
        void releases.bootstrapLatest().then((result) => {
            if (result.started)
                ctx.logger.info('First MoE4All setup: downloading the latest official engine release.');
        }).catch((error) => {
            ctx.logger.error(error instanceof Error ? error : new Error(String(error)));
        });
    }
    let source = () => initialConfig;
    let active = startRuntime(ctx, settings, initialConfig, apiKeys);
    let activeSignature = configSignature(initialConfig);
    let activeConfig = initialConfig;
    let transition = Promise.resolve();
    let restartTimer;
    let disposed = false;
    const applySettings = (stopOwned = false) => {
        if (restartTimer !== undefined) {
            clearTimeout(restartTimer);
            restartTimer = undefined;
        }
        const run = transition.then(async () => {
            if (disposed)
                return;
            let next = source();
            let signature = configSignature(next);
            if (!stopOwned && signature === activeSignature)
                return;
            try {
                validateEndpoint(endpointFromConfig(next), next.allowRemoteEndpoint);
            }
            catch (error) {
                if (!stopOwned)
                    throw error;
                next = activeConfig;
                signature = activeSignature;
            }
            if (!stopOwned && (active?.controller.ownsProcess || active?.controller.isStarting))
                return;
            const previous = active;
            active = undefined;
            if (previous !== undefined)
                await stopRuntime(previous, stopOwned);
            if (disposed)
                return;
            active = startRuntime(ctx, settings, next, apiKeys, false);
            activeSignature = signature;
            activeConfig = next;
        });
        transition = run.catch(error => { ctx.logger.error(error instanceof Error ? error : new Error(String(error))); });
        return run;
    };
    const scheduleRestart = () => {
        if (restartTimer !== undefined)
            clearTimeout(restartTimer);
        restartTimer = setTimeout(() => {
            restartTimer = undefined;
            void applySettings().catch(() => { });
        }, 250);
    };
    let stopSettingsWatch = () => { };
    if (settings.register !== undefined) {
        const settingsScope = settings.register(SETTINGS_NAMESPACE, Config, { base: initialConfig });
        source = () => settingsScope.get();
        stopSettingsWatch = settingsScope.watch(scheduleRestart);
        scheduleRestart();
    }
    else if (settings.configure !== undefined) {
        source = () => resolvePluginConfig(config);
        const configure = settings.configure.bind(settings);
        ctx.effect(() => configure({ auto: false }, ctx.fiber), 'moe4all-engine: custom settings page');
        const on = ctx.on;
        on.call(ctx, 'loader/volatile-update', scheduleRestart);
    }
    ctx.inject(['webServer'], (routeCtx) => {
        const webServer = routeCtx.webServer;
        const routes = makeEngineRoutes({
            controller: () => active?.controller,
            models: () => active?.provider.models ?? [],
            refreshModels: async () => { await active?.provider.refreshNow(); },
            activateDefaultModel: async () => { await active?.provider.activateDefaultModel(); },
            configuredExecutable: () => source().executable ?? '',
            pendingChanges: () => activeSignature !== configSignature(source()),
            prepareStart: () => applySettings(),
            stop: async () => {
                if (!active?.controller.ownsProcess && !active?.controller.isStarting)
                    throw new Error('Only an engine started by this plugin can be stopped.');
                await applySettings(true);
            },
            apiKeys,
            config: source,
            releases,
            downloads,
        });
        routeCtx.effect(() => {
            const disposers = routes.map((route) => webServer.register(route));
            return () => { for (const dispose of disposers)
                dispose(); };
        }, 'moe4all-engine: local control routes');
    });
    return async () => {
        disposed = true;
        stopSettingsWatch();
        if (restartTimer !== undefined)
            clearTimeout(restartTimer);
        await transition;
        const current = active;
        active = undefined;
        if (current !== undefined)
            await stopRuntime(current);
    };
}
const plugin = { name, inject, Config, apply };
export default plugin;
export { EngineController, effectiveLaunchMode, endpointFromConfig, probeEngineResources, probeHealth, resolveEngineExecutable, validateEndpoint, } from './engine-controller.js';
export { EngineReleaseManager, releaseFromTag, selectRelease } from './engine-release.js';
export { ENGINE_PATHS, isLoopbackRequest, makeEngineRoutes } from './host-routes.js';
export { ModelDownloadManager, RECOMMENDED_MODELS } from './model-download.js';
export { discoverModels, ModelProviderBridge, providerProfile } from './model-provider.js';
//# sourceMappingURL=index.js.map