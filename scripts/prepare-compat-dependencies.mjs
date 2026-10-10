import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const hostDependency = /^@deepseek-ai\/(?:dsh-|cordis$|schemastery$)/u
const nonHost = dependencies => Object.fromEntries(Object.entries(dependencies).filter(([name]) => !hostDependency.test(name)))

export function compatibilityManifest(current, fixture) {
  assert.equal(fixture.name, current.name)
  assert.deepEqual(fixture.dependencies, current.dependencies, 'Refresh the compatibility lockfiles after runtime dependency changes')
  assert.deepEqual(nonHost(fixture.devDependencies), nonHost(current.devDependencies), 'Refresh the compatibility lockfiles after toolchain changes')
  return { ...current, devDependencies: fixture.devDependencies }
}

export function compatibilityLock(manifest, fixture) {
  assert.equal(fixture.name, manifest.name)
  assert.equal(fixture.lockfileVersion, 3)
  assert.deepEqual(fixture.packages[''].dependencies, manifest.dependencies)
  assert.deepEqual(fixture.packages[''].devDependencies, manifest.devDependencies)
  return {
    ...fixture,
    version: manifest.version,
    packages: { ...fixture.packages, '': { ...fixture.packages[''], version: manifest.version } },
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [version] = process.argv.slice(2)
  assert.ok(['0.1.1-rc.2', '0.1.5-rc.3', '0.2.0-rc.2'].includes(version), 'Expected a supported, exact DSH version')
  const packageFile = new URL('../package.json', import.meta.url)
  const current = JSON.parse(await readFile(packageFile, 'utf8'))
  if (current.devDependencies['@deepseek-ai/dsh-client-locale'] !== version) {
    const fixture = new URL(`../test/fixtures/compat-dependencies/${version}/`, import.meta.url)
    const manifest = compatibilityManifest(current, JSON.parse(await readFile(new URL('package.json', fixture), 'utf8')))
    assert.equal(manifest.devDependencies['@deepseek-ai/dsh-client-locale'], version)
    const lock = compatibilityLock(manifest, JSON.parse(await readFile(new URL('package-lock.json', fixture), 'utf8')))
    await writeFile(packageFile, `${JSON.stringify(manifest, null, 2)}\n`)
    await writeFile(new URL('../package-lock.json', import.meta.url), `${JSON.stringify(lock, null, 2)}\n`)
  }
  console.log(`Prepared frozen plugin dependency environment for DSH ${version}`)
}
