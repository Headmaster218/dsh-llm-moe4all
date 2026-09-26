import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { test } from 'node:test'

import { discoverModels, ModelProviderBridge } from '../src/model-provider.js'

const quietLogger = {
  info() {},
  warn() {},
  error() {},
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

test('provider bridge updates the existing pi-ai adapter without persisting its config', async () => {
  const server = await modelServer()
  const original = { providers: { openai: { displayName: 'OpenAI' } } }
  const updates: Array<{ config: unknown, noSave?: boolean }> = []
  let firstUpdate!: () => void
  const updated = new Promise<void>((resolve) => { firstUpdate = resolve })
  const fiber = {
    async update(config: unknown, noSave?: boolean) {
      updates.push({ config, ...(noSave === undefined ? {} : { noSave }) })
      firstUpdate()
    },
    async await() {},
  }
  const entry = { options: { config: original }, fiber }
  const bridge = new ModelProviderBridge({
    resolve(id: string) {
      assert.equal(id, 'llm-pi-ai')
      return entry
    },
  }, server.endpoint, { modelRefreshIntervalMs: 60_000 }, quietLogger)

  const run = bridge.run()
  await updated
  const applied = updates[0]?.config as { providers?: Record<string, unknown> }
  assert.equal(updates[0]?.noSave, true)
  assert.deepEqual(applied.providers?.openai, { displayName: 'OpenAI' })
  assert.ok(applied.providers?.moe4all)

  await bridge.dispose()
  await run
  assert.equal(updates.at(-1)?.config, original)
  assert.equal(updates.at(-1)?.noSave, true)
  await server.close()
})
