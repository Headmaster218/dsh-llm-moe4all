import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { EngineStartupDiagnostic } from '../src/engine-controller.js'
import { localizeStartupDiagnostic } from '../src/client/startup-diagnostic.js'
import { workspaceEn, workspaceZh } from '../src/client/workspace-copy.js'

test('startup diagnostics follow the active Agent language', () => {
  const diagnostic: EngineStartupDiagnostic = {
    code: 'vram',
    summary: 'host fallback',
    suggestions: ['host fallback'],
    canRetryWithOneSlot: true,
  }
  const en = localizeStartupDiagnostic(diagnostic, key => workspaceEn[key])
  const zh = localizeStartupDiagnostic(diagnostic, key => workspaceZh[key])
  assert.match(en.summary, /VRAM/u)
  assert.match(zh.summary, /无法分配/u)
  assert.notEqual(en.suggestions[0], zh.suggestions[0])
})
