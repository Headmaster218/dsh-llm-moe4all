param([Parameter(Mandatory = $true)][string]$OutputDirectory)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = [IO.Path]::GetFullPath($OutputDirectory)
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$version = (Get-Content -LiteralPath (Join-Path $repositoryRoot 'package.json') -Raw | ConvertFrom-Json).version
$tarball = Join-Path $root 'dsh-llm-moe4all.tgz'
$archive = Join-Path $root 'dsh-llm-moe4all-windows.zip'
$checksums = Join-Path $root 'SHA256SUMS.txt'

$seenAssets = @{}
foreach ($line in [IO.File]::ReadAllLines($checksums)) {
    if ($line -notmatch '^([0-9a-f]{64})  (dsh-llm-moe4all(?:-windows\.zip|\.tgz))$') {
        throw "invalid checksum entry: $line"
    }
    $expectedHash = $Matches[1]
    $asset = $Matches[2]
    if ($seenAssets.ContainsKey($asset)) { throw "duplicate checksum entry: $asset" }
    $seenAssets[$asset] = $true
    $actualHash = (Get-FileHash -LiteralPath (Join-Path $root $asset) -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $expectedHash) { throw "checksum mismatch: $asset" }
}
if ([IO.File]::ReadAllLines($checksums).Length -ne 2) { throw 'expected exactly two release checksums' }

$expectedEntries = @(
    'Install-MoE4All-Plugin.cmd', 'install-plugin.ps1', 'README-INSTALL.txt',
    'PLUGIN-VERSION.txt', 'dsh-llm-moe4all.tgz', 'LICENSE', 'NOTICE', 'THIRD-PARTY-NOTICES.txt'
)
$zip = [IO.Compression.ZipFile]::OpenRead($archive)
try {
    $actualEntries = @($zip.Entries | ForEach-Object { $_.FullName })
    if ($null -ne (Compare-Object $expectedEntries $actualEntries)) { throw 'unexpected Windows ZIP contents' }
    $reader = New-Object IO.StreamReader($zip.GetEntry('PLUGIN-VERSION.txt').Open())
    try {
        if ($reader.ReadToEnd().Trim() -ne $version) { throw 'ZIP plugin version mismatch' }
    } finally { $reader.Dispose() }
    $stream = $zip.GetEntry('dsh-llm-moe4all.tgz').Open()
    $sha = [Security.Cryptography.SHA256]::Create()
    try {
        $embeddedHash = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '').ToLowerInvariant()
        if ($embeddedHash -ne (Get-FileHash -LiteralPath $tarball -Algorithm SHA256).Hash.ToLowerInvariant()) {
            throw 'ZIP contains a different plugin package'
        }
    } finally { $sha.Dispose(); $stream.Dispose() }
} finally { $zip.Dispose() }

Write-Output "Release assets verified: $version (ZIP entries, embedded package, SHA-256)"
