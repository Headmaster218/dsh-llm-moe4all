import assert from 'node:assert/strict'
import test from 'node:test'

import { settingsNamespace } from '../src/settings-compat.js'

test('settings namespaces remain compatible across supported DSH lines', () => {
  assert.equal(settingsNamespace('moe4all-engine'), 'moe4all-engine')
  assert.throws(() => settingsNamespace('MoE4All Engine'), /must match/u)
})
