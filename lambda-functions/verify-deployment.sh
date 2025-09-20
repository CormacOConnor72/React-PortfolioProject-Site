#!/bin/bash

# Lambda Function Deployment Verification Script
# Tests all Lambda functions and API Gateway endpoints

set -e

# Configuration
API_BASE_URL="https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod"
FUNCTIONS=("recordSpin" "getSpinHistory" "getGlobalMetrics" "clearSpinHistory" "portfolio-create-entry" "portfolio-delete-entry" "portfolio-get-entries")
TEMP_DIR="/tmp/lambda_verification_$$"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_header() { echo -e "${BOLD}${BLUE}🔍 $1${NC}"; echo ""; }

# Create temp directory for test results
mkdir -p "$TEMP_DIR"
trap "rm -rf $TEMP_DIR" EXIT

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to clean up test entries
cleanup_test_entries() {
    log_info "Cleaning up verification test entries..."

    # Clean up portfolio test entries
    API_BASE_URL="https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod"

    # Get all entries and filter for test entries
    TEST_ENTRIES=$(curl -s "$API_BASE_URL/entries" | grep -o '"id":"[^"]*"[^}]*"name":"[^"]*\[VERIFY_TEST\]' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

    if [ ! -z "$TEST_ENTRIES" ]; then
        echo "$TEST_ENTRIES" | while read -r entry_id; do
            if [ ! -z "$entry_id" ]; then
                log_info "Removing verification test entry: $entry_id"
                curl -s -X DELETE "$API_BASE_URL/entries/$entry_id" > /dev/null
            fi
        done
        log_success "Verification test entries cleaned up"
    else
        log_info "No verification test entries found to clean up"
    fi
}

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"

    ((TESTS_TOTAL++))
    echo -n "Testing $test_name... "

    if eval "$test_command" > "$TEMP_DIR/test_output.txt" 2>&1; then
        if [ -n "$expected_pattern" ]; then
            if grep -q "$expected_pattern" "$TEMP_DIR/test_output.txt"; then
                echo -e "${GREEN}✅ PASSED${NC}"
                ((TESTS_PASSED++))
                return 0
            else
                echo -e "${RED}❌ FAILED${NC} (unexpected response)"
                echo "Expected pattern: $expected_pattern"
                echo "Actual response:"
                cat "$TEMP_DIR/test_output.txt" | head -5
                ((TESTS_FAILED++))
                return 1
            fi
        else
            echo -e "${GREEN}✅ PASSED${NC}"
            ((TESTS_PASSED++))
            return 0
        fi
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "Error details:"
        cat "$TEMP_DIR/test_output.txt" | head -5
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "🚀 Starting Lambda Function Verification"
echo "========================================"
echo ""

# Check prerequisites
log_header "Prerequisites Check"

# Check AWS CLI
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    log_error "AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-1")
log_info "Testing in AWS Account: $AWS_ACCOUNT, Region: $AWS_REGION"

# Check if curl is available
if ! command -v curl > /dev/null; then
    log_error "curl is required but not installed. Please install curl."
    exit 1
fi

# Check if jq is available (optional but helpful)
if command -v jq > /dev/null; then
    JQ_AVAILABLE=true
    log_info "jq is available for JSON formatting"
else
    JQ_AVAILABLE=false
    log_warning "jq not available - JSON responses will be raw"
fi

echo ""

# Test 1: Lambda Functions Direct Testing
log_header "Direct Lambda Function Testing"

