export type RuntimeRequestPhase = 'starting' | 'prefill' | 'decode'

export interface RuntimeRequestMetrics {
  id: number
  phase: RuntimeRequestPhase
  contextTokens: number
  contextLimit: number
  prefillTokens: number
  prefillTotal: number
  generatedTokens: number
  prefillTps: number
  decodeTps: number
}

export interface EngineRuntimeMetrics {
  slots: number
  active: number
  queued: number
  prefillTps: number
  decodeTps: number
  requests: RuntimeRequestMetrics[]
  updatedAt?: string
}

function numberField(line: string, name: string): number | undefined {
  const match = new RegExp(`(?:^|\\s)${name}=(?:\")?(-?\\d+(?:\\.\\d+)?)(?:\")?(?=\\s|$)`, 'u').exec(line)
  if (match?.[1] === undefined) return undefined
  const value = Number(match[1])
  return Number.isFinite(value) ? value : undefined
}

function textField(line: string, name: string): string | undefined {
  const match = new RegExp(`(?:^|\\s)${name}=(?:\"([^\"]+)\"|([^\\s]+))`, 'u').exec(line)
  return match?.[1] ?? match?.[2]
}

function requestId(line: string): number | undefined {
  return numberField(line, 'req')
}

function emptyRequest(id: number): RuntimeRequestMetrics {
  return {
    id,
    phase: 'starting',
    contextTokens: 0,
    contextLimit: 0,
    prefillTokens: 0,
    prefillTotal: 0,
    generatedTokens: 0,
    prefillTps: 0,
    decodeTps: 0,
  }
}

export function configuredSlots(arguments_: readonly string[]): number {
  let slots = 1
  for (let index = 0; index < arguments_.length; index += 1) {
    const value = arguments_[index]
    if (value === '--parallel') slots = Number(arguments_[index + 1] ?? slots)
    else if (value?.startsWith('--parallel=')) slots = Number(value.slice('--parallel='.length))
  }
  return Number.isInteger(slots) && slots > 0 ? slots : 1
}

export class RuntimeMetricsTracker {
  private active = 0
  private queued = 0
  private prefillTps = 0
  private decodeTps = 0
  private updatedAt: string | undefined
  private readonly requests = new Map<number, RuntimeRequestMetrics>()

  constructor(readonly slots: number) {}

  reset(): void {
    this.active = 0
    this.queued = 0
    this.prefillTps = 0
    this.decodeTps = 0
    this.updatedAt = undefined
    this.requests.clear()
  }

  ingest(line: string, now = new Date()): void {
    if (line.includes('request start')) {
      const id = requestId(line)
      if (id !== undefined) {
        this.requests.set(id, emptyRequest(id))
        this.active = this.requests.size
      }
      return
    }
    if (line.includes('request done')) {
      const id = requestId(line)
      if (id !== undefined) this.requests.delete(id)
      this.active = this.requests.size
      this.updatedAt = now.toISOString()
      return
    }
    if (line.includes('request progress')) {
      const id = requestId(line)
      if (id === undefined) return
      const previous = this.requests.get(id) ?? emptyRequest(id)
      const phase = textField(line, 'phase')
      this.requests.set(id, {
        id,
        phase: phase === 'decode' ? 'decode' : phase === 'prefill' ? 'prefill' : previous.phase,
        contextTokens: numberField(line, 'context_tokens') ?? previous.contextTokens,
        contextLimit: numberField(line, 'context_limit') ?? previous.contextLimit,
        prefillTokens: numberField(line, 'prefill_tokens') ?? previous.prefillTokens,
        prefillTotal: numberField(line, 'prefill_total') ?? previous.prefillTotal,
        generatedTokens: numberField(line, 'gen_tokens') ?? previous.generatedTokens,
        prefillTps: numberField(line, 'prefill_tps') ?? previous.prefillTps,
        decodeTps: numberField(line, 'decode_tps') ?? previous.decodeTps,
      })
      this.updatedAt = now.toISOString()
      return
    }
    if (!line.includes('serve stats')) return
    this.active = numberField(line, 'active') ?? this.active
    this.queued = numberField(line, 'queued') ?? this.queued
    this.prefillTps = numberField(line, 'prefill_tps') ?? this.prefillTps
    this.decodeTps = numberField(line, 'decode_tps') ?? this.decodeTps
    this.updatedAt = now.toISOString()
    if (this.active === 0 && this.queued === 0) this.requests.clear()
  }

  snapshot(): EngineRuntimeMetrics {
    return {
      slots: this.slots,
      active: this.active,
      queued: this.queued,
      prefillTps: this.prefillTps,
      decodeTps: this.decodeTps,
      requests: [...this.requests.values()].sort((left, right) => left.id - right.id),
      ...(this.updatedAt === undefined ? {} : { updatedAt: this.updatedAt }),
    }
  }
}
