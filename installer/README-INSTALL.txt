MoE4All plugin for DeepSeek Harness
==================================

Online install (recommended)
----------------------------
1. Fully exit DSH Desktop after any active work finishes.
2. Double-click Install-MoE4All-Plugin.cmd.
3. Restart DSH and open Settings > MoE4All.

The installer records the GitHub source in the DSH web profile. This lets DSH
Market detect later plugin updates. It does not install or update the MoE4All
Engine itself; Engine releases are managed separately inside the plugin.

Offline fallback
----------------
Run this from PowerShell in the extracted folder:

  powershell.exe -NoLogo -NoProfile -File .\install-plugin.ps1 -Offline

The bundled tarball can install without downloading plugin source, but a local
tarball cannot follow online updates until it is reinstalled from GitHub or npm.

Manual install
--------------
  dsh plugin --profile web add github:Headmaster218/dsh-llm-moe4all

After every bundle install, update, or removal, restart the DSH profile.

中文说明
--------
完成当前任务并彻底退出 DSH Desktop，双击 Install-MoE4All-Plugin.cmd，安装完成后
重新启动 DSH，再进入“设置 > MoE4All”。安装器只安装插件，不会替换 MoE4All 引擎。
