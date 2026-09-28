import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildEngineArguments } from '../src/client/engine-setup.js'

test('first-run setup keeps conservative engine defaults automatic', () => {
  assert.deepEqual(buildEngineArguments({
    model: 'D:\\Models\\model.gguf',
    host: '127.0.0.1',
    port: 8080,
    contextWindow: 163_840,
    maxTokens: 102_400,
    parallel: 1,
    profile: 'conservative',
    mtp: false,
  }), [
    'serve', '--addr', '127.0.0.1:8080', '--parallel', '1', '--ctx', '163840', '--max-new', '102400',
    '--set', 'kv.session_cache_dir=',
    'D:\\Models\\model.gguf',
  ])
})

test('first-run setup adds aggressive and MTP settings explicitly', () => {
  assert.deepEqual(buildEngineArguments({
    model: 'model.gguf',
    host: '0.0.0.0',
    port: 1234,
    contextWindow: 20 * 1024,
    maxTokens: 4096,
    parallel: 2,
    profile: 'aggressive',
    mtp: true,
    mtpModel: 'mtp.gguf',
  }), [
    'serve', '--addr', '0.0.0.0:1234', '--parallel', '2', '--ctx', '20480', '--max-new', '4096',
    '--set', 'device.auto_profile=aggressive', '--set', 'spec.mtp=true', '--set', 'spec.draft=mtp.gguf',
    '--set', 'kv.session_cache_dir=', 'model.gguf',
  ])
})

test('first-run setup rejects missing model paths', () => {
  assert.throws(() => buildEngineArguments({
    model: '',
    host: '127.0.0.1',
    port: 8080,
    contextWindow: 1024,
    maxTokens: 1024,
    parallel: 1,
    profile: 'conservative',
    mtp: false,
  }), /model GGUF path/u)
})

test('first-run setup strips pasted quotes and includes optional services and KV cache', () => {
  assert.deepEqual(buildEngineArguments({
    model: '"D:\\Models\\chat.gguf"',
    visionModel: "'D:\\Models\\mmproj.gguf'",
    embeddingModel: 'D:\\Models\\embed.gguf',
    embeddingIdleTimeout: 60,
    host: '127.0.0.1',
    port: 8080,
    contextWindow: 32 * 1024,
    maxTokens: 8 * 1024,
    parallel: 2,
    profile: 'conservative',
    mtp: false,
    sessionCache: { directory: 'kv-sessions', maxSize: '10g', idleSeconds: 90, ttlHours: 24 },
  }), [
    'serve', '--addr', '127.0.0.1:8080', '--parallel', '2', '--ctx', '32768', '--max-new', '8192',
    '--mmproj', 'D:\\Models\\mmproj.gguf', '--embedding-model', 'D:\\Models\\embed.gguf', '--embedding-idle-timeout', '60',
    '--set', 'kv.type_k=q8_0', '--set', 'kv.type_v=q8_0', '--set', 'kv.session_cache_dir=kv-sessions',
    '--set', 'kv.session_idle_secs=90', '--set', 'kv.session_cache_max=10g', '--set', 'kv.session_cache_ttl_hours=24',
    'D:\\Models\\chat.gguf',
  ])
})

test('first-run setup requires an MTP head when MTP is enabled', () => {
  assert.throws(() => buildEngineArguments({
    model: 'model.gguf',
    host: '127.0.0.1',
    port: 8080,
    contextWindow: 1024,
    maxTokens: 1024,
    parallel: 1,
    profile: 'conservative',
    mtp: true,
  }), /MTP head GGUF path/u)
})
