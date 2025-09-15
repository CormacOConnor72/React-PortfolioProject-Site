# 📖 Manual Lambda Function Deployment Guide

This guide provides detailed step-by-step instructions for manually deploying your Lambda functions through the AWS Console.

## 🎯 When to Use This Guide

- Your automated deployment script fails
- You want to deploy functions one by one
- You're new to AWS Lambda deployment
- You need to troubleshoot deployment issues
- You want more control over the deployment process

## 📋 Prerequisites

Before you start, ensure you have:

- [ ] AWS Account with appropriate permissions
- [ ] Lambda functions already packaged (`.zip` files exist)
- [ ] DynamoDB table `SpinHistory` created
- [ ] API Gateway configured and routes mapped to your functions

### Quick Prerequisites Check

```bash
# Check if you're in the right directory
ls *.zip

# Expected output:
# clearSpinHistory.zip  getGlobalMetrics.zip  getSpinHistory.zip  recordSpin.zip

# Check AWS access
aws sts get-caller-identity

# Check if DynamoDB table exists
aws dynamodb describe-table --table-name SpinHistory
```

## 🔍 Step 1: Identify Your Lambda Functions in AWS

First, you need to know the exact names of your Lambda functions in AWS.

### Option A: Using AWS CLI
```bash
# List all your Lambda functions
aws lambda list-functions --query 'Functions[*].[FunctionName,Runtime,LastModified]' --output table
```

### Option B: Using AWS Console
1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. You'll see a list of all your functions
3. Note down the exact names of your functions

**Common function names you might see:**
- `recordSpin` or `portfolio-recordSpin`
- `getSpinHistory` or `portfolio-getSpinHistory`
- `getGlobalMetrics` or `portfolio-getGlobalMetrics`
- `clearSpinHistory` or `portfolio-clearSpinHistory`

## 🚀 Step 2: Deploy Each Function Manually

For each function, follow these steps:

### 2.1 Navigate to Lambda Function

