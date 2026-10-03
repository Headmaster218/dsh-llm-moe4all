import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const read = async (path: string): Promise<string> => readFile(new URL(path, import.meta.url), 'utf8')
const testDirectory = dirname(fileURLToPath(import.meta.url))

test('Windows release installer uses and persists the bundled package', async () => {
  const installer = await read('../installer/install-plugin.ps1')
  const builder = await read('../scripts/build-release.ps1')

  assert.match(installer, /Join-Path \$PSScriptRoot 'dsh-llm-moe4all\.tgz'/u)
  assert.match(installer, /Join-Path \$target\.Home 'plugin-packages'/u)
  assert.match(installer, /Copy-Item -LiteralPath \$archive -Destination \$cachedArchive/u)
  assert.match(installer, /Select-DshTarget/u)
  assert.match(installer, /Enter another DSH_HOME/u)
  assert.match(installer, /Set-ProfilePluginDependency/u)
  assert.match(installer, /Restore-ProfilePluginDependency/u)
  assert.doesNotMatch(installer, /github:Headmaster218\/dsh-llm-moe4all/u)
  assert.match(builder, /PLUGIN-VERSION\.txt/u)
})

test('stale Git dependency repair is scoped and byte-restorable', { skip: process.platform !== 'win32' }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'moe4all-installer-test-'))
  const expectedPrefix = resolve(tmpdir()) + sep
  assert.ok(resolve(root).startsWith(expectedPrefix))
  try {
    const result = spawnSync('powershell.exe', [
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-File',
      join(testDirectory, 'release-installer-repair.ps1'),
      '-Installer',
      fileURLToPath(new URL('../installer/install-plugin.ps1', import.meta.url)),
      '-Root',
      root,
    ], { encoding: 'utf8' })
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
    assert.match(result.stdout, /repair and rollback: OK/u)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('README install links work for prerelease-only repositories', async () => {
  const english = await read('../README.md')
  const chinese = await read('../README.zh.md')

  for (const readme of [english, chinese]) {
    assert.match(readme, /https:\/\/github\.com\/Headmaster218\/dsh-llm-moe4all\/releases/u)
    assert.doesNotMatch(readme, /\/releases\/latest\/download\//u)
  }
})
