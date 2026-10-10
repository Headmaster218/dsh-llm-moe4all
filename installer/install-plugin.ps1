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
                Label = "DSH 源码版 / DSH source build ($stateName)"
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
                Label = 'PATH 中的 DSH 命令 / DSH command on PATH'
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
        throw "所选 DSH 数据目录没有 $ProfileName 配置 / The selected DSH home has no $ProfileName profile: $resolvedHome"
    }
    return [pscustomobject]@{
        Kind = 'custom'
        Label = '自定义 DSH 数据目录 / Custom DSH home'
        Runner = $Launcher.Runner
        Cli = $Launcher.Cli
        Bin = $Launcher.Bin
        Home = $resolvedHome
        Detail = $Launcher.Detail
        ProcessIds = @()
    }
}

function Select-CustomDshTarget {
    param(
        [object[]]$Targets,
        [string]$HomePath,
        [string]$ProfileName
    )

    $resolvedHome = [IO.Path]::GetFullPath($HomePath.Trim().Trim('"'))
    foreach ($target in $Targets) {
        if ([string]::Equals([IO.Path]::GetFullPath($target.Home), $resolvedHome, [StringComparison]::OrdinalIgnoreCase)) {
            return $target
        }
    }
    if ($Targets.Count -eq 1) { return New-CustomTarget $Targets[0] $resolvedHome $ProfileName }

    Write-Host ''
    Write-Host '为此自定义数据目录选择 DSH 启动器 / Select the DSH launcher for this custom home:' -ForegroundColor Cyan
    for ($i = 0; $i -lt $Targets.Count; $i++) {
        Write-Host ("  [{0}] {1}: {2}" -f ($i + 1), $Targets[$i].Label, $Targets[$i].Detail)
    }
    while ($true) {
        $choice = (Read-Host '启动器 / Launcher').Trim()
        $number = 0
        if ([int]::TryParse($choice, [ref]$number) -and $number -ge 1 -and $number -le $Targets.Count) {
            return New-CustomTarget $Targets[$number - 1] $resolvedHome $ProfileName
        }
        Write-Host '请输入列表中的启动器编号 / Choose one listed launcher number.' -ForegroundColor Yellow
    }
}

function Select-DshTarget {
    param(
        [object[]]$Targets,
        [string]$RequestedHome,
        [string]$ProfileName
    )

    if ($Targets.Count -eq 0) {
        throw '未找到 DSH 启动器。请先安装 DSH Desktop 或将 dsh 命令加入 PATH，再重试 / No DSH launcher was found. Install DSH Desktop or put the dsh command on PATH, then run this installer again.'
    }
    if (-not [string]::IsNullOrWhiteSpace($RequestedHome)) {
        return Select-CustomDshTarget $Targets $RequestedHome $ProfileName
    }

    Write-Host ''
    Write-Host '请选择要安装到的 DSH 数据目录 / Select the DSH profile to install into:' -ForegroundColor Cyan
    for ($i = 0; $i -lt $Targets.Count; $i++) {
        Write-Host ("  [{0}] {1}" -f ($i + 1), $Targets[$i].Label)
        Write-Host ('      数据目录 / DSH home: ' + $Targets[$i].Home)
        Write-Host ('      启动器 / Launcher: ' + $Targets[$i].Detail)
    }
    Write-Host '  [M] 输入其他 DSH 数据目录 / Enter another DSH_HOME'

    while ($true) {
        $defaultHint = if ($Targets.Count -eq 1) { ' [1]' } else { '' }
        $choice = (Read-Host ("选择 / Select$defaultHint")).Trim()
        if ($choice -eq '' -and $Targets.Count -eq 1) { return $Targets[0] }
        if ($choice -match '^[Mm]$') {
            $customHome = Read-Host 'DSH 数据目录 / DSH_HOME'
            if ([string]::IsNullOrWhiteSpace($customHome)) {
                Write-Host 'DSH 数据目录不能为空 / DSH_HOME cannot be empty.' -ForegroundColor Yellow
                continue
            }
            return Select-CustomDshTarget $Targets $customHome $ProfileName
        }
        $number = 0
        if ([int]::TryParse($choice, [ref]$number) -and $number -ge 1 -and $number -le $Targets.Count) {
            return $Targets[$number - 1]
        }
        Write-Host '请输入列表中的编号，或输入 M / Choose one listed number or M.' -ForegroundColor Yellow
    }
}

