import { isLoopbackRequest } from './host-routes.js';
import { PLUGIN_UPDATE_PATH, PLUGIN_UPDATE_SCHEMA } from './plugin-release-update.js';
export function makePluginUpdateRoutes(updater) {
    return [{ kind: 'exact', path: PLUGIN_UPDATE_PATH, async handler(request, response) {
                response.setHeader('content-type', 'application/json; charset=utf-8');
                response.setHeader('cache-control', 'no-store');
                const reply = (status, body) => {
                    response.writeHead(status);
                    response.end(JSON.stringify({ schema: PLUGIN_UPDATE_SCHEMA, ...body }));
                };
                if (!isLoopbackRequest(request)) {
                    reply(403, { error: 'Plugin updates require same-origin loopback access.' });
                    return;
                }
                try {
                    const query = new URL(request.url ?? '/', 'http://localhost').searchParams;
                    if (request.method === 'GET') {
                        const status = query.get('check') === '1' ? await updater.check(query.get('force') === '1') : await updater.status();
                        reply(200, { status });
                    }
                    else if (request.method === 'POST') {
                        if (query.get('cancel') === '1') {
                            updater.cancel();
                            reply(200, { status: await updater.status() });
                        }
                        else
                            reply(202, { operation: await updater.start() });
                    }
                    else
                        reply(405, { error: 'Only GET and POST are supported.' });
                }
                catch (error) {
                    reply(request.method === 'POST' ? 409 : 502, { error: error instanceof Error ? error.message : String(error) });
                }
            } }];
}
//# sourceMappingURL=plugin-update-routes.js.map