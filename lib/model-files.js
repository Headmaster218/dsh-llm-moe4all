import { readdir, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
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