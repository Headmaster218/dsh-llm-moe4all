@echo off
setlocal
title Install MoE4All plugin for DSH
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-plugin.ps1"
set "INSTALL_EXIT=%ERRORLEVEL%"
if not "%INSTALL_EXIT%"=="0" (
  echo.
  echo Installation did not complete. See the message above.
  pause
)
exit /b %INSTALL_EXIT%
