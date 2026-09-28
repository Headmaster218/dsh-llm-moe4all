import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import {
  ModelDownloadManager,
  RECOMMENDED_MODELS,
  type RecommendedModel,
} from '../src/model-download.js'

test('recommended catalog describes the complete Flash shard set and download size', () => {
  const flash = RECOMMENDED_MODELS.find(item => item.id === 'qwen38-flash-ad-q4km')
  assert(flash)
  assert.equal(flash.files.length, 33)
  assert.equal(flash.totalBytes, 94_525_394_976)
  assert.match(flash.primaryFile, /00001-of-00033\.gguf$/u)
})

test('recommended model downloads resume a partial file and finish atomically', async () => {
  const root = await mkdtemp(join(tmpdir(), 'moe4all-model-'))
  const tiny: RecommendedModel = {
    id: 'tiny-test',
    kind: 'main',
    family: 'Tiny',
    name: 'Tiny test model',
    architecture: 'test',
    quantization: 'test',
    folderName: 'tiny',
    totalBytes: 6,
    files: [{ name: 'tiny.gguf', size: 6, url: 'https://example.invalid/tiny.gguf' }],
    primaryFile: 'tiny.gguf',
    sourceUrl: 'https://example.invalid',
    supportsMtp: false,
    supportsVision: false,
  }
  await mkdir(join(root, 'tiny'))
  await writeFile(join(root, 'tiny', 'tiny.gguf.part'), 'abc')
  const manager = new ModelDownloadManager({
    fetch: async (_input, init) => {
      assert.equal(new Headers(init?.headers).get('range'), 'bytes=3-')
      return new Response('def', { status: 206 })
    },
  }, [tiny])

  manager.start(tiny.id, root)
  for (let attempt = 0; manager.status().stage === 'downloading' && attempt < 50; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  assert.deepEqual(manager.status(), {
    stage: 'complete',
    downloadedBytes: 6,
    totalBytes: 6,
    percent: 100,
    modelId: tiny.id,
    directory: root,
    outputDirectory: join(root, 'tiny'),
    selectedFile: join(root, 'tiny', 'tiny.gguf'),
    fileCount: 1,
    fileIndex: 1,
  })
  assert.equal(await readFile(join(root, 'tiny', 'tiny.gguf'), 'utf8'), 'abcdef')
  await rm(root, { recursive: true, force: true })
})

test('model downloads can be cancelled and leave a resumable partial file', async () => {
  const root = await mkdtemp(join(tmpdir(), 'moe4all-model-cancel-'))
  const tiny: RecommendedModel = {
    id: 'tiny-cancel',
    kind: 'main',
    family: 'Tiny',
    name: 'Tiny cancel model',
    architecture: 'test',
    quantization: 'test',
    folderName: 'tiny-cancel',
    totalBytes: 6,
    files: [{ name: 'tiny.gguf', size: 6, url: 'https://example.invalid/tiny.gguf' }],
    primaryFile: 'tiny.gguf',
    sourceUrl: 'https://example.invalid',
    supportsMtp: false,
    supportsVision: false,
  }
  const manager = new ModelDownloadManager({
    fetch: async (_input, init) => new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('abc'))
        init?.signal?.addEventListener('abort', () => {
          controller.error(new DOMException('cancelled', 'AbortError'))
        }, { once: true })
      },
    })),
  }, [tiny])
  try {
    manager.start(tiny.id, root)
    for (let attempt = 0; manager.status().downloadedBytes === 0 && attempt < 50; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    manager.cancel()
    for (let attempt = 0; manager.status().stage === 'downloading' && attempt < 50; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    assert.equal(manager.status().stage, 'cancelled')
    assert.equal(await readFile(join(root, 'tiny-cancel', 'tiny.gguf.part'), 'utf8'), 'abc')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
