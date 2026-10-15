import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import { providerProfile } from '../src/model-provider.js'

// Point at a complete built host, rather than the plugin's partial type-check dependencies.
const adapterEntry = process.env.MOE4ALL_TEST_DSH_ADAPTER
if (!adapterEntry) throw new Error('Set MOE4ALL_TEST_DSH_ADAPTER to the host dsh-llm-pi-ai entry.')
const adapterRequire = createRequire(adapterEntry)
const { Context } = await import(pathToFileURL(adapterRequire.resolve('@deepseek-ai/cordis')).href)
const LlmPiAi = await import(pathToFileURL(adapterEntry).href)
const { default: LlmRuntime, ReasoningEffortId } = await import(
  pathToFileURL(adapterRequire.resolve('@deepseek-ai/dsh-llm')).href
)

test('real DSH adapter exposes Qwen controls and sends off/effort parameters to HTTP', { timeout: 20_000 }, async () => {
  const requests: Record<string, unknown>[] = []
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = []
    for await (const chunk of request) chunks.push(Buffer.from(chunk))
    requests.push(JSON.parse(Buffer.concat(chunks).toString('utf8')))
    response.writeHead(200, { 'content-type': 'text/event-stream' })
    for (const event of [
      { id: 'test', choices: [{ index: 0, delta: { role: 'assistant', content: 'ok' }, finish_reason: null }] },
      { id: 'test', choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] },
    ]) response.write(`data: ${JSON.stringify(event)}\n\n`)
    response.end('data: [DONE]\n\n')
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert(address && typeof address === 'object')
  const ctx = new Context()
  const models = ['Qwen3.6-35B-A3B-APEX-I-Balanced', 'Qwen3.8-Flash-Next']
  const previousKey = process.env.MOE4ALL_REASONING_TEST_KEY
  process.env.MOE4ALL_REASONING_TEST_KEY = 'fixture-only'
  try {
    await ctx.plugin(LlmRuntime)
    await ctx.plugin(LlmPiAi, {
      providers: { moe4all: providerProfile(
        new URL(`http://127.0.0.1:${address.port}/v1`), models.map(id => ({ id, name: id })),
        { apiKeyEnv: 'MOE4ALL_REASONING_TEST_KEY' },
      ) },
    })
    for (const model of models) {
      const info = await ctx.llm.resolveModelInfo('moe4all', model)
      const expected = model.includes('3.8') ? ['off', 'low', 'medium', 'xhigh'] : ['off', 'low', 'medium', 'high', 'xhigh', 'max']
      assert.deepEqual(info.reasoning.efforts.map((effort: { id: string }) => effort.id), expected)
      assert.equal(info.reasoning.defaultEffort, 'medium')
      for (const effort of [...expected, undefined]) {
        const output = []
        for await (const chunk of ctx.llm.stream({
          provider: 'moe4all', model, messages: [],
          ...(effort === undefined ? {} : { reasoningEffort: ReasoningEffortId(effort) }),
        })) output.push(chunk)
        assert(output.length > 0)
        const request = requests.at(-1)!
        assert.equal(request.model, model)
        assert.equal(Object.hasOwn(request, 'reasoning_effort'), false)
        assert.deepEqual(request.chat_template_kwargs, effort === 'off'
          ? { enable_thinking: false }
          : { enable_thinking: true, reasoning_effort: effort ?? 'medium' })
      }
    }
    assert.equal(requests.length, 12)
  } finally {
    if (previousKey === undefined) delete process.env.MOE4ALL_REASONING_TEST_KEY
    else process.env.MOE4ALL_REASONING_TEST_KEY = previousKey
    await ctx.fiber.dispose()
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
})
