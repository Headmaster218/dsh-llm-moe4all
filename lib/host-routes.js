export const ENGINE_PATHS = {
    status: '/api/moe4all/status',
    start: '/api/moe4all/start',
    release: '/api/moe4all/release',
    install: '/api/moe4all/install',
    installLocal: '/api/moe4all/install-local',
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
    return { ...await controller.refreshStatus(), models: access.models() };
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
        const controller = access.controller();
        if (controller === undefined) {
            writeJson(response, 503, { ok: false, code: 'runtime-restarting' });
            return;
        }
        const result = await controller.requestStart(body.force === true);
        if (result.ok)
            await access.refreshModels();
        writeJson(response, 200, { ...result, status: { ...result.status, models: access.models() } });
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
            const installed = await access.releases.installLatest();
            writeJson(response, 200, { ok: true, installed });
        }
        catch (error) {
            writeJson(response, 500, { ok: false, message: error instanceof Error ? error.message : String(error) });
        }
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
            const installed = await access.releases.installFromLocal(body.path);
            writeJson(response, 200, { ok: true, installed });
        }
        catch (error) {
            writeJson(response, 500, { ok: false, message: error instanceof Error ? error.message : String(error) });
        }
    };
    return [
        { kind: 'exact', path: ENGINE_PATHS.status, handler: handleStatus },
        { kind: 'exact', path: ENGINE_PATHS.start, handler: handleStart },
        { kind: 'exact', path: ENGINE_PATHS.release, handler: handleRelease },
        { kind: 'exact', path: ENGINE_PATHS.install, handler: handleInstall },
        { kind: 'exact', path: ENGINE_PATHS.installLocal, handler: handleInstallLocal },
    ];
}
//# sourceMappingURL=host-routes.js.map