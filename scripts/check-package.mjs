import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// npm supplies its JS entry so Windows does not need a shell for npm.cmd.
const npmEntry = process.env.npm_execpath
assert.ok(npmEntry, 'run this check through npm run check')
const packed = spawnSync(process.execPath, [npmEntry, 'pack', '--ignore-scripts', '--dry-run', '--json'], {
  cwd: root,
  encoding: 'utf8',
  timeout: 60_000,
})
assert.equal(packed.status, 0, packed.stderr || String(packed.error))
const [archive] = JSON.parse(packed.stdout)
const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'))
assert.equal(lock.version, manifest.version, 'package and lockfile versions differ')
assert.equal(lock.packages[''].version, manifest.version, 'lockfile root version differs')
assert.deepEqual(lock.packages[''].engines, manifest.engines, 'lockfile engine constraints differ')
assert.equal(archive.name, manifest.name)
assert.equal(archive.version, manifest.version)
const files = new Set(archive.files.map(file => file.path))
const roots = new Set(['package.json', 'cordis.patch.yml', 'CHANGELOG.md', 'README.md', 'README.zh.md', 'LICENSE', 'NOTICE', 'THIRD-PARTY-NOTICES.txt'])
for (const file of roots) assert.ok(files.has(file), `missing package file: ${file}`)
for (const file of files) {
  assert.ok(roots.has(file) || file.startsWith('lib/'), `unexpected published file: ${file}`)
  assert.ok(!file.split('/').includes('..') && !file.startsWith('/'), `unsafe package path: ${file}`)
}
for (const entry of [manifest.main, manifest.types, manifest.exports['./client'].default, manifest.exports['./client'].types, manifest.dsh.bundle.patch]) {
  assert.ok(files.has(entry.replace(/^\.\//u, '')), `missing package entry: ${entry}`)
}
assert.ok(Object.keys(manifest.dependencies).every(name => !name.startsWith('@deepseek-ai/')), 'official DSH packages must stay peers')
console.log(`Package verified: ${archive.name}@${archive.version}, ${files.size} files, ${archive.size} bytes`)
