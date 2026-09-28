import type { ReactNode } from 'react';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { Config } from '../index.js';
interface Props extends PropsRuntime<'settings.onboarding'> {
    scope: SettingsScope<Config>;
}
export declare function Moe4AllOnboarding({ scope, complete, openSection }: Props): ReactNode;
export {};
//# sourceMappingURL=Moe4AllOnboarding.d.ts.map