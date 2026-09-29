import { randomBytes } from 'node:crypto';
import { credentialRef } from '@deepseek-ai/dsh-credentials';
import { isLoopback } from './connection.js';
export const DEFAULT_API_KEY_REF = 'MOE4ALL_API_KEY';
export const LOOPBACK_API_KEY = 'moe4all-local';
export function apiKeyRef(config) {
    return credentialRef(config.apiKeyEnv?.trim() || DEFAULT_API_KEY_REF);
}
export function apiKeyRequired(config) {
    const explicit = config.endpoint?.trim();
    if (explicit)
        return !isLoopback(new URL(explicit).hostname);
    const host = (config.host ?? '127.0.0.1').trim();
    return !isLoopback(host);
}
function generatedApiKey() {
    return `m4a_${randomBytes(24).toString('base64url')}`;
}
export class ApiKeyManager {
    credentials;
    constructor(credentials) {
        this.credentials = credentials;
    }
    async ensure(config) {
        const ref = apiKeyRef(config);
        const required = apiKeyRequired(config);
        const resolved = await this.credentials.resolve(ref);
        let value = resolved?.value;
        if (!value) {
            value = required ? generatedApiKey() : LOOPBACK_API_KEY;
            await this.credentials.set(ref, value);
        }
        else if (required && value === LOOPBACK_API_KEY) {
            value = generatedApiKey();
            await this.credentials.set(ref, value);
        }
        return { ref, value, required };
    }
    async set(config, value) {
        const trimmed = value.trim();
        if (!trimmed)
            throw new Error('API key cannot be empty.');
        await this.credentials.set(apiKeyRef(config), trimmed);
        return { ref: apiKeyRef(config), value: trimmed, required: apiKeyRequired(config) };
    }
    async regenerate(config) {
        return this.set(config, generatedApiKey());
    }
    async clientKey(config) {
        return (await this.ensure(config)).value;
    }
    async backendKey(config) {
        return apiKeyRequired(config) ? (await this.ensure(config)).value : undefined;
    }
}
//# sourceMappingURL=api-key.js.map