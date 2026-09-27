import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
function same(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}
function lines(value) {
    return value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
}
function resolved(value) {
    return value;
}
function Field({ label, wide = false, hint, children }) {
    return (_jsxs("label", { className: `m4a-settings__field${wide ? ' m4a-settings__field--wide' : ''}`, children: [_jsx("span", { className: "m4a-settings__label", children: label }), children, hint === undefined ? null : _jsx("span", { className: "m4a-settings__hint", children: hint })] }));
}
function Check({ checked, disabled, label, onChange }) {
    return (_jsxs("label", { className: "m4a-settings__check", children: [_jsx("input", { type: "checkbox", checked: checked, disabled: disabled, onChange: event => { onChange(event.target.checked); } }), _jsx("span", { children: label })] }));
}
export function Moe4AllSettings(props) {
    const { t, useMoe4AllSettings, save } = props;
    const snapshot = useMoe4AllSettings(value => value);
    const [draft, setDraft] = useState(snapshot.value === undefined ? null : resolved(snapshot.value));
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (!saving && snapshot.value !== undefined)
            setDraft(resolved(snapshot.value));
    }, [saving, snapshot.revision, snapshot.value]);
    const current = snapshot.value === undefined ? null : resolved(snapshot.value);
    const dirty = draft !== null && current !== null && !same(draft, current);
    const endpoint = useMemo(() => {
        if (draft === null)
            return '';
        if (draft.endpoint.trim() !== '')
            return draft.endpoint.trim();
        const path = draft.apiBasePath.startsWith('/') ? draft.apiBasePath : `/${draft.apiBasePath}`;
        return `${draft.protocol}://${draft.host}:${draft.port}${path}`;
    }, [draft]);
    if (snapshot.status === 'loading' || draft === null) {
        return _jsx("p", { className: "m4a-settings__message", children: t('loading') });
    }
    if (snapshot.status === 'unavailable') {
        return _jsx("p", { className: "m4a-settings__message", children: t('unavailable') });
    }
    const disabled = saving || !snapshot.writable;
    const setField = (field, value) => {
        setDraft(previous => previous === null ? previous : { ...previous, [field]: value });
    };
    const numberField = (field, value) => {
        const parsed = Number(value);
        if (Number.isFinite(parsed))
            setField(field, parsed);
    };
    const submit = async () => {
        setSaving(true);
        try {
            await save(draft);
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: "m4a-settings", children: [_jsxs("header", { className: "m4a-settings__header", children: [_jsx("h2", { className: "m4a-settings__title", children: t('title') }), _jsx("p", { className: "m4a-settings__subtitle", children: t('subtitle') }), _jsxs("div", { className: "m4a-settings__status", children: [_jsx("span", { className: `m4a-settings__dot${dirty ? ' m4a-settings__dot--dirty' : ''}` }), _jsx("span", { children: !snapshot.writable ? t('readOnly') : dirty ? t('unsaved') : t('saved') }), _jsx("code", { className: "m4a-settings__endpoint", title: endpoint, children: endpoint })] })] }), _jsxs("section", { className: "m4a-settings__group", children: [_jsx("h3", { className: "m4a-settings__group-title", children: t('mode') }), _jsx("div", { className: "m4a-settings__segmented", role: "group", "aria-label": t('mode'), children: ['connect', 'auto', 'managed'].map(mode => (_jsx("button", { type: "button", className: "m4a-settings__segment", "aria-pressed": draft.mode === mode, disabled: disabled, onClick: () => { setField('mode', mode); }, children: t(mode) }, mode))) })] }), _jsxs("section", { className: "m4a-settings__group", children: [_jsx("h3", { className: "m4a-settings__group-title", children: t('connection') }), _jsxs("div", { className: "m4a-settings__grid", children: [_jsx(Field, { label: t('protocol'), children: _jsxs("select", { className: "m4a-settings__select", value: draft.protocol, disabled: disabled, onChange: event => { setField('protocol', event.target.value); }, children: [_jsx("option", { value: "http", children: "HTTP" }), _jsx("option", { value: "https", children: "HTTPS" })] }) }), _jsx(Field, { label: t('port'), children: _jsx("input", { className: "m4a-settings__input", type: "number", min: 1, max: 65535, value: draft.port, disabled: disabled, onChange: event => { numberField('port', event.target.value); } }) }), _jsx(Field, { label: t('host'), children: _jsx("input", { className: "m4a-settings__input", value: draft.host, disabled: disabled, spellCheck: false, onChange: event => { setField('host', event.target.value); } }) }), _jsx(Field, { label: t('apiBasePath'), children: _jsx("input", { className: "m4a-settings__input", value: draft.apiBasePath, disabled: disabled, spellCheck: false, onChange: event => { setField('apiBasePath', event.target.value); } }) }), _jsx(Field, { label: t('endpoint'), hint: t('endpointHint'), wide: true, children: _jsx("input", { className: "m4a-settings__input", value: draft.endpoint, disabled: disabled, spellCheck: false, placeholder: "http://127.0.0.1:8080/v1", onChange: event => { setField('endpoint', event.target.value); } }) }), _jsx(Field, { label: t('apiKeyEnv'), wide: true, children: _jsx("input", { className: "m4a-settings__input", value: draft.apiKeyEnv, disabled: disabled, spellCheck: false, placeholder: "MOE4ALL_API_KEY", onChange: event => { setField('apiKeyEnv', event.target.value); } }) })] }), _jsx(Check, { checked: draft.allowRemoteEndpoint, disabled: disabled, label: t('allowRemoteEndpoint'), onChange: value => { setField('allowRemoteEndpoint', value); } })] }), draft.mode === 'connect' ? null : (_jsxs("section", { className: "m4a-settings__group", children: [_jsx("h3", { className: "m4a-settings__group-title", children: t('startup') }), _jsxs("div", { className: "m4a-settings__grid", children: [_jsx(Field, { label: t('executable'), wide: true, children: _jsx("input", { className: "m4a-settings__input", value: draft.executable, disabled: disabled, spellCheck: false, onChange: event => { setField('executable', event.target.value); } }) }), _jsx(Field, { label: t('workingDirectory'), wide: true, children: _jsx("input", { className: "m4a-settings__input", value: draft.workingDirectory, disabled: disabled, spellCheck: false, onChange: event => { setField('workingDirectory', event.target.value); } }) }), _jsx(Field, { label: t('arguments'), hint: t('argumentsHint'), wide: true, children: _jsx("textarea", { className: "m4a-settings__textarea", value: draft.arguments.join('\n'), disabled: disabled, spellCheck: false, onChange: event => { setField('arguments', lines(event.target.value)); } }) }), _jsx(Field, { label: t('minimumFreeRam'), children: _jsxs("div", { className: "m4a-settings__percentage", children: [_jsx("input", { type: "range", min: 0, max: 1, step: 0.05, value: draft.minimumFreeRamFraction, disabled: disabled, onChange: event => { numberField('minimumFreeRamFraction', event.target.value); } }), _jsx("output", { children: `${Math.round(draft.minimumFreeRamFraction * 100)}%` })] }) }), _jsx(Field, { label: t('minimumFreeVram'), children: _jsxs("div", { className: "m4a-settings__percentage", children: [_jsx("input", { type: "range", min: 0, max: 1, step: 0.05, value: draft.minimumFreeVramFraction, disabled: disabled, onChange: event => { numberField('minimumFreeVramFraction', event.target.value); } }), _jsx("output", { children: `${Math.round(draft.minimumFreeVramFraction * 100)}%` })] }) })] }), _jsx(Check, { checked: draft.promptWhenBusy, disabled: disabled, label: t('promptWhenBusy'), onChange: value => { setField('promptWhenBusy', value); } }), _jsx(Check, { checked: draft.stopOnUnload, disabled: disabled, label: t('stopOnUnload'), onChange: value => { setField('stopOnUnload', value); } }), _jsx(Check, { checked: draft.logOutput, disabled: disabled, label: t('logOutput'), onChange: value => { setField('logOutput', value); } })] })), _jsxs("section", { className: "m4a-settings__group", children: [_jsx("h3", { className: "m4a-settings__group-title", children: t('model') }), _jsxs("div", { className: "m4a-settings__grid", children: [_jsx(Field, { label: t('contextWindow'), children: _jsx("input", { className: "m4a-settings__input", type: "number", min: 1, step: 1024, value: draft.contextWindow, disabled: disabled, onChange: event => { numberField('contextWindow', event.target.value); } }) }), _jsx(Field, { label: t('maxTokens'), children: _jsx("input", { className: "m4a-settings__input", type: "number", min: 1, step: 1024, value: draft.maxTokens, disabled: disabled, onChange: event => { numberField('maxTokens', event.target.value); } }) })] }), _jsx(Check, { checked: draft.vision, disabled: disabled, label: t('vision'), onChange: value => { setField('vision', value); } })] }), _jsxs("details", { className: "m4a-settings__details", children: [_jsx("summary", { children: t('advanced') }), _jsxs("div", { className: "m4a-settings__grid", children: [_jsx(Field, { label: t('processNames'), hint: t('listHint'), children: _jsx("textarea", { className: "m4a-settings__textarea", value: draft.processNames.join('\n'), disabled: disabled, spellCheck: false, onChange: event => { setField('processNames', lines(event.target.value)); } }) }), _jsx(Field, { label: t('excludeModels'), hint: t('listHint'), children: _jsx("textarea", { className: "m4a-settings__textarea", value: draft.excludeModelNameContains.join('\n'), disabled: disabled, spellCheck: false, onChange: event => { setField('excludeModelNameContains', lines(event.target.value)); } }) }), [
                                ['resourceProbeTimeoutMs', 'resourceProbeTimeout'],
                                ['startupTimeoutMs', 'startupTimeout'],
                                ['healthTimeoutMs', 'healthTimeout'],
                                ['pollIntervalMs', 'pollInterval'],
                                ['shutdownTimeoutMs', 'shutdownTimeout'],
                                ['modelRefreshIntervalMs', 'modelRefreshInterval'],
                                ['modelDiscoveryTimeoutMs', 'modelDiscoveryTimeout'],
                            ].map(([field, label]) => (_jsx(Field, { label: t(label), children: _jsx("input", { className: "m4a-settings__input", type: "number", min: 1, step: 100, value: draft[field], disabled: disabled, onChange: event => { numberField(field, event.target.value); } }) }, field)))] })] }), _jsxs("div", { className: "m4a-settings__actions", children: [_jsx("button", { type: "button", className: "m4a-settings__button", disabled: disabled || !dirty || current === null, onClick: () => { if (current !== null)
                            setDraft(current); }, children: t('revert') }), _jsx("button", { type: "button", className: "m4a-settings__button m4a-settings__button--primary", disabled: disabled || !dirty, onClick: () => { void submit(); }, children: saving ? t('saving') : t('save') })] })] }));
}
//# sourceMappingURL=Moe4AllSettings.js.map