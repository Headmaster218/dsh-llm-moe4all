import type { EngineControlStatus } from '../host-routes.js';
import type { EngineReleaseStatus, InstalledEngine } from '../engine-release.js';
import type { LocalModelFiles, SetupModelPaths } from '../model-files.js';
import type { ModelDownloadProgress, RecommendedModel } from '../model-download.js';
interface StartResponse {
    ok: boolean;
    status: EngineControlStatus;
}
interface ReleaseResponse extends EngineReleaseStatus {
    ok: boolean;
}
export interface ModelCatalogResponse {
    ok: boolean;
    models: RecommendedModel[];
    download: ModelDownloadProgress;
    capabilities: {
        nativeFilePicker: boolean;
    };
}
export declare function fetchEngineStatus(): Promise<EngineControlStatus>;
export declare function startEngine(force?: boolean): Promise<StartResponse>;
export declare function fetchReleaseStatus(force?: boolean): Promise<ReleaseResponse>;
export declare function installLatestEngine(): Promise<InstalledEngine>;
export declare function installLocalEngine(path: string): Promise<InstalledEngine>;
export declare function scanModelPath(path: string): Promise<LocalModelFiles>;
export declare function validateModelPaths(paths: SetupModelPaths): Promise<SetupModelPaths>;
export declare function pickModelFile(): Promise<string | undefined>;
export declare function fetchModelCatalog(): Promise<ModelCatalogResponse>;
export declare function fetchModelDownload(): Promise<ModelDownloadProgress>;
export declare function startModelDownload(modelId: string, directory: string): Promise<ModelDownloadProgress>;
export {};
//# sourceMappingURL=engine-api.d.ts.map