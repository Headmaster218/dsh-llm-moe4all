import type { SettingsNamespace, SettingsPathOp } from '@deepseek-ai/dsh-settings';
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
    get?(namespace: SettingsNamespace): unknown;
    describe?(): readonly {
        ns: SettingsNamespace;
        value: unknown;
    }[];
    mutate(namespace: SettingsNamespace, operations: readonly SettingsPathOp[]): Promise<void>;
}
interface ProviderModelProfile {
    id: string;
    name: string;
    contextWindow: number;
    maxTokens: number;
    input: ('text' | 'image')[];
    reasoningEfforts: false | Record<string, string | null>;
    compat: {
        supportsDeveloperRole: false;
        thinkingFormat?: 'chat-template';
        chatTemplateKwargs?: {
            enable_thinking: {
                $var: 'thinking.enabled';
            };
            reasoning_effort: {
                $var: 'thinking.effort';
                omitWhenOff: true;
            };
        };
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
    reasoning?: 'medium';
    models: ProviderModelProfile[];
}
export declare function discoverModels(endpoint: URL, config?: ModelProviderConfig, parentSignal?: AbortSignal, apiKey?: string): Promise<DiscoveredModel[]>;
export declare function providerProfile(endpoint: URL, models: DiscoveredModel[], config?: ModelProviderConfig): ProviderProfile;
export declare class ModelProviderBridge {
    private readonly settings;
    private readonly endpoint;
    private readonly config;
    private readonly logger;
    private readonly resolveApiKey;
    private readonly enabled;
    private readonly abort;
    private signature;
    private lastError;
    private syncInFlight;
    private discovered;
    constructor(settings: ProviderSettingsLike, endpoint: URL, config: ModelProviderConfig, logger: EngineLogger, resolveApiKey?: () => Promise<string | undefined>, enabled?: () => boolean);
    run(): Promise<void>;
    get models(): DiscoveredModel[];
    refreshNow(): Promise<void>;
    private syncOnce;
    activateDefaultModel(): Promise<void>;
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=model-provider.d.ts.map