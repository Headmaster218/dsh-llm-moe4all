import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('package is an installable DSH bundle', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(manifest.name, 'dsh-llm-moe4all')
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.match(manifest.engines.dsh, /0\.1\.1-rc\.2/)
  assert.match(manifest.engines.dsh, /0\.1\.5/)
})

test('bundle wires both the DSH adapter and engine manager', async () => {
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
  assert.match(patch, /id: llm-pi-ai/)
  assert.match(patch, /id: moe4all-engine/)
  assert.match(patch, /name: dsh-llm-moe4all/)
  assert.match(patch, /127\.0\.0\.1:1234/)
})
