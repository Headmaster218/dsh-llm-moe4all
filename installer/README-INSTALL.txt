MoE4All plugin for DeepSeek Harness
==================================

One-click install (recommended)
-------------------------------
1. Fully exit DSH Desktop after any active work finishes.
2. Double-click Install-MoE4All-Plugin.cmd.
3. Restart DSH and open Settings > MoE4All.

The installer uses the prebuilt dsh-llm-moe4all.tgz included in this folder.
It keeps a versioned copy under the target DSH home before adding it to the
web profile, so removing this extracted folder will not break later profile
installs. No plugin source checkout or install-time build is needed.

PowerShell equivalent
---------------------
Run this from the extracted folder:

  powershell.exe -NoLogo -NoProfile -File .\install-plugin.ps1

The optional -Offline flag is still accepted for compatibility, but bundled
installation is now the default. Plugin and Engine updates remain separate.

Manual install
--------------
Use the manual command printed by the installer. It points to the versioned
package copied into the selected DSH home.

After every bundle install, update, or removal, restart the DSH profile.

中文说明
--------
完成当前任务并彻底退出 DSH Desktop，双击 Install-MoE4All-Plugin.cmd。安装器会使用
压缩包内的预编译插件，不再从 GitHub 拉取源码。安装完成后重新启动 DSH，再进入
“设置 > MoE4All”。安装器只安装插件，不会替换 MoE4All 引擎。
