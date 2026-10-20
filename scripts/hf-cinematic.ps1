[CmdletBinding()]
param(
    [switch]$Configure,
    [switch]$Check,
    [switch]$Generate,
    [string]$InputImage,
    [string]$PromptFile,
    [double]$Seconds = 5,
    [int]$Seed = 110,
    [ValidateRange(1, 30)][int]$Steps = 4,
    [string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
$credentialDir = Join-Path $env:LOCALAPPDATA 'EchoesOfDante\authoring'
$credentialFile = Join-Path $credentialDir 'hf-token.dpapi'
if ((@($Configure, $Check, $Generate) | Where-Object { $_ }).Count -ne 1) {
    throw 'Escolha -Configure, -Check ou -Generate.'
}
if ($Configure) {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'Dante - acesso gratuito ao video'
    $form.ClientSize = New-Object System.Drawing.Size(480, 185)
    $form.StartPosition = 'CenterScreen'
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $label = New-Object System.Windows.Forms.Label
    $label.Text = 'Cole o token Read do Hugging Face abaixo. Ele fica cifrado neste Windows e nao entra no jogo nem no Git.'
    $label.SetBounds(20, 16, 440, 44)
    $field = New-Object System.Windows.Forms.TextBox
    $field.SetBounds(20, 68, 440, 28)
    $field.UseSystemPasswordChar = $true
    $save = New-Object System.Windows.Forms.Button
    $save.Text = 'Salvar token'
    $save.SetBounds(250, 120, 100, 36)
    $save.Add_Click({
        if ($field.Text.Trim() -notmatch '^hf_[A-Za-z0-9]{16,}$') {
            [System.Windows.Forms.MessageBox]::Show('Copie apenas o token que comeca com hf_. O valor nao sera exibido.', 'Dante - verificar token') | Out-Null
            $field.Focus()
            return
        }
        $form.DialogResult = [System.Windows.Forms.DialogResult]::OK
        $form.Close()
    })
    $cancel = New-Object System.Windows.Forms.Button
    $cancel.Text = 'Cancelar'
    $cancel.SetBounds(360, 120, 100, 36)
    $cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $form.Controls.AddRange(@($label, $field, $save, $cancel))
    $form.AcceptButton = $save
    $form.CancelButton = $cancel
    $secret = $null
    try {
        if ($form.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit 0 }
        if ($field.Text.Trim() -notmatch '^hf_[A-Za-z0-9]{16,}$') { throw 'Token invalido; copie apenas o token que comeca com hf_.' }
        $secret = ConvertTo-SecureString -String $field.Text.Trim() -AsPlainText -Force
        $field.Clear()
        [System.IO.Directory]::CreateDirectory($credentialDir) | Out-Null
        [System.IO.File]::WriteAllText($credentialFile, (ConvertFrom-SecureString -SecureString $secret))
    } finally {
        $field.Clear()
        if ($null -ne $secret) { $secret.Dispose() }
        $form.Dispose()
    }
    Write-Output 'Token salvo cifrado. Nenhuma geracao enviada.'
    exit 0
}
if ($Generate -and (-not $InputImage -or -not $PromptFile -or -not $OutputDirectory)) {
    throw 'Informe -InputImage, -PromptFile e -OutputDirectory.'
}
$previousToken = $env:HF_TOKEN
$secret = $null
$secretPointer = [IntPtr]::Zero
$resultCode = 0
try {
    if ([string]::IsNullOrWhiteSpace($env:HF_TOKEN)) {
        if (-not (Test-Path -LiteralPath $credentialFile)) { throw 'Configure primeiro com .\scripts\hf-cinematic.ps1 -Configure. Nao envie token no chat.' }
        $secret = ConvertTo-SecureString -String ([System.IO.File]::ReadAllText($credentialFile))
        $secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
        $env:HF_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
    }
    if ($Check) {
        $response = Invoke-WebRequest -UseBasicParsing -Uri 'https://huggingface.co/api/whoami-v2' -Headers @{Authorization = ('Bearer ' + $env:HF_TOKEN)} -TimeoutSec 20
        if ($response.StatusCode -ne 200) { throw 'Autenticacao nao confirmada.' }
        Write-Output 'Autenticacao Hugging Face valida. Nenhuma geracao ou compra realizada.'
    } else {
        & node (Join-Path $PSScriptRoot 'generate-hf-cinematic-take.mjs') --input $InputImage --prompt $PromptFile --seconds $Seconds --seed $Seed --steps $Steps --out $OutputDirectory --timeout-seconds 600
        $resultCode = $LASTEXITCODE
    }
} finally {
    $env:HF_TOKEN = $previousToken
    if ($secretPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer) }
    if ($null -ne $secret) { $secret.Dispose() }
}
exit $resultCode
