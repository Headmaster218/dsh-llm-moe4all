# dsh-llm-moe4all

`dsh-llm-moe4all` 用于把 DeepSeek Harness 连接到 MoE4All OpenAI 兼容服务，并可在配置好可执行文件和参数后安全地管理本地后端进程。

聊天、工具调用、图片、思考块、重试和历史回放兼容性由 DSH 自带的 `@deepseek-ai/dsh-llm-pi-ai` 负责。本插件只负责端点与模型发现、受保护的本地启动、健康检查和关闭，因此能尽量兼容不同 DSH 版本。

English documentation: [README.md](README.md)

## 兼容版本

- 已安装基线：DSH Desktop `0.6.3` 内置的 DSH `0.1.1-rc.2`。
- 当前 npm latest：DSH `0.1.5-rc.3`。
- 声明的兼容范围同时覆盖已知的 `0.1.7` 预发布版本线。
- 需要 Node.js 20 或更高版本。

## 安装

开发阶段从 GitHub 安装：

```powershell
dsh plugin --profile web add github:Headmaster218/dsh-llm-moe4all
```

发布 npm 后安装：

```powershell
dsh plugin --profile web add dsh-llm-moe4all
```

默认端点是 `http://127.0.0.1:8080/v1`。插件会读取 `/v1/models`，过滤 Embedding 模型，并在内存中更新 DSH 已有的 `llm-pi-ai` 适配器。因此模型 ID 会自动保持准确，也不会持久化第二份适配器配置。

## 引擎模式

- `connect`（默认）：只连接已经运行的服务，从不启动进程。
- `auto`：优先复用健康的服务，否则考虑启动已配置的可执行文件。仅当 RAM 和实时 VRAM 都严格超过 50% 空闲时，才会无人值守地启动。
- `managed`：行为与 `auto` 类似，但配置不完整会记录为错误。

每次启动前，插件都会从操作系统进程列表检查 `infr.exe`、`moe4all.exe` 和配置的可执行文件名。即使已有进程监听的是其他 IP 或端口，也不会再启动第二个实例。RAM 或 VRAM 不足一半空闲时，插件会暂停并通过 DSH Desktop/Electron 对话框询问；Windows 下还有原生对话框回退。没有可用确认界面时保持停止。

只有同时配置 `executable` 和 `arguments` 后才会自动启动。这可以避免未配置的 `infr.exe` 在 DSH 内部打开交互式启动向导。

插件配置覆盖示例：

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

也可以通过 `MOE4ALL_ENGINE` 环境变量指定可执行文件。两者都未设置时，插件还会检查包内 `engine/infr.exe`、工作目录和 `PATH`。

`host`、`port`、`protocol` 和 `apiBasePath` 可以分别配置；高级字段 `endpoint` 非空时会覆盖这四项。默认只允许回环地址，仅在明确连接远程服务时设置 `allowRemoteEndpoint: true`。远程端点只用于连接，绝不会触发本地进程启动。API key 的值不会写进插件配置，`apiKeyEnv` 只填写已有环境变量的名称。

## 安全行为

- 安装阶段不下载文件，也不执行进程。
- 子进程使用 `shell: false` 直接启动。
- 除非显式开启，否则只访问本机回环地址。
- 不依赖端口，通过进程身份阻止重复启动引擎。
- 无人值守本地启动要求 RAM 和 VRAM 都严格超过 50% 空闲。
- 插件配置不会保存 API key 的值。
- 插件启动的进程默认会在插件卸载时停止。

## 开发

```powershell
npm install
npm run check
```

## 许可证

Apache-2.0，详见 [LICENSE](LICENSE) 和 [NOTICE](NOTICE)。
