# Lambda Functions

AWS Lambda functions for the portfolio website's interactive wheel feature.

## Quick Start

```bash
# Deploy functions
./deploy.sh deploy

# Verify deployment
./verify-deployment.sh

# Quick deployment
./quick-deploy.sh
```

## Files

- `*.js` - Lambda function source code
- `package.json` - Dependencies
- `deploy.sh` - Main deployment script
- `quick-deploy.sh` - Fast deployment script
- `verify-deployment.sh` - Post-deployment testing

## Documentation

See the `guides/` directory for detailed documentation:

- [📖 **DEPLOYMENT_GUIDE.md**](./guides/DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [📋 **MANUAL_DEPLOYMENT_GUIDE.md**](./guides/MANUAL_DEPLOYMENT_GUIDE.md) - Step-by-step manual deployment
- [📚 **README.md**](./guides/README.md) - Comprehensive overview

## Functions

| Function | Purpose | Endpoint |
|----------|---------|----------|
| `recordSpin.js` | Records wheel spins | POST `/prod/spins` |
| `getSpinHistory.js` | Gets spin history | GET `/prod/spins` |
| `getGlobalMetrics.js` | Usage analytics | GET `/prod/metrics` |
| `clearSpinHistory.js` | Clears all data | DELETE `/prod/spins` |

## Testing

```bash
# Test API endpoint
curl https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod/metrics
```