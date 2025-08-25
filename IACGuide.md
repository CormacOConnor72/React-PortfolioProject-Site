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

### Architecture Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │───▶│    S3 Bucket     │    │   Route 53      │
│   Distribution  │    │  (Website Host)  │    │  (DNS Domain)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  SSL/TLS Cert   │    │    S3 Bucket     │    │   CloudWatch    │
│  (ACM)          │    │   (Logs/Backup)  │    │   (Monitoring)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### CDK Project Structure
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

#### `infrastructure/package.json`
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

#### `infrastructure/bin/portfolio-infrastructure.ts`
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PortfolioInfrastructureStack } from '../lib/portfolio-infrastructure-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new PortfolioInfrastructureStack(app, 'PortfolioInfrastructureStack', {
  env,
  stackName: 'portfolio-site-infrastructure',
  tags: {
    Project: 'PortfolioSite',
    Environment: 'production',
    Owner: 'CormacOConnor'
  }
});

app.synth();
```

#### `infrastructure/lib/portfolio-infrastructure-stack.ts`
```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

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

### CloudFormation Template: `cloudformation/portfolio-infrastructure.yaml`
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Static React Portfolio Site Infrastructure'

Parameters:
  DomainName:
    Type: String
    Description: 'Domain name for the website (optional)'
    Default: ''
  
  GitHubRepo:
    Type: String
    Description: 'GitHub repository in format username/repo-name'
    Default: 'YourUsername/React PortfolioProject Site'
  
  Environment:
    Type: String
    Description: 'Environment name'
    Default: 'production'
    AllowedValues:
      - production
      - staging
      - development

Conditions:
  HasDomainName: !Not [!Equals [!Ref DomainName, '']]
  IsProduction: !Equals [!Ref Environment, 'production']

Resources:
  # S3 Bucket for website hosting
  WebsiteBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'portfolio-site-${AWS::AccountId}-${AWS::Region}'
      WebsiteConfiguration:
        IndexDocument: index.html
        ErrorDocument: index.html
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 1
      Tags:
        - Key: Project
          Value: PortfolioSite
        - Key: Environment
          Value: !Ref Environment

  # S3 Bucket for CloudFront access logs
  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'portfolio-site-logs-${AWS::AccountId}-${AWS::Region}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Project
          Value: PortfolioSite
        - Key: Environment
          Value: !Ref Environment

  # Origin Access Control
  OriginAccessControl:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub '${AWS::StackName}-OAC'
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4
        Description: 'OAC for Portfolio Site'

  # SSL Certificate (conditional)
  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Condition: HasDomainName
    Properties:
      DomainName: !Ref DomainName
      SubjectAlternativeNames:
        - !Sub 'www.${DomainName}'
      ValidationMethod: DNS
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

### Terraform Project Structure
```
terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── providers.tf
├── modules/
│   ├── s3-website/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── cloudfront/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── route53/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/
│   ├── production/
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── staging/
│       ├── terraform.tfvars
│       └── backend.tf
└── scripts/
    ├── deploy.sh
    └── destroy.sh
```

#### `terraform/providers.tf`
```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "PortfolioSite"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "CormacOConnor"
    }
  }
}

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1" # Required for ACM certificates used with CloudFront
}
```

#### `terraform/variables.tf`
```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
  
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development."
  }
}

variable "domain_name" {
  description = "Domain name for the website (optional)"
  type        = string
  default     = ""
}

variable "github_repo" {
  description = "GitHub repository in format username/repo-name"
  type        = string
  default     = "YourUsername/React PortfolioProject Site"
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

locals {
  bucket_name      = "portfolio-site-${random_id.bucket_suffix.hex}"
  logs_bucket_name = "portfolio-site-logs-${random_id.bucket_suffix.hex}"
  has_domain       = var.domain_name != ""
  
  common_tags = {
    Project     = "PortfolioSite"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
```

#### `terraform/main.tf`
```hcl
# Random ID for unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 bucket for website hosting
resource "aws_s3_bucket" "website" {
  bucket = local.bucket_name
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # SPA routing
  }
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
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

### Updated GitHub Actions Workflow: `.github/workflows/deploy.yml`
```yaml
name: Deploy React Portfolio Site

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'
  AWS_REGION: 'us-east-1'

