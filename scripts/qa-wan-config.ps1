# Uses fake text and a temporary LOCALAPPDATA. Never reads the actual clipboard/key.
$ErrorActionPreference = 'Stop'
$configScript = Join-Path $PSScriptRoot 'wan-pilot.ps1'
$originalAppData = $env:LOCALAPPDATA
$testParent = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\')
$testRoot = Join-Path $testParent ('dante-config-qa-' + [guid]::NewGuid())
if ([System.IO.Path]::GetDirectoryName($testRoot) -ne $testParent) { throw 'Invalid temporary test path.' }
[System.IO.Directory]::CreateDirectory($testRoot) | Out-Null
$global:DanteWanQAClipboard = 'fake-test-key-0123456789:abcdef'
function Read-Host { param([string]$Prompt) return '' }
function Get-Clipboard { param([switch]$Raw) return $global:DanteWanQAClipboard }
try {
    $env:LOCALAPPDATA = $testRoot
    & $configScript -Configure -FromClipboard
    if ($LASTEXITCODE -ne 0) { throw 'Configuration failed.' }
    $file = Join-Path $testRoot 'EchoesOfDante\authoring\fal-key.dpapi'
    $encrypted = [System.IO.File]::ReadAllText($file)
    if ($encrypted.Contains('fake-test-key')) { throw 'Plain text key was written.' }
    $secret = ConvertTo-SecureString -String $encrypted
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    try {
        if ([Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) -ne $global:DanteWanQAClipboard) {
            throw 'DPAPI round-trip failed.'
        }
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
        $secret.Dispose()
    }
    foreach ($badValue in @('', 'powershell -File command', 'YOUR_API_KEY', ('x' * 513))) {
        $global:DanteWanQAClipboard = $badValue
        $rejected = $false
        try { & $configScript -Configure -FromClipboard } catch { $rejected = $true }
        if (-not $rejected) { throw 'Invalid clipboard was accepted.' }
        if ([System.IO.File]::ReadAllText($file) -ne $encrypted) { throw 'Existing credential was overwritten on invalid input.' }
    }
    $rejected = $false
    try { & $configScript -FromClipboard } catch { $rejected = $true }
    if (-not $rejected) { throw 'Clipboard option without Configure was accepted.' }
    'PASS: fake clipboard -> DPAPI round-trip; four invalid inputs preserve existing key; mode guard. No generation or real clipboard access.'
} finally {
    $env:LOCALAPPDATA = $originalAppData
    Remove-Variable -Name DanteWanQAClipboard -Scope Global
    # testRoot was resolved and verified under the intended temporary directory above.
    Remove-Item -LiteralPath $testRoot -Recurse -Force
}
