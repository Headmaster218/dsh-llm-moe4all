export type EngineAutoProfile = 'conservative' | 'aggressive'

export interface SessionCacheSetup {
  directory: string
  maxSize: string
  idleSeconds: number
  ttlHours: number
}

export interface EngineSetupValues {
  model: string
  visionModel?: string
  embeddingModel?: string
  mtpModel?: string
  embeddingIdleTimeout?: number
  host: string
  port: number
  contextWindow: number
  maxTokens: number
  parallel: number
  profile: EngineAutoProfile
  mtp: boolean
  sessionCache?: SessionCacheSetup
}

export function normalizeSetupPath(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length >= 2) {
    const first = trimmed[0]
    const last = trimmed.at(-1)
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1).trim()
    }
  }
  return trimmed
}

function positiveInteger(value: number, message: string): void {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(message)
}

function nonNegativeInteger(value: number, message: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(message)
}

export function buildEngineArguments(values: EngineSetupValues): string[] {
  const model = normalizeSetupPath(values.model)
  const visionModel = normalizeSetupPath(values.visionModel ?? '')
  const embeddingModel = normalizeSetupPath(values.embeddingModel ?? '')
  const mtpModel = normalizeSetupPath(values.mtpModel ?? '')
  const host = values.host.trim()
  if (model === '') throw new Error('A model GGUF path is required.')
  if (host === '' || /\s/u.test(host)) throw new Error('A valid listen host is required.')
  if (!Number.isSafeInteger(values.port) || values.port < 1 || values.port > 65_535) {
    throw new Error('The listen port must be between 1 and 65535.')
  }
  positiveInteger(values.contextWindow, 'The context window must be a positive token count.')
  positiveInteger(values.maxTokens, 'The maximum output must be a positive token count.')
  positiveInteger(values.parallel, 'Concurrent slots must be a positive integer.')

  const arguments_: string[] = [
    'serve',
    '--addr', `${host}:${values.port}`,
    '--parallel', String(values.parallel),
    '--ctx', String(values.contextWindow),
    '--max-new', String(values.maxTokens),
  ]
  if (values.profile === 'aggressive') arguments_.push('--set', 'device.auto_profile=aggressive')
  if (values.mtp) {
    if (mtpModel === '') throw new Error('An MTP head GGUF path is required when MTP is enabled.')
    arguments_.push('--set', 'spec.mtp=true', '--set', `spec.draft=${mtpModel}`)
  }
  if (visionModel !== '') arguments_.push('--mmproj', visionModel)
  if (embeddingModel !== '') {
    const idleTimeout = values.embeddingIdleTimeout ?? 60
    nonNegativeInteger(idleTimeout, 'The embedding idle timeout must be zero or a positive integer.')
    arguments_.push('--embedding-model', embeddingModel, '--embedding-idle-timeout', String(idleTimeout))
  }
  if (values.sessionCache !== undefined) {
    const directory = normalizeSetupPath(values.sessionCache.directory)
    const maxSize = values.sessionCache.maxSize.trim()
    if (directory === '') throw new Error('A KV cache directory is required when session caching is enabled.')
    if (!/^\d+(?:\.\d+)?\s*(?:[kmgt]i?b?)?$/iu.test(maxSize)) {
      throw new Error('The KV cache size must be an absolute size such as 10g or 512MiB.')
    }
    nonNegativeInteger(values.sessionCache.idleSeconds, 'The KV cache idle timeout must be zero or a positive integer.')
    nonNegativeInteger(values.sessionCache.ttlHours, 'The KV cache cleanup age must be zero or a positive integer.')
    arguments_.push(
      '--set', 'kv.type_k=q8_0',
      '--set', 'kv.type_v=q8_0',
      '--set', `kv.session_cache_dir=${directory}`,
      '--set', `kv.session_idle_secs=${values.sessionCache.idleSeconds}`,
      '--set', `kv.session_cache_max=${maxSize}`,
      '--set', `kv.session_cache_ttl_hours=${values.sessionCache.ttlHours}`,
    )
  } else {
    arguments_.push('--set', 'kv.session_cache_dir=')
  }
  arguments_.push(model)
  return arguments_
}
