<#
  Lance l'app mobile (Expo SDK 54) en mode tunnel pour l'ouvrir sur votre telephone.
  Fonctionne meme si le PC et le telephone ne sont pas sur le meme Wi-Fi.

  Usage :  .\tunnel.ps1            (Expo Go)
           .\tunnel.ps1 -Clear     (vide le cache Metro avant de demarrer)
#>
param(
    [switch]$Clear
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$mobile = Join-Path $root 'apps\mobile'

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "pnpm est introuvable. Installez-le : npm i -g pnpm" -ForegroundColor Red
    exit 1
}

# Installe les dependances si besoin
if (-not (Test-Path (Join-Path $root 'node_modules'))) {
    Write-Host "Installation des dependances..." -ForegroundColor Cyan
    Push-Location $root
    try { pnpm install } finally { Pop-Location }
}

Write-Host ""
Write-Host "Demarrage du tunnel Expo..." -ForegroundColor Cyan
Write-Host "1. Installez Expo Go (compatible SDK 54) sur votre telephone Android."
Write-Host "2. Ouvrez Expo Go et scannez le QR code qui va s'afficher."
Write-Host "   Ctrl+C pour arreter."
Write-Host ""

$expoArgs = @('expo', 'start', '--tunnel', '--go')
if ($Clear) { $expoArgs += '--clear' }

Push-Location $mobile
try {
    npx @expoArgs
} finally {
    Pop-Location
}
