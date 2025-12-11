#!/bin/bash
# Azure DevOps Setup Script for Odds Protocol
# Run: ./scripts/azure-devops-setup.sh

set -e

ORGANIZATION="https://dev.azure.com/brendawill2233"
PROJECT="brendawill2233"
REPO_NAME="brendawill2233"

echo "=== Azure DevOps Setup for Odds Protocol ==="
echo ""

# Check if logged in
if ! az account show &>/dev/null; then
    echo "Logging in to Azure..."
    az login
fi

# Set defaults
echo "Setting DevOps defaults..."
az devops configure --defaults organization=$ORGANIZATION project=$PROJECT

# Verify connection
echo "Verifying connection..."
az devops project show --project $PROJECT --output table

# Create pipeline from azure-pipelines.yml
echo ""
echo "=== Pipeline Setup ==="
echo "Creating pipeline from azure-pipelines.yml..."

az pipelines create \
    --name "odds-protocol-ci" \
    --repository $REPO_NAME \
    --repository-type tfsgit \
    --branch main \
    --yml-path azure-pipelines.yml \
    --skip-first-run true \
    2>/dev/null || echo "Pipeline may already exist"

# List pipelines
echo ""
echo "Current pipelines:"
az pipelines list --output table

# Set up service connection for GitHub (if using GitHub as source)
echo ""
echo "=== GitHub Connection ==="
echo "If using GitHub repo, create service connection in Azure DevOps:"
echo "  Project Settings > Service connections > New > GitHub"
echo ""

# Configure artifacts feed
echo "=== Azure Artifacts Setup ==="
echo "Creating npm feed (if not exists)..."

az artifacts universal publish \
    --organization $ORGANIZATION \
    --project $PROJECT \
    --scope project \
    --feed $PROJECT \
    --name odds-protocol \
    --version 0.0.1 \
    --description "Odds Protocol packages" \
    --path ./packages \
    2>/dev/null || echo "Feed setup - check Azure DevOps portal"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Get Personal Access Token:"
echo "   Azure DevOps > User Settings > Personal Access Tokens"
echo "   Scope: Packaging (Read & Write), Code (Read)"
echo ""
echo "2. Add to .env file:"
echo "   NPM_PASSWORD=<your-pat-here>"
echo ""
echo "3. Add pipeline variables in Azure DevOps:"
echo "   - FLY_API_TOKEN (for deployment)"
echo "   - NPM_PASSWORD (for artifacts)"
echo ""
echo "4. Run pipeline:"
echo "   az pipelines run --name odds-protocol-ci"
echo ""
echo "Portal: $ORGANIZATION/$PROJECT/_build"
