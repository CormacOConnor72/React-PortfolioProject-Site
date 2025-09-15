# Lambda Functions for Portfolio Website

This directory contains AWS Lambda functions that power the interactive wheel feature and data management for your portfolio website.

## 📁 Files Overview

### **Lambda Functions**
- `recordSpin.js` - Records wheel spin events to DynamoDB
- `getSpinHistory.js` - Retrieves paginated spin history
- `getGlobalMetrics.js` - Calculates usage statistics and analytics
- `clearSpinHistory.js` - Clears all spin data (admin function)

### **Deployment Scripts**
- `deploy.sh` - **Main deployment script** with comprehensive error handling
- `quick-deploy.sh` - **Fast deployment** with minimal output
- `verify-deployment.sh` - **Test all functions** after deployment

### **Documentation**
- `DEPLOYMENT_GUIDE.md` - **Main deployment guide** with multiple options
- `MANUAL_DEPLOYMENT_GUIDE.md` - **Step-by-step manual** deployment via AWS Console
- `README.md` - This overview file

### **Configuration**
- `package.json` - Node.js dependencies for all functions

## 🚀 Quick Start

### For First-Time Setup or Troubleshooting:
```bash
cd lambda-functions
./deploy.sh deploy          # Deploy with full error checking
./verify-deployment.sh      # Comprehensive testing
```

### For Quick Updates:
```bash
cd lambda-functions
./quick-deploy.sh           # Fast deployment
```

### For Manual Control:
```bash
cd lambda-functions
./deploy.sh                 # Package only
# Then follow MANUAL_DEPLOYMENT_GUIDE.md
```

## 🔧 Prerequisites

- AWS CLI configured (`aws configure`)
- Lambda functions created in AWS account
- DynamoDB table `SpinHistory` exists
- API Gateway configured with proper routes

## 📊 Function Details

| Function | Purpose | API Endpoint |
|----------|---------|--------------|
| recordSpin | Records wheel spins | POST `/prod/spins` |
| getSpinHistory | Gets spin history | GET `/prod/spins` |
| getGlobalMetrics | Usage analytics | GET `/prod/metrics` |
| clearSpinHistory | Clears all data | DELETE `/prod/spins` |

## 🧪 Testing

After deployment, test your functions:

```bash
# Automated testing (recommended)
./verify-deployment.sh

# Manual API testing
curl https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/metrics
```

## 🔍 Troubleshooting

1. **Function deployment fails**:
   - Check function names match your AWS Lambda functions
   - Verify AWS CLI permissions
   - Check CloudWatch logs for detailed errors

2. **API returns errors**:
   - Run `./verify-deployment.sh` for detailed diagnostics
   - Check DynamoDB table permissions
   - Verify API Gateway CORS settings

3. **Website wheel not working**:
   - Test API endpoints directly first
   - Check browser console for CORS errors
   - Verify website is using correct API URLs

## 📁 Generated Files

After running deployment scripts, you'll see:
- `*.zip` - Deployment packages
- `backups/` - Function backups (when using `deploy.sh`)
- `temp_*` - Temporary directories (automatically cleaned)

## 🛡️ Security Notes

- Functions include CORS headers for web access
- `clearSpinHistory` should be protected in production
- Monitor CloudWatch logs for security issues
- Consider restricting CORS to your domain only

## 📈 Monitoring

Monitor your functions via:
- CloudWatch Logs: `/aws/lambda/[function-name]`
- CloudWatch Metrics: Lambda duration, errors, invocations
- DynamoDB Metrics: Read/write capacity, throttling

Your Lambda functions are ready for production! 🎉