import type { EngineControlStatus } from '../host-routes.js';
import type { ApiKeyStatus } from '../api-key.js';
import type { EngineInstallProgress, EngineReleaseStatus } from '../engine-release.js';
import type { LocalModelFiles, LocalModelLibrary, SetupModelPaths } from '../model-files.js';
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
    defaultDirectory: string;
}
export declare function fetchEngineStatus(): Promise<EngineControlStatus>;
export declare function startEngine(force?: boolean): Promise<StartResponse>;
export declare function stopEngine(): Promise<StartResponse>;
export declare function fetchApiKey(): Promise<ApiKeyStatus>;
export declare function updateApiKey(value: string): Promise<ApiKeyStatus>;
export declare function regenerateApiKey(): Promise<ApiKeyStatus>;
export declare function fetchReleaseStatus(force?: boolean): Promise<ReleaseResponse>;
export declare function installLatestEngine(): Promise<void>;
export declare function installLocalEngine(path: string): Promise<void>;
export declare function cancelEngineInstall(): Promise<EngineInstallProgress>;
export declare function deleteEngineVersion(tag: string): Promise<void>;
export declare function scanModelPath(path: string): Promise<LocalModelFiles>;
export declare function scanModelLibrary(directories: string[], selectedPaths: string[]): Promise<LocalModelLibrary>;
export declare function validateModelPaths(paths: SetupModelPaths): Promise<SetupModelPaths>;
export declare function pickModelFile(): Promise<string | undefined>;
export declare function fetchModelCatalog(): Promise<ModelCatalogResponse>;
export declare function fetchModelDownload(): Promise<ModelDownloadProgress>;
export declare function startModelDownload(modelId: string, directory: string): Promise<ModelDownloadProgress>;
export declare function cancelModelDownload(): Promise<ModelDownloadProgress>;
export {};
//# sourceMappingURL=engine-api.d.ts.map