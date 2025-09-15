#!/bin/bash

# AWS Lambda Function Deployment Script
# This script packages and optionally deploys Lambda functions

set -e

echo "🚀 Starting Lambda function deployment..."

# Function names (these should match your local .js files)
FUNCTIONS=("recordSpin" "getSpinHistory" "getGlobalMetrics" "clearSpinHistory" "portfolioCreateEntry" "portfolioDeleteEntry" "portfolioGetEntries")

# Configuration
DEPLOY_TO_AWS=${1:-"package"}  # "package" or "deploy"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Check prerequisites
if ! command -v zip >/dev/null 2>&1; then
    log_error "zip is required but not installed. Please install zip:"
    echo "  Ubuntu/Debian: sudo apt install zip"
    echo "  macOS: zip is pre-installed"
    echo "  CentOS/RHEL: sudo yum install zip"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    log_error "AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-1")
log_info "Deploying to AWS Account: $AWS_ACCOUNT in region: $AWS_REGION"

# Function to discover actual Lambda function names in AWS
discover_lambda_names() {
    log_info "Discovering Lambda function names in your AWS account..."

    # Get all Lambda functions and filter for ones that might match ours
    aws lambda list-functions --query 'Functions[].FunctionName' --output text | tr '\t' '\n' | while read -r func_name; do
        # Check if any of our function names are contained in the AWS function name
        for local_func in "${FUNCTIONS[@]}"; do
            if [[ "$func_name" == *"$local_func"* ]] || [[ "$local_func" == *"$func_name"* ]]; then
                echo "$local_func -> $func_name"
            fi
        done
    done
}

# Function to create backup of existing Lambda function
backup_function() {
    local aws_function_name=$1
    local local_function_name=$2

    log_info "Creating backup of $aws_function_name..."
    mkdir -p "$BACKUP_DIR"

    if aws lambda get-function --function-name "$aws_function_name" --query 'Code.Location' --output text > "$BACKUP_DIR/${local_function_name}_backup_url.txt" 2>/dev/null; then
        log_success "Backup reference created for $aws_function_name"
    else
        log_warning "Could not create backup for $aws_function_name (function might not exist)"
    fi
}

# Function to test Lambda function after deployment
test_function() {
    local function_name=$1
    log_info "Testing $function_name..."

    # Create a test event based on function type
    local test_event=""
    case $function_name in
        *"recordSpin"*)
            test_payload='{"body": "{\"entryId\":\"test\",\"entryName\":\"Test Entry\",\"sessionId\":\"test_session\"}"}'
            ;;
        *"getSpinHistory"*)
            test_payload='{"queryStringParameters": {"limit": "5"}}'
            ;;
        *"getGlobalMetrics"*)
            test_payload='{}'
            ;;
        *"clearSpinHistory"*)
            log_warning "Skipping test for clearSpinHistory (destructive operation)"
            return 0
            ;;
        *"portfolioCreateEntry"*)
            test_payload='{"body": "{\"name\":\"Test Entry\",\"type\":\"Test\",\"who\":\"Test User\",\"why\":\"Testing deployment\"}"}'
            ;;
        *"portfolioDeleteEntry"*)
            test_payload='{"pathParameters": {"id": "test-id-for-testing"}}'
            ;;
        *"portfolioGetEntries"*)
            test_payload='{}'
            ;;
    esac

    if aws lambda invoke --function-name "$function_name" --payload "$test_payload" --cli-binary-format raw-in-base64-out /tmp/lambda_test_output.json --region eu-north-1 >/dev/null 2>&1; then
        if grep -q '"statusCode": 200' /tmp/lambda_test_output.json 2>/dev/null || grep -q '"statusCode": 201' /tmp/lambda_test_output.json 2>/dev/null; then
            log_success "Test passed for $function_name"
        else
            log_warning "Test completed but may have issues. Check CloudWatch logs for $function_name"
        fi
    else
        log_error "Test failed for $function_name"
    fi
    rm -f /tmp/lambda_test_output.json
}

# Clean up old packages and artifacts
log_info "Cleaning up old deployment artifacts..."
rm -f *.zip *.tar.gz
rm -rf temp_* backups/temp_*