1. Open [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Click on the function you want to update (e.g., `recordSpin`)
3. You should see the function overview page

### 2.2 Upload New Code

1. **Scroll to the "Code" section** (usually in the middle of the page)
2. **Click the "Upload from" dropdown button**
3. **Select ".zip file"**
4. **Click "Upload" button**
5. **Navigate to your lambda-functions directory**
6. **Select the corresponding .zip file** (e.g., `recordSpin.zip` for `recordSpin` function)
7. **Click "Open"**
8. **Wait for upload to complete** (you'll see a progress bar)
9. **Click "Deploy"** (this is important - the code isn't active until you deploy!)

### 2.3 Verify Upload Success

After clicking Deploy, you should see:
- ✅ A success message saying "Successfully updated the function"
- ✅ The "Last modified" timestamp should update to the current time
- ✅ In the code editor, you should see your updated function code

### 2.4 Configure Function Settings (if needed)

If this is a new function or you're having issues:

1. **Check Runtime**: Make sure it's set to `Node.js 18.x` or `Node.js 20.x`
2. **Check Handler**: Should be `index.handler`
3. **Check Timeout**: Recommended 30 seconds for these functions
4. **Check Memory**: 128MB is sufficient for these functions

## 🔄 Step 3: Deploy All Functions

Repeat Step 2 for each function:

### 3.1 recordSpin Function
- **AWS Function Name**: (find your exact name from Step 1)
- **Local File**: `recordSpin.zip`
- **Purpose**: Records when someone spins the wheel

### 3.2 getSpinHistory Function
- **AWS Function Name**: (find your exact name from Step 1)
- **Local File**: `getSpinHistory.zip`
- **Purpose**: Retrieves spin history with pagination

### 3.3 getGlobalMetrics Function
- **AWS Function Name**: (find your exact name from Step 1)
- **Local File**: `getGlobalMetrics.zip`
- **Purpose**: Calculates and returns usage statistics

### 3.4 clearSpinHistory Function
- **AWS Function Name**: (find your exact name from Step 1)
- **Local File**: `clearSpinHistory.zip`
- **Purpose**: Clears all spin history (use carefully!)

## ✅ Step 4: Test Each Function

After deploying each function, test it to make sure it works:

### 4.1 Test Using AWS Console

1. **Navigate to your Lambda function**
2. **Click the "Test" tab** (next to Code tab)
3. **Create a test event** or use an existing one
4. **Click "Test" button**
5. **Check the results**

### Test Events for Each Function:

#### recordSpin Test Event:
```json
{
  "body": "{\"entryId\":\"test123\",\"entryName\":\"Test Entry\",\"entryType\":\"Test\",\"entryWho\":\"Tester\",\"sessionId\":\"test_session_123\"}"
}
```

#### getSpinHistory Test Event:
```json
{
  "queryStringParameters": {
    "limit": "5"
  }
}
```

#### getGlobalMetrics Test Event:
```json
{}
```

#### clearSpinHistory Test Event:
⚠️ **DON'T TEST THIS** - it will delete all your data!

### 4.2 Expected Test Results

**Successful Response** should show:
- **Status Code**: 200
- **Response Body**: JSON data (not an error message)
- **Execution Duration**: Under 1000ms typically

**Failed Response** might show:
- Status Code: 500 or error
- Error message in logs
- Check CloudWatch logs for detailed error information

## 🔍 Step 5: Test API Gateway Integration

After all functions are deployed, test your API endpoints:

### Using curl (command line):
```bash
# Test recording a spin
curl -X POST https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/spins \
  -H "Content-Type: application/json" \
  -d '{"entryId":"test123","entryName":"Test Entry","sessionId":"test_session"}'

# Test getting spin history
curl "https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/spins?limit=5"

# Test getting metrics
curl "https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/metrics"
```

### Using your browser:
- Open: `https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/metrics`
- You should see JSON metrics data

## 🛠️ Troubleshooting Common Issues

### Issue 1: "Function not found" during deployment
**Solution**: Double-check the exact function name in AWS Console

### Issue 2: "Module not found" error in function logs
**Cause**: The .zip file doesn't include dependencies
**Solution**:
```bash
cd lambda-functions
rm *.zip  # Remove old packages
./deploy.sh  # Create new packages with dependencies
```

### Issue 3: Function times out
**Cause**: Function takes too long to execute
**Solutions**:
- Increase timeout in Lambda function settings (max 15 minutes)
- Check DynamoDB performance
- Look at CloudWatch logs for specific errors

### Issue 4: DynamoDB permissions error
**Cause**: Lambda execution role doesn't have DynamoDB permissions
**Solution**:
1. Go to IAM Console
2. Find your Lambda execution role
3. Attach `AmazonDynamoDBFullAccess` policy

### Issue 5: CORS errors from your website
**Cause**: API Gateway CORS not properly configured
**Solutions**:
- Lambda functions already include CORS headers
- Check API Gateway CORS settings
- Ensure OPTIONS method is configured for each endpoint

## 📊 Step 6: Monitor and Verify

After deployment:

### 6.1 Check CloudWatch Logs
1. Go to [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
2. Click "Logs" → "Log groups"
3. Find `/aws/lambda/[your-function-name]`
4. Check recent log streams for errors

### 6.2 Test Your Website
1. Visit your portfolio website
2. Try using the wheel feature
3. Check if metrics are updating
4. Verify data is being saved and retrieved correctly

### 6.3 Monitor DynamoDB
1. Go to [DynamoDB Console](https://console.aws.amazon.com/dynamodb/)
2. Click on "SpinHistory" table
3. Click "Explore table items" to see if data is being saved

## 🎯 Success Checklist

After successful deployment, you should have:

- [ ] All 4 Lambda functions updated with new code
- [ ] Each function returns status code 200 when tested
- [ ] API endpoints respond correctly via curl/browser
- [ ] Your website's wheel feature works
- [ ] Data is being saved to DynamoDB
- [ ] Metrics are calculating correctly
- [ ] No errors in CloudWatch logs

## 🔄 Rollback Procedure

If something goes wrong:

### Option 1: Re-deploy previous version
1. Go to Lambda function
2. Click "Actions" → "Export function"
3. Download previous version
4. Upload and deploy it

### Option 2: Use version control
1. Lambda keeps previous versions
2. Go to "Versions" tab in your function
3. Find previous working version
4. Update alias to point to that version

## 📞 Getting Help

If you're still having issues:

1. **Check CloudWatch logs first** - they contain detailed error messages
2. **Verify your DynamoDB table structure matches what the functions expect**
3. **Test each Lambda function individually before testing through API Gateway**
4. **Make sure your IAM permissions are correct**

## 🎉 Next Steps

Once everything is working:

1. **Set up monitoring** - CloudWatch alarms for errors
2. **Consider backup strategy** - Regular DynamoDB backups
3. **Optimize performance** - Monitor function duration and memory usage
4. **Security review** - Restrict CORS origins in production

Your Lambda functions should now be successfully deployed and working with your portfolio website!