for FUNCTION_NAME in "${FUNCTIONS[@]}"; do
    echo "Testing Lambda function: $FUNCTION_NAME"

    # Check if function exists
    if aws lambda get-function --function-name "$FUNCTION_NAME" > /dev/null 2>&1; then
        log_info "Function $FUNCTION_NAME exists"

        # Create appropriate test payload
        case $FUNCTION_NAME in
            "recordSpin")
                run_test "$FUNCTION_NAME Lambda" \
                    "aws lambda invoke --function-name $FUNCTION_NAME --payload '{\"body\": \"{\\\"entryId\\\":\\\"test_verify_123\\\",\\\"entryName\\\":\\\"Verification Test\\\",\\\"entryType\\\":\\\"Test\\\",\\\"entryWho\\\":\\\"VerificationScript\\\",\\\"sessionId\\\":\\\"verify_session_123\\\"}\"}' --cli-binary-format raw-in-base64-out $TEMP_DIR/lambda_response.json --region eu-north-1 && cat $TEMP_DIR/lambda_response.json" \
                    '"statusCode": 200'
                ;;
            "getSpinHistory")
                run_test "$FUNCTION_NAME Lambda" \
                    "aws lambda invoke --function-name $FUNCTION_NAME --payload '{\"queryStringParameters\": {\"limit\": \"5\"}}' --cli-binary-format raw-in-base64-out $TEMP_DIR/lambda_response.json --region eu-north-1 && cat $TEMP_DIR/lambda_response.json" \
                    '"statusCode": 200'
                ;;
            "getGlobalMetrics")
                run_test "$FUNCTION_NAME Lambda" \
                    "aws lambda invoke --function-name $FUNCTION_NAME --payload '{}' --cli-binary-format raw-in-base64-out $TEMP_DIR/lambda_response.json --region eu-north-1 && cat $TEMP_DIR/lambda_response.json" \
                    'totalSpins'
                ;;
            "clearSpinHistory")
                log_warning "Skipping destructive test for $FUNCTION_NAME"
                ;;
            "portfolio-create-entry")
                run_test "$FUNCTION_NAME Lambda" \
                    "aws lambda invoke --function-name $FUNCTION_NAME --payload '{\"body\": \"{\\\"name\\\":\\\"[VERIFY_TEST] Verification Test Entry\\\",\\\"type\\\":\\\"Test\\\",\\\"who\\\":\\\"VerificationScript\\\",\\\"why\\\":\\\"Testing deployment\\\"}\"}' --cli-binary-format raw-in-base64-out $TEMP_DIR/lambda_response.json --region eu-north-1 && cat $TEMP_DIR/lambda_response.json" \
                    '"statusCode": 201'

                # Verify the entry actually exists in the database
                echo -n "  Verifying entry exists in database... "
                for attempt in 1 2 3 4 5; do
                    if curl -s "https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/entries" | grep -q "\\[VERIFY_TEST\\]"; then
                        echo -e "${GREEN}✅ CONFIRMED${NC}"
                        break
                    elif [ $attempt -eq 5 ]; then
                        echo -e "${YELLOW}⚠️  Entry not found in database${NC}"
                        ((TESTS_FAILED++))
                        ((TESTS_TOTAL++))
                    else
                        sleep 1
                    fi
                done
                ;;
            "portfolio-delete-entry")
                run_test "$FUNCTION_NAME Lambda" \
                    "aws lambda invoke --function-name $FUNCTION_NAME --payload '{\"pathParameters\": {\"id\": \"test-verification-id\"}}' --cli-binary-format raw-in-base64-out $TEMP_DIR/lambda_response.json --region eu-north-1 && cat $TEMP_DIR/lambda_response.json" \
                    '"statusCode": 200'
                ;;
            "portfolio-get-entries")
                run_test "$FUNCTION_NAME Lambda" \
                    "aws lambda invoke --function-name $FUNCTION_NAME --payload '{}' --cli-binary-format raw-in-base64-out $TEMP_DIR/lambda_response.json --region eu-north-1 && cat $TEMP_DIR/lambda_response.json" \
                    '"statusCode": 200'
                ;;
        esac
    else
        log_error "Function $FUNCTION_NAME does not exist"
        ((TESTS_FAILED++))
        ((TESTS_TOTAL++))
    fi
    echo ""
done

# Test 2: API Gateway Endpoint Testing
log_header "API Gateway Endpoint Testing"

# Test GET /metrics endpoint
run_test "GET /metrics endpoint" \
    "curl -s -w '%{http_code}' '$API_BASE_URL/metrics'" \
    "200"

# Test GET /spins endpoint
run_test "GET /spins endpoint" \
    "curl -s -w '%{http_code}' '$API_BASE_URL/spins?limit=5'" \
    "200"