# Create deployment packages
log_info "Creating deployment packages..."
for FUNCTION_NAME in "${FUNCTIONS[@]}"; do
    if [ ! -f "$FUNCTION_NAME.js" ]; then
        log_error "Function file $FUNCTION_NAME.js not found!"
        continue
    fi

    echo "📦 Packaging $FUNCTION_NAME..."

    # Create temporary directory for this function
    TEMP_DIR="temp_$FUNCTION_NAME"
    rm -rf "$TEMP_DIR"  # Clean up any existing temp dir
    mkdir -p "$TEMP_DIR"

    # Copy function code (main JavaScript file)
    cp "$FUNCTION_NAME.js" "$TEMP_DIR/index.js"

    # Copy package.json
    cp package.json "$TEMP_DIR/"

    # Copy any additional files that might be needed
    # Check for common additional files
    for additional_file in "*.json" "*.yml" "*.yaml" "*.txt"; do
        if ls $additional_file 1> /dev/null 2>&1 && [ "$additional_file" != "package.json" ]; then
            log_info "Including additional files: $additional_file"
            cp $additional_file "$TEMP_DIR/" 2>/dev/null || true
        fi
    done

    # Check for function-specific configuration files
    if [ -f "$FUNCTION_NAME.config.json" ]; then
        log_info "Including function-specific config: $FUNCTION_NAME.config.json"
        cp "$FUNCTION_NAME.config.json" "$TEMP_DIR/"
    fi

    # Check for shared utility files
    if [ -d "utils" ]; then
        log_info "Including utils directory"
        cp -r utils "$TEMP_DIR/"
    fi

    if [ -d "lib" ]; then
        log_info "Including lib directory"
        cp -r lib "$TEMP_DIR/"
    fi

    if [ -d "common" ]; then
        log_info "Including common directory"
        cp -r common "$TEMP_DIR/"
    fi

    # Install dependencies in temp directory
    cd "$TEMP_DIR"
    log_info "Installing dependencies for $FUNCTION_NAME..."
    if ! npm install --production --no-package-lock --silent; then
        log_error "Failed to install dependencies for $FUNCTION_NAME"
        cd ..
        rm -rf "$TEMP_DIR"
        continue
    fi

    # Remove unnecessary files from package to keep it lean
    rm -f package-lock.json
    rm -rf .npm
    find node_modules -name "*.txt" -delete 2>/dev/null || true
    find node_modules -name "LICENSE*" -delete 2>/dev/null || true
    find node_modules -name "CHANGELOG*" -delete 2>/dev/null || true
    find node_modules -name "*.map" -delete 2>/dev/null || true

    # Create ZIP package with better compression
    log_info "Creating ZIP package for $FUNCTION_NAME..."
    if zip -r -q -9 "../$FUNCTION_NAME.zip" .; then
        PACKAGE_SIZE=$(du -h "../$FUNCTION_NAME.zip" | cut -f1)
        FILE_COUNT=$(find . -type f | wc -l)
        log_success "Package created: $FUNCTION_NAME.zip ($PACKAGE_SIZE, $FILE_COUNT files)"
    else
        log_error "Failed to create ZIP package for $FUNCTION_NAME"
    fi
    cd ..

    # Clean up temp directory
    rm -rf "$TEMP_DIR"
done

# If only packaging, stop here
if [ "$DEPLOY_TO_AWS" = "package" ]; then
    log_success "🎉 All Lambda functions packaged successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Run './deploy.sh deploy' to deploy via AWS CLI"
    echo "2. Or upload each .zip file manually in AWS Console (see guides/MANUAL_DEPLOYMENT_GUIDE.md)"
    echo "3. Or use the comprehensive deployment guide (see guides/DEPLOYMENT_GUIDE.md)"
    echo ""
    echo "📦 Created packages:"
    for FUNCTION_NAME in "${FUNCTIONS[@]}"; do
        if [ -f "$FUNCTION_NAME.zip" ]; then
            echo "   - $FUNCTION_NAME.zip"
        fi
    done
    exit 0
fi

# Deploy to AWS Lambda
if [ "$DEPLOY_TO_AWS" = "deploy" ]; then
    log_info "🚀 Starting AWS deployment..."

    # Discover function name mappings
    echo ""
    log_info "Available Lambda functions in your AWS account:"
    aws lambda list-functions --query 'Functions[].FunctionName' --output table
    echo ""

    # Deploy each function
    for FUNCTION_NAME in "${FUNCTIONS[@]}"; do
        if [ ! -f "$FUNCTION_NAME.zip" ]; then
            log_warning "Package $FUNCTION_NAME.zip not found, skipping..."
            continue
        fi

        echo ""
        log_info "Deploying $FUNCTION_NAME..."

        # Try exact name first
        AWS_FUNCTION_NAME="$FUNCTION_NAME"

        # Create backup
        backup_function "$AWS_FUNCTION_NAME" "$FUNCTION_NAME"

        # Deploy function
        if aws lambda update-function-code \
            --function-name "$AWS_FUNCTION_NAME" \
            --zip-file "fileb://$FUNCTION_NAME.zip" \
            --query 'LastModified' --output text >/dev/null 2>&1; then

            log_success "$FUNCTION_NAME deployed successfully!"

            # Wait a moment for deployment to complete
            sleep 2

            # Test the function
            test_function "$AWS_FUNCTION_NAME"
        else
            log_error "Failed to deploy $FUNCTION_NAME"
            log_info "This might happen if:"
            echo "  - Function name '$AWS_FUNCTION_NAME' doesn't exist in AWS"
            echo "  - You don't have permission to update the function"
            echo "  - The function is in a different region"
            echo ""
            echo "Available functions in your account:"
            aws lambda list-functions --query 'Functions[*].[FunctionName,Runtime]' --output table
        fi
    done

    log_success "🎉 Deployment process completed!"
    echo ""
    echo "📋 Verification steps:"
    echo "1. Check CloudWatch logs for any errors"
    echo "2. Test your API endpoints:"
    echo "   - POST https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/spins"
    echo "   - GET  https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/spins"
    echo "   - GET  https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/metrics"
    echo "   - GET  https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/entries"
    echo "   - POST https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/entries"
    echo "   - DELETE https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/entries/{id}"
    echo "3. Test your website's wheel and data manager functionality"
fi