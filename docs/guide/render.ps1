# Rebuilds docs/schema.png and "docs/Full Guide.pdf" from the sources in docs/guide/.
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File docs/guide/render.ps1
$ErrorActionPreference = 'Continue'  # chrome logs to stderr; PS 5.1 would treat that as fatal
$root = (Resolve-Path "$PSScriptRoot\..\..").Path
$chrome = @(
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw 'Chrome or Edge is required to render.' }
$toUrl = { param($p) 'file:///' + $p.Replace([char]92, [char]47) }

node "$root\docs\guide\schema-diagram.mjs"

& $chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=1600,1000 `
  --screenshot="$root\docs\schema.png" (& $toUrl "$root\docs\guide\schema.svg") 2>$null | Out-Null

& $chrome --headless=new --disable-gpu --no-pdf-header-footer `
  --print-to-pdf="$root\docs\Full Guide.pdf" (& $toUrl "$root\docs\guide\full-guide.html") 2>$null | Out-Null

Write-Host 'Rendered docs/schema.png and docs/Full Guide.pdf'
