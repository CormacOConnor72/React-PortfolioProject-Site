# 🔧 AWS Lambda Functions Troubleshooting Guide

This guide documents all the AWS configuration issues encountered, fixes applied, and CLI commands used to resolve them.

## 📋 **Issues Resolved**

### **Issue 1: DynamoDB Access Denied Errors**

#### **Problem**
```
AccessDeniedException: User: arn:aws:sts::756497581247:assumed-role/getGlobalMetrics-role-5bia4sl1/getGlobalMetrics is not authorized to perform: dynamodb:Scan on resource: arn:aws:dynamodb:eu-north-1:756497581247:table/SpinHistory
```

#### **Root Cause**
Lambda execution roles lacked DynamoDB permissions.

#### **Solution Applied**
Added DynamoDB permissions to all Lambda execution roles:

```bash
# Read-only access for metrics and history functions
aws iam attach-role-policy \
  --role-name getGlobalMetrics-role-5bia4sl1 \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess

aws iam attach-role-policy \
  --role-name getSpinHistory-role-ngxh244o \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess

# Full access for create/delete functions
aws iam attach-role-policy \
  --role-name recordSpin-role-thyb8yxw \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

aws iam attach-role-policy \
  --role-name clearSpinHistory-role-ebyfqggt \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
```

#### **Verification**
```bash
# Check attached policies
aws iam list-attached-role-policies --role-name getGlobalMetrics-role-5bia4sl1

# Test DynamoDB access
aws dynamodb describe-table --table-name SpinHistory --region eu-north-1
```

---

### **Issue 2: API Gateway Body Mapping Problems**

#### **Problem**
```javascript
// Lambda logs showing:
"Recording spin: undefined"
"Error: \"undefined\" is not valid JSON"
```

#### **Root Cause**
API Gateway integration type mismatch:
- **Working endpoints**: `AWS_PROXY` integration (entries)
- **Failing endpoints**: `AWS` integration (spins, metrics)

With `AWS` integration, API Gateway requires explicit request/response mapping templates, but they weren't configured.

#### **Discovery Commands**
```bash
# Find API Gateway
aws apigateway get-rest-apis --region us-east-1 \
  --query 'items[?contains(name, `portfolio`)]' --output table

# Get API resources
aws apigateway get-resources --rest-api-id n9x7n282md --region us-east-1

# Compare integrations (working vs broken)
aws apigateway get-integration \
  --rest-api-id n9x7n282md --resource-id yg5kcy --http-method POST --region us-east-1

aws apigateway get-integration \
  --rest-api-id n9x7n282md --resource-id n89a98 --http-method POST --region us-east-1
```

#### **Solution Applied**
Changed all spin/metrics endpoints to use `AWS_PROXY` integration:

```bash
# Fix /spins POST (recordSpin)
aws apigateway put-integration \
  --rest-api-id n9x7n282md --resource-id n89a98 --http-method POST \
  --type AWS_PROXY --integration-http-method POST \
  --uri "arn:aws:apigateway:eu-north-1:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-north-1:756497581247:function:recordSpin/invocations" \
  --region us-east-1

# Fix /spins GET (getSpinHistory)
aws apigateway put-integration \
  --rest-api-id n9x7n282md --resource-id n89a98 --http-method GET \
  --type AWS_PROXY --integration-http-method POST \
  --uri "arn:aws:apigateway:eu-north-1:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-north-1:756497581247:function:getSpinHistory/invocations" \
  --region us-east-1

# Fix /spins DELETE (clearSpinHistory)
aws apigateway put-integration \
  --rest-api-id n9x7n282md --resource-id n89a98 --http-method DELETE \
  --type AWS_PROXY --integration-http-method POST \
  --uri "arn:aws:apigateway:eu-north-1:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-north-1:756497581247:function:clearSpinHistory/invocations" \
  --region us-east-1

# Fix /metrics GET (getGlobalMetrics)
aws apigateway put-integration \
  --rest-api-id n9x7n282md --resource-id gw5rjt --http-method GET \
  --type AWS_PROXY --integration-http-method POST \
  --uri "arn:aws:apigateway:eu-north-1:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-north-1:756497581247:function:getGlobalMetrics/invocations" \
  --region us-east-1

# Deploy changes
aws apigateway create-deployment --rest-api-id n9x7n282md --stage-name prod --region us-east-1
```

