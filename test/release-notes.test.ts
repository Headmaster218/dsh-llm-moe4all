import assert from 'node:assert/strict'
import { test } from 'node:test'
import { releaseNotes } from '../scripts/release-notes.mjs'

test('release notes contain only the tagged changelog and working asset names', () => {
  const notes = releaseNotes('0.2.0', 'release-0.2.0', '# Changelog\r\n\r\n## Unreleased\r\n\r\n## 0.2.0\r\n\r\n- Stable change.\r\n\r\n## 0.1.0\r\n\r\n- Old change.\r\n')
  assert.match(notes, /Stable change/u)
  assert.doesNotMatch(notes, /Old change|Unreleased/u)
  assert.match(notes, /download\/release-0\.2\.0\/dsh-llm-moe4all-windows\.zip/u)
  assert.match(notes, /DSH 0\.1\.1-rc\.2, 0\.1\.5-rc\.3, and 0\.2\.0-rc\.2/u)
  assert.match(notes, /首次尚未配置/u)
  assert.doesNotMatch(notes, /## Plugin updates/u)
})

test('self-update releases explain the one-time installer upgrade', () => {
  const notes = releaseNotes('0.2.1', 'release-0.2.1', '## 0.2.1\n- GitHub Release self-updates.\n')
  assert.match(notes, /## Plugin updates/u)
  assert.match(notes, /Existing 0\.2\.0 installations must run this newer installer once/u)
  assert.match(notes, /同一 DSH 目录升级一次/u)
  assert.match(notes, /Plugin updates do not update the MoE4All Engine/u)
})

test('release notes reject missing changelogs and mismatched tags', () => {
  assert.throws(() => releaseNotes('0.2.0', 'release-0.2.1', '## 0.2.0\n- Change.'), /tag must match/u)
  assert.throws(() => releaseNotes('0.2.0', 'v0.2.0', '## Unreleased\n- Change.'), /missing changelog/u)
})
