import type { ReactNode } from 'react';
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { Config } from '../index.js';
import type { SettingsStore, SettingsStoreSnapshot } from './settings-store.js';
export interface Moe4AllSettingsInjected {
    hooks: {
        moe4AllSettings: SettingsStore<Config>;
    };
    pickDirectory(): Promise<string | null>;
    save(next: Config): Promise<void>;
}
interface Moe4AllSettingsFace {
    pickDirectory(): Promise<string | null>;
    save(next: Config): Promise<void>;
    useMoe4AllSettings<S>(selector: (snapshot: SettingsStoreSnapshot<Config>) => S, equal?: (left: S, right: S) => boolean): S;
}
export type Moe4AllSettingsProps = {
    close(): void;
} & PropsLocale<'settings.moe4all'> & Moe4AllSettingsFace;
export declare function Moe4AllSettings(props: Moe4AllSettingsProps): ReactNode;
export declare function StandaloneMoe4AllSettings({ scope, t, pickDirectory, save, close, }: {
    scope: SettingsStore<Config>;
    t: Moe4AllSettingsProps['t'];
    pickDirectory(): Promise<string | null>;
    save(next: Config): Promise<void>;
    close(): void;
}): ReactNode;
export {};
//# sourceMappingURL=Moe4AllSettings.d.ts.map