[CmdletBinding()]
param(
    [string]$Profile = 'web',
    [switch]$Offline,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$desktopHome = Join-Path $env:APPDATA 'dsh-desktop\harness'
$archive = Join-Path $PSScriptRoot 'dsh-llm-moe4all.tgz'
$versionFile = Join-Path $PSScriptRoot 'PLUGIN-VERSION.txt'
$manualSource = $archive

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

function Get-TargetDshHome {
    param([pscustomobject]$Launcher)

    if ($Launcher.Kind -eq 'desktop') {
        return [IO.Path]::GetFullPath($desktopHome)
    }
    if (-not [string]::IsNullOrWhiteSpace($env:DSH_HOME)) {
        return [IO.Path]::GetFullPath($env:DSH_HOME)
    }
    return [IO.Path]::GetFullPath((Join-Path $HOME '.dsh'))
}

try {
    Write-Host 'MoE4All plugin installer for DeepSeek Harness' -ForegroundColor Cyan
    Write-Host 'Profile:' $Profile
    if (-not $DryRun) { Wait-ForDesktopExit }

    $launcher = Find-DshLauncher
    if ($null -eq $launcher) {
        throw 'DSH was not found. Install DSH Desktop or put the dsh command on PATH, then run this installer again.'
    }

    if (-not (Test-Path -LiteralPath $archive)) {
        throw 'The bundled package dsh-llm-moe4all.tgz is missing. Download and extract the complete Windows installer ZIP again.'
    }
    if (-not (Test-Path -LiteralPath $versionFile)) {
        throw 'PLUGIN-VERSION.txt is missing. Download and extract the complete Windows installer ZIP again.'
    }
    $packageVersion = [IO.File]::ReadAllText($versionFile).Trim()
    if ($packageVersion -notmatch '^[0-9A-Za-z][0-9A-Za-z.-]*$') {
        throw 'PLUGIN-VERSION.txt does not contain a valid package version.'
    }

    $targetHome = Get-TargetDshHome $launcher
    $packageDirectory = Join-Path $targetHome 'plugin-packages'
    $cachedArchive = Join-Path $packageDirectory ("dsh-llm-moe4all-$packageVersion.tgz")

    Write-Host ('DSH home: ' + $targetHome)
    Write-Host ('Plugin package: bundled ' + $packageVersion)
    if (-not $DryRun) {
        New-Item -ItemType Directory -Force -Path $packageDirectory | Out-Null
        $sourcePath = [IO.Path]::GetFullPath($archive)
        $destinationPath = [IO.Path]::GetFullPath($cachedArchive)
        if (-not [string]::Equals($sourcePath, $destinationPath, [StringComparison]::OrdinalIgnoreCase)) {
            Copy-Item -LiteralPath $archive -Destination $cachedArchive -Force
        }
        $manualSource = $cachedArchive
    }

    if ($Offline) {
        Write-Host 'The release installer always uses its bundled prebuilt package; no plugin source download is needed.'
    }

    $nativeArgs = @('plugin', '--profile', $Profile, 'add', $cachedArchive)
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
    Write-Host ('  dsh plugin --profile ' + $Profile + ' add "' + $manualSource + '"')
    Write-Host 'Project releases: https://github.com/Headmaster218/dsh-llm-moe4all/releases'
    exit 1
}
