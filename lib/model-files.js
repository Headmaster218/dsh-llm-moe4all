import { readdir, stat } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
function stripOuterQuotes(value) {
    const trimmed = value.trim();
    if (trimmed.length >= 2) {
        const first = trimmed[0];
        const last = trimmed.at(-1);
        if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
            return trimmed.slice(1, -1).trim();
        }
    }
    return trimmed;
}
function modelKind(path) {
    const name = path.toLowerCase();
    if (name.includes('mtp'))
        return 'mtp';
    if (name.includes('mmproj') || name.includes('vision'))
        return 'vision';
    if (name.includes('embed') || name.includes('nomic'))
        return 'embedding';
    return 'main';
}
function isFirstOrOnlyShard(path) {
    const match = /-(\d{5})-of-\d{5}\.gguf$/iu.exec(path);
    return match === null || match[1] === '00001';
}
function shardIdentity(path) {
    return path.replace(/-\d{5}-of-\d{5}\.gguf$/iu, '');
}
function modelFamily(name) {
    if (/qwen3[.-]?8.*flash.*next/iu.test(name))
        return 'Qwen3.8 Flash Next';
    if (/qwen3[.-]?6.*35b/iu.test(name))
        return 'Qwen3.6 35B-A3B';
    if (/qwen3.*embedding/iu.test(name))
        return 'Qwen3 Embedding';
    if (/nomic.*embed/iu.test(name))
        return 'Nomic Embedding';
    const normalized = name.replace(/[-_.]+/gu, ' ').trim();
    return normalized.split(/\s+(?=(?:AD-|Q\d|F16|BF16|F32|APEX|MTP))/iu, 1)[0] || 'Other models';
}
function modelQuantization(name) {
    const patterns = [
        /AD-\d+(?:\.\d+)?bpw-Q\d+_[A-Z0-9_]+(?:-M\d+)?/iu,
        /APEX-[A-Z0-9_-]+/iu,
        /Q\d+_[A-Z0-9_]+/iu,
        /\b(?:BF16|F16|F32)\b/iu,
    ];
    for (const pattern of patterns) {
        const match = pattern.exec(name)?.[0];
        if (match !== undefined)
            return match;
    }
    return 'GGUF';
}
const DEFAULT_SCAN_LIMITS = {
    maxDepth: 6,
    maxDirectories: 512,
    maxFiles: 20_000,
    timeoutMs: 5_000,
};
function scanLimits(overrides = {}) {
    return { ...DEFAULT_SCAN_LIMITS, ...overrides };
}
async function beforeDeadline(operation, deadline) {
    const remaining = deadline - Date.now();
    if (remaining <= 0)
        throw new Error('Model folder search timed out. Choose a more specific folder.');
    let timer;
    try {
        return await Promise.race([
            operation,
            new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error('Model folder search timed out. Choose a more specific folder.')), remaining);
            }),
        ]);
    }
    finally {
        if (timer !== undefined)
            clearTimeout(timer);
    }
}
async function collectModelFiles(directory, result, overrides = {}) {
    const limits = scanLimits(overrides);
    const deadline = Date.now() + limits.timeoutMs;
    const pending = [{ directory, depth: 0 }];
    const visited = new Set();
    let cursor = 0;
    let fileCount = 0;
    while (cursor < pending.length) {
        if (visited.size >= limits.maxDirectories) {
            throw new Error('Model folder search reached the directory limit. Choose a more specific folder.');
        }
        const current = pending[cursor++];
        const key = current.directory.toLowerCase();
        if (visited.has(key))
            continue;
        visited.add(key);
        let entries;
        try {
            entries = await beforeDeadline(readdir(current.directory, { withFileTypes: true }), deadline);
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('timed out'))
                throw error;
            continue;
        }
        for (const entry of entries) {
            const path = join(current.directory, entry.name);
            if (entry.isDirectory() && current.depth < limits.maxDepth) {
                pending.push({ directory: path, depth: current.depth + 1 });
            }
            else if (entry.isFile() && extname(entry.name).toLowerCase() === '.gguf') {
                fileCount += 1;
                if (fileCount > limits.maxFiles) {
                    throw new Error('Model folder search reached the file limit. Choose a more specific folder.');
                }
                try {
                    result.set(path.toLowerCase(), { path, size: (await beforeDeadline(stat(path), deadline)).size });
                }
                catch (error) {
                    if (error instanceof Error && error.message.includes('timed out'))
                        throw error;
                }
            }
        }
    }
}
export async function discoverModelLibrary(input, selectedPaths = [], limits = {}) {
    const normalized = stripOuterQuotes(input);
    const files = new Map();
    let directory = normalized === '' ? '' : resolve(normalized);
    if (directory !== '') {
        const details = await stat(directory).catch((error) => {
            if (error.code === 'ENOENT')
                return undefined;
            throw error;
        });
        if (details?.isFile())
            directory = dirname(directory);
        else if (details !== undefined && !details.isDirectory())
            throw new Error('The model library path is not a file or directory.');
        await collectModelFiles(directory, files, limits);
    }
    for (const raw of selectedPaths) {
        const value = stripOuterQuotes(raw);
        if (value === '')
            continue;
        const path = resolve(value);
        try {
            const details = await stat(path);
            if (details.isFile() && extname(path).toLowerCase() === '.gguf') {
                await collectModelFiles(dirname(path), files, { ...limits, maxDepth: 0 });
            }
        }
        catch { }
    }
    const groups = new Map();
    for (const item of files.values()) {
        const key = shardIdentity(item.path).toLowerCase();
        const group = groups.get(key) ?? [];
        group.push(item);
        groups.set(key, group);
    }
    const rank = { main: 0, vision: 1, mtp: 2, embedding: 3 };
    const models = [...groups.entries()].map(([id, group]) => {
        group.sort((left, right) => left.path.localeCompare(right.path, undefined, { numeric: true, sensitivity: 'base' }));
        const first = group[0];
        const rawName = basename(shardIdentity(first.path));
        const name = rawName.replace(/\.gguf$/iu, '');
        const shard = /-(\d{5})-of-(\d{5})\.gguf$/iu.exec(first.path);
        const expectedFiles = shard === null ? 1 : Number(shard[2]);
        const complete = group.length === expectedFiles && (shard === null || group.every((item, index) => Number(/-(\d{5})-of-/iu.exec(item.path)?.[1]) === index + 1));
        return {
            id,
            path: first.path,
            directory: dirname(first.path),
            kind: modelKind(name),
            family: modelFamily(name),
            name,
            quantization: modelQuantization(name),
            sizeBytes: group.reduce((sum, item) => sum + item.size, 0),
            fileCount: group.length,
            expectedFiles,
            complete,
        };
    });
    models.sort((left, right) => (left.family.localeCompare(right.family, undefined, { sensitivity: 'base', numeric: true })
        || rank[left.kind] - rank[right.kind]
        || left.name.localeCompare(right.name, undefined, { sensitivity: 'base', numeric: true })));
    return { directory, models };
}
export async function discoverModelLibraries(inputs, selectedPaths = [], limits = {}) {
    const directories = [...new Map(inputs
            .map(stripOuterQuotes)
            .filter(Boolean)
            .map(path => [resolve(path).toLowerCase(), resolve(path)])).values()];
    const libraries = [];
    if (directories.length === 0) {
        libraries.push(await discoverModelLibrary('', selectedPaths, limits));
    }
    else {
        for (let index = 0; index < directories.length; index += 1) {
            libraries.push(await discoverModelLibrary(directories[index], index === 0 ? selectedPaths : [], limits));
        }
    }
    const models = [...new Map(libraries.flatMap(library => library.models).map(model => [model.id, model])).values()];
    const rank = { main: 0, vision: 1, mtp: 2, embedding: 3 };
    models.sort((left, right) => (left.family.localeCompare(right.family, undefined, { sensitivity: 'base', numeric: true })
        || rank[left.kind] - rank[right.kind]
        || left.name.localeCompare(right.name, undefined, { sensitivity: 'base', numeric: true })));
    return { directory: directories[0] ?? '', directories, models };
}
export async function discoverLocalModelFiles(input, limits = {}) {
    const normalized = stripOuterQuotes(input);
    if (normalized === '')
        throw new Error('A model file or directory path is required.');
    const absolute = resolve(normalized);
    const info = await stat(absolute);
    const selected = info.isFile() ? absolute : undefined;
    if (!info.isFile() && !info.isDirectory())
        throw new Error('The selected path is not a file or directory.');
    if (selected !== undefined && extname(selected).toLowerCase() !== '.gguf') {
        throw new Error('The selected model file must use the .gguf extension.');
    }
    const directory = info.isDirectory() ? absolute : dirname(absolute);
    const files = new Map();
    await collectModelFiles(directory, files, limits);
    const result = { directory, ...(selected === undefined ? {} : { selected }), main: [], vision: [], embedding: [], mtp: [] };
    for (const { path: fullPath } of files.values()) {
        const name = basename(fullPath);
        const kind = modelKind(name);
        if (kind === 'main' && !isFirstOrOnlyShard(name))
            continue;
        result[kind].push(fullPath);
    }
    for (const values of [result.main, result.vision, result.embedding, result.mtp]) {
        values.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }));
    }
    return result;
}
export async function validateSetupModelPaths(paths) {
    const result = { main: '' };
    for (const [kind, raw] of Object.entries(paths)) {
        if (raw === undefined || raw.trim() === '')
            continue;
        const path = resolve(stripOuterQuotes(raw));
        const info = await stat(path);
        if (!info.isFile() || extname(path).toLowerCase() !== '.gguf') {
            throw new Error(`${kind} model path must point to a GGUF file.`);
        }
        const shard = /^(.*)-(\d{5})-of-(\d{5})\.gguf$/iu.exec(path);
        if (shard) {
            const total = Number(shard[3]);
            if (total < 1 || total > 10_000)
                throw new Error(`${kind} model has an invalid shard count.`);
            for (let index = 1; index <= total; index++) {
                const expected = `${shard[1]}-${String(index).padStart(5, '0')}-of-${shard[3]}.gguf`;
                const part = await stat(expected).catch(() => undefined);
                if (!part?.isFile())
                    throw new Error(`Missing model shard: ${expected}`);
            }
        }
        result[kind] = path;
    }
    if (result.main === '')
        throw new Error('A main model GGUF file is required.');
    return result;
}
//# sourceMappingURL=model-files.js.map