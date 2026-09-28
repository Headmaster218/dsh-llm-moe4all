import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowRight, Check, ChevronRight, CircleAlert, Copy, Cpu, FilePlus2, FolderOpen, Layers3, Link, Monitor, Package, Play, Plus, RefreshCw, RotateCcw, Save, Settings2, Square, Terminal, X, } from 'lucide-react';
import { endpointFromConfig } from '../connection.js';
import { useWorkspace, isInstalling } from './use-workspace.js';
import { fileName, formatBytes, samePath } from './workspace-model.js';
import { AdvancedOptions } from './AdvancedOptions.js';
import { EngineVersionsView } from './EngineVersionsView.js';
import { ModelLibraryView, roleIcon, roleLabel } from './ModelLibraryView.js';
import { Button, Dialog, Field, IconButton, Toggle, Transfer } from './workspace-ui.js';
const phases = {
    ready: 'readyStatus',
    checking: 'checkingStatus',
    starting: 'startingStatus',
    offline: 'stoppedStatus',
    error: 'failedStatus',
    'missing-executable': 'notConfigured',
    'missing-arguments': 'notConfigured',
    'resource-warning': 'busyStatus',
    'duplicate-process': 'duplicateStatus',
};
export function Moe4AllSettings(props) {
    const w = useWorkspace(props);
    const { t } = props;
    const root = useRef(null);
    const [tab, setTab] = useState('run');
    const [confirmation, setConfirmation] = useState(null);
    const [importKind, setImportKind] = useState(null);
    const [importText, setImportText] = useState('');
    const [advanced, setAdvanced] = useState(false);
    const [copied, setCopied] = useState(false);
    const [clock, setClock] = useState(Date.now());
    useEffect(() => {
        const dialog = root.current?.closest('[role="dialog"]');
        let options = root.current?.parentElement;
        while (options && options !== dialog && getComputedStyle(options).overflowY !== 'auto')
            options = options.parentElement;
        const overlay = dialog?.parentElement;
        dialog?.classList.add('m4a-host-dialog');
        options?.classList.add('m4a-host-options');
        // Older DSH shells mount settings inside a fading sidebar stacking context.
        if (overlay && 'showPopover' in overlay) {
            overlay.classList.add('m4a-host-overlay');
            overlay.setAttribute('popover', 'manual');
            overlay.showPopover();
        }
        document.documentElement.dataset.moe4allSettings = 'open';
        window.dispatchEvent(new Event('moe4all-settings-visibility'));
        return () => {
            dialog?.classList.remove('m4a-host-dialog');
            options?.classList.remove('m4a-host-options');
            if (overlay?.hasAttribute('popover')) {
                overlay.hidePopover();
                overlay.removeAttribute('popover');
                overlay.classList.remove('m4a-host-overlay');
            }
            delete document.documentElement.dataset.moe4allSettings;
            window.dispatchEvent(new Event('moe4all-settings-visibility'));
        };
    }, [w.editor === null]);
    useEffect(() => {
        const timer = setInterval(() => setClock(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);
    if (!w.editor)
        return (_jsx("div", { className: "m4a-workspace", ref: root, children: _jsxs("div", { className: "m4a-loading", children: [_jsx(RefreshCw, { size: 20, className: "m4a-spin" }), t(w.snapshot.status === 'unavailable' ? 'unavailable' : 'loading')] }) }));
    const e = w.editor;
    const local = e.config.mode !== 'connect';
    const owned = w.status?.owned === true;
    const ready = w.status?.ready === true;
    const starting = w.status?.phase === 'starting' || w.working === 'start';
    const engineSelected = !!e.config.executable;
    const modelSelected = !!e.setup.model;
    const selectedVersion = w.release?.versions.find((item) => samePath(item.executable, e.config.executable ?? ''));
    const currentModel = w.library.models.find((item) => samePath(item.path, e.setup.model));
    const showSteps = local && (!engineSelected || !modelSelected);
    const needsRestart = owned && (w.dirty || w.status?.pendingChanges || (!ready && !starting));
    const endpoint = endpointFromConfig(e.config);
    const output = (w.status?.startupLines ?? []).join('\n');
    const engineTask = w.release?.install;
    const modelTask = w.download;
    const currentDownload = w.catalog.find((item) => item.id === modelTask.modelId);
    const downloadTasks = (engineTask && engineTask.stage !== 'idle' && engineTask.stage !== 'complete') ||
        (modelTask.stage !== 'idle' && modelTask.stage !== 'complete');
    const installLabels = {
        checking: 'progressChecking',
        downloading: 'downloadRunning',
        verifying: 'progressVerifying',
        extracting: 'progressExtracting',
        finalizing: 'progressFinalizing',
        error: 'failedDownload',
        cancelled: 'pausedStatus',
        complete: 'downloadedStatus',
    };
    const primaryLabel = needsRestart
        ? 'restartEngineAction'
        : !local
            ? w.dirty
                ? 'saveConnect'
                : 'testConnection'
            : !engineSelected
                ? 'stepEngine'
                : !modelSelected
                    ? 'browseLibrary'
                    : ready
                        ? 'readyStatus'
                        : w.dirty
                            ? 'saveStart'
                            : 'startNow';
    const primaryAction = () => {
        if (needsRestart) {
            setConfirmation({ kind: 'restart' });
            return;
        }
        if (!local) {
            void w.launch();
            return;
        }
        if (!engineSelected) {
            setTab('engines');
            return;
        }
        if (!modelSelected) {
            setTab('models');
            return;
        }
        void w.launch();
    };
    const attachPath = (kind) => kind === 'main'
        ? e.setup.model
        : kind === 'vision'
            ? e.setup.visionModel
            : kind === 'mtp'
                ? e.setup.mtpModel
                : e.setup.embeddingModel;
    const tokenFields = (_jsxs("div", { className: "m4a-field-grid", children: [_jsx(Field, { label: t('contextWindow'), help: t('tokenUnitHint'), children: _jsx("input", { inputMode: "decimal", value: e.context, placeholder: "160k", onChange: (event) => w.edit((previous) => ({ ...previous, context: event.target.value })) }) }), _jsx(Field, { label: t('maxTokens'), help: t('tokenUnitHint'), children: _jsx("input", { inputMode: "decimal", value: e.maxTokens, placeholder: "100k", onChange: (event) => w.edit((previous) => ({ ...previous, maxTokens: event.target.value })) }) })] }));
    const runConfig = (_jsxs("div", { className: "m4a-run-config", children: [_jsxs("div", { className: "m4a-section-heading", children: [_jsx("h3", { children: t('selectedModelTitle') }), _jsx(Button, { kind: "ghost", icon: Plus, onClick: () => setImportKind('main'), children: t('importModel') })] }), _jsxs("div", { className: `m4a-active-model ${!modelSelected ? 'is-empty' : ''}`, children: [_jsx("div", { className: "m4a-active-symbol", children: _jsx(Layers3, { size: 24 }) }), _jsx("div", { children: modelSelected ? (_jsxs(_Fragment, { children: [_jsx("strong", { children: currentModel?.family ?? fileName(e.setup.model) }), _jsxs("span", { children: [currentModel?.quantization ?? 'GGUF', currentModel && ` · ${formatBytes(currentModel.sizeBytes)}`] })] })) : (_jsx("strong", { children: t('modelEmpty') })) }), _jsx(IconButton, { icon: ChevronRight, label: t('changeModel'), onClick: () => setTab('models') })] }), modelSelected && (_jsxs("details", { className: "m4a-model-path", children: [_jsx("summary", { children: t('detailLabel') }), _jsx("code", { children: e.setup.model })] })), _jsxs("section", { className: "m4a-section", children: [_jsx("h4", { children: t('essential') }), tokenFields, _jsx(Field, { label: t('performance'), children: _jsx("div", { className: "m4a-preset", role: "group", "aria-label": t('performance'), children: ['conservative', 'aggressive'].map((profile) => (_jsxs("button", { type: "button", "aria-pressed": e.setup.profile === profile, onClick: () => w.setup({ profile }), title: t(profile === 'conservative' ? 'balancedHelp' : 'performanceHelp'), children: [profile === 'conservative' ? _jsx(Cpu, { size: 16 }) : _jsx(Activity, { size: 16 }), t(profile === 'conservative' ? 'balancedLabel' : 'performanceLabel'), e.setup.profile === profile && _jsx(Check, { size: 13 })] }, profile))) }) }), _jsxs("div", { className: "m4a-field-grid", children: [_jsx(Field, { label: t('parallel'), children: _jsx("select", { value: e.setup.parallel, onChange: (event) => w.setup({ parallel: Number(event.target.value) }), children: [...new Set([1, 2, 4, 8, e.setup.parallel])]
                                        .sort((a, b) => a - b)
                                        .map((value) => (_jsx("option", { value: value, children: value }, value))) }) }), _jsx(Field, { label: t('startupPolicy'), help: t('resourcesHelp'), children: _jsxs("select", { value: e.config.mode, onChange: (event) => w.config({ mode: event.target.value }), children: [_jsx("option", { value: "prompt", children: t('askStart') }), _jsx("option", { value: "auto", children: t('autoStart') })] }) })] })] }), _jsxs("section", { className: "m4a-section m4a-capabilities", children: [_jsx("h4", { children: t('optionalFeatures') }), ['vision', 'mtp', 'embedding'].map((kind) => {
                        const Icon = roleIcon[kind], path = attachPath(kind);
                        const active = kind === 'mtp' ? e.setup.mtp : !!path;
                        return (_jsxs("div", { className: "m4a-capability", children: [_jsx(Icon, { size: 18 }), _jsxs("div", { children: [_jsx(Toggle, { label: t(roleLabel[kind]), checked: active, onChange: (enabled) => {
                                                if (kind === 'mtp' && path)
                                                    w.setup({ mtp: enabled });
                                                else if (!enabled)
                                                    w.selectModel('', kind);
                                                else {
                                                    const available = w.library.models.find((item) => item.kind === kind &&
                                                        item.complete &&
                                                        (kind === 'embedding' || item.family === currentModel?.family));
                                                    if (available)
                                                        w.selectModel(available.path, kind);
                                                    else
                                                        setImportKind(kind);
                                                }
                                            } }), path && (_jsx("button", { type: "button", className: "m4a-text-link m4a-attachment-path", title: path, onClick: () => {
                                                setImportText(path);
                                                setImportKind(kind);
                                            }, children: fileName(path) }))] }), _jsx(IconButton, { icon: FolderOpen, label: t('chooseAttachment'), onClick: () => {
                                        setImportText(path);
                                        setImportKind(kind);
                                    } })] }, kind));
                    }), _jsxs("div", { className: "m4a-cache-toggle", children: [_jsx(Toggle, { label: t('cacheEnabled'), checked: e.setup.sessionCacheEnabled, onChange: (sessionCacheEnabled) => w.setup({ sessionCacheEnabled }) }), _jsxs("span", { className: "m4a-help", tabIndex: 0, "aria-label": t('sessionCacheHelp'), children: ["?", _jsx("span", { role: "tooltip", children: t('sessionCacheHelp') })] })] })] }), _jsxs("button", { type: "button", className: `m4a-advanced-trigger ${advanced ? 'is-active' : ''}`, "aria-expanded": advanced, onClick: () => setAdvanced(!advanced), children: [_jsx(Settings2, { size: 16 }), _jsx("span", { children: t('advancedOptions') }), _jsx(ChevronRight, { size: 16 })] }), advanced && _jsx(AdvancedOptions, { workspace: w, t: t })] }));
    return (_jsxs("div", { className: "m4a-workspace", ref: root, children: [_jsxs("header", { className: "m4a-header", children: [_jsxs("div", { className: "m4a-brand", children: [_jsx("div", { className: "m4a-brand-mark", "aria-hidden": "true", children: _jsx(Layers3, { size: 23 }) }), _jsxs("div", { children: [_jsx("h2", { children: "MoE4All" }), _jsx("span", { children: "Local inference" })] })] }), _jsxs("div", { className: `m4a-status-pill m4a-status-pill--${ready ? 'ready' : starting ? 'busy' : w.status?.phase === 'error' ? 'error' : 'idle'}`, role: "status", children: [_jsx("i", {}), t(phases[w.status?.phase ?? 'checking'] ?? 'stoppedStatus')] })] }), _jsxs("div", { className: "m4a-mode-switch", role: "group", "aria-label": t('mode'), children: [_jsxs("button", { type: "button", "aria-pressed": local, disabled: w.disabled, onClick: () => {
                            if (!local)
                                w.config({ mode: 'prompt', endpoint: '' });
                        }, children: [_jsx(Monitor, { size: 16 }), t('localRun')] }), _jsxs("button", { type: "button", "aria-pressed": !local, disabled: w.disabled, onClick: () => {
                            if (local)
                                w.config({ mode: 'connect' });
                        }, children: [_jsx(Link, { size: 16 }), t('existingService')] })] }), _jsx("nav", { className: "m4a-tabs", "aria-label": "MoE4All", children: [
                    { id: 'run', label: 'runTab', icon: Play },
                    { id: 'models', label: 'modelsTab', icon: Layers3 },
                    { id: 'engines', label: 'enginesTab', icon: Package },
                    { id: 'diagnostics', label: 'diagnosticsTab', icon: Terminal },
                ].map((item) => (_jsxs("button", { type: "button", "aria-current": tab === item.id ? 'page' : undefined, onClick: () => setTab(item.id), children: [_jsx(item.icon, { size: 15 }), t(item.label), item.id === 'engines' && w.release?.updateAvailable && _jsx("i", { className: "m4a-update-dot" })] }, item.id))) }), w.error && (_jsxs("div", { className: "m4a-message m4a-message--error", role: "alert", children: [_jsx(CircleAlert, { size: 17 }), _jsx("span", { children: w.error }), _jsx(IconButton, { icon: X, label: t('cancel'), onClick: () => w.setError('') })] })), !w.error && w.notice && (_jsxs("div", { className: "m4a-message", role: "status", children: [_jsx(Check, { size: 16 }), _jsx("span", { children: w.notice }), _jsx(IconButton, { icon: X, label: t('cancel'), onClick: () => w.setNotice('') })] })), w.status?.pendingChanges && (_jsxs("div", { className: "m4a-message m4a-message--warning", children: [_jsx(RotateCcw, { size: 16 }), _jsx("span", { children: t('pendingRestart') })] })), showSteps && tab === 'run' && (_jsx("ol", { className: "m4a-setup-steps", "aria-label": t('setupTitle'), children: [
                    { done: engineSelected, title: 'stepEngine', next: 'engines' },
                    { done: modelSelected, title: 'stepModel', next: 'models' },
                    { done: ready, title: 'stepStart', next: 'run' },
                ].map((step, index) => (_jsx("li", { className: step.done ? 'is-done' : '', children: _jsxs("button", { type: "button", onClick: () => setTab(step.next), children: [_jsx("span", { children: step.done ? _jsx(Check, { size: 13 }) : index + 1 }), t(step.title)] }) }, step.title))) })), downloadTasks && (_jsxs("div", { className: "m4a-transfer-list", children: [engineTask && !['idle', 'complete'].includes(engineTask.stage) && (_jsx(Transfer, { label: `MoE4All Engine · ${t(installLabels[engineTask.stage])}`, percent: engineTask.percent, detail: `${formatBytes(engineTask.downloadedBytes)}${engineTask.totalBytes ? ` / ${formatBytes(engineTask.totalBytes)}` : ''}`, error: engineTask.error, actions: isInstalling(w.release) ? (_jsx(IconButton, { icon: Square, label: t('stopTransfer'), onClick: () => void w.stopInstall() })) : (_jsx(Button, { icon: RefreshCw, onClick: () => void w.install(), children: t('retryDownload') })) })), !['idle', 'complete'].includes(modelTask.stage) && (_jsx(Transfer, { label: currentDownload?.name ?? t('downloadRunning'), percent: modelTask.percent, detail: `${t(modelTask.stage === 'downloading' ? 'downloadRunning' : modelTask.stage === 'error' ? 'failedDownload' : 'pausedStatus')} · ${formatBytes(modelTask.downloadedBytes)}${modelTask.totalBytes ? ` / ${formatBytes(modelTask.totalBytes)}` : ''}`, error: modelTask.error, actions: modelTask.stage === 'downloading' ? (_jsx(IconButton, { icon: Square, label: t('stopTransfer'), onClick: () => void w.stopDownload() })) : (_jsx(Button, { icon: RefreshCw, onClick: () => currentDownload && void w.downloadModel(currentDownload), children: t('continueDownload') })) }))] })), tab === 'run' && (_jsxs(_Fragment, { children: [(ready || starting || w.status?.phase === 'error' || w.status?.phase === 'duplicate-process') && (_jsxs("section", { className: "m4a-runtime", children: [_jsxs("div", { className: "m4a-section-heading", children: [_jsxs("h3", { children: [_jsx(Activity, { size: 16 }), t(phases[w.status?.phase ?? 'checking'] ?? 'stoppedStatus')] }), _jsxs("div", { className: "m4a-inline", children: [ready && _jsx("span", { className: "m4a-badge", children: t(owned ? 'pluginOwned' : 'externalOwned') }), owned && (_jsx(IconButton, { icon: Square, label: t('stopEngineAction'), onClick: () => setConfirmation({ kind: 'stop' }) }))] })] }), _jsx("code", { children: w.status?.endpoint }), ready && (_jsx("div", { className: "m4a-runtime-models", children: w.status?.models.map((model) => (_jsxs("span", { children: [_jsx(Check, { size: 13 }), model.name] }, model.id))) })), starting && (_jsxs(_Fragment, { children: [_jsx("progress", { "aria-label": t('startingStatus') }), _jsxs("span", { children: [t('startupElapsed'), ' ', Math.max(0, Math.floor((clock - Date.parse(w.status?.startupStartedAt ?? new Date(clock).toISOString())) /
                                                1000)), "s"] })] })), w.status?.phase === 'duplicate-process' && _jsx("p", { children: t('externalProcessHelp') }), (starting || w.status?.phase === 'error') && (_jsx("pre", { className: "m4a-log m4a-log--preview", children: output || w.status?.message || t('noOutput') }))] })), local ? (_jsxs("div", { className: "m4a-run-layout", children: [runConfig, _jsx("aside", { className: "m4a-run-library", children: _jsx(ModelLibraryView, { workspace: w, t: t, compact: true, onImport: () => setImportKind('main') }) })] })) : (_jsxs("div", { className: "m4a-connection-view", children: [_jsxs("div", { className: "m4a-section-heading", children: [_jsx("h3", { children: t('connection') }), _jsx(Link, { size: 20 })] }), _jsx(Field, { label: t('currentEndpoint'), children: _jsx("input", { value: e.config.endpoint || endpoint, onChange: (event) => w.config({ endpoint: event.target.value }), placeholder: "http://127.0.0.1:8080/v1" }) }), _jsx(Field, { label: t('apiKeyEnv'), help: t('apiKeyHelp'), children: _jsx("input", { value: e.config.apiKeyEnv ?? '', placeholder: "INFR_API_KEY", onChange: (event) => w.config({ apiKeyEnv: event.target.value }) }) }), _jsx(Toggle, { label: t('allowRemoteEndpoint'), checked: e.config.allowRemoteEndpoint ?? false, onChange: (allowRemoteEndpoint) => w.config({ allowRemoteEndpoint }) }), _jsxs("section", { className: "m4a-section", children: [_jsx("h4", { children: t('model') }), tokenFields, _jsx(Toggle, { label: t('vision'), checked: e.config.vision ?? true, onChange: (vision) => w.config({ vision }) })] })] }))] })), tab === 'models' && (_jsx(ModelLibraryView, { workspace: w, t: t, onImport: () => setImportKind('main'), onSelected: () => setTab('run') })), tab === 'engines' && (_jsx(EngineVersionsView, { workspace: w, t: t, onDelete: (version) => setConfirmation({ kind: 'delete', version }) })), tab === 'diagnostics' && (_jsxs("section", { className: "m4a-diagnostics", children: [_jsxs("div", { className: "m4a-section-heading", children: [_jsx("h3", { children: t('runtimeOutput') }), _jsxs("div", { className: "m4a-inline", children: [_jsx(IconButton, { icon: RefreshCw, label: t('refreshStatus'), onClick: () => void w.refresh() }), _jsx(IconButton, { icon: copied ? Check : Copy, label: t(copied ? 'copied' : 'copyOutput'), disabled: !output, onClick: () => {
                                            void navigator.clipboard
                                                .writeText(output)
                                                .then(() => setCopied(true))
                                                .catch((error) => w.setError(String(error)));
                                        } })] })] }), _jsxs("dl", { className: "m4a-diagnostic-facts", children: [_jsxs("div", { children: [_jsx("dt", { children: t('currentEndpoint') }), _jsx("dd", { children: w.status?.endpoint || endpoint })] }), _jsxs("div", { children: [_jsx("dt", { children: t('selectedEngine') }), _jsx("dd", { children: w.status?.executable || e.config.executable || t('noEngine') })] }), _jsxs("div", { children: [_jsx("dt", { children: t('returnedModels') }), _jsx("dd", { children: w.status?.models.map((model) => model.name).join(', ') || '-' })] })] }), _jsx("pre", { className: "m4a-log", tabIndex: 0, children: output || t('noOutput') })] })), _jsxs("footer", { className: "m4a-footer", children: [_jsxs("div", { children: [_jsx("span", { className: `m4a-save-indicator ${w.dirty ? 'is-dirty' : ''}` }), t(w.dirty ? 'pendingEdits' : 'saved'), local && selectedVersion && _jsx("small", { children: selectedVersion.name })] }), _jsxs("div", { className: "m4a-footer-actions", children: [w.dirty && (_jsx(IconButton, { icon: RotateCcw, label: t('revert'), disabled: w.disabled, onClick: () => setConfirmation({ kind: 'discard' }) })), _jsx(Button, { icon: Save, disabled: !w.dirty || w.disabled, busy: w.working === 'save', onClick: () => void w.save(), children: t('save') }), _jsx(Button, { icon: !local ? Link : ready && !needsRestart ? Check : needsRestart ? RotateCcw : Play, kind: "primary", disabled: w.disabled || starting || (local && ready && !needsRestart), busy: w.working === 'start', onClick: primaryAction, children: t(primaryLabel) })] })] }), importKind && (_jsxs(Dialog, { title: t(roleLabel[importKind]), closeLabel: t('cancel'), onClose: () => {
                    setImportKind(null);
                    setImportText('');
                }, actions: _jsxs(_Fragment, { children: [_jsx(Button, { onClick: () => setImportKind(null), children: t('cancel') }), _jsx(Button, { icon: Plus, kind: "primary", disabled: !importText.trim(), busy: w.working === 'import', onClick: () => {
                                void w.importPath(importText, importKind).then((ok) => {
                                    if (!ok)
                                        return;
                                    setImportKind(null);
                                    setImportText('');
                                });
                            }, children: t('addPath') })] }), children: [w.error && (_jsx("p", { className: "m4a-field-error", role: "alert", children: w.error })), _jsx(Field, { label: t('importPath'), children: _jsx("input", { autoFocus: true, value: importText, onChange: (event) => setImportText(event.target.value), placeholder: "D:\\Models\\model.gguf" }) }), _jsxs("div", { className: "m4a-dialog-choices", children: [w.nativePicker && (_jsx(Button, { icon: FilePlus2, onClick: () => {
                                    void w.pickFile(importKind);
                                    setImportKind(null);
                                }, children: t('chooseFile') })), _jsx(Button, { icon: FolderOpen, onClick: () => {
                                    void props
                                        .pickDirectory()
                                        .then((path) => {
                                        if (path)
                                            setImportText(path);
                                    })
                                        .catch((error) => w.setError(String(error)));
                                }, children: t('chooseDirectory') }), _jsx(Button, { icon: ArrowDownToLine, onClick: () => {
                                    setTab('models');
                                    setImportKind(null);
                                }, children: t('filterRecommended') })] }), w.library.models
                        .filter((item) => item.kind === importKind && item.complete)
                        .map((item) => (_jsxs("button", { type: "button", className: "m4a-import-choice", onClick: () => {
                            w.selectModel(item.path, importKind);
                            setImportKind(null);
                        }, children: [_jsx(Layers3, { size: 16 }), _jsx("span", { children: item.name }), _jsx(ArrowRight, { size: 15 })] }, item.id)))] })), confirmation && (_jsxs(Dialog, { title: t(confirmation.kind === 'delete'
                    ? 'removeEngineTitle'
                    : confirmation.kind === 'stop'
                        ? 'stopEngineTitle'
                        : confirmation.kind === 'restart'
                            ? 'restartEngineTitle'
                            : 'discardTitle'), closeLabel: t('cancel'), onClose: () => setConfirmation(null), actions: _jsxs(_Fragment, { children: [_jsx(Button, { onClick: () => setConfirmation(null), children: t('cancel') }), _jsx(Button, { kind: confirmation.kind === 'restart' ? 'primary' : 'danger', onClick: () => {
                                if (confirmation.kind === 'stop')
                                    void w.stop();
                                if (confirmation.kind === 'restart')
                                    void w.launch(false, true);
                                if (confirmation.kind === 'delete')
                                    void w.removeVersion(confirmation.version);
                                if (confirmation.kind === 'discard')
                                    w.revert();
                                setConfirmation(null);
                            }, children: t(confirmation.kind === 'delete'
                                ? 'deleteEngine'
                                : confirmation.kind === 'stop'
                                    ? 'stopEngineAction'
                                    : confirmation.kind === 'restart'
                                        ? 'restartEngineAction'
                                        : 'discardAction') })] }), children: [confirmation.kind === 'delete' && _jsx("strong", { children: confirmation.version.name }), confirmation.kind !== 'discard' && (_jsx("p", { children: t(confirmation.kind === 'delete'
                            ? 'removeEngineBody'
                            : confirmation.kind === 'stop'
                                ? 'stopEngineBody'
                                : 'restartEngineBody') }))] })), w.resourcePrompt && (_jsxs(Dialog, { title: t('resourceWarningTitle'), closeLabel: t('cancel'), onClose: () => w.setResourcePrompt(false), actions: _jsxs(_Fragment, { children: [_jsx(Button, { onClick: () => w.setResourcePrompt(false), children: t('cancel') }), _jsx(Button, { kind: "danger", onClick: () => {
                                w.setResourcePrompt(false);
                                void w.launch(true);
                            }, children: t('startAnyway') })] }), children: [_jsx("p", { children: t('resourceWarningBody') }), w.status?.reasons?.map((reason) => (_jsx("p", { children: reason }, reason)))] }))] }));
}
//# sourceMappingURL=Moe4AllSettings.js.map