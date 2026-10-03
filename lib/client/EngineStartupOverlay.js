import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { fetchEngineStatus, startEngine } from './engine-api.js';
import { Button, Dialog, Field, Toggle } from './workspace-ui.js';
export function EngineStartupOverlay({ scope, t }) {
    const snapshot = useSyncExternalStore((listener) => scope.subscribe(listener), () => scope.getSnapshot(), () => scope.getSnapshot());
    const [status, setStatus] = useState(null);
    const [busy, setBusy] = useState(false);
    const [remember, setRemember] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(document.documentElement.dataset.moe4allSettings === 'open');
    const [error, setError] = useState('');
    const [port, setPort] = useState('');
    useEffect(() => {
        let disposed = false;
        let timer;
        const poll = async () => {
            try {
                const next = await fetchEngineStatus();
                if (!disposed)
                    setStatus(next);
            }
            catch {
                /* The settings page exposes connection failures. */
            }
            if (!disposed)
                timer = setTimeout(() => {
                    void poll();
                }, 1500);
        };
        const visibility = () => {
            const open = document.documentElement.dataset.moe4allSettings === 'open';
            setSettingsOpen(open);
            if (open)
                setDismissed(true);
        };
        window.addEventListener('moe4all-settings-visibility', visibility);
        void poll();
        return () => {
            disposed = true;
            clearTimeout(timer);
            window.removeEventListener('moe4all-settings-visibility', visibility);
        };
    }, []);
    useEffect(() => {
        if (status?.phase === 'port-conflict' && status.suggestedPort !== undefined)
            setPort(String(status.suggestedPort));
    }, [status?.phase, status?.suggestedPort]);
    async function launch(force, selectedPort) {
        setBusy(true);
        setError('');
        try {
            if (selectedPort !== undefined) {
                await scope.set('endpoint', '');
                await scope.set('port', selectedPort);
            }
            const result = await startEngine(force);
            setStatus(result.status);
            if (result.ok) {
                if (remember)
                    await scope.set('mode', 'auto');
                setDismissed(true);
            }
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
        finally {
            setBusy(false);
        }
    }
    const config = snapshot.value;
    if (!config || !status || settingsOpen || dismissed || status.ready || config.mode === 'connect')
        return null;
    const phase = status.phase;
    if (!['offline', 'starting', 'error', 'port-conflict', 'resource-warning'].includes(phase))
        return null;
    if (phase === 'offline' && config.mode === 'auto')
        return null;
    const starting = phase === 'starting' || busy;
    const warning = phase === 'resource-warning';
    const conflict = phase === 'port-conflict';
    const failed = phase === 'error';
    const selectedPort = Number(port);
    const validPort = Number.isInteger(selectedPort) && selectedPort >= 1 && selectedPort <= 65_535;
    return (_jsxs(Dialog, { title: t(starting
            ? 'startupProgressTitle'
            : warning
                ? 'resourceWarningTitle'
                : conflict
                    ? 'portConflictTitle'
                    : failed
                        ? 'startupFailedTitle'
                        : 'startupPromptTitle'), closeLabel: t('notNow'), onClose: () => setDismissed(true), actions: _jsxs(_Fragment, { children: [_jsx(Button, { onClick: () => setDismissed(true), children: t('notNow') }), !starting && (_jsx(Button, { kind: warning ? 'danger' : 'primary', icon: failed ? RefreshCw : Play, disabled: conflict && !validPort, onClick: () => void launch(warning, conflict ? selectedPort : undefined), children: t(warning ? 'startAnyway' : conflict ? 'changePortAndStart' : failed ? 'retryStart' : 'startNow') }))] }), children: [_jsx("p", { children: t(warning ? 'resourceWarningBody' : conflict ? 'portConflictBody' : starting ? 'startupProgressBody' : 'startupPromptBody') }), _jsx("code", { children: status.endpoint }), warning && status.reasons?.map((reason) => _jsx("p", { children: reason }, reason)), conflict && (_jsx(Field, { label: t('availablePort'), children: _jsx("input", { type: "number", min: 1, max: 65_535, value: port, onChange: (event) => setPort(event.target.value) }) })), failed && _jsx("p", { role: "alert", children: status.message }), conflict && status.message && _jsx("p", { children: status.message }), starting && _jsx("progress", { "aria-label": t('startingStatus') }), (starting || failed) && (_jsx("pre", { className: "m4a-log m4a-log--preview", children: status.startupLines?.join('\n') || status.message || t('noOutput') })), !starting && !failed && (_jsx(Toggle, { checked: remember, onChange: setRemember, label: t('autoStart'), detail: t('resourcesHelp') })), error && _jsx("p", { role: "alert", children: error })] }));
}
//# sourceMappingURL=EngineStartupOverlay.js.map