# AWS S3 Integration for SimplyMedi

This document explains the AWS S3 integration implemented in the SimplyMedi backend.

## Overview

The application now stores uploaded medical reports in AWS S3 instead of local filesystem, providing:
- Scalable file storage
- Better security and access control
- Reduced server storage requirements
- Global CDN capabilities

## Files Added/Modified

### New Files
- `server/config/aws.js` - AWS SDK configuration
- `server/services/s3Service.js` - S3 service functions
- `server/scripts/add-s3-fields.js` - Database migration script

### Modified Files
- `server/models/Report.js` - Added S3 fields
- `server/routes/reports.js` - Updated upload/delete routes
- `server/package.json` - Added AWS SDK dependency

## Database Changes

New fields added to `reports` table:
- `s3Key` (STRING) - S3 object key
- `s3Bucket` (STRING) - S3 bucket name
- `s3Url` (STRING) - S3 object URL
- `filePath` (STRING) - Made optional (was required)

## Environment Variables

Add these to your `.env` file:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-north-1
AWS_S3_BUCKET=your_bucket_name
```

## Setup Instructions

1. **Install AWS SDK**:
   ```bash
   cd server
   npm install aws-sdk
   ```

2. **Run Database Migration**:
   ```bash
   node scripts/add-s3-fields.js up
   ```

3. **Configure AWS Credentials**:
   - Set up your AWS credentials in `.env`
   - Ensure your S3 bucket exists and is accessible
   - Verify IAM permissions for S3 operations

## API Changes

### Upload Route (`POST /api/reports/upload`)
- Files are uploaded to S3 after local processing
- Local files are cleaned up after S3 upload
- Database stores both S3 metadata and local path (for OCR)

### Delete Route (`DELETE /api/reports/:id`)
- Deletes file from S3 if `s3Key` exists
- Also deletes local file if `filePath` exists
- Removes database record

### New Download Route (`GET /api/reports/:id/download`)
- Generates signed URL for secure file download
- URL expires in 10 minutes
- Returns download URL and metadata

## S3 Service Functions

### `uploadFile(fileBuffer, fileName, mimeType, folder)`
Uploads a file buffer to S3 and returns URL and key.

### `deleteFile(key)`
Deletes an object from S3 by key.

### `getSignedUrl(key, expiresIn)`
Generates a signed download URL (default: 10 minutes).

### `fileExists(key)`
Checks if an object exists in S3.

### `getFileMetadata(key)`
Gets object metadata from S3.

## File Processing Flow

1. **Upload**: File uploaded via multer to local temp directory
2. **S3 Upload**: File buffer uploaded to S3
3. **Database**: S3 metadata stored in database
4. **Cleanup**: Local file deleted
5. **Processing**: OCR processing downloads from S3 if needed
6. **Cleanup**: Temporary files cleaned up after processing

## Security Features

- Files stored with private ACL (not publicly accessible)
- Server-side encryption (AES256)
- Signed URLs for secure downloads
- Access control via IAM policies

## Error Handling

- Graceful fallback if S3 operations fail
- Local file cleanup on errors
- Comprehensive logging for debugging
- Database consistency maintained

## Performance Considerations

- Files downloaded temporarily for OCR processing
- Consider implementing stream-based processing for large files
- S3 transfer acceleration can be enabled for better performance
- CDN integration possible for public files

## Monitoring

- All S3 operations are logged
- Error tracking for failed operations
- Metrics for upload/download success rates
- Cost monitoring for S3 usage

## Rollback

To rollback S3 integration:
```bash
node scripts/add-s3-fields.js down
```

This will remove S3 fields and make `filePath` required again.

## Troubleshooting

### Common Issues

1. **AWS Credentials**: Ensure credentials are correctly set in `.env`
2. **S3 Permissions**: Verify IAM user has S3 read/write permissions
3. **Bucket Access**: Ensure bucket exists and is in correct region
4. **Network Issues**: Check firewall and network connectivity

### Debug Commands

```bash
# Test S3 connection
node -e "
const { s3 } = require('./config/aws');
s3.listBuckets().promise()
  .then(data => console.log('S3 connection successful:', data.Buckets))
  .catch(err => console.error('S3 connection failed:', err));
"
```

## Cost Optimization

- Use S3 Intelligent Tiering for automatic cost optimization
- Set up lifecycle policies for old files
- Monitor usage with AWS Cost Explorer
- Consider S3 Standard-IA for infrequently accessed files
