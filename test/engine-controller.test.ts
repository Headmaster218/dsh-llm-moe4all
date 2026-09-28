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
  assert.equal(controller.statusSnapshot().startupLines?.includes('fake engine loading'), true)
  await controller.dispose()
})

test('startup failures retain the engine output for the UI', async () => {
  const port = await unusedPort()
  const controller = new EngineController({
    mode: 'prompt',
    endpoint: `http://127.0.0.1:${port}/v1`,
    executable: process.execPath,
    arguments: [join(import.meta.dirname, 'fake-engine-fail.mjs')],
    startupTimeoutMs: 2_000,
    healthTimeoutMs: 100,
    pollIntervalMs: 25,
    stopOnUnload: true,
    logOutput: false,
  }, quietLogger, dependencies())

  const result = await controller.requestStart()
  assert.equal(result.ok, false)
  assert.equal(result.status.phase, 'error')
  assert.match(result.status.startupLines?.join('\n') ?? '', /simulated model allocation failure/)
  assert.equal((await controller.refreshStatus()).phase, 'error')
  await controller.dispose()
})

test('automatic startup caps RAM to Windows commit headroom without a false busy warning', async () => {
  const port = await unusedPort()
  const controller = new EngineController({
    mode: 'auto',
    endpoint: `http://127.0.0.1:${port}/v1`,
    executable: process.execPath,
    arguments: [
      join(import.meta.dirname, 'fake-engine.mjs'),
      String(port),
      '--set',
      'device.auto_profile=aggressive',
    ],
    startupTimeoutMs: 5_000,
    healthTimeoutMs: 250,
    pollIntervalMs: 25,
    shutdownTimeoutMs: 2_000,
    stopOnUnload: true,
    logOutput: false,
  }, quietLogger, dependencies({
    probeResources: async () => ({
      ...idleResources,
      ramAvailableBytes: 50 * 1024 ** 3,
      commitTotalBytes: 68 * 1024 ** 3,
      commitAvailableBytes: 40 * 1024 ** 3,
      vramAvailableBytes: 23 * 1024 ** 3,
    }),
  }))

  assert.equal(await controller.ensureReady(), true)
  const status = controller.statusSnapshot()
  assert.equal(status.phase, 'ready')
  assert.equal(status.adjustedRamBudgetBytes, 16 * 1024 ** 3)
  assert.match(status.startupLines?.join('\n') ?? '', /Compatibility guard/)
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

test('exactly half-free resources return a structured confirmation request', async () => {
  const port = await unusedPort()
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
  }))

  assert.equal(await controller.ensureReady(), false)
  const status = controller.statusSnapshot()
  assert.equal(status.phase, 'resource-warning')
  assert.equal(status.reasons?.length, 2)
  await controller.dispose()
})

test('busy startup proceeds only after an explicit confirmation', async () => {
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
  }, quietLogger, dependencies({
    probeResources: async () => ({
      ...idleResources,
      ramAvailableBytes: idleResources.ramTotalBytes / 4,
    }),
  }))

  assert.equal(await controller.ensureReady(), false)
  assert.equal(controller.statusSnapshot().phase, 'resource-warning')
  assert.equal((await controller.requestStart(true)).ok, true)
  await controller.dispose()
})

test('prompt mode never starts the engine before a manual request', async () => {
  const port = await unusedPort()
  let processChecks = 0
  const controller = new EngineController({
    mode: 'prompt',
    endpoint: `http://127.0.0.1:${port}/v1`,
    executable: process.execPath,
    arguments: [join(import.meta.dirname, 'fake-engine.mjs'), String(port)],
    healthTimeoutMs: 100,
  }, quietLogger, dependencies({
    detectProcesses: async () => {
      processChecks += 1
      return []
    },
  }))

  assert.equal(await controller.ensureReady(), false)
  assert.equal(controller.statusSnapshot().phase, 'offline')
  assert.equal(processChecks, 0)
  await controller.dispose()
})
