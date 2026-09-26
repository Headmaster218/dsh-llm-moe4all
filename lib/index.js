import z from '@deepseek-ai/schemastery';
import { EngineController } from './engine-controller.js';
export const name = 'moe4all-engine';
export const inject = [];
export const Config = z.object({
    mode: z.union(['connect', 'auto', 'managed']).default('auto'),
    endpoint: z.string().default('http://127.0.0.1:1234/v1'),
    executable: z.string().role('path').default(''),
    arguments: z.array(z.string()).default([]),
    workingDirectory: z.string().role('path').default(''),
    apiKeyEnv: z.string().default(''),
    allowRemoteEndpoint: z.boolean().default(false),
    startupTimeoutMs: z.number().step(1).min(1000).default(120_000),
    healthTimeoutMs: z.number().step(1).min(100).default(2_000),
    pollIntervalMs: z.number().step(1).min(50).default(500),
    shutdownTimeoutMs: z.number().step(1).min(100).default(5_000),
    stopOnUnload: z.boolean().default(true),
    logOutput: z.boolean().default(true),
});
export function apply(ctx, config) {
    const controller = new EngineController(config, ctx.logger);
    const startup = controller.ensureReady().catch((error) => {
        ctx.logger.error(error instanceof Error ? error : new Error(String(error)));
        return false;
    });
    return async () => {
        await controller.dispose();
        await startup;
    };
}
const plugin = { name, inject, Config, apply };
export default plugin;
export { EngineController, probeHealth, resolveEngineExecutable, validateEndpoint } from './engine-controller.js';
//# sourceMappingURL=index.js.map