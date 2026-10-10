import type { PluginUpdateOperation, PluginUpdateStatus } from './client/plugin-update.js';
export declare const PLUGIN_NAME = "dsh-llm-moe4all";
export declare const PLUGIN_UPDATE_SCHEMA = "moe4all/plugin-update/v1";
export declare const PLUGIN_UPDATE_PATH = "/api/moe4all/plugin-update";
interface Release {
    version: string;
    archiveUrl: string;
    checksumUrl: string;
    size: number;
}
export type PluginCommand = (args: string[], signal: AbortSignal, log: (line: string) => void) => Promise<void>;
export interface PluginUpdateTarget {
    profileDirectory: string;
    run: PluginCommand;
    dshVersion?: string;
}
interface UpdateOptions {
    target: () => PluginUpdateTarget | undefined;
    busy?: () => boolean;
    fetch?: (input: string | URL, init?: RequestInit) => Promise<Response>;
    runningVersion?: string;
}
export interface ReleaseUpdateStatus extends PluginUpdateStatus {
    supported: boolean;
    reason: string | null;
    releaseUrl: string;
    operation: PluginUpdateOperation | null;
}
export declare function selectPluginRelease(value: unknown): Release;
export declare function validatePluginArchive(file: string, version: string, dshVersion?: string): Promise<void>;
export declare class PluginReleaseUpdater {
    private readonly options;
    private readonly fetcher;
    private readonly runningVersion;
    private checkedAt;
    private candidate;
    private operation;
    private abort;
    private job;
    constructor(options: UpdateOptions);
    private installation;
    status(): Promise<ReleaseUpdateStatus>;
    private response;
    private bytes;
    check(force?: boolean): Promise<ReleaseUpdateStatus>;
    start(): Promise<PluginUpdateOperation>;
    cancel(): void;
    get updating(): boolean;
    private progress;
    private runInstaller;
    private install;
    dispose(): Promise<void>;
}
export interface DesktopPluginInstaller {
    runPlugin(args: readonly string[], cwd: string, signal?: AbortSignal): {
        stdout: NodeJS.ReadableStream;
        stderr: NodeJS.ReadableStream;
        done: Promise<{
            exitCode: number | null;
        }>;
        cancel(): void;
    };
}
export declare function desktopPluginCommand(service: DesktopPluginInstaller, directory: string): PluginCommand;
export declare function cliPluginUpdateTarget(): PluginUpdateTarget | undefined;
export {};
//# sourceMappingURL=plugin-release-update.d.ts.map