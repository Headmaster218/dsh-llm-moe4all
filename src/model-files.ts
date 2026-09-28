import { readdir, stat } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'

export type ModelFileKind = 'main' | 'vision' | 'embedding' | 'mtp'

export interface LocalModelFiles {
  directory: string
  selected?: string
  main: string[]
  vision: string[]
  embedding: string[]
  mtp: string[]
}

export interface SetupModelPaths {
  main: string
  vision?: string
  embedding?: string
  mtp?: string
}

export interface LocalModelEntry {
  id: string
  path: string
  directory: string
  kind: ModelFileKind
  family: string
  name: string
  quantization: string
  sizeBytes: number
  fileCount: number
  expectedFiles: number
  complete: boolean
}

export interface LocalModelLibrary {
  directory: string
  models: LocalModelEntry[]
}

function stripOuterQuotes(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length >= 2) {
    const first = trimmed[0]
    const last = trimmed.at(-1)
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1).trim()
    }
  }
  return trimmed
}

function modelKind(path: string): ModelFileKind {
  const name = path.toLowerCase()
  if (name.includes('mtp')) return 'mtp'
  if (name.includes('mmproj') || name.includes('vision')) return 'vision'
  if (name.includes('embed') || name.includes('nomic')) return 'embedding'
  return 'main'
}

function isFirstOrOnlyShard(path: string): boolean {
  const match = /-(\d{5})-of-\d{5}\.gguf$/iu.exec(path)
  return match === null || match[1] === '00001'
}

function shardIdentity(path: string): string {
  return path.replace(/-\d{5}-of-\d{5}\.gguf$/iu, '')
}

function modelFamily(name: string): string {
  if (/qwen3[.-]?8.*flash.*next/iu.test(name)) return 'Qwen3.8 Flash Next'
  if (/qwen3[.-]?6.*35b/iu.test(name)) return 'Qwen3.6 35B-A3B'
  if (/qwen3.*embedding/iu.test(name)) return 'Qwen3 Embedding'
  if (/nomic.*embed/iu.test(name)) return 'Nomic Embedding'
  const normalized = name.replace(/[-_.]+/gu, ' ').trim()
  return normalized.split(/\s+(?=(?:AD-|Q\d|F16|BF16|F32|APEX|MTP))/iu, 1)[0] || 'Other models'
}

function modelQuantization(name: string): string {
  const patterns = [
    /AD-\d+(?:\.\d+)?bpw-Q\d+_[A-Z0-9_]+(?:-M\d+)?/iu,
    /APEX-[A-Z0-9_-]+/iu,
    /Q\d+_[A-Z0-9_]+/iu,
    /\b(?:BF16|F16|F32)\b/iu,
  ]
  for (const pattern of patterns) {
    const match = pattern.exec(name)?.[0]
    if (match !== undefined) return match
  }
  return 'GGUF'
}

interface LibraryFile {
  path: string
  size: number
}

