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
export function fetchReleaseStatus(force = false) {
    return json(`/api/moe4all/release${force ? '?force=1' : ''}`);
}
export async function installLatestEngine() {
    const result = await json('/api/moe4all/install', {
        method: 'POST',
        body: '{}',
    });
    return result.installed;
}
export async function installLocalEngine(path) {
    const result = await json('/api/moe4all/install-local', {
        method: 'POST',
        body: JSON.stringify({ path }),
    });
    return result.installed;
}
export async function scanModelPath(path) {
    const result = await json('/api/moe4all/model-files', {
        method: 'POST',
        body: JSON.stringify({ path }),
    });
    return result.files;
}
export async function validateModelPaths(paths) {
    const result = await json('/api/moe4all/validate-models', {
        method: 'POST',
        body: JSON.stringify({ paths }),
    });
    return result.paths;
}
//# sourceMappingURL=engine-api.js.map