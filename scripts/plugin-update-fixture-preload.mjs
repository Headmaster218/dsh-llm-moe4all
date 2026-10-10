// Only the isolated smoke host imports this fixture; no test URL is exposed in plugin settings.
import { readFile } from 'node:fs/promises'

const fixture = JSON.parse(await readFile(process.env.MOE4ALL_UPDATE_FIXTURE, 'utf8'))
const originalFetch = globalThis.fetch
globalThis.fetch = async (input, init) => {
  const url = String(input)
  if (url === 'https://api.github.com/repos/Headmaster218/dsh-llm-moe4all/releases/latest') return Response.json(fixture.release)
  if (url === fixture.release.assets[1].browser_download_url) return new Response(fixture.checksum)
  if (url === fixture.release.assets[0].browser_download_url) {
    const bytes = await readFile(fixture.archive)
    let offset = 0
    return new Response(new ReadableStream({ async pull(controller) {
      await new Promise(done => setTimeout(done, 60))
      if (init?.signal?.aborted) { controller.error(init.signal.reason); return }
      if (offset >= bytes.length) { controller.close(); return }
      controller.enqueue(bytes.subarray(offset, offset + 16_384))
      offset += 16_384
    } }))
  }
  return originalFetch(input, init)
}
