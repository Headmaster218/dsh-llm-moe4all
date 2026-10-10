import { mkdir, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { join, resolve } from 'node:path'

const [entryArgument, homeArgument] = process.argv.slice(2)
if (!entryArgument || !homeArgument) {
  throw new Error('usage: node scripts/smoke-official-dsh.mjs <dsh-entry> <dsh-home>')
}

const entry = resolve(entryArgument)
const dshHome = resolve(homeArgument)
const patchPath = join(dshHome, 'moe4all-ci-smoke.patch.yml')
await mkdir(dshHome, { recursive: true })
await writeFile(patchPath, '- id: moe4all-engine\n  config:\n    mode: connect\n', 'utf8')

const child = spawn(process.execPath, [
  entry,
  '--profile', 'web',
  '--patch', patchPath,
  '--host', '127.0.0.1',
  '--port', '17474',
  '--no-open',
], {
  env: { ...process.env, DSH_HOME: dshHome },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let output = ''
let settled = false
let startupUrl
let startupResolve
let startupReject
const startup = new Promise((resolvePromise, rejectPromise) => {
  startupResolve = resolvePromise
  startupReject = rejectPromise
})

function inspect(chunk) {
  const text = chunk.toString()
  output += text
  process.stdout.write(text.replace(/(\?token=)[^\s]+/giu, '$1<redacted>'))
  if (/entry did not activate|failed to apply loader entry|plugin tree failed to load/iu.test(output)) {
    startupReject(new Error('DSH reported a plugin activation failure'))
    return
  }
  const match = output.match(/dsh web:\s+(https?:\/\/\S+)/iu)
  if (match && !startupUrl) {
    startupUrl = match[1]
    startupResolve(startupUrl)
  }
}

child.stdout.on('data', inspect)
child.stderr.on('data', inspect)
child.once('exit', (code, signal) => {
  if (!settled) startupReject(new Error(`DSH exited before the smoke check completed (code=${code}, signal=${signal})`))
})

const timeout = setTimeout(() => {
  startupReject(new Error('Timed out waiting for the official DSH web host'))
}, 90_000)

try {
  const url = await startup
  const authorization = await fetch(url, { redirect: 'manual' })
  if (authorization.status !== 303) {
    throw new Error(`DSH browser authentication returned HTTP ${authorization.status}`)
  }
  const cookie = authorization.headers.get('set-cookie')?.split(';', 1)[0]
  const location = authorization.headers.get('location')
  if (!cookie || !location) throw new Error('DSH browser authentication did not return its session cookie')
  const response = await fetch(new URL(location, url), { headers: { cookie } })
  if (!response.ok) throw new Error(`DSH web host returned HTTP ${response.status}`)
  await new Promise(resolvePromise => setTimeout(resolvePromise, 1_000))
  if (/entry did not activate|failed to apply loader entry|plugin tree failed to load/iu.test(output)) {
    throw new Error('DSH reported a plugin activation failure')
  }
  console.log(`Official DSH runtime smoke passed: ${response.status}`)
} finally {
  settled = true
  clearTimeout(timeout)
  if (child.exitCode === null && child.signalCode === null) child.kill()
}
