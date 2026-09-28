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
  extraArguments?: string[]
}

export interface ParsedEngineArguments {
  model: string
  visionModel: string
  embeddingModel: string
  mtpModel: string
  embeddingIdleTimeout: number
  parallel: number
  profile: EngineAutoProfile
  mtp: boolean
  sessionCacheEnabled: boolean
  sessionCache: SessionCacheSetup
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

function optionValue(arguments_: string[], option: string): string | undefined {
  let result: string | undefined
  for (let index = 0; index < arguments_.length; index++) {
    if (arguments_[index] === option) result = arguments_[++index]
    else if (arguments_[index]!.startsWith(`${option}=`)) result = arguments_[index]!.slice(option.length + 1)
  }
  return result
}

function setValue(arguments_: string[], path: string): string | undefined {
  let result: string | undefined
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]!
    if (argument === '--set') {
      const value = arguments_[index + 1]
      if (value?.startsWith(`${path}=`)) result = value.slice(path.length + 1)
      index += 1
      continue
    }
    const inline = /^--set=(.+)$/u.exec(argument)?.[1]
    if (inline?.startsWith(`${path}=`)) result = inline.slice(path.length + 1)
  }
  return result
}

const managedOptions = new Set(['--addr', '--parallel', '--ctx', '--max-new', '--mmproj', '--embedding-model', '--embedding-idle-timeout'])
const managedSettings = new Set(['device.auto_profile', 'spec.mtp', 'spec.draft', 'kv.session_cache_dir', 'kv.session_idle_secs', 'kv.session_cache_max', 'kv.session_cache_ttl_hours'])

export function modelArgument(arguments_: string[]): string {
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]!
    if (argument.startsWith('-')) {
      if (!argument.includes('=') && !['--think', '--no-think', '--help', '--version'].includes(argument)) index += 1
    } else if (/\.gguf$/iu.test(normalizeSetupPath(argument))) return normalizeSetupPath(argument)
  }
  return ''
}

export function unmanagedArguments(arguments_: string[]): string[] {
  const model = modelArgument(arguments_)
  const result: string[] = []
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]!
    if (argument === 'serve' || normalizeSetupPath(argument) === model) continue
    const [option] = argument.split('=', 1)
    if (managedOptions.has(option!)) {
      if (!argument.includes('=')) index += 1
      continue
    }
    if (option === '--set') {
      const entry = argument.startsWith('--set=') ? argument.slice(6) : arguments_[++index] ?? ''
      if (!managedSettings.has(entry.split('=', 1)[0]!)) result.push('--set', entry)
    } else result.push(argument)
  }
  return result
}

function integer(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback
}

export function parseEngineArguments(arguments_: string[]): ParsedEngineArguments {
  const sessionDirectory = setValue(arguments_, 'kv.session_cache_dir') ?? 'kv-sessions'
  const model = modelArgument(arguments_)
  const mtpModel = setValue(arguments_, 'spec.draft') ?? ''
  return {
    model: model === mtpModel ? '' : model,
    visionModel: optionValue(arguments_, '--mmproj') ?? '',
    embeddingModel: optionValue(arguments_, '--embedding-model') ?? '',
    mtpModel,
    embeddingIdleTimeout: integer(optionValue(arguments_, '--embedding-idle-timeout'), 60),
    parallel: Math.max(1, integer(optionValue(arguments_, '--parallel'), 1)),
    profile: setValue(arguments_, 'device.auto_profile') === 'aggressive' ? 'aggressive' : 'conservative',
    mtp: setValue(arguments_, 'spec.mtp') === 'true',
    sessionCacheEnabled: sessionDirectory !== '',
    sessionCache: {
      directory: sessionDirectory || 'kv-sessions',
      maxSize: setValue(arguments_, 'kv.session_cache_max') ?? '10g',
      idleSeconds: integer(setValue(arguments_, 'kv.session_idle_secs'), 90),
      ttlHours: integer(setValue(arguments_, 'kv.session_cache_ttl_hours'), 24),
    },
  }
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
    '--addr', `${host.includes(':') && !host.startsWith('[') ? `[${host}]` : host}:${values.port}`,
    '--parallel', String(values.parallel),
    '--ctx', String(values.contextWindow),
    '--max-new', String(values.maxTokens),
  ]
  arguments_.push('--set', `device.auto_profile=${values.profile}`, '--set', `spec.mtp=${values.mtp}`)
  if (values.mtp) {
    if (mtpModel === '') throw new Error('An MTP head GGUF path is required when MTP is enabled.')
    arguments_.push('--set', `spec.draft=${mtpModel}`)
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
  arguments_.push(...(values.extraArguments ?? []))
  arguments_.push(model)
  return arguments_
}
