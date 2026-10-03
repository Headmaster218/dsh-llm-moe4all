import { randomBytes } from 'node:crypto'
import { credentialRef, type CredentialProvider, type CredentialRef } from '@deepseek-ai/dsh-credentials'

import { isLoopback } from './connection.js'
import type { EngineConfig } from './engine-controller.js'

export const DEFAULT_API_KEY_REF = 'MOE4ALL_API_KEY'
export const LOOPBACK_API_KEY = 'moe4all-local'

export interface ApiKeyStatus {
  ref: string
  value: string
  required: boolean
}

export function apiKeyRef(config: EngineConfig): CredentialRef {
  return credentialRef(config.apiKeyEnv?.trim() || DEFAULT_API_KEY_REF)
}

export function apiKeyRequired(config: EngineConfig): boolean {
  const explicit = config.endpoint?.trim()
  if (explicit) return !isLoopback(new URL(explicit).hostname)
  const host = (config.host ?? '127.0.0.1').trim()
  return !isLoopback(host)
}

function generatedApiKey(): string {
  return `m4a_${randomBytes(24).toString('base64url')}`
}

export class ApiKeyManager {
  constructor(private readonly credentials: CredentialProvider) {}

  async ensure(config: EngineConfig): Promise<ApiKeyStatus> {
    const ref = apiKeyRef(config)
    const required = apiKeyRequired(config)
    const resolved = await this.credentials.resolve(ref)
    let value = resolved?.value
    if (!value) {
      value = required ? generatedApiKey() : LOOPBACK_API_KEY
      await this.credentials.set(ref, value)
    } else if (required && value === LOOPBACK_API_KEY) {
      value = generatedApiKey()
      await this.credentials.set(ref, value)
    }
    return { ref, value, required }
  }

  async set(config: EngineConfig, value: string): Promise<ApiKeyStatus> {
    const trimmed = value.trim()
    if (!trimmed) throw new Error('API key cannot be empty.')
    await this.credentials.set(apiKeyRef(config), trimmed)
    return { ref: apiKeyRef(config), value: trimmed, required: apiKeyRequired(config) }
  }

  async regenerate(config: EngineConfig): Promise<ApiKeyStatus> {
    return this.set(config, generatedApiKey())
  }

  async clientKey(config: EngineConfig): Promise<string> {
    return (await this.ensure(config)).value
  }

  async backendKey(config: EngineConfig): Promise<string | undefined> {
    return apiKeyRequired(config) ? (await this.ensure(config)).value : undefined
  }
}
