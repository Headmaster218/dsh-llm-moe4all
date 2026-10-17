# dsh-llm-moe4all

`dsh-llm-moe4all` connects DeepSeek Harness (DSH) to a MoE4All OpenAI-compatible server. It can discover models, configure DSH automatically, download and manage local MoE4All Engine releases, and start or stop a guarded local Engine process.

Chat, tools, images, reasoning blocks, retries, and replay stay on DSH's own `@deepseek-ai/dsh-llm-pi-ai` adapter. Plugin updates and Engine updates are separate: updating this plugin never replaces the Engine, models, KV cache, or conversations.

Chinese documentation: [README.zh.md](README.zh.md)

## Interface

The same MoE4All page covers Engine status, live slot speed, model selection, automatic profiles, optional capabilities, and advanced settings.

The chat model selector also offers reasoning controls for discovered Qwen3.5/3.6 models (including 35B) and Qwen3.8 FlashNext. Qwen3.5/3.6 exposes Off, Low, Medium, High, Xhigh, and Max; strength uses the Engine's Qwen35 prompt-instruction mapping, so the Engine must include that support. FlashNext exposes Off, Low, Medium, and Xhigh, matching its native template. Off sends `chat_template_kwargs.enable_thinking=false`, not an empty effort. A route containing only these recognized models defaults to Medium unless a provider default was customized. Rediscovery adds missing choices while retaining custom effort mappings and unrelated compatibility settings; other models are not assigned these capabilities by guesswork.

