# deploy_agent.ps1 - Automate SERA Agent Deployment to Google Cloud Run
$ErrorActionPreference = 'Continue'

$PROJECT_ID = "sera-495721"
$REGION = "us-central1"
$REPO_NAME = "sera-repo"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "🚀 Deploying SERA AGENT to Google Cloud Run" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Enable Required APIs (if not already enabled)
Write-Host "`n[1/3] Ensuring required GCP APIs are enabled..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com --project $PROJECT_ID

# 2. Check/Create Artifact Registry Repository
Write-Host "`n[2/3] Checking Artifact Registry..." -ForegroundColor Yellow
$repoExists = gcloud artifacts repositories describe $REPO_NAME --location=$REGION --project=$PROJECT_ID 2>$null
if (-not $repoExists) {
    Write-Host "Creating Artifact Registry repository '$REPO_NAME'..." -ForegroundColor Yellow
    gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION --description="Docker repository for SERA" --project=$PROJECT_ID
} else {
    Write-Host "Artifact Registry '$REPO_NAME' already exists." -ForegroundColor Green
}

# 3. Build and Deploy Python Agent
Write-Host "`n[3/3] Building and Deploying Python Agent..." -ForegroundColor Yellow
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
Write-Host "`n✅ AGENT DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "Agent URL:    $AGENT_URL" -ForegroundColor Cyan
