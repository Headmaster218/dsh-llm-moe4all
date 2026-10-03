import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Activity } from 'lucide-react';
import { runtimeActivity } from '../runtime-metrics.js';
import { fetchEngineStatus } from './engine-api.js';
function speed(value) {
    return `${value.toFixed(1)} tok/s`;
}
export function RuntimeMetrics({ status, t }) {
    const metrics = status?.metrics;
    if (!status?.ready || metrics === undefined)
        return null;
    const activity = runtimeActivity(metrics);
    return (_jsxs("div", { className: "m4a-metrics", role: "status", children: [_jsxs("div", { children: [_jsx("span", { children: t('runtimeSlots') }), _jsxs("strong", { children: [metrics.active, " / ", metrics.slots] })] }), _jsxs("div", { children: [_jsx("span", { children: t('realtimePrefill') }), _jsx("strong", { children: activity.prefill ? speed(activity.prefillTps) : '-' })] }), _jsxs("div", { children: [_jsx("span", { children: t('realtimeDecode') }), _jsx("strong", { children: activity.decode ? speed(activity.decodeTps) : '-' })] }), activity.decodes.map((request) => (_jsxs("div", { children: [_jsxs("span", { children: ["#", request.id, " Decode"] }), _jsx("strong", { children: speed(request.decodeTps) })] }, request.id)))] }));
}
export function RuntimeStatusDock({ scope, t }) {
    const settings = useSyncExternalStore((listener) => scope.subscribe(listener), () => scope.getSnapshot(), () => scope.getSnapshot());
    const [status, setStatus] = useState(null);
    const display = settings.value?.statusDisplay ?? 'hover';
    useEffect(() => {
        if (display === 'hidden')
            return;
        let disposed = false;
        let timer;
        const poll = async () => {
            try {
                const next = await fetchEngineStatus();
                if (!disposed)
                    setStatus(next);
            }
            catch {
                if (!disposed)
                    setStatus(null);
            }
            timer = setTimeout(() => { void poll(); }, 1200);
        };
        void poll();
        return () => { disposed = true; clearTimeout(timer); };
    }, [display]);
    if (display === 'hidden' || !status?.ready)
        return null;
    const metrics = status.metrics;
    const activity = runtimeActivity(metrics);
    return (_jsxs("div", { className: `m4a-live-status m4a-live-status--${display}`, tabIndex: 0, children: [_jsxs("div", { className: "m4a-live-summary", children: [_jsx(Activity, { size: 12 }), _jsx("strong", { children: t('runningStatus') }), _jsxs("span", { children: [metrics?.active ?? 0, "/", metrics?.slots ?? 0, " ", t('runtimeSlots')] }), activity.prefill && _jsxs("span", { children: ["Prefill ", speed(activity.prefillTps)] }), activity.decode && _jsxs("span", { children: ["Decode ", speed(activity.decodeTps)] })] }), _jsxs("div", { className: "m4a-live-details", children: [!activity.active && _jsx("span", { children: t('idleMetrics') }), activity.active && !activity.prefill && !activity.decode && _jsx("span", { children: t('startingStatus') }), activity.prefill && _jsxs("span", { children: ["Prefill ", speed(activity.prefillTps)] }), activity.decode && activity.decodes.length === 0 && _jsxs("span", { children: ["Decode ", speed(activity.decodeTps)] }), activity.decodes.map((request) => (_jsxs("span", { children: ["#", request.id, " ", speed(request.decodeTps)] }, request.id)))] })] }));
}
//# sourceMappingURL=RuntimeStatus.js.map