import { spawn } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { access } from 'node:fs/promises';
import { freemem, totalmem, networkInterfaces } from 'node:os';
import { basename, delimiter, dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { endpointFromConfig, isLoopback, validateEndpoint } from './connection.js';
export { endpointFromConfig, validateEndpoint } from './connection.js';
export const DEFAULT_CONFIG = {
    mode: 'prompt',
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
function resolvedConfig(config) {
    return {
        ...DEFAULT_CONFIG,
        ...config,
        arguments: [...(config.arguments ?? DEFAULT_CONFIG.arguments)],
        processNames: [...(config.processNames ?? DEFAULT_CONFIG.processNames)],
    };
}
export function effectiveLaunchMode(mode) {
    return mode === 'managed' ? 'prompt' : mode ?? DEFAULT_CONFIG.mode;
}
function isLocalAddress(hostname) {
    const host = hostname.replace(/^\[|\]$/g, '');
    return isLoopback(host) || Object.values(networkInterfaces()).some(interfaces => interfaces?.some(item => item.address === host));
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
function unsupportedResourcesCommand(result) {
    return /(?:unrecognized|unknown) subcommand ['"]?resources/iu.test(`${result.stderr}\n${result.stdout}`);
}
function configuredDevice(arguments_) {
    for (let index = 0; index < arguments_.length; index += 1) {
        const argument = arguments_[index];
        const inline = /^--dev=(.+)$/u.exec(argument)?.[1];
        if (inline !== undefined)
            return inline;
        if (argument === '--dev')
            return arguments_[index + 1];
        if (argument === '--set') {
            const value = arguments_[index + 1];
            if (value?.startsWith('device.dev='))
                return value.slice('device.dev='.length);
            index += 1;
        }
    }
    return undefined;
}
async function probeWindowsSnapshot(timeout) {
    const script = [
        "$ErrorActionPreference = 'Stop'",
        '$os = Get-CimInstance Win32_OperatingSystem',
        '$gpuUsage = $null',
        "try { $gpuUsage = [Math]::Ceiling(((Get-Counter '\\GPU Adapter Memory(*)\\Dedicated Usage' -MaxSamples 1).CounterSamples | Measure-Object CookedValue -Sum).Sum) } catch {}",
        '[pscustomobject]@{ ram_total_bytes = [uint64]$os.TotalVisibleMemorySize * 1024; ram_available_bytes = [uint64]$os.FreePhysicalMemory * 1024; commit_total_bytes = [uint64]$os.TotalVirtualMemorySize * 1024; commit_available_bytes = [uint64]$os.FreeVirtualMemory * 1024; vram_used_bytes = $gpuUsage } | ConvertTo-Json -Compress',
    ].join('; ');
    const windows = await captureProcess('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script], timeout);
    if (windows.exitCode !== 0) {
        throw new Error(`Windows resource probe failed (${windows.exitCode}): ${windows.stderr.trim()}`);
    }
    return JSON.parse(windows.stdout.trim());
}
function parseLegacyDevice(output, requested) {
    const devices = output.split(/\r?\n/u).flatMap((line) => {
        const match = /^\s*(Vulkan\d+):\s+(.+?)\s+\[.*?([\d.]+)\s+GiB device-local\](.*)$/u.exec(line);
        if (match === null)
            return [];
        return [{
                device: match[1],
                deviceName: match[2].trim(),
                totalBytes: Math.round(Number(match[3]) * 1024 ** 3),
                selected: match[4].includes('<- default'),
            }];
    });
    const selected = requested === undefined
        ? devices.find(item => item.selected) ?? devices[0]
        : devices.find(item => item.device.toLowerCase() === requested.toLowerCase());
    if (selected === undefined || selected.totalBytes <= 0) {
        throw new Error(`The legacy engine did not report the selected Vulkan device${requested === undefined ? '' : ` ${requested}`}.`);
    }
    return selected;
}
async function probeLegacyWindowsResources(executable, config) {
    const timeout = config.resourceProbeTimeoutMs ?? DEFAULT_CONFIG.resourceProbeTimeoutMs;
    const deviceResult = await captureProcess(executable, ['devices'], timeout, config.workingDirectory);
    if (deviceResult.exitCode !== 0) {
        throw new Error(`infr devices probe failed (${deviceResult.exitCode}): ${deviceResult.stderr.trim()}`);
    }
    const selected = parseLegacyDevice(deviceResult.stdout, configuredDevice(config.arguments ?? []));
    const raw = await probeWindowsSnapshot(timeout);
    const used = typeof raw.vram_used_bytes === 'number' && Number.isFinite(raw.vram_used_bytes)
        ? Math.max(0, raw.vram_used_bytes)
        : undefined;
    return {
        ramTotalBytes: finiteBytes(raw.ram_total_bytes, 'ram_total_bytes'),
        ramAvailableBytes: finiteBytes(raw.ram_available_bytes, 'ram_available_bytes'),
        commitTotalBytes: finiteBytes(raw.commit_total_bytes, 'commit_total_bytes'),
        commitAvailableBytes: finiteBytes(raw.commit_available_bytes, 'commit_available_bytes'),
        vramTotalBytes: selected.totalBytes,
        vramAvailableBytes: used === undefined ? selected.totalBytes : Math.max(0, selected.totalBytes - used),
        vramLive: used !== undefined,
        compatibilityFallback: true,
        device: selected.device,
        deviceName: selected.deviceName,
    };
}
export async function probeEngineResources(executable, config) {
    const result = await captureProcess(executable, probeArguments(config.arguments ?? []), config.resourceProbeTimeoutMs ?? DEFAULT_CONFIG.resourceProbeTimeoutMs, config.workingDirectory);
    if (result.exitCode !== 0) {
        if (process.platform === 'win32' && unsupportedResourcesCommand(result)) {
            return probeLegacyWindowsResources(executable, config);
        }
        throw new Error(`infr resource probe failed (${result.exitCode}): ${result.stderr.trim()}`);
    }
    const raw = JSON.parse(result.stdout.trim());
    const device = typeof raw.device === 'string' ? raw.device : undefined;
    const deviceName = typeof raw.device_name === 'string' ? raw.device_name : undefined;
    let windows;
    if (process.platform === 'win32') {
        try {
            windows = await probeWindowsSnapshot(config.resourceProbeTimeoutMs ?? DEFAULT_CONFIG.resourceProbeTimeoutMs);
        }
        catch { }
    }
    return {
        ramTotalBytes: typeof raw.ram_total_bytes === 'number' ? raw.ram_total_bytes : windows?.ram_total_bytes ?? totalmem(),
        ramAvailableBytes: typeof raw.ram_available_bytes === 'number' ? raw.ram_available_bytes : windows?.ram_available_bytes ?? freemem(),
        ...(windows === undefined ? {} : {
            commitTotalBytes: windows.commit_total_bytes,
            commitAvailableBytes: windows.commit_available_bytes,
        }),
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
function formatGiB(bytes) {
    return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
}
const GIB = 1024 ** 3;
function setValue(arguments_, path) {
    for (let index = 0; index < arguments_.length; index += 1) {
        const argument = arguments_[index];
        if (argument === '--set') {
            const value = arguments_[index + 1];
            if (value?.startsWith(`${path}=`))
                return value.slice(path.length + 1);
            index += 1;
            continue;
        }
        const inline = /^--set=(.+)$/u.exec(argument)?.[1];
        if (inline?.startsWith(`${path}=`))
            return inline.slice(path.length + 1);
    }
    return undefined;
}
function automaticRamBudgetAdjustment(arguments_, resources) {
    if (resources?.commitAvailableBytes === undefined)
        return undefined;
    if (setValue(arguments_, 'device.ram_budget') !== undefined)
        return undefined;
    const profile = setValue(arguments_, 'device.auto_profile');
    if (profile !== 'aggressive' && profile !== 'conservative')
        return undefined;
    const requestedBytes = profile === 'aggressive'
        ? Math.max(0, resources.ramTotalBytes - 14 * GIB)
        : Math.max(0, resources.ramAvailableBytes - 3 * GIB);
    const expectedVramCommit = profile === 'aggressive'
        ? Math.max(0, resources.vramTotalBytes - 2 * GIB)
        : Math.max(0, resources.vramAvailableBytes - GIB);
    const commitCeiling = Math.max(0, resources.commitAvailableBytes - expectedVramCommit - 2 * GIB);
    const physicalCeiling = Math.max(0, resources.ramAvailableBytes - 3 * GIB);
    const safeBytes = Math.floor(Math.min(requestedBytes, commitCeiling, physicalCeiling) / (1024 ** 2)) * 1024 ** 2;
    if (safeBytes >= requestedBytes)
        return undefined;
    return {
        budgetBytes: safeBytes,
        requestedBytes,
        arguments: [...arguments_, '--set', `device.ram_budget=${safeBytes}`],
    };
}
function cleanOutputLine(line) {
    return line.replaceAll(/\u001B\[[0-?]*[ -/]*[@-~]/gu, '').replaceAll('\r', '').trimEnd();
}
const DEFAULT_DEPENDENCIES = {
    detectProcesses: detectRunningEngines,
    probeResources: probeEngineResources,
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
    initialPromise;
    startPromise;
    stopping = false;
    currentStatus;
    startupStartedAt;
    startupLines = [];
    adjustedRamBudgetBytes;
    constructor(config, logger = console, dependencies = {}) {
        this.logger = logger;
        this.config = resolvedConfig(config);
        this.endpoint = validateEndpoint(endpointFromConfig(this.config), this.config.allowRemoteEndpoint);
        this.dependencies = { ...DEFAULT_DEPENDENCIES, ...dependencies };
        this.currentStatus = {
            phase: 'checking',
            endpoint: this.endpoint.href.replace(/\/$/u, ''),
            mode: effectiveLaunchMode(this.config.mode),
            ready: false,
            canStart: false,
        };
    }
    statusSnapshot() {
        return structuredClone({ ...this.currentStatus, ...this.startupDetails(), owned: this.ownsProcess });
    }
    get ownsProcess() {
        return this.child !== undefined && this.child.exitCode === null && this.child.signalCode === null;
    }
    get isStarting() { return this.startPromise !== undefined; }
    async refreshStatus() {
        if (await probeHealth(this.endpoint, this.config.healthTimeoutMs, this.config.apiKeyEnv, this.abort.signal)) {
            return this.setStatus({
                phase: 'ready',
                ready: true,
                canStart: false,
                message: `Connected to MoE4All at ${this.endpoint.origin}`,
            });
        }
        if (this.currentStatus.phase === 'starting' || this.currentStatus.phase === 'resource-warning' || this.currentStatus.phase === 'error') {
            return this.statusSnapshot();
        }
        if (effectiveLaunchMode(this.config.mode) === 'connect') {
            return this.setStatus({ phase: 'offline', ready: false, canStart: false, message: 'The configured service is not reachable.' });
        }
        if (!isLocalAddress(this.endpoint.hostname)) {
            return this.setStatus({
                phase: 'offline',
                ready: false,
                canStart: false,
                message: 'The configured remote MoE4All endpoint is not reachable.',
            });
        }
        const executable = await resolveEngineExecutable(this.config);
        if (executable === undefined) {
            return this.setStatus({
                phase: 'missing-executable',
                ready: false,
                canStart: false,
                message: 'MoE4All is not installed or its executable path is not configured.',
            });
        }
        if (this.config.arguments.length === 0) {
            return this.setStatus({
                phase: 'missing-arguments',
                ready: false,
                canStart: false,
                executable,
                message: 'Configure serve arguments and a model path before starting MoE4All.',
            });
        }
        return this.setStatus({
            phase: 'offline',
            ready: false,
            canStart: true,
            executable,
            message: 'MoE4All is configured and ready to start.',
        });
    }
    ensureReady(allowAutomatic = true) {
        this.initialPromise ??= this.initialize(allowAutomatic);
        return this.initialPromise;
    }
    requestStart(force = false) {
        if (this.startPromise !== undefined)
            return this.startPromise;
        const run = this.start(force).catch((error) => {
            if (this.abort.signal.aborted)
                return { ok: false, status: this.statusSnapshot() };
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(error instanceof Error ? error : new Error(message));
            return {
                ok: false,
                status: this.setStatus({
                    phase: 'error',
                    ready: false,
                    canStart: true,
                    ...this.startupDetails(),
                    message,
                }),
            };
        }).finally(() => {
            if (this.startPromise === run)
                this.startPromise = undefined;
        });
        this.startPromise = run;
        return run;
    }
    async initialize(allowAutomatic) {
        const status = await this.refreshStatus();
        if (status.ready) {
            this.logger.info(`MoE4All engine connected at ${this.endpoint.origin}`);
            return true;
        }
        if (!allowAutomatic || effectiveLaunchMode(this.config.mode) !== 'auto') {
            this.logger.info(`MoE4All engine is waiting at ${this.endpoint.origin}; launch mode is ${effectiveLaunchMode(this.config.mode)}`);
            return false;
        }
        return (await this.requestStart(false)).ok;
    }
    setStatus(next) {
        this.currentStatus = {
            endpoint: this.endpoint.href.replace(/\/$/u, ''),
            mode: effectiveLaunchMode(this.config.mode),
            ...next,
        };
        return this.statusSnapshot();
    }
    startupDetails() {
        return {
            ...(this.startupStartedAt === undefined ? {} : { startupStartedAt: this.startupStartedAt }),
            ...(this.startupLines.length === 0 ? {} : { startupLines: [...this.startupLines] }),
            ...(this.adjustedRamBudgetBytes === undefined ? {} : { adjustedRamBudgetBytes: this.adjustedRamBudgetBytes }),
        };
    }
    appendStartupLine(line) {
        const cleaned = cleanOutputLine(line);
        if (cleaned === '')
            return;
        this.startupLines.push(cleaned);
        if (this.startupLines.length > 120)
            this.startupLines.splice(0, this.startupLines.length - 120);
        if (this.currentStatus.phase === 'starting') {
            this.currentStatus = { ...this.currentStatus, ...this.startupDetails() };
        }
    }
    processNames(executable) {
        return [...new Set([...this.config.processNames, basename(executable)])];
    }
    async findExistingEngine(executable) {
        return this.dependencies.detectProcesses(this.processNames(executable));
    }
    async resourceAssessment(executable) {
        let resources;
        const reasons = [];
        try {
            resources = await this.dependencies.probeResources(executable, this.config);
            if (resources.ramAvailableBytes / resources.ramTotalBytes <= this.config.minimumFreeRamFraction) {
                reasons.push(`RAM free is ${percent(resources.ramAvailableBytes, resources.ramTotalBytes)}; more than ${this.config.minimumFreeRamFraction * 100}% is required.`);
            }
            if (!resources.vramLive) {
                reasons.push('The Vulkan driver did not provide a live VRAM availability measurement.');
            }
            else if (resources.vramAvailableBytes / resources.vramTotalBytes <= this.config.minimumFreeVramFraction) {
                reasons.push(`VRAM free is ${percent(resources.vramAvailableBytes, resources.vramTotalBytes)}; more than ${this.config.minimumFreeVramFraction * 100}% is required.`);
            }
        }
        catch (error) {
            reasons.push(`Resource usage could not be measured: ${error instanceof Error ? error.message : String(error)}`);
        }
        return { reasons, ...(resources === undefined ? {} : { resources }) };
    }
    async start(force) {
        const status = await this.refreshStatus();
        if (status.ready)
            return { ok: true, status };
        if (effectiveLaunchMode(this.config.mode) === 'connect')
            return { ok: false, status };
        if (!isLocalAddress(this.endpoint.hostname)) {
            return {
                ok: false,
                status: this.setStatus({
                    phase: 'error',
                    ready: false,
                    canStart: false,
                    message: 'MoE4All will not start a local engine for a remote endpoint.',
                }),
            };
        }
        const executable = await resolveEngineExecutable(this.config);
        if (executable === undefined) {
            return {
                ok: false,
                status: this.setStatus({
                    phase: 'missing-executable',
                    ready: false,
                    canStart: false,
                    message: 'MoE4All is not installed or its executable path is not configured.',
                }),
            };
        }
        if (this.config.arguments.length === 0) {
            return {
                ok: false,
                status: this.setStatus({
                    phase: 'missing-arguments',
                    ready: false,
                    canStart: false,
                    executable,
                    message: 'Configure serve arguments and a model path before starting MoE4All.',
                }),
            };
        }
        const existing = await this.findExistingEngine(executable);
        if (existing.length > 0) {
            const detail = existing.map((item) => `${item.name} (PID ${item.pid})`).join(', ');
            return {
                ok: false,
                status: this.setStatus({
                    phase: 'duplicate-process',
                    ready: false,
                    canStart: false,
                    executable,
                    processes: existing,
                    message: `Another MoE4All engine process already exists: ${detail}. Configure its actual IP and port instead.`,
                }),
            };
        }
        const assessment = await this.resourceAssessment(executable);
        if (assessment.reasons.length > 0 && !force) {
            this.logger.warn(`MoE4All startup requires confirmation: ${assessment.reasons.join(' ')}`);
            return {
                ok: false,
                status: this.setStatus({
                    phase: 'resource-warning',
                    ready: false,
                    canStart: true,
                    executable,
                    reasons: assessment.reasons,
                    ...(assessment.resources === undefined ? {} : { resources: assessment.resources }),
                    message: 'MoE4All needs confirmation before starting with the current resource headroom.',
                }),
            };
        }
        const raced = await this.findExistingEngine(executable);
        if (raced.length > 0) {
            const detail = raced.map((item) => `${item.name} (PID ${item.pid})`).join(', ');
            return {
                ok: false,
                status: this.setStatus({
                    phase: 'duplicate-process',
                    ready: false,
                    canStart: false,
                    executable,
                    processes: raced,
                    message: `Another MoE4All engine appeared during startup: ${detail}.`,
                }),
            };
        }
        const adjustment = automaticRamBudgetAdjustment(this.config.arguments, assessment.resources);
        this.startupStartedAt = new Date().toISOString();
        this.startupLines = [];
        this.adjustedRamBudgetBytes = adjustment?.budgetBytes;
        if (adjustment !== undefined) {
            this.appendStartupLine(`Compatibility guard: RAM budget reduced from ${formatGiB(adjustment.requestedBytes)} to ${formatGiB(adjustment.budgetBytes)} for the current Windows commit headroom.`);
        }
        this.setStatus({
            phase: 'starting',
            ready: false,
            canStart: false,
            executable,
            ...(assessment.resources === undefined ? {} : { resources: assessment.resources }),
            ...this.startupDetails(),
            message: 'MoE4All is starting.',
        });
        const child = this.launch(executable, adjustment?.arguments ?? this.config.arguments);
        const deadline = Date.now() + this.config.startupTimeoutMs;
        while (Date.now() < deadline) {
            if (this.abort.signal.aborted)
                return { ok: false, status: this.statusSnapshot() };
            if (child.exitCode !== null || child.signalCode !== null) {
                throw new Error(`MoE4All engine exited before becoming ready (code ${String(child.exitCode)}).`);
            }
            if (await probeHealth(this.endpoint, this.config.healthTimeoutMs, this.config.apiKeyEnv, this.abort.signal)) {
                this.logger.info(`MoE4All engine ready at ${this.endpoint.origin}`);
                const ready = this.setStatus({
                    phase: 'ready',
                    ready: true,
                    canStart: false,
                    executable,
                    ...this.startupDetails(),
                    message: `MoE4All is ready at ${this.endpoint.origin}.`,
                });
                return { ok: true, status: ready };
            }
            await delay(this.config.pollIntervalMs, undefined, { signal: this.abort.signal });
        }
        throw new Error(`MoE4All engine did not become healthy within ${this.config.startupTimeoutMs} ms`);
    }
    launch(executable, arguments_) {
        const persistent = !this.config.stopOnUnload;
        const captureOutput = !persistent;
        this.logger.info(`Starting MoE4All engine: ${executable}`);
        this.child = spawn(executable, arguments_, {
            cwd: this.config.workingDirectory || undefined,
            env: { ...process.env, ...(this.config.apiKeyEnv && process.env[this.config.apiKeyEnv] ? { INFR_API_KEY: process.env[this.config.apiKeyEnv] } : {}) },
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
                this.setStatus({
                    phase: 'offline',
                    ready: false,
                    canStart: true,
                    executable,
                    ...this.startupDetails(),
                    message: `MoE4All exited (code=${String(code)}, signal=${String(signal)}).`,
                });
            }
        });
        if (captureOutput) {
            this.readers = [
                pipeLines(this.child.stdout, (line) => {
                    this.appendStartupLine(line);
                    if (this.config.logOutput)
                        this.logger.info(`[MoE4All] ${line}`);
                }),
                pipeLines(this.child.stderr, (line) => {
                    this.appendStartupLine(line);
                    if (this.config.logOutput)
                        this.logger.warn(`[MoE4All] ${line}`);
                }),
            ].filter((reader) => reader !== undefined);
        }
        if (persistent)
            this.child.unref();
        return this.child;
    }
    async dispose(forceStop = false) {
        if (this.stopping)
            return;
        this.stopping = true;
        this.abort.abort();
        for (const reader of this.readers)
            reader.close();
        this.readers = [];
        const child = this.child;
        this.child = undefined;
        if (child === undefined || (!forceStop && !this.config.stopOnUnload))
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