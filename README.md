# dsh-llm-moe4all

`dsh-llm-moe4all` connects DeepSeek Harness to a local MoE4All OpenAI-compatible server and can manage the server process when an executable and arguments are configured.

The plugin intentionally delegates chat, tools, images, reasoning blocks, retries, and replay compatibility to DSH's own `@deepseek-ai/dsh-llm-pi-ai` adapter. It owns only local engine discovery, startup, health monitoring, and shutdown.

Chinese documentation: [README.zh.md](README.zh.md)

## Compatibility

- Tested baseline: DSH `0.1.1-rc.2`, shipped by DSH Desktop `0.6.3`.
- Current npm latest: DSH `0.1.5-rc.3`.
- The declared compatibility range also admits the known `0.1.7` prerelease line.
- Node.js 20 or newer is required.

## Install

From GitHub during development:

```powershell
dsh plugin --profile web add github:Headmaster218/dsh-llm-moe4all
```

After the npm release:

```powershell
dsh plugin --profile web add dsh-llm-moe4all
```

The bundle adds a `moe4all` provider at `http://127.0.0.1:1234/v1` and a generic `MoE4All Local` model entry. MoE4All routes an unknown model name to the first loaded chat model, so the generic entry works for the normal single-model server. Use DSH's Models settings and discovery flow when one server hosts multiple models.

## Engine modes

- `connect`: connect to an already-running server and never start a process.
- `auto`: reuse a healthy server; otherwise start the configured executable. Missing launch configuration is reported without preventing DSH from starting.
- `managed`: like `auto`, but missing launch configuration is treated as an error.

Automatic launch is disabled until both `executable` and `arguments` are configured. This prevents an unconfigured `infr.exe` from opening an interactive wizard inside DSH.

Example plugin-row override:

```yaml
- id: moe4all-engine
  config:
    mode: auto
    endpoint: http://127.0.0.1:1234/v1
    executable: D:\AIinfr\infr\target\release\infr.exe
    arguments:
      - serve
      - --dev
      - Vulkan1
      - --ctx
      - 160k
      - D:\Models\model.gguf
    workingDirectory: D:\AIinfr\infr
```

`MOE4ALL_ENGINE` can supply the executable path. If neither the setting nor the environment variable is present, the plugin also checks `engine/infr.exe`, the configured working directory, and `PATH`.

Endpoints are restricted to loopback by default. Set `allowRemoteEndpoint: true` only when the remote server is intentional. API keys stay outside the plugin configuration: set `apiKeyEnv` to the name of an existing environment variable and configure the same credential reference in DSH's Models settings.

## Security behavior

- No install-time downloads or process execution.
- Child processes are spawned directly with `shell: false`.
- Network access is loopback-only unless explicitly enabled.
- The plugin never stores an API-key value in its configuration.
- A process started by the plugin is stopped when the plugin unloads by default.

## Develop

```powershell
npm install
npm run check
```

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
