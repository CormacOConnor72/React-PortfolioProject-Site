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

# Function to clean up test entries
cleanup_test_entries() {
    echo ""
    log_info "Cleaning up quick test entries..."

    # Clean up portfolio test entries
    API_BASE_URL="https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod"

    # Get all entries and filter for test entries
    TEST_ENTRIES=$(curl -s "$API_BASE_URL/entries" | grep -o '"id":"[^"]*"[^}]*"name":"[^"]*\[QUICK_TEST\]' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

    if [ ! -z "$TEST_ENTRIES" ]; then
        CLEANUP_COUNT=0
        echo "$TEST_ENTRIES" | while read -r entry_id; do
            if [ ! -z "$entry_id" ]; then
                log_info "Removing quick test entry: $entry_id"
                if curl -s -X DELETE "$API_BASE_URL/entries/$entry_id" | grep -q "deleted successfully"; then
                    ((CLEANUP_COUNT++))
                fi
            fi
        done
        log_success "Quick test entries cleaned up"
    else
        log_info "No quick test entries found to clean up"
    fi
}

echo "🚀 Quick Lambda Function Test"
echo "============================="
echo ""

# Test recordSpin
echo -n "Testing recordSpin... "
if aws lambda invoke --function-name recordSpin --payload '{"body": "{\"entryId\":\"test\",\"entryName\":\"[QUICK_TEST] Test Entry\",\"sessionId\":\"test_session\"}"}' --cli-binary-format raw-in-base64-out /tmp/test_recordSpin.json --region eu-north-1 >/dev/null 2>&1; then
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
if aws lambda invoke --function-name portfolio-create-entry --payload '{"body": "{\"name\":\"[QUICK_TEST] Test Entry\",\"type\":\"Test\",\"who\":\"Test User\",\"why\":\"Testing deployment\"}"}' --cli-binary-format raw-in-base64-out /tmp/test_createEntry.json --region eu-north-1 >/dev/null 2>&1; then
    if tail -1 /tmp/test_createEntry.json | grep -q '"statusCode":201'; then
        echo -e "${GREEN}✅ PASSED${NC}"

        # Verify the entry is actually in the database
        echo -n "  Verifying entry exists in database... "
        for attempt in 1 2 3 4 5; do
            if curl -s "https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/entries" | grep -q "\\[QUICK_TEST\\] Test Entry"; then
                echo -e "${GREEN}✅ CONFIRMED${NC}"
                break
            elif [ $attempt -eq 5 ]; then
                echo -e "${YELLOW}⚠️  Entry not found in database${NC}"
            else
                sleep 1
            fi
        done
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

# Clean up test entries created during testing
cleanup_test_entries

# Cleanup
rm -f /tmp/test_*.json