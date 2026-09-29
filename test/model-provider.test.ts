import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { test } from 'node:test'
import type { SettingsPathOp } from '@deepseek-ai/dsh-settings'

import { discoverModels, ModelProviderBridge } from '../src/model-provider.js'

const quietLogger = {
  info() {},
  warn() {},
  error() {},
}

function record(value: unknown): Record<string, unknown> {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}

function mutate(root: Record<string, unknown>, operation: SettingsPathOp): void {
  const path = [...operation.path]
  const last = path.pop()
  assert(last !== undefined)
  let cursor = root
  for (const part of path) {
    const value = cursor[part]
    if (value === null || typeof value !== 'object' || Array.isArray(value)) cursor[part] = {}
    cursor = cursor[part] as Record<string, unknown>
  }
  if (operation.op === 'set') cursor[last] = structuredClone(operation.value)
  else delete cursor[last]
}

class FakeSettings {
  readonly values: Record<string, Record<string, unknown>> = {
    'llm-pi-ai': {
      providers: {
        openai: { displayName: 'OpenAI' },
        moe4all: {
          timeoutMs: 42_000,
          models: [{
            id: 'Qwen3.8-Flash',
            reasoningEfforts: { medium: 'custom-medium' },
            compat: { supportsDeveloperRole: true, supportsTemperature: false },
          }],
        },
      },
    },
    'agent-default-model': { provider: 'openai', model: 'old-model', reasoningEffort: 'high' },
  }

  get(namespace: string): unknown {
    return this.values[namespace]
  }

  async mutate(namespace: string, operations: readonly SettingsPathOp[]): Promise<void> {
    const value = this.values[namespace]
    assert(value)
    for (const operation of operations) mutate(value, operation)
  }
}

async function modelServer(): Promise<{ endpoint: URL, close(): Promise<void> }> {
  const server = createServer((request, response) => {
    if (request.url === '/v1/models') {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({
        data: [
          { id: 'Qwen3.8-Flash' },
          { id: 'nomic-embed-text-v1.5' },
          { id: 'Qwen3.8-Flash' },
        ],
      }))
      return
    }
    response.writeHead(404)
    response.end()
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert(address && typeof address === 'object')
  return {
    endpoint: new URL(`http://127.0.0.1:${address.port}/v1`),
    async close() {
      server.close()
      await once(server, 'close')
    },
  }
}

test('model discovery filters embedding models and duplicate IDs', async () => {
  const server = await modelServer()
  assert.deepEqual(await discoverModels(server.endpoint), [
    { id: 'Qwen3.8-Flash', name: 'Qwen3.8-Flash' },
  ])
  await server.close()
})

test('provider bridge persists the live endpoint and activates the discovered model', async () => {
  const server = await modelServer()
  const settings = new FakeSettings()
  const bridge = new ModelProviderBridge(
    settings,
    server.endpoint,
    { contextWindow: 32_768, maxTokens: 4096, modelRefreshIntervalMs: 60_000 },
    quietLogger,
  )

  await bridge.refreshNow()
  const providers = record(settings.values['llm-pi-ai']!.providers)
  assert.deepEqual(providers.openai, { displayName: 'OpenAI' })
  const profile = record(providers.moe4all)
  assert.equal(profile.baseURL, server.endpoint.href.replace(/\/$/u, ''))
  assert.equal(profile.timeoutMs, 42_000)
  const model = record((profile.models as unknown[])[0])
  assert.deepEqual(model.reasoningEfforts, { medium: 'custom-medium' })
  assert.deepEqual(model.compat, { supportsDeveloperRole: false, supportsTemperature: false })

  await bridge.activateDefaultModel()
  assert.deepEqual(settings.values['agent-default-model'], {
    provider: 'moe4all',
    model: 'Qwen3.8-Flash',
    reasoningEffort: 'medium',
  })

  await bridge.dispose()
  await server.close()
})
