[CmdletBinding()]
param(
    [switch]$Configure,
    [switch]$Generate,
    [switch]$Resume
)
$ErrorActionPreference = 'Stop'
$scriptFile = Join-Path $PSScriptRoot 'generate-wan-pilot.mjs'
$credentialDir = Join-Path $env:LOCALAPPDATA 'EchoesOfDante\authoring'
$credentialFile = Join-Path $credentialDir 'fal-key.dpapi'
if ((@($Configure, $Generate, $Resume) | Where-Object { $_ }).Count -gt 1) {
    throw 'Use somente um modo: -Configure, -Generate ou -Resume.'
}
if ($Configure) {
    # Windows DPAPI: encrypted for this Windows user; never stored inside the repo.
    $secret = Read-Host 'Cole a chave fal.ai (entrada oculta; nao envie no chat)' -AsSecureString
    if ($secret.Length -eq 0) { throw 'Chave vazia. Nenhuma configuracao foi gravada.' }
    try {
        [System.IO.Directory]::CreateDirectory($credentialDir) | Out-Null
        $encrypted = ConvertFrom-SecureString -SecureString $secret
        [System.IO.File]::WriteAllText($credentialFile, $encrypted)
    } finally { $secret.Dispose() }
    Write-Output 'Acesso salvo cifrado para este usuario do Windows. Nenhuma geracao foi enviada.'
    exit 0
}
if (-not $Generate -and -not $Resume) {
    & node $scriptFile --dry-run
    exit $LASTEXITCODE
}
$previousKey = $env:FAL_KEY
$secret = $null
$secretPointer = [IntPtr]::Zero
try {
    if ([string]::IsNullOrWhiteSpace($env:FAL_KEY)) {
        if (-not (Test-Path -LiteralPath $credentialFile)) {
            throw 'Configure o acesso primeiro: .\scripts\wan-pilot.ps1 -Configure. Nao envie a chave no chat.'
        }
        $secret = ConvertTo-SecureString -String ([System.IO.File]::ReadAllText($credentialFile))
        $secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
        $env:FAL_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
    }
    $mode = if ($Generate) { '--generate' } else { '--resume' }
    & node $scriptFile $mode
    $resultCode = $LASTEXITCODE
} finally {
    $env:FAL_KEY = $previousKey
    if ($secretPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer) }
    if ($null -ne $secret) { $secret.Dispose() }
}
exit $resultCode
