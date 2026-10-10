import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, RefreshCw, RotateCcw, Square, X } from 'lucide-react';
import { compactUpdateVersion, CHECK_PLUGIN_UPDATE_EVENT, PluginUpdateApi, } from './plugin-update.js';
function dismissedKey(status) {
    return `moe4all.plugin-update.dismissed:${status.latestVersion ?? 'unknown'}`;
}
function wasDismissed(status) {
    try {
        return sessionStorage.getItem(dismissedKey(status)) === '1';
    }
    catch {
        return false;
    }
}
function rememberDismissed(status) {
    try {
        sessionStorage.setItem(dismissedKey(status), '1');
    }
    catch {
        // Private browsing or a locked-down host may disable session storage.
    }
}
export function PluginUpdateNotice({ t }) {
    const api = useRef(new PluginUpdateApi());
    const busy = useRef(false);
    const [notice, setNotice] = useState(null);
    useEffect(() => {
        let active = true;
        const check = (force = false) => {
            if (busy.current)
                return;
            busy.current = true;
            const placeholder = {
                capabilities: { endpoints: { updates: '', operations: '', restart: '' }, restartSupported: false },
                status: { source: 'unknown', installedVersion: null, latestVersion: null, updateAvailable: false },
                operation: null, phase: 'checking', error: null,
            };
            if (force)
                setNotice(placeholder);
            void (async () => {
                try {
                    const capabilities = await api.current.discover();
                    if (capabilities === null)
                        throw new Error(t('pluginUpdateManual'));
                    const status = await api.current.check(force);
                    if (!active || (!force && (!status.updateAvailable || wasDismissed(status))))
                        return;
                    setNotice({ capabilities, status, operation: null, phase: status.updateAvailable ? 'available' : 'current', error: null });
                }
                catch (error) {
                    if (active && force)
                        setNotice({ ...placeholder, phase: 'failed', error: String(error) });
                }
                finally {
                    busy.current = false;
                }
            })();
        };
        const manualCheck = () => check(true);
        const timer = window.setTimeout(() => check(), 3500);
        const interval = window.setInterval(() => check(), 6 * 60 * 60_000);
        window.addEventListener(CHECK_PLUGIN_UPDATE_EVENT, manualCheck);
        return () => {
            active = false;
            window.clearTimeout(timer);
            window.clearInterval(interval);
            window.removeEventListener(CHECK_PLUGIN_UPDATE_EVENT, manualCheck);
        };
    }, []);
    if (notice === null)
        return null;
    const dismiss = () => {
        rememberDismissed(notice.status);
        setNotice(null);
    };
    const update = async () => {
        busy.current = true;
        setNotice(current => current === null ? null : { ...current, phase: 'updating', error: null });
        try {
            const started = await api.current.start();
            setNotice(current => current === null ? null : { ...current, operation: started });
            const finished = await api.current.waitForCompletion(started.operationId, operation => {
                setNotice(current => current === null ? null : { ...current, operation });
            });
            if (finished.state !== 'succeeded') {
                throw new Error(finished.failure?.message ?? t('pluginUpdateFailed'));
            }
            setNotice(current => current === null ? null : {
                ...current,
                operation: finished,
                phase: 'complete',
                error: null,
            });
        }
        catch (error) {
            setNotice(current => current === null ? null : {
                ...current,
                phase: 'failed',
                error: error instanceof Error ? error.message : String(error),
            });
        }
        finally {
            busy.current = false;
        }
    };
    const restart = async () => {
        try {
            await api.current.restart();
        }
        catch {
            // A successful restart may close the connection before the response arrives.
        }
    };
    const operation = notice.operation;
    const progress = operation?.progress.percent;
    const needsRestart = operation?.outcome.restartRequired === true;
    const needsRefresh = notice.phase === 'complete' && !needsRestart;
    const version = `${compactUpdateVersion(notice.status.installedVersion)} -> ${compactUpdateVersion(notice.status.latestVersion)}`;
    return (_jsxs("aside", { className: "m4a-plugin-update", "aria-live": "polite", "aria-label": t('pluginUpdateTitle'), children: [_jsxs("header", { children: [_jsx(Download, { size: 17 }), _jsx("strong", { children: notice.phase === 'complete' ? t('pluginUpdateComplete') : t('pluginUpdateTitle') }), _jsx("button", { className: "m4a-icon-btn", type: "button", disabled: notice.phase === 'updating' || notice.phase === 'checking', onClick: dismiss, title: t('dismiss'), "aria-label": t('dismiss'), children: _jsx(X, { size: 15 }) })] }), _jsx("p", { children: notice.phase === 'complete'
                    ? needsRestart ? t('pluginRestartRequired') : t('pluginRefreshRequired')
                    : t(notice.phase === 'failed' ? 'pluginUpdateFailed' : notice.phase === 'current' ? 'pluginNoUpdate' : notice.phase === 'checking' ? 'pluginChecking' : 'pluginUpdateAvailable') }), notice.status.latestVersion !== null && _jsx("code", { children: version }), notice.phase === 'updating' && (_jsxs("div", { className: "m4a-plugin-update-progress", children: [_jsx("progress", { max: 100, value: progress ?? undefined }), _jsx("span", { children: operation?.progress.detail ?? operation?.progress.phase ?? t('pluginUpdating') })] })), notice.error !== null && _jsx("p", { className: "m4a-plugin-update-error", children: notice.error }), _jsxs("footer", { children: [notice.phase === 'available' && (_jsxs("button", { className: "m4a-btn m4a-btn--primary", type: "button", onClick: () => void update(), children: [_jsx(Download, { size: 14 }), " ", t('pluginUpdateNow')] })), notice.phase === 'failed' && (_jsxs("button", { className: "m4a-btn", type: "button", onClick: () => notice.operation ? void update() : window.dispatchEvent(new Event(CHECK_PLUGIN_UPDATE_EVENT)), children: [_jsx(RotateCcw, { size: 14 }), " ", t('pluginUpdateRetry')] })), notice.phase === 'updating' && notice.status.source === 'github-release' && !['install', 'rollback'].includes(operation?.progress.phase ?? '') && (_jsxs("button", { className: "m4a-btn", type: "button", onClick: () => void api.current.cancel().catch(error => {
                            setNotice(current => current ? { ...current, error: String(error) } : null);
                        }), children: [_jsx(Square, { size: 14 }), " ", t('stopDownload')] })), _jsxs("a", { className: "m4a-btn", href: "https://github.com/Headmaster218/dsh-llm-moe4all/releases", target: "_blank", rel: "noreferrer", children: [_jsx(ExternalLink, { size: 14 }), " ", t('openReleasePage')] }), notice.phase === 'complete' && needsRestart && notice.capabilities.restartSupported && (_jsxs("button", { className: "m4a-btn m4a-btn--primary", type: "button", onClick: () => void restart(), children: [_jsx(RefreshCw, { size: 14 }), " ", t('restartDsh')] })), notice.phase === 'complete' && needsRefresh && (_jsxs("button", { className: "m4a-btn m4a-btn--primary", type: "button", onClick: () => window.location.reload(), children: [_jsx(RefreshCw, { size: 14 }), " ", t('refreshDsh')] }))] })] }));
}
//# sourceMappingURL=PluginUpdateNotice.js.map