![MoE4All runtime status](https://raw.githubusercontent.com/Headmaster218/dsh-llm-moe4all/main/docs/screenshots/runtime-status.png)

<img src="https://raw.githubusercontent.com/Headmaster218/dsh-llm-moe4all/main/docs/screenshots/model-settings.png" alt="MoE4All model and runtime settings" width="640">

## Install

### Before the DSH catalog listing: one-click Windows install

1. Download the [0.2.4 Windows installer ZIP](https://github.com/Headmaster218/dsh-llm-moe4all/releases/download/release-0.2.4/dsh-llm-moe4all-windows.zip), or check [GitHub Releases](https://github.com/Headmaster218/dsh-llm-moe4all/releases) for newer versions.
2. Extract the ZIP and double-click `Install-MoE4All-Plugin.cmd`.
3. Select the target DSH. When prompted, finish active work, fully exit that DSH instance, and press Enter.
4. Restart the selected DSH. On its first unconfigured start, the plugin opens the MoE4All setup automatically. If it was dismissed, open **Settings > MoE4All**.

The installer provides Chinese and English guidance, lists the DSH homes it can identify, and asks which one to modify. It recognizes normal DSH Desktop installs, running source-built DSH instances, and an explicitly entered `DSH_HOME`. It then stores the bundled prebuilt plugin package under the selected home and adds it to the `web` profile. It does not clone GitHub source, run an install-time build, or require administrator rights.

A manually entered home uses its matching detected launcher. If no launcher can be matched and several are available, the installer asks which launcher to use rather than choosing the first one.

If an earlier Git installation left an unreachable commit in the selected profile, the installer replaces only the `dsh-llm-moe4all` dependency before pnpm resolves the profile. The original `package.json` and `pnpm-lock.yaml` are restored automatically if installation fails.

Restart the profile after installation. DSH loads Bundle membership only at profile startup.

### After the catalog listing

Open **Plugin Market**, search for `MoE4All`, choose `dsh-llm-moe4all`, and click **Install**. Restart DSH when prompted. The npm command will become the preferred terminal path after the package is published:

```powershell
dsh plugin --profile web add dsh-llm-moe4all
```

### Release bundle details

The Release ZIP contains a prebuilt `dsh-llm-moe4all.tgz`. The one-click installer uses it by default, avoiding Git source resolution and install-time compilation:

```powershell
powershell.exe -NoLogo -NoProfile -File .\install-plugin.ps1
```

Starting with 0.2.1, ZIP-installed copies can check GitHub Releases and update from inside the plugin. Existing 0.2.0 copies need the newer Windows installer once to gain this capability. Market-managed installations keep the Market update flow when its public API is available.

## Quick Start

1. After the required DSH restart, the MoE4All setup opens automatically. On first use the plugin downloads the latest compatible Engine with visible progress and retry controls. If the setup was dismissed, open **Settings > MoE4All**.
2. Select an existing GGUF model or download one of the recommended model families.
3. Keep the conservative automatic profile unless you want to tune memory and paging manually.
4. Click **Run**. The plugin writes the provider configuration, starts the Engine when allowed, and makes discovered models available to DSH.

The default endpoint is `http://127.0.0.1:8080/v1`. Existing servers can be used in connection-only mode, including a custom IP, port, and API key.

Automatic Engine installation and the Windows installer support **Windows x86_64**. Other hosts can connect to an existing OpenAI-compatible service; automatic Engine installation there is not supported. Open DSH through its local loopback address to use Engine controls. Real-time throughput is collected from a plugin-managed Engine's output; an external server does not provide those logs.

Inside the integrated MoE4All Agent, model downloads default to the product's stable `models` directory and the native file chooser is owned by the Agent window. The setup defaults to two concurrent slots. Startup failures preserve the original error and logs, with general suggestions to reduce concurrency, reduce context, switch automatic profiles, or choose a smaller model. Built-in plugin updates belong to the Agent bundle; standalone plugin self-updates remain available outside the bundle.

## Plugin Updates

The plugin checks shortly after DSH opens and every six hours while its page remains open. Use **Settings > MoE4All > Diagnostics > Check plugin updates** for a manual check. Downloading/installing a plugin update always requires confirmation.

- **ZIP/local `.tgz` installs:** check this repository's latest stable GitHub Release, not `main` or prerelease tags. The prompt shows download progress, stop/retry controls, and a release-page link. SHA256 and the prebuilt package are verified before the current DSH profile's installer runs with dependency build scripts disabled. Only this plugin's dependency is retargeted; an installation failure attempts to restore the previous manifest, lockfile, and package. Backups remain in `profiles/<profile>/.moe4all-plugin-updates`.
- **Market/npm/Git installs:** continue through the public `/dsh-market/api/v1/*` API when available. Development links/checkouts are not silently replaced by release archives. Unsupported hosts can use the Windows installer or their original installation method.
- Update from the local loopback UI after stopping the plugin-managed Engine and finishing active agent runs. An external Engine is never stopped by the updater.
- After a standalone update, **restart DSH manually** to load the new code. The updater does not terminate DSH, restart Desktop, or stop the Engine itself.
- The update changes only `dsh-llm-moe4all`, not Engine releases, model files, KV caches, credentials, or conversations. Engine updates remain under **Settings > MoE4All > Engine**.

For an npm-installed copy (after npm publication), update with:

```powershell
dsh plugin --profile web update dsh-llm-moe4all
```

Restart the DSH profile after a Bundle update.

The ZIP installer pins a versioned local `.tgz`; the command above cannot fetch a newer local archive. Use the built-in Release updater (0.2.1+) or rerun the newer ZIP installer for the same DSH home. Catalog listing does not convert a local-file dependency into a market-managed one.

## Disable or Uninstall

Use DSH's **Plugins** page to disable the Bundle without removing it. To uninstall it completely from the `web` profile:

```powershell
dsh plugin --profile web remove dsh-llm-moe4all
```

Restart DSH afterward. Removal preserves MoE4All Engine files, downloaded models, KV cache, and saved plugin settings so an accidental uninstall does not delete large local data.

## Compatibility

- Verified with DSH `0.1.1-rc.2` (DSH Desktop `0.6.3`), DSH `0.1.5-rc.3`, and the official DSH `0.2.0-rc.2` line.
- The manifest explicitly admits the known DSH `0.1.1` through `0.1.7` prerelease lines and the `0.2.0` prerelease/stable line.
- Node.js **20.3.0 or newer** is required by this plugin; DSH may require a newer version. Builds use the pinned Node/npm versions in `.node-version` and `package.json`.
- CI checks all three verified DSH lines with frozen dependency lockfiles. The `0.1.1-rc.2` and `0.2.0-rc.2` runtime tests install the packaged plugin, verify host access and native-provider model discovery, and exercise plugin self-update, failure rollback, and restart activation without loading GPU models. Node, npm, pnpm, and Actions are pinned; the Windows runner uses the `windows-2025` family.
- Declared intermediate DSH lines and non-Windows hosts are not additional end-to-end test results.

## Configuration

Most users should configure the plugin in **Settings > MoE4All**. The page covers local or remote connection, model library, conservative/aggressive automatic profiles, context and output limits, MTP, vision, embeddings, KV session cache, Engine versions, startup behavior, and advanced launch arguments.

For deployment automation, the Bundle row remains configurable in YAML:

```yaml
- id: moe4all-engine
  config:
    mode: auto
    host: 127.0.0.1
    port: 8080
    executable: D:\MoE4All\infr.exe
    arguments:
      - serve
      - --ctx
      - 160k
      - D:\Models\model.gguf
```

`MOE4ALL_ENGINE` may provide the executable path. Remote endpoints require `allowRemoteEndpoint: true`; the plugin never launches an Engine on another machine. A managed local Engine can explicitly listen on a local LAN address or `0.0.0.0`, with a persistent API key for non-loopback serving. API key values are stored through DSH credentials, not in the plugin's ordinary configuration.

Startup choices are **manual**, **ask on DSH startup**, or **automatic**. Low resources or an unavailable resource measurement require confirmation; a busy port offers a free alternative rather than stopping another process. By default, unloading/disabling the plugin or exiting DSH stops only its own Engine (`stopOnUnload: true`). An externally started server is never stopped.

## Permissions and Data

The plugin can:

- read and write its DSH settings and provider rows;
- inspect local RAM, VRAM, process state, Engine versions, and selected model directories;
- automatically download the latest compatible Engine during first-time setup, with visible progress, retry, and manual download controls;
- download a recommended model only after the user selects it in the UI;
- start `infr.exe` directly with `shell: false`, monitor it, and stop only the process it owns;
- call the configured OpenAI-compatible endpoint, plus GitHub Releases and DSH Market for explicit downloads or update checks.

It does not upload model files, conversation content, or API keys to the plugin repository. Remote endpoint access and non-loopback Engine serving require explicit configuration.

## Troubleshooting

- **Plugin does not appear:** fully restart the DSH profile after install and confirm `dsh-llm-moe4all` is enabled under **Plugins**.
- **Installer cannot find DSH:** install DSH Desktop, or put `dsh` on `PATH`, then rerun the script. The manual command is printed on failure.
- **Update prompt never appears:** check manually under **Diagnostics**. ZIP self-updates require 0.2.1+; 0.2.0 needs one installer upgrade. Market-managed copies require the public DSH Market update API. Network failures offer retry and the release-page link.
- **Engine does not start:** open **Settings > MoE4All > Diagnostics** and inspect startup output. A busy configured port or low free RAM/VRAM requires confirmation or a different port; unrelated local inference processes are not blocked.
- **Need to roll back:** use DSH Market's rollback action when offered, or install a known package/tag and restart the profile.

When reporting a bug, include the plugin version, DSH version, operating system, and the relevant diagnostic lines. Remove API keys, private paths, prompts, and other personal data first.

## Development

```powershell
npm ci
npm run check
```

The repository includes compiled `lib/` output so GitHub installs do not need install-time build approval. Both `v<package-version>` and `release-<package-version>` tags trigger publication. The tag must exactly match `package.json`. Release publication waits for the compatibility matrix and official installation smoke test, then creates a prebuilt `.tgz`, a one-click Windows ZIP, and SHA-256 hashes. Prerelease versions are marked as prereleases; this workflow does **not** publish to npm.

See [Maintaining and Releasing](docs/maintaining.md) for module boundaries, validation, and the ready-to-copy catalog submission entry. Screenshots are declared in [screenshots.json](screenshots.json); catalog listing is separate from releasing the plugin.

## License and Security

Apache-2.0. See [LICENSE](LICENSE), [NOTICE](NOTICE), and [Third-Party Notices](THIRD-PARTY-NOTICES.txt).

Report ordinary bugs through [GitHub Issues](https://github.com/Headmaster218/dsh-llm-moe4all/issues). Do not post credentials or private data. For a security issue, use GitHub's private vulnerability reporting surface when available; otherwise contact the maintainer privately before opening a public issue.
