import type { ReactNode } from 'react';
import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client';
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { Config } from '../index.js';
export interface Moe4AllSettingsInjected {
    hooks: {
        moe4AllSettings: SettingsScope<Config>;
    };
    pickDirectory(): Promise<string | null>;
    save(next: Config): Promise<void>;
}
interface Moe4AllSettingsFace {
    pickDirectory(): Promise<string | null>;
    save(next: Config): Promise<void>;
    useMoe4AllSettings<S>(selector: (snapshot: SettingsScopeSnapshot<Config>) => S, equal?: (left: S, right: S) => boolean): S;
}
export type Moe4AllSettingsProps = PropsRuntime<'settings.section'> & PropsLocale<'settings.moe4all'> & Moe4AllSettingsFace;
export declare function Moe4AllSettings(props: Moe4AllSettingsProps): ReactNode;
export {};
//# sourceMappingURL=Moe4AllSettings.d.ts.map