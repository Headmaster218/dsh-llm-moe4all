import { type EngineRuntimeMetrics } from './runtime-metrics.js';
export { endpointFromConfig, validateEndpoint } from './connection.js';
export type LaunchMode = 'connect' | 'prompt' | 'auto' | 'managed';
export type EffectiveLaunchMode = Exclude<LaunchMode, 'managed'>;
export type EnginePhase = 'checking' | 'ready' | 'offline' | 'starting' | 'resource-warning' | 'missing-executable' | 'missing-arguments' | 'port-conflict' | 'error';
export interface EngineConfig {
    mode?: LaunchMode;
    protocol?: 'http' | 'https';
    host?: string;
    port?: number;
    apiBasePath?: string;
    /** Advanced compatibility override. When set, it wins over protocol, host, port and apiBasePath. */
    endpoint?: string;
    executable?: string;
    arguments?: string[];
    workingDirectory?: string;
    apiKeyEnv?: string;
    allowRemoteEndpoint?: boolean;
    minimumFreeRamFraction?: number;
    minimumFreeVramFraction?: number;
    resourceProbeTimeoutMs?: number;
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
export interface ResourceSnapshot {
    ramTotalBytes: number;
    ramAvailableBytes: number;
    commitTotalBytes?: number;
    commitAvailableBytes?: number;
    vramTotalBytes: number;
    vramAvailableBytes: number;
    vramLive: boolean;
    compatibilityFallback?: boolean;
    device?: string;
    deviceName?: string;
}
export interface StartupPrompt {
    reasons: string[];
    resources?: ResourceSnapshot;
}
export interface EngineRuntimeStatus {
    owned?: boolean;
    phase: EnginePhase;
    endpoint: string;
    mode: EffectiveLaunchMode;
    ready: boolean;
    canStart: boolean;
    executable?: string;
    message?: string;
    reasons?: string[];
    resources?: ResourceSnapshot;
    suggestedPort?: number;
    startupStartedAt?: string;
    startupLines?: string[];
    metrics?: EngineRuntimeMetrics;
}
export interface EngineStartResult {
    ok: boolean;
    status: EngineRuntimeStatus;
}
export interface EngineControllerDependencies {
    probeResources(executable: string, config: EngineConfig): Promise<ResourceSnapshot>;
    resolveApiKey(): Promise<string | undefined>;
}
export declare const DEFAULT_CONFIG: {
    readonly mode: "prompt";
    readonly protocol: "http";
    readonly host: "127.0.0.1";
    readonly port: 8080;
    readonly apiBasePath: "/v1";
    readonly endpoint: "";
    readonly executable: "";
    readonly arguments: [];
    readonly workingDirectory: "";
    readonly apiKeyEnv: "";
    readonly allowRemoteEndpoint: false;
    readonly minimumFreeRamFraction: 0.5;
    readonly minimumFreeVramFraction: 0.5;
    readonly resourceProbeTimeoutMs: 10000;
    readonly startupTimeoutMs: 120000;
    readonly healthTimeoutMs: 2000;
    readonly pollIntervalMs: 500;
    readonly shutdownTimeoutMs: 5000;
    readonly stopOnUnload: true;
    readonly logOutput: true;
};
export declare function runtimeLogFilter(value: string | undefined): string | undefined;
type ResolvedEngineConfig = {
    [Key in keyof Required<EngineConfig>]: Required<EngineConfig>[Key];
};
export declare function effectiveLaunchMode(mode: LaunchMode | undefined): EffectiveLaunchMode;
export declare function probeHealth(endpoint: URL, timeoutMs: number, apiKeyEnv?: string, parentSignal?: AbortSignal): Promise<boolean>;
export declare function resolveEngineExecutable(config: EngineConfig): Promise<string | undefined>;
export declare function probeEngineResources(executable: string, config: EngineConfig): Promise<ResourceSnapshot>;
export declare class EngineController {
    private readonly logger;
    readonly config: ResolvedEngineConfig;
    readonly endpoint: URL;
    private readonly abort;
    private readonly dependencies;
    private child;
    private readers;
    private initialPromise?;
    private startPromise;
    private stopping;
    private currentStatus;
    private startupStartedAt;
    private startupLines;
    private readonly runtimeMetrics;
    constructor(config: EngineConfig, logger?: EngineLogger, dependencies?: Partial<EngineControllerDependencies>);
    statusSnapshot(): EngineRuntimeStatus;
    get ownsProcess(): boolean;
    get isStarting(): boolean;
    private get bindHost();
    private get bindPort();
    private portConflict;
    refreshStatus(): Promise<EngineRuntimeStatus>;
    ensureReady(allowAutomatic?: boolean): Promise<boolean>;
    requestStart(force?: boolean): Promise<EngineStartResult>;
    private initialize;
    private setStatus;
    private startupDetails;
    private appendStartupLine;
    private resourceAssessment;
    private start;
    private launch;
    dispose(forceStop?: boolean): Promise<void>;
}
//# sourceMappingURL=engine-controller.d.ts.map