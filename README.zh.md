# dsh-llm-moe4all

`dsh-llm-moe4all` 用于把 DeepSeek Harness（DSH）连接到 MoE4All OpenAI 兼容服务。它可以发现模型、自动配置 DSH、下载并管理本地 MoE4All Engine，以及在资源检查后启动或停止本地引擎进程。

聊天、工具调用、图片、思考块、重试和历史回放仍由 DSH 自带的 `@deepseek-ai/dsh-llm-pi-ai` 负责。插件更新和引擎更新彼此独立：更新本插件不会替换 Engine、模型、KV 缓存或会话。

English documentation: [README.md](README.md)

## 界面预览

同一个 MoE4All 页面内即可查看引擎状态和槽位实时速度，并完成模型选择、自动策略、可选能力与高级参数配置。

聊天模型选择器会为发现的 Qwen3.5/3.6（包括 35B）和 Qwen3.8 FlashNext 提供思考选项。Qwen3.5/3.6 提供关闭、Low、Medium、High、Xhigh 和 Max；强度由引擎的 Qwen35 提示词指令映射实现，需要使用包含该能力的引擎。FlashNext 提供关闭、Low、Medium 和 Xhigh，与其模板原生档位一致。关闭会明确发送 `chat_template_kwargs.enable_thinking=false`，并非发送空强度。仅包含这些已识别模型的提供商默认使用 Medium；已自定义的提供商默认值不变。重新发现模型时会补齐缺失选项，保留自定义强度映射及无关兼容设置，不为未知模型猜测这些能力。

