import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { discoverLocalModelFiles, discoverModelLibraries, discoverModelLibrary, validateSetupModelPaths } from '../src/model-files.js'

test('model discovery classifies direct GGUF files and keeps only the first main shard', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'moe4all-models-'))
  try {
    const names = [
      'Qwen-00001-of-00002.gguf',
      'Qwen-00002-of-00002.gguf',
      'mmproj-Qwen-F16.gguf',
      'Qwen3-Embedding-0.6B-Q8_0.gguf',
      'mtp-Qwen.gguf',
    ]
    await Promise.all(names.map(name => writeFile(join(directory, name), '')))
    const result = await discoverLocalModelFiles(directory)
    assert.deepEqual(result.main, [join(directory, 'Qwen-00001-of-00002.gguf')])
    assert.deepEqual(result.vision, [join(directory, 'mmproj-Qwen-F16.gguf')])
    assert.deepEqual(result.embedding, [join(directory, 'Qwen3-Embedding-0.6B-Q8_0.gguf')])
    assert.deepEqual(result.mtp, [join(directory, 'mtp-Qwen.gguf')])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('model import scans nested folders within a bounded search', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'moe4all-model-tree-'))
  try {
    const nested = join(directory, 'vendor', 'family', 'quantization')
    await mkdir(nested, { recursive: true })
    const model = join(nested, 'nested-Q8_0.gguf')
    await writeFile(model, '')
    assert.deepEqual((await discoverLocalModelFiles(directory)).main, [model])
    await assert.rejects(
      discoverLocalModelFiles(directory, { maxDirectories: 1 }),
      /directory limit/u,
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('setup path validation strips pasted outer quotes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'moe4all-paths-'))
  try {
    const main = join(directory, 'model.gguf')
    await writeFile(main, '')
    assert.deepEqual(await validateSetupModelPaths({ main: `"${main}"` }), { main })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('model library recursively groups shards and reports family, role, quantization, and total size', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'moe4all-library-'))
  try {
    const family = join(directory, 'Qwen3.8-Flash-Next')
    await mkdir(family)
    await writeFile(join(family, 'Qwen3.8-Flash-Next-AD-4.27bpw-Q4_K_M-M64-00001-of-00002.gguf'), 'abc')
    await writeFile(join(family, 'Qwen3.8-Flash-Next-AD-4.27bpw-Q4_K_M-M64-00002-of-00002.gguf'), 'defg')
    await writeFile(join(family, 'mmproj-Qwen3.8-Flash-Next-F16.gguf'), 'vision')
    const result = await discoverModelLibrary(directory)
    assert.equal(result.models.length, 2)
    const main = result.models.find(item => item.kind === 'main')
    assert(main)
    assert.equal(main.family, 'Qwen3.8 Flash Next')
    assert.equal(main.quantization, 'AD-4.27bpw-Q4_K_M-M64')
    assert.equal(main.sizeBytes, 7)
    assert.equal(main.fileCount, 2)
    assert.equal(main.expectedFiles, 2)
    assert.equal(main.complete, true)
    assert.equal(result.models.find(item => item.kind === 'vision')?.quantization, 'F16')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('missing storage directories are empty and incomplete shard groups are not usable', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'moe4all-incomplete-'))
  try {
    assert.deepEqual((await discoverModelLibrary(join(directory, 'not-created'))).models, [])
    await writeFile(join(directory, 'chat-00001-of-00003.gguf'), 'one')
    await writeFile(join(directory, 'chat-00003-of-00003.gguf'), 'three')
    const model = (await discoverModelLibrary(directory)).models[0]!
    assert.equal(model.fileCount, 2)
    assert.equal(model.expectedFiles, 3)
    assert.equal(model.complete, false)
    await assert.rejects(validateSetupModelPaths({ main: model.path }), /Missing model shard/)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('model library merges multiple saved discovery locations', async () => {
  const root = await mkdtemp(join(tmpdir(), 'moe4all-library-paths-'))
  try {
    const first = join(root, 'first')
    const second = join(root, 'second')
    await Promise.all([mkdir(first), mkdir(second)])
    await writeFile(join(first, 'alpha-Q8_0.gguf'), 'alpha')
    await writeFile(join(second, 'beta-F16.gguf'), 'beta')
    const result = await discoverModelLibraries([first, second, first])
    assert.deepEqual(result.directories, [first, second])
    assert.deepEqual(result.models.map(model => model.name).sort(), ['alpha-Q8_0', 'beta-F16'])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
