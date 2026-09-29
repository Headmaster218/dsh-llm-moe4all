import { setTimeout as delay } from 'node:timers/promises';
import { settingsNamespace } from '@deepseek-ai/dsh-settings';
const PI_AI_NAMESPACE = settingsNamespace('llm-pi-ai');
const DEFAULT_MODEL_NAMESPACE = settingsNamespace('agent-default-model');
const DEFAULTS = {
    contextWindow: 163_840,
    maxTokens: 102_400,
    vision: true,
    excludeModelNameContains: ['embed', 'embedding'],
    modelRefreshIntervalMs: 15_000,
    modelDiscoveryTimeoutMs: 3_000,
};
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function authorizationHeader(apiKeyEnv) {
    if (!apiKeyEnv)
        return {};
    const value = process.env[apiKeyEnv];
    return value ? { authorization: `Bearer ${value}` } : {};
}
function isQwen38(id) {
    return /qwen3(?:[.-]?8)/iu.test(id);
}
export async function discoverModels(endpoint, config = {}, parentSignal) {
    const timeout = AbortSignal.timeout(config.modelDiscoveryTimeoutMs ?? DEFAULTS.modelDiscoveryTimeoutMs);
    const signal = parentSignal === undefined ? timeout : AbortSignal.any([parentSignal, timeout]);
    const url = new URL('models', endpoint.href.endsWith('/') ? endpoint.href : `${endpoint.href}/`);
    const response = await fetch(url, {
        headers: authorizationHeader(config.apiKeyEnv ?? ''),
        signal,
    });
    if (!response.ok)
        throw new Error(`model discovery returned HTTP ${response.status}`);
    const body = await response.json();
    if (!isRecord(body) || !Array.isArray(body.data)) {
        throw new Error('model discovery response has no data array');
    }
    const excluded = (config.excludeModelNameContains ?? DEFAULTS.excludeModelNameContains)
        .map((value) => value.toLowerCase());
    const seen = new Set();
    const models = [];
    for (const value of body.data) {
        if (!isRecord(value) || typeof value.id !== 'string' || value.id.trim() === '')
            continue;
        const id = value.id.trim();
        const lower = id.toLowerCase();
        if (excluded.some((part) => part !== '' && lower.includes(part)) || seen.has(id))
            continue;
        seen.add(id);
        models.push({ id, name: id });
    }
    if (models.length === 0)
        throw new Error('model discovery returned no chat models');
    return models;
}
export function providerProfile(endpoint, models, config = {}) {
    const contextWindow = config.contextWindow ?? DEFAULTS.contextWindow;
    const maxTokens = config.maxTokens ?? DEFAULTS.maxTokens;
    const input = config.vision ?? DEFAULTS.vision
        ? ['text', 'image']
        : ['text'];
    return {
        displayName: 'MoE4All',
        api: 'openai-completions',
        baseURL: endpoint.href.replace(/\/$/u, ''),
        ...(config.apiKeyEnv ? { apiKeyEnv: config.apiKeyEnv } : {}),
        defaultContextWindow: contextWindow,
        defaultMaxTokens: maxTokens,
        defaultInput: input,
        compat: { supportsDeveloperRole: false },
        models: models.map((model) => ({
            ...model,
            contextWindow,
            maxTokens,
            input,
            reasoningEfforts: isQwen38(model.id)
                ? { low: 'low', medium: 'medium', xhigh: 'xhigh' }
                : false,
            compat: { supportsDeveloperRole: false },
        })),
    };
}
function mergeProviderProfile(existing, generated) {
    const previous = isRecord(existing) ? existing : {};
    const previousModels = Array.isArray(previous.models)
        ? new Map(previous.models.filter(isRecord).map((model) => [String(model.id ?? ''), model]))
        : new Map();
    const models = generated.models.map((model) => {
        const old = previousModels.get(model.id) ?? {};
        const oldCompat = isRecord(old.compat) ? old.compat : {};
        const oldEfforts = isRecord(old.reasoningEfforts) ? old.reasoningEfforts : undefined;
        return {
            ...old,
            ...model,
            ...(oldEfforts === undefined ? {} : { reasoningEfforts: oldEfforts }),
            compat: { ...oldCompat, ...model.compat },
        };
    });
    return {
        ...previous,
        ...generated,
        compat: {
            ...(isRecord(previous.compat) ? previous.compat : {}),
            ...generated.compat,
        },
        models,
    };
}
export class ModelProviderBridge {
    settings;
    endpoint;
    config;
    logger;
    abort = new AbortController();
    signature = '';
    lastError = '';
    syncInFlight;
    discovered = [];
    constructor(settings, endpoint, config, logger) {
        this.settings = settings;
        this.endpoint = endpoint;
        this.config = config;
        this.logger = logger;
    }
    async run() {
        try {
            while (!this.abort.signal.aborted) {
                await this.refreshNow();
                if (this.abort.signal.aborted)
                    break;
                await delay(this.config.modelRefreshIntervalMs ?? DEFAULTS.modelRefreshIntervalMs, undefined, { signal: this.abort.signal });
            }
        }
        catch (error) {
            if (!this.abort.signal.aborted)
                throw error;
        }
    }
    get models() {
        return this.discovered.map((model) => ({ ...model }));
    }
    async refreshNow() {
        if (this.abort.signal.aborted)
            return;
        if (this.syncInFlight !== undefined)
            return this.syncInFlight;
        const sync = this.syncOnce().finally(() => {
            if (this.syncInFlight === sync)
                this.syncInFlight = undefined;
        });
        this.syncInFlight = sync;
        await sync;
    }
    async syncOnce() {
        try {
            const current = this.settings.get(PI_AI_NAMESPACE);
            if (!isRecord(current))
                throw new Error('llm-pi-ai settings are not active yet');
            const models = await discoverModels(this.endpoint, this.config, this.abort.signal);
            const providers = isRecord(current.providers) ? current.providers : {};
            const profile = mergeProviderProfile(providers.moe4all, providerProfile(this.endpoint, models, this.config));
            const signature = JSON.stringify(profile);
            const changed = signature !== this.signature;
            if (changed) {
                await this.settings.mutate(PI_AI_NAMESPACE, [
                    { op: 'set', path: ['providers', 'moe4all'], value: profile },
                ]);
                this.signature = signature;
            }
            this.discovered = models;
            this.lastError = '';
            if (changed) {
                this.logger.info(`MoE4All discovered ${models.length} chat model(s): ${models.map((model) => model.id).join(', ')}`);
            }
        }
        catch (error) {
            if (this.abort.signal.aborted)
                return;
            const detail = error instanceof Error ? error.message : String(error);
            if (detail !== this.lastError) {
                this.logger.warn(`MoE4All model discovery is waiting for the configured endpoint: ${detail}`);
                this.lastError = detail;
            }
        }
    }
    async activateDefaultModel() {
        await this.refreshNow();
        const model = this.discovered[0];
        if (model === undefined)
            throw new Error('MoE4All has no discovered chat model to activate');
        const current = this.settings.get(DEFAULT_MODEL_NAMESPACE);
        if (!isRecord(current))
            throw new Error('agent-default-model settings are not active yet');
        const operations = [
            { op: 'set', path: ['provider'], value: 'moe4all' },
            { op: 'set', path: ['model'], value: model.id },
        ];
        if (isQwen38(model.id)) {
            const effort = typeof current.reasoningEffort === 'string'
                && ['low', 'medium', 'xhigh'].includes(current.reasoningEffort)
                ? current.reasoningEffort
                : 'medium';
            operations.push({ op: 'set', path: ['reasoningEffort'], value: effort });
        }
        else {
            operations.push({ op: 'unset', path: ['reasoningEffort'] });
        }
        await this.settings.mutate(DEFAULT_MODEL_NAMESPACE, operations);
    }
    async dispose() {
        this.abort.abort();
        await this.syncInFlight;
    }
}
//# sourceMappingURL=model-provider.js.map