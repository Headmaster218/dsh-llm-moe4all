import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

import type { Config } from '../index.js'
import type { EngineReleaseStatus, InstalledEngine } from '../engine-release.js'
import type { EngineControlStatus } from '../host-routes.js'
import type { LocalModelEntry, LocalModelLibrary, ModelFileKind } from '../model-files.js'
import type { ModelDownloadProgress, RecommendedModel } from '../model-download.js'
import {
  cancelEngineInstall, cancelModelDownload, deleteEngineVersion, fetchEngineStatus,
  fetchModelCatalog, fetchModelDownload, fetchReleaseStatus, installLatestEngine,
  pickModelFile, scanModelLibrary, startEngine, startModelDownload, validateModelPaths,
} from './engine-api.js'
import {
  buildEngineArguments, parseEngineArguments, type ParsedEngineArguments,
} from './engine-setup.js'
import type { Moe4AllLocaleKey } from './locales.js'
import { formatTokenValue, parseTokenValue } from './token-value.js'

type ResolvedConfig = { [K in keyof Config]-?: Exclude<Config[K], undefined> }
type Translate = (key: Moe4AllLocaleKey) => string

export interface Moe4AllSettingsInjected {
  hooks: {
    moe4AllSettings: SettingsScope<Config>
  }
  pickDirectory(): Promise<string | null>
  save(next: Config): Promise<void>
}

export type Moe4AllSettingsProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'settings.moe4all'>
  & InjectFace<Moe4AllSettingsInjected>

interface FieldProps {
  label: string
  wide?: boolean
  hint?: string
  children: ReactNode
}

interface CheckProps {
  checked: boolean
  disabled: boolean
  label: string
  onChange(value: boolean): void
}

interface LibraryRow {
  key: string
  family: string
  kind: ModelFileKind
  name: string
  quantization: string
  sizeBytes: number
  fileCount: number
  path?: string
  recommendation?: RecommendedModel
}

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function resolved(value: Config): ResolvedConfig {
  const mode = value.mode === 'managed' ? 'prompt' : value.mode
  return { ...value, mode } as ResolvedConfig
}

function Field({ label, wide = false, hint, children }: FieldProps): ReactNode {
  return (
    <label className={`m4a-settings__field${wide ? ' m4a-settings__field--wide' : ''}`}>
      <span className="m4a-settings__label">{label}</span>
      {children}
      {hint === undefined ? null : <span className="m4a-settings__hint">{hint}</span>}
    </label>
  )
}

function Check({ checked, disabled, label, onChange }: CheckProps): ReactNode {
  return (
    <label className="m4a-settings__check">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={event => { onChange(event.target.checked) }} />
      <span>{label}</span>
    </label>
  )
}

function TokenInput({ value, disabled, onChange }: {
  value: number
  disabled: boolean
  onChange(value: number): void
}): ReactNode {
  const [text, setText] = useState(formatTokenValue(value))
  const valid = parseTokenValue(text) !== undefined
  useEffect(() => { setText(formatTokenValue(value)) }, [value])
  return (
    <input
      className={`m4a-settings__input${valid || text === '' ? '' : ' m4a-settings__input--invalid'}`}
      type="text"
      inputMode="decimal"
      value={text}
      disabled={disabled}
      placeholder="160k"
      onChange={event => {
        const next = event.target.value
        setText(next)
        const parsed = parseTokenValue(next)
        if (parsed !== undefined) onChange(parsed)
      }}
      onBlur={() => {
        const parsed = parseTokenValue(text)
        setText(parsed === undefined ? formatTokenValue(value) : text.trim().toLowerCase())
      }}
    />
  )
}

