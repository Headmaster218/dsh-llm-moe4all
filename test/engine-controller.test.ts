import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { join } from 'node:path'
import { test } from 'node:test'

import { EngineController, probeHealth, validateEndpoint } from '../src/engine-controller.js'

const quietLogger = {
  info() {},
  warn() {},
  error() {},
}

async function unusedPort(): Promise<number> {
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert(address && typeof address === 'object')
  const port = address.port
  server.close()
  await once(server, 'close')
  return port
}

test('remote endpoints require explicit opt-in', () => {
  assert.throws(() => validateEndpoint('https://example.com/v1'), /not loopback/)
  assert.equal(validateEndpoint('https://example.com/v1', true).hostname, 'example.com')
})

test('connect mode reuses a healthy engine', async () => {
  const server = createServer((_request, response) => {
    response.writeHead(200)
    response.end('ok')
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert(address && typeof address === 'object')

  const endpoint = new URL(`http://127.0.0.1:${address.port}/v1`)
  const controller = new EngineController({ mode: 'connect', endpoint: endpoint.href }, quietLogger)
  assert.equal(await controller.ensureReady(), true)
  assert.equal(await probeHealth(endpoint, 500), true)
  await controller.dispose()
  server.close()
  await once(server, 'close')
})

test('auto mode starts and stops a configured engine', async () => {
  const port = await unusedPort()
  const controller = new EngineController({
    mode: 'auto',
    endpoint: `http://127.0.0.1:${port}/v1`,
    executable: process.execPath,
    arguments: [join(import.meta.dirname, 'fake-engine.mjs'), String(port)],
    startupTimeoutMs: 5_000,
    healthTimeoutMs: 250,
    pollIntervalMs: 25,
    shutdownTimeoutMs: 2_000,
    stopOnUnload: true,
    logOutput: false,
  }, quietLogger)

  assert.equal(await controller.ensureReady(), true)
  assert.equal(await probeHealth(new URL(`http://127.0.0.1:${port}/v1`), 500), true)
  await controller.dispose()
})
