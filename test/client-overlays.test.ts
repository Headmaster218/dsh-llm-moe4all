import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import type { ReactElement } from 'react'

test('update notice reacts to loaded settings without leaking into the Agent bundle', async () => {
  const require = createRequire(import.meta.url)
  let snapshot: { value?: { bundledDistribution: boolean } } = {}
  let subscriber: (() => void) | undefined
  let notices = 0
  let overlay: (() => ReactElement<{ children: unknown[] }>) | undefined
  const scope = {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => { subscriber = listener; return () => {} },
  }
  const react = {
    ...require('react'),
    useSyncExternalStore(subscribe: (listener: () => void) => () => void, read: () => unknown) {
      subscribe(() => { notices++ })
      return read()
    },
  }
  runInNewContext(await readFile(new URL('../lib/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load(entry: { factory: (require: (name: string) => unknown) => { apply(ctx: unknown): void } }) {
      entry.factory(name => name === 'react' ? react : require(name)).apply({
        get: (name: string) => name === 'settingsScope' ? { bind: () => scope } : undefined,
        effect() {},
        inject() {},
        locale: { bind: () => (key: string) => key },
        slots: {
          inject: (_name: string, mount: () => void) => mount(),
          register: (spec: { id: string }, render: typeof overlay) => {
            if (spec.id === 'moe4all-overlays') overlay = render
            return () => {}
          },
        },
      })
    } } },
  })
  assert.ok(overlay)
  assert.equal(overlay().props.children.at(-1), false)
  assert.ok(subscriber, 'the overlay must subscribe while settings are loading')
  snapshot = { value: { bundledDistribution: false } }
  subscriber()
  assert.equal(notices, 1)
  assert.ok(overlay().props.children.at(-1), 'standalone updates become available after loading')
  snapshot = { value: { bundledDistribution: true } }
  subscriber()
  assert.equal(overlay().props.children.at(-1), false)
})
