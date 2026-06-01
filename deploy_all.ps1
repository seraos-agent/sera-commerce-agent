# deploy_all.ps1 - Automate SERA Deployment to Google Cloud Run
$ErrorActionPreference = 'Stop'

$PROJECT_ID = "sera-495721"
$REGION = "us-central1"
$REPO_NAME = "sera-repo"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "🚀 Deploying SERA to Google Cloud Run" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Enable Required APIs (if not already enabled)
Write-Host "`n[1/6] Ensuring required GCP APIs are enabled..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com --project $PROJECT_ID

# 2. Check/Create Artifact Registry Repository
Write-Host "`n[2/6] Checking Artifact Registry..." -ForegroundColor Yellow
$repoExists = gcloud artifacts repositories describe $REPO_NAME --location=$REGION --project=$PROJECT_ID 2>$null
if (-not $repoExists) {
    Write-Host "Creating Artifact Registry repository '$REPO_NAME'..." -ForegroundColor Yellow
    gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION --description="Docker repository for SERA" --project=$PROJECT_ID
} else {
    Write-Host "Artifact Registry '$REPO_NAME' already exists." -ForegroundColor Green
}

# 3. Handle Secrets (MONGODB_URI)
Write-Host "`n[3/6] Setting up Secret Manager..." -ForegroundColor Yellow
$envFile = Get-Content -Path "server\.env" -ErrorAction SilentlyContinue
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

$secretName = "MONGODB_URI"
$secretExists = gcloud secrets describe $secretName --project=$PROJECT_ID 2>$null
if (-not $secretExists) {
    Write-Host "Creating secret $secretName..." -ForegroundColor Yellow
    gcloud secrets create $secretName --replication-policy="automatic" --project=$PROJECT_ID
}
Write-Host "Updating secret $secretName with value from .env..." -ForegroundColor Yellow
echo -n $mongoUri | gcloud secrets versions add $secretName --data-file=- --project=$PROJECT_ID

# 4. Build and Deploy Python Agent
Write-Host "`n[4/6] Building and Deploying Python Agent..." -ForegroundColor Yellow
$AGENT_IMAGE = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/sera-agent"
gcloud builds submit --tag $AGENT_IMAGE --project=$PROJECT_ID ./sera-agent-python
gcloud run deploy sera-agent `
    --image $AGENT_IMAGE `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --project=$PROJECT_ID

# Get Agent URL
$AGENT_URL = gcloud run services describe sera-agent --platform managed --region $REGION --format="value(status.url)" --project=$PROJECT_ID
Write-Host "Agent deployed at: $AGENT_URL" -ForegroundColor Green

# 5. Build and Deploy Node.js Backend
Write-Host "`n[5/6] Building and Deploying Node Backend..." -ForegroundColor Yellow
$BACKEND_IMAGE = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/sera-backend"
gcloud builds submit --tag $BACKEND_IMAGE --project=$PROJECT_ID ./server

# Note: We give Cloud Run service account access to Secret Manager
$SERVICE_ACCOUNT = gcloud compute project-info describe --project=$PROJECT_ID --format="value(defaultServiceAccount)" 2>$null
if (-not $SERVICE_ACCOUNT) {
    $PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
    $SERVICE_ACCOUNT = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
}
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT" --role="roles/secretmanager.secretAccessor" | Out-Null

gcloud run deploy sera-backend `
    --image $BACKEND_IMAGE `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --update-secrets="MONGODB_URI=$secretName:latest" `
    --project=$PROJECT_ID

# Get Backend URL
$BACKEND_URL = gcloud run services describe sera-backend --platform managed --region $REGION --format="value(status.url)" --project=$PROJECT_ID
Write-Host "Backend deployed at: $BACKEND_URL" -ForegroundColor Green

# 6. Build and Deploy Frontend
Write-Host "`n[6/6] Building and Deploying Frontend..." -ForegroundColor Yellow
$FRONTEND_IMAGE = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/sera-frontend"
gcloud builds submit `
    --tag $FRONTEND_IMAGE `
    --build-arg="VITE_BACKEND_URL=$BACKEND_URL" `
    --build-arg="VITE_ADK_URL=$AGENT_URL" `
    --project=$PROJECT_ID .

gcloud run deploy sera-frontend `
    --image $FRONTEND_IMAGE `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --project=$PROJECT_ID

$FRONTEND_URL = gcloud run services describe sera-frontend --platform managed --region $REGION --format="value(status.url)" --project=$PROJECT_ID
Write-Host "`n✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "Frontend URL: $FRONTEND_URL" -ForegroundColor Cyan
Write-Host "Backend URL:  $BACKEND_URL" -ForegroundColor Cyan
Write-Host "Agent URL:    $AGENT_URL" -ForegroundColor Cyan
