# Infrastructure as Code (IAC) Implementation Guide
## React Portfolio Site on AWS

### Overview
This guide provides comprehensive Infrastructure as Code (IAC) solutions for deploying your React portfolio site on AWS. Based on analysis of your current setup, this guide offers three primary approaches: AWS CDK (TypeScript), CloudFormation, and Terraform.

**Current Setup Analysis:**
- React 18.2.0 application built with Vite
- Static site generation producing ~367KB of assets
- GitHub Actions deployment to S3 bucket
- No CloudFront distribution currently configured
- Manual secret management for AWS credentials

---

## 1. AWS CDK Implementation (Recommended)

**What is AWS CDK?**  
AWS Cloud Development Kit (CDK) is a framework that allows you to define cloud infrastructure using familiar programming languages like TypeScript. It provides high-level constructs that encapsulate AWS best practices and automatically generates CloudFormation templates.

**Why CDK for this project?**  
- Type safety and IDE support with TypeScript
- Reusable constructs and logical abstractions
- Easy testing and validation
- Familiar programming patterns
- Automatic resource dependency management

### Architecture Overview
This CDK implementation creates a modern, scalable static website hosting solution:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │───▶│    S3 Bucket     │    │   Route 53      │
│   Distribution  │    │  (Website Host)  │    │  (DNS Domain)   │
│   (Global CDN)  │    │   (Private)      │    │   (Optional)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  SSL/TLS Cert   │    │    S3 Bucket     │    │   CloudWatch    │
│  (ACM)          │    │   (Access Logs)  │    │   (Monitoring)  │
│  (Free)         │    │   (90d retention)│    │   (Dashboards)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**Key Components:**
- **S3 Bucket**: Hosts your React build files (private, accessed via CloudFront only)
- **CloudFront**: Global CDN for fast content delivery and HTTPS termination
- **Route53**: DNS management (optional, only if you have a custom domain)
- **ACM Certificate**: Free SSL/TLS certificate for HTTPS
- **IAM Role**: Secure GitHub Actions deployment without storing AWS keys
- **CloudWatch**: Monitoring, logging, and alerting

### CDK Project Structure

**File Organization:** This structure follows CDK best practices with separation of concerns:

```
infrastructure/                 # Root CDK project directory
├── cdk.json                   # CDK configuration and feature flags  
├── package.json               # Node.js dependencies and scripts
├── tsconfig.json             # TypeScript compiler configuration
├── bin/                      # CDK app entry point
│   └── portfolio-infrastructure.ts  # Main app file that instantiates stacks
├── lib/                      # Infrastructure code (the actual CDK constructs)
│   ├── portfolio-infrastructure-stack.ts  # Main stack definition
│   ├── constructs/           # Reusable custom constructs (optional)
│   │   ├── static-website.ts # Custom construct for static site hosting
│   │   ├── cdn.ts           # CloudFront-specific logic
│   │   └── monitoring.ts    # CloudWatch dashboards and alarms
└── test/                    # Unit tests for your infrastructure
    └── portfolio-infrastructure.test.ts
```

**Why this structure?**
- `bin/` contains the app entry point - defines which stacks to deploy
- `lib/` contains the actual infrastructure definitions
- `constructs/` allows you to create reusable components
- `test/` enables infrastructure testing to catch issues early
```
infrastructure/
├── cdk.json
├── package.json
├── tsconfig.json
├── bin/
│   └── portfolio-infrastructure.ts
├── lib/
│   ├── portfolio-infrastructure-stack.ts
│   ├── constructs/
│   │   ├── static-website.ts
│   │   ├── cdn.ts
│   │   └── monitoring.ts
└── test/
    └── portfolio-infrastructure.test.ts
```

### Implementation Files

### Implementation Files

#### `infrastructure/package.json` - Project Dependencies and Scripts

**Purpose:** Defines the CDK project dependencies, scripts, and metadata. This is like package.json for any Node.js project but specifically configured for AWS CDK.

**Key Dependencies Explained:**
- `aws-cdk-lib`: The main CDK library containing all AWS service constructs
- `constructs`: Base classes for all CDK constructs
- `aws-cdk`: The CLI tool for deploying and managing CDK apps
- `typescript`: Enables type safety and modern JavaScript features

```json
{
  "name": "portfolio-infrastructure",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy --require-approval never",
    "diff": "cdk diff",
    "synth": "cdk synth",
    "destroy": "cdk destroy"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.4.0",
    "ts-jest": "^29.0.5",
    "aws-cdk": "2.170.0",
    "typescript": "~4.9.4"
  },
  "dependencies": {
    "aws-cdk-lib": "2.170.0",
    "constructs": "^10.0.0"
  }
}
```

#### `infrastructure/bin/portfolio-infrastructure.ts` - CDK App Entry Point

**Purpose:** This is the main entry point for your CDK application. It's like the `main()` function - it creates the CDK app and instantiates your stacks.

**What this file does:**
1. Creates a new CDK App instance
2. Sets up the AWS environment (account and region)
3. Instantiates your infrastructure stack
4. Applies consistent tags to all resources
5. Synthesizes the CloudFormation template

**Key Concepts:**
- `env`: Specifies which AWS account/region to deploy to
- `stackName`: The CloudFormation stack name that will appear in AWS Console
- `tags`: Applied to all resources for billing, organization, and governance
- `app.synth()`: Generates the CloudFormation templates

```typescript
#!/usr/bin/env node
import 'source-map-support/register';  // Better error stack traces
import * as cdk from 'aws-cdk-lib';
import { PortfolioInfrastructureStack } from '../lib/portfolio-infrastructure-stack';

// Create the CDK application
const app = new cdk.App();

// Environment configuration - uses CDK CLI defaults or environment variables
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,  // Your AWS account ID
  region: process.env.CDK_DEFAULT_REGION,    // AWS region (e.g., us-east-1)
};

// Create the infrastructure stack with configuration
new PortfolioInfrastructureStack(app, 'PortfolioInfrastructureStack', {
  env,
  stackName: 'portfolio-site-infrastructure',  // Name in CloudFormation console
  tags: {
    Project: 'PortfolioSite',      // For cost tracking and organization
    Environment: 'production',      // Distinguishes prod/staging/dev
    Owner: 'CormacOConnor'         // Resource ownership
  }
});

// Generate CloudFormation templates
app.synth();
```

#### `infrastructure/lib/portfolio-infrastructure-stack.ts` - Main Infrastructure Definition

**Purpose:** This is the heart of your infrastructure - it defines all AWS resources needed to host your React portfolio site. Think of it as a blueprint that describes your entire cloud architecture.

**What this stack creates:**
1. **S3 Buckets**: One for hosting, one for access logs
2. **CloudFront Distribution**: Global CDN with caching rules
3. **SSL Certificate**: Free HTTPS certificate via ACM
4. **DNS Records**: Route53 records (if domain provided)
5. **IAM Role**: Secure access for GitHub Actions
6. **Monitoring**: CloudWatch dashboards and alarms

**Security Features:**
- S3 bucket is private (no public access)
- CloudFront uses Origin Access Control (OAC) for secure S3 access
- IAM role uses least-privilege permissions
- All data encrypted at rest and in transit

