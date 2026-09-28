export type EngineAutoProfile = 'conservative' | 'aggressive';
export interface SessionCacheSetup {
    directory: string;
    maxSize: string;
    idleSeconds: number;
    ttlHours: number;
}
export interface EngineSetupValues {
    model: string;
    visionModel?: string;
    embeddingModel?: string;
    mtpModel?: string;
    embeddingIdleTimeout?: number;
    host: string;
    port: number;
    contextWindow: number;
    maxTokens: number;
    parallel: number;
    profile: EngineAutoProfile;
    mtp: boolean;
    sessionCache?: SessionCacheSetup;
}
export interface ParsedEngineArguments {
    model: string;
    visionModel: string;
    embeddingModel: string;
    mtpModel: string;
    embeddingIdleTimeout: number;
    parallel: number;
    profile: EngineAutoProfile;
    mtp: boolean;
    sessionCacheEnabled: boolean;
    sessionCache: SessionCacheSetup;
}
export declare function normalizeSetupPath(value: string): string;
export declare function parseEngineArguments(arguments_: string[]): ParsedEngineArguments;
export declare function buildEngineArguments(values: EngineSetupValues): string[];
//# sourceMappingURL=engine-setup.d.ts.map