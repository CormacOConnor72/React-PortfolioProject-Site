#!/bin/bash

# Quick Deploy Script for Lambda Functions
# A simple, fast deployment method with minimal output

set -e

# Configuration
FUNCTIONS=("recordSpin" "getSpinHistory" "getGlobalMetrics" "clearSpinHistory")
QUIET=${1:-false}

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    if [ "$QUIET" != "true" ]; then
        echo -e "${BLUE}$1${NC}"
    fi
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Quick AWS check
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    error "AWS CLI not configured"
    exit 1
fi

log "🚀 Quick deploying Lambda functions..."

# Quick package and deploy
for func in "${FUNCTIONS[@]}"; do
    if [ -f "$func.js" ]; then
        log "Processing $func..."

        # Create temp dir and package
        rm -rf "temp_$func"
        mkdir "temp_$func"
        cp "$func.js" "temp_$func/index.js"
        cp package.json "temp_$func/"

        # Install and zip
        (cd "temp_$func" && npm install --silent --production --no-package-lock && zip -rq "../$func.zip" .)
        rm -rf "temp_$func"

        # Deploy if function exists in AWS
        if aws lambda get-function --function-name "$func" >/dev/null 2>&1; then
            if aws lambda update-function-code --function-name "$func" --zip-file "fileb://$func.zip" >/dev/null 2>&1; then
                success "$func deployed"
            else
                error "$func deployment failed"
            fi
        else
            error "$func not found in AWS"
        fi
    else
        error "$func.js not found"
    fi
done

# Quick test
log "Testing API..."
if curl -s "https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/metrics" | grep -q "totalSpins"; then
    success "API is responding"
else
    error "API test failed"
fi

success "🎉 Quick deployment complete!"