import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { join, resolve } from 'node:path'

const [entryArgument, homeArgument] = process.argv.slice(2)
if (!entryArgument || !homeArgument) {
  throw new Error('usage: node scripts/smoke-official-dsh.mjs <dsh-entry> <dsh-home>')
}

const entry = resolve(entryArgument)
const dshHome = resolve(homeArgument)
await mkdir(dshHome, { recursive: true })
const modelId = 'MoE4All-CI-Model'
const engine = createServer((request, response) => {
  response.setHeader('content-type', 'application/json')
  if (request.url === '/health') response.end(JSON.stringify({ status: 'ok' }))
  else if (request.url === '/v1/models') response.end(JSON.stringify({ data: [{ id: modelId }] }))
  else { response.writeHead(404); response.end('{}') }
})
engine.listen(0, '127.0.0.1')
await once(engine, 'listening')

let child
let timeout
const abort = new AbortController()
try {
  const endpoint = `http://127.0.0.1:${engine.address().port}/v1`
  const patchPath = join(dshHome, 'moe4all-ci-smoke.patch.yml')
  await writeFile(patchPath, [
    '- id: moe4all-engine', '  config:', '    mode: connect',
    `    endpoint: ${JSON.stringify(endpoint)}`, '    modelRefreshIntervalMs: 1000', '',
  ].join('\n'), 'utf8')

  const reservation = createServer()
  reservation.listen(0, '127.0.0.1')
  await once(reservation, 'listening')
  const port = reservation.address().port
  await new Promise((done, reject) => reservation.close(error => error ? reject(error) : done()))
  let fail
  const failure = new Promise((_, reject) => { fail = reject })
  let startupResolve
  const startup = new Promise(done => { startupResolve = done })
  timeout = setTimeout(() => {
    abort.abort()
    fail(new Error('Official DSH smoke exceeded its 90-second deadline'))
  }, 90_000)

  child = spawn(process.execPath, [
    entry, '--profile', 'web', '--patch', patchPath,
    '--host', '127.0.0.1', '--port', String(port), '--no-open',
  ], {
    cwd: dshHome,
    env: { ...process.env, DSH_HOME: dshHome, DSH_AGENTS_HOME: join(dshHome, 'agents') },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  let pendingLine = ''
  function inspect(chunk) {
    const text = chunk.toString()
    output = (output + text).slice(-256_000)
    pendingLine += text
    const lines = pendingLine.split(/\r?\n/u)
    pendingLine = lines.pop()
    for (const line of lines) console.log(line.replace(/([?&]token=)[^\s]+/giu, '$1<redacted>'))
    if (/entry did not activate|failed to apply loader entry|plugin tree failed to load/iu.test(output)) {
      fail(new Error('DSH reported a plugin activation failure'))
    }
    const match = output.match(/dsh web:\s+(https?:\/\/\S+)/iu)
    if (match) startupResolve(match[1])
  }
  child.stdout.on('data', inspect)
  child.stderr.on('data', inspect)
  child.once('error', fail)
  child.once('exit', (code, signal) => fail(new Error(`DSH exited during smoke (code=${code}, signal=${signal})`)))

  const checks = async () => {
    const url = await startup
    assert.equal(new URL(url).port, String(port), 'DSH must use the isolated smoke port')
    let response = await fetch(url, { redirect: 'manual', signal: abort.signal })
    const headers = {}
    if (new URL(url).searchParams.has('token')) {
      assert.equal(response.status, 303, 'DSH browser authentication failed')
      const cookie = response.headers.get('set-cookie')?.split(';', 1)[0]
      const location = response.headers.get('location')
      assert.ok(cookie && location, 'DSH did not return its browser session')
      headers.cookie = cookie
      response = await fetch(new URL(location, url), { headers, signal: abort.signal })
    }
    assert.equal(response.status, 200, 'DSH web host did not open')
    for (;;) {
      const statusResponse = await fetch(new URL('/api/moe4all/status', url), { headers, signal: abort.signal })
      assert.equal(statusResponse.status, 200, 'MoE4All control routes are not active')
      const status = await statusResponse.json()
      assert.equal(status.mode, 'connect')
      assert.equal(status.endpoint, endpoint)
      if (status.ready && status.models?.some(model => model.id === modelId)) {
        assert.equal(status.owned, false, 'Smoke must not launch an inference engine')
        console.log('Official DSH smoke passed: host access, plugin routes, native provider model discovery')
        return
      }
      await new Promise(done => setTimeout(done, 250))
    }
  }
  await Promise.race([checks(), failure])
} finally {
  clearTimeout(timeout)
  abort.abort()
  if (child && child.exitCode === null && child.signalCode === null) {
    await new Promise(done => {
      const shutdown = setTimeout(done, 5_000)
      child.once('exit', () => { clearTimeout(shutdown); done() })
      child.kill()
    })
  }
  engine.closeAllConnections()
  await new Promise(done => engine.close(done))
  assert.ok(!child || child.exitCode !== null || child.signalCode !== null, 'DSH smoke process did not stop')
}
