import { useEffect, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'

import type { Config } from '../index.js'
import type { EngineControlStatus } from '../host-routes.js'
import type { EngineInstallProgress, EngineReleaseStatus, InstalledEngine } from '../engine-release.js'
import { fetchEngineStatus, fetchReleaseStatus, installLatestEngine, installLocalEngine, startEngine } from './engine-api.js'
import { buildEngineArguments, type EngineAutoProfile } from './engine-setup.js'
import type { Moe4AllLocaleKey } from './locales.js'
import { formatTokenValue, parseTokenValue } from './token-value.js'

type Translate = (key: Moe4AllLocaleKey) => string
const OFFICIAL_RELEASES = 'https://github.com/Headmaster218/MoE4All/releases/latest'

interface Props {
  scope: SettingsScope<Config>
  t: Translate
}

function effectiveMode(mode: Config['mode']): 'connect' | 'prompt' | 'auto' {
  return mode === 'managed' ? 'prompt' : mode ?? 'prompt'
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
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GiB`
}

function progressText(value: EngineInstallProgress, t: Translate): string {
  if (value.stage === 'downloading') {
    const total = value.totalBytes === undefined ? '' : ` / ${formatBytes(value.totalBytes)}`
    const percent = value.percent === undefined ? '' : ` (${value.percent.toFixed(1)}%)`
    return `${t('downloadingEngine')} ${formatBytes(value.downloadedBytes)}${total}${percent}`
  }
  const labels: Partial<Record<EngineInstallProgress['stage'], Moe4AllLocaleKey>> = {
    checking: 'checkingDownload',
    verifying: 'verifyingDownload',
    extracting: 'extractingDownload',
    finalizing: 'finalizingDownload',
    complete: 'downloadComplete',
  }
  const label = labels[value.stage]
  return label === undefined ? t('installing') : t(label)
}

function activeInstall(value: EngineInstallProgress | undefined): boolean {
  return value !== undefined && ['checking', 'downloading', 'verifying', 'extracting', 'finalizing'].includes(value.stage)
}

async function waitForRuntime(): Promise<EngineControlStatus> {
  await new Promise(resolve => window.setTimeout(resolve, 400))
  let status = await fetchEngineStatus()
  for (let attempt = 0; ['checking', 'missing-arguments'].includes(status.phase) && attempt < 20; attempt += 1) {
    await new Promise(resolve => window.setTimeout(resolve, 250))
    status = await fetchEngineStatus()
  }
  return status
}

export function EngineStartupOverlay({ scope, t }: Props): ReactNode {
  const snapshot = useSyncExternalStore(
    listener => scope.subscribe(listener),
    () => scope.getSnapshot(),
    () => scope.getSnapshot(),
  )
  const config = snapshot.value
  const [status, setStatus] = useState<EngineControlStatus | null>(null)
  const [release, setRelease] = useState<EngineReleaseStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [updateDismissed, setUpdateDismissed] = useState(false)
  const [error, setError] = useState('')
  const [localPath, setLocalPath] = useState('')
  const [setupInitialized, setSetupInitialized] = useState(false)
  const [modelPath, setModelPath] = useState('')
  const [setupHost, setSetupHost] = useState('127.0.0.1')
  const [setupPort, setSetupPort] = useState('8080')
  const [setupContext, setSetupContext] = useState('256k')
  const [setupParallel, setSetupParallel] = useState('1')
  const [setupProfile, setSetupProfile] = useState<EngineAutoProfile>('conservative')
  const [setupMtp, setSetupMtp] = useState(false)

  const refresh = async (): Promise<void> => {
    try {
      setStatus(await fetchEngineStatus())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

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
    const timer = window.setInterval(() => { void poll() }, 2000)
    return () => {
      disposed = true
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    let disposed = false
    void fetchReleaseStatus().then((next) => {
      if (!disposed) setRelease(next)
    }).catch((cause) => {
      if (!disposed) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { disposed = true }
  }, [])

  useEffect(() => {
    if (config === undefined || status?.phase !== 'missing-arguments' || setupInitialized) return
    setSetupHost(config.host ?? '127.0.0.1')
    setSetupPort(String(config.port ?? 8080))
    setSetupContext(formatTokenValue(config.contextWindow ?? 262_144))
    setSetupProfile(config.arguments?.includes('device.auto_profile=aggressive') === true ? 'aggressive' : 'conservative')
    setSetupMtp(config.arguments?.includes('spec.mtp=true') === true)
    setSetupInitialized(true)
  }, [config, setupInitialized, status?.phase])

  if (config === undefined || status === null) return null
  const mode = effectiveMode(config.mode)
  if (mode === 'connect') return null

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

  const applyInstalled = async (installed: InstalledEngine): Promise<void> => {
    await Promise.all([
      scope.set('executable', installed.executable),
      scope.set('workingDirectory', installed.workingDirectory),
    ])
    try { setRelease(await fetchReleaseStatus(true)) } catch {}
    await new Promise(resolve => window.setTimeout(resolve, 700))
    await refresh()
    if ((config.arguments?.length ?? 0) > 0) setUpdateDismissed(true)
  }

  const install = async (source: 'official' | 'local'): Promise<void> => {
    setBusy(true)
    setError('')
    const timer = window.setInterval(() => {
      void fetchReleaseStatus().then(setRelease).catch(() => {})
    }, 350)
    try {
      const installed = source === 'official'
        ? await installLatestEngine()
        : await installLocalEngine(localPath)
      await applyInstalled(installed)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      try { setRelease(await fetchReleaseStatus()) } catch {}
    } finally {
      window.clearInterval(timer)
      setBusy(false)
    }
  }

  const saveSetupAndStart = async (): Promise<void> => {
    setBusy(true)
    setError('')
    try {
      const contextWindow = parseTokenValue(setupContext)
      if (contextWindow === undefined) throw new Error(t('invalidContext'))
      const port = Number(setupPort)
      const parallel = Number(setupParallel)
      const arguments_ = buildEngineArguments({
        model: modelPath,
        host: setupHost,
        port,
        contextWindow,
        parallel,
        profile: setupProfile,
        mtp: setupMtp,
      })
      await Promise.all([
        scope.set('protocol', 'http'),
        scope.set('host', setupHost.trim()),
        scope.set('port', port),
        scope.set('apiBasePath', '/v1'),
        scope.set('endpoint', ''),
        scope.set('arguments', arguments_),
        scope.set('contextWindow', contextWindow),
      ])
      const ready = await waitForRuntime()
      setStatus(ready)
      const result = await startEngine(false)
      setStatus(result.status)
      if (result.ok) setDismissed(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  if (status.phase === 'resource-warning' && !dismissed) {
    return (
      <ModalFrame title={t('resourceWarningTitle')}>
        <p className="m4a-overlay__body">{t('resourceWarningBody')}</p>
        <ul className="m4a-overlay__reasons">
          {(status.reasons ?? []).map(reason => <li key={reason}>{reason}</li>)}
        </ul>
        {error === '' ? null : <p className="m4a-overlay__error">{error}</p>}
        <div className="m4a-overlay__actions">
          <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { setDismissed(true) }}>{t('notNow')}</button>
          <button type="button" className="m4a-settings__button m4a-settings__button--danger" disabled={busy} onClick={() => { void launch(true) }}>
            {busy ? t('startingNow') : t('startAnyway')}
          </button>
        </div>
      </ModalFrame>
    )
  }

  if (status.phase === 'missing-executable' && !dismissed) {
    const installState = release?.install
    const installing = busy || activeInstall(installState)
    const installError = error || installState?.error || ''
    return (
      <ModalFrame title={t('installTitle')}>
        <p className="m4a-overlay__body">{t('installBody')}</p>
        {release?.latest === undefined ? null : <p className="m4a-overlay__version">{release.latest.name}</p>}
        {!installing || installState === undefined ? null : (
          <div className="m4a-overlay__progress">
            <progress max={100} value={installState.percent} />
            <span>{progressText(installState, t)}</span>
          </div>
        )}
        {installError === '' ? null : <p className="m4a-overlay__error">{installError}</p>}
        <div className="m4a-overlay__links">
          <a href={release?.latest?.pageUrl ?? OFFICIAL_RELEASES} target="_blank" rel="noreferrer">{t('openReleasePage')}</a>
          {release?.latest?.archive.browser_download_url === undefined ? null : <a href={release.latest.archive.browser_download_url} target="_blank" rel="noreferrer">{t('downloadInBrowser')}</a>}
        </div>
        <label className="m4a-settings__field m4a-overlay__local-path">
          <span className="m4a-settings__label">{t('localDownloadPath')}</span>
          <input
            className="m4a-settings__input"
            value={localPath}
            disabled={installing}
            spellCheck={false}
            placeholder="C:\\Downloads\\MoE4All-Windows-x86_64-v0.8.0.zip"
            onChange={event => { setLocalPath(event.target.value) }}
          />
          <span className="m4a-settings__hint">{t('localDownloadHint')}</span>
        </label>
        <div className="m4a-overlay__actions m4a-overlay__actions--install">
          <button type="button" className="m4a-settings__button" disabled={installing} onClick={() => { setDismissed(true) }}>{t('notNow')}</button>
          <button type="button" className="m4a-settings__button" disabled={installing || localPath.trim() === ''} onClick={() => { void install('local') }}>{t('useLocalDownload')}</button>
          <button type="button" className="m4a-settings__button m4a-settings__button--primary" disabled={installing} onClick={() => { void install('official') }}>
            {installing ? t('installing') : installError === '' ? t('installLatest') : t('retryDownload')}
          </button>
        </div>
      </ModalFrame>
    )
  }

  if (status.phase === 'missing-arguments' && !dismissed) {
    const contextValid = parseTokenValue(setupContext) !== undefined
    return (
      <ModalFrame title={t('setupTitle')}>
        <p className="m4a-overlay__body">{t('setupBody')}</p>
        <div className="m4a-overlay__setup-grid">
          <label className="m4a-settings__field m4a-settings__field--wide">
            <span className="m4a-settings__label">{t('modelPath')}</span>
            <input className="m4a-settings__input" value={modelPath} disabled={busy} spellCheck={false} placeholder="D:\\Models\\model.gguf" onChange={event => { setModelPath(event.target.value) }} />
          </label>
          <label className="m4a-settings__field">
            <span className="m4a-settings__label">{t('host')}</span>
            <input className="m4a-settings__input" value={setupHost} disabled={busy} spellCheck={false} onChange={event => { setSetupHost(event.target.value) }} />
          </label>
          <label className="m4a-settings__field">
            <span className="m4a-settings__label">{t('port')}</span>
            <input className="m4a-settings__input" inputMode="numeric" value={setupPort} disabled={busy} onChange={event => { setSetupPort(event.target.value) }} />
          </label>
          <label className="m4a-settings__field">
            <span className="m4a-settings__label">{t('contextWindow')}</span>
            <input className={`m4a-settings__input${contextValid || setupContext === '' ? '' : ' m4a-settings__input--invalid'}`} value={setupContext} disabled={busy} placeholder="160k" onChange={event => { setSetupContext(event.target.value) }} />
            <span className="m4a-settings__hint">{t('tokenUnitHint')}</span>
          </label>
          <label className="m4a-settings__field">
            <span className="m4a-settings__label">{t('parallelSlots')}</span>
            <input className="m4a-settings__input" inputMode="numeric" value={setupParallel} disabled={busy} onChange={event => { setSetupParallel(event.target.value) }} />
          </label>
          <label className="m4a-settings__field m4a-settings__field--wide">
            <span className="m4a-settings__label">{t('automaticProfile')}</span>
            <select className="m4a-settings__select" value={setupProfile} disabled={busy} onChange={event => { setSetupProfile(event.target.value as EngineAutoProfile) }}>
              <option value="conservative">{t('conservativeProfile')}</option>
              <option value="aggressive">{t('aggressiveProfile')}</option>
            </select>
          </label>
        </div>
        <label className="m4a-settings__check m4a-overlay__mtp">
          <input type="checkbox" checked={setupMtp} disabled={busy} onChange={event => { setSetupMtp(event.target.checked) }} />
          <span>{t('enableMtp')}</span>
        </label>
        {error === '' ? null : <p className="m4a-overlay__error">{error}</p>}
        <div className="m4a-overlay__actions">
          <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { setDismissed(true) }}>{t('notNow')}</button>
          <button type="button" className="m4a-settings__button m4a-settings__button--primary" disabled={busy || modelPath.trim() === '' || !contextValid} onClick={() => { void saveSetupAndStart() }}>
            {busy ? t('startingNow') : t('saveSetupAndStart')}
          </button>
        </div>
      </ModalFrame>
    )
  }

  if (mode === 'prompt' && status.phase === 'offline' && status.canStart && !dismissed) {
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

  if (release?.updateAvailable === true && !status.ready && !updateDismissed) {
    return (
      <ModalFrame title={t('updateTitle')}>
        <p className="m4a-overlay__body">{t('updateBody')}</p>
        <p className="m4a-overlay__version">{release.latest?.name}</p>
        {error === '' ? null : <p className="m4a-overlay__error">{error}</p>}
        <div className="m4a-overlay__actions">
          <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { setUpdateDismissed(true) }}>{t('notNow')}</button>
          <button type="button" className="m4a-settings__button m4a-settings__button--primary" disabled={busy} onClick={() => { void install('official') }}>
            {busy ? t('installing') : t('updateNow')}
          </button>
        </div>
      </ModalFrame>
    )
  }

  return null
}
