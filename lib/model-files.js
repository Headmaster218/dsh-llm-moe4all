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
async function collectModelFiles(directory, maxDepth, result) {
    const pending = [{ directory, depth: 0 }];
    const visited = new Set();
    while (pending.length > 0) {
        const current = pending.shift();
        const key = current.directory.toLowerCase();
        if (visited.has(key))
            continue;
        visited.add(key);
        let entries;
        try {
            entries = await readdir(current.directory, { withFileTypes: true });
        }
        catch {
            continue;
        }
        for (const entry of entries) {
            const path = join(current.directory, entry.name);
            if (entry.isDirectory() && current.depth < maxDepth) {
                pending.push({ directory: path, depth: current.depth + 1 });
            }
            else if (entry.isFile() && extname(entry.name).toLowerCase() === '.gguf') {
                try {
                    result.set(path.toLowerCase(), { path, size: (await stat(path)).size });
                }
                catch { }
            }
        }
    }
}
export async function discoverModelLibrary(input, selectedPaths = []) {
    const normalized = stripOuterQuotes(input);
    const files = new Map();
    let directory = normalized === '' ? '' : resolve(normalized);
    if (directory !== '') {
        const details = await stat(directory);
        if (details.isFile())
            directory = dirname(directory);
        else if (!details.isDirectory())
            throw new Error('The model library path is not a file or directory.');
        await collectModelFiles(directory, 4, files);
    }
    for (const raw of selectedPaths) {
        const value = stripOuterQuotes(raw);
        if (value === '')
            continue;
        const path = resolve(value);
        try {
            const details = await stat(path);
            if (details.isFile() && extname(path).toLowerCase() === '.gguf') {
                await collectModelFiles(dirname(path), 0, files);
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
        };
    });
    models.sort((left, right) => (left.family.localeCompare(right.family, undefined, { sensitivity: 'base', numeric: true })
        || rank[left.kind] - rank[right.kind]
        || left.name.localeCompare(right.name, undefined, { sensitivity: 'base', numeric: true })));
    return { directory, models };
}
export async function discoverLocalModelFiles(input) {
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
    const entries = await readdir(directory, { withFileTypes: true });
    const result = { directory, ...(selected === undefined ? {} : { selected }), main: [], vision: [], embedding: [], mtp: [] };
    for (const entry of entries) {
        if (!entry.isFile() || extname(entry.name).toLowerCase() !== '.gguf')
            continue;
        const fullPath = join(directory, entry.name);
        const kind = modelKind(entry.name);
        if (kind === 'main' && !isFirstOrOnlyShard(entry.name))
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
        result[kind] = path;
    }
    if (result.main === '')
        throw new Error('A main model GGUF file is required.');
    return result;
}
//# sourceMappingURL=model-files.js.map