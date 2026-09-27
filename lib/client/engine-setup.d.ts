export type EngineAutoProfile = 'conservative' | 'aggressive';
export interface EngineSetupValues {
    model: string;
    host: string;
    port: number;
    contextWindow: number;
    parallel: number;
    profile: EngineAutoProfile;
    mtp: boolean;
}
export declare function buildEngineArguments(values: EngineSetupValues): string[];
//# sourceMappingURL=engine-setup.d.ts.map