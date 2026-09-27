import type { IncomingMessage } from 'node:http';
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver';
import type { EngineController, EngineRuntimeStatus } from './engine-controller.js';
import type { EngineReleaseManager } from './engine-release.js';
import type { DiscoveredModel } from './model-provider.js';
export declare const ENGINE_PATHS: {
    readonly status: "/api/moe4all/status";
    readonly start: "/api/moe4all/start";
    readonly release: "/api/moe4all/release";
    readonly install: "/api/moe4all/install";
    readonly installLocal: "/api/moe4all/install-local";
};
export interface EngineControlStatus extends EngineRuntimeStatus {
    models: DiscoveredModel[];
}
export interface EngineRuntimeAccess {
    controller(): EngineController | undefined;
    models(): DiscoveredModel[];
    refreshModels(): Promise<void>;
    configuredExecutable(): string;
    releases: EngineReleaseManager;
}
export declare function isLoopbackRequest(request: IncomingMessage): boolean;
export declare function makeEngineRoutes(access: EngineRuntimeAccess): WebRoute[];
//# sourceMappingURL=host-routes.d.ts.map