function Wait-ForTargetExit {
    param([pscustomobject]$Target)

    Write-Host ''
    Write-Host ('已选择 / Selected: ' + $Target.Label) -ForegroundColor Cyan
    Write-Host ('数据目录 / DSH home: ' + $Target.Home)
    Write-Host '请完成当前任务，彻底退出所选 DSH，再按回车继续 / Finish active work, fully exit this DSH instance, then press Enter.' -ForegroundColor Yellow
    [void](Read-Host)

    if ($Target.Home.Equals([IO.Path]::GetFullPath($desktopHome), [StringComparison]::OrdinalIgnoreCase)) {
        if ($null -ne (Get-Process -Name 'DSH Desktop' -ErrorAction SilentlyContinue)) {
            throw 'DSH Desktop 仍在运行，请退出后再安装插件 / DSH Desktop is still running. Close it before installing the plugin.'
        }
    }
    foreach ($processId in $Target.ProcessIds) {
        if ($null -ne (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
            throw '所选源码版 DSH 仍在运行，请退出后再安装插件 / The selected source-built DSH is still running. Close it before installing the plugin.'
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
        Write-Host 'MoE4All 插件安装向导 / MoE4All plugin installer for DeepSeek Harness' -ForegroundColor Cyan
        Write-Host '配置 / Profile:' $Profile

        if (-not (Test-Path -LiteralPath $archive -PathType Leaf)) {
            throw '缺少 dsh-llm-moe4all.tgz，请重新下载并完整解压 Windows 安装包 / The bundled package dsh-llm-moe4all.tgz is missing. Download and extract the complete Windows installer ZIP again.'
        }
        if (-not (Test-Path -LiteralPath $versionFile -PathType Leaf)) {
            throw '缺少 PLUGIN-VERSION.txt，请重新下载并完整解压 Windows 安装包 / PLUGIN-VERSION.txt is missing. Download and extract the complete Windows installer ZIP again.'
        }
        $packageVersion = [IO.File]::ReadAllText($versionFile).Trim()
        if ($packageVersion -notmatch '^[0-9A-Za-z][0-9A-Za-z.-]*$') {
            throw 'PLUGIN-VERSION.txt 中的版本号无效 / PLUGIN-VERSION.txt does not contain a valid package version.'
        }

        $targets = @(Get-DshTargets $Profile)
        $target = Select-DshTarget $targets $DshHome $Profile
        if (-not $DryRun) { Wait-ForTargetExit $target }

        $packageDirectory = Join-Path $target.Home 'plugin-packages'
        $cachedArchive = Join-Path $packageDirectory ("$pluginName-$packageVersion.tgz")
        $profileDirectory = Join-Path $target.Home "profiles\$Profile"
        $profileManifest = Join-Path $profileDirectory 'package.json'
        $hasProfileManifest = Test-Path -LiteralPath $profileManifest -PathType Leaf

        Write-Host ('内置插件包 / Plugin package: bundled ' + $packageVersion)
        if ($Offline) {
            Write-Host '安装器使用内置预编译插件，无需下载插件源码 / The release installer always uses its bundled prebuilt package; no plugin source download is needed.'
        }

        $nativeArgs = if ($hasProfileManifest) {
            @('plugin', '--profile', $Profile, 'install', '--no-frozen-lockfile')
        } else {
            @('plugin', '--profile', $Profile, 'add', $cachedArchive)
        }
        if ($DryRun) {
            Write-Host ('启动器 / Launcher: ' + $target.Runner)
            if ($null -ne $target.Cli) { Write-Host ('命令行入口 / CLI: ' + $target.Cli) }
            Write-Host ('缓存包 / Cached package: ' + $cachedArchive)
            if ($hasProfileManifest) {
                Write-Host ('依赖修复 / Dependency repair: ' + $pluginName + ' -> ' + $cachedArchive + ' (保留回滚备份 / with rollback backups)')
            }
            Write-Host ('命令参数 / Command arguments: ' + ($nativeArgs -join ' '))
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
            Write-Host ('已准备配置依赖 / Prepared profile dependency: ' + $transaction.PackageSpec)
        }

        Write-Host '正在安装，请稍候 / Installing, please wait...' -ForegroundColor Cyan
        $exitCode = Invoke-DshPluginCommand $target $nativeArgs
        if ($exitCode -ne 0) {
            throw "DSH 插件安装失败，退出码 $exitCode / dsh plugin install failed with exit code $exitCode."
        }

        $completedTransaction = $transaction
        $transaction = $null
        try { Complete-ProfilePluginDependency $completedTransaction } catch { Write-Warning $_.Exception.Message }

        Write-Host ''
        Write-Host '安装完成 / Installation complete.' -ForegroundColor Green
        Write-Host ('安装位置 / Installed into: ' + $target.Home)
        Write-Host '请启动或重启所选 DSH；首次使用会自动打开 MoE4All 设置 / Start or restart that DSH; first-use MoE4All setup opens automatically.'
        Write-Host '若已关闭引导，请打开 设置 > MoE4All / If dismissed, open Settings > MoE4All.'
        Write-Host '首次配置会下载引擎，并引导选择模型和运行 / First-use setup downloads the Engine and guides model selection and a first run.'
        return 0
    } catch {
        if ($null -ne $transaction) {
            try {
                Restore-ProfilePluginDependency $transaction
                $profileRestored = $true
            } catch {
                Write-Warning ('无法自动恢复所选配置 / Could not restore the selected profile automatically: ' + $_.Exception.Message)
            }
        }
        if ($stagedArchiveCreated -and $null -ne $target -and $packageVersion -ne '') {
            $failedArchive = Join-Path (Join-Path $target.Home 'plugin-packages') ("$pluginName-$packageVersion.tgz")
            Remove-Item -LiteralPath $failedArchive -Force -ErrorAction SilentlyContinue
        }
        Write-Host ''
        Write-Host ('错误 / Error: ' + $_.Exception.Message) -ForegroundColor Red
        if ($profileRestored) {
            Write-Host '已恢复所选配置的 package.json 和 pnpm 锁文件 / The selected profile package.json and pnpm lockfile were restored.' -ForegroundColor Yellow
        }
        Write-Host '请重新运行此安装器；直接 pnpm add 无法修复旧的失效 Git 依赖 / Retry with this installer; a plain pnpm add cannot repair an existing stale Git dependency.'
        Write-Host '项目发行版 / Project releases: https://github.com/Headmaster218/dsh-llm-moe4all/releases'
        return 1
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    exit (Invoke-Installer)
}
