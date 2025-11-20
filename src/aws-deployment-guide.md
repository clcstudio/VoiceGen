# VoiceClone Studio - AWS Deployment Guide

## Architecture Overview

```
Frontend (React) → S3 + CloudFront
         ↓
API Gateway → Lambda Functions → S3 (Audio Storage)
         ↓
SageMaker (Voice Training) / EC2 (Processing)
```

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. Node.js 18+ installed
4. Python 3.9+ (for Lambda functions)

## Step 1: Frontend Deployment

### Create S3 Bucket for Static Website

```bash
# Create bucket
aws s3 mb s3://voiceclone-studio-app --region us-east-1

# Enable static website hosting
aws s3 website s3://voiceclone-studio-app \
  --index-document index.html \
  --error-document index.html

# Update bucket policy for public read
cat > bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::voiceclone-studio-app/*"
  }]
}
EOF

aws s3api put-bucket-policy \
  --bucket voiceclone-studio-app \
  --policy file://bucket-policy.json
```

### Build and Deploy Frontend

```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Deploy to S3
aws s3 sync dist/ s3://voiceclone-studio-app --delete

# Get website URL
echo "Website URL: http://voiceclone-studio-app.s3-website-us-east-1.amazonaws.com"
```

### (Optional) Add CloudFront CDN

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name voiceclone-studio-app.s3.amazonaws.com \
  --default-root-object index.html

# Enable HTTPS and custom domain
# Configure in AWS Console under CloudFront
```

## Step 2: Backend Setup

### Create S3 Bucket for Audio Storage

```bash
# Bucket for user recordings
aws s3 mb s3://voiceclone-audio-storage --region us-east-1

# Enable CORS
cat > cors-config.json <<EOF
{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }]
}
EOF

aws s3api put-bucket-cors \
  --bucket voiceclone-audio-storage \
  --cors-configuration file://cors-config.json
```

### Deploy Lambda Functions

```bash
# Create Lambda execution role
aws iam create-role \
  --role-name VoiceCloneLambdaRole \
  --assume-role-policy-document file://lambda-trust-policy.json

# Attach necessary policies
aws iam attach-role-policy \
  --role-name VoiceCloneLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name VoiceCloneLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Package and deploy Lambda function
cd backend/lambda
zip -r function.zip .
aws lambda create-function \
  --function-name voiceclone-upload \
  --runtime python3.9 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/VoiceCloneLambdaRole \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 300 \
  --memory-size 1024
```

### Create API Gateway

```bash
# Create REST API
aws apigateway create-rest-api \
  --name "VoiceClone API" \
  --description "API for VoiceClone Studio"

# Create resources and methods
# /upload - POST - Upload recordings
# /train - POST - Start training
# /generate - POST - Generate song
# /status/{id} - GET - Check job status

# Deploy API
aws apigateway create-deployment \
  --rest-api-id YOUR_API_ID \
  --stage-name prod
```

## Step 3: Environment Configuration

### Update Frontend API Endpoint

Create `.env.production` file:

```env
VITE_API_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
```

Rebuild and redeploy frontend:

```bash
npm run build
npm run deploy
```

## Step 4: Voice Training Setup

### Option A: Using SageMaker (Recommended)

```bash
# Create SageMaker notebook instance
aws sagemaker create-notebook-instance \
  --notebook-instance-name voiceclone-training \
  --instance-type ml.p3.2xlarge \
  --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/SageMakerRole

# Deploy RVC or voice cloning model
# Use provided training scripts in backend/sagemaker/
```

### Option B: Using EC2 with GPU

```bash
# Launch EC2 instance (g4dn.xlarge recommended)
aws ec2 run-instances \
  --image-id ami-xxxxxxxxx \
  --instance-type g4dn.xlarge \
  --key-name your-key-pair \
  --security-groups voice-training-sg

# SSH and setup
# Install CUDA, PyTorch, RVC/voice cloning dependencies
```

## Step 5: Testing

1. **Test Microphone Access**: Open the deployed frontend URL, should request mic permission
2. **Test Recording**: Record a few samples, verify they save
3. **Test Upload**: Click "Finish Training", check S3 bucket for uploaded files
4. **Monitor Lambda**: Check CloudWatch Logs for Lambda execution

## Cost Estimation

- **S3 Storage**: ~$0.023/GB/month
- **CloudFront**: ~$0.085/GB transfer
- **Lambda**: $0.20 per 1M requests + compute time
- **API Gateway**: $3.50 per million requests
- **SageMaker (ml.p3.2xlarge)**: ~$3.06/hour (only during training)
- **EC2 (g4dn.xlarge)**: ~$0.526/hour

**Estimated Monthly Cost**: $10-50 for light usage, $100-500 for moderate usage

## Security Best Practices

1. **Enable HTTPS**: Use CloudFront with SSL certificate
2. **API Authentication**: Implement Cognito user pools
3. **Rate Limiting**: Configure API Gateway throttling
4. **CORS**: Restrict to your domain only
5. **IAM Permissions**: Follow principle of least privilege

## Monitoring & Logging

```bash
# Enable CloudWatch Logs
aws logs create-log-group --log-group-name /aws/lambda/voiceclone

# Set up CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name voiceclone-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## Troubleshooting

### Microphone Not Working
- Ensure HTTPS is enabled (required for mic access)
- Check browser console for permission errors
- Verify CORS headers in API responses

### Uploads Failing
- Check S3 bucket permissions
- Verify Lambda has S3 write access
- Check file size limits (Lambda: 6MB, API Gateway: 10MB)

### Training Not Starting
- Verify SageMaker/EC2 instance is running
- Check IAM roles and permissions
- Monitor CloudWatch Logs for errors

## Next Steps

1. Implement actual voice cloning model (RVC, So-VITS-SVC)
2. Add user authentication with Cognito
3. Implement payment system (Stripe)
4. Add beat analysis and generation features
5. Scale with Auto Scaling Groups

## Support

For issues, check:
- CloudWatch Logs: `/aws/lambda/voiceclone`
- S3 bucket policies and CORS
- API Gateway execution logs
- Browser console (F12) for frontend errors
