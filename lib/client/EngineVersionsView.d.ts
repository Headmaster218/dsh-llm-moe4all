import type { InstalledEngine } from '../engine-release.js';
import { type Workspace } from './use-workspace.js';
import { type Translate } from './workspace-ui.js';
export declare function EngineVersionsView({ workspace: w, t, onDelete, }: {
    workspace: Workspace;
    t: Translate;
    onDelete(version: InstalledEngine): void;
}): import("react").JSX.Element;
//# sourceMappingURL=EngineVersionsView.d.ts.map