import assert from 'node:assert/strict'
import test from 'node:test'

import {
  settingsStoreForContext,
  type SettingsStore,
} from '../src/client/settings-store.js'

function store(name: string): SettingsStore<{ name: string }> {
  return {
    getSnapshot: () => ({
      status: 'ready',
      value: { name },
      base: {},
      user: {},
      revision: 1,
      writable: true,
      mode: 'host',
    }),
    subscribe: () => () => {},
    set: async () => true,
    unset: async () => true,
  }
}

test('DSH 0.2 configuration forms take precedence when available', () => {
  const modern = store('modern')
  let legacyUsed = false
  const selected = settingsStoreForContext({
    configForms: {
      get: <T>(entryId: string) => {
        assert.equal(entryId, 'moe4all-engine')
        return modern as SettingsStore<T>
      },
    },
    settingsScope: {
      bind: <T>() => {
        legacyUsed = true
        return store('legacy') as SettingsStore<T>
      },
    },
  }, 'moe4all-engine')

  assert.equal(selected, modern)
  assert.equal(legacyUsed, false)
})

test('legacy DSH settings scope remains the fallback', () => {
  const legacy = store('legacy')
  const selected = settingsStoreForContext({
    settingsScope: {
      bind: <T>({ namespace }: { namespace: string }) => {
        assert.equal(namespace, 'moe4all-engine')
        return legacy as SettingsStore<T>
      },
    },
  }, 'moe4all-engine')

  assert.equal(selected, legacy)
})
