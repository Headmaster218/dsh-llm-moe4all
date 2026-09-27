import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildEngineArguments } from '../src/client/engine-setup.js'

test('first-run setup keeps conservative engine defaults automatic', () => {
  assert.deepEqual(buildEngineArguments({
    model: 'D:\\Models\\model.gguf',
    host: '127.0.0.1',
    port: 8080,
    contextWindow: 163_840,
    parallel: 1,
    profile: 'conservative',
    mtp: false,
  }), [
    'serve', '--addr', '127.0.0.1:8080', '--parallel', '1', '--ctx', '163840',
    'D:\\Models\\model.gguf',
  ])
})

test('first-run setup adds aggressive and MTP settings explicitly', () => {
  assert.deepEqual(buildEngineArguments({
    model: 'model.gguf',
    host: '0.0.0.0',
    port: 1234,
    contextWindow: 20 * 1024,
    parallel: 2,
    profile: 'aggressive',
    mtp: true,
  }), [
    'serve', '--addr', '0.0.0.0:1234', '--parallel', '2', '--ctx', '20480',
    '--set', 'device.auto_profile=aggressive', '--set', 'spec.mtp=true', 'model.gguf',
  ])
})

test('first-run setup rejects missing model paths', () => {
  assert.throws(() => buildEngineArguments({
    model: '',
    host: '127.0.0.1',
    port: 8080,
    contextWindow: 1024,
    parallel: 1,
    profile: 'conservative',
    mtp: false,
  }), /model GGUF path/u)
})
