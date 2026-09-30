[CmdletBinding()]
param(
    [string]$Profile = 'web',
    [switch]$Offline,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$onlineSource = 'github:Headmaster218/dsh-llm-moe4all'
$desktopHome = Join-Path $env:APPDATA 'dsh-desktop\harness'

function Get-DesktopRoots {
    $roots = New-Object System.Collections.Generic.List[string]
    $registryRoots = @(
        'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall',
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall',
        'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall'
    )
    foreach ($registryRoot in $registryRoots) {
        if (-not (Test-Path -LiteralPath $registryRoot)) { continue }
        $entries = Get-ChildItem -LiteralPath $registryRoot -ErrorAction SilentlyContinue | Get-ItemProperty -ErrorAction SilentlyContinue
        foreach ($entry in $entries) {
            if ($entry.DisplayName -notlike 'DSH Desktop*') { continue }
            $uninstall = [string]$entry.UninstallString
            if ($uninstall -match '^"([^"]+)"') {
                $roots.Add((Split-Path -Parent $matches[1]))
            } elseif ($uninstall -match '^([^ ]+\.exe)') {
                $roots.Add((Split-Path -Parent $matches[1]))
            }
        }
    }
    $roots.Add((Join-Path $env:LOCALAPPDATA 'Programs\DSH Desktop'))
    $roots.Add((Join-Path $env:LOCALAPPDATA 'Programs\dsh-desktop'))
    $roots.Add((Join-Path $env:ProgramFiles 'DSH Desktop'))
    return $roots | Select-Object -Unique
}

function Find-DshLauncher {
    foreach ($root in Get-DesktopRoots) {
        if ([string]::IsNullOrWhiteSpace($root)) { continue }
        $app = Join-Path $root 'resources\app'
        $node = Join-Path $app 'node_modules\node\bin\node.exe'
        $cli = Join-Path $app 'node_modules\@deepseek-ai\dsh\lib\bin.js'
        $bin = Join-Path $desktopHome '.desktop-bin'
        if ((Test-Path -LiteralPath $node) -and (Test-Path -LiteralPath $cli)) {
            return [pscustomobject]@{ Kind = 'desktop'; Runner = $node; Cli = $cli; Bin = $bin }
        }
    }
    $command = Get-Command 'dsh.cmd','dsh.exe','dsh.ps1','dsh' -CommandType Application,ExternalScript -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $command) {
        return [pscustomobject]@{ Kind = 'path'; Runner = $command.Source; Cli = $null; Bin = $null }
    }
    return $null
}

function Wait-ForDesktopExit {
    $desktop = Get-Process -Name 'DSH Desktop' -ErrorAction SilentlyContinue
    if ($null -eq $desktop) { return }
    Write-Host ''
    Write-Host 'DSH Desktop is running.' -ForegroundColor Yellow
    Write-Host 'Finish any active work, fully exit DSH Desktop, then press Enter.'
    [void](Read-Host)
    if ($null -ne (Get-Process -Name 'DSH Desktop' -ErrorAction SilentlyContinue)) {
        throw 'DSH Desktop is still running. Close it before installing the plugin.'
    }
}

try {
    Write-Host 'MoE4All plugin installer for DeepSeek Harness' -ForegroundColor Cyan
    Write-Host 'Profile:' $Profile
    if (-not $DryRun) { Wait-ForDesktopExit }

    $launcher = Find-DshLauncher
    if ($null -eq $launcher) {
        throw 'DSH was not found. Install DSH Desktop or put the dsh command on PATH, then run this installer again.'
    }

    $source = $onlineSource
    if ($Offline) {
        $archive = Join-Path $PSScriptRoot 'dsh-llm-moe4all.tgz'
        if (-not (Test-Path -LiteralPath $archive)) {
            throw 'The offline package dsh-llm-moe4all.tgz is missing beside this script.'
        }
        $source = $archive
        Write-Host 'Installing the bundled offline package. Automatic online updates will require a later catalog or Git installation.' -ForegroundColor Yellow
    }

    $nativeArgs = @('plugin', '--profile', $Profile, 'add', $source)
    if ($DryRun) {
        Write-Host ('Launcher: ' + $launcher.Runner)
        if ($null -ne $launcher.Cli) { Write-Host ('CLI: ' + $launcher.Cli) }
        Write-Host ('Command arguments: ' + ($nativeArgs -join ' '))
        exit 0
    }
    if ($launcher.Kind -eq 'path') {
        & $launcher.Runner @nativeArgs
    } else {
        $oldDshHome = $env:DSH_HOME
        $oldPath = $env:PATH
        try {
            $env:DSH_HOME = $desktopHome
            if (Test-Path -LiteralPath $launcher.Bin) {
                $env:PATH = $launcher.Bin + [IO.Path]::PathSeparator + $env:PATH
            }
            & $launcher.Runner $launcher.Cli @nativeArgs
        } finally {
            $env:DSH_HOME = $oldDshHome
            $env:PATH = $oldPath
        }
    }
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "dsh plugin add failed with exit code $exitCode."
    }

    Write-Host ''
    Write-Host 'Installation complete.' -ForegroundColor Green
    Write-Host 'Start or restart DSH, then open Settings > MoE4All.'
    Write-Host 'The first page will install the Engine and guide you to a first run.'
    exit 0
} catch {
    Write-Host ''
    Write-Host ('Error: ' + $_.Exception.Message) -ForegroundColor Red
    Write-Host 'Manual command:'
    Write-Host ('  dsh plugin --profile ' + $Profile + ' add ' + $onlineSource)
    Write-Host 'Project releases: https://github.com/Headmaster218/dsh-llm-moe4all/releases'
    exit 1
}
