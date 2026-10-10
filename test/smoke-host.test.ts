import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { compatibilityManifest } from '../scripts/prepare-compat-dependencies.mjs'
import { pinnedHostManifest } from '../scripts/prepare-smoke-dsh.mjs'

test('smoke runtime pins transitive DSH components and shared client runtime', async () => {
  const manifest = await pinnedHostManifest('0.1.1-rc.2', '4.0.1', '3.18.1', async (name: string, version: string) => ({
    name, version, dependencies: name === '@deepseek-ai/dsh' ? {
      '@deepseek-ai/dsh-web-app': '^0.1.1-rc.2', '@deepseek-ai/cordis': '^4.0.1',
      '@deepseek-ai/cordis-plugin-loader': '^1.0.2',
    } : name === '@deepseek-ai/dsh-web-app' ? {
      '@deepseek-ai/dsh-client-runtime': '^0.1.1-rc.2', '@deepseek-ai/dsh-settings': '^0.1.1-rc.2',
      '@deepseek-ai/schemastery': '^3.18.1',
    } : {},
  }))
  assert.equal(manifest.overrides['@deepseek-ai/dsh-settings'], '0.1.1-rc.2')
  assert.equal(manifest.overrides['@deepseek-ai/cordis-plugin-loader'], '1.0.2')
  assert.equal(manifest.overrides['@deepseek-ai/dsh-client-runtime'], '0.1.1-rc.2')
  assert.equal(manifest.overrides['@deepseek-ai/schemastery'], '3.18.1')
})

test('smoke runtime rejects metadata that silently selects a different version', async () => {
  await assert.rejects(pinnedHostManifest('0.2.0-rc.2', '4.0.4', '3.18.4', async (name: string) => ({
    name, version: '0.1.7',
  })), /0\.1\.7/u)
})

test('compatibility dependency selection preserves current release metadata', () => {
  const current = { name: 'dsh-llm-moe4all', version: '0.3.0', dependencies: { tar: '7.5.22' }, devDependencies: { typescript: '5.9.3', '@deepseek-ai/dsh-settings': '0.2.0-rc.2' } }
  const fixture = { ...current, version: '0.2.1', devDependencies: { typescript: '5.9.3', '@deepseek-ai/dsh-settings': '0.1.1-rc.2' } }
  assert.equal(compatibilityManifest(current, fixture).version, current.version)
  assert.throws(() => compatibilityManifest({ ...current, dependencies: { tar: '8.0.0' } }, fixture), /Refresh the compatibility lockfiles/u)
})

test('all compatibility lock snapshots contain only registry packages with integrity hashes', async () => {
  const directories = [
    'dsh-runtimes/0.1.1-rc.2', 'dsh-runtimes/0.2.0-rc.2',
    'compat-dependencies/0.1.1-rc.2', 'compat-dependencies/0.1.5-rc.3',
  ]
  for (const directory of directories) {
    const fixture = new URL(`./fixtures/${directory}/`, import.meta.url)
    const manifest = JSON.parse(await readFile(new URL('package.json', fixture), 'utf8'))
    const lock = JSON.parse(await readFile(new URL('package-lock.json', fixture), 'utf8'))
    assert.equal(lock.lockfileVersion, 3)
    assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies)
    for (const [path, value] of Object.entries(lock.packages) as [string, { resolved?: string, integrity?: string }][]) {
      if (!path) continue
      assert.match(value.resolved ?? '', /^https:\/\/registry\.npmjs\.org\//u, `${directory}: ${path}`)
      assert.match(value.integrity ?? '', /^sha(?:1|256|384|512)-/u, `${directory}: ${path}`)
    }
  }
})
