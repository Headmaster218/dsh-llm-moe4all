import type { Config } from './index.js';
type DistributionConfig = Pick<Config, 'bundledDistribution' | 'bootstrapEngineOnStart' | 'mode' | 'executable'>;
export declare function allowsPluginSelfUpdate(config: DistributionConfig | undefined): boolean;
export declare function shouldBootstrapEngine(config: DistributionConfig): boolean;
export {};
//# sourceMappingURL=distribution-policy.d.ts.map