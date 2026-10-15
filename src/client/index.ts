import { createElement, Fragment, useSyncExternalStore } from 'react'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'

import type { Config } from '../index.js'
import { allowsPluginSelfUpdate } from '../distribution-policy.js'
import { EngineStartupOverlay } from './EngineStartupOverlay.js'
import { FirstRunSettingsOverlay } from './Moe4AllOnboarding.js'
import { Moe4AllSettings, type Moe4AllSettingsInjected } from './Moe4AllSettings.js'
import { PluginUpdateNotice } from './PluginUpdateNotice.js'
import { RuntimeStatusDock } from './RuntimeStatus.js'
import { en, zh } from './locales.js'
import {
  settingsStoreForContext,
  type SettingsStore,
  type SettingsStoreContext,
} from './settings-store.js'
import { styles } from './styles.js'

export const inject = ['slots', 'locale']
const SETTINGS_NAMESPACE = 'moe4all-engine'

type SettingsClientContext = ClientContext & SettingsStoreContext

function changedFields(current: Config, next: Config): Array<keyof Config> {
  return (Object.keys(next) as Array<keyof Config>).filter(field => (
    JSON.stringify(current[field]) !== JSON.stringify(next[field])
  ))
}

function registerSurfaces(ctx: ClientContext, scope: SettingsStore<Config>): void {
  const pickDirectory = () => {
    const workspaces = ctx.get('workspaces')
    return workspaces?.pickDirectory() ?? Promise.resolve(null)
  }
  const save = async (next: Config): Promise<void> => {
    const current = scope.getSnapshot().value
    if (current === undefined) return
    await Promise.all(changedFields(current, next).map(field => scope.set(field, next[field])))
  }

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
    pickDirectory,
    save,
  })

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'moe4all',
    order: 20,
    label: () => ctx.locale.bind('settings.moe4all')('nav'),
    locale: 'settings.moe4all',
    inject: injected,
  }, Moe4AllSettings))

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'moe4all-overlays',
    label: () => 'MoE4All',
  }, () => {
    const snapshot = useSyncExternalStore(
      listener => scope.subscribe(listener),
      () => scope.getSnapshot(),
      () => scope.getSnapshot(),
    )
    return createElement(Fragment, null,
    createElement(FirstRunSettingsOverlay, {
      scope,
      t: ctx.locale.bind('settings.moe4all'),
      pickDirectory,
      save,
    }),
    createElement(EngineStartupOverlay, {
      scope,
      t: ctx.locale.bind('settings.moe4all'),
    }),
    allowsPluginSelfUpdate(snapshot.value) && createElement(PluginUpdateNotice, {
      t: ctx.locale.bind('settings.moe4all'),
    }),
    )
  }))

  ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
    name: 'conversation.composer.dock',
    id: 'moe4all-runtime',
    order: -20,
    label: () => 'MoE4All',
  }, () => createElement(RuntimeStatusDock, {
    scope,
    t: ctx.locale.bind('settings.moe4all'),
  })))
}

export function apply(ctx: ClientContext): void {
  const dynamic = ctx as SettingsClientContext
  let mounted = false
  const mount = (scoped: SettingsClientContext, scope: SettingsStore<Config>) => {
    if (mounted) return
    mounted = true
    scoped.effect(() => () => { mounted = false }, 'moe4all-engine: settings client adapter')
    registerSurfaces(scoped, scope)
  }
  const available = settingsStoreForContext<Config>(dynamic, SETTINGS_NAMESPACE)
  if (available !== undefined) mount(dynamic, available)
  dynamic.inject(['configForms'], scoped => {
    const compatible = scoped as SettingsClientContext
    const scope = settingsStoreForContext<Config>(compatible, SETTINGS_NAMESPACE)
    if (scope) mount(compatible, scope)
  })
  dynamic.inject(['settingsScope'], scoped => {
    const compatible = scoped as SettingsClientContext
    const scope = settingsStoreForContext<Config>(compatible, SETTINGS_NAMESPACE)
    if (scope) mount(compatible, scope)
  })
}

const plugin = { inject, apply }

export default plugin

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'shell.overlay': { kind: 'list'; scope: 'root' }
    'conversation.composer.dock': { kind: 'list'; scope: 'session' }
  }
}
