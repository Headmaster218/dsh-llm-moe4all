import { endpointFromConfig, validateEndpoint } from '../connection.js';
import { buildEngineArguments, parseEngineArguments, unmanagedArguments } from './engine-setup.js';
import { formatTokenValue, parseTokenValue } from './token-value.js';
export function editorFromConfig(config) {
    const modelDirectories = config.modelDirectories === undefined
        ? undefined
        : normalizedModelDirectories(config.modelDirectories);
    const normalized = {
        ...config,
        mode: config.mode === 'managed' ? 'prompt' : (config.mode ?? 'prompt'),
        ...(modelDirectories === undefined ? {} : { modelDirectories }),
    };
    return {
        config: normalized,
        setup: parseEngineArguments(config.arguments ?? []),
        context: formatTokenValue(config.contextWindow ?? 163840),
        maxTokens: formatTokenValue(config.maxTokens ?? 102400),
        extras: unmanagedArguments(config.arguments ?? []),
        extraText: undefined,
    };
}
export const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
export const fileName = (path) => path.split(/[\\/]/u).at(-1) ?? path;
export const samePath = (left, right) => left.replaceAll('\\', '/').toLowerCase() === right.replaceAll('\\', '/').toLowerCase();
export function normalizedModelDirectories(paths) {
    const result = [];
    for (const raw of paths) {
        const path = raw.trim();
        if (path && !result.some(item => samePath(item, path)))
            result.push(path);
    }
    return result;
}
export function modelDirectoriesFromConfig(config, fallback = '') {
    if (config.modelDirectoriesConfigured || (config.modelDirectories?.length ?? 0) > 0) {
        return normalizedModelDirectories(config.modelDirectories ?? []);
    }
    const legacy = config.modelDirectory?.trim() || fallback.trim();
    return legacy ? [legacy] : [];
}
export const formatBytes = (value) => value >= 1024 ** 3 ? `${(value / 1024 ** 3).toFixed(1)} GiB` : `${(value / 1024 ** 2).toFixed(0)} MiB`;
export function argumentValue(args, option) {
    let found = '';
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (option.startsWith('--')) {
            if (arg === option)
                found = args[++i] ?? '';
            else if (arg.startsWith(`${option}=`))
                found = arg.slice(option.length + 1);
        }
        else if (arg === '--set' || arg.startsWith('--set=')) {
            const entry = arg === '--set' ? (args[++i] ?? '') : arg.slice(6);
            if (entry.startsWith(`${option}=`))
                found = entry.slice(option.length + 1);
        }
    }
    return found;
}
export function setArgument(args, option, value) {
    const next = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (option.startsWith('--') && (arg === option || arg.startsWith(`${option}=`))) {
            if (arg === option)
                i++;
        }
        else if (!option.startsWith('--') && (arg === '--set' || arg.startsWith('--set='))) {
            const entry = arg === '--set' ? (args[++i] ?? '') : arg.slice(6);
            if (!entry.startsWith(`${option}=`))
                next.push('--set', entry);
        }
        else
            next.push(arg);
    }
    if (value.trim() !== '')
        next.push(...(option.startsWith('--') ? [option, value.trim()] : ['--set', `${option}=${value.trim()}`]));
    return next;
}
export function composeEditor(editor) {
    const contextWindow = parseTokenValue(editor.context);
    const maxTokens = parseTokenValue(editor.maxTokens);
    if (!contextWindow || !maxTokens)
        throw new Error('invalidTokens');
    const config = { ...editor.config, contextWindow, maxTokens };
    validateEndpoint(endpointFromConfig(config), config.allowRemoteEndpoint);
    if (config.mode === 'connect')
        return config;
    const { sessionCache, ...setup } = editor.setup;
    if (!setup.model.trim())
        throw new Error('missingModelError');
    const custom = parseExtraArguments(editor.extraText ?? JSON.stringify(editor.extras));
    config.arguments = buildEngineArguments({
        ...setup,
        host: config.host ?? '127.0.0.1',
        port: config.port ?? 8080,
        contextWindow,
        maxTokens,
        ...(setup.sessionCacheEnabled ? { sessionCache } : {}),
        extraArguments: custom,
    });
    config.vision = setup.visionModel !== '';
    return config;
}
export function parseExtraArguments(text) {
    try {
        const value = JSON.parse(text);
        if (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))
            throw new Error();
        const canonical = value.flatMap((item) => item.startsWith('--set=') ? ['--set', item.slice(6)] : [item]);
        if (!equal(unmanagedArguments(['serve', ...canonical]), canonical))
            throw new Error();
        return canonical;
    }
    catch {
        throw new Error('invalidExtra');
    }
}
export function modelLibrary(locals, recommendations) {
    const seen = new Set();
    const items = locals.map((local) => {
        const recommended = recommendations.find((item) => item.kind === local.kind &&
            item.files.some((file) => file.name.toLowerCase() === fileName(local.path).toLowerCase()));
        if (recommended)
            seen.add(recommended.id);
        return {
            id: local.id,
            family: local.family,
            kind: local.kind,
            name: recommended?.name ?? local.name,
            quantization: local.quantization,
            size: local.sizeBytes,
            files: local.expectedFiles,
            local,
            ...(recommended ? { recommended } : {}),
        };
    });
    for (const recommended of recommendations) {
        if (!seen.has(recommended.id))
            items.push({
                id: recommended.id,
                family: recommended.family,
                kind: recommended.kind,
                name: recommended.name,
                quantization: recommended.quantization,
                size: recommended.totalBytes,
                files: recommended.files.length,
                recommended,
            });
    }
    const families = [...new Set(recommendations.map((item) => item.family))];
    const roles = ['main', 'vision', 'mtp', 'embedding'];
    return items.sort((a, b) => {
        const aRank = families.indexOf(a.family), bRank = families.indexOf(b.family);
        return ((aRank < 0 ? 999 : aRank) - (bRank < 0 ? 999 : bRank) ||
            a.family.localeCompare(b.family) ||
            roles.indexOf(a.kind) - roles.indexOf(b.kind) ||
            a.name.localeCompare(b.name));
    });
}
//# sourceMappingURL=workspace-model.js.map