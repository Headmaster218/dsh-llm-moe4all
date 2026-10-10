import type { Config } from '../index.js';
import type { EngineControlStatus } from '../host-routes.js';
import type { SettingsStore } from './settings-store.js';
import type { Translate } from './workspace-ui.js';
export declare function RuntimeMetrics({ status, t }: {
    status: EngineControlStatus | null;
    t: Translate;
}): import("react").JSX.Element | null;
export declare function RuntimeStatusDock({ scope, t }: {
    scope: SettingsStore<Config>;
    t: Translate;
}): import("react").JSX.Element | null;
//# sourceMappingURL=RuntimeStatus.d.ts.map