async function collectModelFiles(directory: string, maxDepth: number, result: Map<string, LibraryFile>): Promise<void> {
  const pending: Array<{ directory: string, depth: number }> = [{ directory, depth: 0 }]
  const visited = new Set<string>()
  while (pending.length > 0) {
    const current = pending.shift()!
    const key = current.directory.toLowerCase()
    if (visited.has(key)) continue
    visited.add(key)
    let entries
    try {
      entries = await readdir(current.directory, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      const path = join(current.directory, entry.name)
      if (entry.isDirectory() && current.depth < maxDepth) {
        pending.push({ directory: path, depth: current.depth + 1 })
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.gguf') {
        try {
          result.set(path.toLowerCase(), { path, size: (await stat(path)).size })
        } catch {}
      }
    }
  }
}

export async function discoverModelLibrary(input: string, selectedPaths: string[] = []): Promise<LocalModelLibrary> {
  const normalized = stripOuterQuotes(input)
  const files = new Map<string, LibraryFile>()
  let directory = normalized === '' ? '' : resolve(normalized)
  if (directory !== '') {
    const details = await stat(directory).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined
      throw error
    })
    if (details?.isFile()) directory = dirname(directory)
    else if (details !== undefined && !details.isDirectory()) throw new Error('The model library path is not a file or directory.')
    await collectModelFiles(directory, 4, files)
  }
  for (const raw of selectedPaths) {
    const value = stripOuterQuotes(raw)
    if (value === '') continue
    const path = resolve(value)
    try {
      const details = await stat(path)
      if (details.isFile() && extname(path).toLowerCase() === '.gguf') {
        await collectModelFiles(dirname(path), 0, files)
      }
    } catch {}
  }

  const groups = new Map<string, LibraryFile[]>()
  for (const item of files.values()) {
    const key = shardIdentity(item.path).toLowerCase()
    const group = groups.get(key) ?? []
    group.push(item)
    groups.set(key, group)
  }
  const rank: Record<ModelFileKind, number> = { main: 0, vision: 1, mtp: 2, embedding: 3 }
  const models = [...groups.entries()].map(([id, group]): LocalModelEntry => {
    group.sort((left, right) => left.path.localeCompare(right.path, undefined, { numeric: true, sensitivity: 'base' }))
    const first = group[0]!
    const rawName = basename(shardIdentity(first.path))
    const name = rawName.replace(/\.gguf$/iu, '')
    const shard = /-(\d{5})-of-(\d{5})\.gguf$/iu.exec(first.path)
    const expectedFiles = shard === null ? 1 : Number(shard[2])
    const complete = group.length === expectedFiles && (shard === null || group.every((item, index) => Number(/-(\d{5})-of-/iu.exec(item.path)?.[1]) === index + 1))
    return {
      id,
      path: first.path,
      directory: dirname(first.path),
      kind: modelKind(name),
      family: modelFamily(name),
      name,
      quantization: modelQuantization(name),
      sizeBytes: group.reduce((sum, item) => sum + item.size, 0),
      fileCount: group.length,
      expectedFiles,
      complete,
    }
  })
  models.sort((left, right) => (
    left.family.localeCompare(right.family, undefined, { sensitivity: 'base', numeric: true })
    || rank[left.kind] - rank[right.kind]
    || left.name.localeCompare(right.name, undefined, { sensitivity: 'base', numeric: true })
  ))
  return { directory, models }
}

export async function discoverLocalModelFiles(input: string): Promise<LocalModelFiles> {
  const normalized = stripOuterQuotes(input)
  if (normalized === '') throw new Error('A model file or directory path is required.')
  const absolute = resolve(normalized)
  const info = await stat(absolute)
  const selected = info.isFile() ? absolute : undefined
  if (!info.isFile() && !info.isDirectory()) throw new Error('The selected path is not a file or directory.')
  if (selected !== undefined && extname(selected).toLowerCase() !== '.gguf') {
    throw new Error('The selected model file must use the .gguf extension.')
  }
  const directory = info.isDirectory() ? absolute : dirname(absolute)
  const entries = await readdir(directory, { withFileTypes: true })
  const result: LocalModelFiles = { directory, ...(selected === undefined ? {} : { selected }), main: [], vision: [], embedding: [], mtp: [] }
  for (const entry of entries) {
    if (!entry.isFile() || extname(entry.name).toLowerCase() !== '.gguf') continue
    const fullPath = join(directory, entry.name)
    const kind = modelKind(entry.name)
    if (kind === 'main' && !isFirstOrOnlyShard(entry.name)) continue
    result[kind].push(fullPath)
  }
  for (const values of [result.main, result.vision, result.embedding, result.mtp]) {
    values.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }))
  }
  return result
}

export async function validateSetupModelPaths(paths: SetupModelPaths): Promise<SetupModelPaths> {
  const result: SetupModelPaths = { main: '' }
  for (const [kind, raw] of Object.entries(paths) as Array<[ModelFileKind, string | undefined]>) {
    if (raw === undefined || raw.trim() === '') continue
    const path = resolve(stripOuterQuotes(raw))
    const info = await stat(path)
    if (!info.isFile() || extname(path).toLowerCase() !== '.gguf') {
      throw new Error(`${kind} model path must point to a GGUF file.`)
    }
    const shard = /^(.*)-(\d{5})-of-(\d{5})\.gguf$/iu.exec(path)
    if (shard) {
      const total = Number(shard[3])
      if (total < 1 || total > 10_000) throw new Error(`${kind} model has an invalid shard count.`)
      for (let index = 1; index <= total; index++) {
        const expected = `${shard[1]}-${String(index).padStart(5, '0')}-of-${shard[3]}.gguf`
        const part = await stat(expected).catch(() => undefined)
        if (!part?.isFile()) throw new Error(`Missing model shard: ${expected}`)
      }
    }
    result[kind] = path
  }
  if (result.main === '') throw new Error('A main model GGUF file is required.')
  return result
}
