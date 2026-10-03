import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

test('browser bundle loads with only the React modules supplied by DSH', async () => {
  const code = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  const require = createRequire(import.meta.url)
  const requested: string[] = []
  let plugin: { apply?: unknown } | undefined
  runInNewContext(code, {
    window: {
      __ModuleLoader__: {
        load(entry: { id: string; factory(require: (id: string) => unknown): typeof plugin }) {
          assert.equal(entry.id, 'dsh-llm-moe4all')
          plugin = entry.factory((id) => {
            requested.push(id)
            assert(['react', 'react/jsx-runtime'].includes(id), `Undeclared browser dependency: ${id}`)
            return require(id)
          })
        },
      },
    },
  })
  assert.equal(typeof plugin?.apply, 'function')
  assert(requested.includes('react'))
})
