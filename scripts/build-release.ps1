param(
    [string]$OutputDirectory = 'dist',
    [string]$ExpectedTag = ''
)

$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$packageJson = Get-Content -LiteralPath (Join-Path $repositoryRoot 'package.json') -Raw | ConvertFrom-Json
$version = [string]$packageJson.version

if ($ExpectedTag -ne '' -and $ExpectedTag -notin @("v$version", "release-$version")) {
    throw "tag $ExpectedTag does not match package version $version"
}

if ([IO.Path]::IsPathRooted($OutputDirectory)) {
    $outputRoot = [IO.Path]::GetFullPath($OutputDirectory)
} else {
    $outputRoot = [IO.Path]::GetFullPath((Join-Path $repositoryRoot $OutputDirectory))
}
$repositoryPrefix = $repositoryRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
if (-not $outputRoot.StartsWith($repositoryPrefix, [StringComparison]::OrdinalIgnoreCase)) {
    throw "release output must stay inside the repository: $outputRoot"
}

$checkedDirectory = $outputRoot
while (-not [string]::Equals($checkedDirectory, $repositoryRoot, [StringComparison]::OrdinalIgnoreCase)) {
    if (Test-Path -LiteralPath $checkedDirectory) {
        $item = Get-Item -LiteralPath $checkedDirectory -Force
        if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "release output must not follow a link: $checkedDirectory"
        }
    }
    $checkedDirectory = Split-Path -Parent $checkedDirectory
}

New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null

$tarball = Join-Path $outputRoot 'dsh-llm-moe4all.tgz'
$archive = Join-Path $outputRoot 'dsh-llm-moe4all-windows.zip'
$checksums = Join-Path $outputRoot 'SHA256SUMS.txt'
$bundle = Join-Path $outputRoot 'windows-installer'

foreach ($path in @($tarball, $archive, $checksums, $bundle)) {
    $resolvedTarget = [IO.Path]::GetFullPath($path)
    if (-not $resolvedTarget.StartsWith($repositoryPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "release cleanup must stay inside the repository: $resolvedTarget"
    }
    if (Test-Path -LiteralPath $path) {
        $existingTarget = Get-Item -LiteralPath $path -Force
        if (($existingTarget.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "release cleanup must not follow a link: $path"
        }
    }
}

foreach ($path in @($tarball, $archive, $checksums)) {
    if (Test-Path -LiteralPath $path) {
        Remove-Item -LiteralPath $path -Force
    }
}
if (Test-Path -LiteralPath $bundle) {
    Remove-Item -LiteralPath $bundle -Recurse -Force
}

Push-Location -LiteralPath $repositoryRoot
try {
    $packedName = & npm pack --pack-destination $outputRoot
    if ($LASTEXITCODE -ne 0) { throw 'npm pack failed' }
} finally {
    Pop-Location
}
$packed = Join-Path $outputRoot ($packedName | Select-Object -Last 1)
Move-Item -LiteralPath $packed -Destination $tarball

New-Item -ItemType Directory -Path $bundle | Out-Null
Copy-Item -LiteralPath (Join-Path $repositoryRoot 'installer\Install-MoE4All-Plugin.cmd') -Destination $bundle
Copy-Item -LiteralPath (Join-Path $repositoryRoot 'installer\install-plugin.ps1') -Destination $bundle
Copy-Item -LiteralPath (Join-Path $repositoryRoot 'installer\README-INSTALL.txt') -Destination $bundle
Copy-Item -LiteralPath (Join-Path $repositoryRoot 'LICENSE') -Destination $bundle
Copy-Item -LiteralPath (Join-Path $repositoryRoot 'NOTICE') -Destination $bundle
Copy-Item -LiteralPath (Join-Path $repositoryRoot 'THIRD-PARTY-NOTICES.txt') -Destination $bundle
Copy-Item -LiteralPath $tarball -Destination $bundle
[IO.File]::WriteAllText((Join-Path $bundle 'PLUGIN-VERSION.txt'), "$version`n", (New-Object Text.UTF8Encoding($false)))
Compress-Archive -Path (Join-Path $bundle '*') -DestinationPath $archive

$lines = foreach ($asset in @($tarball, $archive)) {
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $asset).Hash.ToLowerInvariant()
    "$hash  $([IO.Path]::GetFileName($asset))"
}
[IO.File]::WriteAllLines($checksums, $lines, (New-Object Text.UTF8Encoding($false)))

Write-Output $tarball
Write-Output $archive
Write-Output $checksums
