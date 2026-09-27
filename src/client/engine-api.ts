import type { EngineControlStatus } from '../host-routes.js'
import type { EngineReleaseStatus, InstalledEngine } from '../engine-release.js'

interface StartResponse {
  ok: boolean
  status: EngineControlStatus
}

interface ReleaseResponse extends EngineReleaseStatus {
  ok: boolean
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    cache: 'no-store',
    ...init,
    headers: {
      accept: 'application/json',
      ...(init?.body === undefined ? {} : { 'content-type': 'application/json' }),
      ...init?.headers,
    },
  })
  const value = await response.json() as T & { message?: string }
  if (!response.ok) throw new Error(value.message ?? `MoE4All control request returned HTTP ${response.status}`)
  return value
}

export function fetchEngineStatus(): Promise<EngineControlStatus> {
  return json('/api/moe4all/status')
}

export function startEngine(force = false): Promise<StartResponse> {
  return json('/api/moe4all/start', {
    method: 'POST',
    body: JSON.stringify({ force }),
  })
}

export function fetchReleaseStatus(force = false): Promise<ReleaseResponse> {
  return json(`/api/moe4all/release${force ? '?force=1' : ''}`)
}

export async function installLatestEngine(): Promise<InstalledEngine> {
  const result = await json<{ ok: boolean, installed: InstalledEngine }>('/api/moe4all/install', {
    method: 'POST',
    body: '{}',
  })
  return result.installed
}

export async function installLocalEngine(path: string): Promise<InstalledEngine> {
  const result = await json<{ ok: boolean, installed: InstalledEngine }>('/api/moe4all/install-local', {
    method: 'POST',
    body: JSON.stringify({ path }),
  })
  return result.installed
}
