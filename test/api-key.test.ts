import assert from 'node:assert/strict'
import test from 'node:test'
import type { CredentialProvider, CredentialRef } from '@deepseek-ai/dsh-credentials'

import { ApiKeyManager, LOOPBACK_API_KEY } from '../src/api-key.js'

function memoryCredentials(): CredentialProvider {
  const values = new Map<string, string>()
  return {
    async resolve(ref: CredentialRef) {
      const value = values.get(ref)
      return value === undefined ? undefined : { value, source: 'test' }
    },
    async set(ref: CredentialRef, value: string) { values.set(ref, value) },
  } as CredentialProvider
}

test('loopback gets a DSH placeholder without requiring backend auth', async () => {
  const manager = new ApiKeyManager(memoryCredentials())
  const config = { host: '127.0.0.1', port: 8080 }
  assert.deepEqual(await manager.ensure(config), {
    ref: 'MOE4ALL_API_KEY',
    value: LOOPBACK_API_KEY,
    required: false,
  })
  assert.equal(await manager.backendKey(config), undefined)
})

test('non-loopback gets one stable generated key for DSH and the engine', async () => {
  const manager = new ApiKeyManager(memoryCredentials())
  const config = { host: '0.0.0.0', port: 8080 }
  const first = await manager.ensure(config)
  const second = await manager.ensure(config)
  assert.equal(first.required, true)
  assert.match(first.value, /^m4a_[A-Za-z0-9_-]+$/u)
  assert.equal(second.value, first.value)
  assert.equal(await manager.backendKey(config), first.value)
})
