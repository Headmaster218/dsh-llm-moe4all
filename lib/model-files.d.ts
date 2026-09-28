export type ModelFileKind = 'main' | 'vision' | 'embedding' | 'mtp';
export interface LocalModelFiles {
    directory: string;
    selected?: string;
    main: string[];
    vision: string[];
    embedding: string[];
    mtp: string[];
}
export interface SetupModelPaths {
    main: string;
    vision?: string;
    embedding?: string;
    mtp?: string;
}
export interface LocalModelEntry {
    id: string;
    path: string;
    directory: string;
    kind: ModelFileKind;
    family: string;
    name: string;
    quantization: string;
    sizeBytes: number;
    fileCount: number;
}
export interface LocalModelLibrary {
    directory: string;
    models: LocalModelEntry[];
}
export declare function discoverModelLibrary(input: string, selectedPaths?: string[]): Promise<LocalModelLibrary>;
export declare function discoverLocalModelFiles(input: string): Promise<LocalModelFiles>;
export declare function validateSetupModelPaths(paths: SetupModelPaths): Promise<SetupModelPaths>;
//# sourceMappingURL=model-files.d.ts.map