#### **Fix for Delete Entries**
```bash
# Also fixed entries delete endpoint
aws apigateway put-integration \
  --rest-api-id n9x7n282md --resource-id zxi2kb --http-method DELETE \
  --type AWS_PROXY --integration-http-method POST \
  --uri "arn:aws:apigateway:eu-north-1:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-north-1:756497581247:function:portfolio-delete-entry/invocations" \
  --region us-east-1

# Deploy
aws apigateway create-deployment --rest-api-id n9x7n282md --stage-name prod --region us-east-1
```

#### **Verification**
```bash
# Test endpoints after fix
curl -X POST "https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/spins" \
  -H "Content-Type: application/json" \
  -d '{"entryId":"test123","entryName":"Test Entry","entryType":"Test","entryWho":"Claude","sessionId":"test_session"}'

curl "https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/metrics"
curl "https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/spins?limit=5"
```

---

### **Issue 3: Cross-Region Architecture**

#### **Current Setup**
```
CloudFront (Global) → API Gateway (us-east-1) → Lambda Functions (eu-north-1) → DynamoDB (eu-north-1)
```

#### **Why This Architecture**
- **CloudFront Requirement**: API Gateway must be in `us-east-1` for CloudFront integration
- **Latency Impact**: ~100-200ms additional latency per API call
- **Decision**: Keep current architecture - latency is acceptable for the use case

#### **Performance Measurement**
```bash
# Test latency from different regions
time curl "https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/metrics"
```

---

## 🛠️ **Diagnostic Commands Reference**

### **Lambda Functions**
```bash
# List all Lambda functions
aws lambda list-functions --region eu-north-1 --output table

# Get specific function info
aws lambda get-function --function-name recordSpin --region eu-north-1

# Check function logs
aws logs describe-log-streams \
  --log-group-name "/aws/lambda/recordSpin" --region eu-north-1 \
  --order-by LastEventTime --descending --max-items 1

# Get recent logs
aws logs get-log-events \
  --log-group-name "/aws/lambda/recordSpin" \
  --log-stream-name "STREAM_NAME" --region eu-north-1
```

### **API Gateway**
```bash
# Find API Gateway
aws apigateway get-rest-apis --region us-east-1

# Get API structure
aws apigateway get-resources --rest-api-id API_ID --region us-east-1

# Check specific integration
aws apigateway get-integration \
  --rest-api-id API_ID --resource-id RESOURCE_ID --http-method METHOD --region us-east-1

# Deploy changes
aws apigateway create-deployment \
  --rest-api-id API_ID --stage-name prod --region us-east-1
```

### **DynamoDB**
```bash
# Check table
aws dynamodb describe-table --table-name SpinHistory --region eu-north-1

# Scan table (limited results)
aws dynamodb scan --table-name SpinHistory --limit 5 --region eu-north-1
```

### **IAM Permissions**
```bash
# List role policies
aws iam list-attached-role-policies --role-name ROLE_NAME

# Check policy details
aws iam get-policy --policy-arn POLICY_ARN
aws iam get-policy-version --policy-arn POLICY_ARN --version-id v1
```

---

## 🔍 **Testing and Verification**

### **Comprehensive API Test Script**
```bash
#!/bin/bash

API_BASE="https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod"

echo "Testing API endpoints..."

# Test metrics (should work)
echo "1. Testing GET /metrics"
curl -s "$API_BASE/metrics" | jq .

# Test spin recording
echo "2. Testing POST /spins"
curl -s -X POST "$API_BASE/spins" \
  -H "Content-Type: application/json" \
  -d '{"entryId":"test","entryName":"Test","entryType":"Test","entryWho":"Test","sessionId":"test"}' | jq .

# Test spin history
echo "3. Testing GET /spins"
curl -s "$API_BASE/spins?limit=3" | jq .

# Test entries
echo "4. Testing GET /entries"
curl -s "$API_BASE/entries" | jq . | head -10

echo "All tests completed!"
```

