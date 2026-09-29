import assert from 'node:assert/strict'
import test from 'node:test'

import { configuredSlots, RuntimeMetricsTracker } from '../src/runtime-metrics.js'

test('runtime metrics track aggregate and per-request speeds', () => {
  const tracker = new RuntimeMetricsTracker(2)
  tracker.ingest('request start req=44 model="test"')
  tracker.ingest('request progress req=44 phase="prefill" context_tokens=8192 context_limit=163840 prefill_tokens=4096 prefill_total=20000 cached_tokens=0 gen_tokens=0 prefill_tps=401.2 decode_tps=0.0')
  tracker.ingest('serve stats interval_s=5.0 prefill_tps=812.4 decode_tps=0.0 active=1 queued=1 kv_slots=1/3')
  let snapshot = tracker.snapshot()
  assert.equal(snapshot.slots, 2)
  assert.equal(snapshot.prefillTps, 812.4)
  assert.equal(snapshot.requests[0]?.phase, 'prefill')

  tracker.ingest('request progress req=44 phase="decode" context_tokens=20100 context_limit=163840 prefill_tokens=20000 prefill_total=20000 cached_tokens=0 gen_tokens=100 prefill_tps=702.0 decode_tps=41.7')
  tracker.ingest('serve stats interval_s=5.0 prefill_tps=0.0 decode_tps=42.3 active=1 queued=0 kv_slots=1/3')
  snapshot = tracker.snapshot()
  assert.equal(snapshot.decodeTps, 42.3)
  assert.equal(snapshot.requests[0]?.decodeTps, 41.7)

  tracker.ingest('request done req=44 decode_tps=41.7')
  assert.equal(tracker.snapshot().requests.length, 0)
})

test('configured slots reads both argument forms', () => {
  assert.equal(configuredSlots(['serve', '--parallel', '2']), 2)
  assert.equal(configuredSlots(['serve', '--parallel=4']), 4)
  assert.equal(configuredSlots(['serve']), 1)
})
