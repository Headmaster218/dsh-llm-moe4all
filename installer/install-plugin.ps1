[CmdletBinding()]
param(
    [string]$Profile = 'web',
    [string]$DshHome = '',
    [switch]$Offline,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$pluginName = 'dsh-llm-moe4all'
$desktopHome = Join-Path $env:APPDATA 'dsh-desktop\harness'
$archive = Join-Path $PSScriptRoot 'dsh-llm-moe4all.tgz'
$versionFile = Join-Path $PSScriptRoot 'PLUGIN-VERSION.txt'

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

function Get-RunningSourceTargets {
    param([string]$ProfileName)

    $targets = New-Object System.Collections.Generic.List[object]
    $processes = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue
    foreach ($process in $processes) {
        $commandLine = [string]$process.CommandLine
        if ([string]::IsNullOrWhiteSpace($commandLine)) { continue }
        $match = [regex]::Match($commandLine, '(?i)(?<cli>[A-Z]:\\[^"\r\n]*?\\harness\\dsh\\apps\\cli\\lib\\bin\.js)')
        if (-not $match.Success) { continue }

        $cli = [IO.Path]::GetFullPath($match.Groups['cli'].Value)
        $harnessRoot = $cli
        for ($i = 0; $i -lt 5; $i++) { $harnessRoot = Split-Path -Parent $harnessRoot }
        $runner = [string]$process.ExecutablePath
        if ([string]::IsNullOrWhiteSpace($runner) -or -not (Test-Path -LiteralPath $runner -PathType Leaf)) {
            $runner = Get-ChildItem -LiteralPath (Join-Path $harnessRoot 'runtime') -Filter node.exe -Recurse -ErrorAction SilentlyContinue |
                Where-Object { $_.FullName -match 'node-v[^\\]+-win-x64\\node\.exe$' } |
                Select-Object -First 1 -ExpandProperty FullName
        }
        if ([string]::IsNullOrWhiteSpace($runner)) { continue }

        foreach ($stateName in @('dev-state', 'agent-state')) {
            $candidateHome = Join-Path $harnessRoot "$stateName\home"
            $manifest = Join-Path $candidateHome "profiles\$ProfileName\package.json"
            if (-not (Test-Path -LiteralPath $manifest -PathType Leaf)) { continue }
            $targets.Add([pscustomobject]@{
                Kind = 'source'
                Label = "DSH source build ($stateName)"
                Runner = $runner
                Cli = $cli
                Bin = Join-Path $harnessRoot 'runtime\pnpm\node_modules\.bin'
                Home = [IO.Path]::GetFullPath($candidateHome)
                Detail = $harnessRoot
                ProcessIds = @([int]$process.ProcessId)
            })
        }
    }
    return $targets
}

function Get-DshTargets {
    param([string]$ProfileName)

    $targets = New-Object System.Collections.Generic.List[object]
    $seenHomes = @{}

    foreach ($root in Get-DesktopRoots) {
        if ([string]::IsNullOrWhiteSpace($root)) { continue }
        $app = Join-Path $root 'resources\app'
        $node = Join-Path $app 'node_modules\node\bin\node.exe'
        $cli = Join-Path $app 'node_modules\@deepseek-ai\dsh\lib\bin.js'
        if (-not (Test-Path -LiteralPath $node -PathType Leaf) -or -not (Test-Path -LiteralPath $cli -PathType Leaf)) { continue }
        $candidateHome = [IO.Path]::GetFullPath($desktopHome)
        $key = $candidateHome.ToLowerInvariant()
        if ($seenHomes.ContainsKey($key)) { continue }
        $seenHomes[$key] = $true
        $targets.Add([pscustomobject]@{
            Kind = 'desktop'
            Label = 'DSH Desktop'
            Runner = $node
            Cli = $cli
            Bin = Join-Path $desktopHome '.desktop-bin'
            Home = $candidateHome
            Detail = [IO.Path]::GetFullPath($root)
            ProcessIds = @()
        })
    }

    foreach ($target in Get-RunningSourceTargets $ProfileName) {
        $key = $target.Home.ToLowerInvariant()
        if ($seenHomes.ContainsKey($key)) { continue }
        $seenHomes[$key] = $true
        $targets.Add($target)
    }

    $command = Get-Command 'dsh.cmd','dsh.exe','dsh.ps1','dsh' -CommandType Application,ExternalScript -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $command) {
        $candidateHome = if (-not [string]::IsNullOrWhiteSpace($env:DSH_HOME)) {
            [IO.Path]::GetFullPath($env:DSH_HOME)
        } else {
            [IO.Path]::GetFullPath((Join-Path $HOME '.dsh'))
        }
        $key = $candidateHome.ToLowerInvariant()
        if (-not $seenHomes.ContainsKey($key)) {
            $seenHomes[$key] = $true
            $targets.Add([pscustomobject]@{
                Kind = 'path'
                Label = 'DSH command on PATH'
                Runner = $command.Source
                Cli = $null
                Bin = $null
                Home = $candidateHome
                Detail = $command.Source
                ProcessIds = @()
            })
        }
    }

    return $targets
}

