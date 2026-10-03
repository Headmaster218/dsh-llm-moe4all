import type { SettingsNamespace } from '@deepseek-ai/dsh-settings'

const NAMESPACE_PATTERN = /^[a-z][a-z0-9-]*$/u

export function settingsNamespace(value: string): SettingsNamespace {
  if (!NAMESPACE_PATTERN.test(value)) {
    throw new TypeError(`settings namespace "${value}" must match ${String(NAMESPACE_PATTERN)}`)
  }
  return value as SettingsNamespace
}
