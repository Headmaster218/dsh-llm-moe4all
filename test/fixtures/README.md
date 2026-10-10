# Frozen CI Dependencies

- `compat-dependencies` freezes the plugin's build/test dependencies for older DSH APIs. The default DSH API line uses the repository's main `package-lock.json`.
- `dsh-runtimes` freezes complete official DSH CLI installations, including transitive and peer dependencies, for packaged-plugin installation and self-update tests.

These directories contain package metadata and registry integrity hashes only, not DSH binaries or user profiles. CI installs them with `npm ci`; it must not resolve fresh dependency trees during a test run.

To update a compatibility line, generate its manifest from the current plugin manifest with only the DSH/Cordis/Schemastery development versions changed, then regenerate its lockfile using the pinned npm version and `--legacy-peer-deps`. Update both files together. Runtime dependency or toolchain changes must also refresh these snapshots; the preparation script rejects stale snapshots.

To update an official host, use `pinnedHostManifest` from `scripts/prepare-smoke-dsh.mjs` with the target DSH/Cordis/Schemastery versions and npm registry manifests. Install that manifest with the pinned npm version to generate the full lockfile, then verify installation, rollback, and restart before replacing its snapshot. The shared `dsh-client-runtime` remains at `0.1.1-rc.2` on the currently tested host lines.

An ordinary plugin version bump does not require regenerating dependency locks. The CI preparation script preserves the current release metadata while applying the selected dependency snapshot.
