import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { test } from 'node:test'

import {
  EngineController,
  endpointFromConfig,
  parseTasklistCsv,
  probeHealth,
  validateEndpoint,
  type EngineControllerDependencies,
  type ResourceSnapshot,
} from '../src/engine-controller.js'

const quietLogger = {
  info() {},
  warn() {},
  error() {},
}

const idleResources: ResourceSnapshot = {
  ramTotalBytes: 64 * 1024 ** 3,
  ramAvailableBytes: 40 * 1024 ** 3,
  vramTotalBytes: 24 * 1024 ** 3,
  vramAvailableBytes: 16 * 1024 ** 3,
  vramLive: true,
}

function dependencies(overrides: Partial<EngineControllerDependencies> = {}): EngineControllerDependencies {
  return {
    detectProcesses: async () => [],
    probeResources: async () => idleResources,
    confirmBusyStart: async () => false,
    ...overrides,
  }
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

test('default endpoint uses the MoE4All 8080 port and supports an explicit host and port', () => {
  assert.equal(endpointFromConfig({}), 'http://127.0.0.1:8080/v1')
  assert.equal(endpointFromConfig({ host: '192.168.1.20', port: 9000 }), 'http://192.168.1.20:9000/v1')
  assert.equal(endpointFromConfig({ endpoint: 'https://example.com/custom' }), 'https://example.com/custom')
})

test('remote endpoints require explicit opt-in', () => {
  assert.throws(() => validateEndpoint('https://example.com/v1'), /not loopback/)
  assert.equal(validateEndpoint('https://example.com/v1', true).hostname, 'example.com')
})

test('tasklist CSV parsing is independent of localized column headings', () => {
  const parsed = parseTasklistCsv([
    '"infr.exe","4212","Console","1","1,024 K"',
    '"other.exe","99","Console","1","2,048 K"',
  ].join('\r\n'))
  assert.deepEqual(parsed, [
    { name: 'infr.exe', pid: 4212 },
    { name: 'other.exe', pid: 99 },
  ])
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

test('auto mode starts and stops a configured engine only when the machine is idle', async () => {
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
  }, quietLogger, dependencies())

  assert.equal(await controller.ensureReady(), true)
  assert.equal(await probeHealth(new URL(`http://127.0.0.1:${port}/v1`), 500), true)
  await controller.dispose()
})

test('an existing engine process prevents a second launch regardless of endpoint', async () => {
  const port = await unusedPort()
  let probed = false
  const controller = new EngineController({
    mode: 'auto',
    endpoint: `http://127.0.0.1:${port}/v1`,
    executable: process.execPath,
    arguments: ['unused'],
  }, quietLogger, dependencies({
    detectProcesses: async () => [{ name: 'infr.exe', pid: 1234 }],
    probeResources: async () => {
      probed = true
      return idleResources
    },
  }))

  assert.equal(await controller.ensureReady(), false)
  assert.equal(probed, false)
  await controller.dispose()
})

test('exactly half-free resources require confirmation and cancellation leaves the engine stopped', async () => {
  const port = await unusedPort()
  let prompted = false
  const controller = new EngineController({
    mode: 'auto',
    endpoint: `http://127.0.0.1:${port}/v1`,
    executable: process.execPath,
    arguments: ['unused'],
  }, quietLogger, dependencies({
    probeResources: async () => ({
      ...idleResources,
      ramAvailableBytes: idleResources.ramTotalBytes / 2,
      vramAvailableBytes: idleResources.vramTotalBytes / 2,
    }),
    confirmBusyStart: async () => {
      prompted = true
      return false
    },
  }))

  assert.equal(await controller.ensureReady(), false)
  assert.equal(prompted, true)
  await controller.dispose()
})

test('busy startup proceeds only after an explicit confirmation', async () => {
  const port = await unusedPort()
  let prompts = 0
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
  }, quietLogger, dependencies({
    probeResources: async () => ({
      ...idleResources,
      ramAvailableBytes: idleResources.ramTotalBytes / 4,
    }),
    confirmBusyStart: async () => {
      prompts += 1
      return true
    },
  }))

  assert.equal(await controller.ensureReady(), true)
  assert.equal(prompts, 1)
  await controller.dispose()
})
