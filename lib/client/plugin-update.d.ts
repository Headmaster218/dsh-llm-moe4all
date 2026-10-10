export declare const PLUGIN_PACKAGE_NAME = "dsh-llm-moe4all";
export declare const CHECK_PLUGIN_UPDATE_EVENT = "moe4all-check-plugin-update";
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export interface MarketUpdateCapabilities {
    endpoints: {
        updates: string;
        operations: string;
        restart: string;
    };
    restartSupported: boolean;
}
export interface PluginUpdateStatus {
    source: string;
    installedVersion: string | null;
    latestVersion: string | null;
    updateAvailable: boolean;
}
export interface PluginUpdateOperation {
    operationId: string;
    state: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'rolled-back';
    installedVersion: string | null;
    progress: {
        phase: string | null;
        percent: number | null;
        detail: string | null;
    };
    outcome: {
        refreshRequired: boolean;
        restartRequired: boolean;
    };
    failure: {
        message: string;
        retryable: boolean;
    } | null;
}
export declare class MarketPluginUpdateApi {
    private readonly fetcher;
    private readonly delay;
    private readonly requestTimeoutMilliseconds;
    private capabilities;
    constructor(fetcher?: FetchLike, delay?: (milliseconds: number) => Promise<void>, requestTimeoutMilliseconds?: number);
    private request;
    private json;
    discover(): Promise<MarketUpdateCapabilities | null>;
    private ready;
    check(force?: boolean): Promise<PluginUpdateStatus>;
    start(): Promise<PluginUpdateOperation>;
    operation(operationId: string): Promise<PluginUpdateOperation>;
    waitForCompletion(operationId: string, onProgress: (operation: PluginUpdateOperation) => void, timeoutMilliseconds?: number): Promise<PluginUpdateOperation>;
    restart(): Promise<void>;
}
export declare function compactUpdateVersion(value: string | null): string;
/** A local archive has its own release source; never migrate a Market/source install silently. */
export declare class PluginUpdateApi {
    private readonly fetcher;
    private readonly market;
    private local;
    constructor(fetcher?: FetchLike);
    private localJson;
    discover(): Promise<MarketUpdateCapabilities | null>;
    check(force?: boolean): Promise<PluginUpdateStatus>;
    start(): Promise<PluginUpdateOperation>;
    operation(id: string): Promise<PluginUpdateOperation>;
    waitForCompletion(id: string, progress: (operation: PluginUpdateOperation) => void): Promise<PluginUpdateOperation>;
    cancel(): Promise<void>;
    restart(): Promise<void>;
}
export {};
//# sourceMappingURL=plugin-update.d.ts.map