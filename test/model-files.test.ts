import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { discoverLocalModelFiles, validateSetupModelPaths } from '../src/model-files.js'

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
