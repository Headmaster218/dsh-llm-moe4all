export declare const PLUGIN_PACKAGE_NAME = "dsh-llm-moe4all";
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
    private capabilities;
    constructor(fetcher?: FetchLike, delay?: (milliseconds: number) => Promise<void>);
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
export {};
//# sourceMappingURL=plugin-update.d.ts.map