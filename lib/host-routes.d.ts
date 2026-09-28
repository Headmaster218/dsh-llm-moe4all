import type { IncomingMessage } from 'node:http';
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver';
import type { EngineController, EngineRuntimeStatus } from './engine-controller.js';
import type { EngineReleaseManager } from './engine-release.js';
import type { ModelDownloadManager } from './model-download.js';
import type { DiscoveredModel } from './model-provider.js';
export declare const ENGINE_PATHS: {
    readonly status: "/api/moe4all/status";
    readonly start: "/api/moe4all/start";
    readonly stop: "/api/moe4all/stop";
    readonly release: "/api/moe4all/release";
    readonly install: "/api/moe4all/install";
    readonly cancelInstall: "/api/moe4all/install-cancel";
    readonly installLocal: "/api/moe4all/install-local";
    readonly deleteEngine: "/api/moe4all/engine-delete";
    readonly modelFiles: "/api/moe4all/model-files";
    readonly modelLibrary: "/api/moe4all/model-library";
    readonly validateModels: "/api/moe4all/validate-models";
    readonly pickModelFile: "/api/moe4all/pick-model-file";
    readonly modelCatalog: "/api/moe4all/model-catalog";
    readonly modelDownload: "/api/moe4all/model-download";
    readonly cancelModelDownload: "/api/moe4all/model-download-cancel";
};
export interface EngineControlStatus extends EngineRuntimeStatus {
    models: DiscoveredModel[];
    pendingChanges?: boolean;
}
export interface EngineRuntimeAccess {
    controller(): EngineController | undefined;
    models(): DiscoveredModel[];
    refreshModels(): Promise<void>;
    configuredExecutable(): string;
    pendingChanges?(): boolean;
    prepareStart?(): Promise<void>;
    stop?(): Promise<void>;
    releases: EngineReleaseManager;
    downloads: ModelDownloadManager;
}
export declare function isLoopbackRequest(request: IncomingMessage): boolean;
export declare function makeEngineRoutes(access: EngineRuntimeAccess): WebRoute[];
//# sourceMappingURL=host-routes.d.ts.map