jobs:
  test:
    runs-on: ubuntu-latest
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
      
      - name: Run linting
        run: npm run lint
        working-directory: ./portfolio-site
      
      - name: Run tests
        run: npm run test:run
        working-directory: ./portfolio-site

  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      build-hash: ${{ steps.hash.outputs.hash }}
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
      
      - name: Build application
        run: npm run build
        working-directory: ./portfolio-site
        env:
          CI: false
      
      - name: Generate build hash
        id: hash
        run: |
          BUILD_HASH=$(find portfolio-site/dist -type f -exec sha256sum {} \; | sha256sum | cut -d' ' -f1 | cut -c1-8)
          echo "hash=$BUILD_HASH" >> $GITHUB_OUTPUT
          echo "Build hash: $BUILD_HASH"
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-files-${{ steps.hash.outputs.hash }}
          path: portfolio-site/dist/
          retention-days: 1

  deploy:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: [test, build]
    runs-on: ubuntu-latest
    environment: production
    
    permissions:
      id-token: write   # Required for OIDC
      contents: read    # Required for checkout
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-files-${{ needs.build.outputs.build-hash }}
          path: ./dist
      
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
          role-session-name: GitHubActions-${{ github.run_id }}
      
      # Fallback to access keys if OIDC is not configured
      - name: Configure AWS credentials (Access Keys)
        if: failure()
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Deploy to S3
        run: |
          echo "Deploying to S3 bucket: ${{ secrets.AWS_S3_BUCKET_NAME }}"
          aws s3 sync ./dist/ s3://${{ secrets.AWS_S3_BUCKET_NAME }}/ \
            --delete \
            --cache-control max-age=31536000 \
            --exclude "*.html" \
            --exclude "service-worker.js"
          
          # Special cache headers for HTML and service worker
          aws s3 sync ./dist/ s3://${{ secrets.AWS_S3_BUCKET_NAME }}/ \
            --cache-control max-age=0,no-cache,no-store,must-revalidate \
            --include "*.html" \
            --include "service-worker.js"
      
      - name: Invalidate CloudFront
        if: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID != '' }}
        run: |
          echo "Creating CloudFront invalidation for distribution: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}"
          INVALIDATION_ID=$(aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*" \
            --query 'Invalidation.Id' \
            --output text)
          
          echo "Invalidation created with ID: $INVALIDATION_ID"
          echo "Waiting for invalidation to complete..."
          aws cloudfront wait invalidation-completed \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --id $INVALIDATION_ID
          
          echo "CloudFront invalidation completed successfully"
      
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
```yaml
name: Infrastructure Deployment

on:
  workflow_dispatch:
    inputs:
      action:
        description: 'Action to perform'
        required: true
        default: 'plan'
        type: choice
        options:
          - plan
          - deploy
          - destroy
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'production'
        type: choice
        options:
          - production
          - staging
      tool:
        description: 'IaC Tool to use'
        required: true
        default: 'terraform'
        type: choice
        options:
          - terraform
          - cdk
          - cloudformation

permissions:
  id-token: write   # Required for OIDC
  contents: read    # Required for checkout

env:
  AWS_REGION: 'us-east-1'

jobs:
  terraform:
    if: github.event.inputs.tool == 'terraform'
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    
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

### Security Configurations

#### WAF Configuration (Optional Enhancement)
```yaml
# Add to CloudFormation template
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

#### S3 Lifecycle Policies
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

#### Enhanced CloudWatch Dashboard
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

### Blue-Green Deployment
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

### CDK Quick Start
```bash
# 1. Setup
mkdir infrastructure && cd infrastructure
npm init -y
npm install aws-cdk-lib constructs
npm install -D aws-cdk typescript @types/node

# 2. Initialize
npx cdk init app --language typescript

# 3. Deploy
npx cdk bootstrap
npx cdk deploy

# 4. Clean up
npx cdk destroy
```

### Terraform Quick Start
```bash
# 1. Setup
mkdir terraform && cd terraform

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
```bash
# 1. Validate
aws cloudformation validate-template \
  --template-body file://cloudformation/portfolio-infrastructure.yaml

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

### From Current Manual Deployment to IaC

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

This guide provides three robust Infrastructure as Code approaches for your React portfolio site:

1. **AWS CDK** - Best for TypeScript developers, most flexible
2. **CloudFormation** - Native AWS, good for pure AWS environments  
3. **Terraform** - Industry standard, multi-cloud capability

**Recommendation**: Start with **Terraform** for its widespread adoption and excellent documentation, or **AWS CDK** if you prefer TypeScript and want maximum flexibility.

Each approach provides:
- ✅ Automated infrastructure deployment
- ✅ SSL/TLS certificates
- ✅ CloudFront CDN with optimized caching
- ✅ Proper security configurations
- ✅ Monitoring and alerting
- ✅ Cost optimization
- ✅ Blue-green deployment capability
- ✅ OIDC integration with GitHub Actions

Choose the approach that best fits your team's expertise and organizational requirements.