function statusClass(status: EngineControlStatus | null): string {
  if (status?.ready === true) return 'ready'
  if (status?.phase === 'starting' || status?.phase === 'checking') return 'busy'
  if (status?.phase === 'resource-warning') return 'warning'
  if (status?.phase === 'error' || status?.phase === 'duplicate-process') return 'error'
  return 'offline'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GiB`
}

function fileName(path: string): string {
  return path.split(/[\\/]/u).at(-1) ?? path
}

function samePath(left: string, right: string): boolean {
  return left.replaceAll('/', '\\').toLowerCase() === right.replaceAll('/', '\\').toLowerCase()
}

function activeEngineInstall(release: EngineReleaseStatus | null): boolean {
  return release !== null && ['checking', 'downloading', 'verifying', 'extracting', 'finalizing'].includes(release.install.stage)
}

function activeModelDownload(download: ModelDownloadProgress): boolean {
  return download.stage === 'downloading'
}

function recommendationFor(model: LocalModelEntry, recommendations: RecommendedModel[]): RecommendedModel | undefined {
  return recommendations.find(item => (
    item.kind === model.kind
    && item.family === model.family
    && (item.files.some(file => file.name.toLowerCase() === fileName(model.path).toLowerCase()) || item.totalBytes === model.sizeBytes)
  ))
}

function libraryRows(models: LocalModelEntry[], recommendations: RecommendedModel[]): LibraryRow[] {
  const installedRecommendations = new Set<string>()
  const rows = models.map((model): LibraryRow => {
    const recommendation = recommendationFor(model, recommendations)
    if (recommendation !== undefined) installedRecommendations.add(recommendation.id)
    return {
      key: `local:${model.id}`,
      family: model.family,
      kind: model.kind,
      name: recommendation?.name ?? model.name,
      quantization: model.quantization,
      sizeBytes: model.sizeBytes,
      fileCount: model.fileCount,
      path: model.path,
      ...(recommendation === undefined ? {} : { recommendation }),
    }
  })
  for (const recommendation of recommendations) {
    if (installedRecommendations.has(recommendation.id)) continue
    rows.push({
      key: `recommended:${recommendation.id}`,
      family: recommendation.family,
      kind: recommendation.kind,
      name: recommendation.name,
      quantization: recommendation.quantization,
      sizeBytes: recommendation.totalBytes,
      fileCount: recommendation.files.length,
      recommendation,
    })
  }
  const rank: Record<ModelFileKind, number> = { main: 0, vision: 1, mtp: 2, embedding: 3 }
  const familyRank = new Map<string, number>()
  for (const recommendation of recommendations) {
    if (!familyRank.has(recommendation.family)) familyRank.set(recommendation.family, familyRank.size)
  }
  return rows.sort((left, right) => (
    (familyRank.get(left.family) ?? Number.MAX_SAFE_INTEGER) - (familyRank.get(right.family) ?? Number.MAX_SAFE_INTEGER)
    || left.family.localeCompare(right.family, undefined, { numeric: true, sensitivity: 'base' })
    || rank[left.kind] - rank[right.kind]
    || left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' })
  ))
}

function pathForKind(setup: ParsedEngineArguments, kind: ModelFileKind): string {
  if (kind === 'main') return setup.model
  if (kind === 'vision') return setup.visionModel
  if (kind === 'embedding') return setup.embeddingModel
  return setup.mtpModel
}

function ModelSelection({ kind, path, disabled, t, onChoose, onClear }: {
  kind: ModelFileKind
  path: string
  disabled: boolean
  t: Translate
  onChoose(): void
  onClear(): void
}): ReactNode {
  const label = kind === 'main' ? t('mainModel')
    : kind === 'vision' ? t('visionModel')
      : kind === 'embedding' ? t('embeddingModel') : t('mtpModel')
  return (
    <div className="m4a-current-model">
      <div className="m4a-current-model__body">
        <span className="m4a-settings__label">{label}</span>
        <strong>{path === '' ? t('notSelected') : fileName(path)}</strong>
        {path === '' ? null : <code title={path}>{path}</code>}
      </div>
      <div className="m4a-current-model__actions">
        <button type="button" className="m4a-settings__button" disabled={disabled} onClick={onChoose}>{t('chooseFile')}</button>
        {kind === 'main' || path === '' ? null : (
          <button type="button" className="m4a-settings__button" disabled={disabled} onClick={onClear}>{t('removeSelection')}</button>
        )}
      </div>
    </div>
  )
}

export function Moe4AllSettings(props: Moe4AllSettingsProps): ReactNode {
  const { t, useMoe4AllSettings, save, pickDirectory } = props
  const snapshot = useMoe4AllSettings(value => value)
  const initial = snapshot.value === undefined ? null : resolved(snapshot.value)
  const [draft, setDraft] = useState<ResolvedConfig | null>(initial)
  const [setup, setSetup] = useState<ParsedEngineArguments>(() => parseEngineArguments(initial?.arguments ?? []))
  const [saving, setSaving] = useState(false)
  const [acting, setActing] = useState(false)
  const [status, setStatus] = useState<EngineControlStatus | null>(null)
  const [release, setRelease] = useState<EngineReleaseStatus | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendedModel[]>([])
  const [library, setLibrary] = useState<LocalModelLibrary>({ directory: '', models: [] })
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [modelDownload, setModelDownload] = useState<ModelDownloadProgress>({ stage: 'idle', downloadedBytes: 0 })
  const [nativeFilePicker, setNativeFilePicker] = useState(false)
  const [engineInstalling, setEngineInstalling] = useState(false)
  const [modelDownloading, setModelDownloading] = useState(false)
  const [error, setError] = useState('')
  const [confirmBusy, setConfirmBusy] = useState(false)

  useEffect(() => {
    if (!saving && snapshot.value !== undefined) {
      const next = resolved(snapshot.value)
      setDraft(next)
      setSetup(parseEngineArguments(next.arguments))
    }
  }, [saving, snapshot.revision, snapshot.value])

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
    return () => { disposed = true; window.clearInterval(timer) }
  }, [])

  useEffect(() => {
    let disposed = false
    void fetchReleaseStatus().then(next => { if (!disposed) setRelease(next) }).catch(cause => {
      if (!disposed) setError(cause instanceof Error ? cause.message : String(cause))
    })
    void fetchModelCatalog().then(next => {
      if (disposed) return
      setRecommendations(next.models)
      setModelDownload(next.download)
      setNativeFilePicker(next.capabilities.nativeFilePicker)
    }).catch(cause => {
      if (!disposed) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { disposed = true }
  }, [])

  const selectedPaths = useMemo(() => [setup.model, setup.visionModel, setup.embeddingModel, setup.mtpModel].filter(Boolean), [setup])
  const refreshLibrary = useCallback(async (directory = draft?.modelDirectory ?? '', paths = selectedPaths): Promise<void> => {
    setLibraryLoading(true)
    try {
      setLibrary(await scanModelLibrary(directory, paths))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setLibraryLoading(false)
    }
  }, [draft?.modelDirectory, selectedPaths])

  useEffect(() => { void refreshLibrary() }, [snapshot.revision])

  const current = snapshot.value === undefined ? null : resolved(snapshot.value)
  const currentSetup = current === null ? null : parseEngineArguments(current.arguments)
  const dirty = draft !== null && current !== null && (!same(draft, current) || !same(setup, currentSetup))
  const rows = useMemo(() => libraryRows(library.models, recommendations), [library.models, recommendations])
  const groupedRows = useMemo(() => {
    const result = new Map<string, LibraryRow[]>()
    for (const row of rows) result.set(row.family, [...(result.get(row.family) ?? []), row])
    return [...result.entries()]
  }, [rows])

  if (snapshot.status === 'loading' || draft === null) return <p className="m4a-settings__message">{t('loading')}</p>
  if (snapshot.status === 'unavailable') return <p className="m4a-settings__message">{t('unavailable')}</p>

  const disabled = saving || acting || !snapshot.writable
  const setField = <K extends keyof ResolvedConfig>(field: K, value: ResolvedConfig[K]): void => {
    setDraft(previous => previous === null ? previous : { ...previous, [field]: value })
  }
  const numberField = (field: keyof ResolvedConfig, value: string): void => {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) setField(field, parsed as never)
  }
  const setSetupField = <K extends keyof ParsedEngineArguments>(field: K, value: ParsedEngineArguments[K]): void => {
    setSetup(previous => ({ ...previous, [field]: value }))
  }

  const persist = async (next: ResolvedConfig): Promise<void> => {
    setSaving(true)
    setError('')
    try {
      await save(next)
    } finally {
      setSaving(false)
    }
  }

  const composed = async (): Promise<ResolvedConfig> => {
    if (draft.mode === 'connect') return draft
    const paths = await validateModelPaths({
      main: setup.model,
      ...(setup.visionModel === '' ? {} : { vision: setup.visionModel }),
      ...(setup.embeddingModel === '' ? {} : { embedding: setup.embeddingModel }),
      ...(setup.mtp && setup.mtpModel !== '' ? { mtp: setup.mtpModel } : {}),
    })
    const arguments_ = buildEngineArguments({
      model: paths.main,
      ...(paths.vision === undefined ? {} : { visionModel: paths.vision }),
      ...(paths.embedding === undefined ? {} : { embeddingModel: paths.embedding, embeddingIdleTimeout: setup.embeddingIdleTimeout }),
      ...(paths.mtp === undefined ? {} : { mtpModel: paths.mtp }),
      host: draft.host,
      port: draft.port,
      contextWindow: draft.contextWindow,
      maxTokens: draft.maxTokens,
      parallel: setup.parallel,
      profile: setup.profile,
      mtp: setup.mtp,
      ...(setup.sessionCacheEnabled ? { sessionCache: setup.sessionCache } : {}),
    })
    return { ...draft, arguments: arguments_, vision: paths.vision !== undefined }
  }

  const submit = async (): Promise<void> => {
    setError('')
    try {
      const next = await composed()
      setDraft(next)
      await persist(next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const launch = async (force = false): Promise<void> => {
    setActing(true)
    setError('')
    try {
      if (dirty) {
        const next = await composed()
        setDraft(next)
        await persist(next)
        await new Promise(resolve => window.setTimeout(resolve, 700))
      }
      const result = await startEngine(force)
      setStatus(result.status)
      setConfirmBusy(result.status.phase === 'resource-warning')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setActing(false)
    }
  }

  const monitorEngineInstall = async (): Promise<void> => {
    while (true) {
      await new Promise(resolve => window.setTimeout(resolve, 500))
      const next = await fetchReleaseStatus()
      setRelease(next)
      if (activeEngineInstall(next)) continue
      if (next.install.stage === 'error') throw new Error(next.install.error ?? t('downloadFailed'))
      if (next.install.stage === 'cancelled') return
      if (next.install.stage === 'complete' && next.installed !== undefined) {
        const updated = { ...draft, executable: next.installed.executable, workingDirectory: next.installed.workingDirectory }
        setDraft(updated)
        await persist(updated)
      }
      return
    }
  }

  const installEngine = async (): Promise<void> => {
    setEngineInstalling(true)
    setError('')
    try {
      await installLatestEngine()
      await monitorEngineInstall()
      setRelease(await fetchReleaseStatus(true))
      setStatus(await fetchEngineStatus())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      try { setRelease(await fetchReleaseStatus()) } catch {}
    } finally {
      setEngineInstalling(false)
    }
  }

  const stopEngineInstall = async (): Promise<void> => {
    try {
      const install = await cancelEngineInstall()
      setRelease(previous => previous === null ? previous : { ...previous, install })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const removeEngine = async (): Promise<void> => {
    const selected = release?.versions.find(item => samePath(item.executable, draft.executable))
    if (selected === undefined) return
    if (!window.confirm(t('confirmDeleteEngine'))) return
    setActing(true)
    setError('')
    try {
      await deleteEngineVersion(selected.tag)
      const nextRelease = await fetchReleaseStatus(true)
      setRelease(nextRelease)
      const persistedExecutable = current?.executable ?? ''
      const fallback = nextRelease.versions.find(item => samePath(item.executable, persistedExecutable))
        ?? nextRelease.versions[0]
      setDraft(previous => previous === null ? previous : {
        ...previous,
        executable: fallback?.executable ?? '',
        workingDirectory: fallback?.workingDirectory ?? '',
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setActing(false)
    }
  }

  const selectEngine = (executable: string): void => {
    const version = release?.versions.find(item => samePath(item.executable, executable))
    setDraft(previous => previous === null ? previous : {
      ...previous,
      executable,
      workingDirectory: version?.workingDirectory ?? previous.workingDirectory,
    })
  }

  const chooseLibraryDirectory = async (): Promise<void> => {
    const directory = await pickDirectory()
    if (directory === null) return
    setField('modelDirectory', directory)
    await refreshLibrary(directory)
  }

  const chooseModelFile = async (kind: ModelFileKind): Promise<void> => {
    try {
      const path = await pickModelFile()
      if (path === undefined) return
      if (kind === 'main') setSetupField('model', path)
      else if (kind === 'vision') setSetupField('visionModel', path)
      else if (kind === 'embedding') setSetupField('embeddingModel', path)
      else setSetup(previous => ({ ...previous, mtpModel: path, mtp: true }))
      await refreshLibrary(draft.modelDirectory, [...selectedPaths, path])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const useModel = (row: LibraryRow): void => {
    if (row.path === undefined) return
    if (row.kind === 'main') {
      const related = rows.filter(item => item.path !== undefined && item.family === row.family)
      setSetup(previous => ({
        ...previous,
        model: row.path!,
        visionModel: previous.visionModel || related.find(item => item.kind === 'vision')?.path || '',
        mtpModel: previous.mtpModel || related.find(item => item.kind === 'mtp')?.path || '',
      }))
    } else if (row.kind === 'vision') setSetupField('visionModel', row.path)
    else if (row.kind === 'embedding') setSetupField('embeddingModel', row.path)
    else setSetup(previous => ({ ...previous, mtpModel: row.path!, mtp: true }))
  }

  const monitorModelDownload = async (): Promise<void> => {
    while (true) {
      await new Promise(resolve => window.setTimeout(resolve, 500))
      const next = await fetchModelDownload()
      setModelDownload(next)
      if (activeModelDownload(next)) continue
      if (next.stage === 'error') throw new Error(next.error ?? t('downloadFailed'))
      if (next.stage === 'complete') await refreshLibrary()
      return
    }
  }

  const downloadModel = async (model: RecommendedModel): Promise<void> => {
    if (draft.modelDirectory.trim() === '') {
      setError(t('modelDirectoryRequired'))
      return
    }
    setModelDownloading(true)
    setError('')
    try {
      setModelDownload(await startModelDownload(model.id, draft.modelDirectory))
      await monitorModelDownload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setModelDownloading(false)
    }
  }

  const stopModelDownload = async (): Promise<void> => {
    try {
      setModelDownload(await cancelModelDownload())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const endpoint = draft.endpoint.trim() !== ''
    ? draft.endpoint.trim()
    : `${draft.protocol}://${draft.host}:${draft.port}${draft.apiBasePath.startsWith('/') ? draft.apiBasePath : `/${draft.apiBasePath}`}`
  const selectedVersion = release?.versions.find(item => samePath(item.executable, draft.executable))
  const releaseAction = release?.install.stage === 'error' || release?.install.stage === 'cancelled'
    ? t('retryDownload')
    : release?.updateAvailable === true ? t('updateNow') : t('installLatest')
  const downloadRecommendation = recommendations.find(item => item.id === modelDownload.modelId)

  return (
    <div className="m4a-settings">
      <header className="m4a-settings__header">
        <h2 className="m4a-settings__title">{t('title')}</h2>
        <div className="m4a-settings__status">
          <span className={`m4a-settings__dot m4a-settings__dot--${statusClass(status)}`} />
          <span>{status?.message ?? t('checkingEngine')}</span>
          <code className="m4a-settings__endpoint" title={endpoint}>{endpoint}</code>
        </div>
        {error === '' ? null : <p className="m4a-settings__error">{error}</p>}
      </header>

      <section className="m4a-settings__engine-bar">
        <div className="m4a-settings__engine-version">
          <span className="m4a-settings__label">{t('engineVersion')}</span>
          <select className="m4a-settings__select" value={draft.executable} disabled={disabled || engineInstalling} onChange={event => { selectEngine(event.target.value) }}>
            <option value="">{t('engineNotInstalled')}</option>
            {(release?.versions ?? []).map(version => <option key={`${version.tag}:${version.executable}`} value={version.executable}>{version.name}</option>)}
          </select>
        </div>
        <div className="m4a-settings__runtime-actions">
          <button type="button" className="m4a-settings__button m4a-settings__button--primary" disabled={disabled || status?.ready === true || status?.phase === 'starting'} onClick={() => { void launch(false) }}>
            {acting ? t('working') : dirty ? t('saveAndStart') : t('startNow')}
          </button>
          <button type="button" className="m4a-settings__button" disabled={disabled || engineInstalling} onClick={() => { void installEngine() }}>{releaseAction}</button>
          <button type="button" className="m4a-settings__button" disabled={disabled || engineInstalling} onClick={() => {
            setActing(true)
            void fetchReleaseStatus(true).then(setRelease).catch(cause => { setError(cause instanceof Error ? cause.message : String(cause)) }).finally(() => { setActing(false) })
          }}>{t('checkUpdates')}</button>
          <button type="button" className="m4a-settings__button m4a-settings__button--danger" disabled={disabled || selectedVersion === undefined || status?.ready === true || engineInstalling} onClick={() => { void removeEngine() }}>{t('deleteEngine')}</button>
        </div>
        {release === null || (!activeEngineInstall(release) && release.install.stage === 'idle') ? null : (
          <div className="m4a-download-status">
            <progress max={100} value={release.install.percent} />
            <span>{release.install.message ?? release.install.error ?? release.install.stage}</span>
            {release.install.totalBytes === undefined ? null : <span>{formatBytes(release.install.downloadedBytes)} / {formatBytes(release.install.totalBytes)}</span>}
            {activeEngineInstall(release) ? <button type="button" className="m4a-settings__button" onClick={() => { void stopEngineInstall() }}>{t('stopDownload')}</button> : null}
          </div>
        )}
      </section>

      <div className="m4a-model-workbench">
        <section className="m4a-model-config">
          <div className="m4a-pane-heading">
            <div>
              <h3>{t('currentConfiguration')}</h3>
              <p>{t('currentConfigurationHint')}</p>
            </div>
          </div>

          <div className="m4a-settings__segmented" role="group" aria-label={t('mode')}>
            {(['connect', 'prompt', 'auto'] as const).map(mode => (
              <button key={mode} type="button" className="m4a-settings__segment" aria-pressed={draft.mode === mode} disabled={disabled} onClick={() => { setField('mode', mode) }}>{t(mode)}</button>
            ))}
          </div>

          {draft.mode === 'connect' ? (
            <p className="m4a-settings__hint">{t('connectHint')}</p>
          ) : (
            <>
              <ModelSelection kind="main" path={setup.model} disabled={disabled} t={t} onChoose={() => { void chooseModelFile('main') }} onClear={() => {}} />
              <ModelSelection kind="vision" path={setup.visionModel} disabled={disabled} t={t} onChoose={() => { void chooseModelFile('vision') }} onClear={() => { setSetupField('visionModel', '') }} />
              <ModelSelection kind="mtp" path={setup.mtpModel} disabled={disabled} t={t} onChoose={() => { void chooseModelFile('mtp') }} onClear={() => { setSetup(previous => ({ ...previous, mtpModel: '', mtp: false })) }} />
              <ModelSelection kind="embedding" path={setup.embeddingModel} disabled={disabled} t={t} onChoose={() => { void chooseModelFile('embedding') }} onClear={() => { setSetupField('embeddingModel', '') }} />

              {setup.embeddingModel === '' ? null : (
                <Field label={t('embeddingIdleTimeout')}>
                  <input className="m4a-settings__input" type="number" min={0} value={setup.embeddingIdleTimeout} disabled={disabled} onChange={event => { setSetupField('embeddingIdleTimeout', Number(event.target.value) || 0) }} />
                </Field>
              )}

              <div className="m4a-settings__grid m4a-settings__grid--compact">
                <Field label={t('contextWindow')} hint={t('tokenUnitHint')}>
                  <TokenInput value={draft.contextWindow} disabled={disabled} onChange={value => { setField('contextWindow', value) }} />
                </Field>
                <Field label={t('maxTokens')} hint={t('tokenUnitHint')}>
                  <TokenInput value={draft.maxTokens} disabled={disabled} onChange={value => { setField('maxTokens', value) }} />
                </Field>
                <Field label={t('parallelSlots')}>
                  <input className="m4a-settings__input" type="number" min={1} value={setup.parallel} disabled={disabled} onChange={event => { setSetupField('parallel', Math.max(1, Number(event.target.value) || 1)) }} />
                </Field>
                <Field label={t('automaticProfile')}>
                  <select className="m4a-settings__select" value={setup.profile} disabled={disabled} onChange={event => { setSetupField('profile', event.target.value as ParsedEngineArguments['profile']) }}>
                    <option value="conservative">{t('conservativeProfile')}</option>
                    <option value="aggressive">{t('aggressiveProfile')}</option>
                  </select>
                </Field>
              </div>
              <Check checked={setup.mtp} disabled={disabled || setup.mtpModel === ''} label={t('enableMtp')} onChange={value => { setSetupField('mtp', value) }} />
              <Check checked={setup.sessionCacheEnabled} disabled={disabled} label={t('enableSessionCache')} onChange={value => { setSetupField('sessionCacheEnabled', value) }} />
              {setup.sessionCacheEnabled ? (
                <div className="m4a-settings__grid m4a-settings__grid--compact">
                  <Field label={t('sessionCachePath')} wide>
                    <input className="m4a-settings__input" value={setup.sessionCache.directory} disabled={disabled} onChange={event => { setSetupField('sessionCache', { ...setup.sessionCache, directory: event.target.value }) }} />
                  </Field>
                  <Field label={t('sessionCacheMax')}>
                    <input className="m4a-settings__input" value={setup.sessionCache.maxSize} disabled={disabled} onChange={event => { setSetupField('sessionCache', { ...setup.sessionCache, maxSize: event.target.value }) }} />
                  </Field>
                  <Field label={t('sessionCacheIdle')}>
                    <input className="m4a-settings__input" type="number" min={0} value={setup.sessionCache.idleSeconds} disabled={disabled} onChange={event => { setSetupField('sessionCache', { ...setup.sessionCache, idleSeconds: Number(event.target.value) || 0 }) }} />
                  </Field>
                  <Field label={t('sessionCacheTtl')}>
                    <input className="m4a-settings__input" type="number" min={0} value={setup.sessionCache.ttlHours} disabled={disabled} onChange={event => { setSetupField('sessionCache', { ...setup.sessionCache, ttlHours: Number(event.target.value) || 0 }) }} />
                  </Field>
                </div>
              ) : null}
            </>
          )}
        </section>

        <aside className="m4a-model-library">
          <div className="m4a-pane-heading">
            <div>
              <h3>{t('modelLibrary')}</h3>
              <p>{t('modelLibraryHint')}</p>
            </div>
            <button type="button" className="m4a-settings__button" disabled={disabled || libraryLoading} onClick={() => { void refreshLibrary() }}>{libraryLoading ? t('scanning') : t('rescan')}</button>
          </div>
          <div className="m4a-library-directory">
            <input className="m4a-settings__input" value={draft.modelDirectory} disabled={disabled || modelDownloading} placeholder="D:\\Models" onChange={event => { setField('modelDirectory', event.target.value) }} />
            <button type="button" className="m4a-settings__button" disabled={disabled || modelDownloading} onClick={() => { void chooseLibraryDirectory() }}>{t('chooseDirectory')}</button>
          </div>
          {groupedRows.length === 0 ? <p className="m4a-settings__message">{t('noModelsInLibrary')}</p> : groupedRows.map(([family, familyRows]) => (
            <section className="m4a-model-family" key={family}>
              <h4>{family}</h4>
              <div className="m4a-model-family__items">
                {familyRows.map(row => {
                  const selected = row.path !== undefined && samePath(pathForKind(setup, row.kind), row.path)
                  const downloading = row.recommendation?.id === modelDownload.modelId && activeModelDownload(modelDownload)
                  const retry = row.recommendation?.id === modelDownload.modelId && (modelDownload.stage === 'error' || modelDownload.stage === 'cancelled')
                  return (
                    <article className={`m4a-model-item${selected ? ' m4a-model-item--selected' : ''}`} key={row.key}>
                      <div className="m4a-model-item__topline">
                        <span className={`m4a-model-item__kind m4a-model-item__kind--${row.kind}`}>{t(row.kind === 'main' ? 'mainModel' : row.kind === 'vision' ? 'visionModel' : row.kind === 'mtp' ? 'mtpModel' : 'embeddingModel')}</span>
                        {row.recommendation === undefined ? null : <span className="m4a-model-item__recommended">{t('recommended')}</span>}
                        {row.path === undefined ? <span className="m4a-model-item__remote">{t('notDownloaded')}</span> : null}
                      </div>
                      <strong>{row.name}</strong>
                      <div className="m4a-model-item__meta">
                        <span>{row.quantization}</span>
                        <span>{formatBytes(row.sizeBytes)}</span>
                        {row.fileCount <= 1 ? null : <span>{row.fileCount} {t('files')}</span>}
                      </div>
                      {row.path === undefined ? null : <code title={row.path}>{row.path}</code>}
                      {downloading ? (
                        <div className="m4a-model-item__download">
                          <progress max={100} value={modelDownload.percent} />
                          <span>{formatBytes(modelDownload.downloadedBytes)} / {formatBytes(modelDownload.totalBytes ?? row.sizeBytes)}</span>
                          <button type="button" className="m4a-settings__button" onClick={() => { void stopModelDownload() }}>{t('stopDownload')}</button>
                        </div>
                      ) : (
                        <div className="m4a-model-item__actions">
                          {row.path === undefined ? (
                            <button type="button" className="m4a-settings__button m4a-settings__button--primary" disabled={disabled || modelDownloading || draft.modelDirectory.trim() === ''} onClick={() => { if (row.recommendation !== undefined) void downloadModel(row.recommendation) }}>
                              {retry ? t('retryDownload') : t('downloadRecommended')}
                            </button>
                          ) : (
                            <button type="button" className="m4a-settings__button" disabled={disabled || selected} onClick={() => { useModel(row) }}>{selected ? t('selected') : t('useModel')}</button>
                          )}
                          {row.recommendation === undefined ? null : <a href={row.recommendation.sourceUrl} target="_blank" rel="noreferrer">{t('sourcePage')}</a>}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
          {downloadRecommendation === undefined || modelDownload.stage === 'idle' || activeModelDownload(modelDownload) ? null : (
            <p className={modelDownload.stage === 'error' ? 'm4a-settings__error' : 'm4a-settings__hint'}>
              {downloadRecommendation.name}: {modelDownload.error ?? modelDownload.stage}
            </p>
          )}
        </aside>
      </div>

      <details className="m4a-settings__details" open={draft.mode === 'connect'}>
        <summary>{t('connection')}</summary>
        <div className="m4a-settings__grid">
          <Field label={t('protocol')}>
            <select className="m4a-settings__select" value={draft.protocol} disabled={disabled} onChange={event => { setField('protocol', event.target.value as 'http' | 'https') }}><option value="http">HTTP</option><option value="https">HTTPS</option></select>
          </Field>
          <Field label={t('host')}><input className="m4a-settings__input" value={draft.host} disabled={disabled} onChange={event => { setField('host', event.target.value) }} /></Field>
          <Field label={t('port')}><input className="m4a-settings__input" type="number" min={1} max={65535} value={draft.port} disabled={disabled} onChange={event => { numberField('port', event.target.value) }} /></Field>
          <Field label={t('apiBasePath')}><input className="m4a-settings__input" value={draft.apiBasePath} disabled={disabled} onChange={event => { setField('apiBasePath', event.target.value) }} /></Field>
          <Field label={t('endpoint')} hint={t('endpointHint')} wide><input className="m4a-settings__input" value={draft.endpoint} disabled={disabled} placeholder="http://127.0.0.1:8080/v1" onChange={event => { setField('endpoint', event.target.value) }} /></Field>
          <Field label={t('apiKeyEnv')} wide><input className="m4a-settings__input" value={draft.apiKeyEnv} disabled={disabled} placeholder="MOE4ALL_API_KEY" onChange={event => { setField('apiKeyEnv', event.target.value) }} /></Field>
        </div>
        <Check checked={draft.allowRemoteEndpoint} disabled={disabled} label={t('allowRemoteEndpoint')} onChange={value => { setField('allowRemoteEndpoint', value) }} />
      </details>

      <details className="m4a-settings__details">
        <summary>{t('advanced')}</summary>
        <div className="m4a-settings__grid">
          <Field label={t('executable')} wide><input className="m4a-settings__input" value={draft.executable} disabled={disabled} onChange={event => { setField('executable', event.target.value) }} /></Field>
          <Field label={t('workingDirectory')} wide><input className="m4a-settings__input" value={draft.workingDirectory} disabled={disabled} onChange={event => { setField('workingDirectory', event.target.value) }} /></Field>
          <Field label={t('minimumFreeRam')}><div className="m4a-settings__percentage"><input type="range" min={0} max={1} step={0.05} value={draft.minimumFreeRamFraction} disabled={disabled} onChange={event => { numberField('minimumFreeRamFraction', event.target.value) }} /><output>{Math.round(draft.minimumFreeRamFraction * 100)}%</output></div></Field>
          <Field label={t('minimumFreeVram')}><div className="m4a-settings__percentage"><input type="range" min={0} max={1} step={0.05} value={draft.minimumFreeVramFraction} disabled={disabled} onChange={event => { numberField('minimumFreeVramFraction', event.target.value) }} /><output>{Math.round(draft.minimumFreeVramFraction * 100)}%</output></div></Field>
        </div>
        <Check checked={draft.stopOnUnload} disabled={disabled} label={t('stopOnUnload')} onChange={value => { setField('stopOnUnload', value) }} />
        <Check checked={draft.logOutput} disabled={disabled} label={t('logOutput')} onChange={value => { setField('logOutput', value) }} />
      </details>

      <div className="m4a-settings__actions">
        <span className="m4a-settings__save-state">{!snapshot.writable ? t('readOnly') : dirty ? t('unsaved') : t('saved')}</span>
        <button type="button" className="m4a-settings__button" disabled={disabled || !dirty || current === null} onClick={() => { if (current !== null) { setDraft(current); setSetup(parseEngineArguments(current.arguments)) } }}>{t('revert')}</button>
        <button type="button" className="m4a-settings__button m4a-settings__button--primary" disabled={disabled || !dirty} onClick={() => { void submit() }}>{saving ? t('saving') : t('save')}</button>
      </div>

      {!confirmBusy ? null : (
        <div className="m4a-overlay" role="presentation">
          <section className="m4a-overlay__dialog" role="alertdialog" aria-modal="true" aria-labelledby="m4a-busy-title">
            <h2 id="m4a-busy-title" className="m4a-overlay__title">{t('resourceWarningTitle')}</h2>
            <p className="m4a-overlay__body">{t('resourceWarningBody')}</p>
            <ul className="m4a-overlay__reasons">{(status?.reasons ?? []).map(reason => <li key={reason}>{reason}</li>)}</ul>
            <div className="m4a-overlay__actions">
              <button type="button" className="m4a-settings__button" disabled={acting} onClick={() => { setConfirmBusy(false) }}>{t('cancel')}</button>
              <button type="button" className="m4a-settings__button m4a-settings__button--danger" disabled={acting} onClick={() => { void launch(true) }}>{acting ? t('startingNow') : t('startAnyway')}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.moe4all': Moe4AllLocaleKey
  }
}
