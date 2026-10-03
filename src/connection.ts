import type { EngineConfig } from './engine-controller.js'

export function isLoopback(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return host === 'localhost' || host === '::1' || host === '[::1]' || /^127(?:\.|$)/.test(host)
}

export function endpointFromConfig(config: EngineConfig): string {
  const explicit = config.endpoint?.trim()
  if (explicit) return explicit
  let host = (config.host ?? '127.0.0.1').trim()
  if (config.mode !== 'connect' && ['0.0.0.0', '::', '[::]'].includes(host))
    host = host === '0.0.0.0' ? '127.0.0.1' : '::1'
  if (host.includes(':') && !host.startsWith('[')) host = `[${host}]`
  const rawPath = config.apiBasePath ?? '/v1'
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  return `${config.protocol ?? 'http'}://${host}:${config.port ?? 8080}${path}`
}

export function validateEndpoint(endpoint: string, allowRemoteEndpoint = false): URL {
  const parsed = new URL(endpoint)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
    throw new Error(`MoE4All endpoint must use http or https: ${endpoint}`)
  if (parsed.username || parsed.password) throw new Error('MoE4All endpoint must not contain credentials')
  if (!allowRemoteEndpoint && !isLoopback(parsed.hostname))
    throw new Error(`MoE4All endpoint is not loopback: ${parsed.hostname}`)
  return parsed
}
