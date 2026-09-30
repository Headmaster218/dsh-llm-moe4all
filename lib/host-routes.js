import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { discoverLocalModelFiles, discoverModelLibraries, validateSetupModelPaths } from './model-files.js';
import { nativeFilePickerAvailable, pickGgufFile } from './native-file-picker.js';
export const ENGINE_PATHS = {
    status: '/api/moe4all/status',
    start: '/api/moe4all/start',
    stop: '/api/moe4all/stop',
    release: '/api/moe4all/release',
    install: '/api/moe4all/install',
    cancelInstall: '/api/moe4all/install-cancel',
    installLocal: '/api/moe4all/install-local',
    deleteEngine: '/api/moe4all/engine-delete',
    modelFiles: '/api/moe4all/model-files',
    modelLibrary: '/api/moe4all/model-library',
    validateModels: '/api/moe4all/validate-models',
    pickModelFile: '/api/moe4all/pick-model-file',
    modelCatalog: '/api/moe4all/model-catalog',
    modelDownload: '/api/moe4all/model-download',
    cancelModelDownload: '/api/moe4all/model-download-cancel',
    apiKey: '/api/moe4all/api-key',
};
function isIPv4Loopback(value) {
    const parts = value.split('.');
    return parts.length === 4
        && parts[0] === '127'
        && parts.every((part) => /^\d{1,3}$/u.test(part) && Number(part) <= 255);
}
export function isLoopbackRequest(request) {
    const remote = request.socket.remoteAddress?.toLowerCase();
    const socketLoopback = remote === '::1'
        || (remote?.startsWith('::ffff:') === true && isIPv4Loopback(remote.slice('::ffff:'.length)))
        || (remote !== undefined && isIPv4Loopback(remote));
    if (!socketLoopback)
        return false;
    const host = request.headers.host;
    if (typeof host !== 'string')
        return false;
    let authority;
    try {
        authority = new URL(`http://${host}`);
    }
    catch {
        return false;
    }
    if (authority.hostname !== 'localhost' && authority.hostname !== '[::1]' && !isIPv4Loopback(authority.hostname)) {
        return false;
    }
    if (request.headers['sec-fetch-site'] === 'cross-site')
        return false;
    const origin = request.headers.origin;
    if (origin === undefined)
        return true;
    try {
        return new URL(origin).host === authority.host;
    }
    catch {
        return false;
    }
}
function writeJson(response, status, value) {
    response.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'referrer-policy': 'no-referrer',
    });
    response.end(JSON.stringify(value));
}
async function readJson(request) {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
        const buffer = chunk;
        size += buffer.length;
        if (size > 4096)
            return undefined;
        chunks.push(buffer);
    }
    if (chunks.length === 0)
        return {};
    try {
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        return typeof value === 'object' && value !== null && !Array.isArray(value)
            ? value
            : undefined;
    }
    catch {
        return undefined;
    }
}
function method(request, response, expected) {
    if (request.method === expected)
        return true;
    response.writeHead(405, { allow: expected });
    response.end('method not allowed');
    return false;
}
function fenced(request, response) {
    if (isLoopbackRequest(request))
        return true;
    writeJson(response, 403, { ok: false, code: 'loopback-required' });
    return false;
}
async function status(access) {
    const controller = access.controller();
    if (controller === undefined) {
        return {
            phase: 'checking',
            endpoint: '',
            mode: 'prompt',
            ready: false,
            canStart: false,
            message: 'MoE4All settings are being applied.',
            models: [],
        };
    }
    return { ...await controller.refreshStatus(), models: access.models(), pendingChanges: access.pendingChanges?.() ?? false };
}
export function makeEngineRoutes(access) {
    const handleStatus = async (request, response) => {
        if (!method(request, response, 'GET') || !fenced(request, response))
            return;
        writeJson(response, 200, await status(access));
    };
    const handleStart = async (request, response) => {
        if (!method(request, response, 'POST') || !fenced(request, response))
            return;
        const body = await readJson(request);
        if (body === undefined || (body.force !== undefined && typeof body.force !== 'boolean')) {
            writeJson(response, 400, { ok: false, code: 'invalid-body' });
            return;
        }
        try {
            await access.prepareStart?.();
        }
        catch (error) {
            writeJson(response, 400, { ok: false, message: error instanceof Error ? error.message : String(error) });
            return;
        }
        const controller = access.controller();
        if (controller === undefined) {
            writeJson(response, 503, { ok: false, code: 'runtime-restarting' });
            return;
        }
        const result = await controller.requestStart(body.force === true);
        if (result.ok) {
            await access.refreshModels();
            await access.activateDefaultModel?.();
        }
        writeJson(response, 200, { ...result, status: { ...result.status, models: access.models() } });
    };
    const handleStop = async (request, response) => {
        if (!method(request, response, 'POST') || !fenced(request, response))
            return;
        try {
            if (access.stop === undefined)
                throw new Error('Engine stop is unavailable.');
            await access.stop();
            writeJson(response, 200, { ok: true, status: await status(access) });
        }
        catch (error) {
            writeJson(response, 409, { ok: false, message: error instanceof Error ? error.message : String(error) });
        }
    };
    const handleRelease = async (request, response) => {
        if (!method(request, response, 'GET') || !fenced(request, response))
            return;
        try {
            const force = new URL(request.url ?? ENGINE_PATHS.release, 'http://localhost').searchParams.get('force') === '1';
            const result = await access.releases.status(access.configuredExecutable(), force);
            writeJson(response, 200, { ok: true, ...result });
        }
        catch (error) {
            writeJson(response, 502, { ok: false, message: error instanceof Error ? error.message : String(error) });
        }
    };
    const handleInstall = async (request, response) => {
        if (!method(request, response, 'POST') || !fenced(request, response))
            return;
        try {
            void access.releases.installLatest().catch(() => { });
            writeJson(response, 202, { ok: true });
        }
        catch (error) {
            writeJson(response, 500, { ok: false, message: error instanceof Error ? error.message : String(error) });
        }
    };
    const handleCancelInstall = (request, response) => {
        if (!method(request, response, 'POST') || !fenced(request, response))
            return;
        writeJson(response, 200, { ok: true, install: access.releases.cancelInstall() });
    };
    const handleInstallLocal = async (request, response) => {
        if (!method(request, response, 'POST') || !fenced(request, response))
            return;
        const body = await readJson(request);
        if (body === undefined || typeof body.path !== 'string' || body.path.trim() === '') {
            writeJson(response, 400, { ok: false, code: 'invalid-local-path', message: 'A local ZIP, directory, or infr.exe path is required.' });
            return;
        }
        try {
            void access.releases.installFromLocal(body.path).catch(() => { });
            writeJson(response, 202, { ok: true });
        }
        catch (error) {
            writeJson(response, 500, { ok: false, message: error instanceof Error ? error.message : String(error) });
        }
    };
    const handleDeleteEngine = async (request, response) => {
        if (!method(request, response, 'POST') || !fenced(request, response))
            return;
        const body = await readJson(request);
        if (body === undefined || typeof body.tag !== 'string' || body.tag.trim() === '') {
            writeJson(response, 400, { ok: false, code: 'invalid-engine-version', message: 'An engine version is required.' });
            return;
        }
        const controller = access.controller();
        if (controller?.ownsProcess || controller?.isStarting || controller?.statusSnapshot().ready) {
            writeJson(response, 409, { ok: false, code: 'engine-running', message: 'Stop the managed engine before deleting an engine version.' });
            return;
        }
        try {
            await access.releases.remove(body.tag, access.configuredExecutable());
            writeJson(response, 200, { ok: true });
        }
        catch (error) {
            writeJson(response, 409, { ok: false, code: 'engine-delete-failed', message: error instanceof Error ? error.message : String(error) });
        }
    };
    const handleModelFiles = async (request, response) => {
        if (!method(request, response, 'POST') || !fenced(request, response))
            return;
        const body = await readJson(request);
        if (body === undefined || typeof body.path !== 'string' || body.path.trim() === '') {
            writeJson(response, 400, { ok: false, code: 'invalid-model-path', message: 'A model file or directory path is required.' });
            return;
        }
        try {
            const files = await discoverLocalModelFiles(body.path);
            writeJson(response, 200, { ok: true, files });
        }
        catch (error) {
            writeJson(response, 400, { ok: false, code: 'model-scan-failed', message: error instanceof Error ? error.message : String(error) });
        }
    };
    const handleValidateModels = async (request, response) => {
        if (!method(request, response, 'POST') || !fenced(request, response))
            return;
        const body = await readJson(request);
        const paths = body?.paths;
        if (typeof paths !== 'object' || paths === null || Array.isArray(paths)) {
            writeJson(response, 400, { ok: false, code: 'invalid-model-paths', message: 'Model paths are required.' });
            return;
        }
        const values = paths;
        if (typeof values.main !== 'string'
            || (values.vision !== undefined && typeof values.vision !== 'string')
            || (values.embedding !== undefined && typeof values.embedding !== 'string')
            || (values.mtp !== undefined && typeof values.mtp !== 'string')) {
            writeJson(response, 400, { ok: false, code: 'invalid-model-paths', message: 'Model paths must be strings.' });
            return;
        }
        try {
            const normalized = await validateSetupModelPaths({
                main: values.main,
                ...(typeof values.vision === 'string' ? { vision: values.vision } : {}),
                ...(typeof values.embedding === 'string' ? { embedding: values.embedding } : {}),
                ...(typeof values.mtp === 'string' ? { mtp: values.mtp } : {}),
            });
            writeJson(response, 200, { ok: true, paths: normalized });
        }
        catch (error) {
            writeJson(response, 400, { ok: false, code: 'model-validation-failed', message: error instanceof Error ? error.message : String(error) });
        }
    };
    const handleModelLibrary = async (request, response) => {
        if (!method(request, response, 'POST') || !fenced(request, response))
            return;
        const body = await readJson(request);
        const directory = body?.directory;
        const directories = body?.directories;
        const selectedPaths = body?.selectedPaths;
        const validDirectories = directories === undefined
            ? typeof directory === 'string'
            : Array.isArray(directories)
                && directories.length <= 16
                && directories.every(item => typeof item === 'string');
        if (!validDirectories
            || (selectedPaths !== undefined && (!Array.isArray(selectedPaths) || selectedPaths.some(item => typeof item !== 'string')))) {
            writeJson(response, 400, { ok: false, code: 'invalid-model-library', message: 'Up to 16 model directories and a string path list are required.' });
            return;
        }
        try {
            const library = await discoverModelLibraries((directories ?? [directory]), selectedPaths);
            writeJson(response, 200, { ok: true, library });
        }
        catch (error) {
            writeJson(response, 400, { ok: false, code: 'model-library-failed', message: error instanceof Error ? error.message : String(error) });
        }
    };
    const handlePickModelFile = async (request, response) => {
        if (!method(request, response, 'POST') || !fenced(request, response))
            return;
        if (!nativeFilePickerAvailable()) {
            writeJson(response, 501, { ok: false, code: 'picker-unavailable', message: 'A native model file picker is not available on this platform.' });
            return;
        }
        try {
            writeJson(response, 200, { ok: true, path: await pickGgufFile() });
        }
        catch (error) {
            writeJson(response, 500, { ok: false, code: 'picker-failed', message: error instanceof Error ? error.message : String(error) });
        }
    };
    const handleModelCatalog = (request, response) => {
        if (!method(request, response, 'GET') || !fenced(request, response))
            return;
        writeJson(response, 200, {
            ok: true,
            models: access.downloads.catalog(),
            download: access.downloads.status(),
            capabilities: { nativeFilePicker: nativeFilePickerAvailable() },
            defaultDirectory: join(process.env.DSH_HOME ? resolve(process.env.DSH_HOME) : join(homedir(), '.dsh'), 'moe4all-models'),
        });
    };
    const handleModelDownload = async (request, response) => {
        if (!fenced(request, response))
            return;
        if (request.method === 'GET') {
            writeJson(response, 200, { ok: true, download: access.downloads.status() });
            return;
        }
        if (!method(request, response, 'POST'))
            return;
        const body = await readJson(request);
        if (body === undefined || typeof body.modelId !== 'string' || typeof body.directory !== 'string') {
            writeJson(response, 400, { ok: false, code: 'invalid-model-download', message: 'A recommended model and destination directory are required.' });
            return;
        }
        try {
            writeJson(response, 202, { ok: true, download: access.downloads.start(body.modelId, body.directory) });
        }
        catch (error) {
            writeJson(response, 409, { ok: false, code: 'model-download-failed', message: error instanceof Error ? error.message : String(error) });
        }
    };
    const handleCancelModelDownload = (request, response) => {
        if (!method(request, response, 'POST') || !fenced(request, response))
            return;
        writeJson(response, 200, { ok: true, download: access.downloads.cancel() });
    };
    const handleApiKey = async (request, response) => {
        if (!fenced(request, response))
            return;
        const config = access.config();
        if (request.method === 'GET') {
            writeJson(response, 200, { ok: true, ...await access.apiKeys.ensure(config) });
            return;
        }
        if (!method(request, response, 'POST'))
            return;
        if (access.controller()?.ownsProcess && (await access.apiKeys.ensure(config)).required) {
            writeJson(response, 409, {
                ok: false,
                message: 'Stop the managed engine before changing its API key.',
            });
            return;
        }
        const body = await readJson(request);
        if (body === undefined
            || (body.value !== undefined && typeof body.value !== 'string')
            || (body.regenerate !== undefined && typeof body.regenerate !== 'boolean')) {
            writeJson(response, 400, { ok: false, code: 'invalid-api-key' });
            return;
        }
        try {
            const status = body.regenerate === true
                ? await access.apiKeys.regenerate(config)
                : await access.apiKeys.set(config, typeof body.value === 'string' ? body.value : '');
            writeJson(response, 200, { ok: true, ...status });
        }
        catch (error) {
            writeJson(response, 400, { ok: false, message: error instanceof Error ? error.message : String(error) });
        }
    };
    return [
        { kind: 'exact', path: ENGINE_PATHS.status, handler: handleStatus },
        { kind: 'exact', path: ENGINE_PATHS.start, handler: handleStart },
        { kind: 'exact', path: ENGINE_PATHS.stop, handler: handleStop },
        { kind: 'exact', path: ENGINE_PATHS.release, handler: handleRelease },
        { kind: 'exact', path: ENGINE_PATHS.install, handler: handleInstall },
        { kind: 'exact', path: ENGINE_PATHS.cancelInstall, handler: handleCancelInstall },
        { kind: 'exact', path: ENGINE_PATHS.installLocal, handler: handleInstallLocal },
        { kind: 'exact', path: ENGINE_PATHS.deleteEngine, handler: handleDeleteEngine },
        { kind: 'exact', path: ENGINE_PATHS.modelFiles, handler: handleModelFiles },
        { kind: 'exact', path: ENGINE_PATHS.modelLibrary, handler: handleModelLibrary },
        { kind: 'exact', path: ENGINE_PATHS.validateModels, handler: handleValidateModels },
        { kind: 'exact', path: ENGINE_PATHS.pickModelFile, handler: handlePickModelFile },
        { kind: 'exact', path: ENGINE_PATHS.modelCatalog, handler: handleModelCatalog },
        { kind: 'exact', path: ENGINE_PATHS.modelDownload, handler: handleModelDownload },
        { kind: 'exact', path: ENGINE_PATHS.cancelModelDownload, handler: handleCancelModelDownload },
        { kind: 'exact', path: ENGINE_PATHS.apiKey, handler: handleApiKey },
    ];
}
//# sourceMappingURL=host-routes.js.map