MoE4All 插件安装说明 / MoE4All plugin for DeepSeek Harness
========================================================

一键安装（推荐）/ One-click install (recommended)
------------------------------------------------
1. 解压完整安装包，双击 Install-MoE4All-Plugin.cmd。
   Extract the complete ZIP, then double-click Install-MoE4All-Plugin.cmd.
2. 选择要安装到的 DSH 数据目录。
   Select the DSH home you want to modify.
3. 按提示完成当前任务，彻底退出所选 DSH，再按回车继续。
   Finish active work, fully exit that DSH instance, then press Enter.
4. 安装完成后重新启动所选 DSH；首次使用会自动弹出 MoE4All 设置。
   Restart that DSH after installation; first-use MoE4All setup opens automatically.
   如果关闭了引导，可再打开“设置 > MoE4All”。
   If dismissed, open Settings > MoE4All.
5. 首次配置会显示引擎下载进度；选择模型后即可点击运行。
   First-use setup shows Engine download progress; select a model and click Run.

安装范围与安全 / Installation scope and safety
----------------------------------------------
安装器使用本目录内预编译的 dsh-llm-moe4all.tgz，无需拉取源码或现场编译。
The installer uses the bundled prebuilt dsh-llm-moe4all.tgz; no source checkout
or install-time build is needed.

插件包会先按版本保存到目标 DSH 数据目录，再加入 web profile。
之后删除已解压的安装包文件夹，不会破坏后续的 profile 安装。
It keeps a versioned package copy under the selected DSH home before adding it
to the web profile. Removing this extracted folder will not break later installs.

发现多个 DSH 时会明确要求选择，并显示各自的数据目录和启动器，不会随机选择。
也可以手动输入 DSH_HOME；需要时会继续询问对应的启动器。
When several DSH installations are found, their homes and launchers are listed
for explicit selection. A custom DSH_HOME and launcher can also be selected.

旧版残留的失效 Git 依赖会在解析前替换，仅修改本插件依赖；失败时恢复原配置和锁文件。
A stale Git dependency is replaced before profile resolution. Only this plugin's
dependency is changed; installation failure restores the manifest and lockfile.

命令行安装 / PowerShell equivalent
----------------------------------
在解压目录中运行 / Run this from the extracted folder:

  powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\install-plugin.ps1

可选参数 -DshHome 用于指定数据目录；-Profile 默认为 web。
Use -DshHome to select a data directory; -Profile defaults to web.

-DryRun 只显示所选目标、包位置和命令参数，不执行安装。
-DryRun shows the selected target, package path, and command arguments without installing.

-Offline 为兼容旧版本保留，默认始终使用内置插件包；DSH 仍可能需要下载缺失的依赖。
-Offline remains accepted for compatibility. The bundled plugin is always used;
DSH may still need to download missing dependencies.

安装失败与更新 / Failures and updates
-------------------------------------
失败时请查看窗口中的双语提示，处理原因后重新运行此安装器。
直接 pnpm add 无法修复旧的失效 Git 依赖。
If installation fails, read the bilingual messages, resolve the cause, and rerun
this installer. A plain pnpm add cannot repair an existing stale Git dependency.

安装、更新或移除插件后，请重启对应 DSH。插件更新与引擎更新互相独立。
Restart the selected DSH after installing, updating, or removing the plugin.
Plugin updates and Engine updates remain separate.

已安装 0.2.1 或更高版本时，也可在“设置 > MoE4All > 诊断”中检查插件更新。
Copies installed from a release ZIP at 0.2.1 or later can also check for plugin
updates under Settings > MoE4All > Diagnostics.

项目发行版 / Project releases:
https://github.com/Headmaster218/dsh-llm-moe4all/releases
