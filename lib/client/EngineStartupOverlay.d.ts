import type { ReactNode } from 'react';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import type { Config } from '../index.js';
import type { Moe4AllLocaleKey } from './locales.js';
type Translate = (key: Moe4AllLocaleKey) => string;
interface Props {
    scope: SettingsScope<Config>;
    t: Translate;
}
export declare function EngineStartupOverlay({ scope, t }: Props): ReactNode;
export {};
//# sourceMappingURL=EngineStartupOverlay.d.ts.map