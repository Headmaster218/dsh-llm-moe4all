import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { X } from 'lucide-react';
import { StandaloneMoe4AllSettings } from './Moe4AllSettings.js';
import { IconButton } from './workspace-ui.js';
export function needsFirstRunSetup(config) {
    return config !== undefined
        && config.mode !== 'connect'
        && ((config.executable ?? '').trim() === '' || (config.arguments?.length ?? 0) === 0);
}
export function FirstRunSettingsOverlay({ scope, t, pickDirectory, save, }) {
    const snapshot = useSyncExternalStore(listener => scope.subscribe(listener), () => scope.getSnapshot(), () => scope.getSnapshot());
    const dialog = useRef(null);
    const [dismissed, setDismissed] = useState(false);
    const needsSetup = needsFirstRunSetup(snapshot.value);
    useEffect(() => {
        const element = dialog.current;
        if (!element || dismissed || !needsSetup)
            return;
        element.showModal();
        return () => element.close();
    }, [dismissed, needsSetup]);
    if (!needsSetup || dismissed)
        return null;
    return (_jsx("dialog", { ref: dialog, className: "m4a-first-run-dialog", "aria-label": "MoE4All", onCancel: (event) => {
            event.preventDefault();
            setDismissed(true);
        }, onClick: (event) => {
            if (event.target === event.currentTarget)
                setDismissed(true);
        }, children: _jsxs("div", { className: "m4a-first-run-frame", children: [_jsx("div", { className: "m4a-first-run-close", children: _jsx(IconButton, { icon: X, label: t('notNow'), onClick: () => setDismissed(true) }) }), _jsx(StandaloneMoe4AllSettings, { scope: scope, t: t, pickDirectory: pickDirectory, save: save, close: () => setDismissed(true) })] }) }));
}
//# sourceMappingURL=Moe4AllOnboarding.js.map