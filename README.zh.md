# dsh-llm-moe4all

`dsh-llm-moe4all` 用于把 DeepSeek Harness 连接到本机的 MoE4All OpenAI 兼容服务，并可在配置好可执行文件和参数后管理后端进程。

聊天、工具调用、图片、思考块、重试和历史回放兼容性由 DSH 自带的 `@deepseek-ai/dsh-llm-pi-ai` 负责。本插件只负责本地引擎发现、启动、健康检查和关闭，因此能尽量兼容不同 DSH 版本。

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

插件默认增加 `http://127.0.0.1:1234/v1` 上的 `moe4all` Provider，以及一个 `MoE4All Local` 通用模型。MoE4All 会把未知模型名路由到首个聊天模型，因此普通单模型服务可以直接使用。一个服务承载多个模型时，请在 DSH 的模型设置中执行模型发现并选择真实模型 ID。

## 引擎模式

- `connect`：只连接已经运行的服务，从不启动进程。
- `auto`：优先复用健康的服务，否则启动已配置的可执行文件；配置不完整不会阻止 DSH 启动。
- `managed`：行为与 `auto` 类似，但配置不完整会记录为错误。

只有同时配置 `executable` 和 `arguments` 后才会自动启动。这可以避免未配置的 `infr.exe` 在 DSH 内部打开交互式启动向导。

插件配置覆盖示例：

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

也可以通过 `MOE4ALL_ENGINE` 环境变量指定可执行文件。两者都未设置时，插件还会检查包内 `engine/infr.exe`、工作目录和 `PATH`。

默认只允许回环地址。仅在明确需要连接远程服务时设置 `allowRemoteEndpoint: true`。API key 的值不会写进插件配置；`apiKeyEnv` 只填写已有环境变量的名称，并在 DSH 模型设置中配置相同的凭据引用。

## 安全行为

- 安装阶段不下载文件，也不执行进程。
- 子进程使用 `shell: false` 直接启动。
- 除非显式开启，否则只访问本机回环地址。
- 插件配置不会保存 API key 的值。
- 插件启动的进程默认会在插件卸载时停止。

## 开发

```powershell
npm install
npm run check
```

## 许可证

Apache-2.0，详见 [LICENSE](LICENSE) 和 [NOTICE](NOTICE)。
