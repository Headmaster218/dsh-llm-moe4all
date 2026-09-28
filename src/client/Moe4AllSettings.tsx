import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

import type { Config } from '../index.js'
import type { EngineControlStatus } from '../host-routes.js'
import type { EngineReleaseStatus } from '../engine-release.js'
import { fetchEngineStatus, fetchReleaseStatus, installLatestEngine, startEngine } from './engine-api.js'
import type { Moe4AllLocaleKey } from './locales.js'
import { formatTokenValue, parseTokenValue } from './token-value.js'

type ResolvedConfig = { [K in keyof Config]-?: Exclude<Config[K], undefined> }

export interface Moe4AllSettingsInjected {
  hooks: {
    moe4AllSettings: SettingsScope<Config>
  }
  save(next: Config): Promise<void>
}

export type Moe4AllSettingsProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'settings.moe4all'>
  & InjectFace<Moe4AllSettingsInjected>

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function lines(value: string): string[] {
  return value.split(/\r?\n/).map(item => item.trim()).filter(Boolean)
}

function resolved(value: Config): ResolvedConfig {
  const mode = value.mode === 'managed' ? 'prompt' : value.mode
  return { ...value, mode } as ResolvedConfig
}

interface FieldProps {
  label: string
  wide?: boolean
  hint?: string
  children: ReactNode
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

interface CheckProps {
  checked: boolean
  disabled: boolean
  label: string
  onChange(value: boolean): void
}

function Check({ checked, disabled, label, onChange }: CheckProps): ReactNode {
  return (
    <label className="m4a-settings__check">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={event => { onChange(event.target.checked) }}
      />
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

export function Moe4AllSettings(props: Moe4AllSettingsProps): ReactNode {
  const { t, useMoe4AllSettings, save } = props
  const snapshot = useMoe4AllSettings(value => value)
  const [draft, setDraft] = useState<ResolvedConfig | null>(
    snapshot.value === undefined ? null : resolved(snapshot.value),
  )
  const [saving, setSaving] = useState(false)
  const [acting, setActing] = useState(false)
  const [status, setStatus] = useState<EngineControlStatus | null>(null)
  const [release, setRelease] = useState<EngineReleaseStatus | null>(null)
  const [error, setError] = useState('')
  const [confirmBusy, setConfirmBusy] = useState(false)

  useEffect(() => {
    if (!saving && snapshot.value !== undefined) setDraft(resolved(snapshot.value))
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
    return () => {
      disposed = true
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    let disposed = false
    void fetchReleaseStatus().then(next => {
      if (!disposed) setRelease(next)
    }).catch(cause => {
      if (!disposed) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { disposed = true }
  }, [])

  const current = snapshot.value === undefined ? null : resolved(snapshot.value)
  const dirty = draft !== null && current !== null && !same(draft, current)
  const endpoint = useMemo(() => {
    if (draft === null) return ''
    if (draft.endpoint.trim() !== '') return draft.endpoint.trim()
    const path = draft.apiBasePath.startsWith('/') ? draft.apiBasePath : `/${draft.apiBasePath}`
    return `${draft.protocol}://${draft.host}:${draft.port}${path}`
  }, [draft])

  if (snapshot.status === 'loading' || draft === null) {
    return <p className="m4a-settings__message">{t('loading')}</p>
  }
  if (snapshot.status === 'unavailable') {
    return <p className="m4a-settings__message">{t('unavailable')}</p>
  }

  const disabled = saving || acting || !snapshot.writable
  const setField = <K extends keyof ResolvedConfig>(field: K, value: ResolvedConfig[K]): void => {
    setDraft(previous => previous === null ? previous : { ...previous, [field]: value })
  }
  const numberField = (field: keyof ResolvedConfig, value: string): void => {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) setField(field, parsed as never)
  }

  const submit = async (next = draft): Promise<void> => {
    setSaving(true)
    setError('')
    try {
      await save(next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      throw cause
    } finally {
      setSaving(false)
    }
  }

  const launch = async (force = false): Promise<void> => {
    setActing(true)
    setError('')
    try {
      if (dirty) {
        await submit()
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

  const install = async (): Promise<void> => {
    setActing(true)
    setError('')
    try {
      const installed = await installLatestEngine()
      const next = { ...draft, executable: installed.executable, workingDirectory: installed.workingDirectory }
      setDraft(next)
      await submit(next)
      await new Promise(resolve => window.setTimeout(resolve, 700))
      setRelease(await fetchReleaseStatus(true))
      setStatus(await fetchEngineStatus())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setActing(false)
    }
  }

  const modeDescription = draft.mode === 'connect'
    ? t('connectHint')
    : draft.mode === 'auto'
      ? t('autoHint')
      : t('promptHint')
  const releaseAction = status?.phase === 'missing-executable'
    ? t('installLatest')
    : release?.updateAvailable === true
      ? t('updateNow')
      : null

  return (
    <div className="m4a-settings">
      <header className="m4a-settings__header">
        <h2 className="m4a-settings__title">{t('title')}</h2>
        <div className="m4a-settings__status">
          <span className={`m4a-settings__dot m4a-settings__dot--${statusClass(status)}`} />
          <span>{status?.message ?? t('checkingEngine')}</span>
          <code className="m4a-settings__endpoint" title={endpoint}>{endpoint}</code>
        </div>
        {status?.models.length ? <p className="m4a-settings__models">{t('syncedModels')}: {status.models.map(model => model.name).join(', ')}</p> : null}
        {error === '' ? null : <p className="m4a-settings__error">{error}</p>}
        <div className="m4a-settings__runtime-actions">
          <button type="button" className="m4a-settings__button m4a-settings__button--primary" disabled={disabled || status?.ready === true || status?.phase === 'starting'} onClick={() => { void launch(false) }}>
            {acting ? t('working') : dirty ? t('saveAndStart') : t('startNow')}
          </button>
          {releaseAction === null ? null : (
            <button type="button" className="m4a-settings__button" disabled={disabled} onClick={() => { void install() }}>
              {acting ? t('working') : releaseAction}
            </button>
          )}
          <button type="button" className="m4a-settings__button" disabled={disabled} onClick={() => {
            setActing(true)
            void fetchReleaseStatus(true).then(setRelease).catch(cause => { setError(cause instanceof Error ? cause.message : String(cause)) }).finally(() => { setActing(false) })
          }}>{t('checkUpdates')}</button>
        </div>
        {release?.latest === undefined ? null : (
          <p className="m4a-settings__release">
            {release.installed?.name ?? t('engineNotManaged')} / {t('latestVersion')}: {release.latest.name}
          </p>
        )}
      </header>

      <section className="m4a-settings__group">
        <h3 className="m4a-settings__group-title">{t('mode')}</h3>
        <div className="m4a-settings__segmented" role="group" aria-label={t('mode')}>
          {(['connect', 'prompt', 'auto'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              className="m4a-settings__segment"
              aria-pressed={draft.mode === mode}
              disabled={disabled}
              onClick={() => { setField('mode', mode) }}
            >
              {t(mode)}
            </button>
          ))}
        </div>
        <p className="m4a-settings__hint">{modeDescription}</p>
      </section>

      <section className="m4a-settings__group">
        <h3 className="m4a-settings__group-title">{t('connection')}</h3>
        <div className="m4a-settings__grid">
          <Field label={t('protocol')}>
            <select className="m4a-settings__select" value={draft.protocol} disabled={disabled} onChange={event => { setField('protocol', event.target.value as 'http' | 'https') }}>
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </select>
          </Field>
          <Field label={t('port')}>
            <input className="m4a-settings__input" type="number" min={1} max={65535} value={draft.port} disabled={disabled} onChange={event => { numberField('port', event.target.value) }} />
          </Field>
          <Field label={t('host')}>
            <input className="m4a-settings__input" value={draft.host} disabled={disabled} spellCheck={false} onChange={event => { setField('host', event.target.value) }} />
          </Field>
          <Field label={t('apiBasePath')}>
            <input className="m4a-settings__input" value={draft.apiBasePath} disabled={disabled} spellCheck={false} onChange={event => { setField('apiBasePath', event.target.value) }} />
          </Field>
          <Field label={t('endpoint')} hint={t('endpointHint')} wide>
            <input className="m4a-settings__input" value={draft.endpoint} disabled={disabled} spellCheck={false} placeholder="http://127.0.0.1:8080/v1" onChange={event => { setField('endpoint', event.target.value) }} />
          </Field>
          <Field label={t('apiKeyEnv')} wide>
            <input className="m4a-settings__input" value={draft.apiKeyEnv} disabled={disabled} spellCheck={false} placeholder="MOE4ALL_API_KEY" onChange={event => { setField('apiKeyEnv', event.target.value) }} />
          </Field>
        </div>
        <Check checked={draft.allowRemoteEndpoint} disabled={disabled} label={t('allowRemoteEndpoint')} onChange={value => { setField('allowRemoteEndpoint', value) }} />
      </section>

      {draft.mode === 'connect' ? null : (
        <section className="m4a-settings__group">
          <h3 className="m4a-settings__group-title">{t('startup')}</h3>
          <div className="m4a-settings__grid">
            <Field label={t('executable')} wide>
              <input className="m4a-settings__input" value={draft.executable} disabled={disabled} spellCheck={false} onChange={event => { setField('executable', event.target.value) }} />
            </Field>
            <Field label={t('workingDirectory')} wide>
              <input className="m4a-settings__input" value={draft.workingDirectory} disabled={disabled} spellCheck={false} onChange={event => { setField('workingDirectory', event.target.value) }} />
            </Field>
            <Field label={t('arguments')} hint={t('argumentsHint')} wide>
              <textarea className="m4a-settings__textarea" value={draft.arguments.join('\n')} disabled={disabled} spellCheck={false} onChange={event => { setField('arguments', lines(event.target.value)) }} />
            </Field>
            <Field label={t('minimumFreeRam')}>
              <div className="m4a-settings__percentage">
                <input type="range" min={0} max={1} step={0.05} value={draft.minimumFreeRamFraction} disabled={disabled} onChange={event => { numberField('minimumFreeRamFraction', event.target.value) }} />
                <output>{`${Math.round(draft.minimumFreeRamFraction * 100)}%`}</output>
              </div>
            </Field>
            <Field label={t('minimumFreeVram')}>
              <div className="m4a-settings__percentage">
                <input type="range" min={0} max={1} step={0.05} value={draft.minimumFreeVramFraction} disabled={disabled} onChange={event => { numberField('minimumFreeVramFraction', event.target.value) }} />
                <output>{`${Math.round(draft.minimumFreeVramFraction * 100)}%`}</output>
              </div>
            </Field>
          </div>
          <Check checked={draft.stopOnUnload} disabled={disabled} label={t('stopOnUnload')} onChange={value => { setField('stopOnUnload', value) }} />
          <Check checked={draft.logOutput} disabled={disabled} label={t('logOutput')} onChange={value => { setField('logOutput', value) }} />
        </section>
      )}

      <section className="m4a-settings__group">
        <h3 className="m4a-settings__group-title">{t('model')}</h3>
        <div className="m4a-settings__grid">
          <Field label={t('modelDirectory')} wide>
            <input className="m4a-settings__input" value={draft.modelDirectory} disabled={disabled} spellCheck={false} onChange={event => { setField('modelDirectory', event.target.value) }} />
          </Field>
          <Field label={t('contextWindow')} hint={t('tokenUnitHint')}>
            <TokenInput value={draft.contextWindow} disabled={disabled} onChange={value => { setField('contextWindow', value) }} />
          </Field>
          <Field label={t('maxTokens')} hint={t('tokenUnitHint')}>
            <TokenInput value={draft.maxTokens} disabled={disabled} onChange={value => { setField('maxTokens', value) }} />
          </Field>
        </div>
        <Check checked={draft.vision} disabled={disabled} label={t('vision')} onChange={value => { setField('vision', value) }} />
      </section>

      <details className="m4a-settings__details">
        <summary>{t('advanced')}</summary>
        <div className="m4a-settings__grid">
          <Field label={t('processNames')} hint={t('listHint')}>
            <textarea className="m4a-settings__textarea" value={draft.processNames.join('\n')} disabled={disabled} spellCheck={false} onChange={event => { setField('processNames', lines(event.target.value)) }} />
          </Field>
          <Field label={t('excludeModels')} hint={t('listHint')}>
            <textarea className="m4a-settings__textarea" value={draft.excludeModelNameContains.join('\n')} disabled={disabled} spellCheck={false} onChange={event => { setField('excludeModelNameContains', lines(event.target.value)) }} />
          </Field>
          {([
            ['resourceProbeTimeoutMs', 'resourceProbeTimeout'],
            ['startupTimeoutMs', 'startupTimeout'],
            ['healthTimeoutMs', 'healthTimeout'],
            ['pollIntervalMs', 'pollInterval'],
            ['shutdownTimeoutMs', 'shutdownTimeout'],
            ['modelRefreshIntervalMs', 'modelRefreshInterval'],
            ['modelDiscoveryTimeoutMs', 'modelDiscoveryTimeout'],
          ] as const).map(([field, label]) => (
            <Field key={field} label={t(label)}>
              <input className="m4a-settings__input" type="number" min={1} step={100} value={draft[field]} disabled={disabled} onChange={event => { numberField(field, event.target.value) }} />
            </Field>
          ))}
        </div>
      </details>

      <div className="m4a-settings__actions">
        <span className="m4a-settings__save-state">{!snapshot.writable ? t('readOnly') : dirty ? t('unsaved') : t('saved')}</span>
        <button type="button" className="m4a-settings__button" disabled={disabled || !dirty || current === null} onClick={() => { if (current !== null) setDraft(current) }}>
          {t('revert')}
        </button>
        <button type="button" className="m4a-settings__button m4a-settings__button--primary" disabled={disabled || !dirty} onClick={() => { void submit() }}>
          {saving ? t('saving') : t('save')}
        </button>
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
