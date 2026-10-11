# Maintaining and Releasing

## Boundaries

- `src/index.ts`: Cordis activation, settings adapters, and lifecycle ownership.
- `src/engine-controller.ts`: local process startup, port/resource guards, health, output, and shutdown.
- `src/engine-release.ts`, `model-download.ts`, `model-files.ts`: separate Engine installation, model downloads, and bounded local discovery.
- `src/model-provider.ts`, `api-key.ts`: model synchronization into DSH's original pi-ai provider and credential references.
- `src/host-routes.ts`: loopback-only control API behind the DSH web host.
- `src/client/`: shared settings page, first-use overlay, status, and optional Market update UI.
- `lib/`: committed distribution generated from `src/`; never edit manually.
- `installer/`, `scripts/`, `test/`: installation transaction, release tools, and regression checks. They are not shipped as runtime source in the npm tarball.

The plugin does not implement inference, a new chat protocol, or a replacement Agent runtime. Keep changes scoped to the plugin; production DSH profiles and the standalone Engine repository are not test fixtures.

## Release Checklist

1. Set the intended version in `package.json` and the lockfile; move completed changes from `Unreleased` to that version in `CHANGELOG.md`. Stable versions have no `-alpha` or `-rc` suffix.
2. Use `.node-version` and `packageManager`, then `npm ci` and `npm run check`. Commit regenerated `lib/` together with its source. Check that both READMEs describe tested behavior rather than assumed compatibility.
3. Build locally with `powershell.exe -NoProfile -File scripts/build-release.ps1 -ExpectedTag release-<version>`, then run `scripts/check-release.ps1 -OutputDirectory dist`. The ZIP includes installer scripts, the prebuilt plugin, its version, and license notices. No user configuration, credentials, models, or cache belongs in an artifact.
4. On isolated DSH homes, verify first-use configuration, save/reopen, start/stop, model discovery and conversation, and upgrade with settings intact. Both legacy and official `0.2.0-rc.2` settings adapters matter. Real GPU chat, vision, and MTP checks are manual gates; the CI mock server is not evidence of inference correctness or performance.
5. Merge the verified changes before pushing either `release-<version>` or `v<version>` at that commit. Release CI reruns the same compatibility workflow and blocks publication on failure. It does not publish npm or submit the catalog entry.
6. Download the resulting Windows ZIP and test it in a disposable DSH home. Check hashes against `SHA256SUMS.txt`. Retain earlier releases for rollback.

Publication is complete only after the tag's Release workflow succeeds and all three public assets can be downloaded and verified.

## Catalog Submission

Follow the catalog's [current contribution guide](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md). After publishing a stable release, submit one new file to `awesome-dsh-plugin/awesome-dsh-plugin`:

`data/plugins/Headmaster218__dsh-llm-moe4all.yml`

```yaml
url: https://github.com/Headmaster218/dsh-llm-moe4all
name: Headmaster218/dsh-llm-moe4all
category: model
description:
  en: Runs MoE4All models locally in DSH with automatic engine installation, model discovery and downloads, inference settings, and live speed monitoring, or connects to an existing service.
  zh: 在 DSH 中运行 MoE4All 本地模型，支持引擎自动安装、模型发现与下载、推理参数配置和实时速度监控，也可连接已有服务。
tarball: https://github.com/Headmaster218/dsh-llm-moe4all/releases/latest/download/dsh-llm-moe4all.tgz
```

Verify that the tarball link works **after a stable release exists**; prerelease-only repositories do not have this `latest` asset. Asset names stay version-free. Do not edit the catalog's generated READMEs. Check the public repository's `dsh-plugin` topic, age, `dsh.bundle`, and original upstream peer dependencies. The local [screenshot manifest](../screenshots.json) uses the original full images. npm publication is optional and separate; review and inclusion are not automatic.

Prepared entry and PR text are in [catalog-submission](catalog-submission/PR.md). Copy only the entry into a catalog contribution branch. Verify the public Release links before opening that PR.

## Reproducing the Official Host Smoke

Install the pinned official DSH into a disposable directory, initialize its `web` profile, and install the built plugin `.tgz` using that DSH's CLI. Set `DSH_HOME` and `DSH_AGENTS_HOME` to isolated directories before initialization. Then run:

```powershell
node scripts/smoke-official-dsh.mjs <absolute-dsh-bin.js> <isolated-dsh-home>
```

The smoke uses random loopback ports, a mock model endpoint, bounded authenticated requests, and a 90-second overall deadline. It verifies active plugin routes and model synchronization without downloading or starting an Engine, and stops its owned host on exit. See `.github/workflows/ci.yml` for exact installation commands.
