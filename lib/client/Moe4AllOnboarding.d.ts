import type { ReactNode } from 'react';
import type { Config } from '../index.js';
import { type Moe4AllSettingsProps } from './Moe4AllSettings.js';
import type { SettingsStore } from './settings-store.js';
export declare function needsFirstRunSetup(config: Config | undefined): boolean;
export declare function FirstRunSettingsOverlay({ scope, t, pickDirectory, save, }: {
    scope: SettingsStore<Config>;
    t: Moe4AllSettingsProps['t'];
    pickDirectory(): Promise<string | null>;
    save(next: Config): Promise<void>;
}): ReactNode;
//# sourceMappingURL=Moe4AllOnboarding.d.ts.map