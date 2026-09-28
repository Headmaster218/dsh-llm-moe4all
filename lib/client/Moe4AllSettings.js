import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cancelEngineInstall, cancelModelDownload, deleteEngineVersion, fetchEngineStatus, fetchModelCatalog, fetchModelDownload, fetchReleaseStatus, installLatestEngine, pickModelFile, scanModelLibrary, startEngine, startModelDownload, validateModelPaths, } from './engine-api.js';
import { buildEngineArguments, parseEngineArguments, } from './engine-setup.js';
import { formatTokenValue, parseTokenValue } from './token-value.js';
function same(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}
function resolved(value) {
    const mode = value.mode === 'managed' ? 'prompt' : value.mode;
    return { ...value, mode };
}
function Field({ label, wide = false, hint, children }) {
    return (_jsxs("label", { className: `m4a-settings__field${wide ? ' m4a-settings__field--wide' : ''}`, children: [_jsx("span", { className: "m4a-settings__label", children: label }), children, hint === undefined ? null : _jsx("span", { className: "m4a-settings__hint", children: hint })] }));
}
function Check({ checked, disabled, label, onChange }) {
    return (_jsxs("label", { className: "m4a-settings__check", children: [_jsx("input", { type: "checkbox", checked: checked, disabled: disabled, onChange: event => { onChange(event.target.checked); } }), _jsx("span", { children: label })] }));
}
function TokenInput({ value, disabled, onChange }) {
    const [text, setText] = useState(formatTokenValue(value));
    const valid = parseTokenValue(text) !== undefined;
    useEffect(() => { setText(formatTokenValue(value)); }, [value]);
    return (_jsx("input", { className: `m4a-settings__input${valid || text === '' ? '' : ' m4a-settings__input--invalid'}`, type: "text", inputMode: "decimal", value: text, disabled: disabled, placeholder: "160k", onChange: event => {
            const next = event.target.value;
            setText(next);
            const parsed = parseTokenValue(next);
            if (parsed !== undefined)
                onChange(parsed);
        }, onBlur: () => {
            const parsed = parseTokenValue(text);
            setText(parsed === undefined ? formatTokenValue(value) : text.trim().toLowerCase());
        } }));
}
function statusClass(status) {
    if (status?.ready === true)
        return 'ready';
    if (status?.phase === 'starting' || status?.phase === 'checking')
        return 'busy';
    if (status?.phase === 'resource-warning')
        return 'warning';
    if (status?.phase === 'error' || status?.phase === 'duplicate-process')
        return 'error';
    return 'offline';
}
function formatBytes(bytes) {
    if (bytes < 1024 ** 2)
        return `${(bytes / 1024).toFixed(1)} KiB`;
    if (bytes < 1024 ** 3)
        return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
}
function fileName(path) {
    return path.split(/[\\/]/u).at(-1) ?? path;
}
function samePath(left, right) {
    return left.replaceAll('/', '\\').toLowerCase() === right.replaceAll('/', '\\').toLowerCase();
}
function activeEngineInstall(release) {
    return release !== null && ['checking', 'downloading', 'verifying', 'extracting', 'finalizing'].includes(release.install.stage);
}
function activeModelDownload(download) {
    return download.stage === 'downloading';
}
function recommendationFor(model, recommendations) {
    return recommendations.find(item => (item.kind === model.kind
        && item.family === model.family
        && (item.files.some(file => file.name.toLowerCase() === fileName(model.path).toLowerCase()) || item.totalBytes === model.sizeBytes)));
}
function libraryRows(models, recommendations) {
    const installedRecommendations = new Set();
    const rows = models.map((model) => {
        const recommendation = recommendationFor(model, recommendations);
        if (recommendation !== undefined)
            installedRecommendations.add(recommendation.id);
        return {
            key: `local:${model.id}`,
            family: model.family,
            kind: model.kind,
            name: recommendation?.name ?? model.name,
            quantization: model.quantization,
            sizeBytes: model.sizeBytes,
            fileCount: model.fileCount,
            path: model.path,
            ...(recommendation === undefined ? {} : { recommendation }),
        };
    });
    for (const recommendation of recommendations) {
        if (installedRecommendations.has(recommendation.id))
            continue;
        rows.push({
            key: `recommended:${recommendation.id}`,
            family: recommendation.family,
            kind: recommendation.kind,
            name: recommendation.name,
            quantization: recommendation.quantization,
            sizeBytes: recommendation.totalBytes,
            fileCount: recommendation.files.length,
            recommendation,
        });
    }
    const rank = { main: 0, vision: 1, mtp: 2, embedding: 3 };
    const familyRank = new Map();
    for (const recommendation of recommendations) {
        if (!familyRank.has(recommendation.family))
            familyRank.set(recommendation.family, familyRank.size);
    }
    return rows.sort((left, right) => ((familyRank.get(left.family) ?? Number.MAX_SAFE_INTEGER) - (familyRank.get(right.family) ?? Number.MAX_SAFE_INTEGER)
        || left.family.localeCompare(right.family, undefined, { numeric: true, sensitivity: 'base' })
        || rank[left.kind] - rank[right.kind]
        || left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' })));
}
function pathForKind(setup, kind) {
    if (kind === 'main')
        return setup.model;
    if (kind === 'vision')
        return setup.visionModel;
    if (kind === 'embedding')
        return setup.embeddingModel;
    return setup.mtpModel;
}
function ModelSelection({ kind, path, disabled, t, onChoose, onClear }) {
    const label = kind === 'main' ? t('mainModel')
        : kind === 'vision' ? t('visionModel')
            : kind === 'embedding' ? t('embeddingModel') : t('mtpModel');
    return (_jsxs("div", { className: "m4a-current-model", children: [_jsxs("div", { className: "m4a-current-model__body", children: [_jsx("span", { className: "m4a-settings__label", children: label }), _jsx("strong", { children: path === '' ? t('notSelected') : fileName(path) }), path === '' ? null : _jsx("code", { title: path, children: path })] }), _jsxs("div", { className: "m4a-current-model__actions", children: [_jsx("button", { type: "button", className: "m4a-settings__button", disabled: disabled, onClick: onChoose, children: t('chooseFile') }), kind === 'main' || path === '' ? null : (_jsx("button", { type: "button", className: "m4a-settings__button", disabled: disabled, onClick: onClear, children: t('removeSelection') }))] })] }));
}
export function Moe4AllSettings(props) {
    const { t, useMoe4AllSettings, save, pickDirectory } = props;
    const snapshot = useMoe4AllSettings(value => value);
    const initial = snapshot.value === undefined ? null : resolved(snapshot.value);
    const [draft, setDraft] = useState(initial);
    const [setup, setSetup] = useState(() => parseEngineArguments(initial?.arguments ?? []));
    const [saving, setSaving] = useState(false);
    const [acting, setActing] = useState(false);
    const [status, setStatus] = useState(null);
    const [release, setRelease] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [library, setLibrary] = useState({ directory: '', models: [] });
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [modelDownload, setModelDownload] = useState({ stage: 'idle', downloadedBytes: 0 });
    const [nativeFilePicker, setNativeFilePicker] = useState(false);
    const [engineInstalling, setEngineInstalling] = useState(false);
    const [modelDownloading, setModelDownloading] = useState(false);
    const [error, setError] = useState('');
    const [confirmBusy, setConfirmBusy] = useState(false);
    useEffect(() => {
        if (!saving && snapshot.value !== undefined) {
            const next = resolved(snapshot.value);
            setDraft(next);
            setSetup(parseEngineArguments(next.arguments));
        }
    }, [saving, snapshot.revision, snapshot.value]);
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
        const timer = window.setInterval(() => { void poll(); }, 2000);
        return () => { disposed = true; window.clearInterval(timer); };
    }, []);
    useEffect(() => {
        let disposed = false;
        void fetchReleaseStatus().then(next => { if (!disposed)
            setRelease(next); }).catch(cause => {
            if (!disposed)
                setError(cause instanceof Error ? cause.message : String(cause));
        });
        void fetchModelCatalog().then(next => {
            if (disposed)
                return;
            setRecommendations(next.models);
            setModelDownload(next.download);
            setNativeFilePicker(next.capabilities.nativeFilePicker);
        }).catch(cause => {
            if (!disposed)
                setError(cause instanceof Error ? cause.message : String(cause));
        });
        return () => { disposed = true; };
    }, []);
    const selectedPaths = useMemo(() => [setup.model, setup.visionModel, setup.embeddingModel, setup.mtpModel].filter(Boolean), [setup]);
    const refreshLibrary = useCallback(async (directory = draft?.modelDirectory ?? '', paths = selectedPaths) => {
        setLibraryLoading(true);
        try {
            setLibrary(await scanModelLibrary(directory, paths));
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
        finally {
            setLibraryLoading(false);
        }
    }, [draft?.modelDirectory, selectedPaths]);
    useEffect(() => { void refreshLibrary(); }, [snapshot.revision]);
    const current = snapshot.value === undefined ? null : resolved(snapshot.value);
    const currentSetup = current === null ? null : parseEngineArguments(current.arguments);
    const dirty = draft !== null && current !== null && (!same(draft, current) || !same(setup, currentSetup));
    const rows = useMemo(() => libraryRows(library.models, recommendations), [library.models, recommendations]);
    const groupedRows = useMemo(() => {
        const result = new Map();
        for (const row of rows)
            result.set(row.family, [...(result.get(row.family) ?? []), row]);
        return [...result.entries()];
    }, [rows]);
    if (snapshot.status === 'loading' || draft === null)
        return _jsx("p", { className: "m4a-settings__message", children: t('loading') });
    if (snapshot.status === 'unavailable')
        return _jsx("p", { className: "m4a-settings__message", children: t('unavailable') });
    const disabled = saving || acting || !snapshot.writable;
    const setField = (field, value) => {
        setDraft(previous => previous === null ? previous : { ...previous, [field]: value });
    };
    const numberField = (field, value) => {
        const parsed = Number(value);
        if (Number.isFinite(parsed))
            setField(field, parsed);
    };
    const setSetupField = (field, value) => {
        setSetup(previous => ({ ...previous, [field]: value }));
    };
    const persist = async (next) => {
        setSaving(true);
        setError('');
        try {
            await save(next);
        }
        finally {
            setSaving(false);
        }
    };
    const composed = async () => {
        if (draft.mode === 'connect')
            return draft;
        const paths = await validateModelPaths({
            main: setup.model,
            ...(setup.visionModel === '' ? {} : { vision: setup.visionModel }),
            ...(setup.embeddingModel === '' ? {} : { embedding: setup.embeddingModel }),
            ...(setup.mtp && setup.mtpModel !== '' ? { mtp: setup.mtpModel } : {}),
        });
        const arguments_ = buildEngineArguments({
            model: paths.main,
            ...(paths.vision === undefined ? {} : { visionModel: paths.vision }),
            ...(paths.embedding === undefined ? {} : { embeddingModel: paths.embedding, embeddingIdleTimeout: setup.embeddingIdleTimeout }),
            ...(paths.mtp === undefined ? {} : { mtpModel: paths.mtp }),
            host: draft.host,
            port: draft.port,
            contextWindow: draft.contextWindow,
            maxTokens: draft.maxTokens,
            parallel: setup.parallel,
            profile: setup.profile,
            mtp: setup.mtp,
            ...(setup.sessionCacheEnabled ? { sessionCache: setup.sessionCache } : {}),
        });
        return { ...draft, arguments: arguments_, vision: paths.vision !== undefined };
    };
    const submit = async () => {
        setError('');
        try {
            const next = await composed();
            setDraft(next);
            await persist(next);
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
    };
    const launch = async (force = false) => {
        setActing(true);
        setError('');
        try {
            if (dirty) {
                const next = await composed();
                setDraft(next);
                await persist(next);
                await new Promise(resolve => window.setTimeout(resolve, 700));
            }
            const result = await startEngine(force);
            setStatus(result.status);
            setConfirmBusy(result.status.phase === 'resource-warning');
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
        finally {
            setActing(false);
        }
    };
    const monitorEngineInstall = async () => {
        while (true) {
            await new Promise(resolve => window.setTimeout(resolve, 500));
            const next = await fetchReleaseStatus();
            setRelease(next);
            if (activeEngineInstall(next))
                continue;
            if (next.install.stage === 'error')
                throw new Error(next.install.error ?? t('downloadFailed'));
            if (next.install.stage === 'cancelled')
                return;
            if (next.install.stage === 'complete' && next.installed !== undefined) {
                const updated = { ...draft, executable: next.installed.executable, workingDirectory: next.installed.workingDirectory };
                setDraft(updated);
                await persist(updated);
            }
            return;
        }
    };
    const installEngine = async () => {
        setEngineInstalling(true);
        setError('');
        try {
            await installLatestEngine();
            await monitorEngineInstall();
            setRelease(await fetchReleaseStatus(true));
            setStatus(await fetchEngineStatus());
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
            try {
                setRelease(await fetchReleaseStatus());
            }
            catch { }
        }
        finally {
            setEngineInstalling(false);
        }
    };
    const stopEngineInstall = async () => {
        try {
            const install = await cancelEngineInstall();
            setRelease(previous => previous === null ? previous : { ...previous, install });
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
    };
    const removeEngine = async () => {
        const selected = release?.versions.find(item => samePath(item.executable, draft.executable));
        if (selected === undefined)
            return;
        if (!window.confirm(t('confirmDeleteEngine')))
            return;
        setActing(true);
        setError('');
        try {
            await deleteEngineVersion(selected.tag);
            const nextRelease = await fetchReleaseStatus(true);
            setRelease(nextRelease);
            const persistedExecutable = current?.executable ?? '';
            const fallback = nextRelease.versions.find(item => samePath(item.executable, persistedExecutable))
                ?? nextRelease.versions[0];
            setDraft(previous => previous === null ? previous : {
                ...previous,
                executable: fallback?.executable ?? '',
                workingDirectory: fallback?.workingDirectory ?? '',
            });
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
        finally {
            setActing(false);
        }
    };
    const selectEngine = (executable) => {
        const version = release?.versions.find(item => samePath(item.executable, executable));
        setDraft(previous => previous === null ? previous : {
            ...previous,
            executable,
            workingDirectory: version?.workingDirectory ?? previous.workingDirectory,
        });
    };
    const chooseLibraryDirectory = async () => {
        const directory = await pickDirectory();
        if (directory === null)
            return;
        setField('modelDirectory', directory);
        await refreshLibrary(directory);
    };
    const chooseModelFile = async (kind) => {
        try {
            const path = await pickModelFile();
            if (path === undefined)
                return;
            if (kind === 'main')
                setSetupField('model', path);
            else if (kind === 'vision')
                setSetupField('visionModel', path);
            else if (kind === 'embedding')
                setSetupField('embeddingModel', path);
            else
                setSetup(previous => ({ ...previous, mtpModel: path, mtp: true }));
            await refreshLibrary(draft.modelDirectory, [...selectedPaths, path]);
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
    };
    const useModel = (row) => {
        if (row.path === undefined)
            return;
        if (row.kind === 'main') {
            const related = rows.filter(item => item.path !== undefined && item.family === row.family);
            setSetup(previous => ({
                ...previous,
                model: row.path,
                visionModel: previous.visionModel || related.find(item => item.kind === 'vision')?.path || '',
                mtpModel: previous.mtpModel || related.find(item => item.kind === 'mtp')?.path || '',
            }));
        }
        else if (row.kind === 'vision')
            setSetupField('visionModel', row.path);
        else if (row.kind === 'embedding')
            setSetupField('embeddingModel', row.path);
        else
            setSetup(previous => ({ ...previous, mtpModel: row.path, mtp: true }));
    };
    const monitorModelDownload = async () => {
        while (true) {
            await new Promise(resolve => window.setTimeout(resolve, 500));
            const next = await fetchModelDownload();
            setModelDownload(next);
            if (activeModelDownload(next))
                continue;
            if (next.stage === 'error')
                throw new Error(next.error ?? t('downloadFailed'));
            if (next.stage === 'complete')
                await refreshLibrary();
            return;
        }
    };
    const downloadModel = async (model) => {
        if (draft.modelDirectory.trim() === '') {
            setError(t('modelDirectoryRequired'));
            return;
        }
        setModelDownloading(true);
        setError('');
        try {
            setModelDownload(await startModelDownload(model.id, draft.modelDirectory));
            await monitorModelDownload();
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
        finally {
            setModelDownloading(false);
        }
    };
    const stopModelDownload = async () => {
        try {
            setModelDownload(await cancelModelDownload());
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
    };
    const endpoint = draft.endpoint.trim() !== ''
        ? draft.endpoint.trim()
        : `${draft.protocol}://${draft.host}:${draft.port}${draft.apiBasePath.startsWith('/') ? draft.apiBasePath : `/${draft.apiBasePath}`}`;
    const selectedVersion = release?.versions.find(item => samePath(item.executable, draft.executable));
    const releaseAction = release?.install.stage === 'error' || release?.install.stage === 'cancelled'
        ? t('retryDownload')
        : release?.updateAvailable === true ? t('updateNow') : t('installLatest');
    const downloadRecommendation = recommendations.find(item => item.id === modelDownload.modelId);
    return (_jsxs("div", { className: "m4a-settings", children: [_jsxs("header", { className: "m4a-settings__header", children: [_jsx("h2", { className: "m4a-settings__title", children: t('title') }), _jsxs("div", { className: "m4a-settings__status", children: [_jsx("span", { className: `m4a-settings__dot m4a-settings__dot--${statusClass(status)}` }), _jsx("span", { children: status?.message ?? t('checkingEngine') }), _jsx("code", { className: "m4a-settings__endpoint", title: endpoint, children: endpoint })] }), error === '' ? null : _jsx("p", { className: "m4a-settings__error", children: error })] }), _jsxs("section", { className: "m4a-settings__engine-bar", children: [_jsxs("div", { className: "m4a-settings__engine-version", children: [_jsx("span", { className: "m4a-settings__label", children: t('engineVersion') }), _jsxs("select", { className: "m4a-settings__select", value: draft.executable, disabled: disabled || engineInstalling, onChange: event => { selectEngine(event.target.value); }, children: [_jsx("option", { value: "", children: t('engineNotInstalled') }), (release?.versions ?? []).map(version => _jsx("option", { value: version.executable, children: version.name }, `${version.tag}:${version.executable}`))] })] }), _jsxs("div", { className: "m4a-settings__runtime-actions", children: [_jsx("button", { type: "button", className: "m4a-settings__button m4a-settings__button--primary", disabled: disabled || status?.ready === true || status?.phase === 'starting', onClick: () => { void launch(false); }, children: acting ? t('working') : dirty ? t('saveAndStart') : t('startNow') }), _jsx("button", { type: "button", className: "m4a-settings__button", disabled: disabled || engineInstalling, onClick: () => { void installEngine(); }, children: releaseAction }), _jsx("button", { type: "button", className: "m4a-settings__button", disabled: disabled || engineInstalling, onClick: () => {
                                    setActing(true);
                                    void fetchReleaseStatus(true).then(setRelease).catch(cause => { setError(cause instanceof Error ? cause.message : String(cause)); }).finally(() => { setActing(false); });
                                }, children: t('checkUpdates') }), _jsx("button", { type: "button", className: "m4a-settings__button m4a-settings__button--danger", disabled: disabled || selectedVersion === undefined || status?.ready === true || engineInstalling, onClick: () => { void removeEngine(); }, children: t('deleteEngine') })] }), release === null || (!activeEngineInstall(release) && release.install.stage === 'idle') ? null : (_jsxs("div", { className: "m4a-download-status", children: [_jsx("progress", { max: 100, value: release.install.percent }), _jsx("span", { children: release.install.message ?? release.install.error ?? release.install.stage }), release.install.totalBytes === undefined ? null : _jsxs("span", { children: [formatBytes(release.install.downloadedBytes), " / ", formatBytes(release.install.totalBytes)] }), activeEngineInstall(release) ? _jsx("button", { type: "button", className: "m4a-settings__button", onClick: () => { void stopEngineInstall(); }, children: t('stopDownload') }) : null] }))] }), _jsxs("div", { className: "m4a-model-workbench", children: [_jsxs("section", { className: "m4a-model-config", children: [_jsx("div", { className: "m4a-pane-heading", children: _jsxs("div", { children: [_jsx("h3", { children: t('currentConfiguration') }), _jsx("p", { children: t('currentConfigurationHint') })] }) }), _jsx("div", { className: "m4a-settings__segmented", role: "group", "aria-label": t('mode'), children: ['connect', 'prompt', 'auto'].map(mode => (_jsx("button", { type: "button", className: "m4a-settings__segment", "aria-pressed": draft.mode === mode, disabled: disabled, onClick: () => { setField('mode', mode); }, children: t(mode) }, mode))) }), draft.mode === 'connect' ? (_jsx("p", { className: "m4a-settings__hint", children: t('connectHint') })) : (_jsxs(_Fragment, { children: [_jsx(ModelSelection, { kind: "main", path: setup.model, disabled: disabled, t: t, onChoose: () => { void chooseModelFile('main'); }, onClear: () => { } }), _jsx(ModelSelection, { kind: "vision", path: setup.visionModel, disabled: disabled, t: t, onChoose: () => { void chooseModelFile('vision'); }, onClear: () => { setSetupField('visionModel', ''); } }), _jsx(ModelSelection, { kind: "mtp", path: setup.mtpModel, disabled: disabled, t: t, onChoose: () => { void chooseModelFile('mtp'); }, onClear: () => { setSetup(previous => ({ ...previous, mtpModel: '', mtp: false })); } }), _jsx(ModelSelection, { kind: "embedding", path: setup.embeddingModel, disabled: disabled, t: t, onChoose: () => { void chooseModelFile('embedding'); }, onClear: () => { setSetupField('embeddingModel', ''); } }), setup.embeddingModel === '' ? null : (_jsx(Field, { label: t('embeddingIdleTimeout'), children: _jsx("input", { className: "m4a-settings__input", type: "number", min: 0, value: setup.embeddingIdleTimeout, disabled: disabled, onChange: event => { setSetupField('embeddingIdleTimeout', Number(event.target.value) || 0); } }) })), _jsxs("div", { className: "m4a-settings__grid m4a-settings__grid--compact", children: [_jsx(Field, { label: t('contextWindow'), hint: t('tokenUnitHint'), children: _jsx(TokenInput, { value: draft.contextWindow, disabled: disabled, onChange: value => { setField('contextWindow', value); } }) }), _jsx(Field, { label: t('maxTokens'), hint: t('tokenUnitHint'), children: _jsx(TokenInput, { value: draft.maxTokens, disabled: disabled, onChange: value => { setField('maxTokens', value); } }) }), _jsx(Field, { label: t('parallelSlots'), children: _jsx("input", { className: "m4a-settings__input", type: "number", min: 1, value: setup.parallel, disabled: disabled, onChange: event => { setSetupField('parallel', Math.max(1, Number(event.target.value) || 1)); } }) }), _jsx(Field, { label: t('automaticProfile'), children: _jsxs("select", { className: "m4a-settings__select", value: setup.profile, disabled: disabled, onChange: event => { setSetupField('profile', event.target.value); }, children: [_jsx("option", { value: "conservative", children: t('conservativeProfile') }), _jsx("option", { value: "aggressive", children: t('aggressiveProfile') })] }) })] }), _jsx(Check, { checked: setup.mtp, disabled: disabled || setup.mtpModel === '', label: t('enableMtp'), onChange: value => { setSetupField('mtp', value); } }), _jsx(Check, { checked: setup.sessionCacheEnabled, disabled: disabled, label: t('enableSessionCache'), onChange: value => { setSetupField('sessionCacheEnabled', value); } }), setup.sessionCacheEnabled ? (_jsxs("div", { className: "m4a-settings__grid m4a-settings__grid--compact", children: [_jsx(Field, { label: t('sessionCachePath'), wide: true, children: _jsx("input", { className: "m4a-settings__input", value: setup.sessionCache.directory, disabled: disabled, onChange: event => { setSetupField('sessionCache', { ...setup.sessionCache, directory: event.target.value }); } }) }), _jsx(Field, { label: t('sessionCacheMax'), children: _jsx("input", { className: "m4a-settings__input", value: setup.sessionCache.maxSize, disabled: disabled, onChange: event => { setSetupField('sessionCache', { ...setup.sessionCache, maxSize: event.target.value }); } }) }), _jsx(Field, { label: t('sessionCacheIdle'), children: _jsx("input", { className: "m4a-settings__input", type: "number", min: 0, value: setup.sessionCache.idleSeconds, disabled: disabled, onChange: event => { setSetupField('sessionCache', { ...setup.sessionCache, idleSeconds: Number(event.target.value) || 0 }); } }) }), _jsx(Field, { label: t('sessionCacheTtl'), children: _jsx("input", { className: "m4a-settings__input", type: "number", min: 0, value: setup.sessionCache.ttlHours, disabled: disabled, onChange: event => { setSetupField('sessionCache', { ...setup.sessionCache, ttlHours: Number(event.target.value) || 0 }); } }) })] })) : null] }))] }), _jsxs("aside", { className: "m4a-model-library", children: [_jsxs("div", { className: "m4a-pane-heading", children: [_jsxs("div", { children: [_jsx("h3", { children: t('modelLibrary') }), _jsx("p", { children: t('modelLibraryHint') })] }), _jsx("button", { type: "button", className: "m4a-settings__button", disabled: disabled || libraryLoading, onClick: () => { void refreshLibrary(); }, children: libraryLoading ? t('scanning') : t('rescan') })] }), _jsxs("div", { className: "m4a-library-directory", children: [_jsx("input", { className: "m4a-settings__input", value: draft.modelDirectory, disabled: disabled || modelDownloading, placeholder: "D:\\\\Models", onChange: event => { setField('modelDirectory', event.target.value); } }), _jsx("button", { type: "button", className: "m4a-settings__button", disabled: disabled || modelDownloading, onClick: () => { void chooseLibraryDirectory(); }, children: t('chooseDirectory') })] }), groupedRows.length === 0 ? _jsx("p", { className: "m4a-settings__message", children: t('noModelsInLibrary') }) : groupedRows.map(([family, familyRows]) => (_jsxs("section", { className: "m4a-model-family", children: [_jsx("h4", { children: family }), _jsx("div", { className: "m4a-model-family__items", children: familyRows.map(row => {
                                            const selected = row.path !== undefined && samePath(pathForKind(setup, row.kind), row.path);
                                            const downloading = row.recommendation?.id === modelDownload.modelId && activeModelDownload(modelDownload);
                                            const retry = row.recommendation?.id === modelDownload.modelId && (modelDownload.stage === 'error' || modelDownload.stage === 'cancelled');
                                            return (_jsxs("article", { className: `m4a-model-item${selected ? ' m4a-model-item--selected' : ''}`, children: [_jsxs("div", { className: "m4a-model-item__topline", children: [_jsx("span", { className: `m4a-model-item__kind m4a-model-item__kind--${row.kind}`, children: t(row.kind === 'main' ? 'mainModel' : row.kind === 'vision' ? 'visionModel' : row.kind === 'mtp' ? 'mtpModel' : 'embeddingModel') }), row.recommendation === undefined ? null : _jsx("span", { className: "m4a-model-item__recommended", children: t('recommended') }), row.path === undefined ? _jsx("span", { className: "m4a-model-item__remote", children: t('notDownloaded') }) : null] }), _jsx("strong", { children: row.name }), _jsxs("div", { className: "m4a-model-item__meta", children: [_jsx("span", { children: row.quantization }), _jsx("span", { children: formatBytes(row.sizeBytes) }), row.fileCount <= 1 ? null : _jsxs("span", { children: [row.fileCount, " ", t('files')] })] }), row.path === undefined ? null : _jsx("code", { title: row.path, children: row.path }), downloading ? (_jsxs("div", { className: "m4a-model-item__download", children: [_jsx("progress", { max: 100, value: modelDownload.percent }), _jsxs("span", { children: [formatBytes(modelDownload.downloadedBytes), " / ", formatBytes(modelDownload.totalBytes ?? row.sizeBytes)] }), _jsx("button", { type: "button", className: "m4a-settings__button", onClick: () => { void stopModelDownload(); }, children: t('stopDownload') })] })) : (_jsxs("div", { className: "m4a-model-item__actions", children: [row.path === undefined ? (_jsx("button", { type: "button", className: "m4a-settings__button m4a-settings__button--primary", disabled: disabled || modelDownloading || draft.modelDirectory.trim() === '', onClick: () => { if (row.recommendation !== undefined)
                                                                    void downloadModel(row.recommendation); }, children: retry ? t('retryDownload') : t('downloadRecommended') })) : (_jsx("button", { type: "button", className: "m4a-settings__button", disabled: disabled || selected, onClick: () => { useModel(row); }, children: selected ? t('selected') : t('useModel') })), row.recommendation === undefined ? null : _jsx("a", { href: row.recommendation.sourceUrl, target: "_blank", rel: "noreferrer", children: t('sourcePage') })] }))] }, row.key));
                                        }) })] }, family))), downloadRecommendation === undefined || modelDownload.stage === 'idle' || activeModelDownload(modelDownload) ? null : (_jsxs("p", { className: modelDownload.stage === 'error' ? 'm4a-settings__error' : 'm4a-settings__hint', children: [downloadRecommendation.name, ": ", modelDownload.error ?? modelDownload.stage] }))] })] }), _jsxs("details", { className: "m4a-settings__details", open: draft.mode === 'connect', children: [_jsx("summary", { children: t('connection') }), _jsxs("div", { className: "m4a-settings__grid", children: [_jsx(Field, { label: t('protocol'), children: _jsxs("select", { className: "m4a-settings__select", value: draft.protocol, disabled: disabled, onChange: event => { setField('protocol', event.target.value); }, children: [_jsx("option", { value: "http", children: "HTTP" }), _jsx("option", { value: "https", children: "HTTPS" })] }) }), _jsx(Field, { label: t('host'), children: _jsx("input", { className: "m4a-settings__input", value: draft.host, disabled: disabled, onChange: event => { setField('host', event.target.value); } }) }), _jsx(Field, { label: t('port'), children: _jsx("input", { className: "m4a-settings__input", type: "number", min: 1, max: 65535, value: draft.port, disabled: disabled, onChange: event => { numberField('port', event.target.value); } }) }), _jsx(Field, { label: t('apiBasePath'), children: _jsx("input", { className: "m4a-settings__input", value: draft.apiBasePath, disabled: disabled, onChange: event => { setField('apiBasePath', event.target.value); } }) }), _jsx(Field, { label: t('endpoint'), hint: t('endpointHint'), wide: true, children: _jsx("input", { className: "m4a-settings__input", value: draft.endpoint, disabled: disabled, placeholder: "http://127.0.0.1:8080/v1", onChange: event => { setField('endpoint', event.target.value); } }) }), _jsx(Field, { label: t('apiKeyEnv'), wide: true, children: _jsx("input", { className: "m4a-settings__input", value: draft.apiKeyEnv, disabled: disabled, placeholder: "MOE4ALL_API_KEY", onChange: event => { setField('apiKeyEnv', event.target.value); } }) })] }), _jsx(Check, { checked: draft.allowRemoteEndpoint, disabled: disabled, label: t('allowRemoteEndpoint'), onChange: value => { setField('allowRemoteEndpoint', value); } })] }), _jsxs("details", { className: "m4a-settings__details", children: [_jsx("summary", { children: t('advanced') }), _jsxs("div", { className: "m4a-settings__grid", children: [_jsx(Field, { label: t('executable'), wide: true, children: _jsx("input", { className: "m4a-settings__input", value: draft.executable, disabled: disabled, onChange: event => { setField('executable', event.target.value); } }) }), _jsx(Field, { label: t('workingDirectory'), wide: true, children: _jsx("input", { className: "m4a-settings__input", value: draft.workingDirectory, disabled: disabled, onChange: event => { setField('workingDirectory', event.target.value); } }) }), _jsx(Field, { label: t('minimumFreeRam'), children: _jsxs("div", { className: "m4a-settings__percentage", children: [_jsx("input", { type: "range", min: 0, max: 1, step: 0.05, value: draft.minimumFreeRamFraction, disabled: disabled, onChange: event => { numberField('minimumFreeRamFraction', event.target.value); } }), _jsxs("output", { children: [Math.round(draft.minimumFreeRamFraction * 100), "%"] })] }) }), _jsx(Field, { label: t('minimumFreeVram'), children: _jsxs("div", { className: "m4a-settings__percentage", children: [_jsx("input", { type: "range", min: 0, max: 1, step: 0.05, value: draft.minimumFreeVramFraction, disabled: disabled, onChange: event => { numberField('minimumFreeVramFraction', event.target.value); } }), _jsxs("output", { children: [Math.round(draft.minimumFreeVramFraction * 100), "%"] })] }) })] }), _jsx(Check, { checked: draft.stopOnUnload, disabled: disabled, label: t('stopOnUnload'), onChange: value => { setField('stopOnUnload', value); } }), _jsx(Check, { checked: draft.logOutput, disabled: disabled, label: t('logOutput'), onChange: value => { setField('logOutput', value); } })] }), _jsxs("div", { className: "m4a-settings__actions", children: [_jsx("span", { className: "m4a-settings__save-state", children: !snapshot.writable ? t('readOnly') : dirty ? t('unsaved') : t('saved') }), _jsx("button", { type: "button", className: "m4a-settings__button", disabled: disabled || !dirty || current === null, onClick: () => { if (current !== null) {
                            setDraft(current);
                            setSetup(parseEngineArguments(current.arguments));
                        } }, children: t('revert') }), _jsx("button", { type: "button", className: "m4a-settings__button m4a-settings__button--primary", disabled: disabled || !dirty, onClick: () => { void submit(); }, children: saving ? t('saving') : t('save') })] }), !confirmBusy ? null : (_jsx("div", { className: "m4a-overlay", role: "presentation", children: _jsxs("section", { className: "m4a-overlay__dialog", role: "alertdialog", "aria-modal": "true", "aria-labelledby": "m4a-busy-title", children: [_jsx("h2", { id: "m4a-busy-title", className: "m4a-overlay__title", children: t('resourceWarningTitle') }), _jsx("p", { className: "m4a-overlay__body", children: t('resourceWarningBody') }), _jsx("ul", { className: "m4a-overlay__reasons", children: (status?.reasons ?? []).map(reason => _jsx("li", { children: reason }, reason)) }), _jsxs("div", { className: "m4a-overlay__actions", children: [_jsx("button", { type: "button", className: "m4a-settings__button", disabled: acting, onClick: () => { setConfirmBusy(false); }, children: t('cancel') }), _jsx("button", { type: "button", className: "m4a-settings__button m4a-settings__button--danger", disabled: acting, onClick: () => { void launch(true); }, children: acting ? t('startingNow') : t('startAnyway') })] })] }) }))] }));
}
//# sourceMappingURL=Moe4AllSettings.js.map