### **Expected Responses**

#### **Successful Spin Recording**
```json
{
  "id": "spin_786ddd02-3055-4af4-aafe-6a1e32a89f5a",
  "entryId": "test123",
  "entryName": "Test Entry",
  "entryType": "Test",
  "entryWho": "Claude",
  "filter": "all",
  "weightedMode": false,
  "timestamp": "2025-09-15T14:30:13.317Z",
  "sessionId": "test_session_123",
  "createdAt": "2025-09-15T14:30:13.317Z"
}
```

#### **Metrics Response**
```json
{
  "totalSpins": 1,
  "uniqueUsers": 1,
  "todaySpins": 1,
  "weekSpins": 1,
  "topEntries": [{"name": "Test Entry", "count": 1}],
  "typeDistribution": [{"type": "Test", "count": 1}],
  "averageSpinsPerUser": 1,
  "lastUpdated": "2025-09-15T14:30:28.906Z"
}
```

---

## 📊 **Architecture Overview**

### **Current Working Architecture**
```
Frontend (React) → CloudFront → API Gateway (us-east-1) → Lambda Functions (eu-north-1) → DynamoDB (eu-north-1)
```

### **Data Flow**
1. **DataManager System**: Manages wheel entries
   - `GET /entries` → `portfolio-get-entries`
   - `POST /entries` → `portfolio-create-entry`
   - `DELETE /entries/{id}` → `portfolio-delete-entry`

2. **Analytics System**: Tracks wheel usage
   - `POST /spins` → `recordSpin`
   - `GET /spins` → `getSpinHistory`
   - `DELETE /spins` → `clearSpinHistory`
   - `GET /metrics` → `getGlobalMetrics`

### **Database Schema**
**SpinHistory Table (DynamoDB)**:
- Primary Key: `id` (String), `timestamp` (String)
- Attributes: `entryId`, `entryName`, `entryType`, `entryWho`, `sessionId`, `filter`, `weightedMode`, `createdAt`

---

## 🚨 **Common Issues & Solutions**

### **500 Internal Server Error**
1. Check Lambda function logs in CloudWatch
2. Verify IAM permissions
3. Check API Gateway integration type (`AWS_PROXY` required)

### **Missing Authentication Token**
- API Gateway path parameter configuration issue
- Check resource path structure in API Gateway console

### **AccessDenied on DynamoDB**
- Attach appropriate DynamoDB policies to Lambda execution roles

### **CORS Issues**
- Lambda functions include CORS headers
- Check API Gateway CORS configuration
- Enable OPTIONS method for all resources

---

## 📈 **Performance Considerations**

### **Latency Breakdown**
- CloudFront → API Gateway: ~0-5ms
- API Gateway → Lambda: ~100-200ms (cross-region)
- Lambda → DynamoDB: ~1-5ms (same region)
- **Total additional latency**: ~100-205ms

### **Optimization Options** (Future)
1. **Caching**: CloudFront/API Gateway caching for read operations
2. **Regional Lambda**: Move time-critical functions to us-east-1
3. **Event-driven**: Use EventBridge for async processing

---

## 🔄 **Deployment Process**

### **Using Enhanced Deploy Script**
```bash
cd lambda-functions

# Package and deploy
./deploy.sh deploy

# Verify deployment
./verify-deployment.sh

# Quick updates
./quick-deploy.sh
```

### **Manual Deployment**
1. Package functions: `./deploy.sh` (creates .zip files)
2. Upload via AWS Console or CLI
3. Test endpoints
4. Check CloudWatch logs

---

## 📞 **Support Commands**

### **Quick Health Check**
```bash
# Test all endpoints quickly
curl -s "https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/metrics" | grep -o "totalSpins"
curl -s "https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/entries" | grep -o '"id"' | wc -l
```

### **Log Monitoring**
```bash
# Watch logs in real-time
aws logs tail "/aws/lambda/recordSpin" --region eu-north-1 --follow
```

This troubleshooting guide provides complete documentation of all issues encountered and their solutions, enabling quick resolution of similar problems in the future.