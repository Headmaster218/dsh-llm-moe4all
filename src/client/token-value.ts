export function parseTokenValue(input: string): number | undefined {
  const value = input.trim().replaceAll('_', '')
  const match = /^(\d+(?:\.\d+)?)\s*([km]?)$/iu.exec(value)
  if (match === null) return undefined
  const scalar = Number(match[1])
  const suffix = match[2]!.toLowerCase()
  const multiplier = suffix === 'k' ? 1024 : suffix === 'm' ? 1024 ** 2 : 1
  const tokens = scalar * multiplier
  if (!Number.isSafeInteger(tokens) || tokens < 1) return undefined
  return tokens
}

export function formatTokenValue(tokens: number): string {
  if (tokens >= 1024 && tokens % 1024 === 0) return `${tokens / 1024}k`
  return String(tokens)
}
