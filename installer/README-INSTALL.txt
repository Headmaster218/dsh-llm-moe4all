MoE4All plugin for DeepSeek Harness
==================================

One-click install (recommended)
-------------------------------
1. Double-click Install-MoE4All-Plugin.cmd.
2. Select the DSH home you want to modify.
3. Finish active work, fully exit that DSH instance, then press Enter.
4. Restart that DSH and open Settings > MoE4All.

The installer uses the prebuilt dsh-llm-moe4all.tgz included in this folder.
It keeps a versioned copy under the target DSH home before adding it to the
web profile, so removing this extracted folder will not break later profile
installs. No plugin source checkout or install-time build is needed.

When more than one DSH is present, the installer shows each detected DSH home
and launcher instead of choosing one automatically. A custom DSH_HOME can also
be entered. A stale Git dependency from an older install is replaced with
rollback backups before pnpm resolves the profile.

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
双击 Install-MoE4All-Plugin.cmd，明确选择要安装到的 DSH 数据目录，再按提示退出该
DSH。安装器会使用压缩包内的预编译插件，并自动修复旧安装残留的失效 Git 依赖；
失败时恢复 profile。安装完成后重新启动所选 DSH，再进入“设置 > MoE4All”。
