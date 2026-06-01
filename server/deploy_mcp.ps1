# PowerShell Script to Deploy MongoDB MCP to Google Cloud Run
$PROJECT_ID = "sera-495721"
$REGION = "us-central1"
$SERVICE_NAME = "mongodb-mcp-server"

# Read MONGODB_URI from .env file
$envFile = Get-Content -Path ".env" -ErrorAction SilentlyContinue
$mongoUri = ""
if ($envFile) {
    foreach ($line in $envFile) {
        if ($line -match "^MONGODB_URI=(.+)$") {
            $mongoUri = $Matches[1].Trim()
        }
    }
}

if (-not $mongoUri) {
    Write-Error "MONGODB_URI not found in server/.env file. Please check server/.env."
    exit 1
}

# Replace db_password placeholder if any warnings
if ($mongoUri -like "*<db_password>*") {
    Write-Warning "Your MONGODB_URI contains a '<db_password>' placeholder. Please replace it with the real password."
}

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "🚀 Deploying MongoDB MCP Server to Cloud Run" -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "Region: $REGION" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Build and push image to Artifact Registry / GCR using Cloud Builds
Write-Host "📦 Building container image on Cloud Build..." -ForegroundColor Yellow
gcloud builds submit --tag "gcr.io/$PROJECT_ID/$SERVICE_NAME" --file Dockerfile.mcp . --project $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Error "Cloud Build failed."
    exit 1
}

# 2. Deploy to Cloud Run
Write-Host "🚀 Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $SERVICE_NAME `
  --image "gcr.io/$PROJECT_ID/$SERVICE_NAME" `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --set-env-vars "MDB_MCP_CONNECTION_STRING=$mongoUri,MDB_MCP_READ_ONLY=false" `
  --project $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Error "Cloud Run deployment failed."
    exit 1
}

Write-Host "✅ Successfully deployed MongoDB MCP Server to Cloud Run!" -ForegroundColor Green
