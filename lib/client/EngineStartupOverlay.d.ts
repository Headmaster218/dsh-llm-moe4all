import type { ReactNode } from 'react';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import type { Config } from '../index.js';
import type { Moe4AllLocaleKey } from './locales.js';
type Translate = (key: Moe4AllLocaleKey) => string;
interface Props {
    scope: SettingsScope<Config>;
    t: Translate;
    pickDirectory(): Promise<string | null>;
}
export declare function EngineStartupOverlay({ scope, t, pickDirectory }: Props): ReactNode;
export {};
//# sourceMappingURL=EngineStartupOverlay.d.ts.map