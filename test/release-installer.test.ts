import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const read = async (path: string): Promise<string> => readFile(new URL(path, import.meta.url), 'utf8')

test('Windows release installer uses and persists the bundled package', async () => {
  const installer = await read('../installer/install-plugin.ps1')
  const builder = await read('../scripts/build-release.ps1')

  assert.match(installer, /Join-Path \$PSScriptRoot 'dsh-llm-moe4all\.tgz'/u)
  assert.match(installer, /Join-Path \$targetHome 'plugin-packages'/u)
  assert.match(installer, /Copy-Item -LiteralPath \$archive -Destination \$cachedArchive/u)
  assert.doesNotMatch(installer, /github:Headmaster218\/dsh-llm-moe4all/u)
  assert.match(builder, /PLUGIN-VERSION\.txt/u)
})

test('README install links work for prerelease-only repositories', async () => {
  const english = await read('../README.md')
  const chinese = await read('../README.zh.md')

  for (const readme of [english, chinese]) {
    assert.match(readme, /https:\/\/github\.com\/Headmaster218\/dsh-llm-moe4all\/releases/u)
    assert.doesNotMatch(readme, /\/releases\/latest\/download\//u)
  }
})
