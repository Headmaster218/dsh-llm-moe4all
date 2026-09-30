import type { EngineControlStatus } from '../host-routes.js'
import type { ApiKeyStatus } from '../api-key.js'
import type { EngineInstallProgress, EngineReleaseStatus } from '../engine-release.js'
import type { LocalModelFiles, LocalModelLibrary, SetupModelPaths } from '../model-files.js'
import type { ModelDownloadProgress, RecommendedModel } from '../model-download.js'

interface StartResponse {
  ok: boolean
  status: EngineControlStatus
}

interface ReleaseResponse extends EngineReleaseStatus {
  ok: boolean
}

export interface ModelCatalogResponse {
  ok: boolean
  models: RecommendedModel[]
  download: ModelDownloadProgress
  capabilities: { nativeFilePicker: boolean }
  defaultDirectory: string
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

export function stopEngine(): Promise<StartResponse> {
  return json('/api/moe4all/stop', { method: 'POST', body: '{}' })
}

export async function fetchApiKey(): Promise<ApiKeyStatus> {
  const result = await json<ApiKeyStatus & { ok: boolean }>('/api/moe4all/api-key')
  return result
}

export async function updateApiKey(value: string): Promise<ApiKeyStatus> {
  const result = await json<ApiKeyStatus & { ok: boolean }>('/api/moe4all/api-key', {
    method: 'POST',
    body: JSON.stringify({ value }),
  })
  return result
}

export async function regenerateApiKey(): Promise<ApiKeyStatus> {
  const result = await json<ApiKeyStatus & { ok: boolean }>('/api/moe4all/api-key', {
    method: 'POST',
    body: JSON.stringify({ regenerate: true }),
  })
  return result
}

export function fetchReleaseStatus(force = false): Promise<ReleaseResponse> {
  return json(`/api/moe4all/release${force ? '?force=1' : ''}`)
}

export async function installLatestEngine(): Promise<void> {
  await json<{ ok: boolean }>('/api/moe4all/install', {
    method: 'POST',
    body: '{}',
  })
}

export async function installLocalEngine(path: string): Promise<void> {
  await json<{ ok: boolean }>('/api/moe4all/install-local', {
    method: 'POST',
    body: JSON.stringify({ path }),
  })
}

export async function cancelEngineInstall(): Promise<EngineInstallProgress> {
  const result = await json<{ ok: boolean, install: EngineInstallProgress }>('/api/moe4all/install-cancel', {
    method: 'POST',
    body: '{}',
  })
  return result.install
}

export async function deleteEngineVersion(tag: string): Promise<void> {
  await json<{ ok: boolean }>('/api/moe4all/engine-delete', {
    method: 'POST',
    body: JSON.stringify({ tag }),
  })
}

export async function scanModelPath(path: string): Promise<LocalModelFiles> {
  const result = await json<{ ok: boolean, files: LocalModelFiles }>('/api/moe4all/model-files', {
    method: 'POST',
    body: JSON.stringify({ path }),
  })
  return result.files
}

export async function scanModelLibrary(directories: string[], selectedPaths: string[]): Promise<LocalModelLibrary> {
  const result = await json<{ ok: boolean, library: LocalModelLibrary }>('/api/moe4all/model-library', {
    method: 'POST',
    body: JSON.stringify({ directories, selectedPaths }),
  })
  return result.library
}

export async function validateModelPaths(paths: SetupModelPaths): Promise<SetupModelPaths> {
  const result = await json<{ ok: boolean, paths: SetupModelPaths }>('/api/moe4all/validate-models', {
    method: 'POST',
    body: JSON.stringify({ paths }),
  })
  return result.paths
}

export async function pickModelFile(): Promise<string | undefined> {
  const result = await json<{ ok: boolean, path?: string }>('/api/moe4all/pick-model-file', {
    method: 'POST',
    body: '{}',
  })
  return result.path
}

export function fetchModelCatalog(): Promise<ModelCatalogResponse> {
  return json('/api/moe4all/model-catalog')
}

export async function fetchModelDownload(): Promise<ModelDownloadProgress> {
  const result = await json<{ ok: boolean, download: ModelDownloadProgress }>('/api/moe4all/model-download')
  return result.download
}

export async function startModelDownload(modelId: string, directory: string): Promise<ModelDownloadProgress> {
  const result = await json<{ ok: boolean, download: ModelDownloadProgress }>('/api/moe4all/model-download', {
    method: 'POST',
    body: JSON.stringify({ modelId, directory }),
  })
  return result.download
}

export async function cancelModelDownload(): Promise<ModelDownloadProgress> {
  const result = await json<{ ok: boolean, download: ModelDownloadProgress }>('/api/moe4all/model-download-cancel', {
    method: 'POST',
    body: '{}',
  })
  return result.download
}
