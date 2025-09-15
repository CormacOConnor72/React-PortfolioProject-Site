#!/bin/bash

# Quick Lambda Function Test Script
# Tests core functionality of all Lambda functions

set -e

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

echo "🚀 Quick Lambda Function Test"
echo "============================="
echo ""

# Test recordSpin
echo -n "Testing recordSpin... "
if aws lambda invoke --function-name recordSpin --payload '{"body": "{\"entryId\":\"test\",\"entryName\":\"Test Entry\",\"sessionId\":\"test_session\"}"}' --cli-binary-format raw-in-base64-out /tmp/test_recordSpin.json --region eu-north-1 >/dev/null 2>&1; then
    if tail -1 /tmp/test_recordSpin.json | grep -q '"statusCode":200'; then
        echo -e "${GREEN}✅ PASSED${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING${NC} - Check response"
    fi
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Test getGlobalMetrics
echo -n "Testing getGlobalMetrics... "
aws lambda invoke --function-name getGlobalMetrics --payload '{}' --cli-binary-format raw-in-base64-out /tmp/test_getMetrics.json --region eu-north-1 >/dev/null 2>&1
if [ -f /tmp/test_getMetrics.json ] && cat /tmp/test_getMetrics.json | grep -q 'totalSpins'; then
    echo -e "${GREEN}✅ PASSED${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING${NC} - Check response"
fi

# Test portfolio-get-entries
echo -n "Testing portfolio-get-entries... "
if aws lambda invoke --function-name portfolio-get-entries --payload '{}' --cli-binary-format raw-in-base64-out /tmp/test_getEntries.json --region eu-north-1 >/dev/null 2>&1; then
    if tail -1 /tmp/test_getEntries.json | grep -q '"statusCode":200'; then
        echo -e "${GREEN}✅ PASSED${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING${NC} - Check response"
    fi
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Test portfolio-create-entry
echo -n "Testing portfolio-create-entry... "
if aws lambda invoke --function-name portfolio-create-entry --payload '{"body": "{\"name\":\"Test Entry\",\"type\":\"Test\",\"who\":\"Test User\",\"why\":\"Testing deployment\"}"}' --cli-binary-format raw-in-base64-out /tmp/test_createEntry.json --region eu-north-1 >/dev/null 2>&1; then
    if tail -1 /tmp/test_createEntry.json | grep -q '"statusCode":201'; then
        echo -e "${GREEN}✅ PASSED${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING${NC} - Check response"
    fi
else
    echo -e "${RED}❌ FAILED${NC}"
fi

echo ""
echo "🔍 API Gateway Tests"
echo "==================="

# Test API Gateway endpoints
API_BASE="https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod"

echo -n "Testing GET /metrics... "
if curl -s "$API_BASE/metrics" | grep -q "totalSpins"; then
    echo -e "${GREEN}✅ PASSED${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

echo -n "Testing GET /entries... "
if curl -s "$API_BASE/entries" | grep -q '\['; then
    echo -e "${GREEN}✅ PASSED${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

echo ""
log_success "Quick tests completed!"
echo ""
echo "For detailed testing, run: ./verify-deployment.sh"

# Cleanup
rm -f /tmp/test_*.json