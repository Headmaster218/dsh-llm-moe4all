import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { access, mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { EngineReleaseManager, releaseFromTag, selectRelease, type GitHubRelease } from '../src/engine-release.js'

const archive = new TextEncoder().encode('test archive')
const digest = createHash('sha256').update(archive).digest('hex')
const release: GitHubRelease = {
  tag_name: 'release-0.8.0',
  name: 'MoE4All v0.8.0',
  html_url: 'https://github.com/Headmaster218/MoE4All/releases/tag/release-0.8.0',
  assets: [
    {
      name: 'MoE4All-Windows-x86_64-v0.8.0.zip',
      browser_download_url: 'https://example.test/engine.zip',
      size: archive.byteLength,
    },
    {
      name: 'MoE4All-Windows-x86_64-v0.8.0.zip.sha256',
      browser_download_url: 'https://example.test/engine.zip.sha256',
      size: 100,
    },
  ],
}

test('release selection pairs the Windows archive with its checksum', () => {
  const selected = selectRelease(release)
  assert.equal(selected.tag, 'release-0.8.0')
  assert.equal(selected.archive.name, 'MoE4All-Windows-x86_64-v0.8.0.zip')
  assert.equal(selected.checksum?.name, 'MoE4All-Windows-x86_64-v0.8.0.zip.sha256')
})

test('release-page fallback derives the official asset names from the tag', () => {
  const selected = releaseFromTag('release-0.8.0')
  assert.equal(selected.name, 'MoE4All v0.8.0')
  assert.equal(selected.archive.name, 'MoE4All-Windows-x86_64-v0.8.0.zip')
  assert.match(selected.archive.browser_download_url, /release-0\.8\.0\/MoE4All-Windows/u)
})

test('managed installation verifies the release and stores it outside plugin configuration', { skip: process.platform !== 'win32' }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'moe4all-release-test-'))
  try {
    const manager = new EngineReleaseManager(root, {
      async fetch(input) {
        const url = String(input)
        if (url.includes('/releases/latest')) return Response.json(release)
        if (url.endsWith('.sha256')) return new Response(`${digest}  ${release.assets[0]!.name}\n`)
        return new Response(archive)
      },
      async expandArchive(_path, destination) {
        await mkdir(join(destination, 'MoE4All'), { recursive: true })
        await writeFile(join(destination, 'MoE4All', 'infr.exe'), 'fake')
        await writeFile(join(destination, 'MoE4All', 'infr.toml'), 'preserved separately')
      },
    })

    const installed = await manager.installLatest()
    assert.match(installed.executable, /release-0\.8\.0.*infr\.exe$/u)
    const status = await manager.status(installed.executable)
    assert.equal(status.managed, true)
    assert.equal(status.updateAvailable, false)
    assert.equal(status.install.stage, 'complete')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('managed engine downloads can be cancelled and retried', async () => {
  const root = await mkdtemp(join(tmpdir(), 'moe4all-release-cancel-'))
  try {
    let signalArchiveStarted: (() => void) | undefined
    let downloads = 0
    const archiveStarted = new Promise<void>((resolve) => { signalArchiveStarted = resolve })
    const manager = new EngineReleaseManager(root, {
      async fetch(input, init) {
        if (String(input).includes('/releases/latest')) return Response.json(release)
        if (String(input).endsWith('.sha256')) return new Response(`${digest}  ${release.assets[0]!.name}\n`)
        if (++downloads > 1) return new Response(archive)
        signalArchiveStarted?.()
        return new Response(new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('test'))
            const fail = () => controller.error(new DOMException('cancelled', 'AbortError'))
            init?.signal?.addEventListener('abort', fail, { once: true })
          },
        }), { headers: { 'content-length': String(archive.byteLength) } })
      },
      async expandArchive(_path, destination) {
        await mkdir(destination, { recursive: true })
        await writeFile(join(destination, 'infr.exe'), 'fake')
      },
    })

    const installing = manager.installLatest()
    await archiveStarted
    assert.equal(manager.cancelInstall().stage, 'cancelled')
    await assert.rejects(installing, /cancelled/u)
    assert.equal((await manager.status()).install.stage, 'cancelled')
    const retried = await manager.installLatest()
    assert.equal(retried.tag, release.tag_name)
    assert.equal((await manager.status()).install.stage, 'complete')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('a manually downloaded or extracted engine can be adopted without copying it', { skip: process.platform !== 'win32' }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'moe4all-release-test-'))
  const local = await mkdtemp(join(tmpdir(), 'moe4all-local-test-'))
  try {
    const executable = join(local, 'bin', 'infr.exe')
    await mkdir(join(local, 'bin'), { recursive: true })
    await writeFile(executable, 'fake')
    const manager = new EngineReleaseManager(root, {
      async fetch(input) {
        if (String(input).includes('/releases/latest')) return Response.json(release)
        throw new Error(`unexpected fetch: ${String(input)}`)
      },
    })

    const installed = await manager.installFromLocal(local)
    assert.equal(installed.executable, executable)
    assert.equal(installed.workingDirectory, join(local, 'bin'))
    assert.equal(installed.tag, 'local')
    assert.equal((await manager.installed())?.executable, executable)
  } finally {
    await rm(root, { recursive: true, force: true })
    await rm(local, { recursive: true, force: true })
  }
})

