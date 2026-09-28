import { useEffect, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'

import type { Config } from '../index.js'
import type { EngineControlStatus } from '../host-routes.js'
import { fetchEngineStatus, startEngine } from './engine-api.js'
import type { Moe4AllLocaleKey } from './locales.js'

type Translate = (key: Moe4AllLocaleKey) => string

interface Props {
  scope: SettingsScope<Config>
  t: Translate
}

function ModalFrame({ title, children }: { title: string, children: ReactNode }): ReactNode {
  return (
    <div className="m4a-overlay" role="presentation">
      <section className="m4a-overlay__dialog" role="dialog" aria-modal="true" aria-labelledby="m4a-overlay-title">
        <h2 id="m4a-overlay-title" className="m4a-overlay__title">{title}</h2>
        {children}
      </section>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GiB`
}

export function EngineStartupOverlay({ scope, t }: Props): ReactNode {
  const snapshot = useSyncExternalStore(
    listener => scope.subscribe(listener),
    () => scope.getSnapshot(),
    () => scope.getSnapshot(),
  )
  const [status, setStatus] = useState<EngineControlStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let disposed = false
    const poll = async (): Promise<void> => {
      try {
        const next = await fetchEngineStatus()
        if (!disposed) setStatus(next)
      } catch (cause) {
        if (!disposed) setError(cause instanceof Error ? cause.message : String(cause))
      }
    }
    void poll()
    const timer = window.setInterval(() => { void poll() }, 1500)
    return () => {
      disposed = true
      window.clearInterval(timer)
    }
  }, [])

  const launch = async (force: boolean, remember = false): Promise<void> => {
    setBusy(true)
    setError('')
    try {
      const result = await startEngine(force)
      setStatus(result.status)
      if (result.ok && remember) await scope.set('mode', 'auto')
      if (result.ok) setDismissed(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const config = snapshot.value
  if (config === undefined || status === null || config.mode === 'connect') return null
  if (status.phase === 'missing-executable' || status.phase === 'missing-arguments') return null

  if (status.phase === 'starting' && !dismissed) {
    return (
      <ModalFrame title={t('startupProgressTitle')}>
        <p className="m4a-overlay__body">{t('startupProgressBody')}</p>
        <div className="m4a-overlay__progress">
          <progress />
          <span>{status.message ?? t('startingNow')}</span>
        </div>
        {status.adjustedRamBudgetBytes === undefined ? null : (
          <p className="m4a-overlay__notice">{t('ramBudgetAdjusted')} {formatBytes(status.adjustedRamBudgetBytes)}</p>
        )}
        <div className="m4a-overlay__startup-output">
          <span className="m4a-settings__label">{t('startupOutput')}</span>
          <pre>{(status.startupLines ?? []).join('\n') || t('checkingEngine')}</pre>
        </div>
      </ModalFrame>
    )
  }

  if ((status.phase === 'error' || status.phase === 'duplicate-process') && !dismissed) {
    return (
      <ModalFrame title={t('startupFailedTitle')}>
        <p className="m4a-overlay__error">{status.message ?? error}</p>
        {(status.startupLines?.length ?? 0) === 0 ? null : (
          <div className="m4a-overlay__startup-output">
            <span className="m4a-settings__label">{t('startupOutput')}</span>
            <pre>{status.startupLines!.join('\n')}</pre>
          </div>
        )}
        <div className="m4a-overlay__actions">
          <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { setDismissed(true) }}>{t('notNow')}</button>
          <button type="button" className="m4a-settings__button m4a-settings__button--primary" disabled={busy} onClick={() => { void launch(false) }}>
            {busy ? t('startingNow') : t('retryStart')}
          </button>
        </div>
      </ModalFrame>
    )
  }

  if (status.phase === 'resource-warning' && !dismissed) {
    return (
      <ModalFrame title={t('resourceWarningTitle')}>
        <p className="m4a-overlay__body">{t('resourceWarningBody')}</p>
        <ul className="m4a-overlay__reasons">{(status.reasons ?? []).map(reason => <li key={reason}>{reason}</li>)}</ul>
        <div className="m4a-overlay__actions">
          <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { setDismissed(true) }}>{t('notNow')}</button>
          <button type="button" className="m4a-settings__button m4a-settings__button--danger" disabled={busy} onClick={() => { void launch(true) }}>
            {busy ? t('startingNow') : t('startAnyway')}
          </button>
        </div>
      </ModalFrame>
    )
  }

  if (!dismissed && !status.ready && status.phase === 'offline' && config.mode !== 'auto') {
    return (
      <ModalFrame title={t('startupPromptTitle')}>
        <p className="m4a-overlay__body">{t('startupPromptBody')}</p>
        <code className="m4a-overlay__endpoint">{status.endpoint}</code>
        {error === '' ? null : <p className="m4a-overlay__error">{error}</p>}
        <div className="m4a-overlay__actions m4a-overlay__actions--three">
          <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { setDismissed(true) }}>{t('notNow')}</button>
          <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { void launch(false) }}>{t('startThisTime')}</button>
          <button type="button" className="m4a-settings__button m4a-settings__button--primary" disabled={busy} onClick={() => { void launch(false, true) }}>
            {busy ? t('startingNow') : t('startAndRemember')}
          </button>
        </div>
      </ModalFrame>
    )
  }
  return null
}
