import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { type EngineConfig } from './engine-controller.js';
export declare const name = "moe4all-engine";
export declare const inject: string[];
export interface Config extends EngineConfig {
}
export declare const Config: z<Schemastery.ObjectS<{
    mode: z<"connect" | "auto" | "managed", "connect" | "auto" | "managed">;
    endpoint: z<string, string>;
    executable: z<string, string>;
    arguments: z<string[], string[]>;
    workingDirectory: z<string, string>;
    apiKeyEnv: z<string, string>;
    allowRemoteEndpoint: z<boolean, boolean>;
    startupTimeoutMs: z<number, number>;
    healthTimeoutMs: z<number, number>;
    pollIntervalMs: z<number, number>;
    shutdownTimeoutMs: z<number, number>;
    stopOnUnload: z<boolean, boolean>;
    logOutput: z<boolean, boolean>;
}>, Schemastery.ObjectT<{
    mode: z<"connect" | "auto" | "managed", "connect" | "auto" | "managed">;
    endpoint: z<string, string>;
    executable: z<string, string>;
    arguments: z<string[], string[]>;
    workingDirectory: z<string, string>;
    apiKeyEnv: z<string, string>;
    allowRemoteEndpoint: z<boolean, boolean>;
    startupTimeoutMs: z<number, number>;
    healthTimeoutMs: z<number, number>;
    pollIntervalMs: z<number, number>;
    shutdownTimeoutMs: z<number, number>;
    stopOnUnload: z<boolean, boolean>;
    logOutput: z<boolean, boolean>;
}>>;
export declare function apply(ctx: Context, config: Config): () => Promise<void>;
declare const plugin: {
    name: string;
    inject: string[];
    Config: z<Schemastery.ObjectS<{
        mode: z<"connect" | "auto" | "managed", "connect" | "auto" | "managed">;
        endpoint: z<string, string>;
        executable: z<string, string>;
        arguments: z<string[], string[]>;
        workingDirectory: z<string, string>;
        apiKeyEnv: z<string, string>;
        allowRemoteEndpoint: z<boolean, boolean>;
        startupTimeoutMs: z<number, number>;
        healthTimeoutMs: z<number, number>;
        pollIntervalMs: z<number, number>;
        shutdownTimeoutMs: z<number, number>;
        stopOnUnload: z<boolean, boolean>;
        logOutput: z<boolean, boolean>;
    }>, Schemastery.ObjectT<{
        mode: z<"connect" | "auto" | "managed", "connect" | "auto" | "managed">;
        endpoint: z<string, string>;
        executable: z<string, string>;
        arguments: z<string[], string[]>;
        workingDirectory: z<string, string>;
        apiKeyEnv: z<string, string>;
        allowRemoteEndpoint: z<boolean, boolean>;
        startupTimeoutMs: z<number, number>;
        healthTimeoutMs: z<number, number>;
        pollIntervalMs: z<number, number>;
        shutdownTimeoutMs: z<number, number>;
        stopOnUnload: z<boolean, boolean>;
        logOutput: z<boolean, boolean>;
    }>>;
    apply: typeof apply;
};
export default plugin;
export { EngineController, probeHealth, resolveEngineExecutable, validateEndpoint } from './engine-controller.js';
export type { EngineConfig, EngineLogger, LaunchMode } from './engine-controller.js';
//# sourceMappingURL=index.d.ts.map