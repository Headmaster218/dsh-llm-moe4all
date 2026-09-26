export type LaunchMode = 'connect' | 'auto' | 'managed';
export interface EngineConfig {
    mode?: LaunchMode;
    endpoint?: string;
    executable?: string;
    arguments?: string[];
    workingDirectory?: string;
    apiKeyEnv?: string;
    allowRemoteEndpoint?: boolean;
    startupTimeoutMs?: number;
    healthTimeoutMs?: number;
    pollIntervalMs?: number;
    shutdownTimeoutMs?: number;
    stopOnUnload?: boolean;
    logOutput?: boolean;
}
export interface EngineLogger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string | Error): void;
}
export declare const DEFAULT_CONFIG: {
    readonly mode: "auto";
    readonly endpoint: "http://127.0.0.1:1234/v1";
    readonly executable: "";
    readonly arguments: [];
    readonly workingDirectory: "";
    readonly apiKeyEnv: "";
    readonly allowRemoteEndpoint: false;
    readonly startupTimeoutMs: 120000;
    readonly healthTimeoutMs: 2000;
    readonly pollIntervalMs: 500;
    readonly shutdownTimeoutMs: 5000;
    readonly stopOnUnload: true;
    readonly logOutput: true;
};
type ResolvedEngineConfig = {
    [Key in keyof Required<EngineConfig>]: Required<EngineConfig>[Key];
};
export declare function validateEndpoint(endpoint: string, allowRemoteEndpoint?: boolean): URL;
export declare function probeHealth(endpoint: URL, timeoutMs: number, apiKeyEnv?: string, parentSignal?: AbortSignal): Promise<boolean>;
export declare function resolveEngineExecutable(config: EngineConfig): Promise<string | undefined>;
export declare class EngineController {
    private readonly logger;
    readonly config: ResolvedEngineConfig;
    readonly endpoint: URL;
    private readonly abort;
    private child;
    private readers;
    private startPromise?;
    private stopping;
    constructor(config: EngineConfig, logger?: EngineLogger);
    ensureReady(): Promise<boolean>;
    private start;
    private launch;
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=engine-controller.d.ts.map