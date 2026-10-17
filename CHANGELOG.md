# Changelog

## Unreleased

## 0.2.4

- 统一仓库内的 CI 依赖缓存，在开发检查和发布之间复用 npm 下载包，保留三组 DSH 兼容测试。
- 增加 main 手动 draft release 验收入口，校验包和源码身份，拒绝覆盖已有版本；插件与推理运行逻辑不变。

## 0.2.3

- Integrate the Agent capability center: require download consent for bundled profiles, order the Engine settings after Capabilities, and reject changed confirmed Engine release tags before downloading archives.
- Register chat reasoning controls for Qwen3.5/3.6 and Qwen3.8, dispatch explicit thinking enable/disable and mapped efforts, and repair incomplete saved model capabilities without discarding custom mappings.
- Keep Agent KV session files in the stable Agent cache instead of version-specific Engine installations, and preserve readable controls across all Agent themes.
- Integrate the Agent distribution with DSH 0.1/0.2 compatibility and verified standalone plugin updates.
- Keep bundled plugin updates under Agent ownership, desktop-owned file pickers, stable model storage, and optional first-run Engine bootstrap.
- Default setup to two concurrent slots while retaining the supported one-through-four choices; expose thinking mode and reasoning effort.
- Preserve startup errors and logs with common adjustment suggestions instead of inferred failure categories or automatic fallback.

## 0.2.2

- Make Windows installer prompts, DSH selection, installation results, errors, and bundled instructions bilingual in Chinese and English.
- Use UTF-8 console output and a BOM-encoded PowerShell installer so Chinese guidance remains readable on Windows PowerShell 5.1.
- Preserve the existing installation, profile rollback, and plugin self-update behavior.
- Keep frozen compatibility lockfile root versions aligned with the current plugin release without changing pinned dependencies.

## 0.2.1

- Offer stable GitHub Release self-updates for ZIP/local-tarball installations before catalog inclusion, without migrating Market or development sources.
- Show plugin download progress, cancellation, retry, and manual release links; add a manual check under Diagnostics.
- Verify SHA256, package identity, version, and prebuilt entries before installation through the current DSH profile.
- Retain rollback archives and restore the previous package after an installation failure; preserve unrelated profile settings and defer updates while an Engine or agent is active.
- Require a manual DSH restart after a standalone update and keep plugin updates separate from Engine/model downloads.
- Exercise real packaged-plugin update and restart flows on legacy DSH and official 0.2.0-rc.2 in CI.
- Freeze complete compatibility and test-host dependency trees with versioned lockfiles; pin the Windows runner family and bound host installation.

## 0.2.0

- First stable plugin release, with a Windows x86_64 one-click installer.
- Match manually selected DSH homes to their launcher, or ask explicitly when several unmatched launchers are available.
- Provide a unified Run page with a local/recommended model library, visible Engine/model download progress, retry, and cancellation.
- Configure context/output limits, one through four slots, automatic/manual memory profiles, KV quantization and SSD session cache, vision, embeddings, and MTP.
- Support local managed Engines or existing OpenAI-compatible endpoints, persistent API keys, native DSH provider synchronization, startup output, and managed runtime speeds.
- Keep manual, prompt-on-startup, and automatic startup distinct; require confirmation for low resources and offer another port on conflicts.
- Keep plugin and Engine updates separate and preserve existing settings and local model data.
- Gate GitHub releases on the full compatibility matrix and official packaged-plugin runtime smoke.
- Generate bilingual installation notes and version-specific download links for each release.
- Support version-matched `release-<version>` tags as well as `v<version>` tags.
- Validate package entries, lockfile metadata, publication boundaries, and catalog screenshots.
- Include third-party icon license notices and document installation-source-specific upgrades and platform limits.
- Reject misleading loopback-like domain names and bound stalled plugin-update requests.
- Support both the legacy DSH settings scope and the DSH 0.2 configuration forms API.
- Preserve legacy Schema field inference when volatile settings are unavailable and pin the CI plugin-manager pnpm runtime.
- Open the complete MoE4All setup surface on first use even when DSH restores a non-empty conversation.
- Limit managed Engine concurrency to one through four slots.
- Remove obsolete process-name and busy-prompt defaults.
## 0.2.0-alpha.20

- Use the MoE4All desktop-owned model picker when the integrated Agent supplies its authenticated loopback bridge.
- Default integrated Agent model downloads to its stable `models` directory instead of a version-specific DSH home.
- Classify Engine startup failures and show resource-specific next steps, including a one-click 1-slot retry when appropriate.

## 0.2.0-alpha.19

- Ask which DSH home to modify instead of silently choosing the first detected installation.
- Detect running source-built DSH profiles and provide a manual DSH_HOME option.
- Replace a stale MoE4All Git dependency transactionally before pnpm resolves the profile, restoring the manifest and lockfile if installation fails.

## 0.2.0-alpha.18

- Make the Windows installer use its bundled prebuilt plugin package instead of a floating GitHub source.
- Keep the bundled package in the target DSH home so deleting the extracted installer does not break the profile dependency.
- Replace prerelease-incompatible `releases/latest/download` README links with the Releases page.

## 0.2.0-alpha.15

- Add automatic plugin update discovery, progress, retry, and restart/refresh prompts through the public DSH Market API.
- Add a Release workflow that publishes a prebuilt package, SHA-256 hashes, and a one-click Windows installer ZIP.
- Expand the English and Chinese READMEs with catalog-ready installation, upgrade, uninstall, permissions, troubleshooting, and security guidance.

## 0.1.0-alpha.1

- Add the installable DSH bundle and default local MoE4All model route.
- Add connect, automatic, and managed engine lifecycle modes.
- Add loopback protection, health checks, process cleanup, and compatibility tests.
- Default to connection-only mode and the MoE4All `8080` port.
- Discover chat models from `/v1/models` and inject them into DSH's existing pi-ai adapter.
- Prevent duplicate engines by process identity, independent of listening IP or port.
- Gate automatic launch on more than 50% free RAM and live VRAM, with an explicit busy-machine prompt.
