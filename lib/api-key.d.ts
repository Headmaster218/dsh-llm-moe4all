import { type CredentialProvider, type CredentialRef } from '@deepseek-ai/dsh-credentials';
import type { EngineConfig } from './engine-controller.js';
export declare const DEFAULT_API_KEY_REF = "MOE4ALL_API_KEY";
export declare const LOOPBACK_API_KEY = "moe4all-local";
export interface ApiKeyStatus {
    ref: string;
    value: string;
    required: boolean;
}
export declare function apiKeyRef(config: EngineConfig): CredentialRef;
export declare function apiKeyRequired(config: EngineConfig): boolean;
export declare class ApiKeyManager {
    private readonly credentials;
    constructor(credentials: CredentialProvider);
    ensure(config: EngineConfig): Promise<ApiKeyStatus>;
    set(config: EngineConfig, value: string): Promise<ApiKeyStatus>;
    regenerate(config: EngineConfig): Promise<ApiKeyStatus>;
    clientKey(config: EngineConfig): Promise<string>;
    backendKey(config: EngineConfig): Promise<string | undefined>;
}
//# sourceMappingURL=api-key.d.ts.map