import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { test } from 'node:test'
import type { SettingsPathOp } from '@deepseek-ai/dsh-settings'

import { discoverModels, ModelProviderBridge, providerProfile } from '../src/model-provider.js'

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
            compat: {
              supportsDeveloperRole: true, supportsTemperature: false,
              chatTemplateKwargs: { preserve_thinking: true },
            },
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

class DescribedSettings extends FakeSettings {
  override get = undefined

  describe(): Array<{ ns: string, value: unknown }> {
    return Object.entries(this.values).map(([ns, value]) => ({ ns, value }))
  }
}

async function modelServer(modelId = 'Qwen3.8-Flash'): Promise<{ endpoint: URL, close(): Promise<void> }> {
  const server = createServer((request, response) => {
    if (request.url === '/v1/models') {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({
        data: [
          { id: modelId },
          { id: 'nomic-embed-text-v1.5' },
          { id: modelId },
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
  assert.deepEqual(model.reasoningEfforts, { off: null, low: 'low', medium: 'custom-medium', xhigh: 'xhigh' })
  assert.deepEqual(model.compat, {
    ...providerProfile(server.endpoint, [{ id: 'Qwen3.8-Flash', name: 'Qwen3.8-Flash' }]).models[0]!.compat,
    chatTemplateKwargs: {
      preserve_thinking: true,
      enable_thinking: { $var: 'thinking.enabled' },
      reasoning_effort: { $var: 'thinking.effort', omitWhenOff: true },
    },
    supportsTemperature: false,
  })

  await bridge.activateDefaultModel()
  assert.deepEqual(settings.values['agent-default-model'], {
    provider: 'moe4all',
    model: 'Qwen3.8-Flash',
    reasoningEffort: 'medium',
  })

  await bridge.dispose()
  await server.close()
})

test('provider bridge reads settings from the DSH 0.2 descriptor API', async () => {
  const server = await modelServer()
  const settings = new DescribedSettings()
  const bridge = new ModelProviderBridge(settings, server.endpoint, {}, quietLogger)

  await bridge.refreshNow()
  await bridge.activateDefaultModel()
  assert.equal(record(record(settings.values['llm-pi-ai']!.providers).moe4all).baseURL, server.endpoint.href.replace(/\/$/u, ''))
  assert.equal(settings.values['agent-default-model']!.provider, 'moe4all')

  await bridge.dispose()
  await server.close()
})

test('provider bridge ignores an external endpoint until local engine ownership is established', async () => {
  const server = await modelServer()
  const settings = new FakeSettings()
  const before = structuredClone(settings.values)
  let enabled = false
  const bridge = new ModelProviderBridge(
    settings,
    server.endpoint,
    {},
    quietLogger,
    async () => undefined,
    () => enabled,
  )

  await bridge.refreshNow()
  assert.deepEqual(bridge.models, [])
  assert.deepEqual(settings.values, before)
  enabled = true
  await bridge.refreshNow()
  assert.deepEqual(bridge.models, [{ id: 'Qwen3.8-Flash', name: 'Qwen3.8-Flash' }])

  await bridge.dispose()
  await server.close()
})

test('Qwen 35B and FlashNext advertise only their supported reasoning choices and wire format', () => {
  for (const id of ['Qwen3.5-35B-A3B-Q4_K_M', 'Qwen3.6-35B-A3B-APEX-I-Balanced', 'qwen35moe', 'Qwen3_6-35B']) {
    const profile = providerProfile(new URL('http://127.0.0.1:8080/v1'), [{ id, name: id }])
    assert.equal(profile.reasoning, 'medium')
    assert.deepEqual(profile.models[0]!.reasoningEfforts, {
      off: null, low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: 'max',
    })
    assert.equal(profile.models[0]!.compat.thinkingFormat, 'chat-template')
  }
  const flash = providerProfile(new URL('http://127.0.0.1:8080/v1'), [{
    id: 'Qwen3.8-Flash-Next-AD-4.27bpw-Q4_K_M-M64', name: 'FlashNext',
  }]).models[0]!
  assert.deepEqual(flash.reasoningEfforts, { off: null, low: 'low', medium: 'medium', xhigh: 'xhigh' })
  assert.deepEqual(flash.compat.chatTemplateKwargs, {
    enable_thinking: { $var: 'thinking.enabled' },
    reasoning_effort: { $var: 'thinking.effort', omitWhenOff: true },
  })
  for (const id of ['other-model', 'Qwen3-32B', 'Qwen3.80-test']) {
    const profile = providerProfile(new URL('http://127.0.0.1:8080/v1'), [{ id, name: id }])
    assert.equal(profile.reasoning, undefined)
    assert.equal(profile.models[0]!.reasoningEfforts, false)
    assert.deepEqual(profile.models[0]!.compat, { supportsDeveloperRole: false })
  }
})

test('discovery upgrades saved Qwen capabilities and preserves selected off/high efforts', async () => {
  for (const [id, effort] of [
    ['Qwen3.6-35B-A3B-APEX-I-Balanced', 'high'],
    ['Qwen3.8-Flash-Next', 'off'],
  ]) {
    const server = await modelServer(id)
    const settings = new FakeSettings()
    const provider = record(record(settings.values['llm-pi-ai']!.providers).moe4all)
    provider.reasoning = 'low'
    provider.models = [{ id, reasoningEfforts: false }]
    settings.values['agent-default-model'] = { provider: 'moe4all', model: id, reasoningEffort: effort }
    const bridge = new ModelProviderBridge(settings, server.endpoint, {}, quietLogger)
    try {
      await bridge.activateDefaultModel()
      const profile = record(record(settings.values['llm-pi-ai']!.providers).moe4all)
      assert.equal(profile.reasoning, 'low')
      assert(Object.hasOwn(record(record((profile.models as unknown[])[0]).reasoningEfforts), effort!))
      assert.equal(settings.values['agent-default-model']!.reasoningEffort, effort)
    } finally {
      await bridge.dispose()
      await server.close()
    }
  }
})
