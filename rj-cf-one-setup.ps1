# RJ Business Solutions — Cloudflare One Supreme Automation
# Author: Rick Jefferson
# Date: 2026-03-01

$ErrorActionPreference = "Stop"

$CF_ACCOUNT_ID = "58250b56ae5b45d940cd6e4b64314c01"
$CF_API_TOKEN = "zvXxjzZoiKJBlJfSjmK-v2r2dCIaLNnjq6kjLNav"
$CF_ZONE_ID = "18e1ffe3c8a6b6c965860aa0bae60357"
$ADMIN_SECRET = "RJ-SUPREME-SECRET-2026" # Change this for production

Write-Host "🚀 Starting Cloudflare One Automation Setup..." -ForegroundColor Cyan

# 1. Set Secrets in Cloudflare Workers
Write-Host "🔐 Setting Cloudflare Secrets..." -ForegroundColor Yellow
npx wrangler secret put CF_ACCOUNT_ID --name cloudflare-one-automation <<< $CF_ACCOUNT_ID
npx wrangler secret put CF_API_TOKEN --name cloudflare-one-automation <<< $CF_API_TOKEN
npx wrangler secret put CF_ZONE_ID --name cloudflare-one-automation <<< $CF_ZONE_ID
npx wrangler secret put ADMIN_SECRET --name cloudflare-one-automation <<< $ADMIN_SECRET

# 2. Deploy Worker
Write-Host "📦 Deploying Automation Agent..." -ForegroundColor Yellow
npx wrangler deploy

# 3. Trigger Setup
Write-Host "⚡ Triggering Full Setup Agent..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "https://cloudflare-one-automation.rjbizsolutions.workers.dev/api/cloudflare-one/setup" `
    -Method Post `
    -Headers @{ "X-Admin-Secret" = $ADMIN_SECRET }

if ($response.status -eq "success") {
    Write-Host "✅ Cloudflare One Setup Complete!" -ForegroundColor Green
    $response.results | ConvertTo-Json -Depth 10
}
else {
    Write-Host "❌ Setup Failed: $($response.message)" -ForegroundColor Red
}
