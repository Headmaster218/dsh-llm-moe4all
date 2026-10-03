import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Code2, Cpu, Database, Network, SlidersHorizontal, Wrench } from 'lucide-react';
import { argumentValue, composeEditor, setArgument, parseExtraArguments } from './workspace-model.js';
import { Disclosure, Field, Toggle } from './workspace-ui.js';
import { ApiKeyField } from './ApiKeyField.js';
function ExtraArguments({ workspace: w, t }) {
    const text = w.editor.extraText ?? JSON.stringify(w.editor.extras, null, 2);
    let valid = true;
    try {
        parseExtraArguments(text);
    }
    catch {
        valid = false;
    }
    return (_jsxs(Field, { label: t('customArguments'), children: [_jsx("textarea", { rows: 7, spellCheck: false, value: text, "aria-invalid": !valid, onChange: (event) => {
                    const extraText = event.target.value;
                    w.edit((previous) => {
                        try {
                            return { ...previous, extras: parseExtraArguments(extraText), extraText };
                        }
                        catch {
                            return { ...previous, extraText };
                        }
                    });
                } }), !valid && _jsx("span", { className: "m4a-field-error", children: t('invalidExtra') })] }));
}
export function AdvancedOptions({ workspace: w, t }) {
    const e = w.editor;
    const kvPreset = e.setup.sessionCacheEnabled
        ? 'q8_0'
        : e.setup.kvTypeK === e.setup.kvTypeV && ['auto', 'q8_0', 'f16'].includes(e.setup.kvTypeK)
            ? e.setup.kvTypeK
            : 'custom';
    const setKvPreset = (value) => {
        if (value === 'custom') {
            w.setup({
                kvTypeK: e.setup.kvTypeK === 'auto' ? 'q8_0' : e.setup.kvTypeK,
                kvTypeV: e.setup.kvTypeV === 'auto' ? 'f16' : e.setup.kvTypeV,
            });
            return;
        }
        w.setup({ kvTypeK: value, kvTypeV: value });
    };
    const argument = (key, label, placeholder = t('automatic')) => (_jsx(Field, { label: label, help: t('advancedOverride'), children: _jsx("input", { placeholder: placeholder, value: argumentValue(e.extras, key), onChange: (event) => w.edit((previous) => ({
                ...previous,
                extraText: undefined,
                extras: setArgument(previous.extras, key, event.target.value),
            })) }) }));
    let preview = '';
    try {
        preview = JSON.stringify(composeEditor(e).arguments ?? [], null, 2);
    }
    catch { }
    return (_jsxs("div", { className: "m4a-advanced", children: [_jsx(Disclosure, { title: t('memoryCompute'), icon: Cpu, children: _jsxs("div", { className: "m4a-field-grid", children: [argument('--dev', t('deviceLabel'), 'Vulkan0'), argument('--threads', t('threadsLabel')), argument('device.ram_budget', t('ramLabel'), '48g'), argument('device.vram_budget', t('vramLabel'), '22g'), argument('--ubatch', t('batchLabel')), argument('device.submit_dispatches', t('splitterLabel'))] }) }), _jsx(Disclosure, { title: t('samplingSection'), icon: SlidersHorizontal, children: _jsxs("div", { className: "m4a-field-grid", children: [argument('--temp', t('temperatureLabel')), argument('--top-p', 'Top P'), argument('--top-k', 'Top K'), argument('--seed', 'Seed')] }) }), _jsxs(Disclosure, { title: t('cacheSection'), icon: Database, children: [_jsxs("div", { className: "m4a-field-grid", children: [_jsx(Field, { label: t('kvQuantization'), help: t('kvQuantizationHelp'), children: _jsxs("select", { value: kvPreset, disabled: e.setup.sessionCacheEnabled, onChange: (event) => setKvPreset(event.target.value), children: [_jsx("option", { value: "auto", children: t('automatic') }), _jsx("option", { value: "q8_0", children: "Q8_0 K + Q8_0 V" }), _jsx("option", { value: "f16", children: "F16 K + F16 V" }), _jsx("option", { value: "custom", children: t('kvCustom') })] }) }), kvPreset === 'custom' && !e.setup.sessionCacheEnabled && (_jsxs(_Fragment, { children: [_jsx(Field, { label: t('kvKeyType'), children: _jsx("select", { value: e.setup.kvTypeK, onChange: (event) => w.setup({ kvTypeK: event.target.value }), children: ['q8_0', 'q4_0', 'q4_1', 'q5_0', 'q5_1', 'iq4_nl', 'f16', 'bf16', 'f32', 'turbo2', 'turbo3', 'turbo4'].map((value) => (_jsx("option", { value: value, children: value }, value))) }) }), _jsx(Field, { label: t('kvValueType'), children: _jsx("select", { value: e.setup.kvTypeV, onChange: (event) => w.setup({ kvTypeV: event.target.value }), children: ['q8_0', 'q4_0', 'q4_1', 'q5_0', 'q5_1', 'iq4_nl', 'f16', 'bf16', 'f32', 'turbo2', 'turbo3', 'turbo4'].map((value) => (_jsx("option", { value: value, children: value }, value))) }) })] }))] }), _jsx(Toggle, { label: t('cacheEnabled'), checked: e.setup.sessionCacheEnabled, onChange: (value) => w.setup({ sessionCacheEnabled: value }) }), e.setup.sessionCacheEnabled && _jsx("small", { children: t('sessionCacheKvHint') }), e.setup.sessionCacheEnabled && (_jsxs("div", { className: "m4a-field-grid", children: [_jsx(Field, { label: t('sessionCachePath'), help: t('sessionCachePathHint'), className: "m4a-span-2", children: _jsx("input", { value: e.setup.sessionCache.directory, onChange: (event) => w.setup({ sessionCache: { ...e.setup.sessionCache, directory: event.target.value } }) }) }), _jsx(Field, { label: t('sessionCacheMax'), children: _jsx("input", { value: e.setup.sessionCache.maxSize, onChange: (event) => w.setup({ sessionCache: { ...e.setup.sessionCache, maxSize: event.target.value } }) }) }), _jsx(Field, { label: t('sessionCacheIdle'), children: _jsx("input", { type: "number", min: 0, value: e.setup.sessionCache.idleSeconds, onChange: (event) => w.setup({
                                        sessionCache: { ...e.setup.sessionCache, idleSeconds: Number(event.target.value) },
                                    }) }) }), _jsx(Field, { label: t('sessionCacheTtl'), children: _jsx("input", { type: "number", min: 0, value: e.setup.sessionCache.ttlHours, onChange: (event) => w.setup({ sessionCache: { ...e.setup.sessionCache, ttlHours: Number(event.target.value) } }) }) })] }))] }), _jsxs(Disclosure, { title: t('networkSection'), icon: Network, children: [_jsxs("div", { className: "m4a-field-grid", children: [_jsx(Field, { label: t('host'), help: t('networkHelp'), children: _jsx("input", { value: e.config.host ?? '127.0.0.1', onChange: (event) => w.config({ host: event.target.value }) }) }), _jsx(Field, { label: t('port'), children: _jsx("input", { type: "number", min: 1, max: 65535, value: e.config.port ?? 8080, onChange: (event) => w.config({ port: Number(event.target.value) }) }) }), _jsx(ApiKeyField, { workspace: w, t: t })] }), _jsx(Toggle, { label: t('allowRemoteEndpoint'), checked: e.config.allowRemoteEndpoint ?? false, onChange: (allowRemoteEndpoint) => w.config({ allowRemoteEndpoint }) })] }), _jsxs(Disclosure, { title: t('diagnosticSettings'), icon: Wrench, children: [_jsxs("div", { className: "m4a-field-grid", children: [_jsx(Field, { label: t('startupTimeout'), children: _jsx("input", { type: "number", min: 1000, step: 1000, value: e.config.startupTimeoutMs ?? 120000, onChange: (event) => w.config({ startupTimeoutMs: Number(event.target.value) }) }) }), _jsx(Field, { label: t('healthTimeout'), children: _jsx("input", { type: "number", min: 100, step: 100, value: e.config.healthTimeoutMs ?? 2000, onChange: (event) => w.config({ healthTimeoutMs: Number(event.target.value) }) }) }), _jsx(Field, { label: t('minimumFreeRam'), children: _jsxs("div", { className: "m4a-range", children: [_jsx("input", { type: "range", min: 0, max: 90, step: 5, value: (e.config.minimumFreeRamFraction ?? 0.5) * 100, onChange: (event) => w.config({ minimumFreeRamFraction: Number(event.target.value) / 100 }) }), _jsxs("output", { children: [Math.round((e.config.minimumFreeRamFraction ?? 0.5) * 100), "%"] })] }) }), _jsx(Field, { label: t('minimumFreeVram'), children: _jsxs("div", { className: "m4a-range", children: [_jsx("input", { type: "range", min: 0, max: 90, step: 5, value: (e.config.minimumFreeVramFraction ?? 0.5) * 100, onChange: (event) => w.config({ minimumFreeVramFraction: Number(event.target.value) / 100 }) }), _jsxs("output", { children: [Math.round((e.config.minimumFreeVramFraction ?? 0.5) * 100), "%"] })] }) }), _jsx(Field, { label: t('embeddingIdleTimeout'), children: _jsx("input", { type: "number", min: 0, value: e.setup.embeddingIdleTimeout, onChange: (event) => w.setup({ embeddingIdleTimeout: Number(event.target.value) }) }) })] }), _jsx(Toggle, { label: t('stopOnUnload'), checked: e.config.stopOnUnload ?? true, onChange: (stopOnUnload) => w.config({ stopOnUnload }) }), _jsx(Toggle, { label: t('logOutput'), checked: e.config.logOutput ?? true, onChange: (logOutput) => w.config({ logOutput }) })] }), _jsxs(Disclosure, { title: t('customArguments'), icon: Code2, children: [_jsx(ExtraArguments, { workspace: w, t: t }), preview && (_jsx(Disclosure, { title: t('launchPreview'), children: _jsx("pre", { className: "m4a-code", children: preview }) }))] })] }));
}
//# sourceMappingURL=AdvancedOptions.js.map