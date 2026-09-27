import assert from 'node:assert/strict'
import { test } from 'node:test'

import { formatTokenValue, parseTokenValue } from '../src/client/token-value.js'

test('token fields accept plain values and binary k units', () => {
  assert.equal(parseTokenValue('163840'), 163_840)
  assert.equal(parseTokenValue('160k'), 163_840)
  assert.equal(parseTokenValue('100K'), 102_400)
  assert.equal(parseTokenValue('1.5k'), 1536)
  assert.equal(parseTokenValue(''), undefined)
  assert.equal(parseTokenValue('1.1k'), undefined)
})

test('token values format to an editable compact representation', () => {
  assert.equal(formatTokenValue(163_840), '160k')
  assert.equal(formatTokenValue(1537), '1537')
})
