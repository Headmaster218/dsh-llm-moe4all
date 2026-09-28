import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Code2, Cpu, Database, Network, SlidersHorizontal, Wrench } from 'lucide-react';
import { argumentValue, composeEditor, setArgument, parseExtraArguments } from './workspace-model.js';
import { Disclosure, Field, Toggle } from './workspace-ui.js';
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
    return (_jsxs("div", { className: "m4a-advanced", children: [_jsx(Disclosure, { title: t('memoryCompute'), icon: Cpu, children: _jsxs("div", { className: "m4a-field-grid", children: [argument('--dev', t('deviceLabel'), 'Vulkan0'), argument('--threads', t('threadsLabel')), argument('device.ram_budget', t('ramLabel'), '48g'), argument('device.vram_budget', t('vramLabel'), '22g'), argument('--ubatch', t('batchLabel')), argument('device.submit_dispatches', t('splitterLabel'))] }) }), _jsx(Disclosure, { title: t('samplingSection'), icon: SlidersHorizontal, children: _jsxs("div", { className: "m4a-field-grid", children: [argument('--temp', t('temperatureLabel')), argument('--top-p', 'Top P'), argument('--top-k', 'Top K'), argument('--seed', 'Seed')] }) }), _jsxs(Disclosure, { title: t('cacheSection'), icon: Database, children: [_jsx(Toggle, { label: t('cacheEnabled'), checked: e.setup.sessionCacheEnabled, onChange: (value) => w.setup({ sessionCacheEnabled: value }) }), e.setup.sessionCacheEnabled && (_jsxs("div", { className: "m4a-field-grid", children: [_jsx(Field, { label: t('sessionCachePath'), help: t('sessionCachePathHint'), className: "m4a-span-2", children: _jsx("input", { value: e.setup.sessionCache.directory, onChange: (event) => w.setup({ sessionCache: { ...e.setup.sessionCache, directory: event.target.value } }) }) }), _jsx(Field, { label: t('sessionCacheMax'), children: _jsx("input", { value: e.setup.sessionCache.maxSize, onChange: (event) => w.setup({ sessionCache: { ...e.setup.sessionCache, maxSize: event.target.value } }) }) }), _jsx(Field, { label: t('sessionCacheIdle'), children: _jsx("input", { type: "number", min: 0, value: e.setup.sessionCache.idleSeconds, onChange: (event) => w.setup({
                                        sessionCache: { ...e.setup.sessionCache, idleSeconds: Number(event.target.value) },
                                    }) }) }), _jsx(Field, { label: t('sessionCacheTtl'), children: _jsx("input", { type: "number", min: 0, value: e.setup.sessionCache.ttlHours, onChange: (event) => w.setup({ sessionCache: { ...e.setup.sessionCache, ttlHours: Number(event.target.value) } }) }) })] }))] }), _jsxs(Disclosure, { title: t('networkSection'), icon: Network, children: [_jsxs("div", { className: "m4a-field-grid", children: [_jsx(Field, { label: t('host'), help: t('networkHelp'), children: _jsx("input", { value: e.config.host ?? '127.0.0.1', onChange: (event) => w.config({ host: event.target.value }) }) }), _jsx(Field, { label: t('port'), children: _jsx("input", { type: "number", min: 1, max: 65535, value: e.config.port ?? 8080, onChange: (event) => w.config({ port: Number(event.target.value) }) }) }), _jsx(Field, { label: t('apiKeyEnv'), help: t('apiKeyHelp'), className: "m4a-span-2", children: _jsx("input", { value: e.config.apiKeyEnv ?? '', placeholder: "INFR_API_KEY", onChange: (event) => w.config({ apiKeyEnv: event.target.value }) }) })] }), _jsx(Toggle, { label: t('allowRemoteEndpoint'), checked: e.config.allowRemoteEndpoint ?? false, onChange: (allowRemoteEndpoint) => w.config({ allowRemoteEndpoint }) })] }), _jsxs(Disclosure, { title: t('diagnosticSettings'), icon: Wrench, children: [_jsxs("div", { className: "m4a-field-grid", children: [_jsx(Field, { label: t('startupTimeout'), children: _jsx("input", { type: "number", min: 1000, step: 1000, value: e.config.startupTimeoutMs ?? 120000, onChange: (event) => w.config({ startupTimeoutMs: Number(event.target.value) }) }) }), _jsx(Field, { label: t('healthTimeout'), children: _jsx("input", { type: "number", min: 100, step: 100, value: e.config.healthTimeoutMs ?? 2000, onChange: (event) => w.config({ healthTimeoutMs: Number(event.target.value) }) }) }), _jsx(Field, { label: t('minimumFreeRam'), children: _jsxs("div", { className: "m4a-range", children: [_jsx("input", { type: "range", min: 0, max: 90, step: 5, value: (e.config.minimumFreeRamFraction ?? 0.5) * 100, onChange: (event) => w.config({ minimumFreeRamFraction: Number(event.target.value) / 100 }) }), _jsxs("output", { children: [Math.round((e.config.minimumFreeRamFraction ?? 0.5) * 100), "%"] })] }) }), _jsx(Field, { label: t('minimumFreeVram'), children: _jsxs("div", { className: "m4a-range", children: [_jsx("input", { type: "range", min: 0, max: 90, step: 5, value: (e.config.minimumFreeVramFraction ?? 0.5) * 100, onChange: (event) => w.config({ minimumFreeVramFraction: Number(event.target.value) / 100 }) }), _jsxs("output", { children: [Math.round((e.config.minimumFreeVramFraction ?? 0.5) * 100), "%"] })] }) }), _jsx(Field, { label: t('embeddingIdleTimeout'), children: _jsx("input", { type: "number", min: 0, value: e.setup.embeddingIdleTimeout, onChange: (event) => w.setup({ embeddingIdleTimeout: Number(event.target.value) }) }) })] }), _jsx(Toggle, { label: t('stopOnUnload'), checked: e.config.stopOnUnload ?? true, onChange: (stopOnUnload) => w.config({ stopOnUnload }) }), _jsx(Toggle, { label: t('logOutput'), checked: e.config.logOutput ?? true, onChange: (logOutput) => w.config({ logOutput }) })] }), _jsxs(Disclosure, { title: t('customArguments'), icon: Code2, children: [_jsx(ExtraArguments, { workspace: w, t: t }), preview && (_jsx(Disclosure, { title: t('launchPreview'), children: _jsx("pre", { className: "m4a-code", children: preview }) }))] })] }));
}
//# sourceMappingURL=AdvancedOptions.js.map