import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useSyncExternalStore } from 'react';
import { fetchEngineStatus, fetchReleaseStatus, installLatestEngine, installLocalEngine, scanModelPath, startEngine, validateModelPaths } from './engine-api.js';
import { buildEngineArguments } from './engine-setup.js';
import { formatTokenValue, parseTokenValue } from './token-value.js';
const OFFICIAL_RELEASES = 'https://github.com/Headmaster218/MoE4All/releases/latest';
const RECOMMENDED_FLASH = 'https://huggingface.co/AtomicChat/Qwen3.8-Flash-Next-GGUF/tree/main/Qwen3.8-Flash-Next-AD-4.27bpw-Q4_K_M-M64';
const RECOMMENDED_35B = 'https://huggingface.co/mudler/Qwen3.6-35B-A3B-APEX-GGUF/resolve/main/Qwen3.6-35B-A3B-APEX-I-Balanced.gguf?download=true';
const RECOMMENDED_VISION = 'https://huggingface.co/AtomicChat/Qwen3.8-Flash-Next-GGUF/resolve/main/mmproj-Qwen3.8-Flash-Next-F16.gguf?download=true';
const RECOMMENDED_EMBEDDING = 'https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF/resolve/main/Qwen3-Embedding-0.6B-Q8_0.gguf?download=true';
const RECOMMENDED_MTP = 'https://huggingface.co/unsloth/Qwen3.8-Flash-Next-GGUF/resolve/main/MTP/mtp-Qwen3.8-Flash-Next-shared-Q4_K_M.gguf?download=true';
function effectiveMode(mode) {
    return mode === 'managed' ? 'prompt' : mode ?? 'prompt';
}
function ModalFrame({ title, children }) {
    return (_jsx("div", { className: "m4a-overlay", role: "presentation", children: _jsxs("section", { className: "m4a-overlay__dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "m4a-overlay-title", children: [_jsx("h2", { id: "m4a-overlay-title", className: "m4a-overlay__title", children: title }), children] }) }));
}
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 ** 2)
        return `${(bytes / 1024).toFixed(1)} KiB`;
    if (bytes < 1024 ** 3)
        return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
}
function progressText(value, t) {
    if (value.stage === 'downloading') {
        const total = value.totalBytes === undefined ? '' : ` / ${formatBytes(value.totalBytes)}`;
        const percent = value.percent === undefined ? '' : ` (${value.percent.toFixed(1)}%)`;
        return `${t('downloadingEngine')} ${formatBytes(value.downloadedBytes)}${total}${percent}`;
    }
    const labels = {
        checking: 'checkingDownload',
        verifying: 'verifyingDownload',
        extracting: 'extractingDownload',
        finalizing: 'finalizingDownload',
        complete: 'downloadComplete',
    };
    const label = labels[value.stage];
    return label === undefined ? t('installing') : t(label);
}
function activeInstall(value) {
    return value !== undefined && ['checking', 'downloading', 'verifying', 'extracting', 'finalizing'].includes(value.stage);
}
async function waitForRuntime() {
    await new Promise(resolve => window.setTimeout(resolve, 400));
    let status = await fetchEngineStatus();
    for (let attempt = 0; ['checking', 'missing-arguments'].includes(status.phase) && attempt < 20; attempt += 1) {
        await new Promise(resolve => window.setTimeout(resolve, 250));
        status = await fetchEngineStatus();
    }
    return status;
}
export function EngineStartupOverlay({ scope, t, pickDirectory }) {
    const snapshot = useSyncExternalStore(listener => scope.subscribe(listener), () => scope.getSnapshot(), () => scope.getSnapshot());
    const config = snapshot.value;
    const [status, setStatus] = useState(null);
    const [release, setRelease] = useState(null);
    const [busy, setBusy] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [updateDismissed, setUpdateDismissed] = useState(false);
    const [error, setError] = useState('');
    const [localPath, setLocalPath] = useState('');
    const [setupInitialized, setSetupInitialized] = useState(false);
    const [modelPath, setModelPath] = useState('');
    const [modelChoices, setModelChoices] = useState([]);
    const [visionEnabled, setVisionEnabled] = useState(false);
    const [visionPath, setVisionPath] = useState('');
    const [embeddingEnabled, setEmbeddingEnabled] = useState(false);
    const [embeddingPath, setEmbeddingPath] = useState('');
    const [embeddingIdleTimeout, setEmbeddingIdleTimeout] = useState('60');
    const [setupHost, setSetupHost] = useState('127.0.0.1');
    const [setupPort, setSetupPort] = useState('8080');
    const [setupContext, setSetupContext] = useState('256k');
    const [setupMaxTokens, setSetupMaxTokens] = useState('100k');
    const [setupParallel, setSetupParallel] = useState('1');
    const [setupProfile, setSetupProfile] = useState('conservative');
    const [setupMtp, setSetupMtp] = useState(false);
    const [mtpPath, setMtpPath] = useState('');
    const [sessionCacheEnabled, setSessionCacheEnabled] = useState(true);
    const [sessionCachePath, setSessionCachePath] = useState('kv-sessions');
    const [sessionCacheMax, setSessionCacheMax] = useState('10g');
    const [sessionCacheIdle, setSessionCacheIdle] = useState('90');
    const [sessionCacheTtl, setSessionCacheTtl] = useState('24');
    const [setupAutoStart, setSetupAutoStart] = useState(false);
    const refresh = async () => {
        try {
            setStatus(await fetchEngineStatus());
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
    };
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
        return () => {
            disposed = true;
            window.clearInterval(timer);
        };
    }, []);
    useEffect(() => {
        let disposed = false;
        void fetchReleaseStatus().then((next) => {
            if (!disposed)
                setRelease(next);
        }).catch((cause) => {
            if (!disposed)
                setError(cause instanceof Error ? cause.message : String(cause));
        });
        return () => { disposed = true; };
    }, []);
    useEffect(() => {
        if (config === undefined || status?.phase !== 'missing-arguments' || setupInitialized)
            return;
        setSetupHost(config.host ?? '127.0.0.1');
        setSetupPort(String(config.port ?? 8080));
        setSetupContext(formatTokenValue(config.contextWindow ?? 262_144));
        setSetupMaxTokens(formatTokenValue(config.maxTokens ?? 102_400));
        setSetupProfile(config.arguments?.includes('device.auto_profile=aggressive') === true ? 'aggressive' : 'conservative');
        setSetupMtp(config.arguments?.includes('spec.mtp=true') === true);
        setSetupAutoStart(effectiveMode(config.mode) === 'auto');
        setSetupInitialized(true);
    }, [config, setupInitialized, status?.phase]);
    if (config === undefined || status === null)
        return null;
    const mode = effectiveMode(config.mode);
    if (mode === 'connect')
        return null;
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
    const applyInstalled = async (installed) => {
        await Promise.all([
            scope.set('executable', installed.executable),
            scope.set('workingDirectory', installed.workingDirectory),
        ]);
        try {
            setRelease(await fetchReleaseStatus(true));
        }
        catch { }
        await new Promise(resolve => window.setTimeout(resolve, 700));
        await refresh();
        if ((config.arguments?.length ?? 0) > 0)
            setUpdateDismissed(true);
    };
    const install = async (source) => {
        setBusy(true);
        setError('');
        const timer = window.setInterval(() => {
            void fetchReleaseStatus().then(setRelease).catch(() => { });
        }, 350);
        try {
            const installed = source === 'official'
                ? await installLatestEngine()
                : await installLocalEngine(localPath);
            await applyInstalled(installed);
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
            try {
                setRelease(await fetchReleaseStatus());
            }
            catch { }
        }
        finally {
            window.clearInterval(timer);
            setBusy(false);
        }
    };
    const applyDiscoveredFiles = (files, target = 'main') => {
        if (target === 'main') {
            setModelChoices(files.main);
            const selected = files.selected !== undefined && files.main.includes(files.selected)
                ? files.selected
                : files.main[0];
            if (selected !== undefined)
                setModelPath(selected);
            if (files.vision[0] !== undefined) {
                setVisionPath(files.vision[0]);
                setVisionEnabled(true);
            }
            if (files.embedding[0] !== undefined) {
                setEmbeddingPath(files.embedding[0]);
                setEmbeddingEnabled(true);
            }
            if (files.mtp[0] !== undefined)
                setMtpPath(files.mtp[0]);
            return;
        }
        const selected = files.selected !== undefined && files[target].includes(files.selected)
            ? files.selected
            : files[target][0];
        if (selected === undefined) {
            const key = target === 'vision' ? 'noVisionFound' : target === 'embedding' ? 'noEmbeddingFound' : 'noMtpFound';
            throw new Error(t(key));
        }
        if (target === 'vision') {
            setVisionPath(selected);
            setVisionEnabled(true);
        }
        else if (target === 'embedding') {
            setEmbeddingPath(selected);
            setEmbeddingEnabled(true);
        }
        else {
            setMtpPath(selected);
            setSetupMtp(true);
        }
    };
    const discover = async (path, target = 'main') => {
        setBusy(true);
        setError('');
        try {
            applyDiscoveredFiles(await scanModelPath(path), target);
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
        finally {
            setBusy(false);
        }
    };
    const chooseModelDirectory = async (target = 'main') => {
        try {
            const directory = await pickDirectory();
            if (directory !== null)
                await discover(directory, target);
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
    };
    const saveSetupAndStart = async () => {
        setBusy(true);
        setError('');
        try {
            const contextWindow = parseTokenValue(setupContext);
            if (contextWindow === undefined)
                throw new Error(t('invalidContext'));
            const maxTokens = parseTokenValue(setupMaxTokens);
            if (maxTokens === undefined)
                throw new Error(t('invalidMaxTokens'));
            const port = Number(setupPort);
            const parallel = Number(setupParallel);
            if (visionEnabled && visionPath.trim() === '')
                throw new Error(t('visionPathRequired'));
            if (embeddingEnabled && embeddingPath.trim() === '')
                throw new Error(t('embeddingPathRequired'));
            if (setupMtp && mtpPath.trim() === '')
                throw new Error(t('mtpPathRequired'));
            const paths = await validateModelPaths({
                main: modelPath,
                ...(visionEnabled ? { vision: visionPath } : {}),
                ...(embeddingEnabled ? { embedding: embeddingPath } : {}),
                ...(setupMtp ? { mtp: mtpPath } : {}),
            });
            const arguments_ = buildEngineArguments({
                model: paths.main,
                ...(paths.vision === undefined ? {} : { visionModel: paths.vision }),
                ...(paths.embedding === undefined ? {} : {
                    embeddingModel: paths.embedding,
                    embeddingIdleTimeout: Number(embeddingIdleTimeout),
                }),
                ...(paths.mtp === undefined ? {} : { mtpModel: paths.mtp }),
                host: setupHost,
                port,
                contextWindow,
                maxTokens,
                parallel,
                profile: setupProfile,
                mtp: setupMtp,
                ...(sessionCacheEnabled ? {
                    sessionCache: {
                        directory: sessionCachePath,
                        maxSize: sessionCacheMax,
                        idleSeconds: Number(sessionCacheIdle),
                        ttlHours: Number(sessionCacheTtl),
                    },
                } : {}),
            });
            await Promise.all([
                scope.set('mode', setupAutoStart ? 'auto' : 'prompt'),
                scope.set('protocol', 'http'),
                scope.set('host', setupHost.trim()),
                scope.set('port', port),
                scope.set('apiBasePath', '/v1'),
                scope.set('endpoint', ''),
                scope.set('arguments', arguments_),
                scope.set('contextWindow', contextWindow),
                scope.set('maxTokens', maxTokens),
                scope.set('vision', visionEnabled),
            ]);
            const ready = await waitForRuntime();
            setStatus(ready);
            const result = await startEngine(false);
            setStatus(result.status);
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
    if (status.phase === 'resource-warning' && !dismissed) {
        return (_jsxs(ModalFrame, { title: t('resourceWarningTitle'), children: [_jsx("p", { className: "m4a-overlay__body", children: t('resourceWarningBody') }), _jsx("ul", { className: "m4a-overlay__reasons", children: (status.reasons ?? []).map(reason => _jsx("li", { children: reason }, reason)) }), error === '' ? null : _jsx("p", { className: "m4a-overlay__error", children: error }), _jsxs("div", { className: "m4a-overlay__actions", children: [_jsx("button", { type: "button", className: "m4a-settings__button", disabled: busy, onClick: () => { setDismissed(true); }, children: t('notNow') }), _jsx("button", { type: "button", className: "m4a-settings__button m4a-settings__button--danger", disabled: busy, onClick: () => { void launch(true); }, children: busy ? t('startingNow') : t('startAnyway') })] })] }));
    }
    if (status.phase === 'missing-executable' && !dismissed) {
        const installState = release?.install;
        const installing = busy || activeInstall(installState);
        const installError = error || installState?.error || '';
        return (_jsxs(ModalFrame, { title: t('installTitle'), children: [_jsx("p", { className: "m4a-overlay__body", children: t('installBody') }), release?.latest === undefined ? null : _jsx("p", { className: "m4a-overlay__version", children: release.latest.name }), !installing || installState === undefined ? null : (_jsxs("div", { className: "m4a-overlay__progress", children: [_jsx("progress", { max: 100, value: installState.percent }), _jsx("span", { children: progressText(installState, t) })] })), installError === '' ? null : _jsx("p", { className: "m4a-overlay__error", children: installError }), _jsxs("div", { className: "m4a-overlay__links", children: [_jsx("a", { href: release?.latest?.pageUrl ?? OFFICIAL_RELEASES, target: "_blank", rel: "noreferrer", children: t('openReleasePage') }), release?.latest?.archive.browser_download_url === undefined ? null : _jsx("a", { href: release.latest.archive.browser_download_url, target: "_blank", rel: "noreferrer", children: t('downloadInBrowser') })] }), _jsxs("label", { className: "m4a-settings__field m4a-overlay__local-path", children: [_jsx("span", { className: "m4a-settings__label", children: t('localDownloadPath') }), _jsx("input", { className: "m4a-settings__input", value: localPath, disabled: installing, spellCheck: false, placeholder: "C:\\\\Downloads\\\\MoE4All-Windows-x86_64-v0.8.0.zip", onChange: event => { setLocalPath(event.target.value); } }), _jsx("span", { className: "m4a-settings__hint", children: t('localDownloadHint') })] }), _jsxs("div", { className: "m4a-overlay__actions m4a-overlay__actions--install", children: [_jsx("button", { type: "button", className: "m4a-settings__button", disabled: installing, onClick: () => { setDismissed(true); }, children: t('notNow') }), _jsx("button", { type: "button", className: "m4a-settings__button", disabled: installing || localPath.trim() === '', onClick: () => { void install('local'); }, children: t('useLocalDownload') }), _jsx("button", { type: "button", className: "m4a-settings__button m4a-settings__button--primary", disabled: installing, onClick: () => { void install('official'); }, children: installing ? t('installing') : installError === '' ? t('installLatest') : t('retryDownload') })] })] }));
    }
    if (status.phase === 'missing-arguments' && !dismissed) {
        const contextValid = parseTokenValue(setupContext) !== undefined;
        const maxTokensValid = parseTokenValue(setupMaxTokens) !== undefined;
        return (_jsxs(ModalFrame, { title: t('setupTitle'), children: [_jsx("p", { className: "m4a-overlay__body", children: t('setupBody') }), _jsxs("section", { className: "m4a-overlay__section", children: [_jsxs("div", { className: "m4a-overlay__section-heading", children: [_jsx("h3", { children: t('modelsAndFeatures') }), _jsxs("div", { className: "m4a-overlay__download-links", children: [_jsx("a", { className: "m4a-settings__button m4a-settings__button--link", href: RECOMMENDED_FLASH, target: "_blank", rel: "noreferrer", children: t('downloadFlash') }), _jsx("a", { className: "m4a-settings__button m4a-settings__button--link", href: RECOMMENDED_35B, target: "_blank", rel: "noreferrer", children: t('download35b') })] })] }), _jsxs("div", { className: "m4a-settings__field", children: [_jsx("span", { className: "m4a-settings__label", children: t('modelPath') }), _jsxs("div", { className: "m4a-overlay__path-row", children: [_jsx("input", { className: "m4a-settings__input", value: modelPath, disabled: busy, spellCheck: false, placeholder: "D:\\\\Models\\\\model.gguf", onChange: event => { setModelPath(event.target.value); } }), _jsx("button", { type: "button", className: "m4a-settings__button", disabled: busy, onClick: () => { void chooseModelDirectory('main'); }, children: t('chooseDirectory') }), _jsx("button", { type: "button", className: "m4a-settings__button", disabled: busy || modelPath.trim() === '', onClick: () => { void discover(modelPath); }, children: t('scanDirectory') })] }), modelChoices.length < 2 ? null : (_jsxs("select", { className: "m4a-settings__select", value: modelChoices.includes(modelPath) ? modelPath : '', disabled: busy, onChange: event => { setModelPath(event.target.value); }, children: [_jsx("option", { value: "", children: t('selectDetectedModel') }), modelChoices.map(path => _jsx("option", { value: path, children: path }, path))] }))] }), _jsxs("div", { className: "m4a-overlay__optional-model", children: [_jsxs("label", { className: "m4a-settings__check", children: [_jsx("input", { type: "checkbox", checked: visionEnabled, disabled: busy, onChange: event => { setVisionEnabled(event.target.checked); } }), _jsx("span", { children: t('enableVision') })] }), _jsx("a", { className: "m4a-settings__button m4a-settings__button--link", href: RECOMMENDED_VISION, target: "_blank", rel: "noreferrer", children: t('downloadVision') })] }), visionEnabled ? (_jsxs("div", { className: "m4a-overlay__path-row", children: [_jsx("input", { className: "m4a-settings__input", value: visionPath, disabled: busy, spellCheck: false, placeholder: "D:\\\\Models\\\\mmproj.gguf", onChange: event => { setVisionPath(event.target.value); } }), _jsx("button", { type: "button", className: "m4a-settings__button", disabled: busy, onClick: () => { void chooseModelDirectory('vision'); }, children: t('chooseDirectory') })] })) : null, _jsxs("div", { className: "m4a-overlay__optional-model", children: [_jsxs("label", { className: "m4a-settings__check", children: [_jsx("input", { type: "checkbox", checked: embeddingEnabled, disabled: busy, onChange: event => { setEmbeddingEnabled(event.target.checked); } }), _jsx("span", { children: t('enableEmbedding') })] }), _jsx("a", { className: "m4a-settings__button m4a-settings__button--link", href: RECOMMENDED_EMBEDDING, target: "_blank", rel: "noreferrer", children: t('downloadEmbedding') })] }), embeddingEnabled ? (_jsxs("div", { className: "m4a-overlay__setup-grid", children: [_jsx("div", { className: "m4a-settings__field m4a-settings__field--wide", children: _jsxs("div", { className: "m4a-overlay__path-row", children: [_jsx("input", { className: "m4a-settings__input", value: embeddingPath, disabled: busy, spellCheck: false, placeholder: "D:\\\\Models\\\\embedding.gguf", onChange: event => { setEmbeddingPath(event.target.value); } }), _jsx("button", { type: "button", className: "m4a-settings__button", disabled: busy, onClick: () => { void chooseModelDirectory('embedding'); }, children: t('chooseDirectory') })] }) }), _jsxs("label", { className: "m4a-settings__field", children: [_jsx("span", { className: "m4a-settings__label", children: t('embeddingIdleTimeout') }), _jsx("input", { className: "m4a-settings__input", inputMode: "numeric", value: embeddingIdleTimeout, disabled: busy, onChange: event => { setEmbeddingIdleTimeout(event.target.value); } })] })] })) : null] }), _jsxs("section", { className: "m4a-overlay__section", children: [_jsx("h3", { children: t('runtimeSettings') }), _jsxs("div", { className: "m4a-overlay__setup-grid", children: [_jsxs("label", { className: "m4a-settings__field", children: [_jsx("span", { className: "m4a-settings__label", children: t('host') }), _jsx("input", { className: "m4a-settings__input", value: setupHost, disabled: busy, spellCheck: false, onChange: event => { setSetupHost(event.target.value); } })] }), _jsxs("label", { className: "m4a-settings__field", children: [_jsx("span", { className: "m4a-settings__label", children: t('port') }), _jsx("input", { className: "m4a-settings__input", inputMode: "numeric", value: setupPort, disabled: busy, onChange: event => { setSetupPort(event.target.value); } })] }), _jsxs("label", { className: "m4a-settings__field", children: [_jsx("span", { className: "m4a-settings__label", children: t('contextWindow') }), _jsx("input", { className: `m4a-settings__input${contextValid || setupContext === '' ? '' : ' m4a-settings__input--invalid'}`, value: setupContext, disabled: busy, placeholder: "160k", onChange: event => { setSetupContext(event.target.value); } }), _jsx("span", { className: "m4a-settings__hint", children: t('tokenUnitHint') })] }), _jsxs("label", { className: "m4a-settings__field", children: [_jsx("span", { className: "m4a-settings__label", children: t('maxTokens') }), _jsx("input", { className: `m4a-settings__input${maxTokensValid || setupMaxTokens === '' ? '' : ' m4a-settings__input--invalid'}`, value: setupMaxTokens, disabled: busy, placeholder: "100k", onChange: event => { setSetupMaxTokens(event.target.value); } }), _jsx("span", { className: "m4a-settings__hint", children: t('tokenUnitHint') })] }), _jsxs("label", { className: "m4a-settings__field", children: [_jsx("span", { className: "m4a-settings__label", children: t('parallelSlots') }), _jsx("input", { className: "m4a-settings__input", inputMode: "numeric", value: setupParallel, disabled: busy, onChange: event => { setSetupParallel(event.target.value); } })] }), _jsxs("label", { className: "m4a-settings__field m4a-settings__field--wide", children: [_jsx("span", { className: "m4a-settings__label", children: t('automaticProfile') }), _jsxs("select", { className: "m4a-settings__select", value: setupProfile, disabled: busy, onChange: event => { setSetupProfile(event.target.value); }, children: [_jsx("option", { value: "conservative", children: t('conservativeProfile') }), _jsx("option", { value: "aggressive", children: t('aggressiveProfile') })] })] })] }), _jsxs("div", { className: "m4a-overlay__optional-model m4a-overlay__mtp", children: [_jsxs("label", { className: "m4a-settings__check", children: [_jsx("input", { type: "checkbox", checked: setupMtp, disabled: busy, onChange: event => { setSetupMtp(event.target.checked); } }), _jsx("span", { children: t('enableMtp') })] }), _jsx("a", { className: "m4a-settings__button m4a-settings__button--link", href: RECOMMENDED_MTP, target: "_blank", rel: "noreferrer", children: t('downloadMtp') })] }), setupMtp ? (_jsxs("div", { className: "m4a-overlay__path-row", children: [_jsx("input", { className: "m4a-settings__input", value: mtpPath, disabled: busy, spellCheck: false, placeholder: "D:\\\\Models\\\\mtp.gguf", onChange: event => { setMtpPath(event.target.value); } }), _jsx("button", { type: "button", className: "m4a-settings__button", disabled: busy, onClick: () => { void chooseModelDirectory('mtp'); }, children: t('chooseDirectory') })] })) : null, _jsxs("label", { className: "m4a-settings__check m4a-overlay__mtp", children: [_jsx("input", { type: "checkbox", checked: setupAutoStart, disabled: busy, onChange: event => { setSetupAutoStart(event.target.checked); } }), _jsx("span", { children: t('enableAutoStart') })] })] }), _jsxs("section", { className: "m4a-overlay__section", children: [_jsxs("div", { className: "m4a-overlay__section-heading", children: [_jsxs("label", { className: "m4a-settings__check", children: [_jsx("input", { type: "checkbox", checked: sessionCacheEnabled, disabled: busy, onChange: event => { setSessionCacheEnabled(event.target.checked); } }), _jsx("span", { children: t('enableSessionCache') })] }), _jsx("button", { type: "button", className: "m4a-overlay__help", title: t('sessionCacheHelp'), "aria-label": t('sessionCacheHelp'), children: "?" })] }), sessionCacheEnabled ? (_jsxs("div", { className: "m4a-overlay__setup-grid", children: [_jsxs("label", { className: "m4a-settings__field m4a-settings__field--wide", children: [_jsx("span", { className: "m4a-settings__label", children: t('sessionCachePath') }), _jsx("input", { className: "m4a-settings__input", value: sessionCachePath, disabled: busy, spellCheck: false, onChange: event => { setSessionCachePath(event.target.value); } }), _jsx("span", { className: "m4a-settings__hint", children: t('sessionCachePathHint') })] }), _jsxs("label", { className: "m4a-settings__field", children: [_jsx("span", { className: "m4a-settings__label", children: t('sessionCacheMax') }), _jsx("input", { className: "m4a-settings__input", value: sessionCacheMax, disabled: busy, placeholder: "10g", onChange: event => { setSessionCacheMax(event.target.value); } })] }), _jsxs("label", { className: "m4a-settings__field", children: [_jsx("span", { className: "m4a-settings__label", children: t('sessionCacheIdle') }), _jsx("input", { className: "m4a-settings__input", inputMode: "numeric", value: sessionCacheIdle, disabled: busy, onChange: event => { setSessionCacheIdle(event.target.value); } })] }), _jsxs("label", { className: "m4a-settings__field", children: [_jsx("span", { className: "m4a-settings__label", children: t('sessionCacheTtl') }), _jsx("input", { className: "m4a-settings__input", inputMode: "numeric", value: sessionCacheTtl, disabled: busy, onChange: event => { setSessionCacheTtl(event.target.value); } })] })] })) : null] }), error === '' ? null : _jsx("p", { className: "m4a-overlay__error", children: error }), _jsxs("div", { className: "m4a-overlay__actions", children: [_jsx("button", { type: "button", className: "m4a-settings__button", disabled: busy, onClick: () => { setDismissed(true); }, children: t('notNow') }), _jsx("button", { type: "button", className: "m4a-settings__button m4a-settings__button--primary", disabled: busy || modelPath.trim() === '' || !contextValid || !maxTokensValid, onClick: () => { void saveSetupAndStart(); }, children: busy ? t('startingNow') : t('saveSetupAndStart') })] })] }));
    }
    if (mode === 'prompt' && status.phase === 'offline' && status.canStart && !dismissed) {
        return (_jsxs(ModalFrame, { title: t('startupPromptTitle'), children: [_jsx("p", { className: "m4a-overlay__body", children: t('startupPromptBody') }), _jsx("code", { className: "m4a-overlay__endpoint", children: status.endpoint }), error === '' ? null : _jsx("p", { className: "m4a-overlay__error", children: error }), _jsxs("div", { className: "m4a-overlay__actions m4a-overlay__actions--three", children: [_jsx("button", { type: "button", className: "m4a-settings__button", disabled: busy, onClick: () => { setDismissed(true); }, children: t('notNow') }), _jsx("button", { type: "button", className: "m4a-settings__button", disabled: busy, onClick: () => { void launch(false); }, children: t('startThisTime') }), _jsx("button", { type: "button", className: "m4a-settings__button m4a-settings__button--primary", disabled: busy, onClick: () => { void launch(false, true); }, children: busy ? t('startingNow') : t('startAndRemember') })] })] }));
    }
    if (release?.updateAvailable === true && !status.ready && !updateDismissed) {
        return (_jsxs(ModalFrame, { title: t('updateTitle'), children: [_jsx("p", { className: "m4a-overlay__body", children: t('updateBody') }), _jsx("p", { className: "m4a-overlay__version", children: release.latest?.name }), error === '' ? null : _jsx("p", { className: "m4a-overlay__error", children: error }), _jsxs("div", { className: "m4a-overlay__actions", children: [_jsx("button", { type: "button", className: "m4a-settings__button", disabled: busy, onClick: () => { setUpdateDismissed(true); }, children: t('notNow') }), _jsx("button", { type: "button", className: "m4a-settings__button m4a-settings__button--primary", disabled: busy, onClick: () => { void install('official'); }, children: busy ? t('installing') : t('updateNow') })] })] }));
    }
    return null;
}
//# sourceMappingURL=EngineStartupOverlay.js.map