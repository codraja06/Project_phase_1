param(
  [string]$Profile = 'preview'
)

$ErrorActionPreference = 'Stop'

$mobileRoot = Split-Path -Parent $PSScriptRoot
$buildConfig = Get-Content -LiteralPath (Join-Path $mobileRoot 'eas.json') -Raw | ConvertFrom-Json
$buildProfile = $buildConfig.build.PSObject.Properties[$Profile].Value
if (-not $buildProfile) {
  throw "EAS build profile '$Profile' does not exist."
}

$apiAddress = $buildProfile.env.EXPO_PUBLIC_API_URL
$apiUri = $null
if (-not [Uri]::TryCreate($apiAddress, [UriKind]::Absolute, [ref]$apiUri) -or
    $apiUri.Scheme -notin @('http', 'https') -or
    $apiUri.AbsolutePath.TrimEnd('/') -ne '/api') {
  throw "Set EXPO_PUBLIC_API_URL in the '$Profile' EAS profile to a reachable http(s) address ending in /api."
}

if ($apiUri.Host -in @('localhost', '127.0.0.1', '10.0.2.2')) {
  throw "The '$Profile' APK uses $($apiUri.Host), which a physical phone cannot use to reach this computer."
}

$localAddresses = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
  Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' } |
  ForEach-Object IPAddress)
if ($apiUri.Host -match '^\d+\.\d+\.\d+\.\d+$' -and $apiUri.Host -notin $localAddresses) {
  throw "The APK targets $($apiUri.Host), but this computer currently has: $($localAddresses -join ', '). Update the EAS profile before rebuilding."
}

$healthAddress = "$($apiUri.Scheme)://$($apiUri.Authority)/api/health"
try {
  $response = Invoke-RestMethod -Uri $healthAddress -Method Get -TimeoutSec 6
} catch {
  throw "The backend is unreachable at $healthAddress. Start MongoDB and run 'npm run dev' in backend, then check the firewall and Wi-Fi."
}
if ($response.status -ne 'OK') {
  throw "The server at $healthAddress returned an unexpected health response."
}

Write-Output "Preview API: $apiAddress"
Write-Output "Backend health: OK"
Write-Output "Open $healthAddress in the phone browser on the same Wi-Fi to check device-to-computer access."
