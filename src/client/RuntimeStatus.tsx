import { useEffect, useState, useSyncExternalStore } from 'react'
import { Activity } from 'lucide-react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'

import type { Config } from '../index.js'
import type { EngineControlStatus } from '../host-routes.js'
import { fetchEngineStatus } from './engine-api.js'
import type { Translate } from './workspace-ui.js'

function speed(value: number): string {
  return `${value.toFixed(1)} tok/s`
}

export function RuntimeMetrics({ status, t }: { status: EngineControlStatus | null; t: Translate }) {
  const metrics = status?.metrics
  if (!status?.ready || metrics === undefined) return null
  const prefill = metrics.requests.find((request) => request.phase === 'prefill')
  const decodes = metrics.requests.filter((request) => request.phase === 'decode')
  return (
    <div className="m4a-metrics" role="status">
      <div>
        <span>{t('runtimeSlots')}</span>
        <strong>{metrics.active} / {metrics.slots}</strong>
      </div>
      <div>
        <span>{t('realtimePrefill')}</span>
        <strong>{prefill ? speed(metrics.prefillTps) : '-'}</strong>
      </div>
      <div>
        <span>{t('realtimeDecode')}</span>
        <strong>{decodes.length > 0 ? speed(metrics.decodeTps) : '-'}</strong>
      </div>
      {decodes.map((request) => (
        <div key={request.id}>
          <span>#{request.id} Decode</span>
          <strong>{speed(request.decodeTps)}</strong>
        </div>
      ))}
    </div>
  )
}

export function RuntimeStatusDock({ scope, t }: { scope: SettingsScope<Config>; t: Translate }) {
  const settings = useSyncExternalStore(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot(),
    () => scope.getSnapshot(),
  )
  const [status, setStatus] = useState<EngineControlStatus | null>(null)
  const display = settings.value?.statusDisplay ?? 'hover'
  useEffect(() => {
    if (display === 'hidden') return
    let disposed = false
    let timer: ReturnType<typeof setTimeout>
    const poll = async () => {
      try {
        const next = await fetchEngineStatus()
        if (!disposed) setStatus(next)
      } catch {
        if (!disposed) setStatus(null)
      }
      timer = setTimeout(() => { void poll() }, 1200)
    }
    void poll()
    return () => { disposed = true; clearTimeout(timer) }
  }, [display])
  if (display === 'hidden' || !status?.ready) return null
  const metrics = status.metrics
  const activePrefill = metrics?.requests.some((request) => request.phase === 'prefill') === true
  const decodes = metrics?.requests.filter((request) => request.phase === 'decode') ?? []
  return (
    <div className={`m4a-live-status m4a-live-status--${display}`} tabIndex={0}>
      <div className="m4a-live-summary">
        <Activity size={12} />
        <strong>{t('runningStatus')}</strong>
        <span>{metrics?.active ?? 0}/{metrics?.slots ?? 0} {t('runtimeSlots')}</span>
        {activePrefill && <span>Prefill {speed(metrics?.prefillTps ?? 0)}</span>}
        {decodes.length > 0 && <span>Decode {speed(metrics?.decodeTps ?? 0)}</span>}
      </div>
      <div className="m4a-live-details">
        {decodes.length === 0 && !activePrefill && <span>{t('idleMetrics')}</span>}
        {decodes.map((request) => (
          <span key={request.id}>#{request.id} {speed(request.decodeTps)}</span>
        ))}
      </div>
    </div>
  )
}
