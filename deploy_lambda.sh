#!/bin/bash

# HuskyTrack Lambda Deployment Script

LAMBDA_FUNCTION_NAME="huskytrack-chat-agent"
LAMBDA_ROLE_NAME="huskytrack-lambda-role"
AWS_REGION="us-east-1"

echo "🚀 Deploying HuskyTrack Chat Agent Lambda Function..."

# Create IAM role for Lambda (if it doesn't exist)
echo "📋 Creating IAM role..."
aws iam create-role \
    --role-name $LAMBDA_ROLE_NAME \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }' 2>/dev/null || echo "Role already exists"

# Attach basic execution policy
aws iam attach-role-policy \
    --role-name $LAMBDA_ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Get the role ARN
ROLE_ARN=$(aws iam get-role --role-name $LAMBDA_ROLE_NAME --query 'Role.Arn' --output text)
echo "Role ARN: $ROLE_ARN"

# Create deployment package
echo "📦 Creating deployment package..."
zip lambda-deployment.zip lambda_function.py

# Create or update Lambda function
echo "🔧 Creating/updating Lambda function..."
aws lambda create-function \
    --function-name $LAMBDA_FUNCTION_NAME \
    --runtime python3.9 \
    --role $ROLE_ARN \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://lambda-deployment.zip \
    --timeout 30 \
    --memory-size 256 \
    --description "HuskyTrack Chat Agent with Transcript Analysis" \
    --region $AWS_REGION \
    2>/dev/null || \
aws lambda update-function-code \
    --function-name $LAMBDA_FUNCTION_NAME \
    --zip-file fileb://lambda-deployment.zip \
    --region $AWS_REGION

echo "✅ Lambda function deployed successfully!"
echo "Function Name: $LAMBDA_FUNCTION_NAME"
echo "Region: $AWS_REGION"

# Test the function
echo "🧪 Testing Lambda function..."
aws lambda invoke \
    --function-name $LAMBDA_FUNCTION_NAME \
    --payload '{"message": "What courses should I take next quarter?", "transcriptData": null, "context": {"hasTranscript": false}}' \
    --region $AWS_REGION \
    response.json

echo "📄 Lambda response:"
cat response.json | python3 -m json.tool

# Cleanup
rm lambda-deployment.zip response.json

echo "🎉 Deployment complete! Your Lambda function is ready to use."
echo ""
echo "Next steps:"
echo "1. Update your .env file with: CHAT_LAMBDA_NAME=$LAMBDA_FUNCTION_NAME"
echo "2. Restart your server to use the Lambda function"
echo "3. Test the chat functionality with transcript data"
