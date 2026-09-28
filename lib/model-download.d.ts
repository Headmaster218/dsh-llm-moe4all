export type RecommendedModelKind = 'main' | 'vision' | 'embedding' | 'mtp';
export interface RecommendedModelFile {
    name: string;
    size: number;
    url: string;
}
export interface RecommendedModel {
    id: string;
    kind: RecommendedModelKind;
    family: string;
    name: string;
    architecture: string;
    quantization: string;
    folderName: string;
    totalBytes: number;
    files: RecommendedModelFile[];
    primaryFile: string;
    sourceUrl: string;
    supportsMtp: boolean;
    supportsVision: boolean;
}
export type ModelDownloadStage = 'idle' | 'downloading' | 'complete' | 'cancelled' | 'error';
export interface ModelDownloadProgress {
    stage: ModelDownloadStage;
    modelId?: string;
    directory?: string;
    outputDirectory?: string;
    selectedFile?: string;
    fileName?: string;
    fileIndex?: number;
    fileCount?: number;
    downloadedBytes: number;
    totalBytes?: number;
    percent?: number;
    error?: string;
}
export interface ModelDownloadDependencies {
    fetch(input: string | URL, init?: RequestInit): Promise<Response>;
}
export declare const RECOMMENDED_MODELS: RecommendedModel[];
export declare class ModelDownloadManager {
    private readonly dependencies;
    private readonly models;
    private current;
    private active;
    private abort;
    constructor(dependencies?: Partial<ModelDownloadDependencies>, models?: RecommendedModel[]);
    catalog(): RecommendedModel[];
    status(): ModelDownloadProgress;
    start(modelId: string, directory: string): ModelDownloadProgress;
    cancel(): ModelDownloadProgress;
    private download;
    private updateFile;
}
//# sourceMappingURL=model-download.d.ts.map