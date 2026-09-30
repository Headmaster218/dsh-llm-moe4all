# dsh-llm-moe4all

`dsh-llm-moe4all` 用于把 DeepSeek Harness（DSH）连接到 MoE4All OpenAI 兼容服务。它可以发现模型、自动配置 DSH、下载并管理本地 MoE4All Engine，以及在资源检查后启动或停止本地引擎进程。

聊天、工具调用、图片、思考块、重试和历史回放仍由 DSH 自带的 `@deepseek-ai/dsh-llm-pi-ai` 负责。插件更新和引擎更新彼此独立：更新本插件不会替换 Engine、模型、KV 缓存或会话。

English documentation: [README.md](README.md)

## 安装

### 收录 DSH 插件市场前：Windows 一键安装

1. 从最新 Release 下载 [`dsh-llm-moe4all-windows.zip`](https://github.com/Headmaster218/dsh-llm-moe4all/releases/latest/download/dsh-llm-moe4all-windows.zip)。
2. 解压，完成当前 DSH 任务，并彻底退出 DSH Desktop。
3. 双击 `Install-MoE4All-Plugin.cmd`。
4. 重新启动 DSH，进入 **设置 > MoE4All**。

安装器会自动寻找 `dsh` 命令或常规安装的 DSH Desktop，并把可跟踪更新的 GitHub 源加入 `web` profile，不需要管理员权限。

新版 DSH 也可以在 **Plugins/插件 > 安装外部插件** 中直接输入：

```text
github:Headmaster218/dsh-llm-moe4all
```

等价的终端命令是：

```powershell
dsh plugin --profile web add github:Headmaster218/dsh-llm-moe4all
```

安装后需要重启对应 DSH profile。Bundle 是否生效是在 profile 启动时确定的。

### 被插件市场收录后

打开 **Plugin Market/插件市场**，搜索 `MoE4All`，选择 `dsh-llm-moe4all` 并点击安装，随后按提示重启 DSH。npm 包发布后，终端推荐命令会变为：

```powershell
dsh plugin --profile web add dsh-llm-moe4all
```

### 离线备用安装

Release ZIP 里同时带有预编译的 `dsh-llm-moe4all.tgz`：

```powershell
powershell.exe -NoLogo -NoProfile -File .\install-plugin.ps1 -Offline
```

本地 tarball 无法自动跟踪线上版本。网络恢复后需要从 GitHub 或 npm 重装一次，才能恢复自动更新。

## 最快开始使用

1. 打开 **设置 > MoE4All**。第一次使用时，插件会显示进度并下载最新兼容 Engine，失败时可以重试。
2. 选择已有 GGUF 模型，或下载推荐模型。
3. 不确定参数时保留“自动配置：保守”。
4. 点击 **运行**。插件会写入 Provider 配置，在允许时启动 Engine，并把探测到的模型同步给 DSH。

默认地址为 `http://127.0.0.1:8080/v1`。也可以只连接现有服务，并自行配置 IP、端口和 API key。

## 插件自动更新

安装了带公开更新 API 的 `dshmarket` 后，本插件会在 DSH 打开后自动检查自身更新。发现新版本时，右下角会出现不阻塞操作的提示，并提供进度、失败重试以及正确的刷新或重启按钮。

- 更新只调用 `/dsh-market/api/v1/*`，插件自身不启动包管理器，也不直接修改 profile。
- 未安装 DSH Market，或其公开 API 不可用时，检查会静默退出，不影响启动和对话。
- 这里只更新 `dsh-llm-moe4all`；Engine 版本仍在 **设置 > MoE4All > 引擎** 中单独管理。
- 有 Agent 正在运行时，DSH Market 可能要求任务结束后再更新，避免运行中替换插件文件。

手动更新命令：

```powershell
dsh plugin --profile web update dsh-llm-moe4all
```

Bundle 更新后需要重启 DSH profile。

## 禁用和卸载

在 DSH 的 **Plugins/插件** 页面可以只禁用 Bundle 而保留安装。彻底从 `web` profile 卸载：

```powershell
dsh plugin --profile web remove dsh-llm-moe4all
```

卸载后重启 DSH。卸载插件不会删除 MoE4All Engine、已下载模型、KV 缓存和已保存设置，避免误操作丢失大体积本地数据。

## 兼容性

- 已验证 DSH `0.1.1-rc.2`（DSH Desktop `0.6.3`）和 DSH `0.1.5-rc.3`。
- manifest 显式允许已知的 DSH `0.1.1` 到 `0.1.7` 预发布版本线。
- 独立安装的 DSH 需要 Node.js 20 或更高版本。
- 每次 push 和 PR 都会执行构建、测试和 npm dry-pack。

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

`MOE4ALL_ENGINE` 环境变量也可以指定可执行文件。非环回地址必须显式开启，而且只能连接，不能触发本地进程启动。API key 通过 DSH credentials 保存，不写进插件普通配置。

## 权限与数据

插件可能执行以下操作：

- 读取和写入自身的 DSH 设置及 Provider 配置；
- 检查本机 RAM、VRAM、进程状态、Engine 版本和用户选择的模型目录；
- 从界面明确展示的地址下载用户选择的 Engine 或模型；
- 使用 `shell: false` 直接启动 `infr.exe`，监控它，并且只停止由插件自己启动的进程；
- 访问配置的 OpenAI 兼容地址，并在明确下载或检查更新时访问 GitHub Releases 和 DSH Market。

插件不会把模型文件、会话内容或 API key 上传到本仓库。访问远程端点和对外提供 Engine 服务都需要显式配置。

## 常见问题

- **安装后找不到插件：** 完整重启 DSH profile，并在 **Plugins/插件** 中确认 `dsh-llm-moe4all` 已启用。
- **安装脚本找不到 DSH：** 安装 DSH Desktop，或把 `dsh` 加入 `PATH`，再重试。失败时脚本会显示手动命令。
- **一直没有更新提示：** 安装或更新 `dshmarket`；没有公开更新 API 时使用上面的手动更新命令。
- **Engine 启动失败：** 打开 **设置 > MoE4All > 诊断** 查看启动输出。检测到已有 MoE4All 进程或 RAM/VRAM 空闲不足时，插件会有意停止自动启动并等待确认。
- **需要回滚：** 优先使用 DSH Market 提供的回滚按钮；也可以手动安装已知版本或 tag 后重启 profile。

报告问题时请提供插件版本、DSH 版本、操作系统和相关诊断行。提交前删除 API key、私有路径、提示词和其他个人数据。

## 开发与发布

```powershell
npm install
npm run check
```

仓库提交了编译后的 `lib/`，因此 GitHub 安装不需要在安装期批准构建脚本。推送 Release tag 后，CI 会再次检查，生成预编译 `.tgz`、Windows 一键安装 ZIP 和 SHA-256 校验文件，并创建 GitHub Release。

仓库已经声明 `dsh.bundle`，带有 `dsh-plugin` topic，适合收录在 `model` 分类。提交收录时应指向仓库根目录，描述只陈述本仓库实际实现的本地 MoE4All Provider 和 Engine 管理能力。

## 许可与安全

Apache-2.0，详见 [LICENSE](LICENSE) 和 [NOTICE](NOTICE)。

普通问题请提交到 [GitHub Issues](https://github.com/Headmaster218/dsh-llm-moe4all/issues)，不要公开凭据或私有数据。安全问题优先使用 GitHub 的私密漏洞报告入口；若该入口不可用，请先通过 GitHub 私下联系维护者，不要直接公开漏洞细节。
