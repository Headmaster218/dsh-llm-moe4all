import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'

import type { EngineController, EngineRuntimeStatus, EngineStartResult } from './engine-controller.js'
import type { EngineReleaseManager, EngineReleaseStatus, InstalledEngine } from './engine-release.js'
import type { DiscoveredModel } from './model-provider.js'

export const ENGINE_PATHS = {
  status: '/api/moe4all/status',
  start: '/api/moe4all/start',
  release: '/api/moe4all/release',
  install: '/api/moe4all/install',
  installLocal: '/api/moe4all/install-local',
} as const

export interface EngineControlStatus extends EngineRuntimeStatus {
  models: DiscoveredModel[]
}

export interface EngineRuntimeAccess {
  controller(): EngineController | undefined
  models(): DiscoveredModel[]
  refreshModels(): Promise<void>
  configuredExecutable(): string
  releases: EngineReleaseManager
}

function isIPv4Loopback(value: string): boolean {
  const parts = value.split('.')
  return parts.length === 4
    && parts[0] === '127'
    && parts.every((part) => /^\d{1,3}$/u.test(part) && Number(part) <= 255)
}

export function isLoopbackRequest(request: IncomingMessage): boolean {
  const remote = request.socket.remoteAddress?.toLowerCase()
  const socketLoopback = remote === '::1'
    || (remote?.startsWith('::ffff:') === true && isIPv4Loopback(remote.slice('::ffff:'.length)))
    || (remote !== undefined && isIPv4Loopback(remote))
  if (!socketLoopback) return false

  const host = request.headers.host
  if (typeof host !== 'string') return false
  let authority: URL
  try {
    authority = new URL(`http://${host}`)
  } catch {
    return false
  }
  if (authority.hostname !== 'localhost' && authority.hostname !== '[::1]' && !isIPv4Loopback(authority.hostname)) {
    return false
  }
  if (request.headers['sec-fetch-site'] === 'cross-site') return false
  const origin = request.headers.origin
  if (origin === undefined) return true
  try {
    return new URL(origin).host === authority.host
  } catch {
    return false
  }
}

function writeJson(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'referrer-policy': 'no-referrer',
  })
  response.end(JSON.stringify(value))
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown> | undefined> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = chunk as Buffer
    size += buffer.length
    if (size > 4096) return undefined
    chunks.push(buffer)
  }
  if (chunks.length === 0) return {}
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? value as Record<string, unknown>
      : undefined
  } catch {
    return undefined
  }
}

function method(request: IncomingMessage, response: ServerResponse, expected: 'GET' | 'POST'): boolean {
  if (request.method === expected) return true
  response.writeHead(405, { allow: expected })
  response.end('method not allowed')
  return false
}

function fenced(request: IncomingMessage, response: ServerResponse): boolean {
  if (isLoopbackRequest(request)) return true
  writeJson(response, 403, { ok: false, code: 'loopback-required' })
  return false
}

async function status(access: EngineRuntimeAccess): Promise<EngineControlStatus> {
  const controller = access.controller()
  if (controller === undefined) {
    return {
      phase: 'checking',
      endpoint: '',
      mode: 'prompt',
      ready: false,
      canStart: false,
      message: 'MoE4All settings are being applied.',
      models: [],
    }
  }
  return { ...await controller.refreshStatus(), models: access.models() }
}

export function makeEngineRoutes(access: EngineRuntimeAccess): WebRoute[] {
  const handleStatus = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (!method(request, response, 'GET') || !fenced(request, response)) return
    writeJson(response, 200, await status(access))
  }

  const handleStart = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (!method(request, response, 'POST') || !fenced(request, response)) return
    const body = await readJson(request)
    if (body === undefined || (body.force !== undefined && typeof body.force !== 'boolean')) {
      writeJson(response, 400, { ok: false, code: 'invalid-body' })
      return
    }
    const controller = access.controller()
    if (controller === undefined) {
      writeJson(response, 503, { ok: false, code: 'runtime-restarting' })
      return
    }
    const result: EngineStartResult = await controller.requestStart(body.force === true)
    if (result.ok) await access.refreshModels()
    writeJson(response, 200, { ...result, status: { ...result.status, models: access.models() } })
  }

  const handleRelease = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (!method(request, response, 'GET') || !fenced(request, response)) return
    try {
      const force = new URL(request.url ?? ENGINE_PATHS.release, 'http://localhost').searchParams.get('force') === '1'
      const result: EngineReleaseStatus = await access.releases.status(access.configuredExecutable(), force)
      writeJson(response, 200, { ok: true, ...result })
    } catch (error) {
      writeJson(response, 502, { ok: false, message: error instanceof Error ? error.message : String(error) })
    }
  }

  const handleInstall = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (!method(request, response, 'POST') || !fenced(request, response)) return
    try {
      const installed: InstalledEngine = await access.releases.installLatest()
      writeJson(response, 200, { ok: true, installed })
    } catch (error) {
      writeJson(response, 500, { ok: false, message: error instanceof Error ? error.message : String(error) })
    }
  }

  const handleInstallLocal = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (!method(request, response, 'POST') || !fenced(request, response)) return
    const body = await readJson(request)
    if (body === undefined || typeof body.path !== 'string' || body.path.trim() === '') {
      writeJson(response, 400, { ok: false, code: 'invalid-local-path', message: 'A local ZIP, directory, or infr.exe path is required.' })
      return
    }
    try {
      const installed: InstalledEngine = await access.releases.installFromLocal(body.path)
      writeJson(response, 200, { ok: true, installed })
    } catch (error) {
      writeJson(response, 500, { ok: false, message: error instanceof Error ? error.message : String(error) })
    }
  }

  return [
    { kind: 'exact', path: ENGINE_PATHS.status, handler: handleStatus },
    { kind: 'exact', path: ENGINE_PATHS.start, handler: handleStart },
    { kind: 'exact', path: ENGINE_PATHS.release, handler: handleRelease },
    { kind: 'exact', path: ENGINE_PATHS.install, handler: handleInstall },
    { kind: 'exact', path: ENGINE_PATHS.installLocal, handler: handleInstallLocal },
  ]
}
