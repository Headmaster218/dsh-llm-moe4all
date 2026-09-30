import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, Check, Image, Layers3, Plus, RefreshCw, Search, Sparkles, Trash2, Zap, Database, } from 'lucide-react';
import { modelLibrary, formatBytes, samePath } from './workspace-model.js';
import { Button, IconButton } from './workspace-ui.js';
export const roleIcon = { main: Layers3, vision: Image, mtp: Zap, embedding: Database };
export const roleLabel = {
    main: 'modelRoleMain',
    vision: 'modelRoleVision',
    mtp: 'modelRoleMtp',
    embedding: 'modelRoleEmbedding',
};
export function ModelLibraryView({ workspace: w, t, onImport, }) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const items = useMemo(() => modelLibrary(w.library.models, w.catalog), [w.library.models, w.catalog]);
    const visible = items.filter((item) => (filter !== 'local' || item.local) &&
        (filter !== 'recommended' || item.recommended) &&
        `${item.name} ${item.family} ${item.quantization}`.toLowerCase().includes(query.toLowerCase()));
    const families = [...new Set(visible.map((item) => item.family))];
    function isSelected(item) {
        const setup = w.editor?.setup;
        if (!setup || !item.local)
            return false;
        const selected = item.kind === 'main'
            ? setup.model
            : item.kind === 'vision'
                ? setup.visionModel
                : item.kind === 'mtp'
                    ? setup.mtpModel
                    : setup.embeddingModel;
        return samePath(selected, item.local.path);
    }
    return (_jsxs("section", { className: "m4a-library", children: [_jsxs("div", { className: "m4a-model-locations", children: [_jsxs("div", { className: "m4a-location-block", children: [_jsxs("div", { className: "m4a-location-copy", children: [_jsx("strong", { children: t('downloadLocation') }), _jsx("span", { children: t('downloadLocationHelp') })] }), _jsx("code", { title: w.directory, children: w.directory || t('notConfigured') }), _jsx(Button, { kind: "ghost", disabled: w.disabled, onClick: () => void w.pickDownloadDirectory(), children: t('changePath') })] }), _jsxs("div", { className: "m4a-location-block m4a-location-block--discovery", children: [_jsxs("div", { className: "m4a-location-copy", children: [_jsx("strong", { children: t('discoveryLocations') }), _jsx("span", { children: t('discoveryLocationsHelp') })] }), _jsx(Button, { kind: "ghost", disabled: w.disabled, onClick: () => void w.addDiscoveryDirectory(), children: t('addDiscoveryPath') }), _jsxs("div", { className: "m4a-location-list", children: [w.directories.length === 0 && _jsx("span", { children: t('noDiscoveryPaths') }), w.directories.map((path) => (_jsxs("div", { children: [_jsx("code", { title: path, children: path }), _jsx(IconButton, { icon: Trash2, label: t('removeDiscoveryPath'), disabled: w.disabled, onClick: () => void w.removeDiscoveryDirectory(path) })] }, path)))] }), _jsx("small", { children: t('removeDiscoveryPathHelp') })] })] }), _jsxs("div", { className: "m4a-section-heading", children: [_jsxs("h3", { children: [t('modelsTab'), ' ', _jsx("span", { className: "m4a-count", children: w.library.models.filter((item) => item.complete).length })] }), _jsxs("div", { className: "m4a-inline", children: [_jsx(IconButton, { icon: RefreshCw, label: t('rescanModels'), disabled: w.scanning, onClick: () => void w.scan() }), _jsx(Button, { icon: Plus, onClick: onImport, children: t('importModel') })] })] }), _jsxs("div", { className: "m4a-search", children: [_jsx(Search, { size: 16 }), _jsx("input", { "aria-label": t('searchModels'), placeholder: t('searchModels'), value: query, onChange: (event) => setQuery(event.target.value) })] }), _jsx("div", { className: "m4a-filters", role: "group", "aria-label": t('modelsTab'), children: ['all', 'local', 'recommended'].map((value) => (_jsx("button", { type: "button", "aria-pressed": filter === value, onClick: () => setFilter(value), children: t(value === 'all' ? 'filterAll' : value === 'local' ? 'filterLocal' : 'filterRecommended') }, value))) }), _jsxs("div", { className: "m4a-library-results", "aria-busy": w.scanning, children: [families.length === 0 && (_jsxs("div", { className: "m4a-empty", children: [_jsx(Layers3, { size: 30 }), _jsx("strong", { children: t(query ? 'noMatches' : 'noLocalModels') }), _jsx(Button, { icon: Plus, onClick: onImport, children: t('importModel') })] })), families.map((family) => (_jsxs("section", { className: "m4a-family", children: [_jsx("h4", { children: family }), visible
                                .filter((item) => item.family === family)
                                .map((item) => {
                                const Icon = roleIcon[item.kind];
                                const selected = isSelected(item);
                                const active = w.download.modelId === item.recommended?.id && w.download.stage === 'downloading';
                                const retry = w.download.modelId === item.recommended?.id &&
                                    ['cancelled', 'error'].includes(w.download.stage);
                                return (_jsxs("article", { className: `m4a-model-row ${selected ? 'is-selected' : ''}`, children: [_jsx("div", { className: `m4a-model-symbol m4a-model-symbol--${item.kind}`, children: _jsx(Icon, { size: 19 }) }), _jsxs("div", { className: "m4a-model-info", children: [_jsxs("div", { className: "m4a-model-badges", children: [_jsx("span", { children: t(roleLabel[item.kind]) }), item.recommended && (_jsxs("span", { className: "m4a-badge m4a-badge--recommend", children: [_jsx(Sparkles, { size: 10 }), t('filterRecommended')] })), item.local && (_jsx("span", { className: `m4a-badge ${item.local.complete ? 'm4a-badge--local' : 'm4a-badge--warning'}`, children: t(item.local.complete ? 'availableLocal' : 'incompleteModel') }))] }), _jsx("strong", { title: item.local?.path, children: item.name }), _jsxs("div", { className: "m4a-model-meta", children: [_jsx("span", { children: item.quantization }), _jsx("span", { children: formatBytes(item.size) }), item.files > 1 && (_jsxs("span", { children: [item.local ? `${item.local.fileCount}/` : '', item.files, " GGUF"] }))] }), _jsxs("div", { className: "m4a-model-actions", children: [item.local?.complete ? (_jsx(Button, { icon: selected ? Check : undefined, kind: selected ? 'ghost' : 'default', disabled: selected || w.disabled, onClick: () => {
                                                                w.selectModel(item.local.path, item.kind);
                                                            }, children: t(selected ? 'usingModel' : 'useSelected') })) : (item.recommended && (_jsx(Button, { icon: ArrowDownToLine, busy: active, disabled: w.download.stage === 'downloading' || w.disabled, onClick: () => void w.downloadModel(item.recommended), children: t(retry ? 'continueDownload' : 'downloadAction') }))), item.recommended && (_jsx("a", { className: "m4a-icon-btn", href: item.recommended.sourceUrl, target: "_blank", rel: "noreferrer", title: t('openModelSource'), "aria-label": t('openModelSource'), children: _jsx(ArrowUpRight, { size: 15 }) }))] }), active && (_jsxs("div", { className: "m4a-model-download", role: "status", children: [_jsx("progress", { value: w.download.percent ?? 0, max: 100 }), _jsxs("span", { children: [w.download.fileIndex && w.download.fileCount
                                                                    ? `${w.download.fileIndex}/${w.download.fileCount} · `
                                                                    : '', formatBytes(w.download.downloadedBytes), " / ", formatBytes(w.download.totalBytes ?? item.size)] })] }))] })] }, item.id));
                            })] }, family)))] })] }));
}
//# sourceMappingURL=ModelLibraryView.js.map