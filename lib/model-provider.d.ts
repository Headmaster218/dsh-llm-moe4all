import type { EngineLogger } from './engine-controller.js';
export interface ModelProviderConfig {
    apiKeyEnv?: string;
    contextWindow?: number;
    maxTokens?: number;
    vision?: boolean;
    excludeModelNameContains?: string[];
    modelRefreshIntervalMs?: number;
    modelDiscoveryTimeoutMs?: number;
}
export interface DiscoveredModel {
    id: string;
    name: string;
}
interface FiberLike {
    update(config: unknown, noSave?: boolean): void | Promise<void>;
    await?(): Promise<unknown>;
}
interface LoaderEntryLike {
    options: {
        config?: unknown;
    };
    fiber?: FiberLike;
}
export interface LoaderLike {
    resolve(id: string): LoaderEntryLike;
}
interface ProviderProfile {
    displayName: string;
    api: 'openai-completions';
    baseURL: string;
    apiKeyEnv?: string;
    defaultContextWindow: number;
    defaultMaxTokens: number;
    defaultInput: ('text' | 'image')[];
    models: Array<{
        id: string;
        name: string;
        contextWindow: number;
        maxTokens: number;
        input: ('text' | 'image')[];
        reasoningEfforts: false;
    }>;
}
export declare function discoverModels(endpoint: URL, config?: ModelProviderConfig, parentSignal?: AbortSignal): Promise<DiscoveredModel[]>;
export declare function providerProfile(endpoint: URL, models: DiscoveredModel[], config?: ModelProviderConfig): ProviderProfile;
export declare class ModelProviderBridge {
    private readonly loader;
    private readonly endpoint;
    private readonly config;
    private readonly logger;
    private readonly abort;
    private entry?;
    private originalConfig;
    private signature;
    private lastError;
    private syncInFlight;
    private didUpdate;
    constructor(loader: LoaderLike, endpoint: URL, config: ModelProviderConfig, logger: EngineLogger);
    run(): Promise<void>;
    private syncOnce;
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=model-provider.d.ts.map