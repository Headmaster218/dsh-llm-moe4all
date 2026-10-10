export interface SettingsStoreSnapshot<T> {
  status: 'loading' | 'ready' | 'unavailable'
  value: T | undefined
  base: unknown
  user: unknown
  revision: number | undefined
  writable: boolean
  mode: 'host' | 'memory'
}

export interface SettingsStore<T> {
  getSnapshot(): SettingsStoreSnapshot<T>
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<unknown>
  unset(field: string): Promise<unknown>
}

export interface LegacySettingsBinder {
  bind<T>(spec: { namespace: string }): SettingsStore<T>
}

export interface ConfigFormsProvider {
  get<T>(entryId: string): SettingsStore<T>
}

export interface SettingsStoreContext {
  get?(name: string): unknown
  settingsScope?: LegacySettingsBinder
  configForms?: ConfigFormsProvider
}

export function settingsStoreForContext<T>(
  context: SettingsStoreContext,
  namespace: string,
): SettingsStore<T> | undefined {
  const configForms = context.get === undefined
    ? context.configForms
    : context.get('configForms') as ConfigFormsProvider | undefined
  const settingsScope = context.get === undefined
    ? context.settingsScope
    : context.get('settingsScope') as LegacySettingsBinder | undefined
  return configForms?.get<T>(namespace)
    ?? settingsScope?.bind<T>({ namespace })
}
