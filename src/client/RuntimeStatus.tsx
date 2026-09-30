import { useEffect, useState, useSyncExternalStore } from 'react'
import { Activity } from 'lucide-react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'

import type { Config } from '../index.js'
import type { EngineControlStatus } from '../host-routes.js'
import { runtimeActivity } from '../runtime-metrics.js'
import { fetchEngineStatus } from './engine-api.js'
import type { Translate } from './workspace-ui.js'

function speed(value: number): string {
  return `${value.toFixed(1)} tok/s`
}

export function RuntimeMetrics({ status, t }: { status: EngineControlStatus | null; t: Translate }) {
  const metrics = status?.metrics
  if (!status?.ready || metrics === undefined) return null
  const activity = runtimeActivity(metrics)
  return (
    <div className="m4a-metrics" role="status">
      <div>
        <span>{t('runtimeSlots')}</span>
        <strong>{metrics.active} / {metrics.slots}</strong>
      </div>
      <div>
        <span>{t('realtimePrefill')}</span>
        <strong>{activity.prefill ? speed(activity.prefillTps) : '-'}</strong>
      </div>
      <div>
        <span>{t('realtimeDecode')}</span>
        <strong>{activity.decode ? speed(activity.decodeTps) : '-'}</strong>
      </div>
      {activity.decodes.map((request) => (
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
  const activity = runtimeActivity(metrics)
  return (
    <div className={`m4a-live-status m4a-live-status--${display}`} tabIndex={0}>
      <div className="m4a-live-summary">
        <Activity size={12} />
        <strong>{t('runningStatus')}</strong>
        <span>{metrics?.active ?? 0}/{metrics?.slots ?? 0} {t('runtimeSlots')}</span>
        {activity.prefill && <span>Prefill {speed(activity.prefillTps)}</span>}
        {activity.decode && <span>Decode {speed(activity.decodeTps)}</span>}
      </div>
      <div className="m4a-live-details">
        {!activity.active && <span>{t('idleMetrics')}</span>}
        {activity.active && !activity.prefill && !activity.decode && <span>{t('startingStatus')}</span>}
        {activity.prefill && <span>Prefill {speed(activity.prefillTps)}</span>}
        {activity.decode && activity.decodes.length === 0 && <span>Decode {speed(activity.decodeTps)}</span>}
        {activity.decodes.map((request) => (
          <span key={request.id}>#{request.id} {speed(request.decodeTps)}</span>
        ))}
      </div>
    </div>
  )
}
