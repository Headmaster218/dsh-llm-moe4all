import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

import type { Config } from '../index.js'
import type { Moe4AllLocaleKey } from './locales.js'

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
  return value as ResolvedConfig
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

export function Moe4AllSettings(props: Moe4AllSettingsProps): ReactNode {
  const { t, useMoe4AllSettings, save } = props
  const snapshot = useMoe4AllSettings(value => value)
  const [draft, setDraft] = useState<ResolvedConfig | null>(
    snapshot.value === undefined ? null : resolved(snapshot.value),
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!saving && snapshot.value !== undefined) setDraft(resolved(snapshot.value))
  }, [saving, snapshot.revision, snapshot.value])

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

  const disabled = saving || !snapshot.writable
  const setField = <K extends keyof ResolvedConfig>(field: K, value: ResolvedConfig[K]): void => {
    setDraft(previous => previous === null ? previous : { ...previous, [field]: value })
  }
  const numberField = (field: keyof ResolvedConfig, value: string): void => {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) setField(field, parsed as never)
  }

  const submit = async (): Promise<void> => {
    setSaving(true)
    try {
      await save(draft)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="m4a-settings">
      <header className="m4a-settings__header">
        <h2 className="m4a-settings__title">{t('title')}</h2>
        <p className="m4a-settings__subtitle">{t('subtitle')}</p>
        <div className="m4a-settings__status">
          <span className={`m4a-settings__dot${dirty ? ' m4a-settings__dot--dirty' : ''}`} />
          <span>{!snapshot.writable ? t('readOnly') : dirty ? t('unsaved') : t('saved')}</span>
          <code className="m4a-settings__endpoint" title={endpoint}>{endpoint}</code>
        </div>
      </header>

      <section className="m4a-settings__group">
        <h3 className="m4a-settings__group-title">{t('mode')}</h3>
        <div className="m4a-settings__segmented" role="group" aria-label={t('mode')}>
          {(['connect', 'auto', 'managed'] as const).map(mode => (
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
          <Check checked={draft.promptWhenBusy} disabled={disabled} label={t('promptWhenBusy')} onChange={value => { setField('promptWhenBusy', value) }} />
          <Check checked={draft.stopOnUnload} disabled={disabled} label={t('stopOnUnload')} onChange={value => { setField('stopOnUnload', value) }} />
          <Check checked={draft.logOutput} disabled={disabled} label={t('logOutput')} onChange={value => { setField('logOutput', value) }} />
        </section>
      )}

      <section className="m4a-settings__group">
        <h3 className="m4a-settings__group-title">{t('model')}</h3>
        <div className="m4a-settings__grid">
          <Field label={t('contextWindow')}>
            <input className="m4a-settings__input" type="number" min={1} step={1024} value={draft.contextWindow} disabled={disabled} onChange={event => { numberField('contextWindow', event.target.value) }} />
          </Field>
          <Field label={t('maxTokens')}>
            <input className="m4a-settings__input" type="number" min={1} step={1024} value={draft.maxTokens} disabled={disabled} onChange={event => { numberField('maxTokens', event.target.value) }} />
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
        <button type="button" className="m4a-settings__button" disabled={disabled || !dirty || current === null} onClick={() => { if (current !== null) setDraft(current) }}>
          {t('revert')}
        </button>
        <button type="button" className="m4a-settings__button m4a-settings__button--primary" disabled={disabled || !dirty} onClick={() => { void submit() }}>
          {saving ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  )
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.moe4all': Moe4AllLocaleKey
  }
}
