# dsh-llm-moe4all

`dsh-llm-moe4all` connects DeepSeek Harness (DSH) to a MoE4All OpenAI-compatible server. It can discover models, configure DSH automatically, download and manage local MoE4All Engine releases, and start or stop a guarded local Engine process.

Chat, tools, images, reasoning blocks, retries, and replay stay on DSH's own `@deepseek-ai/dsh-llm-pi-ai` adapter. Plugin updates and Engine updates are separate: updating this plugin never replaces the Engine, models, KV cache, or conversations.

Chinese documentation: [README.zh.md](README.zh.md)

## Install

### Before the DSH catalog listing: one-click Windows install

1. Open [GitHub Releases](https://github.com/Headmaster218/dsh-llm-moe4all/releases) and download `dsh-llm-moe4all-windows.zip` from the newest release.
2. Extract the ZIP and double-click `Install-MoE4All-Plugin.cmd`.
3. Select the target DSH. When prompted, finish active work, fully exit that DSH instance, and press Enter.
4. Restart the selected DSH and open **Settings > MoE4All**.

The installer lists the DSH homes it can identify and asks which one to modify. It recognizes normal DSH Desktop installs, running source-built DSH instances, and an explicitly entered `DSH_HOME`. It then stores the bundled prebuilt plugin package under the selected home and adds it to the `web` profile. It does not clone GitHub source, run an install-time build, or require administrator rights.

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

Before the plugin is listed in DSH Market, install a newer plugin release by downloading and running its newer Windows installer. Once catalog updates are available, the in-app update prompt can replace this bootstrap path.

## Quick Start

1. Open **Settings > MoE4All**. On first use the plugin downloads the latest compatible Engine with visible progress and retry controls.
2. Select an existing GGUF model or download one of the recommended model families.
3. Keep the conservative automatic profile unless you want to tune memory and paging manually.
4. Click **Run**. The plugin writes the provider configuration, starts the Engine when allowed, and makes discovered models available to DSH.

The default endpoint is `http://127.0.0.1:8080/v1`. Existing servers can be used in connection-only mode, including a custom IP, port, and API key.

## Plugin Updates

When `dshmarket` with the public update API is installed, the plugin checks for its own update shortly after DSH opens. An available update appears as a small non-blocking prompt with progress, retry, and the correct refresh or restart action.

- The updater calls only `/dsh-market/api/v1/*`; it does not spawn a package manager or edit the profile itself.
- Update checks are silent when DSH Market is absent or its public API is unavailable.
- The prompt updates only `dsh-llm-moe4all`. Engine releases remain under **Settings > MoE4All > Engine**.
- An active agent may cause DSH Market to defer the update until the run finishes.

Manual update:

```powershell
dsh plugin --profile web update dsh-llm-moe4all
```

Restart the DSH profile after a Bundle update.

## Disable or Uninstall

Use DSH's **Plugins** page to disable the Bundle without removing it. To uninstall it completely from the `web` profile:

```powershell
dsh plugin --profile web remove dsh-llm-moe4all
```

Restart DSH afterward. Removal preserves MoE4All Engine files, downloaded models, KV cache, and saved plugin settings so an accidental uninstall does not delete large local data.

## Compatibility

- Verified with DSH `0.1.1-rc.2` (DSH Desktop `0.6.3`) and DSH `0.1.5-rc.3`.
- The manifest explicitly admits the known DSH `0.1.1` through `0.1.7` prerelease lines.
- Node.js 20 or newer is required for standalone DSH installations.
- CI builds, tests, and dry-packs the plugin on every push and pull request.

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

`MOE4ALL_ENGINE` may provide the executable path. A non-loopback endpoint must be explicitly enabled and is always connection-only. API key values are stored through DSH credentials, not in the plugin's ordinary configuration.

## Permissions and Data

The plugin can:

- read and write its DSH settings and provider rows;
- inspect local RAM, VRAM, process state, Engine versions, and selected model directories;
- download user-approved Engine or model files from the URLs shown in the UI;
- start `infr.exe` directly with `shell: false`, monitor it, and stop only the process it owns;
- call the configured OpenAI-compatible endpoint, plus GitHub Releases and DSH Market for explicit downloads or update checks.

It does not upload model files, conversation content, or API keys to the plugin repository. Remote endpoint access and non-loopback Engine serving require explicit configuration.

## Troubleshooting

- **Plugin does not appear:** fully restart the DSH profile after install and confirm `dsh-llm-moe4all` is enabled under **Plugins**.
- **Installer cannot find DSH:** install DSH Desktop, or put `dsh` on `PATH`, then rerun the script. The manual command is printed on failure.
- **Update prompt never appears:** install or update `dshmarket`; without its public update API, use the manual update command above.
- **Engine does not start:** open **Settings > MoE4All > Diagnostics** and inspect startup output. Existing MoE4All processes and low free RAM/VRAM intentionally require intervention.
- **Need to roll back:** use DSH Market's rollback action when offered, or install a known package/tag and restart the profile.

When reporting a bug, include the plugin version, DSH version, operating system, and the relevant diagnostic lines. Remove API keys, private paths, prompts, and other personal data first.

## Development

```powershell
npm install
npm run check
```

The repository includes compiled `lib/` output so GitHub installs do not need install-time build approval. Release tags run the same checks, create a prebuilt `.tgz`, create the one-click Windows ZIP, publish SHA-256 hashes, and open the GitHub Release.

For catalog submission, the repository already declares `dsh.bundle`, uses the `dsh-plugin` topic, and fits the `model` category. The catalog entry should point to the repository root and describe only the local MoE4All provider and Engine management behavior implemented here.

## License and Security

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

Report ordinary bugs through [GitHub Issues](https://github.com/Headmaster218/dsh-llm-moe4all/issues). Do not post credentials or private data. For a security issue, use GitHub's private vulnerability reporting surface when available; otherwise contact the maintainer privately before opening a public issue.