```typescript
import * as cdk from 'aws-cdk-lib';                    // Core CDK constructs
import * as s3 from 'aws-cdk-lib/aws-s3';             // S3 bucket constructs
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';  // S3 deployment utilities
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';   // CloudFront CDN constructs
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'; // CloudFront origins
import * as acm from 'aws-cdk-lib/aws-certificatemanager';     // SSL certificates
import * as route53 from 'aws-cdk-lib/aws-route53';           // DNS management
import * as targets from 'aws-cdk-lib/aws-route53-targets';    // Route53 targets
import * as iam from 'aws-cdk-lib/aws-iam';                   // IAM roles and policies
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';     // Monitoring and alerting
import { Construct } from 'constructs';                       // Base construct class

export interface PortfolioInfrastructureStackProps extends cdk.StackProps {
  domainName?: string;
  enableMonitoring?: boolean;
}

export class PortfolioInfrastructureStack extends cdk.Stack {
  public readonly websiteBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly deploymentRole: iam.Role;

  constructor(scope: Construct, id: string, props?: PortfolioInfrastructureStackProps) {
    super(scope, id, props);

    // Configuration
    const domainName = props?.domainName;
    const enableMonitoring = props?.enableMonitoring ?? true;

    // S3 Bucket for website hosting
    this.websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `portfolio-site-${this.account}-${this.region}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // SPA routing
      publicReadAccess: false, // CloudFront will handle access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Be careful in production
      autoDeleteObjects: true, // Be careful in production
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // S3 Bucket for access logs
    const logsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `portfolio-site-logs-${this.account}-${this.region}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [{
        id: 'DeleteOldLogs',
        enabled: true,
        expiration: cdk.Duration.days(90)
      }]
    });

    // Origin Access Control for CloudFront
    const originAccessControl = new cloudfront.S3OriginAccessControl(this, 'OriginAccessControl', {
      description: 'OAC for Portfolio Site'
    });

    // SSL Certificate (if domain provided)
    let certificate: acm.Certificate | undefined;
    if (domainName) {
      certificate = new acm.Certificate(this, 'SslCertificate', {
        domainName: domainName,
        subjectAlternativeNames: [`www.${domainName}`],
        validation: acm.CertificateValidation.fromDns(),
      });
    }

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.websiteBucket, {
          originAccessControl
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
      },
      additionalBehaviors: {
        '/assets/*': {
          origin: origins.S3BucketOrigin.withOriginAccessControl(this.websiteBucket, {
            originAccessControl
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
          compress: true,
        }
      },
      domainNames: domainName ? [domainName, `www.${domainName}`] : undefined,
      certificate: certificate,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(30),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(30),
        }
      ],
      logBucket: logsBucket,
      logFilePrefix: 'cloudfront-logs/',
      enableLogging: true,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe
    });

    // Grant CloudFront access to S3 bucket
    this.websiteBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      actions: ['s3:GetObject'],
      resources: [`${this.websiteBucket.bucketArn}/*`],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${this.distribution.distributionId}`
        }
      }
    }));

    // Route53 DNS (if domain provided)
    if (domainName) {
      // Assuming hosted zone exists
      const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
        domainName: domainName
      });

      // A record for apex domain
      new route53.ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        recordName: domainName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution))
      });

      // A record for www subdomain
      new route53.ARecord(this, 'WwwAliasRecord', {
        zone: hostedZone,
        recordName: `www.${domainName}`,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution))
      });
    }

    // IAM Role for GitHub Actions deployment
    this.deploymentRole = new iam.Role(this, 'GitHubActionsRole', {
      roleName: 'PortfolioSiteDeploymentRole',
      assumedBy: new iam.FederatedPrincipal(
        `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`,
        {
          StringLike: {
            'token.actions.githubusercontent.com:sub': 'repo:YourGitHubUsername/React PortfolioProject Site:*'
          },
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com'
          }
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess') // Adjust as needed
      ],
      inlinePolicies: {
        S3DeploymentPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket'
              ],
              resources: [
                this.websiteBucket.bucketArn,
                `${this.websiteBucket.bucketArn}/*`
              ]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudfront:CreateInvalidation',
                'cloudfront:GetInvalidation',
                'cloudfront:ListInvalidations'
              ],
              resources: [`arn:aws:cloudfront::${this.account}:distribution/${this.distribution.distributionId}`]
            })
          ]
        })
      }
    });

    // CloudWatch Dashboard (if monitoring enabled)
    if (enableMonitoring) {
      const dashboard = new cloudwatch.Dashboard(this, 'PortfolioDashboard', {
        dashboardName: 'PortfolioSite-Monitoring'
      });

      // CloudFront metrics
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'CloudFront Requests',
          left: [new cloudwatch.Metric({
            namespace: 'AWS/CloudFront',
            metricName: 'Requests',
            dimensionsMap: {
              DistributionId: this.distribution.distributionId
            },
            statistic: 'Sum'
          })],
          width: 12
        }),
        new cloudwatch.GraphWidget({
          title: 'CloudFront Cache Hit Rate',
          left: [new cloudwatch.Metric({
            namespace: 'AWS/CloudFront',
            metricName: 'CacheHitRate',
            dimensionsMap: {
              DistributionId: this.distribution.distributionId
            },
            statistic: 'Average'
          })],
          width: 12
        })
      );

      // Alarms
      new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CloudFront',
          metricName: '4xxErrorRate',
          dimensionsMap: {
            DistributionId: this.distribution.distributionId
          },
          statistic: 'Average'
        }),
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: this.websiteBucket.bucketName,
      description: 'S3 Bucket for website hosting'
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID'
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name'
    });

    new cdk.CfnOutput(this, 'DeploymentRoleArn', {
      value: this.deploymentRole.roleArn,
      description: 'IAM Role ARN for GitHub Actions'
    });

    if (domainName) {
      new cdk.CfnOutput(this, 'WebsiteUrl', {
        value: `https://${domainName}`,
        description: 'Portfolio Website URL'
      });
    }
  }
}
```

#### `infrastructure/cdk.json`
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/portfolio-infrastructure.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib@2.170.0",
    "@aws-cdk-core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true
  }
}
```

### CDK Deployment Commands
```bash
# Initialize CDK project
cd infrastructure
npm install
npx cdk bootstrap

# Deploy with domain
npx cdk deploy --parameters domainName=yourdomain.com

# Deploy without domain
npx cdk deploy

# Clean up
npx cdk destroy
```

---

## 2. CloudFormation Implementation

**What is CloudFormation?**  
AWS CloudFormation is AWS's native Infrastructure as Code service that uses JSON or YAML templates to define and provision AWS resources. It's declarative - you describe what you want, and CloudFormation figures out how to create it.

**Why CloudFormation for this project?**
- Native AWS service with deep integration
- No additional tools or dependencies required
- Automatic rollback on failures
- Stack-based resource management
- Built-in drift detection
- Free to use (you only pay for the resources it creates)

**Key CloudFormation Concepts:**
- **Template**: YAML/JSON file defining your infrastructure
- **Stack**: A deployed instance of a template
- **Parameters**: Input values to customize deployments
- **Conditions**: Logical operators for conditional resource creation
- **Outputs**: Values exported from the stack for use elsewhere

### CloudFormation Template: `cloudformation/portfolio-infrastructure.yaml`

**Purpose:** This template creates the complete infrastructure for hosting your React portfolio site. It's a declarative blueprint that CloudFormation uses to create, update, and delete resources as a single unit.

**Template Structure Explained:**
- **AWSTemplateFormatVersion**: Specifies the CloudFormation template format version
- **Description**: Human-readable description of what this template does
- **Parameters**: Configurable inputs (domain name, GitHub repo, environment)
- **Conditions**: Logic for optional resources (like custom domain setup)
- **Resources**: The actual AWS services to be created
- **Outputs**: Important values to be returned after deployment

```yaml
AWSTemplateFormatVersion: '2010-09-09'  # CloudFormation template version
Description: 'Static React Portfolio Site Infrastructure - Complete hosting solution with CDN, SSL, and CI/CD integration'

# Input parameters allow customization without modifying the template
Parameters:
  DomainName:
    Type: String
    Description: 'Custom domain name (e.g., mysite.com). Leave empty to use CloudFront domain'
    Default: ''
    # If empty, the site will be accessible via CloudFront's generated domain
  
  GitHubRepo:
    Type: String
    Description: 'GitHub repository in format username/repo-name for CI/CD permissions'
    Default: 'YourUsername/React PortfolioProject Site'
    # Used to configure OIDC trust relationship for secure deployments
  
  Environment:
    Type: String
    Description: 'Environment name for resource naming and configuration'
    Default: 'production'
    AllowedValues:  # Restricts input to valid environment names
      - production  # Full monitoring and production-grade settings
      - staging     # Testing environment with reduced monitoring
      - development # Development environment with minimal monitoring

# Conditions enable conditional resource creation based on parameters
Conditions:
  HasDomainName: !Not [!Equals [!Ref DomainName, '']]  # True if custom domain provided
  IsProduction: !Equals [!Ref Environment, 'production']  # True for production environment
  # These conditions control whether to create SSL certificates, DNS records, and monitoring

Resources:
  # ===== S3 BUCKET FOR WEBSITE HOSTING =====
  # This bucket stores your React app build files (HTML, CSS, JS, assets)
  WebsiteBucket:
    Type: AWS::S3::Bucket
    Properties:
      # Unique bucket name using account ID and region to avoid conflicts
      BucketName: !Sub 'portfolio-site-${AWS::AccountId}-${AWS::Region}'
      
      # Website configuration for SPA routing
      WebsiteConfiguration:
        IndexDocument: index.html    # Default document served
        ErrorDocument: index.html    # SPA routing - all 404s serve index.html
      
      # Security: Block ALL public access (CloudFront will access via OAC)
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true          # Block public ACLs
        BlockPublicPolicy: true        # Block public bucket policies
        IgnorePublicAcls: true         # Ignore existing public ACLs
        RestrictPublicBuckets: true    # Restrict public bucket policies
      
      # Encryption: All objects encrypted at rest
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256     # AWS-managed encryption (free)
      
      # Lifecycle: Clean up incomplete uploads to save costs
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 1   # Delete after 1 day
      
      # Tags for organization and cost tracking
      Tags:
        - Key: Project
          Value: PortfolioSite
        - Key: Environment
          Value: !Ref Environment       # production/staging/development

  # ===== S3 BUCKET FOR ACCESS LOGS =====
  # Separate bucket to store CloudFront access logs for analytics and debugging
  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'portfolio-site-logs-${AWS::AccountId}-${AWS::Region}'
      
      # Security: Block public access to log files
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      
      # Cost optimization: Automatically delete old logs
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90        # Keep logs for 90 days then delete
      
      Tags:
        - Key: Project
          Value: PortfolioSite
        - Key: Environment
          Value: !Ref Environment

  # ===== ORIGIN ACCESS CONTROL (OAC) =====
  # Secure mechanism for CloudFront to access private S3 bucket
  # Replaces the deprecated Origin Access Identity (OAI)
  OriginAccessControl:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub '${AWS::StackName}-OAC'     # Descriptive name
        OriginAccessControlOriginType: s3       # For S3 origins
        SigningBehavior: always                 # Always sign requests
        SigningProtocol: sigv4                  # Use AWS Signature Version 4
        Description: 'Secure access from CloudFront to S3 bucket'

  # ===== SSL/TLS CERTIFICATE (OPTIONAL) =====
  # Free SSL certificate from AWS Certificate Manager
  # Only created if a custom domain name is provided
  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Condition: HasDomainName                    # Only create if domain provided
    Properties:
      DomainName: !Ref DomainName              # Primary domain (e.g., example.com)
      SubjectAlternativeNames:                 # Additional domains covered
        - !Sub 'www.${DomainName}'             # www subdomain (e.g., www.example.com)
      ValidationMethod: DNS                     # Validate via DNS records (automatic)
      # Note: Certificate must be in us-east-1 region for CloudFront
      Tags:
        - Key: Project
          Value: PortfolioSite
        - Key: Environment
          Value: !Ref Environment

  # CloudFront Distribution
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Aliases: !If
          - HasDomainName
          - - !Ref DomainName
            - !Sub 'www.${DomainName}'
          - !Ref AWS::NoValue
        Comment: !Sub 'Portfolio Site Distribution - ${Environment}'
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad # CachingOptimized
          OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf # CORS-S3Origin
          ResponseHeadersPolicyId: 5cc3b908-e619-4b99-88e5-2cf7f45965bd # SecurityHeaders
          Compress: true
        CacheBehaviors:
          - PathPattern: '/assets/*'
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: redirect-to-https
            CachePolicyId: b2884449-e4de-46a7-ac36-70bc7f1ddd6d # CachingOptimizedForUncompressedObjects
            Compress: true
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: '/index.html'
            ErrorCachingMinTTL: 1800
          - ErrorCode: 403
            ResponseCode: 200
            ResponsePagePath: '/index.html'
            ErrorCachingMinTTL: 1800
        DefaultRootObject: index.html
        Enabled: true
        HttpVersion: http2and3
        IPV6Enabled: true
        Logging:
          Bucket: !GetAtt LogsBucket.RegionalDomainName
          IncludeCookies: false
          Prefix: 'cloudfront-logs/'
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt WebsiteBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: ''
            OriginAccessControlId: !Ref OriginAccessControl
        PriceClass: PriceClass_100
        ViewerCertificate: !If
          - HasDomainName
          - AcmCertificateArn: !Ref SSLCertificate
            SslSupportMethod: sni-only
            MinimumProtocolVersion: TLSv1.2_2021
          - CloudFrontDefaultCertificate: true
      Tags:
        - Key: Project
          Value: PortfolioSite
        - Key: Environment
          Value: !Ref Environment

  # S3 Bucket Policy for CloudFront
  WebsiteBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref WebsiteBucket
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: 's3:GetObject'
            Resource: !Sub '${WebsiteBucket}/*'
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}'

  # OIDC Provider for GitHub Actions
  GitHubOIDCProvider:
    Type: AWS::IAM::OIDCIdentityProvider
    Properties:
      Url: https://token.actions.githubusercontent.com
      ClientIdList:
        - sts.amazonaws.com
      ThumbprintList:
        - 6938fd4d98bab03faadb97b34396831e3780aea1

  # IAM Role for GitHub Actions
  GitHubActionsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: PortfolioSiteDeploymentRole
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Federated: !Ref GitHubOIDCProvider
            Action: sts:AssumeRoleWithWebIdentity
            Condition:
              StringLike:
                'token.actions.githubusercontent.com:sub': !Sub 'repo:${GitHubRepo}:*'
              StringEquals:
                'token.actions.githubusercontent.com:aud': sts.amazonaws.com
      Policies:
        - PolicyName: S3DeploymentPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt WebsiteBucket.Arn
                  - !Sub '${WebsiteBucket}/*'
              - Effect: Allow
                Action:
                  - 'cloudfront:CreateInvalidation'
                  - 'cloudfront:GetInvalidation'
                  - 'cloudfront:ListInvalidations'
                Resource: !Sub 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}'
      Tags:
        - Key: Project
          Value: PortfolioSite
        - Key: Environment
          Value: !Ref Environment

  # Route53 Records (conditional)
  DNSRecord:
    Type: AWS::Route53::RecordSet
    Condition: HasDomainName
    Properties:
      HostedZoneName: !Sub '${DomainName}.'
      Name: !Ref DomainName
      Type: A
      AliasTarget:
        DNSName: !GetAtt CloudFrontDistribution.DomainName
        HostedZoneId: Z2FDTNDATAQYW2 # CloudFront hosted zone ID

  WWWDNSRecord:
    Type: AWS::Route53::RecordSet
    Condition: HasDomainName
    Properties:
      HostedZoneName: !Sub '${DomainName}.'
      Name: !Sub 'www.${DomainName}'
      Type: A
      AliasTarget:
        DNSName: !GetAtt CloudFrontDistribution.DomainName
        HostedZoneId: Z2FDTNDATAQYW2

  # CloudWatch Dashboard
  PortfolioDashboard:
    Type: AWS::CloudWatch::Dashboard
    Condition: IsProduction
    Properties:
      DashboardName: PortfolioSite-Monitoring
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/CloudFront", "Requests", "DistributionId", "${CloudFrontDistribution}" ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "CloudFront Requests"
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/CloudFront", "CacheHitRate", "DistributionId", "${CloudFrontDistribution}" ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "us-east-1",
                "title": "Cache Hit Rate"
              }
            }
          ]
        }

  # CloudWatch Alarms
  HighErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: IsProduction
    Properties:
      AlarmName: !Sub 'PortfolioSite-HighErrorRate-${Environment}'
      AlarmDescription: 'High 4xx error rate detected'
      MetricName: 4xxErrorRate
      Namespace: AWS/CloudFront
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DistributionId
          Value: !Ref CloudFrontDistribution
      TreatMissingData: notBreaching

Outputs:
  WebsiteBucketName:
    Description: 'S3 Bucket for website hosting'
    Value: !Ref WebsiteBucket
    Export:
      Name: !Sub '${AWS::StackName}-WebsiteBucket'

  DistributionId:
    Description: 'CloudFront Distribution ID'
    Value: !Ref CloudFrontDistribution
    Export:
      Name: !Sub '${AWS::StackName}-DistributionId'

  DistributionDomainName:
    Description: 'CloudFront Distribution Domain Name'
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-DistributionDomainName'

  DeploymentRoleArn:
    Description: 'IAM Role ARN for GitHub Actions'
    Value: !GetAtt GitHubActionsRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DeploymentRoleArn'

  WebsiteUrl:
    Condition: HasDomainName
    Description: 'Portfolio Website URL'
    Value: !Sub 'https://${DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-WebsiteUrl'

  CloudFrontUrl:
    Description: 'CloudFront Distribution URL'
    Value: !Sub 'https://${CloudFrontDistribution.DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontUrl'
```

### CloudFormation Deployment Scripts

#### `scripts/deploy-cloudformation.sh`
```bash
#!/bin/bash
set -e

# Configuration
STACK_NAME="portfolio-site-infrastructure"
TEMPLATE_FILE="cloudformation/portfolio-infrastructure.yaml"
REGION="us-east-1"

# Parameters
DOMAIN_NAME="${DOMAIN_NAME:-}"
GITHUB_REPO="${GITHUB_REPO:-YourUsername/React PortfolioProject Site}"
ENVIRONMENT="${ENVIRONMENT:-production}"

echo "Deploying CloudFormation stack..."
echo "Stack Name: $STACK_NAME"
echo "Region: $REGION"
echo "Domain: $DOMAIN_NAME"
echo "GitHub Repo: $GITHUB_REPO"
echo "Environment: $ENVIRONMENT"

# Build parameter list
PARAMETERS="ParameterKey=GitHubRepo,ParameterValue=$GITHUB_REPO"
PARAMETERS="$PARAMETERS ParameterKey=Environment,ParameterValue=$ENVIRONMENT"

if [ -n "$DOMAIN_NAME" ]; then
    PARAMETERS="$PARAMETERS ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME"
fi

# Deploy stack
aws cloudformation deploy \
    --template-file "$TEMPLATE_FILE" \
    --stack-name "$STACK_NAME" \
    --parameter-overrides $PARAMETERS \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION" \
    --tags \
        Project=PortfolioSite \
        Environment="$ENVIRONMENT" \
        ManagedBy=CloudFormation

echo "Deployment completed!"

# Get outputs
echo ""
echo "Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table
```

---

## 3. Terraform Implementation

**What is Terraform?**  
Terraform is an open-source Infrastructure as Code tool by HashiCorp that allows you to define and provision cloud infrastructure using declarative configuration files. It uses HashiCorp Configuration Language (HCL) and supports multiple cloud providers.

**Why Terraform for this project?**
- Industry standard for Infrastructure as Code
- Multi-cloud support (not locked to AWS)
- Rich ecosystem and community
- Powerful state management
- Plan/apply workflow shows changes before execution
- Module system for reusable components
- Extensive provider ecosystem

**Key Terraform Concepts:**
- **Resources**: Individual infrastructure components (S3 bucket, CloudFront distribution)
- **Providers**: Plugins that interact with cloud APIs (AWS, Azure, GCP)
- **State**: Terraform's record of your infrastructure
- **Modules**: Reusable collections of resources
- **Variables**: Input parameters for configuration
- **Outputs**: Values exported from Terraform configurations

### Terraform Project Structure

**File Organization:** This structure follows Terraform best practices with clear separation of concerns and environment-specific configurations:

```
terraform/                          # Root Terraform project directory
├── main.tf                         # Primary resource definitions
├── variables.tf                    # Input variable declarations
├── outputs.tf                      # Output value definitions
├── providers.tf                    # Provider configurations and versions
├── modules/                        # Reusable Terraform modules (optional)
│   ├── s3-website/                # S3 static website hosting module
│   │   ├── main.tf                # S3 bucket and website configuration
│   │   ├── variables.tf           # Module input variables
│   │   └── outputs.tf             # Module output values
│   ├── cloudfront/                # CloudFront CDN module
│   │   ├── main.tf                # Distribution and caching rules
│   │   ├── variables.tf           # CloudFront-specific variables
│   │   └── outputs.tf             # Distribution ID, domain name, etc.
│   └── route53/                   # DNS management module
│       ├── main.tf                # DNS records and hosted zone
│       ├── variables.tf           # Domain and DNS variables
│       └── outputs.tf             # DNS-related outputs
├── environments/                   # Environment-specific configurations
│   ├── production/                # Production environment
│   │   ├── terraform.tfvars       # Production variable values
│   │   └── backend.tf             # Production state backend config
│   └── staging/                   # Staging environment
│       ├── terraform.tfvars       # Staging variable values
│       └── backend.tf             # Staging state backend config
└── scripts/                       # Deployment automation scripts
    ├── deploy.sh                  # Automated deployment script
    └── destroy.sh                 # Automated destruction script
```

**Why this structure?**
- **Root files**: Core infrastructure definition and configuration
- **modules/**: Reusable components that can be shared across projects
- **environments/**: Separate configurations for different deployment environments
- **scripts/**: Automation for common operations
- **State isolation**: Each environment has its own state file for safety

### Implementation Files

#### `terraform/providers.tf` - Provider Configuration and Versions

**Purpose:** This file configures which cloud providers Terraform will use and their versions. It's like the "imports" section of a programming language - it tells Terraform which APIs it can use.

**Key Components:**
- **required_version**: Minimum Terraform version needed
- **required_providers**: Cloud provider plugins and their versions
- **provider blocks**: Configuration for each provider
- **default_tags**: Tags applied to all resources automatically

**Provider Versioning:** Using `~> 5.0` means "use version 5.x but not 6.0" - this allows minor updates while preventing breaking changes.

```hcl
terraform {
  required_version = ">= 1.0"              # Minimum Terraform CLI version
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"             # Official AWS provider
      version = "~> 5.0"                    # Use AWS provider version 5.x
    }
    random = {
      source  = "hashicorp/random"          # For generating unique names
      version = "~> 3.1"                    # Random resource provider
    }
  }
}

# ===== AWS PROVIDER CONFIGURATION =====
# Main AWS provider for resources in the specified region
provider "aws" {
  region = var.aws_region                   # Deploy resources in this region

  # Default tags applied to ALL resources created by this provider
  default_tags {
    tags = {
      Project     = "PortfolioSite"         # For cost tracking and organization
      Environment = var.environment         # production/staging/development
      ManagedBy   = "Terraform"            # Identifies infrastructure tool used
      Owner       = "CormacOConnor"         # Resource ownership
    }
  }
}

# ===== SECONDARY AWS PROVIDER FOR US-EAST-1 =====
# CloudFront requires SSL certificates to be in us-east-1 region
# This provider ensures ACM certificates are created in the correct region
provider "aws" {
  alias  = "us-east-1"                     # Named alias for this provider
  region = "us-east-1"                     # Fixed region for CloudFront compatibility
  # Note: ACM certificates for CloudFront must be in us-east-1 regardless of
  # where other resources are deployed
}
```

#### `terraform/variables.tf` - Input Variable Definitions

**Purpose:** This file defines all the configurable inputs for your Terraform configuration. Variables make your infrastructure reusable across different environments and customizable for different use cases.

**Variable Types:**
- **string**: Text values (domain names, regions)
- **number**: Numeric values (retention days, counts)
- **bool**: True/false values (enable/disable features)
- **list**: Arrays of values
- **validation blocks**: Ensure input values meet requirements

**How variables work:**
1. Define the variable in `variables.tf`
2. Set values in `terraform.tfvars` or pass via CLI
3. Reference in resources using `var.variable_name`

```hcl
# ===== CORE AWS CONFIGURATION =====
variable "aws_region" {
  description = "AWS region where resources will be deployed"
  type        = string
  default     = "us-east-1"                 # Default to US East (cheapest for CloudFront)
}

variable "environment" {
  description = "Environment name for resource naming and configuration"
  type        = string
  default     = "production"
  
  # Validation ensures only valid environment names are accepted
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development."
  }
  # This prevents typos and ensures consistent environment naming
}

# ===== WEBSITE CONFIGURATION =====
variable "domain_name" {
  description = "Custom domain name for the website (optional). Leave empty to use CloudFront domain"
  type        = string
  default     = ""                          # Empty means no custom domain
  # If provided, creates SSL certificate and DNS records
  # If empty, site accessible via CloudFront's auto-generated domain
}

# ===== CI/CD CONFIGURATION =====
variable "github_repo" {
  description = "GitHub repository in format username/repo-name for OIDC integration"
  type        = string
  default     = "YourUsername/React PortfolioProject Site"
  # Used to configure IAM role trust policy for secure GitHub Actions deployment
}

variable "enable_monitoring" {
  description = "Enable CloudWatch monitoring and dashboards"
  type        = bool
  default     = true
}

variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
  
  validation {
    condition = contains([
      "PriceClass_All",
      "PriceClass_200",
      "PriceClass_100"
    ], var.cloudfront_price_class)
    error_message = "CloudFront price class must be one of: PriceClass_All, PriceClass_200, PriceClass_100."
  }
}

variable "log_retention_days" {
  description = "Number of days to retain CloudFront access logs"
  type        = number
  default     = 90
}

# ===== LOCAL VALUES =====
# Computed values used throughout the configuration
locals {
  # Unique bucket names using random suffix to avoid global conflicts
  bucket_name      = "portfolio-site-${random_id.bucket_suffix.hex}"
  logs_bucket_name = "portfolio-site-logs-${random_id.bucket_suffix.hex}"
  
  # Boolean flag for conditional resource creation
  has_domain       = var.domain_name != ""        # True if custom domain provided
  
  # Common tags applied to resources that don't use provider default_tags
  common_tags = {
    Project     = "PortfolioSite"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
  # Note: Most resources use provider default_tags, these are for exceptions
}
```

#### `terraform/main.tf` - Main Resource Definitions

**Purpose:** This is the heart of your Terraform configuration where you define all the AWS resources needed for your portfolio site. Each resource block creates one AWS service component.

**Resource Organization:**
1. **Utility resources**: Random IDs, data sources
2. **Storage**: S3 buckets for hosting and logs
3. **Security**: SSL certificates and access controls
4. **CDN**: CloudFront distribution and caching
5. **DNS**: Route53 records (if custom domain)
6. **IAM**: Roles for GitHub Actions
7. **Monitoring**: CloudWatch dashboards and alarms

```hcl
# ===== UTILITY RESOURCES =====
# Generate random suffix to ensure globally unique S3 bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4                           # Creates 8-character hex string
  # S3 bucket names must be globally unique across all AWS accounts
  # This random suffix prevents naming conflicts
}

# ===== S3 WEBSITE HOSTING BUCKET =====
# Primary bucket that stores your React application files
resource "aws_s3_bucket" "website" {
  bucket = local.bucket_name                # Uses local value with random suffix
  # This bucket will contain: index.html, CSS, JS, images, and other assets
}

# Configure the S3 bucket for static website hosting
resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  # Default document served for requests to the root
  index_document {
    suffix = "index.html"                   # Serves index.html for / requests
  }

  # Error document for 404s - enables SPA routing
  error_document {
    key = "index.html"                      # All 404s serve index.html
    # This allows React Router to handle client-side routing
    # Users can bookmark /about and it will load correctly
  }
}

# Security: Block all public access to the website bucket
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  # Comprehensive public access blocking for security
  block_public_acls       = true            # Block public ACL creation
  block_public_policy     = true            # Block public bucket policies
  ignore_public_acls      = true            # Ignore existing public ACLs
  restrict_public_buckets = true            # Restrict public bucket policies
  
  # This ensures the bucket is private - only CloudFront can access it
  # Public access is handled securely through CloudFront distribution
}

resource "aws_s3_bucket_server_side_encryption_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "website" {
  bucket = aws_s3_bucket.website.id
  
  versioning_configuration {
    status = "Disabled"
  }
}

# S3 bucket for access logs
resource "aws_s3_bucket" "logs" {
  bucket = local.logs_bucket_name
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "delete_old_logs"
    status = "Enabled"

    expiration {
      days = var.log_retention_days
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

# ACM Certificate (conditional)
resource "aws_acm_certificate" "website" {
  count = local.has_domain ? 1 : 0
  
  provider          = aws.us-east-1 # CloudFront requires certs in us-east-1
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "www.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# Route53 hosted zone lookup (conditional)
data "aws_route53_zone" "website" {
  count = local.has_domain ? 1 : 0
  
  name         = var.domain_name
  private_zone = false
}

# Certificate validation (conditional)
resource "aws_acm_certificate_validation" "website" {
  count = local.has_domain ? 1 : 0
  
  provider        = aws.us-east-1
  certificate_arn = aws_acm_certificate.website[0].arn
  validation_record_fqdns = [
    for record in aws_route53_record.cert_validation : record.fqdn
  ]

  timeouts {
    create = "5m"
  }
}

# Certificate validation DNS records (conditional)
resource "aws_route53_record" "cert_validation" {
  for_each = local.has_domain ? {
    for dvo in aws_acm_certificate.website[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.website[0].zone_id
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "website" {
  name                              = "${local.bucket_name}-oac"
  description                       = "OAC for ${local.bucket_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "website" {
  depends_on = [aws_s3_bucket.logs]

  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.website.id
    origin_id                = "S3-${aws_s3_bucket.website.id}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Portfolio Site Distribution - ${var.environment}"
  default_root_object = "index.html"

  # Domain configuration (conditional)
  aliases = local.has_domain ? [var.domain_name, "www.${var.domain_name}"] : []

  # Cache behaviors
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.website.id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingOptimized
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" # CORS-S3Origin
    response_headers_policy_id = "5cc3b908-e619-4b99-88e5-2cf7f45965bd" # SecurityHeaders
  }

  ordered_cache_behavior {
    path_pattern           = "/assets/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.website.id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    cache_policy_id = "b2884449-e4de-46a7-ac36-70bc7f1ddd6d" # CachingOptimizedForUncompressedObjects
  }

  # Error pages for SPA routing
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
    error_caching_min_ttl = 1800
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
    error_caching_min_ttl = 1800
  }

  # Geographic restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL certificate configuration
  viewer_certificate {
    cloudfront_default_certificate = !local.has_domain
    acm_certificate_arn            = local.has_domain ? aws_acm_certificate_validation.website[0].certificate_arn : null
    ssl_support_method             = local.has_domain ? "sni-only" : null
    minimum_protocol_version       = local.has_domain ? "TLSv1.2_2021" : null
  }

  # Logging configuration
  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  price_class = var.cloudfront_price_class

  wait_for_deployment = false
}

# S3 bucket policy for CloudFront
resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "cloudfront.amazonaws.com"
      }
      Action   = "s3:GetObject"
      Resource = "${aws_s3_bucket.website.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.website.arn
        }
      }
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.website]
}

# Route53 DNS records (conditional)
resource "aws_route53_record" "website" {
  count = local.has_domain ? 1 : 0

  zone_id = data.aws_route53_zone.website[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  count = local.has_domain ? 1 : 0

  zone_id = data.aws_route53_zone.website[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

# OIDC Provider for GitHub Actions
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com",
  ]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
  ]
}

# IAM role for GitHub Actions
resource "aws_iam_role" "github_actions" {
  name = "PortfolioSiteDeploymentRole"

  assume_role_policy = jsonencode({
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:*"
        }
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}

# IAM policy for S3 deployment
resource "aws_iam_role_policy" "github_actions_s3" {
  name = "S3DeploymentPolicy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.website.arn,
          "${aws_s3_bucket.website.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation",
          "cloudfront:ListInvalidations"
        ]
        Resource = aws_cloudfront_distribution.website.arn
      }
    ]
  })
}

# CloudWatch Dashboard (conditional)
resource "aws_cloudwatch_dashboard" "website" {
  count = var.enable_monitoring ? 1 : 0

  dashboard_name = "PortfolioSite-Monitoring"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.website.id]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "CloudFront Requests"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/CloudFront", "CacheHitRate", "DistributionId", aws_cloudfront_distribution.website.id]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Cache Hit Rate"
        }
      }
    ]
  })
}

# CloudWatch Alarms (conditional)
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  count = var.enable_monitoring ? 1 : 0

  alarm_name          = "PortfolioSite-HighErrorRate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This metric monitors CloudFront 4xx error rate"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.website.id
  }
}
```

#### `terraform/outputs.tf`
```hcl
output "website_bucket_name" {
  description = "Name of the S3 bucket for website hosting"
  value       = aws_s3_bucket.website.id
}

output "website_bucket_arn" {
  description = "ARN of the S3 bucket for website hosting"
  value       = aws_s3_bucket.website.arn
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.website.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.website.arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.website.domain_name
}

output "cloudfront_url" {
  description = "URL of the CloudFront distribution"
  value       = "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "website_url" {
  description = "URL of the website"
  value       = local.has_domain ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "github_actions_role_arn" {
  description = "ARN of the IAM role for GitHub Actions"
  value       = aws_iam_role.github_actions.arn
}

output "logs_bucket_name" {
  description = "Name of the S3 bucket for access logs"
  value       = aws_s3_bucket.logs.id
}

output "certificate_arn" {
  description = "ARN of the SSL certificate"
  value       = local.has_domain ? aws_acm_certificate.website[0].arn : null
}
```

#### `terraform/environments/production/terraform.tfvars`
```hcl
# Production environment configuration
environment = "production"
aws_region  = "us-east-1"

# Domain configuration (uncomment and modify if you have a domain)
# domain_name = "your-domain.com"

# GitHub repository
github_repo = "YourUsername/React PortfolioProject Site"

# Monitoring
enable_monitoring = true

# CloudFront configuration
cloudfront_price_class = "PriceClass_100"

# Log retention
log_retention_days = 90
```

#### `terraform/environments/production/backend.tf`
```hcl
# Terraform backend configuration for production
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "portfolio-site/production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

### Terraform Deployment Scripts

#### `terraform/scripts/deploy.sh`
```bash
#!/bin/bash
set -e

# Configuration
ENVIRONMENT="${1:-production}"
WORKSPACE="$ENVIRONMENT"

echo "Deploying Terraform for environment: $ENVIRONMENT"

cd "$(dirname "$0")/.."

# Initialize Terraform
terraform init -reconfigure

# Create or select workspace
terraform workspace new "$WORKSPACE" 2>/dev/null || terraform workspace select "$WORKSPACE"

# Validate configuration
terraform validate

# Plan deployment
terraform plan \
    -var-file="environments/$ENVIRONMENT/terraform.tfvars" \
    -out="$ENVIRONMENT.tfplan"

# Ask for confirmation
read -p "Do you want to apply this plan? (yes/no): " confirmation

if [ "$confirmation" = "yes" ]; then
    # Apply the plan
    terraform apply "$ENVIRONMENT.tfplan"
    
    # Clean up plan file
    rm -f "$ENVIRONMENT.tfplan"
    
    echo ""
    echo "Deployment completed successfully!"
    echo ""
    echo "Outputs:"
    terraform output
else
    echo "Deployment cancelled."
    rm -f "$ENVIRONMENT.tfplan"
    exit 1
fi
```

---

## 4. Enhanced GitHub Actions Workflows

**What are GitHub Actions?**  
GitHub Actions is a CI/CD platform that automates your software development workflows. It allows you to build, test, and deploy your code directly from your GitHub repository using YAML configuration files.

**Why GitHub Actions for this project?**
- Native integration with GitHub repositories
- Free tier includes 2,000 minutes per month
- Secure secret management
- OIDC integration for keyless AWS authentication
- Rich ecosystem of pre-built actions
- Matrix builds for testing multiple environments

**Key Concepts:**
- **Workflow**: Automated process defined in YAML
- **Job**: Group of steps that execute on the same runner
- **Step**: Individual task within a job
- **Action**: Reusable unit of code
- **Runner**: Virtual machine that executes jobs
- **Secrets**: Encrypted environment variables

### Updated GitHub Actions Workflow: `.github/workflows/deploy.yml`

**Purpose:** This workflow automates the entire deployment process from code commit to live website. It implements a production-grade CI/CD pipeline with testing, building, and deployment stages.

**Workflow Stages:**
1. **Test**: Runs linting and tests to ensure code quality
2. **Build**: Compiles React app and generates production assets
3. **Deploy**: Uploads to S3 and invalidates CloudFront cache
4. **Notify**: Sends deployment status and summary

**Security Features:**
- OIDC authentication (no long-lived AWS keys)
- Environment protection rules
- Least-privilege IAM permissions
- Secret management for sensitive values

```yaml
name: Deploy React Portfolio Site    # Workflow name shown in GitHub UI

# ===== WORKFLOW TRIGGERS =====
# When should this workflow run?
on:
  push:
    branches: [ main ]              # Deploy on pushes to main branch
  pull_request:
    branches: [ main ]              # Test on pull requests to main
  # Note: Deploy job only runs on pushes to main (see condition below)

# ===== GLOBAL ENVIRONMENT VARIABLES =====
# Available to all jobs in this workflow
env:
  NODE_VERSION: '18'                # Node.js version for consistent builds
  AWS_REGION: 'us-east-1'           # AWS region for deployments

# ===== JOBS DEFINITION =====
jobs:
  # ===== TEST JOB =====
  # Runs code quality checks and tests
  test:
    runs-on: ubuntu-latest          # GitHub-hosted runner
    steps:
      # Download the repository code
      - name: Checkout code
        uses: actions/checkout@v4    # Official GitHub action
      
      # Setup Node.js environment with caching for faster builds
      - name: Setup Node.js
        uses: actions/setup-node@v4  # Official Node.js setup action
        with:
          node-version: ${{ env.NODE_VERSION }}    # Use global env var
          cache: 'npm'                              # Cache npm dependencies
          cache-dependency-path: portfolio-site/package-lock.json  # Cache key
      
      # Install dependencies (npm ci is faster and more reliable than npm install)
      - name: Install dependencies
        run: npm ci                  # Clean install from package-lock.json
        working-directory: ./portfolio-site
      
      # Check code quality with ESLint
      - name: Run linting
        run: npm run lint            # Runs ESLint to catch code issues
        working-directory: ./portfolio-site
      
      # Run unit and integration tests
      - name: Run tests
        run: npm run test:run        # Runs tests once (not watch mode)
        working-directory: ./portfolio-site

  # ===== BUILD JOB =====
  # Compiles the React application for production
  build:
    needs: test                     # Only run if test job passes
    runs-on: ubuntu-latest
    outputs:
      build-hash: ${{ steps.hash.outputs.hash }}  # Pass build hash to deploy job
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: portfolio-site/package-lock.json
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./portfolio-site
      
      # Build the React application for production
      - name: Build application
        run: npm run build           # Runs Vite build process
        working-directory: ./portfolio-site
        env:
          CI: false                 # Prevents warnings from failing build
      
      # Generate unique hash of build files for cache busting
      - name: Generate build hash
        id: hash                    # ID allows other steps to reference outputs
        run: |
          BUILD_HASH=$(find portfolio-site/dist -type f -exec sha256sum {} \; | sha256sum | cut -d' ' -f1 | cut -c1-8)
          echo "hash=$BUILD_HASH" >> $GITHUB_OUTPUT
          echo "Build hash: $BUILD_HASH"
          # This creates a unique identifier for each build
      
      # Store build artifacts for the deploy job
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-files-${{ steps.hash.outputs.hash }}  # Unique artifact name
          path: portfolio-site/dist/                         # Built files
          retention-days: 1                                  # Clean up after 1 day

  # ===== DEPLOY JOB =====
  # Deploys the built application to AWS
  deploy:
    # Security: Only deploy from main branch pushes (not PRs)
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: [test, build]            # Wait for both test and build to succeed
    runs-on: ubuntu-latest
    environment: production         # Uses GitHub environment protection
    
    # OIDC permissions for keyless AWS authentication
    permissions:
      id-token: write               # Required to request OIDC token
      contents: read                # Required to checkout repository
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-files-${{ needs.build.outputs.build-hash }}
          path: ./dist
      
      # ===== SECURE AWS AUTHENTICATION =====
      # Primary method: OIDC (no long-lived credentials)
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}       # IAM role created by IaC
          aws-region: ${{ env.AWS_REGION }}
          role-session-name: GitHubActions-${{ github.run_id }}  # Unique session name
      
      # Fallback method: Access keys (less secure, but works if OIDC not set up)
      - name: Configure AWS credentials (Access Keys)
        if: failure()               # Only runs if OIDC authentication fails
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      # ===== DEPLOY TO S3 =====
      # Upload build files with optimized caching headers
      - name: Deploy to S3
        run: |
          echo "Deploying to S3 bucket: ${{ secrets.AWS_S3_BUCKET_NAME }}"
          
          # Upload static assets with long cache times (1 year)
          aws s3 sync ./dist/ s3://${{ secrets.AWS_S3_BUCKET_NAME }}/ \
            --delete \
            --cache-control max-age=31536000 \
            --exclude "*.html" \
            --exclude "service-worker.js"
          # CSS, JS, images get long cache times because they have unique names
          
          # Upload HTML and service worker with no caching
          aws s3 sync ./dist/ s3://${{ secrets.AWS_S3_BUCKET_NAME }}/ \
            --cache-control max-age=0,no-cache,no-store,must-revalidate \
            --include "*.html" \
            --include "service-worker.js"
          # HTML needs fresh content for updates, service worker controls caching
      
      # ===== CLOUDFRONT CACHE INVALIDATION =====
      # Clear CDN cache to serve updated content immediately
      - name: Invalidate CloudFront
        if: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID != '' }}  # Only if CloudFront exists
        run: |
          echo "Creating CloudFront invalidation for distribution: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}"
          
          # Create cache invalidation for all files
          INVALIDATION_ID=$(aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*" \
            --query 'Invalidation.Id' \
            --output text)
          
          echo "Invalidation created with ID: $INVALIDATION_ID"
          echo "Waiting for invalidation to complete..."
          
          # Wait for invalidation to complete (can take 5-15 minutes)
          aws cloudfront wait invalidation-completed \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --id $INVALIDATION_ID
          
          echo "CloudFront invalidation completed successfully"
          # Users worldwide will now see the updated content
      
      - name: Health check
        if: ${{ secrets.WEBSITE_URL != '' }}
        run: |
          echo "Performing health check on: ${{ secrets.WEBSITE_URL }}"
          for i in {1..5}; do
            if curl -f -s --max-time 10 "${{ secrets.WEBSITE_URL }}" > /dev/null; then
              echo "✅ Health check passed (attempt $i)"
              exit 0
            else
              echo "❌ Health check failed (attempt $i)"
              if [ $i -eq 5 ]; then
                echo "Health check failed after 5 attempts"
                exit 1
              fi
              sleep 10
            fi
          done
      
      - name: Deployment summary
        run: |
          echo "## 🚀 Deployment Summary" >> $GITHUB_STEP_SUMMARY
          echo "- **Environment**: production" >> $GITHUB_STEP_SUMMARY
          echo "- **Build Hash**: ${{ needs.build.outputs.build-hash }}" >> $GITHUB_STEP_SUMMARY
          echo "- **S3 Bucket**: ${{ secrets.AWS_S3_BUCKET_NAME }}" >> $GITHUB_STEP_SUMMARY
          if [ -n "${{ secrets.WEBSITE_URL }}" ]; then
            echo "- **Website URL**: [${{ secrets.WEBSITE_URL }}](${{ secrets.WEBSITE_URL }})" >> $GITHUB_STEP_SUMMARY
          fi
          if [ -n "${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}" ]; then
            echo "- **CloudFront**: Invalidated distribution ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}" >> $GITHUB_STEP_SUMMARY
          fi
          echo "- **Deployed at**: $(date -u '+%Y-%m-%d %H:%M:%S UTC')" >> $GITHUB_STEP_SUMMARY

  notify:
    if: always() && github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: [test, build, deploy]
    runs-on: ubuntu-latest
    steps:
      - name: Notify deployment status
        run: |
          if [ "${{ needs.deploy.result }}" = "success" ]; then
            echo "✅ Deployment completed successfully"
          else
            echo "❌ Deployment failed"
            exit 1
          fi
```

### Infrastructure Deployment Workflow: `.github/workflows/infrastructure.yml`

**Purpose:** This workflow manages your infrastructure deployments using any of the three IaC tools (CDK, CloudFormation, or Terraform). It's designed for manual triggers with environment selection and action choice.

**Key Features:**
- **Manual Trigger**: Uses `workflow_dispatch` for controlled deployments
- **Multi-Tool Support**: Supports CDK, CloudFormation, and Terraform
- **Environment Isolation**: Separate configurations for production and staging
- **Action Selection**: Plan, deploy, or destroy infrastructure
- **Safe Operations**: Requires explicit choices to prevent accidents

**When to use this workflow:**
- Initial infrastructure setup
- Infrastructure updates or changes
- Environment provisioning (staging, production)
- Disaster recovery (rebuild infrastructure)
- Cost optimization (destroy staging environments)

```yaml
name: Infrastructure Deployment   # Shown in GitHub Actions UI

# ===== MANUAL WORKFLOW TRIGGER =====
# This workflow only runs when manually triggered from GitHub UI
on:
  workflow_dispatch:              # Manual trigger only
    inputs:                      # User-selectable options
      action:
        description: 'Action to perform'
        required: true
        default: 'plan'           # Safe default - just shows changes
        type: choice
        options:
          - plan                  # Show what changes will be made
          - deploy                # Actually create/update infrastructure
          - destroy               # Delete infrastructure (be careful!)
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'production'
        type: choice
        options:
          - production            # Live environment
          - staging               # Testing environment
      tool:
        description: 'IaC Tool to use'
        required: true
        default: 'terraform'     # Default to Terraform
        type: choice
        options:
          - terraform             # HashiCorp Terraform
          - cdk                   # AWS CDK (TypeScript)
          - cloudformation        # AWS CloudFormation (YAML)

# ===== SECURITY PERMISSIONS =====
# Required for OIDC authentication and code access
permissions:
  id-token: write                 # Request OIDC tokens for AWS authentication
  contents: read                  # Read repository code and configuration

env:
  AWS_REGION: 'us-east-1'

# ===== INFRASTRUCTURE JOBS =====
jobs:
  # ===== TERRAFORM DEPLOYMENT JOB =====
  terraform:
    if: github.event.inputs.tool == 'terraform'  # Only run if Terraform selected
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}  # Use selected environment
    
    # All commands run in terraform directory by default
    defaults:
      run:
        working-directory: terraform
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: '~1.0'
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
          role-session-name: GitHubActions-Infrastructure-${{ github.run_id }}
      
      - name: Initialize Terraform
        run: |
          terraform init -reconfigure
          terraform workspace new ${{ github.event.inputs.environment }} 2>/dev/null || terraform workspace select ${{ github.event.inputs.environment }}
      
      - name: Validate Terraform
        run: terraform validate
      
      - name: Plan Infrastructure
        if: github.event.inputs.action == 'plan' || github.event.inputs.action == 'deploy'
        run: |
          terraform plan \
            -var-file="environments/${{ github.event.inputs.environment }}/terraform.tfvars" \
            -out="${{ github.event.inputs.environment }}.tfplan"
      
      - name: Deploy Infrastructure
        if: github.event.inputs.action == 'deploy'
        run: |
          terraform apply "${{ github.event.inputs.environment }}.tfplan"
          terraform output -json > terraform-outputs.json
      
      - name: Destroy Infrastructure
        if: github.event.inputs.action == 'destroy'
        run: |
          terraform plan -destroy \
            -var-file="environments/${{ github.event.inputs.environment }}/terraform.tfvars" \
            -out="${{ github.event.inputs.environment }}-destroy.tfplan"
          terraform apply "${{ github.event.inputs.environment }}-destroy.tfplan"
      
      - name: Upload Terraform outputs
        if: github.event.inputs.action == 'deploy'
        uses: actions/upload-artifact@v4
        with:
          name: terraform-outputs-${{ github.event.inputs.environment }}
          path: terraform/terraform-outputs.json

  cdk:
    if: github.event.inputs.tool == 'cdk'
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    
    defaults:
      run:
        working-directory: infrastructure
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: infrastructure/package-lock.json
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
          role-session-name: GitHubActions-CDK-${{ github.run_id }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Synthesize CDK
        run: npx cdk synth
      
      - name: Diff CDK
        if: github.event.inputs.action == 'plan'
        run: npx cdk diff
      
      - name: Deploy CDK
        if: github.event.inputs.action == 'deploy'
        run: |
          npx cdk bootstrap
          npx cdk deploy --require-approval never --outputs-file cdk-outputs.json
      
      - name: Destroy CDK
        if: github.event.inputs.action == 'destroy'
        run: npx cdk destroy --force
      
      - name: Upload CDK outputs
        if: github.event.inputs.action == 'deploy'
        uses: actions/upload-artifact@v4
        with:
          name: cdk-outputs-${{ github.event.inputs.environment }}
          path: infrastructure/cdk-outputs.json

  cloudformation:
    if: github.event.inputs.tool == 'cloudformation'
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
          role-session-name: GitHubActions-CloudFormation-${{ github.run_id }}
      
      - name: Validate CloudFormation template
        run: |
          aws cloudformation validate-template \
            --template-body file://cloudformation/portfolio-infrastructure.yaml
      
      - name: Plan CloudFormation
        if: github.event.inputs.action == 'plan'
        run: |
          aws cloudformation create-change-set \
            --stack-name portfolio-site-infrastructure-${{ github.event.inputs.environment }} \
            --template-body file://cloudformation/portfolio-infrastructure.yaml \
            --change-set-name github-actions-$(date +%s) \
            --capabilities CAPABILITY_NAMED_IAM \
            --parameters \
              ParameterKey=Environment,ParameterValue=${{ github.event.inputs.environment }} \
              ParameterKey=GitHubRepo,ParameterValue=${{ github.repository }}
      
      - name: Deploy CloudFormation
        if: github.event.inputs.action == 'deploy'
        run: |
          aws cloudformation deploy \
            --template-file cloudformation/portfolio-infrastructure.yaml \
            --stack-name portfolio-site-infrastructure-${{ github.event.inputs.environment }} \
            --capabilities CAPABILITY_NAMED_IAM \
            --parameter-overrides \
              Environment=${{ github.event.inputs.environment }} \
              GitHubRepo=${{ github.repository }} \
            --tags \
              Project=PortfolioSite \
              Environment=${{ github.event.inputs.environment }} \
              ManagedBy=CloudFormation
      
      - name: Destroy CloudFormation
        if: github.event.inputs.action == 'destroy'
        run: |
          aws cloudformation delete-stack \
            --stack-name portfolio-site-infrastructure-${{ github.event.inputs.environment }}
          aws cloudformation wait stack-delete-complete \
            --stack-name portfolio-site-infrastructure-${{ github.event.inputs.environment }}
```

---

## 5. Security and Best Practices

**Why Security Matters**  
Your portfolio site represents your professional brand, and security breaches can damage your reputation and career prospects. Even static sites need security considerations for data integrity, availability, and visitor trust.

**Security Layers in This Architecture:**
1. **Infrastructure Security**: Private S3 buckets, secure access controls
2. **Network Security**: HTTPS everywhere, CDN protection
3. **Access Security**: OIDC authentication, least-privilege IAM
4. **Data Security**: Encryption at rest and in transit
5. **Application Security**: Security headers, content validation

### Security Configurations

**Best Practices Implemented:**
- All traffic encrypted with TLS 1.2+
- S3 buckets are private with no public access
- CloudFront uses Origin Access Control (OAC) for secure S3 access
- IAM roles follow least-privilege principle
- Security headers protect against common web attacks
- Infrastructure as Code ensures consistent security configurations

#### WAF Configuration (Optional Enhancement)

**What is AWS WAF?**  
AWS Web Application Firewall (WAF) is a security service that protects web applications from common web exploits and bots. While optional for a portfolio site, it adds an extra layer of security.

**When to add WAF:**
- High-traffic portfolio sites
- Sites with contact forms or user interactions
- Professional/corporate requirements
- Compliance requirements

**Cost consideration:** WAF costs ~$5/month + $1 per million requests.

```yaml
# Add to CloudFormation template - creates basic web protection
WebApplicationFirewall:
  Type: AWS::WAFv2::WebACL
  Properties:
    Name: !Sub 'portfolio-site-waf-${Environment}'
    Scope: CLOUDFRONT
    DefaultAction:
      Allow: {}
    Rules:
      - Name: AWSManagedRulesCommonRuleSet
        Priority: 1
        OverrideAction:
          None: {}
        Statement:
          ManagedRuleGroupStatement:
            VendorName: AWS
            Name: AWSManagedRulesCommonRuleSet
        VisibilityConfig:
          SampledRequestsEnabled: true
          CloudWatchMetricsEnabled: true
          MetricName: CommonRuleSetMetric
      - Name: AWSManagedRulesKnownBadInputsRuleSet
        Priority: 2
        OverrideAction:
          None: {}
        Statement:
          ManagedRuleGroupStatement:
            VendorName: AWS
            Name: AWSManagedRulesKnownBadInputsRuleSet
        VisibilityConfig:
          SampledRequestsEnabled: true
          CloudWatchMetricsEnabled: true
          MetricName: KnownBadInputsRuleSetMetric
    VisibilityConfig:
      SampledRequestsEnabled: true
      CloudWatchMetricsEnabled: true
      MetricName: !Sub 'portfolio-site-waf-${Environment}'
```

### Cost Optimization

**Why Cost Optimization Matters**  
While AWS costs for a static site are typically low ($10-20/month), implementing cost optimization practices from the start builds good habits and can save money as your projects scale.

**Cost Optimization Strategies:**
1. **Storage Optimization**: Lifecycle policies, intelligent tiering
2. **CDN Optimization**: Regional pricing, compression
3. **Monitoring**: Billing alerts, cost tracking
4. **Resource Cleanup**: Automated deletion of old resources
5. **Right-Sizing**: Choose appropriate service tiers

**Purpose:** Automatically transitions or deletes objects based on age to reduce storage costs. Particularly useful for log files and old asset versions.

**Cost Impact:** Can reduce storage costs by 40-60% for log files and infrequently accessed content.

```json
{
  "Rules": [
    {
      "ID": "OptimizeStorage",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "assets/"
      },
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

### Monitoring and Alerting

**Why Monitoring is Essential**  
Even static sites need monitoring to ensure uptime, performance, and security. Proper monitoring helps you identify issues before users do and provides insights into site usage.

**What to Monitor:**
1. **Uptime**: Is your site accessible?
2. **Performance**: How fast is content loading?
3. **Errors**: Are users hitting 404s or other issues?
4. **Security**: Any suspicious traffic or attacks?
5. **Costs**: Are you staying within budget?

**Monitoring Tools Used:**
- **CloudWatch**: AWS native monitoring and alerting
- **CloudFront Metrics**: CDN performance and caching efficiency
- **S3 Metrics**: Storage usage and request patterns

**Purpose:** Provides a visual overview of your site's health, performance, and usage patterns. This dashboard configuration creates a comprehensive monitoring view.

**Dashboard Widgets:**
- **Traffic Metrics**: Requests, data transfer, geographic distribution
- **Performance Metrics**: Cache hit rates, response times
- **Error Monitoring**: 4xx/5xx error rates and patterns
- **Cost Tracking**: Service usage and cost trends

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/CloudFront", "Requests"],
          ["AWS/CloudFront", "BytesDownloaded"],
          ["AWS/CloudFront", "CacheHitRate"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "CloudFront Metrics"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '/aws/cloudfront/access-logs' | fields @timestamp, status\n| filter status like /^4/\n| stats count() by status\n| sort @timestamp desc",
        "region": "us-east-1",
        "title": "4xx Errors",
        "view": "table"
      }
    }
  ]
}
```

---

## 6. Deployment Strategies

**Why Multiple Deployment Strategies?**  
Different deployment strategies offer different benefits. Blue-green deployments provide zero downtime, canary deployments allow testing with real users, and rolling deployments balance risk with simplicity.

**Deployment Strategy Comparison:**

| Strategy | Downtime | Risk | Complexity | Best For |
|----------|----------|------|------------|----------|
| **Basic** | Brief | Medium | Low | Personal sites, low traffic |
| **Blue-Green** | Zero | Low | Medium | Professional sites, critical updates |
| **Canary** | Zero | Very Low | High | High-traffic, risk-averse deployments |
| **Rolling** | Zero | Low | Medium | Large applications, gradual rollouts |

**Current Implementation:** The GitHub Actions workflow uses basic deployment with CloudFront invalidation for simplicity and cost-effectiveness.

**What is Blue-Green Deployment?**  
Blue-green deployment maintains two identical production environments ("blue" and "green"). You deploy to the inactive environment, test it, then switch traffic over. This provides zero downtime and instant rollback capability.

**Benefits:**
- Zero downtime deployments
- Instant rollback if issues arise
- Full testing of production environment before switch
- Clear separation between old and new versions

**Drawbacks:**
- Double infrastructure costs during deployment
- More complex setup and management
- Database changes can be challenging

**Implementation for Static Sites:**
For static sites, you can use two S3 buckets or two CloudFront origins.

```yaml
# GitHub Actions workflow for blue-green deployment
name: Blue-Green Deployment

on:
  workflow_dispatch:
    inputs:
      slot:
        description: 'Deployment slot (blue/green)'
        required: true
        default: 'blue'
        type: choice
        options:
          - blue
          - green

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ${{ github.event.inputs.slot }} slot
        run: |
          aws s3 sync ./dist/ s3://portfolio-site-${{ github.event.inputs.slot }}/ --delete
          
          # Update CloudFront origin after validation
          aws cloudfront update-distribution \
            --id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --distribution-config file://distribution-config-${{ github.event.inputs.slot }}.json
```

### Canary Deployment

**What is Canary Deployment?**  
Canary deployment gradually shifts a small percentage of traffic to the new version while monitoring for issues. If problems arise, traffic can be quickly shifted back to the stable version.

**Benefits:**
- Risk mitigation through gradual rollout
- Real user testing with minimal impact
- Detailed performance comparison
- Easy rollback with traffic shifting

**How it works:**
1. Deploy new version to separate infrastructure
2. Route small percentage of traffic (5-10%) to new version
3. Monitor metrics and user feedback
4. Gradually increase traffic if all is well
5. Complete rollout or rollback based on results

```bash
#!/bin/bash
# Canary deployment script
CANARY_WEIGHT=${1:-10}  # 10% traffic to canary by default

aws cloudfront update-distribution \
  --id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --distribution-config "$(cat <<EOF
{
  "CallerReference": "canary-$(date +%s)",
  "Origins": {
    "Items": [
      {
        "Id": "production",
        "DomainName": "$PROD_BUCKET.s3.amazonaws.com"
      },
      {
        "Id": "canary", 
        "DomainName": "$CANARY_BUCKET.s3.amazonaws.com"
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "production",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0
  },
  "CacheBehaviors": {
    "Items": [
      {
        "PathPattern": "/canary/*",
        "TargetOriginId": "canary",
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 0
      }
    ]
  }
}
EOF
)"
```

---

## 7. Quick Start Commands

**Getting Started Quickly**  
These command sequences will get you from zero to deployed infrastructure in minutes. Choose the tool that best fits your experience and requirements.

**Prerequisites for all approaches:**
- AWS CLI installed and configured
- Appropriate tool installed (CDK, Terraform, or AWS CLI for CloudFormation)
- GitHub repository set up
- Basic understanding of your chosen tool

**Time to Deploy:**
- **CDK**: ~10-15 minutes (including npm install)
- **Terraform**: ~5-10 minutes
- **CloudFormation**: ~5-10 minutes

**Best for:** Developers comfortable with TypeScript/JavaScript who want maximum flexibility and type safety.

```bash
# 1. Setup - Create new CDK project
mkdir infrastructure && cd infrastructure
npm init -y                                    # Initialize package.json
npm install aws-cdk-lib constructs             # Core CDK dependencies
npm install -D aws-cdk typescript @types/node  # Development dependencies

# 2. Initialize
npx cdk init app --language typescript

# 3. Deploy
npx cdk bootstrap
npx cdk deploy

# 4. Clean up
npx cdk destroy
```

### Terraform Quick Start

**Best for:** Infrastructure engineers who want industry-standard tooling and multi-cloud capability.

```bash
# 1. Setup - Create Terraform project
mkdir terraform && cd terraform               # Create project directory
# Copy the Terraform files from this guide

# 2. Initialize
terraform init

# 3. Plan
terraform plan -var-file="environments/production/terraform.tfvars"

# 4. Deploy
terraform apply

# 5. Clean up
terraform destroy
```

### CloudFormation Quick Start

**Best for:** AWS-focused teams who prefer native AWS tooling and don't need multi-cloud support.

```bash
# 1. Validate - Check template syntax
aws cloudformation validate-template \
  --template-body file://cloudformation/portfolio-infrastructure.yaml  # Verify template is valid

# 2. Deploy
aws cloudformation deploy \
  --template-file cloudformation/portfolio-infrastructure.yaml \
  --stack-name portfolio-site-infrastructure \
  --capabilities CAPABILITY_NAMED_IAM

# 3. Clean up
aws cloudformation delete-stack --stack-name portfolio-site-infrastructure
```

---

## 8. Cost Estimates

**Understanding AWS Costs**  
While AWS offers a generous free tier, it's important to understand the ongoing costs of hosting your portfolio site. These estimates assume moderate traffic (typical for personal portfolio sites).

**Cost Variables:**
- **Traffic Volume**: More visitors = higher costs
- **Geographic Distribution**: Global traffic costs more than regional
- **Content Size**: Larger images/assets = higher transfer costs
- **Features Used**: Monitoring, WAF, and other services add costs

**Free Tier Benefits (first 12 months):**
- S3: 5GB storage, 20,000 GET requests, 2,000 PUT requests
- CloudFront: 1TB data transfer out, 10,000,000 HTTP requests
- Route53: No free tier
- CloudWatch: 10 metrics, 1,000,000 requests

### Monthly Cost Breakdown (Estimated)

| Service | Usage | Cost (USD) |
|---------|-------|------------|
| S3 Standard Storage | 1 GB | $0.02 |
| S3 Requests (PUT/GET) | 10,000 | $0.01 |
| CloudFront Data Transfer | 100 GB | $8.50 |
| CloudFront Requests | 1M | $1.00 |
| Route53 Hosted Zone | 1 zone | $0.50 |
| Route53 Queries | 1M | $0.40 |
| ACM Certificate | 1 cert | $0.00 |
| CloudWatch | Basic monitoring | $3.00 |
| **Total Estimated** | | **~$13.43** |

### Cost Optimization Tips
1. **Use CloudFront PriceClass_100** for lower costs
2. **Enable S3 Intelligent Tiering** for automatic cost optimization
3. **Set up CloudWatch billing alerts** at $20/month
4. **Use S3 lifecycle policies** to transition old assets to cheaper storage
5. **Enable compression** on CloudFront to reduce data transfer costs

---

## 9. Troubleshooting Guide

**Common Issues and Solutions**  
Deployment issues are inevitable, but most problems fall into common categories with well-known solutions. This guide covers the most frequent issues and their fixes.

**Troubleshooting Approach:**
1. **Identify the Error**: Read error messages carefully
2. **Check Prerequisites**: Ensure all requirements are met
3. **Verify Configuration**: Double-check syntax and values
4. **Test Components**: Isolate and test individual parts
5. **Check Documentation**: AWS docs are comprehensive and current

**Quick Diagnosis:**
- **Deployment fails**: Usually permissions or configuration issues
- **Site not accessible**: DNS, CloudFront, or S3 configuration
- **SSL errors**: Certificate validation or CloudFront setup
- **Build failures**: Node.js version or dependency issues

### Common Issues and Solutions

#### 1. SSL Certificate Validation Timeout
**Problem**: ACM certificate validation takes too long or fails
**Solution**: 
```bash
# Check DNS records
dig CNAME _validation_record.yourdomain.com

# Manual validation via Route53
aws route53 change-resource-record-sets --hosted-zone-id Z123456 --change-batch file://cert-validation.json
```

#### 2. CloudFront 403 Errors
**Problem**: S3 bucket policy denying access
**Solution**:
```json
{
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "cloudfront.amazonaws.com"},
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::bucket-name/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::account:distribution/distribution-id"
      }
    }
  }]
}
```

#### 3. GitHub Actions OIDC Issues
**Problem**: "AssumeRoleWithWebIdentity" permission denied
**Solution**:
```bash
# Check OIDC provider exists
aws iam list-open-id-connect-providers

# Verify role trust policy
aws iam get-role --role-name PortfolioSiteDeploymentRole
```

#### 4. Terraform State Lock
**Problem**: State locked by another operation
**Solution**:
```bash
# Force unlock (use carefully)
terraform force-unlock LOCK_ID

# Or delete DynamoDB lock item manually
aws dynamodb delete-item --table-name terraform-state-lock --key '{"LockID":{"S":"terraform-state-lock-id"}}'
```

---

## 10. Migration Guide

**From Manual to Infrastructure as Code**  
If you currently have a manually deployed site, migrating to Infrastructure as Code provides better reliability, security, and maintainability. This guide helps you transition safely.

**Migration Benefits:**
- **Reproducibility**: Recreate infrastructure consistently
- **Version Control**: Track infrastructure changes over time
- **Team Collaboration**: Share and review infrastructure changes
- **Disaster Recovery**: Quickly rebuild if something goes wrong
- **Environment Parity**: Keep development and production in sync

**Migration Strategy:**
- **Plan**: Document current setup and desired end state
- **Test**: Deploy IaC to new environment first
- **Validate**: Ensure new infrastructure works correctly
- **Switch**: Update DNS or redirect traffic
- **Cleanup**: Remove old resources after verification

### From Current Manual Deployment to IaC

**Migration Steps Overview:**
1. **Assessment**: Document existing infrastructure
2. **Backup**: Save current state and content
3. **Import/Recreate**: Bring existing resources into IaC
4. **Test**: Verify new infrastructure works
5. **Switch**: Redirect traffic to new infrastructure
6. **Cleanup**: Remove old manual resources

#### Step 1: Backup Current Setup
```bash
# Export current S3 bucket contents
aws s3 sync s3://your-current-bucket ./backup/

# Document current CloudFormation stacks (if any)
aws cloudformation list-stacks > current-stacks.json
```

#### Step 2: Import Existing Resources (Terraform)
```bash
# Import S3 bucket
terraform import aws_s3_bucket.website your-existing-bucket-name

# Import CloudFront distribution (if exists)
terraform import aws_cloudfront_distribution.website DISTRIBUTION_ID
```

#### Step 3: Update GitHub Secrets
```bash
# Required secrets for OIDC
AWS_ROLE_ARN=arn:aws:iam::account:role/PortfolioSiteDeploymentRole
AWS_S3_BUCKET_NAME=portfolio-site-bucket
CLOUDFRONT_DISTRIBUTION_ID=E123456789
WEBSITE_URL=https://yourdomain.com
```

#### Step 4: Gradual Migration
1. Deploy IaC to new environment first
2. Test thoroughly
3. Update DNS to point to new infrastructure
4. Decommission old infrastructure

---

## Conclusion

**Infrastructure as Code for Portfolio Sites**  
This guide provides three production-ready approaches to deploy and manage your React portfolio site infrastructure. Each approach offers professional-grade capabilities while remaining cost-effective for personal use.

### Tool Comparison Summary

| Aspect | AWS CDK | CloudFormation | Terraform |
|--------|---------|----------------|----------|
| **Learning Curve** | Medium (TypeScript) | Medium (YAML) | Medium (HCL) |
| **Flexibility** | Very High | High | Very High |
| **Multi-Cloud** | AWS Only | AWS Only | Yes |
| **Community** | Growing | Large (AWS) | Very Large |
| **Testing** | Excellent | Limited | Good |
| **IDE Support** | Excellent | Good | Good |
| **Cost** | Free | Free | Free |

### Recommendations by Use Case

1. **AWS CDK** - Best for TypeScript developers who want maximum flexibility and type safety
2. **CloudFormation** - Best for AWS-focused teams who prefer native tooling and YAML
3. **Terraform** - Best for infrastructure engineers who want industry-standard tooling

**For beginners:** Start with **CloudFormation** for its native AWS integration and extensive documentation.

**For developers:** Choose **AWS CDK** for familiar programming patterns and excellent IDE support.

**For infrastructure teams:** Select **Terraform** for its widespread adoption and multi-cloud capabilities.

### What You Get with Any Approach

All three implementations provide enterprise-grade features:

**🚀 Deployment & Operations**
- ✅ Automated infrastructure deployment
- ✅ Zero-downtime deployments with CloudFront
- ✅ Blue-green deployment capability
- ✅ Automated rollback on failures

**🔒 Security & Compliance**
- ✅ SSL/TLS certificates (free via ACM)
- ✅ Private S3 buckets with secure access
- ✅ OIDC integration with GitHub Actions (no AWS keys in code)
- ✅ Security headers and best practices

**⚡ Performance & Reliability**
- ✅ CloudFront CDN with optimized caching
- ✅ Global content delivery
- ✅ Automatic failover and health checks
- ✅ SPA routing support

**📊 Monitoring & Optimization**
- ✅ CloudWatch monitoring and alerting
- ✅ Cost optimization with lifecycle policies
- ✅ Performance dashboards
- ✅ Automated log management

**🎯 Next Steps**
1. Choose your preferred Infrastructure as Code tool
2. Follow the quick start guide for your chosen approach
3. Set up GitHub Actions for automated deployments
4. Configure monitoring and alerting
5. Consider adding WAF for additional security

Your portfolio site will be hosted on enterprise-grade infrastructure while remaining cost-effective for personal use. Choose the approach that best aligns with your technical expertise and career goals.