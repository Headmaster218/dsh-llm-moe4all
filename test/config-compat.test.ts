import assert from 'node:assert/strict'
import test from 'node:test'

import { resolvePluginConfig, type Config } from '../src/index.js'

test('DSH 0.2 volatile config values resolve to plain plugin settings', () => {
  const config = {
    mode: { get: () => 'connect' },
    port: { get: () => 18_080 },
    arguments: ['--parallel', '2'],
  } as unknown as Config

  assert.deepEqual(resolvePluginConfig(config), {
    mode: 'connect',
    port: 18_080,
    arguments: ['--parallel', '2'],
  })
})

test('legacy DSH plain config values remain unchanged', () => {
  const config = {
    mode: 'prompt',
    port: 8080,
    arguments: [],
  } as Config

  assert.deepEqual(resolvePluginConfig(config), config)
})