function New-CustomTarget {
    param(
        [pscustomobject]$Launcher,
        [string]$HomePath,
        [string]$ProfileName
    )

    $resolvedHome = [IO.Path]::GetFullPath($HomePath.Trim().Trim('"'))
    $manifest = Join-Path $resolvedHome "profiles\$ProfileName\package.json"
    if (-not (Test-Path -LiteralPath $manifest -PathType Leaf)) {
        throw "The selected DSH home has no $ProfileName profile: $resolvedHome"
    }
    return [pscustomobject]@{
        Kind = 'custom'
        Label = 'Custom DSH home'
        Runner = $Launcher.Runner
        Cli = $Launcher.Cli
        Bin = $Launcher.Bin
        Home = $resolvedHome
        Detail = $Launcher.Detail
        ProcessIds = @()
    }
}

function Select-DshTarget {
    param(
        [object[]]$Targets,
        [string]$RequestedHome,
        [string]$ProfileName
    )

    if ($Targets.Count -eq 0) {
        throw 'No DSH launcher was found. Install DSH Desktop or put the dsh command on PATH, then run this installer again.'
    }
    if (-not [string]::IsNullOrWhiteSpace($RequestedHome)) {
        return New-CustomTarget $Targets[0] $RequestedHome $ProfileName
    }

    Write-Host ''
    Write-Host 'Select the DSH profile to install into:' -ForegroundColor Cyan
    for ($i = 0; $i -lt $Targets.Count; $i++) {
        Write-Host ("  [{0}] {1}" -f ($i + 1), $Targets[$i].Label)
        Write-Host ('      DSH home: ' + $Targets[$i].Home)
        Write-Host ('      Launcher: ' + $Targets[$i].Detail)
    }
    Write-Host '  [M] Enter another DSH_HOME'

    while ($true) {
        $defaultHint = if ($Targets.Count -eq 1) { ' [1]' } else { '' }
        $choice = (Read-Host ("Select$defaultHint")).Trim()
        if ($choice -eq '' -and $Targets.Count -eq 1) { return $Targets[0] }
        if ($choice -match '^[Mm]$') {
            $customHome = Read-Host 'DSH_HOME'
            if ([string]::IsNullOrWhiteSpace($customHome)) {
                Write-Host 'DSH_HOME cannot be empty.' -ForegroundColor Yellow
                continue
            }
            return New-CustomTarget $Targets[0] $customHome $ProfileName
        }
        $number = 0
        if ([int]::TryParse($choice, [ref]$number) -and $number -ge 1 -and $number -le $Targets.Count) {
            return $Targets[$number - 1]
        }
        Write-Host 'Choose one listed number or M.' -ForegroundColor Yellow
    }
}

