#!/bin/bash

# AWS Lambda Function Packaging Script (without AWS CLI dependency)
# This script only packages the Lambda functions for manual upload

set -e

echo "📦 Starting Lambda function packaging..."

# Function names
FUNCTIONS=("recordSpin" "getSpinHistory" "getGlobalMetrics" "clearSpinHistory")

# Clean up any existing packages
echo "🧹 Cleaning up existing packages..."
rm -f *.zip *.tar.gz

# Create deployment package for each function
for FUNCTION_NAME in "${FUNCTIONS[@]}"; do
    echo "📦 Packaging $FUNCTION_NAME..."

    # Create temporary directory for this function
    TEMP_DIR="temp_$FUNCTION_NAME"
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"

    # Copy function code
    cp "$FUNCTION_NAME.js" "$TEMP_DIR/index.js"
    cp package.json "$TEMP_DIR/"

    # Install dependencies in temp directory
    cd "$TEMP_DIR"
    echo "  📥 Installing dependencies..."
    npm install --production --no-package-lock --silent

    # Create ZIP package (use tar if zip not available)
    echo "  🗜️  Creating package..."
    if command -v zip >/dev/null 2>&1; then
        zip -r -q "../$FUNCTION_NAME.zip" .
        PACKAGE_NAME="$FUNCTION_NAME.zip"
    else
        tar -czf "../$FUNCTION_NAME.tar.gz" .
        PACKAGE_NAME="$FUNCTION_NAME.tar.gz"
    fi
    cd ..

    # Clean up temp directory
    rm -rf "$TEMP_DIR"

    # Get package size
    SIZE=$(ls -lh "$PACKAGE_NAME" | awk '{print $5}')
    echo "  ✅ Package created: $PACKAGE_NAME ($SIZE)"
done

echo ""
echo "🎉 All Lambda functions packaged successfully!"
echo ""
echo "📋 Manual deployment steps:"
echo "1. Go to AWS Lambda Console"
echo "2. For each function below, upload its corresponding package:"
echo ""

# List created packages
for PACKAGE in *.zip *.tar.gz; do
    if [ -f "$PACKAGE" ] 2>/dev/null; then
        SIZE=$(ls -lh "$PACKAGE" | awk '{print $5}')
        FUNC_NAME=$(basename "$PACKAGE" | sed 's/\.[^.]*$//')
        echo "   📦 $PACKAGE ($SIZE) → Upload to '$FUNC_NAME' Lambda function"
    fi
done 2>/dev/null || true

echo ""
echo "🔧 Note: If you have .tar.gz files, you'll need to extract and repackage as .zip"
echo "   AWS Lambda requires .zip format for uploads via console"
echo ""
echo "3. After uploading, test each function through API Gateway"
echo "4. Check CloudWatch logs if any issues occur"