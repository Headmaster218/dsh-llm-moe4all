import assert from 'node:assert/strict'
import { test } from 'node:test'

import { parseWindowsProxyServer } from '../src/network-fetch.js'

test('Windows proxy strings support single-server and per-protocol formats', () => {
  assert.equal(parseWindowsProxyServer('127.0.0.1:7890'), 'http://127.0.0.1:7890/')
  assert.equal(
    parseWindowsProxyServer('http=127.0.0.1:8080;https=127.0.0.1:8443'),
    'http://127.0.0.1:8443/',
  )
  assert.equal(parseWindowsProxyServer('https://proxy.example:443'), 'https://proxy.example/')
  assert.equal(parseWindowsProxyServer(''), undefined)
})
