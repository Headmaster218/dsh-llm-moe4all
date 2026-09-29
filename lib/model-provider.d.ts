import { settingsNamespace, type SettingsPathOp } from '@deepseek-ai/dsh-settings';
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
export interface ProviderSettingsLike {
    get(namespace: ReturnType<typeof settingsNamespace>): unknown;
    mutate(namespace: ReturnType<typeof settingsNamespace>, operations: readonly SettingsPathOp[]): Promise<void>;
}
interface ProviderModelProfile {
    id: string;
    name: string;
    contextWindow: number;
    maxTokens: number;
    input: ('text' | 'image')[];
    reasoningEfforts: false | Record<string, string>;
    compat: {
        supportsDeveloperRole: false;
    };
}
interface ProviderProfile {
    displayName: string;
    api: 'openai-completions';
    baseURL: string;
    apiKeyEnv?: string;
    defaultContextWindow: number;
    defaultMaxTokens: number;
    defaultInput: ('text' | 'image')[];
    compat: {
        supportsDeveloperRole: false;
    };
    models: ProviderModelProfile[];
}
export declare function discoverModels(endpoint: URL, config?: ModelProviderConfig, parentSignal?: AbortSignal): Promise<DiscoveredModel[]>;
export declare function providerProfile(endpoint: URL, models: DiscoveredModel[], config?: ModelProviderConfig): ProviderProfile;
export declare class ModelProviderBridge {
    private readonly settings;
    private readonly endpoint;
    private readonly config;
    private readonly logger;
    private readonly abort;
    private signature;
    private lastError;
    private syncInFlight;
    private discovered;
    constructor(settings: ProviderSettingsLike, endpoint: URL, config: ModelProviderConfig, logger: EngineLogger);
    run(): Promise<void>;
    get models(): DiscoveredModel[];
    refreshNow(): Promise<void>;
    private syncOnce;
    activateDefaultModel(): Promise<void>;
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=model-provider.d.ts.map