import { spawn } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { freemem, totalmem } from 'node:os';
import { basename, delimiter, dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
export const DEFAULT_CONFIG = {
    mode: 'connect',
    protocol: 'http',
    host: '127.0.0.1',
    port: 8080,
    apiBasePath: '/v1',
    endpoint: '',
    executable: '',
    arguments: [],
    workingDirectory: '',
    apiKeyEnv: '',
    allowRemoteEndpoint: false,
    processNames: ['infr.exe', 'moe4all.exe', 'infr', 'moe4all'],
    minimumFreeRamFraction: 0.5,
    minimumFreeVramFraction: 0.5,
    promptWhenBusy: true,
    resourceProbeTimeoutMs: 10_000,
    startupTimeoutMs: 120_000,
    healthTimeoutMs: 2_000,
    pollIntervalMs: 500,
    shutdownTimeoutMs: 5_000,
    stopOnUnload: true,
    logOutput: true,
};
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
function resolvedConfig(config) {
    return {
        ...DEFAULT_CONFIG,
        ...config,
        arguments: [...(config.arguments ?? DEFAULT_CONFIG.arguments)],
        processNames: [...(config.processNames ?? DEFAULT_CONFIG.processNames)],
    };
}
function isLoopback(hostname) {
    const host = hostname.toLowerCase();
    return host === 'localhost' || host === '::1' || host === '[::1]' || /^127(?:\.|$)/.test(host);
}
function urlHost(host) {
    const trimmed = host.trim();
    return trimmed.includes(':') && !trimmed.startsWith('[') ? `[${trimmed}]` : trimmed;
}
export function endpointFromConfig(config) {
    const explicit = config.endpoint?.trim();
    if (explicit)
        return explicit;
    const protocol = config.protocol ?? DEFAULT_CONFIG.protocol;
    const host = config.host ?? DEFAULT_CONFIG.host;
    const port = config.port ?? DEFAULT_CONFIG.port;
    const rawPath = config.apiBasePath ?? DEFAULT_CONFIG.apiBasePath;
    const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    return `${protocol}://${urlHost(host)}:${port}${path}`;
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
function captureProcess(executable, arguments_, timeoutMs, workingDirectory) {
    return new Promise((resolveCapture, reject) => {
        const child = spawn(executable, arguments_, {
            cwd: workingDirectory || undefined,
            env: process.env,
            shell: false,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        child.stdout?.setEncoding('utf8');
        child.stderr?.setEncoding('utf8');
        child.stdout?.on('data', (chunk) => { stdout += chunk; });
        child.stderr?.on('data', (chunk) => { stderr += chunk; });
        const timer = setTimeout(() => child.kill(), timeoutMs);
        child.once('error', (error) => {
            clearTimeout(timer);
            reject(error);
        });
        child.once('close', (code) => {
            clearTimeout(timer);
            resolveCapture({ exitCode: code ?? -1, stdout, stderr });
        });
    });
}
export function parseTasklistCsv(output) {
    const processes = [];
    for (const line of output.split(/\r?\n/u)) {
        const match = /^"((?:[^"]|"")*)","(\d+)"/u.exec(line.trim());
        if (match === null)
            continue;
        processes.push({ name: match[1].replaceAll('""', '"'), pid: Number(match[2]) });
    }
    return processes;
}
export async function detectRunningEngines(processNames) {
    const wanted = new Set(processNames.map((name) => basename(name).toLowerCase()));
    let result;
    let processes;
    if (process.platform === 'win32') {
        result = await captureProcess('tasklist.exe', ['/FO', 'CSV', '/NH'], 5_000);
        processes = parseTasklistCsv(result.stdout);
    }
    else {
        result = await captureProcess('ps', ['-A', '-o', 'pid=,comm='], 5_000);
        processes = result.stdout.split(/\r?\n/u).flatMap((line) => {
            const match = /^\s*(\d+)\s+(.+?)\s*$/u.exec(line);
            return match === null ? [] : [{ pid: Number(match[1]), name: basename(match[2]) }];
        });
    }
    if (result.exitCode !== 0) {
        throw new Error(`process inspection failed (${result.exitCode}): ${result.stderr.trim()}`);
    }
    return processes.filter((item) => item.pid !== process.pid && wanted.has(item.name.toLowerCase()));
}
function probeArguments(arguments_) {
    const result = ['resources'];
    for (let index = 0; index < arguments_.length; index += 1) {
        const argument = arguments_[index];
        if (/^--(?:dev|config|test-resource-profile)=/u.test(argument)) {
            result.push(argument);
            continue;
        }
        if (argument === '--dev' || argument === '--config' || argument === '--test-resource-profile') {
            const value = arguments_[index + 1];
            if (value !== undefined) {
                result.push(argument, value);
                index += 1;
            }
            continue;
        }
        if (argument === '--set') {
            const value = arguments_[index + 1];
            if (value?.startsWith('device.dev='))
                result.push(argument, value);
            if (value !== undefined)
                index += 1;
        }
    }
    return result;
}
function finiteBytes(value, field) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        throw new Error(`invalid ${field} in infr resources output`);
    }
    return value;
}
export async function probeEngineResources(executable, config) {
    const result = await captureProcess(executable, probeArguments(config.arguments ?? []), config.resourceProbeTimeoutMs ?? DEFAULT_CONFIG.resourceProbeTimeoutMs, config.workingDirectory);
    if (result.exitCode !== 0) {
        throw new Error(`infr resource probe failed (${result.exitCode}): ${result.stderr.trim()}`);
    }
    const raw = JSON.parse(result.stdout.trim());
    const device = typeof raw.device === 'string' ? raw.device : undefined;
    const deviceName = typeof raw.device_name === 'string' ? raw.device_name : undefined;
    return {
        ramTotalBytes: typeof raw.ram_total_bytes === 'number' ? raw.ram_total_bytes : totalmem(),
        ramAvailableBytes: typeof raw.ram_available_bytes === 'number' ? raw.ram_available_bytes : freemem(),
        vramTotalBytes: finiteBytes(raw.vram_total_bytes, 'vram_total_bytes'),
        vramAvailableBytes: finiteBytes(raw.vram_available_bytes, 'vram_available_bytes'),
        vramLive: raw.vram_live === true,
        ...(device === undefined ? {} : { device }),
        ...(deviceName === undefined ? {} : { deviceName }),
    };
}
function percent(available, total) {
    return `${(available / total * 100).toFixed(1)}%`;
}
export async function confirmBusyStartWithElectron(prompt) {
    let electron;
    try {
        electron = require('electron');
    }
    catch {
        return confirmBusyStartWithWindowsDialog(prompt);
    }
    const dialog = electron.dialog;
    if (dialog === undefined)
        return confirmBusyStartWithWindowsDialog(prompt);
    const resources = prompt.resources;
    const detail = [
        ...prompt.reasons,
        resources === undefined
            ? 'Resource usage could not be measured.'
            : `RAM free ${percent(resources.ramAvailableBytes, resources.ramTotalBytes)}, VRAM free ${percent(resources.vramAvailableBytes, resources.vramTotalBytes)}.`,
        '',
        'Starting another inference engine under load can exhaust memory or reset the GPU.',
        '当前资源不足时启动另一个推理引擎，可能耗尽内存或导致显卡重置。',
    ].join('\n');
    const result = await dialog.showMessageBox({
        type: 'warning',
        title: 'Start MoE4All? / 是否启动 MoE4All？',
        message: 'MoE4All automatic startup was paused because the machine is busy.',
        detail,
        buttons: ['Cancel / 取消', 'Start anyway / 仍然启动'],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
    });
    return result.response === 1;
}
async function confirmBusyStartWithWindowsDialog(prompt) {
    if (process.platform !== 'win32')
        return false;
    const resources = prompt.resources;
    const detail = [
        'MoE4All automatic startup was paused because the machine is busy.',
        ...prompt.reasons,
        resources === undefined
            ? 'Resource usage could not be measured.'
            : `RAM free ${percent(resources.ramAvailableBytes, resources.ramTotalBytes)}, VRAM free ${percent(resources.vramAvailableBytes, resources.vramTotalBytes)}.`,
        '',
        'Start anyway? This may exhaust memory or reset the GPU.',
    ].join('\n');
    const script = [
        'Add-Type -AssemblyName PresentationFramework;',
        '$result = [System.Windows.MessageBox]::Show($env:MOE4ALL_START_PROMPT,',
        "'MoE4All',",
        '[System.Windows.MessageBoxButton]::YesNo,',
        '[System.Windows.MessageBoxImage]::Warning,',
        '[System.Windows.MessageBoxResult]::No);',
        'if ($result -eq [System.Windows.MessageBoxResult]::Yes) { exit 0 } else { exit 1 }',
    ].join(' ');
    return new Promise((resolvePrompt) => {
        const child = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script], {
            env: { ...process.env, MOE4ALL_START_PROMPT: detail },
            shell: false,
            windowsHide: true,
            stdio: 'ignore',
        });
        child.once('error', () => resolvePrompt(false));
        child.once('close', (code) => resolvePrompt(code === 0));
    });
}
const DEFAULT_DEPENDENCIES = {
    detectProcesses: detectRunningEngines,
    probeResources: probeEngineResources,
    confirmBusyStart: confirmBusyStartWithElectron,
};
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
    dependencies;
    child;
    readers = [];
    startPromise;
    stopping = false;
    constructor(config, logger = console, dependencies = {}) {
        this.logger = logger;
        this.config = resolvedConfig(config);
        this.endpoint = validateEndpoint(endpointFromConfig(this.config), this.config.allowRemoteEndpoint);
        this.dependencies = { ...DEFAULT_DEPENDENCIES, ...dependencies };
    }
    ensureReady() {
        this.startPromise ??= this.start().catch((error) => {
            if (this.abort.signal.aborted)
                return false;
            throw error;
        });
        return this.startPromise;
    }
    blocked(message) {
        if (this.config.mode === 'managed')
            throw new Error(message);
        this.logger.warn(message);
        return false;
    }
    processNames(executable) {
        return [...new Set([...this.config.processNames, basename(executable)])];
    }
    async findExistingEngine(executable) {
        try {
            return await this.dependencies.detectProcesses(this.processNames(executable));
        }
        catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            this.blocked(`MoE4All engine was not started because process detection failed: ${detail}`);
            return undefined;
        }
    }
    async resourcesAllowStart(executable) {
        let resources;
        const reasons = [];
        try {
            resources = await this.dependencies.probeResources(executable, this.config);
            if (resources.ramAvailableBytes / resources.ramTotalBytes <= this.config.minimumFreeRamFraction) {
                reasons.push(`RAM free is ${percent(resources.ramAvailableBytes, resources.ramTotalBytes)}; more than ${this.config.minimumFreeRamFraction * 100}% is required for unattended startup.`);
            }
            if (!resources.vramLive) {
                reasons.push('The Vulkan driver did not provide a live VRAM availability measurement.');
            }
            else if (resources.vramAvailableBytes / resources.vramTotalBytes <= this.config.minimumFreeVramFraction) {
                reasons.push(`VRAM free is ${percent(resources.vramAvailableBytes, resources.vramTotalBytes)}; more than ${this.config.minimumFreeVramFraction * 100}% is required for unattended startup.`);
            }
        }
        catch (error) {
            reasons.push(`Resource usage could not be measured: ${error instanceof Error ? error.message : String(error)}`);
        }
        if (reasons.length === 0)
            return true;
        this.logger.warn(`MoE4All automatic startup paused: ${reasons.join(' ')}`);
        if (!this.config.promptWhenBusy)
            return false;
        const approved = await this.dependencies.confirmBusyStart({
            reasons,
            ...(resources === undefined ? {} : { resources }),
        });
        if (!approved)
            this.logger.warn('MoE4All startup was not approved; leaving the existing machine state unchanged');
        return approved;
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
        if (!isLoopback(this.endpoint.hostname)) {
            return this.blocked('MoE4All will not start a local engine for a remote endpoint');
        }
        const executable = await resolveEngineExecutable(this.config);
        if (executable === undefined || this.config.arguments.length === 0) {
            const detail = executable === undefined
                ? 'set executable or MOE4ALL_ENGINE'
                : 'set arguments with serve options and a model path';
            return this.blocked(`MoE4All engine was not started: ${detail}`);
        }
        const existing = await this.findExistingEngine(executable);
        if (existing === undefined)
            return false;
        if (existing.length > 0) {
            const detail = existing.map((item) => `${item.name} (PID ${item.pid})`).join(', ');
            return this.blocked(`MoE4All engine was not started because an engine process already exists: ${detail}. Configure its actual IP and port instead.`);
        }
        if (!await this.resourcesAllowStart(executable))
            return false;
        const raced = await this.findExistingEngine(executable);
        if (raced === undefined)
            return false;
        if (raced.length > 0) {
            const detail = raced.map((item) => `${item.name} (PID ${item.pid})`).join(', ');
            return this.blocked(`MoE4All engine startup was cancelled because another engine appeared: ${detail}`);
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