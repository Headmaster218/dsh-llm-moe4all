import assert from 'node:assert/strict'
import test from 'node:test'

import type { Config } from '../src/index.js'
import { needsFirstRunSetup } from '../src/client/Moe4AllOnboarding.js'

function config(overrides: Partial<Config> = {}): Config {
  return {
    mode: 'managed',
    executable: '',
    arguments: [],
    ...overrides,
  } as Config
}

test('first-run setup opens only for an incomplete local configuration', () => {
  assert.equal(needsFirstRunSetup(undefined), false)
  assert.equal(needsFirstRunSetup(config()), true)
  assert.equal(needsFirstRunSetup(config({ executable: 'infr.exe' })), true)
  assert.equal(needsFirstRunSetup(config({ executable: 'infr.exe', arguments: ['serve', 'model.gguf'] })), false)
  assert.equal(needsFirstRunSetup(config({ mode: 'connect' })), false)
})
