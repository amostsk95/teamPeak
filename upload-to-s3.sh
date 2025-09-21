#!/bin/bash

# Replace with your bucket name
BUCKET_NAME="your-bucket-name"

# Upload all files from dist folder
aws s3 sync ./dist s3://$BUCKET_NAME --delete

# Set proper content types
aws s3 cp s3://$BUCKET_NAME/index.html s3://$BUCKET_NAME/index.html --content-type "text/html" --metadata-directive REPLACE
aws s3 cp s3://$BUCKET_NAME/assets/ s3://$BUCKET_NAME/assets/ --recursive --content-type "text/css" --exclude "*" --include "*.css" --metadata-directive REPLACE
aws s3 cp s3://$BUCKET_NAME/assets/ s3://$BUCKET_NAME/assets/ --recursive --content-type "application/javascript" --exclude "*" --include "*.js" --metadata-directive REPLACE

# Make bucket public for website hosting
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
    }
  ]
}'

echo "Deployment complete!"
echo "Website URL: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
