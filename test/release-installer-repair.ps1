param(
    [Parameter(Mandatory = $true)][string]$Installer,
    [Parameter(Mandatory = $true)][string]$Root
)

$ErrorActionPreference = 'Stop'
. $Installer

$manifestPath = Join-Path $Root 'package.json'
$lockPath = Join-Path $Root 'pnpm-lock.yaml'
$archivePath = Join-Path $Root 'dsh-llm-moe4all.tgz'
$originalManifest = '{"name":"fixture","dependencies":{"dsh-llm-moe4all":"github:Headmaster218/dsh-llm-moe4all#56a1313","kept":"1.0.0"},"dsh":{"profile":{"bundles":["kept","dsh-llm-moe4all"]}}}'
$originalLock = "lockfileVersion: 9.0`nfixture: true`n"
[IO.File]::WriteAllText($manifestPath, $originalManifest)
[IO.File]::WriteAllText($lockPath, $originalLock)
[IO.File]::WriteAllBytes($archivePath, [byte[]](1, 2, 3))

$transaction = Set-ProfilePluginDependency $Root $archivePath
$changed = [IO.File]::ReadAllText($manifestPath) | ConvertFrom-Json
if ($changed.dependencies.'dsh-llm-moe4all' -notlike 'file:*dsh-llm-moe4all.tgz') {
    throw 'The stale dependency was not replaced with the bundled package.'
}
if ($changed.dependencies.kept -ne '1.0.0') {
    throw 'An unrelated dependency changed.'
}
if (($changed.dsh.profile.bundles -join ',') -ne 'kept,dsh-llm-moe4all') {
    throw 'The bundle list changed.'
}

Restore-ProfilePluginDependency $transaction
if ([IO.File]::ReadAllText($manifestPath) -cne $originalManifest) {
    throw 'package.json was not restored byte-for-byte.'
}
if ([IO.File]::ReadAllText($lockPath) -cne $originalLock) {
    throw 'pnpm-lock.yaml was not restored byte-for-byte.'
}

$transaction = Set-ProfilePluginDependency $Root $archivePath
Complete-ProfilePluginDependency $transaction
if (Test-Path -LiteralPath $transaction.ManifestBackup) {
    throw 'The successful transaction left a manifest backup behind.'
}
if (Test-Path -LiteralPath $transaction.LockBackup) {
    throw 'The successful transaction left a lockfile backup behind.'
}

$fakeTarget = [pscustomobject]@{
    Runner = $env:ComSpec
    Cli = $null
    Bin = $null
    Home = $Root
}
$exitCode = Invoke-DshPluginCommand $fakeTarget @('/d', '/c', 'echo fake-dsh-output & exit /b 7')
if ($exitCode -is [array] -or $exitCode -ne 7) {
    throw "The DSH command wrapper did not return exactly the native exit code: $exitCode"
}

$firstHome = Join-Path $Root 'desktop-home'
$secondHome = Join-Path $Root 'source-home'
$targets = @(
    [pscustomobject]@{ Home = $firstHome; Runner = 'desktop-runner'; Cli = 'desktop-cli'; Bin = $null; Label = 'Desktop'; Detail = 'Desktop launcher'; ProcessIds = @(10) },
    [pscustomobject]@{ Home = $secondHome; Runner = 'source-runner'; Cli = 'source-cli'; Bin = $null; Label = 'Source'; Detail = 'Source launcher'; ProcessIds = @(20) }
)
$selected = Select-DshTarget $targets $secondHome 'web'
if ($selected.Runner -ne 'source-runner' -or $selected.ProcessIds[0] -ne 20) {
    throw 'An explicitly selected known home used the wrong launcher.'
}
$customHome = Join-Path $Root 'custom-home'
$customProfile = Join-Path $customHome 'profiles\web'
New-Item -ItemType Directory -Path $customProfile -Force | Out-Null
[IO.File]::WriteAllText((Join-Path $customProfile 'package.json'), '{}')
$selected = Select-DshTarget $targets $customHome 'web'
if ($selected.Runner -ne 'source-runner' -or $selected.Home -ne [IO.Path]::GetFullPath($customHome)) {
    throw 'A custom home ignored the explicitly selected launcher.'
}

Write-Output 'repair and rollback: OK'
Write-Output 'target and launcher selection: OK'
