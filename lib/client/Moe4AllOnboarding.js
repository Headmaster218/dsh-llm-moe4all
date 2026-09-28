import { useEffect, useSyncExternalStore } from 'react';
export function Moe4AllOnboarding({ scope, complete, openSection }) {
    const snapshot = useSyncExternalStore(listener => scope.subscribe(listener), () => scope.getSnapshot(), () => scope.getSnapshot());
    const config = snapshot.value;
    const needsSetup = config !== undefined
        && config.mode !== 'connect'
        && (config.executable?.trim() === '' || (config.arguments?.length ?? 0) === 0);
    useEffect(() => {
        if (config === undefined)
            return;
        if (needsSetup)
            openSection('moe4all');
        complete();
    }, [complete, config, needsSetup, openSection]);
    return null;
}
//# sourceMappingURL=Moe4AllOnboarding.js.map