const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Report, User } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for simple file uploads (without S3)
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `test-user-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png,txt').split(',');
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExtension} is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// Simple upload route without authentication or S3
router.post('/upload-simple', upload.single('report'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { reportType, reportDate, labName, doctorName } = req.body;
    const file = req.file;

    // Find or create a test user
    let testUser = await User.findOne({ where: { email: 'test@simplymedi.com' } });
    if (!testUser) {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@simplymedi.com',
        password: 'hashedpassword', // This won't be used
        isVerified: true
      });
    }

    // Create report record without S3
    const report = await Report.create({
      userId: testUser.id,
      fileName: file.filename,
      originalFileName: file.originalname,
      filePath: file.path,
      fileType: path.extname(file.originalname).toLowerCase().substring(1),
      fileSize: file.size,
      mimeType: file.mimetype,
      reportType: reportType || 'other',
      reportDate: reportDate || null,
      labName: labName || null,
      doctorName: doctorName || null,
      processingStatus: 'uploaded'
    });

    logger.info(`Report uploaded locally: ${report.id} for test user`);

    res.status(201).json({
      message: 'Report uploaded successfully',
      report: {
        id: report.id,
        fileName: report.originalFileName,
        fileType: report.fileType,
        fileSize: report.fileSize,
        reportType: report.reportType,
        processingStatus: report.processingStatus,
        createdAt: report.createdAt
      }
    });
  } catch (error) {
    logger.error('Report upload error:', error);
    
    // Clean up local file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        logger.warn(`Failed to clean up local file on error: ${req.file.path}`, cleanupError);
      }
    }
    
    res.status(500).json({ 
      error: 'Report upload failed',
      details: error.message 
    });
  }
});

module.exports = router;