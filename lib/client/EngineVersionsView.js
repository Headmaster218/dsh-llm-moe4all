import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, Check, FolderOpen, Package, RefreshCw, Trash2 } from 'lucide-react';
import { isInstalling } from './use-workspace.js';
import { samePath } from './workspace-model.js';
import { Button, Field, IconButton } from './workspace-ui.js';
export function EngineVersionsView({ workspace: w, t, onDelete, }) {
    const [path, setPath] = useState('');
    const e = w.editor;
    const installing = isInstalling(w.release) || w.working === 'install';
    return (_jsxs("div", { className: "m4a-engine-view", children: [_jsxs("div", { className: "m4a-section-heading", children: [_jsx("h3", { children: t('enginesTab') }), _jsx(Button, { icon: RefreshCw, busy: w.working === 'updates', disabled: installing, onClick: () => void w.checkUpdates(), children: t('checkUpdates') })] }), (w.release?.versions.length ?? 0) > 0 && (_jsx(Field, { label: t('selectedEngine'), children: _jsxs("select", { value: e.config.executable ?? '', onChange: (event) => {
                        const version = w.release?.versions.find((item) => item.executable === event.target.value);
                        if (version)
                            w.selectEngine(version);
                    }, children: [!w.release?.versions.some((item) => item.executable === e.config.executable) && (_jsx("option", { value: e.config.executable ?? '', children: e.config.executable || t('noEngine') })), w.release?.versions.map((version) => (_jsx("option", { value: version.executable, children: version.name }, version.executable)))] }) })), _jsxs("section", { className: "m4a-engine-install", children: [_jsx("div", { className: "m4a-engine-symbol", children: _jsx(Package, { size: 26 }) }), _jsxs("div", { children: [_jsx("h4", { children: w.release?.latest?.name ?? 'MoE4All Engine' }), _jsx("p", { children: w.release?.updateAvailable ? t('newVersion') : t('installEngineTitle') })] }), _jsx(Button, { icon: ArrowDownToLine, kind: "primary", busy: installing, disabled: w.release?.supported === false, onClick: () => void w.install(), children: t(w.release?.install.stage === 'error' || w.release?.install.stage === 'cancelled'
                            ? 'retryDownload'
                            : w.release?.updateAvailable
                                ? 'updateNow'
                                : 'installLatest') })] }), _jsxs("div", { className: "m4a-section-heading", children: [_jsx("h4", { children: t('installedVersions') }), _jsx("span", { className: "m4a-count", children: w.release?.versions.length ?? 0 })] }), _jsx("div", { className: "m4a-version-list", children: (w.release?.versions ?? []).map((version) => {
                    const selected = samePath(version.executable, e.config.executable ?? '');
                    const configured = samePath(version.executable, w.baseline?.config.executable ?? '');
                    return (_jsxs("div", { className: `m4a-version-row ${selected ? 'is-selected' : ''}`, children: [_jsx(Package, { size: 20 }), _jsxs("div", { children: [_jsx("strong", { children: version.name }), _jsx("code", { title: version.executable, children: version.executable })] }), _jsx(Button, { icon: selected ? Check : undefined, kind: "ghost", disabled: selected || w.disabled, onClick: () => w.selectEngine(version), children: t(selected ? 'usingModel' : 'useEngine') }), _jsx(IconButton, { icon: Trash2, label: t(configured ? 'selectedVersionHint' : 'deleteEngine'), disabled: configured || selected || w.status?.owned || w.status?.ready || installing, onClick: () => onDelete(version) })] }, version.executable));
                }) }), _jsxs("section", { className: "m4a-section", children: [_jsx("h4", { children: t('localEngineTitle') }), _jsxs("div", { className: "m4a-import-engine", children: [_jsx(Field, { label: t('localEnginePath'), children: _jsx("input", { value: path, onChange: (event) => setPath(event.target.value), placeholder: "D:\\MoE4All\\infr.exe" }) }), _jsx(Button, { icon: FolderOpen, busy: w.working === 'install', disabled: !path.trim() || installing, onClick: () => void w.install(path), children: t('adoptEngine') })] }), _jsxs("a", { className: "m4a-source-link", href: "https://github.com/Headmaster218/MoE4All/releases", target: "_blank", rel: "noreferrer", children: ["GitHub Releases ", _jsx(ArrowUpRight, { size: 14 })] })] })] }));
}
//# sourceMappingURL=EngineVersionsView.js.map