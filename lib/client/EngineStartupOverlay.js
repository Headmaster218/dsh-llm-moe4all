import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useSyncExternalStore } from 'react';
import { fetchEngineStatus, startEngine } from './engine-api.js';
function ModalFrame({ title, children }) {
    return (_jsx("div", { className: "m4a-overlay", role: "presentation", children: _jsxs("section", { className: "m4a-overlay__dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "m4a-overlay-title", children: [_jsx("h2", { id: "m4a-overlay-title", className: "m4a-overlay__title", children: title }), children] }) }));
}
function formatBytes(bytes) {
    if (bytes < 1024 ** 2)
        return `${(bytes / 1024).toFixed(1)} KiB`;
    if (bytes < 1024 ** 3)
        return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
}
export function EngineStartupOverlay({ scope, t }) {
    const snapshot = useSyncExternalStore(listener => scope.subscribe(listener), () => scope.getSnapshot(), () => scope.getSnapshot());
    const [status, setStatus] = useState(null);
    const [busy, setBusy] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        let disposed = false;
        const poll = async () => {
            try {
                const next = await fetchEngineStatus();
                if (!disposed)
                    setStatus(next);
            }
            catch (cause) {
                if (!disposed)
                    setError(cause instanceof Error ? cause.message : String(cause));
            }
        };
        void poll();
        const timer = window.setInterval(() => { void poll(); }, 1500);
        return () => {
            disposed = true;
            window.clearInterval(timer);
        };
    }, []);
    const launch = async (force, remember = false) => {
        setBusy(true);
        setError('');
        try {
            const result = await startEngine(force);
            setStatus(result.status);
            if (result.ok && remember)
                await scope.set('mode', 'auto');
            if (result.ok)
                setDismissed(true);
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
        finally {
            setBusy(false);
        }
    };
    const config = snapshot.value;
    if (config === undefined || status === null || config.mode === 'connect')
        return null;
    if (status.phase === 'missing-executable' || status.phase === 'missing-arguments')
        return null;
    if (status.phase === 'starting' && !dismissed) {
        return (_jsxs(ModalFrame, { title: t('startupProgressTitle'), children: [_jsx("p", { className: "m4a-overlay__body", children: t('startupProgressBody') }), _jsxs("div", { className: "m4a-overlay__progress", children: [_jsx("progress", {}), _jsx("span", { children: status.message ?? t('startingNow') })] }), status.adjustedRamBudgetBytes === undefined ? null : (_jsxs("p", { className: "m4a-overlay__notice", children: [t('ramBudgetAdjusted'), " ", formatBytes(status.adjustedRamBudgetBytes)] })), _jsxs("div", { className: "m4a-overlay__startup-output", children: [_jsx("span", { className: "m4a-settings__label", children: t('startupOutput') }), _jsx("pre", { children: (status.startupLines ?? []).join('\n') || t('checkingEngine') })] })] }));
    }
    if ((status.phase === 'error' || status.phase === 'duplicate-process') && !dismissed) {
        return (_jsxs(ModalFrame, { title: t('startupFailedTitle'), children: [_jsx("p", { className: "m4a-overlay__error", children: status.message ?? error }), (status.startupLines?.length ?? 0) === 0 ? null : (_jsxs("div", { className: "m4a-overlay__startup-output", children: [_jsx("span", { className: "m4a-settings__label", children: t('startupOutput') }), _jsx("pre", { children: status.startupLines.join('\n') })] })), _jsxs("div", { className: "m4a-overlay__actions", children: [_jsx("button", { type: "button", className: "m4a-settings__button", disabled: busy, onClick: () => { setDismissed(true); }, children: t('notNow') }), _jsx("button", { type: "button", className: "m4a-settings__button m4a-settings__button--primary", disabled: busy, onClick: () => { void launch(false); }, children: busy ? t('startingNow') : t('retryStart') })] })] }));
    }
    if (status.phase === 'resource-warning' && !dismissed) {
        return (_jsxs(ModalFrame, { title: t('resourceWarningTitle'), children: [_jsx("p", { className: "m4a-overlay__body", children: t('resourceWarningBody') }), _jsx("ul", { className: "m4a-overlay__reasons", children: (status.reasons ?? []).map(reason => _jsx("li", { children: reason }, reason)) }), _jsxs("div", { className: "m4a-overlay__actions", children: [_jsx("button", { type: "button", className: "m4a-settings__button", disabled: busy, onClick: () => { setDismissed(true); }, children: t('notNow') }), _jsx("button", { type: "button", className: "m4a-settings__button m4a-settings__button--danger", disabled: busy, onClick: () => { void launch(true); }, children: busy ? t('startingNow') : t('startAnyway') })] })] }));
    }
    if (!dismissed && !status.ready && status.phase === 'offline' && config.mode !== 'auto') {
        return (_jsxs(ModalFrame, { title: t('startupPromptTitle'), children: [_jsx("p", { className: "m4a-overlay__body", children: t('startupPromptBody') }), _jsx("code", { className: "m4a-overlay__endpoint", children: status.endpoint }), error === '' ? null : _jsx("p", { className: "m4a-overlay__error", children: error }), _jsxs("div", { className: "m4a-overlay__actions m4a-overlay__actions--three", children: [_jsx("button", { type: "button", className: "m4a-settings__button", disabled: busy, onClick: () => { setDismissed(true); }, children: t('notNow') }), _jsx("button", { type: "button", className: "m4a-settings__button", disabled: busy, onClick: () => { void launch(false); }, children: t('startThisTime') }), _jsx("button", { type: "button", className: "m4a-settings__button m4a-settings__button--primary", disabled: busy, onClick: () => { void launch(false, true); }, children: busy ? t('startingNow') : t('startAndRemember') })] })] }));
    }
    return null;
}
//# sourceMappingURL=EngineStartupOverlay.js.map