# Test POST /spins endpoint
TEST_JSON='{"entryId":"api_test_123","entryName":"API Test Entry","entryType":"Test","entryWho":"API Tester","sessionId":"api_test_session"}'
run_test "POST /spins endpoint" \
    "curl -s -w '%{http_code}' -X POST '$API_BASE_URL/spins' -H 'Content-Type: application/json' -d '$TEST_JSON'" \
    "200"

# Test GET /entries endpoint
run_test "GET /entries endpoint" \
    "curl -s -w '%{http_code}' '$API_BASE_URL/entries'" \
    "200"

# Test POST /entries endpoint
ENTRY_JSON='{"name":"[VERIFY_TEST] API Test Entry","type":"Test","who":"API Tester","why":"Testing API endpoint"}'
run_test "POST /entries endpoint" \
    "curl -s -w '%{http_code}' -X POST '$API_BASE_URL/entries' -H 'Content-Type: application/json' -d '$ENTRY_JSON'" \
    "201"

echo ""

# Test 3: Response Content Validation
log_header "Response Content Validation"

# Test metrics response structure
echo "Validating metrics response structure..."
curl -s "$API_BASE_URL/metrics" > "$TEMP_DIR/metrics_response.json"

if [ $JQ_AVAILABLE = true ]; then
    # Check if response has expected fields
    EXPECTED_FIELDS=("totalSpins" "uniqueUsers" "todaySpins" "weekSpins" "topEntries" "typeDistribution")

    for field in "${EXPECTED_FIELDS[@]}"; do
        if jq -e ".$field" "$TEMP_DIR/metrics_response.json" > /dev/null; then
            run_test "Metrics field: $field" "echo 'Field exists'" ""
        else
            run_test "Metrics field: $field" "false" ""
        fi
    done
else
    # Basic validation without jq
    for field in "totalSpins" "uniqueUsers" "todaySpins" "weekSpins"; do
        run_test "Metrics contains: $field" \
            "grep -q '\"$field\"' $TEMP_DIR/metrics_response.json" \
            ""
    done
fi

echo ""

# Test 4: DynamoDB Integration Test
log_header "DynamoDB Integration Test"

# Check if DynamoDB tables exist
run_test "DynamoDB SpinHistory table existence" \
    "aws dynamodb describe-table --table-name SpinHistory" \
    "TableName"

run_test "DynamoDB portfolio-data-entries table existence" \
    "aws dynamodb describe-table --table-name portfolio-data-entries" \
    "TableName"

# Check if we can read from the tables
run_test "DynamoDB SpinHistory read access" \
    "aws dynamodb scan --table-name SpinHistory --limit 1" \
    "Items"

run_test "DynamoDB portfolio-data-entries read access" \
    "aws dynamodb scan --table-name portfolio-data-entries --limit 1" \
    "Items"

echo ""

# Test 5: CORS Headers Test
log_header "CORS Headers Test"

echo "Checking CORS headers..."
curl -s -I "$API_BASE_URL/metrics" > "$TEMP_DIR/headers.txt"

run_test "CORS Access-Control-Allow-Origin header" \
    "grep -i 'access-control-allow-origin' $TEMP_DIR/headers.txt" \
    ""

echo ""

# Clean up test entries created during verification
cleanup_test_entries

# Summary
log_header "Verification Summary"

echo "========================================"
echo -e "${BOLD}Test Results:${NC}"
echo -e "  Total Tests: $TESTS_TOTAL"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    log_success "🎉 All tests passed! Your Lambda functions are working correctly."
    echo ""
    echo "✅ Your deployment is successful and ready for production!"
    echo ""
    echo "Next steps:"
    echo "1. Test your website's wheel functionality"
    echo "2. Monitor CloudWatch logs for any issues"
    echo "3. Consider setting up CloudWatch alarms for errors"

    exit 0
else
    echo ""
    log_error "❌ $TESTS_FAILED test(s) failed. Please review the errors above."
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check CloudWatch logs for detailed error messages"
    echo "2. Verify DynamoDB table permissions"
    echo "3. Ensure Lambda function names match your AWS deployment"
    echo "4. Run individual tests with verbose output"
    echo ""
    echo "Detailed logs are available in: $TEMP_DIR"

    # Keep temp dir for debugging if tests failed
    trap - EXIT
    log_info "Test artifacts saved in: $TEMP_DIR"

    exit 1
fi