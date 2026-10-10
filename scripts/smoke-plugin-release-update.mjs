import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { join, resolve } from 'node:path'
import { c as createTar, x as extractTar } from 'tar'
import semver from 'semver'

const [entryArg, homeArg, archiveArg] = process.argv.slice(2)
if (!entryArg || !homeArg || !archiveArg) throw new Error('usage: smoke-plugin-release-update.mjs <DSH CLI> <fresh isolated home> <plugin tgz>')
const entry = resolve(entryArg)
const home = resolve(homeArg)
const archive = resolve(archiveArg)
const profile = join(home, 'profiles', 'web')
assert.ok(!existsSync(join(profile, 'package.json')), 'Refusing to change an existing DSH profile. Use a fresh isolated test home.')
await mkdir(home, { recursive: true })
const environment = { ...process.env, DSH_HOME: home, DSH_AGENTS_HOME: join(home, 'agents'), CI: 'true' }
const command = args => new Promise((done, reject) => {
  const child = spawn(process.execPath, [entry, ...args], { cwd: home, env: environment, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
  let output = ''
  child.stdout.on('data', chunk => { output = (output + chunk).slice(-16_000) })
  child.stderr.on('data', chunk => { output = (output + chunk).slice(-16_000) })
  const timer = setTimeout(() => { child.kill(); reject(new Error('DSH setup timed out')) }, 120_000)
  child.on('error', reject)
  child.on('close', code => {
    clearTimeout(timer)
    code === 0 ? done(output) : reject(new Error(`DSH setup exit ${code}: ${output}`))
  })
})
await command(['--profile', 'web', '--dump-config'])
await command(['plugin', '--profile', 'web', 'add', archive, '--ignore-scripts'])

const otherPlugin = join(home, 'preserved-plugin', 'package')
await mkdir(otherPlugin, { recursive: true })
await writeFile(join(otherPlugin, 'package.json'), JSON.stringify({
  name: 'dsh-update-preservation-fixture', version: '1.0.0', type: 'module', main: 'index.js',
  dsh: { bundle: { patch: './cordis.patch.yml' } },
}))
await writeFile(join(otherPlugin, 'index.js'), 'export const name = "update-preservation-fixture"; export function apply() {}\n')
await writeFile(join(otherPlugin, 'cordis.patch.yml'), '- insert:\n    - id: update-preservation-fixture\n      name: dsh-update-preservation-fixture\n')
const otherArchive = join(home, 'preserved-plugin.tgz')
await createTar({ gzip: true, file: otherArchive, cwd: join(home, 'preserved-plugin') }, ['package'])
await command(['plugin', '--profile', 'web', 'add', otherArchive, '--ignore-scripts'])
const packageBefore = JSON.parse(await readFile(join(profile, 'package.json'), 'utf8'))
const unpacked = join(home, 'update-fixture')
await mkdir(unpacked)
await extractTar({ file: archive, cwd: unpacked, strict: true })
const fixtureManifest = JSON.parse(await readFile(join(unpacked, 'package', 'package.json'), 'utf8'))
const oldVersion = fixtureManifest.version
const newVersion = semver.inc(oldVersion, 'patch')
fixtureManifest.version = newVersion
await writeFile(join(unpacked, 'package', 'package.json'), `${JSON.stringify(fixtureManifest, null, 2)}\n`)
const newArchive = join(home, 'target-plugin.tgz')
await createTar({ gzip: true, file: newArchive, cwd: unpacked }, ['package'])
const bytes = await readFile(newArchive)
const base = `https://github.com/Headmaster218/dsh-llm-moe4all/releases/download/release-${newVersion}/`
const fixturePath = join(home, 'release-fixture.json')
const fixture = {
  archive: newArchive,
  release: { tag_name: `release-${newVersion}`, prerelease: false, draft: false, assets: [
    { name: 'dsh-llm-moe4all.tgz', size: bytes.length, browser_download_url: `${base}dsh-llm-moe4all.tgz` },
    { name: 'SHA256SUMS.txt', browser_download_url: `${base}SHA256SUMS.txt` },
  ] },
  checksum: `${createHash('sha256').update(bytes).digest('hex')}  dsh-llm-moe4all.tgz\n`,
}
await writeFile(fixturePath, JSON.stringify(fixture))
const patch = join(home, 'isolated-test.patch.yml')
await writeFile(patch, '- id: moe4all-engine\n  config:\n    mode: connect\n    endpoint: http://127.0.0.1:1/v1\n    arguments: [preserve-test-setting]\n')
const protectedFiles = [patch, join(profile, 'pnpm-workspace.yaml'), join(profile, 'node_modules', 'dsh-update-preservation-fixture', 'index.js')]
await writeFile(join(home, 'conversation-preservation.txt'), 'Do not touch this conversation fixture.')
protectedFiles.push(join(home, 'conversation-preservation.txt'))
const preserved = await Promise.all(protectedFiles.map(path => readFile(path)))

let child
let output = ''
async function stop() {
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  const exit = once(child, 'exit')
  child.kill()
  let timer
  try { await Promise.race([exit, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Test DSH did not stop')), 5000) })]) }
  finally { clearTimeout(timer) }
}
async function boot() {
  const portReservation = createServer()
  portReservation.listen(0, '127.0.0.1')
  await once(portReservation, 'listening')
  const port = portReservation.address().port
  await new Promise(done => portReservation.close(done))
  output = ''
  child = spawn(process.execPath, [
    '--import', new URL('./plugin-update-fixture-preload.mjs', import.meta.url).href,
    entry, '--profile', 'web', '--patch', patch, '--host', '127.0.0.1', '--port', String(port), '--no-open',
  ], { cwd: home, env: { ...environment, MOE4ALL_UPDATE_FIXTURE: fixturePath }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', chunk => { output = (output + chunk).slice(-128_000) })
  child.stderr.on('data', chunk => { output = (output + chunk).slice(-128_000) })
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Isolated DSH exited: ${output.replace(/([?&]token=)[^\s]+/gi, '$1<redacted>')}`)
    const match = output.match(/dsh web:\s+(https?:\/\/\S+)/i)
    if (match) {
      const url = new URL(match[1])
      assert.equal(url.port, String(port))
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(5000) })
      const headers = {}
      if (url.searchParams.has('token')) {
        assert.equal(response.status, 303)
        headers.cookie = response.headers.get('set-cookie').split(';', 1)[0]
      } else assert.equal(response.status, 200)
      return { url, headers }
    }
    await new Promise(done => setTimeout(done, 100))
  }
  throw new Error('Isolated DSH startup timed out')
}
async function request(host, query = '', init = {}) {
  const response = await fetch(new URL(`/api/moe4all/plugin-update${query}`, host.url), {
    ...init, headers: { ...host.headers, ...init.headers }, signal: AbortSignal.timeout(45_000),
  })
  return { code: response.status, body: await response.json() }
}
try {
  const host = await boot()
  const status = await request(host, '?check=1')
  assert.equal(status.code, 200)
  assert.equal(status.body.status.installedVersion, oldVersion)
  assert.equal(status.body.status.updateAvailable, true)
  assert.equal(status.body.status.supported, true)
  const fenced = await request(host, '', { method: 'POST', headers: { origin: 'https://example.com' } })
  assert.equal(fenced.code, 403, 'Cross-origin update must be refused')
  // Fail checksum first, proving a real DSH profile remains byte-for-byte intact.
  const beforeBytes = await readFile(join(profile, 'package.json'))
  const lockBefore = await readFile(join(profile, 'pnpm-lock.yaml'))
  fixture.checksum = `${'0'.repeat(64)}  dsh-llm-moe4all.tgz\n`
  await writeFile(fixturePath, JSON.stringify(fixture))
  // Preload holds a fixed fixture; restart to load the intentionally invalid checksum.
  await stop()
  const badHost = await boot()
  await request(badHost, '?check=1')
  assert.equal((await request(badHost, '', { method: 'POST' })).code, 202)
  const wait = async host => {
    const phases = new Set()
    const deadline = Date.now() + 180_000
    while (Date.now() < deadline) {
      const current = await request(host)
      assert.equal(current.code, 200)
      const operation = current.body.status.operation
      phases.add(operation?.progress.phase)
      if (operation && !['running', 'queued'].includes(operation.state)) return { operation, phases }
      await new Promise(done => setTimeout(done, 100))
    }
    throw new Error('Plugin update did not finish')
  }
  const failed = await wait(badHost)
  assert.equal(failed.operation.state, 'failed')
  assert.match(failed.operation.failure.message, /SHA256/)
  assert.deepEqual(await readFile(join(profile, 'package.json')), beforeBytes)
  await stop()
  // A verified archive with a missing file dependency reaches the actual DSH installer and must roll back.
  fixtureManifest.dependencies['moe4all-update-missing-fixture'] = 'file:missing-update-fixture.tgz'
  await writeFile(join(unpacked, 'package', 'package.json'), JSON.stringify(fixtureManifest))
  const brokenArchive = join(home, 'broken-dependency-plugin.tgz')
  await createTar({ gzip: true, file: brokenArchive, cwd: unpacked }, ['package'])
  const brokenBytes = await readFile(brokenArchive)
  fixture.archive = brokenArchive
  fixture.release.assets[0].size = brokenBytes.length
  fixture.checksum = `${createHash('sha256').update(brokenBytes).digest('hex')}  dsh-llm-moe4all.tgz\n`
  await writeFile(fixturePath, JSON.stringify(fixture))
  const rollbackHost = await boot()
  await request(rollbackHost, '?check=1')
  assert.equal((await request(rollbackHost, '', { method: 'POST' })).code, 202)
  const rolledBack = await wait(rollbackHost)
  assert.equal(rolledBack.operation.state, 'rolled-back', rolledBack.operation.failure?.message)
  assert.deepEqual(await readFile(join(profile, 'package.json')), beforeBytes)
  assert.deepEqual(await readFile(join(profile, 'pnpm-lock.yaml')), lockBefore)
  await stop()
  fixture.archive = newArchive
  fixture.release.assets[0].size = bytes.length
  fixture.checksum = `${createHash('sha256').update(bytes).digest('hex')}  dsh-llm-moe4all.tgz\n`
  await writeFile(fixturePath, JSON.stringify(fixture))
  const goodHost = await boot()
  await request(goodHost, '?check=1')
  const started = await request(goodHost, '', { method: 'POST' })
  assert.equal(started.code, 202)
  const duplicate = await request(goodHost, '', { method: 'POST' })
  assert.equal(duplicate.code, 409)
  const finished = await wait(goodHost)
  assert.equal(finished.operation.state, 'succeeded', finished.operation.failure?.message)
  assert.equal(finished.operation.outcome.restartRequired, true)
  assert.ok(finished.phases.has('download'), 'Download progress must be observable')
  const packageAfter = JSON.parse(await readFile(join(profile, 'package.json'), 'utf8'))
  packageAfter.dependencies['dsh-llm-moe4all'] = packageBefore.dependencies['dsh-llm-moe4all']
  assert.deepEqual(packageAfter, packageBefore)
  for (let i = 0; i < protectedFiles.length; i++) assert.deepEqual(await readFile(protectedFiles[i]), preserved[i])
  await stop()
  const restarted = await boot()
  const current = await request(restarted, '?check=1')
  assert.equal(current.body.status.installedVersion, newVersion)
  assert.equal(current.body.status.updateAvailable, false)
  assert.equal(current.body.status.supported, true)
  console.log(JSON.stringify({ result: 'passed', oldVersion, newVersion, home, phases: [...finished.phases], checks: ['stable-check', 'download-progress', 'checksum-failure-no-mutation', 'real-install-failure-rollback', 'cross-origin-fence', 'duplicate-operation', 'profile-and-other-plugin-preservation', 'restart-activation'] }))
} finally { await stop() }
