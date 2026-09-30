export type RuntimeRequestPhase = 'starting' | 'prefill' | 'decode';
export interface RuntimeRequestMetrics {
    id: number;
    phase: RuntimeRequestPhase;
    contextTokens: number;
    contextLimit: number;
    prefillTokens: number;
    prefillTotal: number;
    generatedTokens: number;
    prefillTps: number;
    decodeTps: number;
}
export interface EngineRuntimeMetrics {
    slots: number;
    active: number;
    queued: number;
    prefillTps: number;
    decodeTps: number;
    requests: RuntimeRequestMetrics[];
    updatedAt?: string;
}
export interface RuntimeActivity {
    fresh: boolean;
    active: boolean;
    prefill: boolean;
    decode: boolean;
    prefillTps: number;
    decodeTps: number;
    decodes: RuntimeRequestMetrics[];
}
export declare function runtimeActivity(metrics: EngineRuntimeMetrics | undefined, now?: number, staleAfterMs?: number): RuntimeActivity;
export declare function configuredSlots(arguments_: readonly string[]): number;
export declare class RuntimeMetricsTracker {
    readonly slots: number;
    private active;
    private queued;
    private prefillTps;
    private decodeTps;
    private updatedAt;
    private readonly requests;
    constructor(slots: number);
    reset(): void;
    ingest(line: string, now?: Date): void;
    snapshot(): EngineRuntimeMetrics;
}
//# sourceMappingURL=runtime-metrics.d.ts.map