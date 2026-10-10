import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { c as createTar } from 'tar'
import { PluginReleaseUpdater, selectPluginRelease, validatePluginArchive, type PluginCommand } from '../src/plugin-release-update.js'

const name = 'dsh-llm-moe4all'
const base = `https://github.com/Headmaster218/${name}/releases/download/release-0.2.2/`
function release() {
  return { tag_name: 'release-0.2.2', draft: false, prerelease: false, assets: [
    { name: `${name}.tgz`, size: 1234, browser_download_url: `${base}${name}.tgz` },
    { name: 'SHA256SUMS.txt', browser_download_url: `${base}SHA256SUMS.txt` },
  ] }
}

async function fixture(t: test.TestContext) {
  const root = await mkdtemp(join(tmpdir(), 'moe4all-plugin-update-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const profile = join(root, 'profiles', 'web')
  const installed = join(profile, 'node_modules', name)
  const contents = join(root, 'contents', 'package')
  await mkdir(installed, { recursive: true })
  await mkdir(join(contents, 'lib'), { recursive: true })
  const packageInfo = { name, version: '0.2.2', dsh: { bundle: { patch: './cordis.patch.yml' } } }
  await writeFile(join(contents, 'package.json'), JSON.stringify(packageInfo))
  await writeFile(join(contents, 'lib', 'index.js'), 'export const name = "moe4all-engine"')
  await writeFile(join(contents, 'lib', 'client.js'), 'export default {}')
  await writeFile(join(contents, 'cordis.patch.yml'), '- insert: []')
  const archive = join(root, 'new.tgz')
  await createTar({ gzip: true, file: archive, cwd: join(root, 'contents') }, ['package'])
  const bytes = await readFile(archive)
  const oldArchive = join(root, 'old.tgz')
  await writeFile(oldArchive, 'old fixture archive')
  const packageBytes = Buffer.from(JSON.stringify({
    name: 'test-profile', dependencies: { [name]: `file:${oldArchive.replaceAll('\\', '/')}`, 'custom-plugin': 'file:custom.tgz' },
    dsh: { profile: { bundles: [name, 'custom-plugin'] } }, untouched: 'keep this',
  }, null, 4))
  const lockBytes = Buffer.from('lockfile fixture\n')
  await writeFile(join(profile, 'package.json'), packageBytes)
  await writeFile(join(profile, 'pnpm-lock.yaml'), lockBytes)
  await writeFile(join(installed, 'package.json'), JSON.stringify({ name, version: '0.2.1' }))
  const metadata = release()
  metadata.assets[0]!.size = bytes.length
  const hash = createHash('sha256').update(bytes).digest('hex')
  const fetcher = async (input: string | URL) => {
    const url = String(input)
    if (url.endsWith('/latest')) return Response.json(metadata)
    if (url.endsWith('SHA256SUMS.txt')) return new Response(`${hash}  ${name}.tgz\n`)
    return new Response(bytes)
  }
  const run: PluginCommand = async (args, _signal, log) => {
    log('fixture installer progress')
    await writeFile(join(installed, 'package.json'), JSON.stringify({ name, version: args.includes('--frozen-lockfile') ? '0.2.1' : '0.2.2' }))
  }
  return { root, profile, installed, archive, packageBytes, lockBytes, metadata, fetcher, run }
}

async function finish(updater: PluginReleaseUpdater) {
  for (let i = 0; i < 200; i++) {
    if (!['running', 'queued'].includes((await updater.status()).operation?.state ?? '')) {
      await updater.dispose()
      return
    }
    await new Promise(done => setTimeout(done, 10))
  }
  throw new Error('fixture update did not finish')
}

test('stable releases require trusted, bounded, checksummed prebuilt assets', () => {
  assert.equal(selectPluginRelease(release()).version, '0.2.2')
  assert.throws(() => selectPluginRelease({ ...release(), prerelease: true }), /stable/)
  assert.throws(() => selectPluginRelease({ ...release(), tag_name: 'release-0.2.3-rc.1' }), /stable/)
  const bad = release()
  bad.assets[0]!.browser_download_url = 'https://example.com/plugin.tgz'
  assert.throws(() => selectPluginRelease(bad), /official/)
})

test('validates package identity, version and prebuilt entry points', async t => {
  const f = await fixture(t)
  await validatePluginArchive(f.archive, '0.2.2')
  await assert.rejects(validatePluginArchive(f.archive, '0.2.3'), /expected prebuilt/)
})

test('a release incompatible with the running DSH is rejected before installation', async t => {
  const f = await fixture(t)
  const packagePath = join(f.root, 'contents', 'package', 'package.json')
  const info = JSON.parse(await readFile(packagePath, 'utf8'))
  info.engines = { dsh: '>=0.3.0' }
  await writeFile(packagePath, JSON.stringify(info))
  await createTar({ gzip: true, file: f.archive, cwd: join(f.root, 'contents') }, ['package'])
  await assert.rejects(validatePluginArchive(f.archive, '0.2.2', '0.2.0-rc.2'), /does not support DSH/)
})

test('an unsafe archive is rejected without an uncaught stream callback exception', async t => {
  const f = await fixture(t)
  const bad = join(f.root, 'unsafe.tgz')
  await writeFile(join(f.root, 'outside.txt'), 'not a plugin entry')
  await createTar({ gzip: true, file: bad, cwd: f.root }, ['outside.txt'])
  await assert.rejects(validatePluginArchive(bad, '0.2.2'), /Unsafe plugin archive/)
})

test('archive install updates only its dependency and retains profile settings', async t => {
  const f = await fixture(t)
  const updater = new PluginReleaseUpdater({ target: () => ({ profileDirectory: f.profile, run: f.run }), fetch: f.fetcher, runningVersion: '0.2.1' })
  assert.equal((await updater.check()).updateAvailable, true)
  await updater.start()
  await finish(updater)
  const status = await updater.status()
  assert.equal(status.operation?.state, 'succeeded')
  assert.equal(status.operation?.outcome.restartRequired, true)
  assert.equal(status.installedVersion, '0.2.2')
  const updated = JSON.parse(await readFile(join(f.profile, 'package.json'), 'utf8'))
  const before = JSON.parse(f.packageBytes.toString())
  updated.dependencies[name] = before.dependencies[name]
  assert.deepEqual(updated, before)
  assert.deepEqual(await readFile(join(f.profile, 'pnpm-lock.yaml')), f.lockBytes)
})

test('wrong SHA256 never changes the profile and offers retry', async t => {
  const f = await fixture(t)
  const fetcher = async (input: string | URL) => String(input).endsWith('SHA256SUMS.txt')
    ? new Response(`${'0'.repeat(64)}  ${name}.tgz\n`) : f.fetcher(input)
  const updater = new PluginReleaseUpdater({ target: () => ({ profileDirectory: f.profile, run: f.run }), fetch: fetcher, runningVersion: '0.2.1' })
  await updater.start()
  await finish(updater)
  assert.match((await updater.status()).operation!.failure!.message, /SHA256/)
  assert.deepEqual(await readFile(join(f.profile, 'package.json')), f.packageBytes)
})

test('failed install restores exact manifest, lockfile and previous version', async t => {
  const f = await fixture(t)
  let calls = 0
  const run: PluginCommand = async (...args) => {
    await f.run(...args)
    if (++calls === 1) throw new Error('fixture install failure')
  }
  const updater = new PluginReleaseUpdater({ target: () => ({ profileDirectory: f.profile, run }), fetch: f.fetcher, runningVersion: '0.2.1' })
  await updater.start()
  await finish(updater)
  assert.equal((await updater.status()).operation?.state, 'rolled-back')
  assert.equal(calls, 2)
  assert.deepEqual(await readFile(join(f.profile, 'package.json')), f.packageBytes)
  assert.deepEqual(await readFile(join(f.profile, 'pnpm-lock.yaml')), f.lockBytes)
})

test('development and market sources are never silently migrated', async t => {
  const f = await fixture(t)
  for (const spec of ['link:../../source', 'github:Headmaster218/dsh-llm-moe4all', '^0.2.1']) {
    await writeFile(join(f.profile, 'package.json'), JSON.stringify({ dependencies: { [name]: spec } }))
    const updater = new PluginReleaseUpdater({ target: () => ({ profileDirectory: f.profile, run: f.run }), fetch: () => { throw new Error('must not fetch') }, runningVersion: '0.2.1' })
    assert.equal((await updater.check()).supported, false)
    await assert.rejects(updater.start(), /No newer/)
  }
})

test('busy Engine or agent blocks mutation before any download', async t => {
  const f = await fixture(t)
  const updater = new PluginReleaseUpdater({ target: () => ({ profileDirectory: f.profile, run: f.run }), busy: () => true, fetch: f.fetcher, runningVersion: '0.2.1' })
  await assert.rejects(updater.start(), /Stop the managed Engine/)
  assert.deepEqual(await readFile(join(f.profile, 'package.json')), f.packageBytes)
})

test('a transient installer file lock is retried without rolling back a good update', async t => {
  const f = await fixture(t)
  let calls = 0
  const run: PluginCommand = async (...args) => {
    if (++calls === 1) throw new Error('EPERM: temporary pnpm-lock.yaml rename lock')
    await f.run(...args)
  }
  const updater = new PluginReleaseUpdater({ target: () => ({ profileDirectory: f.profile, run }), fetch: f.fetcher, runningVersion: '0.2.1' })
  await updater.start()
  await finish(updater)
  assert.equal((await updater.status()).operation?.state, 'succeeded')
  assert.equal(calls, 2)
})
