import assert from 'node:assert/strict'
import test from 'node:test'
import { allowsPluginSelfUpdate, shouldBootstrapEngine } from '../src/distribution-policy.js'
import { PluginReleaseUpdater } from '../src/plugin-release-update.js'

test('bundled plugins and loading settings never offer standalone self-updates', async () => {
  assert.equal(allowsPluginSelfUpdate(undefined), false)
  assert.equal(allowsPluginSelfUpdate({ bundledDistribution: true }), false)
  assert.equal(allowsPluginSelfUpdate({}), true)
  const updater = new PluginReleaseUpdater({
    target: () => allowsPluginSelfUpdate({ bundledDistribution: true })
      ? { profileDirectory: 'unused', run: async () => assert.fail('must not install') }
      : undefined,
    fetch: async () => { assert.fail('must not download') },
  })
  try {
    assert.equal((await updater.status()).supported, false)
    await assert.rejects(updater.start())
  } finally {
    await updater.dispose()
  }
})

test('first-run bootstrap preserves standalone behavior and requires bundle opt-in', () => {
  assert.equal(shouldBootstrapEngine({}), true)
  assert.equal(shouldBootstrapEngine({ bundledDistribution: true }), false)
  assert.equal(shouldBootstrapEngine({ bundledDistribution: true, bootstrapEngineOnStart: true }), true)
  assert.equal(shouldBootstrapEngine({ mode: 'connect', bootstrapEngineOnStart: true }), false)
  assert.equal(shouldBootstrapEngine({ executable: 'infr.exe', bootstrapEngineOnStart: true }), false)
})
