import assert from 'node:assert/strict'
import test from 'node:test'

import { compactUpdateVersion, MarketPluginUpdateApi } from '../src/client/plugin-update.js'

const schema = 'dsh-market/update-api/v1'

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

test('discovers the public market API and reports a git update', async () => {
  const requests: string[] = []
  const fetcher = async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input)
    requests.push(url)
    if (url.endsWith('/capabilities')) {
      return response({
        schema,
        features: { check: true, update: true },
        restart: { supported: false },
        endpoints: {
          updates: '/dsh-market/api/v1/updates',
          operations: '/dsh-market/api/v1/operations',
          restart: '/dsh-market/api/v1/restart',
        },
      })
    }
    return response({
      schema,
      package: {
        name: 'dsh-llm-moe4all',
        source: 'github',
        installedVersion: '1111111111111111111111111111111111111111',
        latestVersion: '2222222222222222222222222222222222222222',
        updateAvailable: true,
      },
    })
  }
  const api = new MarketPluginUpdateApi(fetcher)

  const capabilities = await api.discover()
  const update = await api.check()

  assert.equal(capabilities?.restartSupported, false)
  assert.equal(update.updateAvailable, true)
  assert.equal(update.source, 'github')
  assert.match(requests[1]!, /name=dsh-llm-moe4all/)
  assert.equal(compactUpdateVersion(update.latestVersion), '2222222222')
})

test('starts and follows an update operation to completion', async () => {
  let operationPolls = 0
  const fetcher = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input)
    if (url.endsWith('/capabilities')) {
      return response({
        schema,
        features: { check: true, update: true },
        restart: { supported: true },
        endpoints: {
          updates: '/dsh-market/api/v1/updates',
          operations: '/dsh-market/api/v1/operations',
          restart: '/dsh-market/api/v1/restart',
        },
      })
    }
    if (url.includes('/operations?')) {
      operationPolls += 1
      return response({
        schema,
        operation: {
          operationId: 'boot-update-1',
          state: operationPolls === 1 ? 'running' : 'succeeded',
          installedVersion: '0.2.0-alpha.15',
          progress: { phase: 'install', percent: operationPolls === 1 ? 60 : 100, detail: null },
          outcome: { refreshRequired: false, restartRequired: true },
          failure: null,
        },
      })
    }
    assert.equal(init?.method, 'POST')
    return response({
      schema,
      operation: {
        operationId: 'boot-update-1',
        state: 'running',
        installedVersion: '0.2.0-alpha.10',
        progress: { phase: 'resolve', percent: 10, detail: null },
        outcome: { refreshRequired: false, restartRequired: false },
        failure: null,
      },
    }, 202)
  }
  const api = new MarketPluginUpdateApi(fetcher, async () => {})
  await api.discover()

  const started = await api.start()
  const seen: number[] = []
  const finished = await api.waitForCompletion(started.operationId, operation => {
    if (operation.progress.percent !== null) seen.push(operation.progress.percent)
  })

  assert.equal(finished.state, 'succeeded')
  assert.equal(finished.outcome.restartRequired, true)
  assert.deepEqual(seen, [60, 100])
})

test('treats an absent market API as an optional capability', async () => {
  const api = new MarketPluginUpdateApi(async () => response({ error: 'missing' }, 404))
  assert.equal(await api.discover(), null)
})

test('does not rebind the browser fetch function to the API instance', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (function (this: unknown): Promise<Response> {
    assert.equal(this, undefined)
    return Promise.resolve(response({
      schema,
      features: { check: false, update: false },
      restart: { supported: false },
      endpoints: {},
    }))
  }) as typeof fetch
  try {
    const api = new MarketPluginUpdateApi()
    assert.equal(await api.discover(), null)
  } finally {
    globalThis.fetch = originalFetch
  }
})
