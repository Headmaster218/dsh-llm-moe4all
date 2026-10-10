@echo off
chcp 65001 >nul
setlocal
title 安装 MoE4All 插件 / Install MoE4All plugin for DSH
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-plugin.ps1"
set "INSTALL_EXIT=%ERRORLEVEL%"
if not "%INSTALL_EXIT%"=="0" (
  echo.
  echo 安装未完成，请查看上面的提示 / Installation did not complete. See the message above.
  echo 按任意键退出 / Press any key to exit...
  pause >nul
)
exit /b %INSTALL_EXIT%
