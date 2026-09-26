export type LaunchMode = 'connect' | 'auto' | 'managed';
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
    processNames?: string[];
    minimumFreeRamFraction?: number;
    minimumFreeVramFraction?: number;
    promptWhenBusy?: boolean;
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
export interface RunningProcess {
    name: string;
    pid: number;
}
export interface ResourceSnapshot {
    ramTotalBytes: number;
    ramAvailableBytes: number;
    vramTotalBytes: number;
    vramAvailableBytes: number;
    vramLive: boolean;
    device?: string;
    deviceName?: string;
}
export interface StartupPrompt {
    reasons: string[];
    resources?: ResourceSnapshot;
}
export interface EngineControllerDependencies {
    detectProcesses(processNames: string[]): Promise<RunningProcess[]>;
    probeResources(executable: string, config: EngineConfig): Promise<ResourceSnapshot>;
    confirmBusyStart(prompt: StartupPrompt): Promise<boolean>;
}
export declare const DEFAULT_CONFIG: {
    readonly mode: "connect";
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
    readonly processNames: ["infr.exe", "moe4all.exe", "infr", "moe4all"];
    readonly minimumFreeRamFraction: 0.5;
    readonly minimumFreeVramFraction: 0.5;
    readonly promptWhenBusy: true;
    readonly resourceProbeTimeoutMs: 10000;
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
export declare function endpointFromConfig(config: EngineConfig): string;
export declare function validateEndpoint(endpoint: string, allowRemoteEndpoint?: boolean): URL;
export declare function probeHealth(endpoint: URL, timeoutMs: number, apiKeyEnv?: string, parentSignal?: AbortSignal): Promise<boolean>;
export declare function resolveEngineExecutable(config: EngineConfig): Promise<string | undefined>;
export declare function parseTasklistCsv(output: string): RunningProcess[];
export declare function detectRunningEngines(processNames: string[]): Promise<RunningProcess[]>;
export declare function probeEngineResources(executable: string, config: EngineConfig): Promise<ResourceSnapshot>;
export declare function confirmBusyStartWithElectron(prompt: StartupPrompt): Promise<boolean>;
export declare class EngineController {
    private readonly logger;
    readonly config: ResolvedEngineConfig;
    readonly endpoint: URL;
    private readonly abort;
    private readonly dependencies;
    private child;
    private readers;
    private startPromise?;
    private stopping;
    constructor(config: EngineConfig, logger?: EngineLogger, dependencies?: Partial<EngineControllerDependencies>);
    ensureReady(): Promise<boolean>;
    private blocked;
    private processNames;
    private findExistingEngine;
    private resourcesAllowStart;
    private start;
    private launch;
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=engine-controller.d.ts.map