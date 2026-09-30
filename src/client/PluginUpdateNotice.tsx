import { useEffect, useRef, useState } from 'react'
import { Download, RefreshCw, RotateCcw, X } from 'lucide-react'

import type { Translate } from './workspace-ui.js'
import {
  compactUpdateVersion,
  MarketPluginUpdateApi,
  type MarketUpdateCapabilities,
  type PluginUpdateOperation,
  type PluginUpdateStatus,
} from './plugin-update.js'

interface NoticeState {
  capabilities: MarketUpdateCapabilities
  status: PluginUpdateStatus
  operation: PluginUpdateOperation | null
  phase: 'available' | 'updating' | 'complete' | 'failed'
  error: string | null
}

function dismissedKey(status: PluginUpdateStatus): string {
  return `moe4all.plugin-update.dismissed:${status.latestVersion ?? 'unknown'}`
}

function wasDismissed(status: PluginUpdateStatus): boolean {
  try {
    return sessionStorage.getItem(dismissedKey(status)) === '1'
  } catch {
    return false
  }
}

function rememberDismissed(status: PluginUpdateStatus): void {
  try {
    sessionStorage.setItem(dismissedKey(status), '1')
  } catch {
    // Private browsing or a locked-down host may disable session storage.
  }
}

export function PluginUpdateNotice({ t }: { t: Translate }) {
  const api = useRef(new MarketPluginUpdateApi())
  const [notice, setNotice] = useState<NoticeState | null>(null)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const capabilities = await api.current.discover()
          if (capabilities === null) return
          const status = await api.current.check()
          if (!active || !status.updateAvailable || wasDismissed(status)) return
          setNotice({ capabilities, status, operation: null, phase: 'available', error: null })
        } catch {
          // Update discovery must never interfere with startup or conversation work.
        }
      })()
    }, 3500)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [])

  if (notice === null) return null

  const dismiss = () => {
    rememberDismissed(notice.status)
    setNotice(null)
  }

  const update = async () => {
    setNotice(current => current === null ? null : { ...current, phase: 'updating', error: null })
    try {
      const started = await api.current.start()
      setNotice(current => current === null ? null : { ...current, operation: started })
      const finished = await api.current.waitForCompletion(started.operationId, operation => {
        setNotice(current => current === null ? null : { ...current, operation })
      })
      if (finished.state !== 'succeeded') {
        throw new Error(finished.failure?.message ?? t('pluginUpdateFailed'))
      }
      setNotice(current => current === null ? null : {
        ...current,
        operation: finished,
        phase: 'complete',
        error: null,
      })
    } catch (error) {
      setNotice(current => current === null ? null : {
        ...current,
        phase: 'failed',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const restart = async () => {
    try {
      await api.current.restart()
    } catch {
      // A successful restart may close the connection before the response arrives.
    }
  }

  const operation = notice.operation
  const progress = operation?.progress.percent
  const needsRestart = operation?.outcome.restartRequired === true
  const needsRefresh = notice.phase === 'complete' && !needsRestart
  const version = `${compactUpdateVersion(notice.status.installedVersion)} -> ${compactUpdateVersion(notice.status.latestVersion)}`

  return (
    <aside className="m4a-plugin-update" aria-live="polite" aria-label={t('pluginUpdateTitle')}>
      <header>
        <Download size={17} />
        <strong>{notice.phase === 'complete' ? t('pluginUpdateComplete') : t('pluginUpdateTitle')}</strong>
        <button className="m4a-icon-btn" type="button" onClick={dismiss} title={t('dismiss')} aria-label={t('dismiss')}>
          <X size={15} />
        </button>
      </header>
      <p>{notice.phase === 'complete'
        ? needsRestart ? t('pluginRestartRequired') : t('pluginRefreshRequired')
        : t('pluginUpdateAvailable')}</p>
      <code>{version}</code>
      {notice.phase === 'updating' && (
        <div className="m4a-plugin-update-progress">
          <progress max={100} value={progress ?? undefined} />
          <span>{operation?.progress.detail ?? operation?.progress.phase ?? t('pluginUpdating')}</span>
        </div>
      )}
      {notice.error !== null && <p className="m4a-plugin-update-error">{notice.error}</p>}
      <footer>
        {notice.phase === 'available' && (
          <button className="m4a-btn m4a-btn--primary" type="button" onClick={() => void update()}>
            <Download size={14} /> {t('pluginUpdateNow')}
          </button>
        )}
        {notice.phase === 'failed' && (
          <button className="m4a-btn" type="button" onClick={() => void update()}>
            <RotateCcw size={14} /> {t('pluginUpdateRetry')}
          </button>
        )}
        {notice.phase === 'complete' && needsRestart && notice.capabilities.restartSupported && (
          <button className="m4a-btn m4a-btn--primary" type="button" onClick={() => void restart()}>
            <RefreshCw size={14} /> {t('restartDsh')}
          </button>
        )}
        {notice.phase === 'complete' && needsRefresh && (
          <button className="m4a-btn m4a-btn--primary" type="button" onClick={() => window.location.reload()}>
            <RefreshCw size={14} /> {t('refreshDsh')}
          </button>
        )}
      </footer>
    </aside>
  )
}
