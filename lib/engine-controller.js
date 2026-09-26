import { spawn } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { access } from 'node:fs/promises';
import { delimiter, dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
export const DEFAULT_CONFIG = {
    mode: 'auto',
    endpoint: 'http://127.0.0.1:1234/v1',
    executable: '',
    arguments: [],
    workingDirectory: '',
    apiKeyEnv: '',
    allowRemoteEndpoint: false,
    startupTimeoutMs: 120_000,
    healthTimeoutMs: 2_000,
    pollIntervalMs: 500,
    shutdownTimeoutMs: 5_000,
    stopOnUnload: true,
    logOutput: true,
};
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function resolvedConfig(config) {
    return {
        ...DEFAULT_CONFIG,
        ...config,
        arguments: [...(config.arguments ?? DEFAULT_CONFIG.arguments)],
    };
}
function isLoopback(hostname) {
    const host = hostname.toLowerCase();
    return host === 'localhost' || host === '::1' || host === '[::1]' || /^127(?:\.|$)/.test(host);
}
export function validateEndpoint(endpoint, allowRemoteEndpoint = false) {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error(`MoE4All endpoint must use http or https: ${endpoint}`);
    }
    if (parsed.username || parsed.password) {
        throw new Error('MoE4All endpoint must not contain credentials');
    }
    if (!allowRemoteEndpoint && !isLoopback(parsed.hostname)) {
        throw new Error(`MoE4All endpoint is not loopback: ${parsed.hostname}`);
    }
    return parsed;
}
function healthUrl(endpoint) {
    return new URL('/health', endpoint.origin);
}
function authorizationHeader(apiKeyEnv) {
    if (!apiKeyEnv)
        return {};
    const value = process.env[apiKeyEnv];
    return value ? { authorization: `Bearer ${value}` } : {};
}
export async function probeHealth(endpoint, timeoutMs, apiKeyEnv = '', parentSignal) {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = parentSignal === undefined
        ? timeoutSignal
        : AbortSignal.any([parentSignal, timeoutSignal]);
    try {
        const response = await fetch(healthUrl(endpoint), {
            method: 'GET',
            headers: authorizationHeader(apiKeyEnv),
            signal,
        });
        return response.ok;
    }
    catch (error) {
        if (parentSignal?.aborted)
            throw error;
        return false;
    }
}
async function existingFile(candidate) {
    try {
        await access(candidate, fsConstants.F_OK);
        return candidate;
    }
    catch {
        return undefined;
    }
}
function executableNames(command) {
    if (process.platform !== 'win32' || extname(command))
        return [command];
    const extensions = (process.env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM')
        .split(';')
        .filter(Boolean);
    return [command, ...extensions.map((extension) => `${command}${extension.toLowerCase()}`)];
}
async function searchPath(command) {
    const pathEntries = (process.env.PATH ?? '').split(delimiter).filter(Boolean);
    for (const directory of pathEntries) {
        for (const name of executableNames(command)) {
            const hit = await existingFile(join(directory, name));
            if (hit !== undefined)
                return hit;
        }
    }
    return undefined;
}
export async function resolveEngineExecutable(config) {
    const workingDirectory = config.workingDirectory || process.cwd();
    const explicit = config.executable?.trim() || process.env.MOE4ALL_ENGINE?.trim();
    if (explicit) {
        const candidate = isAbsolute(explicit) ? explicit : resolve(workingDirectory, explicit);
        return existingFile(candidate);
    }
    const binary = process.platform === 'win32' ? 'infr.exe' : 'infr';
    const bundled = await existingFile(join(packageRoot, 'engine', binary));
    if (bundled !== undefined)
        return bundled;
    const adjacent = await existingFile(resolve(workingDirectory, binary));
    if (adjacent !== undefined)
        return adjacent;
    return searchPath(binary);
}
function pipeLines(stream, write) {
    if (stream === null)
        return undefined;
    const reader = createInterface({ input: stream });
    reader.on('line', write);
    return reader;
}
async function waitForExit(child, timeoutMs) {
    if (child.exitCode !== null || child.signalCode !== null)
        return true;
    return new Promise((resolveExit) => {
        const timer = setTimeout(() => {
            cleanup();
            resolveExit(false);
        }, timeoutMs);
        const onExit = () => {
            cleanup();
            resolveExit(true);
        };
        const cleanup = () => {
            clearTimeout(timer);
            child.off('exit', onExit);
        };
        child.once('exit', onExit);
    });
}
export class EngineController {
    logger;
    config;
    endpoint;
    abort = new AbortController();
    child;
    readers = [];
    startPromise;
    stopping = false;
    constructor(config, logger = console) {
        this.logger = logger;
        this.config = resolvedConfig(config);
        this.endpoint = validateEndpoint(this.config.endpoint, this.config.allowRemoteEndpoint);
    }
    ensureReady() {
        this.startPromise ??= this.start().catch((error) => {
            if (this.abort.signal.aborted)
                return false;
            throw error;
        });
        return this.startPromise;
    }
    async start() {
        if (await probeHealth(this.endpoint, this.config.healthTimeoutMs, this.config.apiKeyEnv, this.abort.signal)) {
            this.logger.info(`MoE4All engine connected at ${this.endpoint.origin}`);
            return true;
        }
        if (this.config.mode === 'connect') {
            this.logger.warn(`MoE4All engine is not reachable at ${this.endpoint.origin}`);
            return false;
        }
        const executable = await resolveEngineExecutable(this.config);
        if (executable === undefined || this.config.arguments.length === 0) {
            const detail = executable === undefined
                ? 'set executable or MOE4ALL_ENGINE'
                : 'set arguments with serve options and a model path';
            const message = `MoE4All engine was not started: ${detail}`;
            if (this.config.mode === 'managed')
                throw new Error(message);
            this.logger.warn(message);
            return false;
        }
        const child = this.launch(executable);
        const deadline = Date.now() + this.config.startupTimeoutMs;
        while (Date.now() < deadline) {
            if (this.abort.signal.aborted)
                return false;
            if (child.exitCode !== null || child.signalCode !== null) {
                throw new Error(`MoE4All engine exited before becoming ready (code ${String(child.exitCode)})`);
            }
            if (await probeHealth(this.endpoint, this.config.healthTimeoutMs, this.config.apiKeyEnv, this.abort.signal)) {
                this.logger.info(`MoE4All engine ready at ${this.endpoint.origin}`);
                return true;
            }
            await delay(this.config.pollIntervalMs, undefined, { signal: this.abort.signal });
        }
        throw new Error(`MoE4All engine did not become healthy within ${this.config.startupTimeoutMs} ms`);
    }
    launch(executable) {
        const persistent = !this.config.stopOnUnload;
        const captureOutput = this.config.logOutput && !persistent;
        this.logger.info(`Starting MoE4All engine: ${executable}`);
        this.child = spawn(executable, this.config.arguments, {
            cwd: this.config.workingDirectory || undefined,
            env: process.env,
            shell: false,
            windowsHide: true,
            detached: persistent,
            stdio: captureOutput ? ['ignore', 'pipe', 'pipe'] : 'ignore',
        });
        this.child.on('error', (error) => {
            if (!this.stopping)
                this.logger.error(error);
        });
        this.child.on('exit', (code, signal) => {
            if (!this.stopping) {
                this.logger.warn(`MoE4All engine exited (code=${String(code)}, signal=${String(signal)})`);
            }
        });
        if (captureOutput) {
            this.readers = [
                pipeLines(this.child.stdout, (line) => this.logger.info(`[MoE4All] ${line}`)),
                pipeLines(this.child.stderr, (line) => this.logger.warn(`[MoE4All] ${line}`)),
            ].filter((reader) => reader !== undefined);
        }
        if (persistent)
            this.child.unref();
        return this.child;
    }
    async dispose() {
        if (this.stopping)
            return;
        this.stopping = true;
        this.abort.abort();
        for (const reader of this.readers)
            reader.close();
        this.readers = [];
        const child = this.child;
        this.child = undefined;
        if (child === undefined || !this.config.stopOnUnload)
            return;
        if (child.exitCode !== null || child.signalCode !== null)
            return;
        child.kill();
        if (await waitForExit(child, this.config.shutdownTimeoutMs))
            return;
        child.kill('SIGKILL');
        await waitForExit(child, this.config.shutdownTimeoutMs);
    }
}
//# sourceMappingURL=engine-controller.js.map