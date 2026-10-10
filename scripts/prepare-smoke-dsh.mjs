import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { minVersion, valid } from 'semver'

const hostPackage = /^@deepseek-ai\/(?:dsh(?:-|$)|cordis(?:-plugin-|$)|schemastery$)/u

export async function pinnedHostManifest(dshVersion, cordisVersion, schemaVersion, load) {
  for (const version of [dshVersion, cordisVersion, schemaVersion]) assert.ok(valid(version), 'Expected exact host versions')
  const versions = new Map([['@deepseek-ai/dsh', dshVersion]])
  const pending = [...versions]
  while (pending.length) {
    const batch = pending.splice(0, 8)
    const manifests = await Promise.all(batch.map(async ([name, version]) => {
      const manifest = await load(name, version)
      assert.equal(manifest.name, name)
      assert.equal(manifest.version, version)
      return manifest
    }))
    for (const manifest of manifests) {
      const dependencies = { ...manifest.dependencies, ...manifest.optionalDependencies, ...manifest.peerDependencies }
      for (const [name, range] of Object.entries(dependencies)) {
        if (!hostPackage.test(name) || versions.has(name)) continue
        const version = name === '@deepseek-ai/cordis' ? cordisVersion
          : name === '@deepseek-ai/schemastery' ? schemaVersion
          : name === '@deepseek-ai/dsh-client-runtime' ? '0.1.1-rc.2'
          : name.startsWith('@deepseek-ai/dsh') ? dshVersion
          : minVersion(range)?.version
        assert.ok(version, `Cannot pin ${name}: ${range}`)
        versions.set(name, version)
        pending.push([name, version])
      }
    }
  }
  return {
    name: 'moe4all-isolated-dsh-smoke', private: true,
    dependencies: { '@deepseek-ai/dsh': dshVersion },
    overrides: Object.fromEntries(versions),
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [directory, dshVersion, cordisVersion, schemaVersion] = process.argv.slice(2)
  assert.ok(directory, 'usage: prepare-smoke-dsh.mjs <fresh runtime directory> <DSH> <Cordis> <Schemastery>')
  assert.ok(valid(dshVersion), 'Expected an exact DSH version')
  const fixture = new URL(`../test/fixtures/dsh-runtimes/${dshVersion}/`, import.meta.url)
  const manifestText = await readFile(new URL('package.json', fixture), 'utf8')
  const lockText = await readFile(new URL('package-lock.json', fixture), 'utf8')
  const manifest = JSON.parse(manifestText)
  const lock = JSON.parse(lockText)
  assert.equal(manifest.dependencies['@deepseek-ai/dsh'], dshVersion)
  assert.equal(manifest.overrides['@deepseek-ai/cordis'], cordisVersion)
  assert.equal(manifest.overrides['@deepseek-ai/schemastery'], schemaVersion)
  assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies)
  await mkdir(resolve(directory), { recursive: true })
  await writeFile(resolve(directory, 'package.json'), manifestText, { flag: 'wx' })
  await writeFile(resolve(directory, 'package-lock.json'), lockText, { flag: 'wx' })
  console.log(`Prepared frozen DSH ${dshVersion} smoke runtime: ${Object.keys(lock.packages).length - 1} locked packages`)
}
