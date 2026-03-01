# RJ Business Solutions — Cloudflare One Supreme Automation (v2 Elite)
# Author: Rick Jefferson
# Date: 2026-03-01

$ErrorActionPreference = "Stop"

$CF_ACCOUNT_ID = "58250b56ae5b45d940cd6e4b64314c01"
$CF_API_TOKEN = "zvXxjzZoiKJBlJfSjmK-v2r2dCIaLNnjq6kjLNav"
$CF_ZONE_ID = "18e1ffe3c8a6b6c965860aa0bae60357"
$ADMIN_SECRET = "RJ-SUPREME-SECRET-2026"

Write-Host "🚀 Initializing Cloudflare One Elite Infrastructure..." -ForegroundColor Cyan

# 1. Provision D1 Database if not exists
Write-Host "🗄️ Setting up D1 Database..." -ForegroundColor Yellow
npx wrangler d1 create cloudflare-one-automation-db --name cloudflare-one-automation-db 2>$null

# 2. Provision R2 Bucket
Write-Host "📦 Setting up R2 Bucket..." -ForegroundColor Yellow
npx wrangler r2 bucket create cloudflare-one-automation-storage 2>$null

# 3. Create KV Namespace
Write-Host "🔑 Setting up KV Namespace..." -ForegroundColor Yellow
npx wrangler kv namespace create CONFIG 2>$null

# 4. Set Secrets
Write-Host "🔐 Setting Cloudflare Secrets..." -ForegroundColor Yellow
npx wrangler secret put CF_ACCOUNT_ID --name cloudflare-one-automation <<< $CF_ACCOUNT_ID
npx wrangler secret put CF_API_TOKEN --name cloudflare-one-automation <<< $CF_API_TOKEN
npx wrangler secret put CF_ZONE_ID --name cloudflare-one-automation <<< $CF_ZONE_ID
npx wrangler secret put ADMIN_SECRET --name cloudflare-one-automation <<< $ADMIN_SECRET

# 5. Run D1 Migrations
Write-Host "🛠️ Running D1 Migrations..." -ForegroundColor Yellow
npx wrangler d1 migrations apply cloudflare-one-automation-db --local --yes
npx wrangler d1 migrations apply cloudflare-one-automation-db --remote --yes

# 6. Deploy Worker
Write-Host "📦 Deploying Automation Agent..." -ForegroundColor Yellow
npx wrangler deploy

Write-Host "✅ Elite Infrastructure ready! Initializing setup..." -ForegroundColor Green
$response = Invoke-RestMethod -Uri "https://cloudflare-one-automation.rjbizsolutions.workers.dev/api/security/audit" `
    -Method Post `
    -Headers @{ "X-Admin-Secret" = $ADMIN_SECRET }

Write-Host "📊 Initial Audit Results: $($response | ConvertTo-Json)"
