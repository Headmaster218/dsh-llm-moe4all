import { useEffect, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'

import type { Config } from '../index.js'
import type { EngineControlStatus } from '../host-routes.js'
import type { ModelDownloadProgress, RecommendedModel, RecommendedModelKind } from '../model-download.js'
import type { LocalModelFiles, ModelFileKind } from '../model-files.js'
import type { EngineInstallProgress, EngineReleaseStatus, InstalledEngine } from '../engine-release.js'
import { fetchEngineStatus, fetchModelCatalog, fetchModelDownload, fetchReleaseStatus, installLatestEngine, installLocalEngine, pickModelFile, scanModelPath, startEngine, startModelDownload, validateModelPaths } from './engine-api.js'
import { buildEngineArguments, type EngineAutoProfile } from './engine-setup.js'
import type { Moe4AllLocaleKey } from './locales.js'
import { formatTokenValue, parseTokenValue } from './token-value.js'

type Translate = (key: Moe4AllLocaleKey) => string
const OFFICIAL_RELEASES = 'https://github.com/Headmaster218/MoE4All/releases/latest'

interface Props {
  scope: SettingsScope<Config>
  t: Translate
  pickDirectory(): Promise<string | null>
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

export function EngineStartupOverlay({ scope, t, pickDirectory }: Props): ReactNode {
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
  const [modelDirectory, setModelDirectory] = useState('')
  const [modelChoices, setModelChoices] = useState<string[]>([])
  const [recommendedModels, setRecommendedModels] = useState<RecommendedModel[]>([])
  const [recommendedModelId, setRecommendedModelId] = useState('qwen38-flash-ad-q4km')
  const [modelDownload, setModelDownload] = useState<ModelDownloadProgress>({ stage: 'idle', downloadedBytes: 0 })
  const [nativeFilePicker, setNativeFilePicker] = useState(false)
  const [visionEnabled, setVisionEnabled] = useState(false)
  const [visionPath, setVisionPath] = useState('')
  const [embeddingEnabled, setEmbeddingEnabled] = useState(false)
  const [embeddingPath, setEmbeddingPath] = useState('')
  const [embeddingIdleTimeout, setEmbeddingIdleTimeout] = useState('60')
  const [setupHost, setSetupHost] = useState('127.0.0.1')
  const [setupPort, setSetupPort] = useState('8080')
  const [setupContext, setSetupContext] = useState('160k')
  const [setupMaxTokens, setSetupMaxTokens] = useState('100k')
  const [setupParallel, setSetupParallel] = useState('1')
  const [setupProfile, setSetupProfile] = useState<EngineAutoProfile>('conservative')
  const [setupMtp, setSetupMtp] = useState(false)
  const [mtpPath, setMtpPath] = useState('')
  const [sessionCacheEnabled, setSessionCacheEnabled] = useState(true)
  const [sessionCachePath, setSessionCachePath] = useState('kv-sessions')
  const [sessionCacheMax, setSessionCacheMax] = useState('10g')
  const [sessionCacheIdle, setSessionCacheIdle] = useState('90')
  const [sessionCacheTtl, setSessionCacheTtl] = useState('24')
  const [setupAutoStart, setSetupAutoStart] = useState(false)

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
    void fetchModelCatalog().then((next) => {
      if (disposed) return
      setRecommendedModels(next.models)
      setModelDownload(next.download)
      setNativeFilePicker(next.capabilities.nativeFilePicker)
    }).catch((cause) => {
      if (!disposed) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { disposed = true }
  }, [])

  useEffect(() => {
    if (modelDownload.stage !== 'downloading') return
    let disposed = false
    const timer = window.setInterval(() => {
      void fetchModelDownload().then((next) => {
        if (!disposed) setModelDownload(next)
      }).catch((cause) => {
        if (!disposed) setError(cause instanceof Error ? cause.message : String(cause))
      })
    }, 750)
    return () => {
      disposed = true
      window.clearInterval(timer)
    }
  }, [modelDownload.stage])

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
    setSetupContext(formatTokenValue(config.contextWindow ?? 163_840))
    setSetupMaxTokens(formatTokenValue(config.maxTokens ?? 102_400))
    setSetupProfile(config.arguments?.includes('device.auto_profile=aggressive') === true ? 'aggressive' : 'conservative')
    setSetupMtp(config.arguments?.includes('spec.mtp=true') === true)
    setSetupAutoStart(effectiveMode(config.mode) === 'auto')
    setModelDirectory(config.modelDirectory ?? '')
    setSetupInitialized(true)
  }, [config, setupInitialized, status?.phase])

  if (config === undefined || status === null) return null
  const mode = effectiveMode(config.mode)
  if (mode === 'connect') return null
  const mainRecommendations = recommendedModels.filter(item => item.kind === 'main')
  const selectedRecommendation = mainRecommendations.find(item => item.id === recommendedModelId) ?? mainRecommendations[0]
  const recommendation = (kind: RecommendedModelKind): RecommendedModel | undefined => recommendedModels.find(item => item.kind === kind)
  const activeDownloadModel = recommendedModels.find(item => item.id === modelDownload.modelId)

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

  const applyDiscoveredFiles = (files: LocalModelFiles, target: ModelFileKind = 'main'): void => {
    if (target === 'main') {
      setModelChoices(files.main)
      const selected = files.selected !== undefined && files.main.includes(files.selected)
        ? files.selected
        : files.main[0]
      if (selected !== undefined) setModelPath(selected)
      if (files.vision[0] !== undefined) {
        setVisionPath(files.vision[0])
        setVisionEnabled(true)
      }
      if (files.embedding[0] !== undefined) {
        setEmbeddingPath(files.embedding[0])
        setEmbeddingEnabled(true)
      }
      if (files.mtp[0] !== undefined) setMtpPath(files.mtp[0])
      return
    }
    const selected = files.selected !== undefined && files[target].includes(files.selected)
      ? files.selected
      : files[target][0]
    if (selected === undefined) {
      const key = target === 'vision' ? 'noVisionFound' : target === 'embedding' ? 'noEmbeddingFound' : 'noMtpFound'
      throw new Error(t(key))
    }
    if (target === 'vision') {
      setVisionPath(selected)
      setVisionEnabled(true)
    } else if (target === 'embedding') {
      setEmbeddingPath(selected)
      setEmbeddingEnabled(true)
    } else {
      setMtpPath(selected)
      setSetupMtp(true)
    }
  }

  const discover = async (path: string, target: ModelFileKind = 'main'): Promise<void> => {
    setBusy(true)
    setError('')
    try {
      applyDiscoveredFiles(await scanModelPath(path), target)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const chooseModelDirectory = async (target: ModelFileKind = 'main'): Promise<void> => {
    try {
      const directory = await pickDirectory()
      if (directory !== null) await discover(directory, target)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const chooseModelFile = async (target: ModelFileKind = 'main'): Promise<void> => {
    try {
      const path = await pickModelFile()
      if (path !== undefined) await discover(path, target)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const chooseDownloadDirectory = async (): Promise<void> => {
    try {
      const directory = await pickDirectory()
      if (directory !== null) setModelDirectory(directory)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const monitorModelDownload = async (selected: RecommendedModel): Promise<void> => {
    while (true) {
      await new Promise(resolve => window.setTimeout(resolve, 750))
      const next = await fetchModelDownload()
      setModelDownload(next)
      if (next.stage === 'downloading') continue
      if (next.stage === 'error') throw new Error(next.error ?? 'Model download failed.')
      if (next.stage !== 'complete' || next.selectedFile === undefined) return
      const target: ModelFileKind = selected.kind === 'main' ? 'main' : selected.kind
      applyDiscoveredFiles(await scanModelPath(next.selectedFile), target)
      return
    }
  }

  const downloadRecommendation = async (selected: RecommendedModel): Promise<void> => {
    setError('')
    try {
      const initial = await startModelDownload(selected.id, modelDirectory)
      setModelDownload(initial)
      await monitorModelDownload(selected)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const saveSetupAndStart = async (): Promise<void> => {
    setBusy(true)
    setError('')
    try {
      const contextWindow = parseTokenValue(setupContext)
      if (contextWindow === undefined) throw new Error(t('invalidContext'))
      const maxTokens = parseTokenValue(setupMaxTokens)
      if (maxTokens === undefined) throw new Error(t('invalidMaxTokens'))
      const port = Number(setupPort)
      const parallel = Number(setupParallel)
      if (visionEnabled && visionPath.trim() === '') throw new Error(t('visionPathRequired'))
      if (embeddingEnabled && embeddingPath.trim() === '') throw new Error(t('embeddingPathRequired'))
      if (setupMtp && mtpPath.trim() === '') throw new Error(t('mtpPathRequired'))
      const paths = await validateModelPaths({
        main: modelPath,
        ...(visionEnabled ? { vision: visionPath } : {}),
        ...(embeddingEnabled ? { embedding: embeddingPath } : {}),
        ...(setupMtp ? { mtp: mtpPath } : {}),
      })
      const arguments_ = buildEngineArguments({
        model: paths.main,
        ...(paths.vision === undefined ? {} : { visionModel: paths.vision }),
        ...(paths.embedding === undefined ? {} : {
          embeddingModel: paths.embedding,
          embeddingIdleTimeout: Number(embeddingIdleTimeout),
        }),
        ...(paths.mtp === undefined ? {} : { mtpModel: paths.mtp }),
        host: setupHost,
        port,
        contextWindow,
        maxTokens,
        parallel,
        profile: setupProfile,
        mtp: setupMtp,
        ...(sessionCacheEnabled ? {
          sessionCache: {
            directory: sessionCachePath,
            maxSize: sessionCacheMax,
            idleSeconds: Number(sessionCacheIdle),
            ttlHours: Number(sessionCacheTtl),
          },
        } : {}),
      })
      await Promise.all([
        scope.set('mode', setupAutoStart ? 'auto' : 'prompt'),
        scope.set('protocol', 'http'),
        scope.set('host', setupHost.trim()),
        scope.set('port', port),
        scope.set('apiBasePath', '/v1'),
        scope.set('endpoint', ''),
        scope.set('arguments', arguments_),
        scope.set('contextWindow', contextWindow),
        scope.set('maxTokens', maxTokens),
        scope.set('modelDirectory', modelDirectory.trim()),
        scope.set('vision', visionEnabled),
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

  if (status.phase === 'error' && !dismissed) {
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
    const maxTokensValid = parseTokenValue(setupMaxTokens) !== undefined
    return (
      <ModalFrame title={t('setupTitle')}>
        <p className="m4a-overlay__body">{t('setupBody')}</p>
        <section className="m4a-overlay__section">
          <div className="m4a-overlay__section-heading">
            <h3>{t('modelsAndFeatures')}</h3>
          </div>
          <div className="m4a-overlay__recommendation">
            <label className="m4a-settings__field">
              <span className="m4a-settings__label">{t('recommendedModel')}</span>
              <select className="m4a-settings__select" value={selectedRecommendation?.id ?? ''} disabled={modelDownload.stage === 'downloading'} onChange={event => { setRecommendedModelId(event.target.value) }}>
                {mainRecommendations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            {selectedRecommendation === undefined ? null : (
              <div className="m4a-overlay__model-details">
                <span>{selectedRecommendation.architecture}</span>
                <span>{selectedRecommendation.quantization}</span>
                <span>{t('downloadSize')}: {formatBytes(selectedRecommendation.totalBytes)}</span>
                <span>{t('fileCount')}: {selectedRecommendation.files.length}</span>
                <span>{t('supportsVision')}: {selectedRecommendation.supportsVision ? 'Yes' : 'No'}</span>
                <span>{t('supportsMtp')}: {selectedRecommendation.supportsMtp ? 'Yes' : 'No'}</span>
              </div>
            )}
            <label className="m4a-settings__field">
              <span className="m4a-settings__label">{t('modelDirectory')}</span>
              <div className="m4a-overlay__path-row">
                <input className="m4a-settings__input" value={modelDirectory} disabled={modelDownload.stage === 'downloading'} spellCheck={false} placeholder="D:\\Models" onChange={event => { setModelDirectory(event.target.value) }} />
                <button type="button" className="m4a-settings__button" disabled={modelDownload.stage === 'downloading'} onClick={() => { void chooseDownloadDirectory() }}>{t('chooseDirectory')}</button>
              </div>
              <span className="m4a-settings__hint">{t('downloadToDirectory')}</span>
            </label>
            {selectedRecommendation === undefined ? null : (
              <div className="m4a-overlay__download-actions">
                <a href={selectedRecommendation.sourceUrl} target="_blank" rel="noreferrer">{t('sourcePage')}</a>
                <button
                  type="button"
                  className="m4a-settings__button m4a-settings__button--primary"
                  disabled={modelDirectory.trim() === '' || modelDownload.stage === 'downloading'}
                  onClick={() => { void downloadRecommendation(selectedRecommendation) }}
                >
                  {modelDownload.stage === 'error' && modelDownload.modelId === selectedRecommendation.id ? t('modelDownloadRetry') : t('downloadRecommended')}
                </button>
              </div>
            )}
            {selectedRecommendation === undefined || modelDownload.modelId !== selectedRecommendation.id || modelDownload.stage === 'idle' ? null : (
              <div className="m4a-overlay__progress">
                <progress max={100} value={modelDownload.percent} />
                <span>
                  {modelDownload.stage === 'complete' ? t('modelDownloadComplete') : t('modelDownloadProgress')}
                  {' '}{formatBytes(modelDownload.downloadedBytes)} / {formatBytes(modelDownload.totalBytes ?? selectedRecommendation.totalBytes)}
                  {modelDownload.fileIndex === undefined ? '' : ` (${modelDownload.fileIndex}/${modelDownload.fileCount})`}
                </span>
              </div>
            )}
          </div>
          <div className="m4a-settings__field">
            <span className="m4a-settings__label">{t('modelPath')}</span>
            <div className="m4a-overlay__path-row">
              <input className="m4a-settings__input" value={modelPath} disabled={busy} spellCheck={false} placeholder="D:\\Models\\model.gguf" onChange={event => { setModelPath(event.target.value) }} />
              {nativeFilePicker ? <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { void chooseModelFile('main') }}>{t('chooseFile')}</button> : null}
              <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { void chooseModelDirectory('main') }}>{t('chooseDirectory')}</button>
              <button type="button" className="m4a-settings__button" disabled={busy || modelPath.trim() === ''} onClick={() => { void discover(modelPath) }}>{t('scanDirectory')}</button>
            </div>
            {modelChoices.length < 2 ? null : (
              <select className="m4a-settings__select" value={modelChoices.includes(modelPath) ? modelPath : ''} disabled={busy} onChange={event => { setModelPath(event.target.value) }}>
                <option value="">{t('selectDetectedModel')}</option>
                {modelChoices.map(path => <option key={path} value={path}>{path}</option>)}
              </select>
            )}
          </div>
          <div className="m4a-overlay__optional-model">
            <label className="m4a-settings__check">
              <input type="checkbox" checked={visionEnabled} disabled={busy} onChange={event => { setVisionEnabled(event.target.checked) }} />
              <span>{t('enableVision')}</span>
            </label>
            {recommendation('vision') === undefined ? null : (
              <button type="button" className="m4a-settings__button" disabled={modelDirectory.trim() === '' || modelDownload.stage === 'downloading'} onClick={() => { void downloadRecommendation(recommendation('vision')!) }}>
                {t('downloadVision')} ({formatBytes(recommendation('vision')!.totalBytes)})
              </button>
            )}
          </div>
          {visionEnabled ? (
            <div className="m4a-overlay__path-row">
              <input className="m4a-settings__input" value={visionPath} disabled={busy} spellCheck={false} placeholder="D:\\Models\\mmproj.gguf" onChange={event => { setVisionPath(event.target.value) }} />
              {nativeFilePicker ? <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { void chooseModelFile('vision') }}>{t('chooseFile')}</button> : null}
              <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { void chooseModelDirectory('vision') }}>{t('chooseDirectory')}</button>
            </div>
          ) : null}
          <div className="m4a-overlay__optional-model">
            <label className="m4a-settings__check">
              <input type="checkbox" checked={embeddingEnabled} disabled={busy} onChange={event => { setEmbeddingEnabled(event.target.checked) }} />
              <span>{t('enableEmbedding')}</span>
            </label>
            {recommendation('embedding') === undefined ? null : (
              <button type="button" className="m4a-settings__button" disabled={modelDirectory.trim() === '' || modelDownload.stage === 'downloading'} onClick={() => { void downloadRecommendation(recommendation('embedding')!) }}>
                {t('downloadEmbedding')} ({formatBytes(recommendation('embedding')!.totalBytes)})
              </button>
            )}
          </div>
          {embeddingEnabled ? (
            <div className="m4a-overlay__setup-grid">
              <div className="m4a-settings__field m4a-settings__field--wide">
                <div className="m4a-overlay__path-row">
                  <input className="m4a-settings__input" value={embeddingPath} disabled={busy} spellCheck={false} placeholder="D:\\Models\\embedding.gguf" onChange={event => { setEmbeddingPath(event.target.value) }} />
                  {nativeFilePicker ? <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { void chooseModelFile('embedding') }}>{t('chooseFile')}</button> : null}
                  <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { void chooseModelDirectory('embedding') }}>{t('chooseDirectory')}</button>
                </div>
              </div>
              <label className="m4a-settings__field">
                <span className="m4a-settings__label">{t('embeddingIdleTimeout')}</span>
                <input className="m4a-settings__input" inputMode="numeric" value={embeddingIdleTimeout} disabled={busy} onChange={event => { setEmbeddingIdleTimeout(event.target.value) }} />
              </label>
            </div>
          ) : null}
        </section>
        <section className="m4a-overlay__section">
          <h3>{t('runtimeSettings')}</h3>
          <div className="m4a-overlay__setup-grid">
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
            <span className="m4a-settings__label">{t('maxTokens')}</span>
            <input className={`m4a-settings__input${maxTokensValid || setupMaxTokens === '' ? '' : ' m4a-settings__input--invalid'}`} value={setupMaxTokens} disabled={busy} placeholder="100k" onChange={event => { setSetupMaxTokens(event.target.value) }} />
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
          <div className="m4a-overlay__optional-model m4a-overlay__mtp">
            <label className="m4a-settings__check">
              <input type="checkbox" checked={setupMtp} disabled={busy} onChange={event => { setSetupMtp(event.target.checked) }} />
              <span>{t('enableMtp')}</span>
            </label>
            {recommendation('mtp') === undefined ? null : (
              <button type="button" className="m4a-settings__button" disabled={modelDirectory.trim() === '' || modelDownload.stage === 'downloading'} onClick={() => { void downloadRecommendation(recommendation('mtp')!) }}>
                {t('downloadMtp')} ({formatBytes(recommendation('mtp')!.totalBytes)})
              </button>
            )}
          </div>
          {setupMtp ? (
            <div className="m4a-overlay__path-row">
              <input className="m4a-settings__input" value={mtpPath} disabled={busy} spellCheck={false} placeholder="D:\\Models\\mtp.gguf" onChange={event => { setMtpPath(event.target.value) }} />
              {nativeFilePicker ? <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { void chooseModelFile('mtp') }}>{t('chooseFile')}</button> : null}
              <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { void chooseModelDirectory('mtp') }}>{t('chooseDirectory')}</button>
            </div>
          ) : null}
          {activeDownloadModel === undefined || activeDownloadModel.kind === 'main' || modelDownload.stage === 'idle' ? null : (
            <div className="m4a-overlay__progress">
              <progress max={100} value={modelDownload.percent} />
              <span>
                {activeDownloadModel.name}: {modelDownload.stage === 'complete' ? t('modelDownloadComplete') : t('modelDownloadProgress')}
                {' '}{formatBytes(modelDownload.downloadedBytes)} / {formatBytes(modelDownload.totalBytes ?? activeDownloadModel.totalBytes)}
              </span>
            </div>
          )}
          <label className="m4a-settings__check m4a-overlay__mtp">
            <input type="checkbox" checked={setupAutoStart} disabled={busy} onChange={event => { setSetupAutoStart(event.target.checked) }} />
            <span>{t('enableAutoStart')}</span>
          </label>
        </section>
        <section className="m4a-overlay__section">
          <div className="m4a-overlay__section-heading">
            <label className="m4a-settings__check">
              <input type="checkbox" checked={sessionCacheEnabled} disabled={busy} onChange={event => { setSessionCacheEnabled(event.target.checked) }} />
              <span>{t('enableSessionCache')}</span>
            </label>
            <button type="button" className="m4a-overlay__help" title={t('sessionCacheHelp')} aria-label={t('sessionCacheHelp')}>?</button>
          </div>
          {sessionCacheEnabled ? (
            <div className="m4a-overlay__setup-grid">
              <label className="m4a-settings__field m4a-settings__field--wide">
                <span className="m4a-settings__label">{t('sessionCachePath')}</span>
                <input className="m4a-settings__input" value={sessionCachePath} disabled={busy} spellCheck={false} onChange={event => { setSessionCachePath(event.target.value) }} />
                <span className="m4a-settings__hint">{t('sessionCachePathHint')}</span>
              </label>
              <label className="m4a-settings__field">
                <span className="m4a-settings__label">{t('sessionCacheMax')}</span>
                <input className="m4a-settings__input" value={sessionCacheMax} disabled={busy} placeholder="10g" onChange={event => { setSessionCacheMax(event.target.value) }} />
              </label>
              <label className="m4a-settings__field">
                <span className="m4a-settings__label">{t('sessionCacheIdle')}</span>
                <input className="m4a-settings__input" inputMode="numeric" value={sessionCacheIdle} disabled={busy} onChange={event => { setSessionCacheIdle(event.target.value) }} />
              </label>
              <label className="m4a-settings__field">
                <span className="m4a-settings__label">{t('sessionCacheTtl')}</span>
                <input className="m4a-settings__input" inputMode="numeric" value={sessionCacheTtl} disabled={busy} onChange={event => { setSessionCacheTtl(event.target.value) }} />
              </label>
            </div>
          ) : null}
        </section>
        {error === '' ? null : <p className="m4a-overlay__error">{error}</p>}
        <div className="m4a-overlay__actions">
          <button type="button" className="m4a-settings__button" disabled={busy} onClick={() => { setDismissed(true) }}>{t('notNow')}</button>
          <button type="button" className="m4a-settings__button m4a-settings__button--primary" disabled={busy || modelPath.trim() === '' || !contextValid || !maxTokensValid} onClick={() => { void saveSetupAndStart() }}>
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
