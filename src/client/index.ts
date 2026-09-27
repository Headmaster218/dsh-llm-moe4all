import { createElement } from 'react'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { ClientContext, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'

import type { Config } from '../index.js'
import { EngineStartupOverlay } from './EngineStartupOverlay.js'
import { Moe4AllSettings, type Moe4AllSettingsInjected } from './Moe4AllSettings.js'
import { en, zh } from './locales.js'
import { styles } from './styles.js'

export const inject = ['slots', 'locale', 'settingsScope']
const SETTINGS_NAMESPACE = 'moe4all-engine'

function changedFields(current: Config, next: Config): Array<keyof Config> {
  return (Object.keys(next) as Array<keyof Config>).filter(field => (
    JSON.stringify(current[field]) !== JSON.stringify(next[field])
  ))
}

export function apply(ctx: ClientContext): void {
  const scope: SettingsScope<Config> = ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE })

  ctx.effect(() => ctx.locale.register('settings.moe4all', { zh, en }), 'moe4all-engine: settings dictionaries')
  ctx.effect(() => {
    const tag = document.createElement('style')
    tag.dataset.plugin = 'dsh-llm-moe4all'
    tag.textContent = styles
    document.head.appendChild(tag)
    return () => { tag.remove() }
  }, 'moe4all-engine: settings styles')

  const injected = (): Moe4AllSettingsInjected => ({
    hooks: { moe4AllSettings: scope },
    async save(next: Config): Promise<void> {
      const current = scope.getSnapshot().value
      if (current === undefined) return
      await Promise.all(changedFields(current, next).map(field => scope.set(field, next[field])))
    },
  })

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'moe4all',
    order: 15,
    label: () => ctx.locale.bind('settings.moe4all')('nav'),
    locale: 'settings.moe4all',
    inject: injected,
  }, Moe4AllSettings))

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'moe4all-engine-startup',
    label: () => 'MoE4All',
  }, () => createElement(EngineStartupOverlay, {
    scope,
    t: ctx.locale.bind('settings.moe4all'),
  })))
}

const plugin = { inject, apply }

export default plugin

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'shell.overlay': { kind: 'list'; scope: 'root' }
  }
}