test('managed engine versions can be enumerated and only inactive versions can be deleted', async () => {
  const root = await mkdtemp(join(tmpdir(), 'moe4all-versions-test-'))
  try {
    const oldDirectory = join(root, 'releases', 'release-0.7.0', 'MoE4All')
    const currentDirectory = join(root, 'releases', 'release-0.8.0', 'MoE4All')
    await mkdir(oldDirectory, { recursive: true })
    await mkdir(currentDirectory, { recursive: true })
    const oldExecutable = join(oldDirectory, 'infr.exe')
    const currentExecutable = join(currentDirectory, 'infr.exe')
    await writeFile(oldExecutable, 'old')
    await writeFile(currentExecutable, 'current')
    const manager = new EngineReleaseManager(root)
    const versions = await manager.versions()
    assert.deepEqual(versions.map(item => item.tag).sort(), ['release-0.7.0', 'release-0.8.0'])
    await assert.rejects(manager.remove('release-0.8.0', currentExecutable), /Select another engine version/u)
    await manager.remove('release-0.7.0', currentExecutable)
    await assert.rejects(access(oldDirectory))
    await access(currentExecutable)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('local engine inventory stays usable offline without probing GitHub on each poll', async () => {
  const root = await mkdtemp(join(tmpdir(), 'moe4all-offline-'))
  try {
    const directory = join(root, 'releases', 'release-0.8.0')
    await mkdir(directory, { recursive: true })
    const executable = join(directory, 'infr.exe')
    await writeFile(executable, 'fake')
    let requests = 0
    const manager = new EngineReleaseManager(root, { fetch: async () => { requests++; throw new Error('offline') } })
    assert.equal((await manager.status(executable)).versions.length, 1)
    assert.equal(requests, 0)
    const checked = await manager.status(executable, true)
    assert.equal(checked.versions.length, 1)
    assert(checked.message)
    assert(requests > 0)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('first activation starts one automatic engine install and records the attempt', { skip: process.platform !== 'win32' }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'moe4all-bootstrap-'))
  try {
    const manager = new EngineReleaseManager(root, {
      async fetch(input) {
        if (String(input).includes('/releases/latest')) return Response.json(release)
        if (String(input).endsWith('.sha256')) return new Response(`${digest}  ${release.assets[0]!.name}\n`)
        return new Response(archive)
      },
      async expandArchive(_path, destination) {
        await mkdir(destination, { recursive: true })
        await writeFile(join(destination, 'infr.exe'), 'fake')
      },
    })

    const first = await manager.bootstrapLatest()
    assert.equal(first.started, true)
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const status = await manager.status()
      if (status.install.stage === 'complete') break
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    assert.equal((await manager.status()).install.stage, 'complete')
    assert.equal((await manager.bootstrapLatest()).started, false)
    assert.equal((await manager.status()).bootstrapAttempted, true)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('a failed first automatic install is not silently repeated on the next activation', { skip: process.platform !== 'win32' }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'moe4all-bootstrap-failed-'))
  try {
    let requests = 0
    const manager = new EngineReleaseManager(root, {
      async fetch() {
        requests += 1
        throw new Error('offline')
      },
    })
    assert.equal((await manager.bootstrapLatest()).started, true)
    for (let attempt = 0; attempt < 50 && (await manager.status()).install.stage !== 'error'; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    const afterFailure = requests
    assert.equal((await manager.bootstrapLatest()).started, false)
    assert.equal(requests, afterFailure)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
