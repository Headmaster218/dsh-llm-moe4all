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
      '-File',
      join(testDirectory, 'release-installer-repair.ps1'),
      '-Installer',
      fileURLToPath(new URL('../installer/install-plugin.ps1', import.meta.url)),
      '-Root',
      root,
    ], { encoding: 'utf8', input: '2\n', timeout: 15_000 })
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
    assert.match(result.stdout, /repair and rollback: OK/u)
    assert.match(result.stdout, /target and launcher selection: OK/u)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('README install links offer the stable ZIP and a releases fallback', async () => {
  const english = await read('../README.md')
  const chinese = await read('../README.zh.md')
  const manifest = JSON.parse(await read('../package.json')) as { version: string }
  const asset = `/releases/download/release-${manifest.version}/dsh-llm-moe4all-windows.zip`

  for (const readme of [english, chinese]) {
    assert.match(readme, /https:\/\/github\.com\/Headmaster218\/dsh-llm-moe4all\/releases/u)
    assert.ok(readme.includes(asset), 'README must link to the current package version')
    assert.doesNotMatch(readme, /\/releases\/latest\/download\//u)
  }
})

test('release publication waits for reusable compatibility CI and validates assets', async () => {
  const release = await read('../.github/workflows/release.yml')
  const ci = await read('../.github/workflows/ci.yml')
  assert.match(release, /uses: \.\/\.github\/workflows\/ci\.yml/u)
  assert.match(release, /needs: validation/u)
  assert.match(release, /check-release\.ps1/u)
  assert.match(release, /release-notes\.mjs/u)
  assert.match(release, /--notes-file/u)
  assert.match(ci, /workflow_call:/u)
  assert.match(ci, /git diff --exit-code -- lib/u)
  assert.match(ci, /npm install --global pnpm@11\.7\.0/u)
  assert.match(ci, /prepare-compat-dependencies\.mjs/u)
  assert.match(ci, /npm ci --prefix \$runtime/u)
  assert.match(ci, /runs-on: windows-2025/u)
  assert.doesNotMatch(ci, /--package-lock=false|windows-latest/u)
})

test('release scripts parse on Windows PowerShell 5.1 and reject mismatched tags', { skip: process.platform !== 'win32' }, async () => {
  const builder = fileURLToPath(new URL('../scripts/build-release.ps1', import.meta.url))
  const checker = fileURLToPath(new URL('../scripts/check-release.ps1', import.meta.url))
  for (const script of [builder, checker]) {
    const parsing = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
      '$tokens = $null; $errors = $null; [System.Management.Automation.Language.Parser]::ParseFile($env:M4A_TEST_SCRIPT, [ref]$tokens, [ref]$errors) | Out-Null; if ($errors.Count) { $errors | Out-String | Write-Error; exit 1 }',
    ], { encoding: 'utf8', timeout: 10_000, env: { ...process.env, M4A_TEST_SCRIPT: script } })
    assert.equal(parsing.status, 0, parsing.stdout + parsing.stderr)
  }
  const mismatch = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', builder,
    '-ExpectedTag', 'release-999.0.0',
  ], { encoding: 'utf8', timeout: 10_000 })
  assert.notEqual(mismatch.status, 0)
  assert.match(mismatch.stderr, /does not match package version/u)
})
