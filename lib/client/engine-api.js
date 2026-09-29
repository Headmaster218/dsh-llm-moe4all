async function json(path, init) {
    const response = await fetch(path, {
        cache: 'no-store',
        ...init,
        headers: {
            accept: 'application/json',
            ...(init?.body === undefined ? {} : { 'content-type': 'application/json' }),
            ...init?.headers,
        },
    });
    const value = await response.json();
    if (!response.ok)
        throw new Error(value.message ?? `MoE4All control request returned HTTP ${response.status}`);
    return value;
}
export function fetchEngineStatus() {
    return json('/api/moe4all/status');
}
export function startEngine(force = false) {
    return json('/api/moe4all/start', {
        method: 'POST',
        body: JSON.stringify({ force }),
    });
}
export function stopEngine() {
    return json('/api/moe4all/stop', { method: 'POST', body: '{}' });
}
export async function fetchApiKey() {
    const result = await json('/api/moe4all/api-key');
    return result;
}
export async function updateApiKey(value) {
    const result = await json('/api/moe4all/api-key', {
        method: 'POST',
        body: JSON.stringify({ value }),
    });
    return result;
}
export async function regenerateApiKey() {
    const result = await json('/api/moe4all/api-key', {
        method: 'POST',
        body: JSON.stringify({ regenerate: true }),
    });
    return result;
}
export function fetchReleaseStatus(force = false) {
    return json(`/api/moe4all/release${force ? '?force=1' : ''}`);
}
export async function installLatestEngine() {
    await json('/api/moe4all/install', {
        method: 'POST',
        body: '{}',
    });
}
export async function installLocalEngine(path) {
    await json('/api/moe4all/install-local', {
        method: 'POST',
        body: JSON.stringify({ path }),
    });
}
export async function cancelEngineInstall() {
    const result = await json('/api/moe4all/install-cancel', {
        method: 'POST',
        body: '{}',
    });
    return result.install;
}
export async function deleteEngineVersion(tag) {
    await json('/api/moe4all/engine-delete', {
        method: 'POST',
        body: JSON.stringify({ tag }),
    });
}
export async function scanModelPath(path) {
    const result = await json('/api/moe4all/model-files', {
        method: 'POST',
        body: JSON.stringify({ path }),
    });
    return result.files;
}
export async function scanModelLibrary(directory, selectedPaths) {
    const result = await json('/api/moe4all/model-library', {
        method: 'POST',
        body: JSON.stringify({ directory, selectedPaths }),
    });
    return result.library;
}
export async function validateModelPaths(paths) {
    const result = await json('/api/moe4all/validate-models', {
        method: 'POST',
        body: JSON.stringify({ paths }),
    });
    return result.paths;
}
export async function pickModelFile() {
    const result = await json('/api/moe4all/pick-model-file', {
        method: 'POST',
        body: '{}',
    });
    return result.path;
}
export function fetchModelCatalog() {
    return json('/api/moe4all/model-catalog');
}
export async function fetchModelDownload() {
    const result = await json('/api/moe4all/model-download');
    return result.download;
}
export async function startModelDownload(modelId, directory) {
    const result = await json('/api/moe4all/model-download', {
        method: 'POST',
        body: JSON.stringify({ modelId, directory }),
    });
    return result.download;
}
export async function cancelModelDownload() {
    const result = await json('/api/moe4all/model-download-cancel', {
        method: 'POST',
        body: '{}',
    });
    return result.download;
}
//# sourceMappingURL=engine-api.js.map