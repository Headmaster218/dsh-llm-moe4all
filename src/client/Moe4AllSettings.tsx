import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronRight,
  CircleAlert,
  Copy,
  Cpu,
  FilePlus2,
  FolderOpen,
  Layers3,
  Link,
  Monitor,
  Package,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  Square,
  Terminal,
  X,
} from 'lucide-react'
import type { Config } from '../index.js'
import { endpointFromConfig } from '../connection.js'
import type { InstalledEngine } from '../engine-release.js'
import type { ModelFileKind } from '../model-files.js'
import type { Moe4AllLocaleKey } from './locales.js'
import { useWorkspace, isInstalling } from './use-workspace.js'
import { fileName, formatBytes, samePath } from './workspace-model.js'
import { AdvancedOptions } from './AdvancedOptions.js'
import { ApiKeyField } from './ApiKeyField.js'
import { EngineVersionsView } from './EngineVersionsView.js'
import { ModelLibraryView, roleIcon, roleLabel } from './ModelLibraryView.js'
import { RuntimeMetrics } from './RuntimeStatus.js'
import { Button, Dialog, Field, IconButton, Toggle, Transfer } from './workspace-ui.js'

export interface Moe4AllSettingsInjected {
  hooks: { moe4AllSettings: SettingsScope<Config> }
  pickDirectory(): Promise<string | null>
  save(next: Config): Promise<void>
}
interface Moe4AllSettingsFace {
  pickDirectory(): Promise<string | null>
  save(next: Config): Promise<void>
  useMoe4AllSettings<S>(
    selector: (snapshot: SettingsScopeSnapshot<Config>) => S,
    equal?: (left: S, right: S) => boolean,
  ): S
}
export type Moe4AllSettingsProps = PropsRuntime<'settings.section'> &
  PropsLocale<'settings.moe4all'> &
  Moe4AllSettingsFace
type Tab = 'run' | 'engines' | 'diagnostics'
type Confirmation = { kind: 'stop' | 'restart' | 'discard' } | { kind: 'delete'; version: InstalledEngine }
const phases: Record<string, Moe4AllLocaleKey> = {
  ready: 'readyStatus',
  checking: 'checkingStatus',
  starting: 'startingStatus',
  offline: 'stoppedStatus',
  error: 'failedStatus',
  'missing-executable': 'notConfigured',
  'missing-arguments': 'notConfigured',
  'resource-warning': 'busyStatus',
  'duplicate-process': 'duplicateStatus',
}

