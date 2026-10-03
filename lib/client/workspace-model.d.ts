import type { Config } from '../index.js';
import type { LocalModelEntry, ModelFileKind } from '../model-files.js';
import type { RecommendedModel } from '../model-download.js';
export declare function editorFromConfig(config: Config): {
    config: Config;
    setup: import("./engine-setup.js").ParsedEngineArguments;
    context: string;
    maxTokens: string;
    extras: string[];
    extraText: string | undefined;
};
export type Editor = ReturnType<typeof editorFromConfig>;
export declare const equal: (left: unknown, right: unknown) => boolean;
export declare const fileName: (path: string) => string;
export declare const samePath: (left: string, right: string) => boolean;
export declare function normalizedModelDirectories(paths: readonly string[]): string[];
export declare function modelDirectoriesFromConfig(config: Pick<Config, 'modelDirectory' | 'modelDirectories' | 'modelDirectoriesConfigured'>): string[];
export declare function modelScanDirectories(config: Pick<Config, 'modelDirectory' | 'modelDirectories' | 'modelDirectoriesConfigured'>, fallback?: string): string[];
export declare const formatBytes: (value: number) => string;
export declare function argumentValue(args: string[], option: string): string;
export declare function setArgument(args: string[], option: string, value: string): string[];
export declare function composeEditor(editor: Editor): Config;
export declare function parseExtraArguments(text: string): string[];
export interface LibraryItem {
    id: string;
    family: string;
    kind: ModelFileKind;
    name: string;
    quantization: string;
    size: number;
    files: number;
    local?: LocalModelEntry;
    recommended?: RecommendedModel;
}
export declare function modelLibrary(locals: LocalModelEntry[], recommendations: RecommendedModel[]): LibraryItem[];
//# sourceMappingURL=workspace-model.d.ts.map