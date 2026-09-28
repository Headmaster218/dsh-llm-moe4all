import assert from 'node:assert/strict'
import { test } from 'node:test'
import { modelArgument, parseEngineArguments, unmanagedArguments } from '../src/client/engine-setup.js'
import {
  argumentValue,
  composeEditor,
  editorFromConfig,
  parseExtraArguments,
  setArgument,
} from '../src/client/workspace-model.js'

test('the model editor finds the main model before attachments and supports inline options', () => {
  const args = [
    'serve',
    '--dev',
    'Vulkan1',
    'chat.gguf',
    '--mmproj=vision.gguf',
    '--embedding-model',
    'embed.gguf',
    '--parallel=2',
    '--set=spec.draft=mtp.gguf',
  ]
  assert.equal(modelArgument(args), 'chat.gguf')
  const parsed = parseEngineArguments(args)
  assert.equal(parsed.visionModel, 'vision.gguf')
  assert.equal(parsed.embeddingModel, 'embed.gguf')
  assert.equal(parsed.parallel, 2)
  assert.deepEqual(unmanagedArguments(args), ['--dev', 'Vulkan1'])
})

test('editing common settings preserves manual compute, sampling and unknown arguments', () => {
  const extras = [
    '--dev',
    'Vulkan1',
    '--ubatch',
    '3072',
    '--set',
    'device.ram_budget=48g',
    '--set',
    'paging.expert_prefetch=false',
    '--temp',
    '0.7',
    '--think',
  ]
  const editor = editorFromConfig({
    contextWindow: 32768,
    maxTokens: 8192,
    arguments: ['serve', ...extras, 'chat.gguf'],
  })
  editor.context = '150k'
  editor.setup.profile = 'aggressive'
  const result = composeEditor(editor)
  assert.equal(result.contextWindow, 153600)
  for (const value of extras) assert(result.arguments!.includes(value))
  assert.equal(argumentValue(result.arguments!, 'device.auto_profile'), 'aggressive')
  assert.equal(result.arguments!.at(-1), 'chat.gguf')
})

test('invalid token counts and raw arguments cannot silently save stale values', () => {
  const editor = editorFromConfig({ arguments: ['serve', 'chat.gguf'] })
  editor.context = ''
  assert.throws(() => composeEditor(editor), /invalidTokens/)
  editor.context = '32k'
  editor.extraText = '[broken]'
  assert.throws(() => composeEditor(editor), /invalidExtra/)
  assert.throws(() => parseExtraArguments('["--ctx", "1"]'), /invalidExtra/)
  assert.throws(() => parseExtraArguments('["--set", "spec.mtp=true"]'), /invalidExtra/)
  assert.deepEqual(parseExtraArguments('["--set=paging.expert_prefetch=false"]'), [
    '--set',
    'paging.expert_prefetch=false',
  ])
})

test('manual parameter replacement removes stale duplicates, and cache enforces q8', () => {
  assert.deepEqual(setArgument(['--ubatch=512', '--temp', '0.7', '--ubatch', '1024'], '--ubatch', '2048'), [
    '--temp',
    '0.7',
    '--ubatch',
    '2048',
  ])
  const editor = editorFromConfig({
    arguments: ['serve', '--set', 'kv.type_k=f16', '--set', 'kv.type_v=f16', 'chat.gguf'],
  })
  editor.setup.sessionCacheEnabled = true
  const args = composeEditor(editor).arguments!
  assert.equal(argumentValue(args, 'kv.type_k'), 'q8_0')
  assert.equal(argumentValue(args, 'kv.type_v'), 'q8_0')
})

test('invalid remote endpoints fail before settings are persisted', () => {
  const editor = editorFromConfig({
    mode: 'connect',
    endpoint: 'https://example.com/v1',
    allowRemoteEndpoint: false,
  })
  assert.throws(() => composeEditor(editor), /not loopback/)
  editor.config.allowRemoteEndpoint = true
  assert.equal(composeEditor(editor).endpoint, 'https://example.com/v1')
})