function Wait-ForTargetExit {
    param([pscustomobject]$Target)

    Write-Host ''
    Write-Host ('Selected: ' + $Target.Label) -ForegroundColor Cyan
    Write-Host ('DSH home: ' + $Target.Home)
    Write-Host 'Finish active work, fully exit this DSH instance, then press Enter.' -ForegroundColor Yellow
    [void](Read-Host)

    if ($Target.Home.Equals([IO.Path]::GetFullPath($desktopHome), [StringComparison]::OrdinalIgnoreCase)) {
        if ($null -ne (Get-Process -Name 'DSH Desktop' -ErrorAction SilentlyContinue)) {
            throw 'DSH Desktop is still running. Close it before installing the plugin.'
        }
    }
    foreach ($processId in $Target.ProcessIds) {
        if ($null -ne (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
            throw 'The selected source-built DSH is still running. Close it before installing the plugin.'
        }
    }
}

function Set-ProfilePluginDependency {
    param(
        [string]$ProfileDirectory,
        [string]$PackageArchive
    )

    $manifestPath = Join-Path $ProfileDirectory 'package.json'
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { return $null }

    $manifest = [IO.File]::ReadAllText($manifestPath) | ConvertFrom-Json
    if ($null -eq $manifest.dependencies) {
        $manifest | Add-Member -MemberType NoteProperty -Name dependencies -Value ([pscustomobject]@{})
    }
    $packageSpec = 'file:' + ([IO.Path]::GetFullPath($PackageArchive).Replace('\', '/'))
    $property = $manifest.dependencies.PSObject.Properties[$pluginName]
    if ($null -eq $property) {
        $manifest.dependencies | Add-Member -MemberType NoteProperty -Name $pluginName -Value $packageSpec
    } else {
        $property.Value = $packageSpec
    }

    $transactionId = [Guid]::NewGuid().ToString('N')
    $manifestBackup = "$manifestPath.moe4all-$transactionId.bak"
    $manifestTemporary = "$manifestPath.moe4all-$transactionId.tmp"
    $lockPath = Join-Path $ProfileDirectory 'pnpm-lock.yaml'
    $lockExisted = Test-Path -LiteralPath $lockPath -PathType Leaf
    $lockBackup = "$lockPath.moe4all-$transactionId.bak"

    if ($lockExisted) { Copy-Item -LiteralPath $lockPath -Destination $lockBackup }
    try {
        $json = ($manifest | ConvertTo-Json -Depth 100) + "`n"
        [IO.File]::WriteAllText($manifestTemporary, $json, (New-Object Text.UTF8Encoding($false)))
        [IO.File]::Replace($manifestTemporary, $manifestPath, $manifestBackup, $true)
    } catch {
        Remove-Item -LiteralPath $manifestTemporary -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $lockBackup -Force -ErrorAction SilentlyContinue
        throw
    }

    return [pscustomobject]@{
        ManifestPath = $manifestPath
        ManifestBackup = $manifestBackup
        LockPath = $lockPath
        LockBackup = $lockBackup
        LockExisted = $lockExisted
        PackageSpec = $packageSpec
    }
}

function Restore-ProfilePluginDependency {
    param([pscustomobject]$Transaction)

    if ($null -eq $Transaction) { return }
    Copy-Item -LiteralPath $Transaction.ManifestBackup -Destination $Transaction.ManifestPath -Force
    if ($Transaction.LockExisted) {
        Copy-Item -LiteralPath $Transaction.LockBackup -Destination $Transaction.LockPath -Force
    } elseif (Test-Path -LiteralPath $Transaction.LockPath -PathType Leaf) {
        Remove-Item -LiteralPath $Transaction.LockPath -Force
    }
    Remove-Item -LiteralPath $Transaction.ManifestBackup -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $Transaction.LockBackup -Force -ErrorAction SilentlyContinue
}

function Complete-ProfilePluginDependency {
    param([pscustomobject]$Transaction)

    if ($null -eq $Transaction) { return }
    Remove-Item -LiteralPath $Transaction.ManifestBackup -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $Transaction.LockBackup -Force -ErrorAction SilentlyContinue
}

function Invoke-DshPluginCommand {
    param(
        [pscustomobject]$Target,
        [string[]]$NativeArguments
    )

    $oldDshHome = $env:DSH_HOME
    $oldPath = $env:PATH
    try {
        $env:DSH_HOME = $Target.Home
        if (-not [string]::IsNullOrWhiteSpace($Target.Bin) -and (Test-Path -LiteralPath $Target.Bin -PathType Container)) {
            $env:PATH = $Target.Bin + [IO.Path]::PathSeparator + $env:PATH
        }
        $global:LASTEXITCODE = 0
        if ($null -eq $Target.Cli) {
            & $Target.Runner @NativeArguments | Out-Host
        } else {
            & $Target.Runner $Target.Cli @NativeArguments | Out-Host
        }
        return $LASTEXITCODE
    } finally {
        if ($null -eq $oldDshHome) { Remove-Item Env:DSH_HOME -ErrorAction SilentlyContinue } else { $env:DSH_HOME = $oldDshHome }
        $env:PATH = $oldPath
    }
}

function Invoke-Installer {
    $target = $null
    $transaction = $null
    $stagedArchiveCreated = $false
    $profileRestored = $false
    $packageVersion = ''

    try {
        Write-Host 'MoE4All plugin installer for DeepSeek Harness' -ForegroundColor Cyan
        Write-Host 'Profile:' $Profile

        if (-not (Test-Path -LiteralPath $archive -PathType Leaf)) {
            throw 'The bundled package dsh-llm-moe4all.tgz is missing. Download and extract the complete Windows installer ZIP again.'
        }
        if (-not (Test-Path -LiteralPath $versionFile -PathType Leaf)) {
            throw 'PLUGIN-VERSION.txt is missing. Download and extract the complete Windows installer ZIP again.'
        }
        $packageVersion = [IO.File]::ReadAllText($versionFile).Trim()
        if ($packageVersion -notmatch '^[0-9A-Za-z][0-9A-Za-z.-]*$') {
            throw 'PLUGIN-VERSION.txt does not contain a valid package version.'
        }

        $targets = @(Get-DshTargets $Profile)
        $target = Select-DshTarget $targets $DshHome $Profile
        if (-not $DryRun) { Wait-ForTargetExit $target }

        $packageDirectory = Join-Path $target.Home 'plugin-packages'
        $cachedArchive = Join-Path $packageDirectory ("$pluginName-$packageVersion.tgz")
        $profileDirectory = Join-Path $target.Home "profiles\$Profile"
        $profileManifest = Join-Path $profileDirectory 'package.json'
        $hasProfileManifest = Test-Path -LiteralPath $profileManifest -PathType Leaf

        Write-Host ('Plugin package: bundled ' + $packageVersion)
        if ($Offline) {
            Write-Host 'The release installer always uses its bundled prebuilt package; no plugin source download is needed.'
        }

        $nativeArgs = if ($hasProfileManifest) {
            @('plugin', '--profile', $Profile, 'install', '--no-frozen-lockfile')
        } else {
            @('plugin', '--profile', $Profile, 'add', $cachedArchive)
        }
        if ($DryRun) {
            Write-Host ('Launcher: ' + $target.Runner)
            if ($null -ne $target.Cli) { Write-Host ('CLI: ' + $target.Cli) }
            Write-Host ('Cached package: ' + $cachedArchive)
            if ($hasProfileManifest) {
                Write-Host ('Dependency repair: set ' + $pluginName + ' to the cached package with rollback backups')
            }
            Write-Host ('Command arguments: ' + ($nativeArgs -join ' '))
            return 0
        }

        New-Item -ItemType Directory -Force -Path $packageDirectory | Out-Null
        $stagedArchiveCreated = -not (Test-Path -LiteralPath $cachedArchive -PathType Leaf)
        $sourcePath = [IO.Path]::GetFullPath($archive)
        $destinationPath = [IO.Path]::GetFullPath($cachedArchive)
        if (-not [string]::Equals($sourcePath, $destinationPath, [StringComparison]::OrdinalIgnoreCase)) {
            Copy-Item -LiteralPath $archive -Destination $cachedArchive -Force
        }

        if ($hasProfileManifest) {
            $transaction = Set-ProfilePluginDependency $profileDirectory $cachedArchive
            Write-Host ('Prepared profile dependency: ' + $transaction.PackageSpec)
        }

        $exitCode = Invoke-DshPluginCommand $target $nativeArgs
        if ($exitCode -ne 0) {
            throw "dsh plugin install failed with exit code $exitCode."
        }

        $completedTransaction = $transaction
        $transaction = $null
        try { Complete-ProfilePluginDependency $completedTransaction } catch { Write-Warning $_.Exception.Message }

        Write-Host ''
        Write-Host 'Installation complete.' -ForegroundColor Green
        Write-Host ('Installed into: ' + $target.Home)
        Write-Host 'Start or restart that DSH, then open Settings > MoE4All.'
        Write-Host 'The first page will install the Engine and guide you to a first run.'
        return 0
    } catch {
        if ($null -ne $transaction) {
            try {
                Restore-ProfilePluginDependency $transaction
                $profileRestored = $true
            } catch {
                Write-Warning ('Could not restore the selected profile automatically: ' + $_.Exception.Message)
            }
        }
        if ($stagedArchiveCreated -and $null -ne $target -and $packageVersion -ne '') {
            $failedArchive = Join-Path (Join-Path $target.Home 'plugin-packages') ("$pluginName-$packageVersion.tgz")
            Remove-Item -LiteralPath $failedArchive -Force -ErrorAction SilentlyContinue
        }
        Write-Host ''
        Write-Host ('Error: ' + $_.Exception.Message) -ForegroundColor Red
        if ($profileRestored) {
            Write-Host 'The selected profile package.json and pnpm lockfile were restored.' -ForegroundColor Yellow
        }
        Write-Host 'Retry with this installer; a plain pnpm add cannot repair an existing stale Git dependency.'
        Write-Host 'Project releases: https://github.com/Headmaster218/dsh-llm-moe4all/releases'
        return 1
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    exit (Invoke-Installer)
}
