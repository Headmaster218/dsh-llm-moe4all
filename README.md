# dsh-llm-moe4all

`dsh-llm-moe4all` connects DeepSeek Harness to a MoE4All OpenAI-compatible server and can safely manage a local server process when an executable and arguments are configured.

The plugin intentionally delegates chat, tools, images, reasoning blocks, retries, and replay compatibility to DSH's own `@deepseek-ai/dsh-llm-pi-ai` adapter. It owns endpoint and model discovery, guarded local startup, health monitoring, and shutdown.

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

The default endpoint is `http://127.0.0.1:8080/v1`. The plugin reads `/v1/models`, filters embedding models, and updates DSH's existing `llm-pi-ai` adapter in memory. The detected model IDs therefore stay accurate without persisting a second adapter configuration.

## Engine modes

- `connect` (default): connect to an already-running server and never start a process.
- `auto`: reuse a healthy server; otherwise consider starting the configured executable. Unattended startup requires both RAM and live VRAM to be more than 50% free.
- `managed`: like `auto`, but missing launch configuration is treated as an error.

Before any launch, the plugin checks the operating-system process list for `infr.exe`, `moe4all.exe`, and the configured executable name. An existing process prevents a second launch even when it listens on another IP or port. When RAM or VRAM is not more than 50% free, automatic startup pauses and asks for confirmation through the DSH Desktop/Electron dialog, with a native Windows dialog fallback. If no confirmation surface is available, it stays stopped.

Automatic launch is also disabled until both `executable` and `arguments` are configured. This prevents an unconfigured `infr.exe` from opening an interactive wizard inside DSH.

Example plugin-row override:

```yaml
- id: moe4all-engine
  config:
    mode: auto
    host: 127.0.0.1
    port: 1234
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

`host`, `port`, `protocol`, and `apiBasePath` are independently configurable. The advanced `endpoint` field overrides all four when non-empty. Endpoints are restricted to loopback by default; set `allowRemoteEndpoint: true` only for an intentional remote server. A remote endpoint is connection-only and never causes a local process launch. API keys stay outside the plugin configuration: `apiKeyEnv` names an existing environment variable.

## Security behavior

- No install-time downloads or process execution.
- Child processes are spawned directly with `shell: false`.
- Network access is loopback-only unless explicitly enabled.
- Existing engine processes are detected independently of the configured port.
- Unattended local launch requires strictly more than 50% free RAM and VRAM.
- The plugin never stores an API-key value in its configuration.
- A process started by the plugin is stopped when the plugin unloads by default.

## Develop

```powershell
npm install
npm run check
```

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
