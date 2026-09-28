import { Code2, Cpu, Database, Network, SlidersHorizontal, Wrench } from 'lucide-react'
import type { Workspace } from './use-workspace.js'
import { argumentValue, composeEditor, setArgument, parseExtraArguments } from './workspace-model.js'
import { Disclosure, Field, Toggle, type Translate } from './workspace-ui.js'

function ExtraArguments({ workspace: w, t }: { workspace: Workspace; t: Translate }) {
  const text = w.editor!.extraText ?? JSON.stringify(w.editor!.extras, null, 2)
  let valid = true
  try {
    parseExtraArguments(text)
  } catch {
    valid = false
  }
  return (
    <Field label={t('customArguments')}>
      <textarea
        rows={7}
        spellCheck={false}
        value={text}
        aria-invalid={!valid}
        onChange={(event) => {
          const extraText = event.target.value
          w.edit((previous) => {
            try {
              return { ...previous, extras: parseExtraArguments(extraText), extraText }
            } catch {
              return { ...previous, extraText }
            }
          })
        }}
      />
      {!valid && <span className="m4a-field-error">{t('invalidExtra')}</span>}
    </Field>
  )
}
export function AdvancedOptions({ workspace: w, t }: { workspace: Workspace; t: Translate }) {
  const e = w.editor!
  const argument = (key: string, label: string, placeholder = t('automatic')) => (
    <Field label={label} help={t('advancedOverride')}>
      <input
        placeholder={placeholder}
        value={argumentValue(e.extras, key)}
        onChange={(event) =>
          w.edit((previous) => ({
            ...previous,
            extraText: undefined,
            extras: setArgument(previous.extras, key, event.target.value),
          }))
        }
      />
    </Field>
  )
  let preview = ''
  try {
    preview = JSON.stringify(composeEditor(e).arguments ?? [], null, 2)
  } catch {}
  return (
    <div className="m4a-advanced">
      <Disclosure title={t('memoryCompute')} icon={Cpu}>
        <div className="m4a-field-grid">
          {argument('--dev', t('deviceLabel'), 'Vulkan0')}
          {argument('--threads', t('threadsLabel'))}
          {argument('device.ram_budget', t('ramLabel'), '48g')}
          {argument('device.vram_budget', t('vramLabel'), '22g')}
          {argument('--ubatch', t('batchLabel'))}
          {argument('device.submit_dispatches', t('splitterLabel'))}
        </div>
      </Disclosure>
      <Disclosure title={t('samplingSection')} icon={SlidersHorizontal}>
        <div className="m4a-field-grid">
          {argument('--temp', t('temperatureLabel'))}
          {argument('--top-p', 'Top P')}
          {argument('--top-k', 'Top K')}
          {argument('--seed', 'Seed')}
        </div>
      </Disclosure>
      <Disclosure title={t('cacheSection')} icon={Database}>
        <Toggle
          label={t('cacheEnabled')}
          checked={e.setup.sessionCacheEnabled}
          onChange={(value) => w.setup({ sessionCacheEnabled: value })}
        />
        {e.setup.sessionCacheEnabled && (
          <div className="m4a-field-grid">
            <Field label={t('sessionCachePath')} help={t('sessionCachePathHint')} className="m4a-span-2">
              <input
                value={e.setup.sessionCache.directory}
                onChange={(event) =>
                  w.setup({ sessionCache: { ...e.setup.sessionCache, directory: event.target.value } })
                }
              />
            </Field>
            <Field label={t('sessionCacheMax')}>
              <input
                value={e.setup.sessionCache.maxSize}
                onChange={(event) =>
                  w.setup({ sessionCache: { ...e.setup.sessionCache, maxSize: event.target.value } })
                }
              />
            </Field>
            <Field label={t('sessionCacheIdle')}>
              <input
                type="number"
                min={0}
                value={e.setup.sessionCache.idleSeconds}
                onChange={(event) =>
                  w.setup({
                    sessionCache: { ...e.setup.sessionCache, idleSeconds: Number(event.target.value) },
                  })
                }
              />
            </Field>
            <Field label={t('sessionCacheTtl')}>
              <input
                type="number"
                min={0}
                value={e.setup.sessionCache.ttlHours}
                onChange={(event) =>
                  w.setup({ sessionCache: { ...e.setup.sessionCache, ttlHours: Number(event.target.value) } })
                }
              />
            </Field>
          </div>
        )}
      </Disclosure>
      <Disclosure title={t('networkSection')} icon={Network}>
        <div className="m4a-field-grid">
          <Field label={t('host')} help={t('networkHelp')}>
            <input
              value={e.config.host ?? '127.0.0.1'}
              onChange={(event) => w.config({ host: event.target.value })}
            />
          </Field>
          <Field label={t('port')}>
            <input
              type="number"
              min={1}
              max={65535}
              value={e.config.port ?? 8080}
              onChange={(event) => w.config({ port: Number(event.target.value) })}
            />
          </Field>
          <Field label={t('apiKeyEnv')} help={t('apiKeyHelp')} className="m4a-span-2">
            <input
              value={e.config.apiKeyEnv ?? ''}
              placeholder="INFR_API_KEY"
              onChange={(event) => w.config({ apiKeyEnv: event.target.value })}
            />
          </Field>
        </div>
        <Toggle
          label={t('allowRemoteEndpoint')}
          checked={e.config.allowRemoteEndpoint ?? false}
          onChange={(allowRemoteEndpoint) => w.config({ allowRemoteEndpoint })}
        />
      </Disclosure>
      <Disclosure title={t('diagnosticSettings')} icon={Wrench}>
        <div className="m4a-field-grid">
          <Field label={t('startupTimeout')}>
            <input
              type="number"
              min={1000}
              step={1000}
              value={e.config.startupTimeoutMs ?? 120000}
              onChange={(event) => w.config({ startupTimeoutMs: Number(event.target.value) })}
            />
          </Field>
          <Field label={t('healthTimeout')}>
            <input
              type="number"
              min={100}
              step={100}
              value={e.config.healthTimeoutMs ?? 2000}
              onChange={(event) => w.config({ healthTimeoutMs: Number(event.target.value) })}
            />
          </Field>
          <Field label={t('minimumFreeRam')}>
            <div className="m4a-range">
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={(e.config.minimumFreeRamFraction ?? 0.5) * 100}
                onChange={(event) => w.config({ minimumFreeRamFraction: Number(event.target.value) / 100 })}
              />
              <output>{Math.round((e.config.minimumFreeRamFraction ?? 0.5) * 100)}%</output>
            </div>
          </Field>
          <Field label={t('minimumFreeVram')}>
            <div className="m4a-range">
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={(e.config.minimumFreeVramFraction ?? 0.5) * 100}
                onChange={(event) => w.config({ minimumFreeVramFraction: Number(event.target.value) / 100 })}
              />
              <output>{Math.round((e.config.minimumFreeVramFraction ?? 0.5) * 100)}%</output>
            </div>
          </Field>
          <Field label={t('embeddingIdleTimeout')}>
            <input
              type="number"
              min={0}
              value={e.setup.embeddingIdleTimeout}
              onChange={(event) => w.setup({ embeddingIdleTimeout: Number(event.target.value) })}
            />
          </Field>
        </div>
        <Toggle
          label={t('stopOnUnload')}
          checked={e.config.stopOnUnload ?? true}
          onChange={(stopOnUnload) => w.config({ stopOnUnload })}
        />
        <Toggle
          label={t('logOutput')}
          checked={e.config.logOutput ?? true}
          onChange={(logOutput) => w.config({ logOutput })}
        />
      </Disclosure>
      <Disclosure title={t('customArguments')} icon={Code2}>
        <ExtraArguments workspace={w} t={t} />
        {preview && (
          <Disclosure title={t('launchPreview')}>
            <pre className="m4a-code">{preview}</pre>
          </Disclosure>
        )}
      </Disclosure>
    </div>
  )
}
