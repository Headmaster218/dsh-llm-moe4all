import assert from 'node:assert/strict'
import test from 'node:test'
import { styles } from '../src/client/styles.js'

test('input placeholders use readable host theme text without reducing its opacity', () => {
  const rule = styles.match(/\.m4a-field input::placeholder,\.m4a-search input::placeholder\s*\{([^}]+)\}/u)?.[1]
  assert.ok(rule)
  assert.match(rule, /color:var\(--m4a-muted\)/u)
  assert.match(rule, /opacity:1\s*;/u)
})
