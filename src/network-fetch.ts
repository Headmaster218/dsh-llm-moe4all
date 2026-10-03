import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { ProxyAgent } from 'undici'

const execFileAsync = promisify(execFile)
const agents = new Map<string, ProxyAgent>()
let windowsProxyCache: { at: number, value: string | undefined } | undefined

function withProtocol(value: string): string | undefined {
  const trimmed = value.trim()
  if (trimmed === '') return undefined
  const candidate = /^[a-z]+:\/\//iu.test(trimmed) ? trimmed : `http://${trimmed}`
  try {
    const url = new URL(candidate)
    return ['http:', 'https:'].includes(url.protocol) && url.hostname ? url.toString() : undefined
  } catch {
    return undefined
  }
}

export function parseWindowsProxyServer(value: string, protocol = 'https:'): string | undefined {
  const entries = value.split(';').map(item => item.trim()).filter(Boolean)
  const mapped = new Map<string, string>()
  let fallback: string | undefined
  for (const entry of entries) {
    const separator = entry.indexOf('=')
    if (separator > 0) mapped.set(entry.slice(0, separator).trim().toLowerCase(), entry.slice(separator + 1).trim())
    else fallback ??= entry
  }
  const preferred = protocol === 'https:' ? mapped.get('https') ?? mapped.get('http') : mapped.get('http')
  return withProtocol(preferred ?? fallback ?? '')
}

async function readWindowsProxy(): Promise<string | undefined> {
  if (process.platform !== 'win32') return undefined
  const key = String.raw`HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`
  try {
    const [enabled, server] = await Promise.all([
      execFileAsync('reg.exe', ['query', key, '/v', 'ProxyEnable'], { windowsHide: true, encoding: 'utf8' }),
      execFileAsync('reg.exe', ['query', key, '/v', 'ProxyServer'], { windowsHide: true, encoding: 'utf8' }),
    ])
    if (!/ProxyEnable\s+REG_DWORD\s+0x1\b/iu.test(enabled.stdout)) return undefined
    const value = /ProxyServer\s+REG_SZ\s+(.+)$/imu.exec(server.stdout)?.[1]
    return value === undefined ? undefined : parseWindowsProxyServer(value)
  } catch {
    return undefined
  }
}

async function proxyFor(input: string | URL): Promise<string | undefined> {
  const url = new URL(String(input))
  const env = url.protocol === 'https:'
    ? process.env.HTTPS_PROXY ?? process.env.https_proxy ?? process.env.ALL_PROXY ?? process.env.all_proxy
    : process.env.HTTP_PROXY ?? process.env.http_proxy ?? process.env.ALL_PROXY ?? process.env.all_proxy
  const configured = withProtocol(env ?? '')
  if (configured !== undefined) return configured
  if (windowsProxyCache === undefined || Date.now() - windowsProxyCache.at > 30_000) {
    windowsProxyCache = { at: Date.now(), value: await readWindowsProxy() }
  }
  return windowsProxyCache.value
}

function proxyAgent(url: string): ProxyAgent {
  let agent = agents.get(url)
  if (agent === undefined) {
    agent = new ProxyAgent(url)
    agents.set(url, agent)
  }
  return agent
}

function retryableStatus(status: number): boolean {
  return status === 403 || status === 408 || status === 429 || status >= 500
}

export async function fetchDirectThenSystemProxy(input: string | URL, init?: RequestInit): Promise<Response> {
  let direct: Response | undefined
  let directError: unknown
  try {
    direct = await fetch(input, init)
    if (!retryableStatus(direct.status)) return direct
  } catch (error) {
    if (init?.signal?.aborted === true) throw error
    directError = error
  }

  const proxy = await proxyFor(input)
  if (proxy === undefined) {
    if (direct !== undefined) return direct
    throw directError
  }

  try {
    const proxyInit = { ...init, dispatcher: proxyAgent(proxy) } as RequestInit
    return await fetch(input, proxyInit)
  } catch (proxyError) {
    if (direct !== undefined) return direct
    const directMessage = directError instanceof Error ? directError.message : String(directError)
    const proxyMessage = proxyError instanceof Error ? proxyError.message : String(proxyError)
    throw new Error(`Direct connection failed (${directMessage}); the system proxy also failed (${proxyMessage}).`)
  }
}
