export interface GitHubReleaseAsset {
    name: string;
    browser_download_url: string;
    size: number;
}
export interface GitHubRelease {
    tag_name: string;
    name?: string;
    html_url: string;
    published_at?: string;
    assets: GitHubReleaseAsset[];
}
export interface SelectedRelease {
    tag: string;
    name: string;
    pageUrl: string;
    publishedAt?: string;
    archive: GitHubReleaseAsset;
    checksum?: GitHubReleaseAsset;
}
export interface InstalledEngine {
    tag: string;
    name: string;
    executable: string;
    workingDirectory: string;
    installedAt: string;
    sourceUrl: string;
}
export type EngineInstallStage = 'idle' | 'checking' | 'downloading' | 'verifying' | 'extracting' | 'finalizing' | 'complete' | 'cancelled' | 'error';
export interface EngineInstallProgress {
    stage: EngineInstallStage;
    downloadedBytes: number;
    totalBytes?: number;
    percent?: number;
    message?: string;
    error?: string;
}
export interface EngineReleaseStatus {
    supported: boolean;
    managed: boolean;
    installed?: InstalledEngine;
    versions: InstalledEngine[];
    latest?: SelectedRelease;
    updateAvailable: boolean;
    install: EngineInstallProgress;
    message?: string;
}
export interface EngineReleaseDependencies {
    fetch(input: string | URL, init?: RequestInit): Promise<Response>;
    expandArchive(archive: string, destination: string, signal?: AbortSignal): Promise<void>;
}
export declare function selectRelease(release: GitHubRelease): SelectedRelease;
export declare function releaseFromTag(tag: string): SelectedRelease;
export declare class EngineReleaseManager {
    readonly root: string;
    private readonly dependencies;
    private latestCache?;
    private latestPromise;
    private installPromise;
    private installProgress;
    private installAbort;
    constructor(root?: string, dependencies?: Partial<EngineReleaseDependencies>);
    private get metadataPath();
    private setProgress;
    private progressSnapshot;
    latest(force?: boolean): Promise<SelectedRelease>;
    installed(): Promise<InstalledEngine | undefined>;
    versions(): Promise<InstalledEngine[]>;
    status(currentExecutable?: string, force?: boolean): Promise<EngineReleaseStatus>;
    installLatest(): Promise<InstalledEngine>;
    installFromLocal(input: string): Promise<InstalledEngine>;
    cancelInstall(): EngineInstallProgress;
    remove(tag: string, currentExecutable?: string): Promise<void>;
    private runInstall;
    private downloadArchive;
    private extractArchive;
    private finishInstall;
}
//# sourceMappingURL=engine-release.d.ts.map