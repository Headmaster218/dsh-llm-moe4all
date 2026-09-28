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
export declare function discoverLocalModelFiles(input: string): Promise<LocalModelFiles>;
export declare function validateSetupModelPaths(paths: SetupModelPaths): Promise<SetupModelPaths>;
//# sourceMappingURL=model-files.d.ts.map