# 🚀 Lambda Functions Deployment Guide

This guide will help you deploy your Lambda functions for the portfolio website spin tracking system.

## 🔧 **What This Deployment Includes**

### **Modern AWS SDK Implementation**
Your Lambda functions use AWS SDK v3 with these improvements:
1. **Modern AWS SDK v3**: Uses `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb`
2. **Command Pattern**: Utilizes `DynamoDBDocumentClient` with proper command pattern
3. **CORS Headers**: Includes proper CORS headers for web integration
4. **Error Handling**: Comprehensive error handling with meaningful responses
5. **Enhanced Metrics**: Detailed statistics and analytics in `getGlobalMetrics`

### **Available Functions**
- **recordSpin**: Records wheel spin events to DynamoDB
- **getSpinHistory**: Retrieves paginated spin history
- **getGlobalMetrics**: Calculates usage statistics and analytics
- **clearSpinHistory**: Clears all spin data (use carefully!)

## 📚 **Quick Start - Choose Your Method**

### 🎯 **Method 1: Automated CLI Deployment (Recommended)**
```bash
cd lambda-functions
./deploy.sh deploy          # Package and deploy automatically
./verify-deployment.sh      # Verify everything works
```

### 🔧 **Method 2: Package Only (Then Manual Upload)**
```bash
cd lambda-functions
./deploy.sh                 # Creates .zip files only
# Then manually upload via AWS Console (see MANUAL_DEPLOYMENT_GUIDE.md)
```

### 📖 **Method 3: Step-by-Step Manual Process**
Follow the detailed [MANUAL_DEPLOYMENT_GUIDE.md](./MANUAL_DEPLOYMENT_GUIDE.md) for complete control.

---

## 📦 **Deployment Options**

### **Option 1: Automated AWS CLI Deployment (NEW - Recommended)**

**Prerequisites:**
- `zip` utility installed (`sudo apt install zip` on Ubuntu/Debian)
- AWS CLI configured (`aws configure`)
- Lambda functions exist in your AWS account

**Steps:**
1. **Package and Deploy**:
   ```bash
   cd lambda-functions
   ./deploy.sh deploy
   ```

2. **Verify Deployment**:
   ```bash
   ./verify-deployment.sh
   ```

This method will:
- ✅ Create fresh packages with dependencies
- ✅ Backup existing functions automatically
- ✅ Deploy to matching Lambda functions
- ✅ Test each function after deployment
- ✅ Provide detailed success/failure feedback

### **Option 2: Package Only + AWS Console Upload**

1. **Package Functions**:
   ```bash
   cd lambda-functions
   ./deploy.sh
   ```
   This creates `.zip` files for each function.

2. **Deploy via AWS Console**:
   See detailed instructions in [MANUAL_DEPLOYMENT_GUIDE.md](./MANUAL_DEPLOYMENT_GUIDE.md)

### **Option 3: Legacy Method (Deprecated)**

The old direct AWS CLI method has been replaced by the improved `./deploy.sh deploy` command above.

## 🔍 **Verification Steps**

### **Automated Verification (Recommended)**
```bash
cd lambda-functions
./verify-deployment.sh
```

This comprehensive script will:
- ✅ Test all Lambda functions directly
- ✅ Test API Gateway endpoints
- ✅ Validate response structure
- ✅ Check DynamoDB integration
- ✅ Verify CORS headers
- ✅ Provide detailed pass/fail report

### **Manual API Testing**

If you prefer manual testing:

```bash
# Test getting metrics (safe to run)
curl https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/metrics

# Test getting spin history (safe to run)
curl "https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/spins?limit=10"

# Test recording a spin (creates test data)
curl -X POST https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/spins \
  -H "Content-Type: application/json" \
  -d '{
    "entryId": "test123",
    "entryName": "Test Entry",
    "entryType": "Test",
    "entryWho": "Tester",
    "sessionId": "test_session_123"
  }'
```

### **2. Expected Responses**

**Successful Spin Recording**:
```json
{
  "id": "spin_12345...",
  "entryId": "test123",
  "entryName": "Test Entry",
  "timestamp": "2025-01-15T14:30:00.000Z",
  "sessionId": "test_session_123"
}
```

**Metrics Response**:
```json
{
  "totalSpins": 42,
  "uniqueUsers": 5,
  "todaySpins": 3,
  "weekSpins": 15,
  "topEntries": [...],
  "typeDistribution": [...],
  "averageSpinsPerUser": 8.4,
  "lastUpdated": "2025-01-15T14:30:00.000Z"
}
```

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **"Module not found" errors**:
   - Ensure you've uploaded the `.zip` files that include `node_modules`
   - Verify the runtime is set to Node.js 18.x or 20.x

2. **DynamoDB permissions**:
   - Ensure Lambda execution role has `DynamoDBFullAccess` or custom policy
   - Check CloudWatch logs for specific permission errors

3. **CORS issues**:
   - Functions now include proper CORS headers
   - Ensure API Gateway CORS is also enabled

### **Debugging Steps**

1. **Check CloudWatch Logs**:
   - Go to CloudWatch → Log groups
   - Look for `/aws/lambda/[function-name]`
   - Check recent log streams for errors

2. **Test Lambda Directly**:
   - In AWS Console, go to Lambda function
   - Use "Test" tab with sample events
   - Check execution results and logs

## 📋 **Dependencies**

The functions now use these modern AWS SDK packages:
- `@aws-sdk/client-dynamodb`: ^3.478.0
- `@aws-sdk/lib-dynamodb`: ^3.478.0
- `uuid`: ^9.0.1

## 🔐 **Security Notes**

- Functions include CORS headers allowing all origins (`*`)
- For production, consider restricting to your domain
- `clearSpinHistory` should be protected in production environments

## 🎯 **Next Steps After Deployment**

1. **Test your website**: Visit cormacoconnor.net and test the wheel functionality
2. **Check metrics**: Verify global metrics are displaying correctly
3. **Monitor logs**: Watch CloudWatch logs for any issues
4. **Performance**: Monitor DynamoDB usage and costs

## 📞 **If Issues Persist**

If you still encounter problems:
1. Check CloudWatch logs first
2. Verify DynamoDB table exists and has proper schema
3. Ensure API Gateway routes are correctly mapped
4. Test Lambda functions directly before testing through API Gateway

Your Lambda functions should now work correctly with the modern AWS SDK v3!