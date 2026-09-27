import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
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
