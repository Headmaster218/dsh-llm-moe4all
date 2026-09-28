import { useEffect, useState, useSyncExternalStore } from 'react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import { Play, RefreshCw } from 'lucide-react'
import type { Config } from '../index.js'
import type { EngineControlStatus } from '../host-routes.js'
import { fetchEngineStatus, startEngine } from './engine-api.js'
import { Button, Dialog, Toggle, type Translate } from './workspace-ui.js'

export function EngineStartupOverlay({ scope, t }: { scope: SettingsScope<Config>; t: Translate }) {
  const snapshot = useSyncExternalStore(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot(),
    () => scope.getSnapshot(),
  )
  const [status, setStatus] = useState<EngineControlStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [remember, setRemember] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(
    document.documentElement.dataset.moe4allSettings === 'open',
  )
  const [error, setError] = useState('')
  useEffect(() => {
    let disposed = false
    let timer: ReturnType<typeof setTimeout>
    const poll = async () => {
      try {
        const next = await fetchEngineStatus()
        if (!disposed) setStatus(next)
      } catch {
        /* The settings page exposes connection failures. */
      }
      if (!disposed)
        timer = setTimeout(() => {
          void poll()
        }, 1500)
    }
    const visibility = () => {
      const open = document.documentElement.dataset.moe4allSettings === 'open'
      setSettingsOpen(open)
      if (open) setDismissed(true)
    }
    window.addEventListener('moe4all-settings-visibility', visibility)
    void poll()
    return () => {
      disposed = true
      clearTimeout(timer)
      window.removeEventListener('moe4all-settings-visibility', visibility)
    }
  }, [])
  async function launch(force: boolean) {
    setBusy(true)
    setError('')
    try {
      const result = await startEngine(force)
      setStatus(result.status)
      if (result.ok) {
        if (remember) await scope.set('mode', 'auto')
        setDismissed(true)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }
  const config = snapshot.value
  if (!config || !status || settingsOpen || dismissed || status.ready || config.mode === 'connect')
    return null
  const phase = status.phase
  if (!['offline', 'starting', 'error', 'duplicate-process', 'resource-warning'].includes(phase)) return null
  if (phase === 'offline' && config.mode === 'auto') return null
  const starting = phase === 'starting' || busy
  const warning = phase === 'resource-warning'
  const failed = phase === 'error' || phase === 'duplicate-process'
  return (
    <Dialog
      title={t(
        starting
          ? 'startupProgressTitle'
          : warning
            ? 'resourceWarningTitle'
            : failed
              ? 'startupFailedTitle'
              : 'startupPromptTitle',
      )}
      closeLabel={t('notNow')}
      onClose={() => setDismissed(true)}
      actions={
        <>
          <Button onClick={() => setDismissed(true)}>{t('notNow')}</Button>
          {!starting && (
            <Button
              kind={warning ? 'danger' : 'primary'}
              icon={failed ? RefreshCw : Play}
              onClick={() => void launch(warning)}
            >
              {t(warning ? 'startAnyway' : failed ? 'retryStart' : 'startNow')}
            </Button>
          )}
        </>
      }
    >
      <p>{t(warning ? 'resourceWarningBody' : starting ? 'startupProgressBody' : 'startupPromptBody')}</p>
      <code>{status.endpoint}</code>
      {warning && status.reasons?.map((reason) => <p key={reason}>{reason}</p>)}
      {failed && <p role="alert">{status.message}</p>}
      {starting && <progress aria-label={t('startingStatus')} />}
      {(starting || failed) && (
        <pre className="m4a-log m4a-log--preview">
          {status.startupLines?.join('\n') || status.message || t('noOutput')}
        </pre>
      )}
      {!starting && !failed && (
        <Toggle
          checked={remember}
          onChange={setRemember}
          label={t('autoStart')}
          detail={t('resourcesHelp')}
        />
      )}
      {error && <p role="alert">{error}</p>}
    </Dialog>
  )
}
