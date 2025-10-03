const { s3Client } = require('../config/aws');
const { PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class S3Service {
  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET;
  }

  /**
   * Upload a file buffer to S3
   * @param {Buffer} fileBuffer - File buffer to upload
   * @param {string} fileName - Name for the file in S3
   * @param {string} mimeType - MIME type of the file
   * @param {string} folder - Optional folder path in S3
   * @returns {Promise<{url: string, key: string}>} S3 URL and object key
   */
  async uploadFile(fileBuffer, fileName, mimeType, folder = 'reports') {
    try {
      const key = `${folder}/${Date.now()}-${fileName}`;
      
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256'
      });

      await s3Client.send(uploadCommand);
      
      const result = {
        Location: `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
      };
      
      logger.info(`File uploaded to S3: ${key}`);
      
      return {
        url: result.Location,
        key: key,
        bucket: this.bucketName
      };
    } catch (error) {
      logger.error('S3 upload error, falling back to local storage:', error);
      
      // Fallback to local storage
      try {
        const uploadsDir = path.join(process.cwd(), 'uploads', folder);
        await fs.mkdir(uploadsDir, { recursive: true });
        
        const localKey = `${Date.now()}-${fileName}`;
        const filePath = path.join(uploadsDir, localKey);
        
        await fs.writeFile(filePath, fileBuffer);
        
        logger.info(`File uploaded locally: ${filePath}`);
        
        return {
          url: `/uploads/${folder}/${localKey}`,
          key: localKey,
          bucket: 'local',
          isLocal: true
        };
      } catch (localError) {
        logger.error('Local upload also failed:', localError);
        throw new Error('Failed to upload file to both S3 and local storage');
      }
    }
  }

  /**
   * Delete an object from S3
   * @param {string} key - S3 object key to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(key) {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await s3Client.send(deleteCommand);
      
      logger.info(`File deleted from S3: ${key}`);
      return true;
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Generate a signed download URL for a private object
   * @param {string} key - S3 object key
   * @param {number} expiresIn - Expiration time in seconds (default: 600 = 10 minutes)
   * @returns {Promise<string>} Signed URL
   */
  async getSignedUrl(key, expiresIn = 600) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      
      logger.info(`Generated signed URL for: ${key}`);
      return signedUrl;
    } catch (error) {
      logger.error('S3 signed URL error:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * Check if an object exists in S3
   * @param {string} key - S3 object key
   * @returns {Promise<boolean>} Existence status
   */
  async fileExists(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get object metadata from S3
   * @param {string} key - S3 object key
   * @returns {Promise<Object>} Object metadata
   */
  async getFileMetadata(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const result = await s3Client.send(command);
      
      return {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag
      };
    } catch (error) {
      logger.error('S3 metadata error:', error);
      throw new Error('Failed to get file metadata');
    }
  }
}

module.exports = new S3Service();