![MoE4All 运行状态](https://raw.githubusercontent.com/Headmaster218/dsh-llm-moe4all/main/docs/screenshots/runtime-status.png)

<img src="https://raw.githubusercontent.com/Headmaster218/dsh-llm-moe4all/main/docs/screenshots/model-settings.png" alt="MoE4All 模型与运行参数设置" width="640">

## 安装

### 收录 DSH 插件市场前：Windows 一键安装

1. 直接下载 [0.2.3 Windows 一键安装 ZIP](https://github.com/Headmaster218/dsh-llm-moe4all/releases/download/release-0.2.3/dsh-llm-moe4all-windows.zip)，或打开 [GitHub Releases](https://github.com/Headmaster218/dsh-llm-moe4all/releases) 查看后续版本。
2. 解压并双击 `Install-MoE4All-Plugin.cmd`。
3. 选择目标 DSH；看到提示后再完成当前任务、彻底退出所选 DSH，然后按回车继续。
4. 重新启动所选 DSH。插件在首次尚未完成配置时会自动弹出 MoE4All 设置；若主动关闭，可再进入 **设置 > MoE4All**。

安装器提供中英双语引导，会列出能识别到的 DSH 数据目录，并要求用户明确选择。它支持常规 DSH Desktop、正在运行的源码版 DSH，也支持手动输入 `DSH_HOME`。随后，安装器会把压缩包内已经预编译好的插件保存到所选 DSH 的数据目录，再加入 `web` profile。它不会在安装时拉取 GitHub 源码或执行构建，也不需要管理员权限。

手动输入的数据目录优先使用与之匹配的已探测启动器；找不到匹配项且存在多个启动器时，还会要求选择启动器，不会直接使用第一个。

如果旧版 Git 安装在所选 profile 中留下了已经无法访问的提交，安装器会在 pnpm 解析依赖前只替换 `dsh-llm-moe4all` 这一项。安装失败时，原始 `package.json` 和 `pnpm-lock.yaml` 会自动恢复。

安装后需要重启对应 DSH profile。Bundle 是否生效是在 profile 启动时确定的。

### 被插件市场收录后

打开 **Plugin Market/插件市场**，搜索 `MoE4All`，选择 `dsh-llm-moe4all` 并点击安装，随后按提示重启 DSH。npm 包发布后，终端推荐命令会变为：

```powershell
dsh plugin --profile web add dsh-llm-moe4all
```

### Release 安装包说明

Release ZIP 内含预编译的 `dsh-llm-moe4all.tgz`，双击安装默认就使用它，不再解析 Git 源或现场编译插件：

```powershell
powershell.exe -NoLogo -NoProfile -File .\install-plugin.ps1
```

从 0.2.1 起，ZIP 安装的版本可在插件内检查 GitHub Releases 并更新。已经安装的 0.2.0 需先用新版 Windows 安装包升级一次，才能获得此能力。市场管理的安装继续使用市场公开 API。

## 最快开始使用

1. 按要求重启 DSH 后，MoE4All 设置会自动弹出。第一次使用时，插件会显示进度并下载最新兼容 Engine，失败时可以重试；若主动关闭，可再进入 **设置 > MoE4All**。
2. 选择已有 GGUF 模型，或下载推荐模型。
3. 不确定参数时保留“自动配置：保守”。
4. 点击 **运行**。插件会写入 Provider 配置，在允许时启动 Engine，并把探测到的模型同步给 DSH。

默认地址为 `http://127.0.0.1:8080/v1`。也可以只连接现有服务，并自行配置 IP、端口和 API key。

引擎自动安装和一键安装器支持 **Windows x86_64**。其他系统可以连接已有的 OpenAI 兼容服务，但不支持自动安装 Engine。引擎控制页面需要从本机环回地址访问 DSH。实时速度来自插件托管引擎的输出；外部服务没有这份日志，不能显示相同的速度信息。

在 MoE4All Agent 整合包内，模型下载默认进入产品稳定的 `models` 目录，原生文件选择器由 Agent 主窗口持有，配置默认双并发。启动失败保留原始错误和日志，仅给出降低并发、降低上下文、切换自动策略、选择更小模型等通用建议，不推断错误原因。内置插件随 Agent 整包更新；独立安装的插件仍可使用插件自更新。

## 插件自动更新

插件会在 DSH 打开后及页面保持打开期间每六小时检查自身更新。也可在 **设置 > MoE4All > 诊断 > 检查插件更新** 主动检查。插件更新的下载和安装始终需要用户确认。

- **ZIP／本地 `.tgz` 安装：** 从本仓库最新正式 GitHub Release 检查更新，不追踪 `main` 或预发布标签。显示下载进度、停止、重试和 Release 页面入口；校验 SHA256、包名、版本和预编译入口后，才通过当前 DSH profile 的安装入口安装，并禁用依赖构建脚本。仅调整本插件的依赖来源；安装失败会尝试恢复原 manifest、lockfile 和旧版本。回滚文件保留在 `profiles/<profile>/.moe4all-plugin-updates`。
- **市场／npm／Git 安装：** 继续通过公开 `/dsh-market/api/v1/*` 更新，不悄悄改成 Release 安装。开发链接和源码目录不自动覆盖；不支持的宿主可用 Windows 安装脚本或原安装方式升级。
- 在本机环回页面更新，并先停下插件托管的 Engine、结束运行中的 Agent。更新器不会停止外部引擎。
- 独立更新完成后需要**手动重启 DSH**加载新代码。插件不会自行结束 DSH、重启 Desktop 或停掉引擎。
- 这里只更新 `dsh-llm-moe4all`，不更换 Engine、模型、KV 缓存、凭据和会话。Engine 仍在 **设置 > MoE4All > 引擎** 单独更新。

npm 安装的插件可用以下命令更新（须先发布 npm 包）：

```powershell
dsh plugin --profile web update dsh-llm-moe4all
```

Bundle 更新后需要重启 DSH profile。

ZIP 安装器使用固定版本的本地 `.tgz`，上述命令不会下载新压缩包。请使用内置 Release 更新器（0.2.1 起），或重新运行新版 ZIP 安装器并选择同一个 DSH 数据目录。仅仅被市场收录，不代表本地文件依赖会自动转为市场管理。

## 禁用和卸载

在 DSH 的 **Plugins/插件** 页面可以只禁用 Bundle 而保留安装。彻底从 `web` profile 卸载：

```powershell
dsh plugin --profile web remove dsh-llm-moe4all
```

卸载后重启 DSH。卸载插件不会删除 MoE4All Engine、已下载模型、KV 缓存和已保存设置，避免误操作丢失大体积本地数据。

## 兼容性

- 已验证 DSH `0.1.1-rc.2`（DSH Desktop `0.6.3`）、DSH `0.1.5-rc.3` 和新官方 DSH `0.2.0-rc.2` 版本线。
- manifest 显式允许已知的 DSH `0.1.1` 到 `0.1.7` 预发布版本线，以及 `0.2.0` 预发布/正式版本线。
- 本插件需要 **Node.js 20.3.0 或更高版本**；DSH 自身可能要求更高版本。构建使用 `.node-version` 和 `package.json` 中固定的 Node/npm。
- CI 使用完整依赖 lockfile 检查上述三条版本线。`0.1.1-rc.2` 与 `0.2.0-rc.2` 运行时测试实际安装打包插件，检查宿主访问、原生 Provider 模型发现，并验证插件自更新、失败回滚和重启加载，不载入 GPU 模型。Node、npm、pnpm 与 Actions 均固定版本；Windows runner 固定为 `windows-2025` 版本线。
- manifest 允许的其他中间版本以及非 Windows 系统，不等于已经做过额外的端到端验证。

## 配置

绝大多数用户只需使用 **设置 > MoE4All**。页面覆盖本地或远程连接、模型库、保守/激进自动策略、上下文和输出上限、MTP、视觉、Embedding、KV 会话缓存、Engine 版本、自启动方式和高级启动参数。

自动部署时也可以直接覆盖 Bundle 配置：

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

`MOE4ALL_ENGINE` 环境变量也可以指定可执行文件。远程端点需要 `allowRemoteEndpoint: true`；插件不会在另一台机器上启动引擎。本地托管引擎可以明确配置为监听本机局域网地址或 `0.0.0.0`，非环回监听使用持久化 API key。API key 通过 DSH credentials 保存，不写进插件普通配置。

启动行为分为**手动启动、打开 DSH 时询问、自动启动**。资源不足或无法取得资源数据时仍须确认；端口冲突时提供空闲端口，不会停掉别人的服务。默认情况下，卸载/禁用插件或退出 DSH 会停止插件自己启动的引擎（`stopOnUnload: true`），不会停止外部服务。

## 权限与数据

插件可能执行以下操作：

- 读取和写入自身的 DSH 设置及 Provider 配置；
- 检查本机 RAM、VRAM、进程状态、Engine 版本和用户选择的模型目录；
- 首次配置时自动下载最新兼容 Engine，并显示进度、重试和手动下载入口；
- 仅在用户从界面选择后下载推荐模型；
- 使用 `shell: false` 直接启动 `infr.exe`，监控它，并且只停止由插件自己启动的进程；
- 访问配置的 OpenAI 兼容地址，并在明确下载或检查更新时访问 GitHub Releases 和 DSH Market。

插件不会把模型文件、会话内容或 API key 上传到本仓库。访问远程端点和对外提供 Engine 服务都需要显式配置。

## 常见问题

- **安装后找不到插件：** 完整重启 DSH profile，并在 **Plugins/插件** 中确认 `dsh-llm-moe4all` 已启用。
- **安装脚本找不到 DSH：** 安装 DSH Desktop，或把 `dsh` 加入 `PATH`，再重试。失败时脚本会显示手动命令。
- **一直没有更新提示：** 在 **诊断** 中主动检查。ZIP 自更新需要 0.2.1 及以后版本；0.2.0 需先通过安装器升级一次。市场安装需要 DSH Market 的公开更新 API；网络失败可重试或打开 Release 页面。
- **Engine 启动失败：** 打开 **设置 > MoE4All > 诊断** 查看启动输出。配置端口被占用或 RAM/VRAM 空闲不足时，需要确认继续或改用其他端口；插件不会因为其他无关的本地推理进程而阻止启动。
- **需要回滚：** 优先使用 DSH Market 提供的回滚按钮；也可以手动安装已知版本或 tag 后重启 profile。

报告问题时请提供插件版本、DSH 版本、操作系统和相关诊断行。提交前删除 API key、私有路径、提示词和其他个人数据。

## 开发与发布

```powershell
npm ci
npm run check
```

仓库提交了编译后的 `lib/`，因此 GitHub 安装不需要在安装期批准构建脚本。支持 `v<package-version>` 和 `release-<package-version>` 两种标签，必须与 `package.json` 完全一致。Release 会等待兼容性矩阵和官方安装测试通过，再生成预编译 `.tgz`、Windows 一键安装 ZIP 和 SHA-256 校验文件。预发布版本会标记为 prerelease；此流程**不会自动发布 npm 包**。

模块划分、验证方式和可以直接用于收录 PR 的条目见 [维护与发布说明](docs/maintaining.md)。原始完整截图已在 [screenshots.json](screenshots.json) 声明；发版和插件市场收录是两件独立的事。

## 许可与安全

Apache-2.0，详见 [LICENSE](LICENSE)、[NOTICE](NOTICE) 和 [第三方许可](THIRD-PARTY-NOTICES.txt)。

普通问题请提交到 [GitHub Issues](https://github.com/Headmaster218/dsh-llm-moe4all/issues)，不要公开凭据或私有数据。安全问题优先使用 GitHub 的私密漏洞报告入口；若该入口不可用，请先通过 GitHub 私下联系维护者，不要直接公开漏洞细节。
