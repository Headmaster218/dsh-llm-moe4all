import assert from 'node:assert/strict'
import { test } from 'node:test'

import { startupAdjustmentSuggestions } from '../src/client/startup-diagnostic.js'
import { workspaceEn, workspaceZh } from '../src/client/workspace-copy.js'

test('common startup adjustments follow the active Agent language', () => {
  const en = startupAdjustmentSuggestions(key => workspaceEn[key])
  const zh = startupAdjustmentSuggestions(key => workspaceZh[key])
  assert.equal(en.length, 4)
  assert.equal(zh.length, 4)
  assert(en.every(suggestion => typeof suggestion === 'string' && suggestion.length > 0))
  assert(zh.every(suggestion => typeof suggestion === 'string' && suggestion.length > 0))
  assert.notDeepEqual(en, zh)
})
