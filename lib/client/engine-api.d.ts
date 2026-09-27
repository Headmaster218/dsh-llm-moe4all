import type { EngineControlStatus } from '../host-routes.js';
import type { EngineReleaseStatus, InstalledEngine } from '../engine-release.js';
interface StartResponse {
    ok: boolean;
    status: EngineControlStatus;
}
interface ReleaseResponse extends EngineReleaseStatus {
    ok: boolean;
}
export declare function fetchEngineStatus(): Promise<EngineControlStatus>;
export declare function startEngine(force?: boolean): Promise<StartResponse>;
export declare function fetchReleaseStatus(force?: boolean): Promise<ReleaseResponse>;
export declare function installLatestEngine(): Promise<InstalledEngine>;
export declare function installLocalEngine(path: string): Promise<InstalledEngine>;
export {};
//# sourceMappingURL=engine-api.d.ts.map