export function Moe4AllSettings(props: Moe4AllSettingsProps): ReactNode {
  const w = useWorkspace(props)
  const { t } = props
  const root = useRef<HTMLDivElement>(null)
  const modelLibrary = useRef<HTMLElement>(null)
  const [tab, setTab] = useState<Tab>('run')
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [importKind, setImportKind] = useState<ModelFileKind | null>(null)
  const [importText, setImportText] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [copied, setCopied] = useState(false)
  const [clock, setClock] = useState(Date.now())
  useEffect(() => {
    const dialog = root.current?.closest('[role="dialog"]')
    let options = root.current?.parentElement
    while (options && options !== dialog && getComputedStyle(options).overflowY !== 'auto')
      options = options.parentElement
    const overlay = dialog?.parentElement
    dialog?.classList.add('m4a-host-dialog')
    options?.classList.add('m4a-host-options')
    // Older DSH shells mount settings inside a fading sidebar stacking context.
    if (overlay && 'showPopover' in overlay) {
      overlay.classList.add('m4a-host-overlay')
      overlay.setAttribute('popover', 'manual')
      overlay.showPopover()
    }
    document.documentElement.dataset.moe4allSettings = 'open'
    window.dispatchEvent(new Event('moe4all-settings-visibility'))
    return () => {
      dialog?.classList.remove('m4a-host-dialog')
      options?.classList.remove('m4a-host-options')
      if (overlay?.hasAttribute('popover')) {
        overlay.hidePopover()
        overlay.removeAttribute('popover')
        overlay.classList.remove('m4a-host-overlay')
      }
      delete document.documentElement.dataset.moe4allSettings
      window.dispatchEvent(new Event('moe4all-settings-visibility'))
    }
  }, [w.editor === null])
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  if (!w.editor)
    return (
      <div className="m4a-workspace" ref={root}>
        <div className="m4a-loading">
          <RefreshCw size={20} className="m4a-spin" />
          {t(w.snapshot.status === 'unavailable' ? 'unavailable' : 'loading')}
        </div>
      </div>
    )
  const e = w.editor
  const local = e.config.mode !== 'connect'
  const owned = w.status?.owned === true
  const ready = w.status?.ready === true
  const starting = w.status?.phase === 'starting' || w.working === 'start'
  const engineSelected = !!e.config.executable
  const modelSelected = !!e.setup.model
  const selectedVersion = w.release?.versions.find((item) =>
    samePath(item.executable, e.config.executable ?? ''),
  )
  const currentModel = w.library.models.find((item) => samePath(item.path, e.setup.model))
  const firstEngineSetup = local && !engineSelected
  const needsRestart = owned && (w.dirty || w.status?.pendingChanges || (!ready && !starting))
  const endpoint = endpointFromConfig(e.config)
  const output = (w.status?.startupLines ?? []).join('\n')
  const engineTask = w.release?.install
  const modelTask = w.download
  const currentDownload = w.catalog.find((item) => item.id === modelTask.modelId)
  const downloadTasks =
    (engineTask && engineTask.stage !== 'idle' && engineTask.stage !== 'complete') ||
    (modelTask.stage !== 'idle' && modelTask.stage !== 'complete')
  const installLabels: Record<string, Moe4AllLocaleKey> = {
    checking: 'progressChecking',
    downloading: 'downloadRunning',
    verifying: 'progressVerifying',
    extracting: 'progressExtracting',
    finalizing: 'progressFinalizing',
    error: 'failedDownload',
    cancelled: 'pausedStatus',
    complete: 'downloadedStatus',
  }
  const primaryLabel = needsRestart
    ? 'restartEngineAction'
    : !local
      ? w.dirty
        ? 'saveConnect'
        : 'testConnection'
      : !engineSelected
        ? 'stepEngine'
        : !modelSelected
          ? 'browseLibrary'
          : ready
            ? 'readyStatus'
            : w.dirty
              ? 'saveStart'
              : 'startNow'
  const showModelLibrary = () => {
    setTab('run')
    setTimeout(() => modelLibrary.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }
  const primaryAction = () => {
    if (needsRestart) {
      setConfirmation({ kind: 'restart' })
      return
    }
    if (!local) {
      void w.launch()
      return
    }
    if (!engineSelected) {
      setTab('engines')
      return
    }
    if (!modelSelected) {
      showModelLibrary()
      return
    }
    void w.launch()
  }
  const attachPath = (kind: ModelFileKind) =>
    kind === 'main'
      ? e.setup.model
      : kind === 'vision'
        ? e.setup.visionModel
        : kind === 'mtp'
          ? e.setup.mtpModel
          : e.setup.embeddingModel
  const tokenFields = (
    <div className="m4a-field-grid">
      <Field label={t('contextWindow')} help={t('tokenUnitHint')}>
        <input
          inputMode="decimal"
          value={e.context}
          placeholder="160k"
          onChange={(event) => w.edit((previous) => ({ ...previous, context: event.target.value }))}
        />
      </Field>
      <Field label={t('maxTokens')} help={t('tokenUnitHint')}>
        <input
          inputMode="decimal"
          value={e.maxTokens}
          placeholder="100k"
          onChange={(event) => w.edit((previous) => ({ ...previous, maxTokens: event.target.value }))}
        />
      </Field>
    </div>
  )
  const runConfig = (
    <div className="m4a-run-config">
      <div className="m4a-section-heading">
        <h3>{t('selectedModelTitle')}</h3>
        <Button kind="ghost" icon={Plus} onClick={() => setImportKind('main')}>
          {t('importModel')}
        </Button>
      </div>
      <div className={`m4a-active-model ${!modelSelected ? 'is-empty' : ''}`}>
        <div className="m4a-active-symbol">
          <Layers3 size={24} />
        </div>
        <div>
          {modelSelected ? (
            <>
              <strong>{currentModel?.family ?? fileName(e.setup.model)}</strong>
              <span>
                {currentModel?.quantization ?? 'GGUF'}
                {currentModel && ` · ${formatBytes(currentModel.sizeBytes)}`}
              </span>
            </>
          ) : (
            <strong>{t('modelEmpty')}</strong>
          )}
        </div>
        <IconButton icon={ChevronRight} label={t('changeModel')} onClick={showModelLibrary} />
      </div>
      {modelSelected && (
        <details className="m4a-model-path">
          <summary>{t('detailLabel')}</summary>
          <code>{e.setup.model}</code>
        </details>
      )}
      <section className="m4a-section">
        <h4>{t('essential')}</h4>
        {tokenFields}
        <Field label={t('performance')}>
          <div className="m4a-preset" role="group" aria-label={t('performance')}>
            {(['conservative', 'aggressive'] as const).map((profile) => (
              <button
                type="button"
                key={profile}
                aria-pressed={e.setup.profile === profile}
                onClick={() => w.setup({ profile })}
                title={t(profile === 'conservative' ? 'balancedHelp' : 'performanceHelp')}
              >
                {profile === 'conservative' ? <Cpu size={16} /> : <Activity size={16} />}
                {t(profile === 'conservative' ? 'balancedLabel' : 'performanceLabel')}
                {e.setup.profile === profile && <Check size={13} />}
              </button>
            ))}
          </div>
        </Field>
        <div className="m4a-field-grid">
          <Field label={t('parallel')}>
            <select
              value={e.setup.parallel}
              onChange={(event) => w.setup({ parallel: Number(event.target.value) })}
            >
              {[...new Set([1, 2, 4, 8, e.setup.parallel])]
                .sort((a, b) => a - b)
                .map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
            </select>
          </Field>
          <Field label={t('startupPolicy')} help={t('resourcesHelp')}>
            <select
              value={e.config.mode}
              onChange={(event) => w.config({ mode: event.target.value as 'prompt' | 'auto' })}
            >
              <option value="prompt">{t('askStart')}</option>
              <option value="auto">{t('autoStart')}</option>
            </select>
          </Field>
        </div>
      </section>
      <section className="m4a-section m4a-capabilities">
        <h4>{t('optionalFeatures')}</h4>
        {(['vision', 'mtp', 'embedding'] as const).map((kind) => {
          const Icon = roleIcon[kind],
            path = attachPath(kind)
          const active = kind === 'mtp' ? e.setup.mtp : !!path
          return (
            <div className="m4a-capability" key={kind}>
              <Icon size={18} />
              <div>
                <Toggle
                  label={t(roleLabel[kind])}
                  checked={active}
                  onChange={(enabled) => {
                    if (kind === 'mtp' && path) w.setup({ mtp: enabled })
                    else if (!enabled) w.selectModel('', kind)
                    else {
                      const available = w.library.models.find(
                        (item) =>
                          item.kind === kind &&
                          item.complete &&
                          (kind === 'embedding' || item.family === currentModel?.family),
                      )
                      if (available) w.selectModel(available.path, kind)
                      else setImportKind(kind)
                    }
                  }}
                />
                {path && (
                  <button
                    type="button"
                    className="m4a-text-link m4a-attachment-path"
                    title={path}
                    onClick={() => {
                      setImportText(path)
                      setImportKind(kind)
                    }}
                  >
                    {fileName(path)}
                  </button>
                )}
              </div>
              <IconButton
                icon={FolderOpen}
                label={t('chooseAttachment')}
                onClick={() => {
                  setImportText(path)
                  setImportKind(kind)
                }}
              />
            </div>
          )
        })}
        <div className="m4a-cache-toggle">
          <Toggle
            label={t('cacheEnabled')}
            checked={e.setup.sessionCacheEnabled}
            onChange={(sessionCacheEnabled) => w.setup({ sessionCacheEnabled })}
          />
          <span className="m4a-help" tabIndex={0} aria-label={t('sessionCacheHelp')}>
            ?<span role="tooltip">{t('sessionCacheHelp')}</span>
          </span>
        </div>
      </section>
      <button
        type="button"
        className={`m4a-advanced-trigger ${advanced ? 'is-active' : ''}`}
        aria-expanded={advanced}
        onClick={() => setAdvanced(!advanced)}
      >
        <Settings2 size={16} />
        <span>{t('advancedOptions')}</span>
        <ChevronRight size={16} />
      </button>
      {advanced && <AdvancedOptions workspace={w} t={t} />}
    </div>
  )
  return (
    <div className="m4a-workspace" ref={root}>
      <header className="m4a-header">
        <div className="m4a-brand">
          <div className="m4a-brand-mark" aria-hidden="true">
            <Layers3 size={23} />
          </div>
          <div>
            <h2>MoE4All</h2>
            <span>Local inference</span>
          </div>
        </div>
        <div
          className={`m4a-status-pill m4a-status-pill--${ready ? 'ready' : starting ? 'busy' : w.status?.phase === 'error' ? 'error' : 'idle'}`}
          role="status"
        >
          <i />
          {t(phases[w.status?.phase ?? 'checking'] ?? 'stoppedStatus')}
        </div>
      </header>
      <div className="m4a-mode-switch" role="group" aria-label={t('mode')}>
        <button
          type="button"
          aria-pressed={local}
          disabled={w.disabled}
          onClick={() => {
            if (!local) w.config({ mode: 'prompt', endpoint: '' })
          }}
        >
          <Monitor size={16} />
          {t('localRun')}
        </button>
        <button
          type="button"
          aria-pressed={!local}
          disabled={w.disabled}
          onClick={() => {
            if (local) w.config({ mode: 'connect' })
          }}
        >
          <Link size={16} />
          {t('existingService')}
        </button>
      </div>
      <nav className="m4a-tabs" aria-label="MoE4All">
        {(
          [
            { id: 'run', label: 'runTab', icon: Play },
            { id: 'engines', label: 'enginesTab', icon: Package },
            { id: 'diagnostics', label: 'diagnosticsTab', icon: Terminal },
          ] as const
        ).map((item) => (
          <button
            type="button"
            key={item.id}
            aria-current={tab === item.id ? 'page' : undefined}
            onClick={() => setTab(item.id)}
          >
            <item.icon size={15} />
            {t(item.label)}
            {item.id === 'engines' && w.release?.updateAvailable && <i className="m4a-update-dot" />}
          </button>
        ))}
      </nav>
      {w.error && (
        <div className="m4a-message m4a-message--error" role="alert">
          <CircleAlert size={17} />
          <span>{w.error}</span>
          <IconButton icon={X} label={t('cancel')} onClick={() => w.setError('')} />
        </div>
      )}
      {!w.error && w.notice && (
        <div className="m4a-message" role="status">
          <Check size={16} />
          <span>{w.notice}</span>
          <IconButton icon={X} label={t('cancel')} onClick={() => w.setNotice('')} />
        </div>
      )}
      {w.status?.pendingChanges && (
        <div className="m4a-message m4a-message--warning">
          <RotateCcw size={16} />
          <span>{t('pendingRestart')}</span>
        </div>
      )}
      {downloadTasks && (
        <div className="m4a-transfer-list">
          {engineTask && !['idle', 'complete'].includes(engineTask.stage) && (
            <Transfer
              label={`MoE4All Engine · ${t(installLabels[engineTask.stage]!)}`}
              percent={engineTask.percent}
              detail={`${formatBytes(engineTask.downloadedBytes)}${engineTask.totalBytes ? ` / ${formatBytes(engineTask.totalBytes)}` : ''}`}
              error={engineTask.error}
              actions={
                isInstalling(w.release) ? (
                  <IconButton icon={Square} label={t('stopTransfer')} onClick={() => void w.stopInstall()} />
                ) : (
                  <>
                    <Button icon={RefreshCw} onClick={() => void w.install()}>
                      {t('retryDownload')}
                    </Button>
                    <a
                      className="m4a-icon-btn"
                      href={w.release?.latest?.pageUrl ?? 'https://github.com/Headmaster218/MoE4All/releases/latest'}
                      target="_blank"
                      rel="noreferrer"
                      title={t('openReleasePage')}
                      aria-label={t('openReleasePage')}
                    >
                      <ArrowDownToLine size={15} />
                    </a>
                    <Button kind="ghost" icon={FolderOpen} onClick={() => setTab('engines')}>
                      {t('useLocalDownload')}
                    </Button>
                  </>
                )
              }
            />
          )}
          {!['idle', 'complete'].includes(modelTask.stage) && (
            <Transfer
              label={currentDownload?.name ?? t('downloadRunning')}
              percent={modelTask.percent}
              detail={`${t(modelTask.stage === 'downloading' ? 'downloadRunning' : modelTask.stage === 'error' ? 'failedDownload' : 'pausedStatus')} · ${modelTask.fileName ? `${modelTask.fileName} · ` : ''}${modelTask.fileIndex && modelTask.fileCount ? `${modelTask.fileIndex}/${modelTask.fileCount} · ` : ''}${formatBytes(modelTask.downloadedBytes)}${modelTask.totalBytes ? ` / ${formatBytes(modelTask.totalBytes)}` : ''}`}
              error={modelTask.error}
              actions={
                modelTask.stage === 'downloading' ? (
                  <IconButton icon={Square} label={t('stopTransfer')} onClick={() => void w.stopDownload()} />
                ) : (
                  <>
                    <Button
                      icon={RefreshCw}
                      onClick={() => currentDownload && void w.downloadModel(currentDownload)}
                    >
                      {t('continueDownload')}
                    </Button>
                    {currentDownload && (
                      <a
                        className="m4a-icon-btn"
                        href={currentDownload.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={t('openModelSource')}
                        aria-label={t('openModelSource')}
                      >
                        <ArrowDownToLine size={15} />
                      </a>
                    )}
                  </>
                )
              }
            />
          )}
        </div>
      )}
      {tab === 'run' && (
        firstEngineSetup ? (
          <section className="m4a-first-install">
            <div className="m4a-first-install-mark">
              {isInstalling(w.release) ? <RefreshCw size={28} className="m4a-spin" /> : <Package size={28} />}
            </div>
            <div>
              <h3>{t(isInstalling(w.release) ? 'firstInstallRunning' : 'firstInstallAttention')}</h3>
              <p>{t(isInstalling(w.release) ? 'firstInstallRunningBody' : 'firstInstallAttentionBody')}</p>
            </div>
            {!isInstalling(w.release) && (
              <div className="m4a-inline">
                <Button kind="primary" icon={RefreshCw} onClick={() => void w.install()}>
                  {t('retryDownload')}
                </Button>
                <Button icon={FolderOpen} onClick={() => setTab('engines')}>
                  {t('useLocalDownload')}
                </Button>
              </div>
            )}
          </section>
        ) : (
        <>
          {(ready || starting || w.status?.phase === 'error' || w.status?.phase === 'duplicate-process') && (
            <section className="m4a-runtime">
              <div className="m4a-section-heading">
                <h3>
                  <Activity size={16} />
                  {t(phases[w.status?.phase ?? 'checking'] ?? 'stoppedStatus')}
                </h3>
                <div className="m4a-inline">
                  {ready && <span className="m4a-badge">{t(owned ? 'pluginOwned' : 'externalOwned')}</span>}
                  {owned && (
                    <IconButton
                      icon={Square}
                      label={t('stopEngineAction')}
                      onClick={() => setConfirmation({ kind: 'stop' })}
                    />
                  )}
                </div>
              </div>
              <code>{w.status?.endpoint}</code>
              {ready && (
                <div className="m4a-runtime-models">
                  {w.status?.models.map((model) => (
                    <span key={model.id}>
                      <Check size={13} />
                      {model.name}
                    </span>
                  ))}
                </div>
              )}
              <RuntimeMetrics status={w.status} t={t} />
              {ready && (
                <Field label={t('statusDisplay')}>
                  <select
                    value={e.config.statusDisplay ?? 'hover'}
                    onChange={(event) => w.config({
                      statusDisplay: event.target.value as 'hover' | 'always' | 'hidden',
                    })}
                  >
                    <option value="hover">{t('displayHover')}</option>
                    <option value="always">{t('displayAlways')}</option>
                    <option value="hidden">{t('displayHidden')}</option>
                  </select>
                </Field>
              )}
              {starting && (
                <>
                  <progress aria-label={t('startingStatus')} />
                  <span>
                    {t('startupElapsed')}{' '}
                    {Math.max(
                      0,
                      Math.floor(
                        (clock - Date.parse(w.status?.startupStartedAt ?? new Date(clock).toISOString())) /
                          1000,
                      ),
                    )}
                    s
                  </span>
                </>
              )}
              {w.status?.phase === 'duplicate-process' && <p>{t('externalProcessHelp')}</p>}
              {(starting || w.status?.phase === 'error') && (
                <pre className="m4a-log m4a-log--preview">{output || w.status?.message || t('noOutput')}</pre>
              )}
            </section>
          )}
          {local ? (
            <div className="m4a-run-layout">
              {runConfig}
              <aside className="m4a-run-library" ref={modelLibrary}>
                <ModelLibraryView workspace={w} t={t} onImport={() => setImportKind('main')} />
              </aside>
            </div>
          ) : (
            <div className="m4a-connection-view">
              <div className="m4a-section-heading">
                <h3>{t('connection')}</h3>
                <Link size={20} />
              </div>
              <Field label={t('currentEndpoint')}>
                <input
                  value={e.config.endpoint || endpoint}
                  onChange={(event) => w.config({ endpoint: event.target.value })}
                  placeholder="http://127.0.0.1:8080/v1"
                />
              </Field>
              <ApiKeyField workspace={w} t={t} />
              <Toggle
                label={t('allowRemoteEndpoint')}
                checked={e.config.allowRemoteEndpoint ?? false}
                onChange={(allowRemoteEndpoint) => w.config({ allowRemoteEndpoint })}
              />
              <section className="m4a-section">
                <h4>{t('model')}</h4>
                {tokenFields}
                <Toggle
                  label={t('vision')}
                  checked={e.config.vision ?? true}
                  onChange={(vision) => w.config({ vision })}
                />
              </section>
            </div>
          )}
        </>
        )
      )}
      {tab === 'engines' && (
        <EngineVersionsView
          workspace={w}
          t={t}
          onDelete={(version) => setConfirmation({ kind: 'delete', version })}
        />
      )}
      {tab === 'diagnostics' && (
        <section className="m4a-diagnostics">
          <div className="m4a-section-heading">
            <h3>{t('runtimeOutput')}</h3>
            <div className="m4a-inline">
              <IconButton icon={RefreshCw} label={t('refreshStatus')} onClick={() => void w.refresh()} />
              <IconButton
                icon={copied ? Check : Copy}
                label={t(copied ? 'copied' : 'copyOutput')}
                disabled={!output}
                onClick={() => {
                  void navigator.clipboard
                    .writeText(output)
                    .then(() => setCopied(true))
                    .catch((error) => w.setError(String(error)))
                }}
              />
            </div>
          </div>
          <dl className="m4a-diagnostic-facts">
            <div>
              <dt>{t('currentEndpoint')}</dt>
              <dd>{w.status?.endpoint || endpoint}</dd>
            </div>
            <div>
              <dt>{t('selectedEngine')}</dt>
              <dd>{w.status?.executable || e.config.executable || t('noEngine')}</dd>
            </div>
            <div>
              <dt>{t('returnedModels')}</dt>
              <dd>{w.status?.models.map((model) => model.name).join(', ') || '-'}</dd>
            </div>
          </dl>
          <pre className="m4a-log" tabIndex={0}>
            {output || t('noOutput')}
          </pre>
        </section>
      )}
      {!firstEngineSetup && <footer className={`m4a-footer m4a-footer--${tab}`}>
        <div>
          <span className={`m4a-save-indicator ${w.dirty ? 'is-dirty' : ''}`} />
          {t(w.dirty ? 'pendingEdits' : 'saved')}
          {local && selectedVersion && <small>{selectedVersion.name}</small>}
        </div>
        <div className="m4a-footer-actions">
          {w.dirty && (
            <IconButton
              icon={RotateCcw}
              label={t('revert')}
              disabled={w.disabled}
              onClick={() => setConfirmation({ kind: 'discard' })}
            />
          )}
          <Button
            icon={Save}
            disabled={!w.dirty || w.disabled}
            busy={w.working === 'save'}
            onClick={() => void w.save()}
          >
            {t('save')}
          </Button>
          {owned && ready && (
            <Button
              kind="danger"
              icon={Square}
              disabled={w.disabled}
              busy={w.working === 'stop'}
              onClick={() => setConfirmation({ kind: 'stop' })}
            >
              {t('stopEngineAction')}
            </Button>
          )}
          <Button
            icon={!local ? Link : ready && !needsRestart ? Check : needsRestart ? RotateCcw : Play}
            kind="primary"
            disabled={w.disabled || starting || (local && ready && !needsRestart)}
            busy={w.working === 'start'}
            onClick={primaryAction}
          >
            {t(primaryLabel)}
          </Button>
        </div>
      </footer>}
      {importKind && (
        <Dialog
          title={t(roleLabel[importKind])}
          closeLabel={t('cancel')}
          onClose={() => {
            setImportKind(null)
            setImportText('')
          }}
          actions={
            <>
              <Button onClick={() => setImportKind(null)}>{t('cancel')}</Button>
              <Button
                icon={Plus}
                kind="primary"
                disabled={!importText.trim()}
                busy={w.working === 'import'}
                onClick={() => {
                  void w.importPath(importText, importKind).then((ok) => {
                    if (!ok) return
                    setImportKind(null)
                    setImportText('')
                  })
                }}
              >
                {t('addPath')}
              </Button>
            </>
          }
        >
          {w.error && (
            <p className="m4a-field-error" role="alert">
              {w.error}
            </p>
          )}
          <Field label={t('importPath')}>
            <input
              autoFocus
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="D:\Models\model.gguf"
            />
          </Field>
          <div className="m4a-dialog-choices">
            {w.nativePicker && (
              <Button
                icon={FilePlus2}
                onClick={() => {
                  void w.pickFile(importKind)
                  setImportKind(null)
                }}
              >
                {t('chooseFile')}
              </Button>
            )}
            <Button
              icon={FolderOpen}
              onClick={() => {
                void props
                  .pickDirectory()
                  .then((path) => {
                    if (path) setImportText(path)
                  })
                  .catch((error) => w.setError(String(error)))
              }}
            >
              {t('chooseDirectory')}
            </Button>
            <Button
              icon={ArrowDownToLine}
              onClick={() => {
                showModelLibrary()
                setImportKind(null)
              }}
            >
              {t('filterRecommended')}
            </Button>
          </div>
          {w.library.models
            .filter((item) => item.kind === importKind && item.complete)
            .map((item) => (
              <button
                type="button"
                className="m4a-import-choice"
                key={item.id}
                onClick={() => {
                  w.selectModel(item.path, importKind)
                  setImportKind(null)
                }}
              >
                <Layers3 size={16} />
                <span>{item.name}</span>
                <ArrowRight size={15} />
              </button>
            ))}
        </Dialog>
      )}
      {confirmation && (
        <Dialog
          title={t(
            confirmation.kind === 'delete'
              ? 'removeEngineTitle'
              : confirmation.kind === 'stop'
                ? 'stopEngineTitle'
                : confirmation.kind === 'restart'
                  ? 'restartEngineTitle'
                  : 'discardTitle',
          )}
          closeLabel={t('cancel')}
          onClose={() => setConfirmation(null)}
          actions={
            <>
              <Button onClick={() => setConfirmation(null)}>{t('cancel')}</Button>
              <Button
                kind={confirmation.kind === 'restart' ? 'primary' : 'danger'}
                onClick={() => {
                  if (confirmation.kind === 'stop') void w.stop()
                  if (confirmation.kind === 'restart') void w.launch(false, true)
                  if (confirmation.kind === 'delete') void w.removeVersion(confirmation.version)
                  if (confirmation.kind === 'discard') w.revert()
                  setConfirmation(null)
                }}
              >
                {t(
                  confirmation.kind === 'delete'
                    ? 'deleteEngine'
                    : confirmation.kind === 'stop'
                      ? 'stopEngineAction'
                      : confirmation.kind === 'restart'
                        ? 'restartEngineAction'
                        : 'discardAction',
                )}
              </Button>
            </>
          }
        >
          {confirmation.kind === 'delete' && <strong>{confirmation.version.name}</strong>}
          {confirmation.kind !== 'discard' && (
            <p>
              {t(
                confirmation.kind === 'delete'
                  ? 'removeEngineBody'
                  : confirmation.kind === 'stop'
                    ? 'stopEngineBody'
                    : 'restartEngineBody',
              )}
            </p>
          )}
        </Dialog>
      )}
      {w.resourcePrompt && (
        <Dialog
          title={t('resourceWarningTitle')}
          closeLabel={t('cancel')}
          onClose={() => w.setResourcePrompt(false)}
          actions={
            <>
              <Button onClick={() => w.setResourcePrompt(false)}>{t('cancel')}</Button>
              <Button
                kind="danger"
                onClick={() => {
                  w.setResourcePrompt(false)
                  void w.launch(true)
                }}
              >
                {t('startAnyway')}
              </Button>
            </>
          }
        >
          <p>{t('resourceWarningBody')}</p>
          {w.status?.reasons?.map((reason) => (
            <p key={reason}>{reason}</p>
          ))}
        </Dialog>
      )}
    </div>
  )
}
