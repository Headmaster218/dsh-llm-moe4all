import type { ReactNode } from 'react';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { Config } from '../index.js';
export interface Moe4AllSettingsInjected {
    hooks: {
        moe4AllSettings: SettingsScope<Config>;
    };
    pickDirectory(): Promise<string | null>;
    save(next: Config): Promise<void>;
}
export type Moe4AllSettingsProps = PropsRuntime<'settings.section'> & PropsLocale<'settings.moe4all'> & InjectFace<Moe4AllSettingsInjected>;
export declare function Moe4AllSettings(props: Moe4AllSettingsProps): ReactNode;
//# sourceMappingURL=Moe4AllSettings.d.ts.map