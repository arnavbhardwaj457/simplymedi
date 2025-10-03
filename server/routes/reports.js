const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const { Report, SimplifiedReport, User } = require('../models');
const ocrService = require('../services/ocrService');
const aiService = require('../services/aiService');
const s3Service = require('../services/s3Service');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
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
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
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

// Upload medical report
router.post('/upload', upload.single('report'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { reportType, reportDate, labName, doctorName } = req.body;
    const file = req.file;

    // Read file buffer for S3 upload
    const fileBuffer = await fs.readFile(file.path);
    
    // Upload to S3
    const s3Result = await s3Service.uploadFile(
      fileBuffer,
      file.filename,
      file.mimetype,
      'reports'
    );

    // Create report record with S3 information
    const report = await Report.create({
      userId: req.user.id,
      fileName: file.filename,
      originalFileName: file.originalname,
      filePath: file.path, // Keep local path for OCR processing
      s3Key: s3Result.key,
      s3Bucket: s3Result.bucket,
      s3Url: s3Result.url,
      fileType: path.extname(file.originalname).toLowerCase().substring(1),
      fileSize: file.size,
      mimeType: file.mimetype,
      reportType: reportType || 'other',
      reportDate: reportDate || null,
      labName: labName || null,
      doctorName: doctorName || null,
      processingStatus: 'uploaded'
    });

    logger.info(`Report uploaded to S3: ${report.id} by user ${req.user.id}`);

    // Start processing in background
    processReportAsync(report.id);

    // Clean up local file after S3 upload
    try {
      await fs.unlink(file.path);
      logger.info(`Local file cleaned up: ${file.path}`);
    } catch (cleanupError) {
      logger.warn(`Failed to clean up local file: ${file.path}`, cleanupError);
    }

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
    
    res.status(500).json({ error: 'Report upload failed' });
  }
});

// Process report asynchronously
async function processReportAsync(reportId) {
  try {
    const report = await Report.findByPk(reportId);
    if (!report) {
      logger.error(`Report not found: ${reportId}`);
      return;
    }

    await report.updateProcessingStatus('processing');

    let filePath = report.filePath;
    
    // If file is in S3 and local file doesn't exist, download it temporarily
    if (report.s3Key && !filePath) {
      // For S3 files, we need to download them temporarily for OCR processing
      // This is a limitation of the current OCR service that expects local files
      // In a production environment, you might want to modify OCR service to work with streams
      logger.info(`Downloading file from S3 for processing: ${report.s3Key}`);
      
      // Create temporary file path
      const tempDir = process.env.UPLOAD_PATH || './uploads';
      await fs.mkdir(tempDir, { recursive: true });
      filePath = path.join(tempDir, `temp-${report.id}-${report.fileName}`);
      
      // Download from S3 to temporary file
      const { s3 } = require('../config/aws');
      const s3Object = await s3.getObject({
        Bucket: report.s3Bucket,
        Key: report.s3Key
      }).promise();
      
      await fs.writeFile(filePath, s3Object.Body);
    }

    // Extract text from file
    const extractionResult = await ocrService.extractText(
      filePath,
      report.fileType,
      'english' // Default language, can be made configurable
    );

    // Update report with extracted text
    await report.update({
      extractedText: extractionResult.text,
      ocrConfidence: extractionResult.confidence || null,
      metadata: {
        ...report.metadata,
        extractionResult: {
          processingTime: extractionResult.processingTime,
          words: extractionResult.words?.length || 0,
          lines: extractionResult.lines?.length || 0
        }
      }
    });

    // Extract structured data
    const structuredData = await ocrService.extractStructuredData(extractionResult.text);

    // Simplify medical terms using AI
    const simplifiedResult = await aiService.simplifyMedicalTerms(
      extractionResult.text,
      'english'
    );

    // Extract medical entities
    const medicalEntities = await aiService.extractMedicalEntities(extractionResult.text);

    // Analyze risk level
    const riskAnalysis = await aiService.analyzeRiskLevel(structuredData);

    // Generate health recommendations
    const user = await User.findByPk(report.userId);
    const healthRecommendations = await aiService.generateHealthRecommendations(
      structuredData,
      user.getPublicProfile()
    );

    // Generate report summary
    const summary = await aiService.generateReportSummary(
      extractionResult.text,
      simplifiedResult,
      medicalEntities
    );

    // Create simplified report
    const simplifiedReport = await SimplifiedReport.create({
      reportId: report.id,
      originalText: extractionResult.text,
      simplifiedText: simplifiedResult,
      language: 'english',
      medicalTerms: medicalEntities,
      simplifiedTerms: simplifiedResult,
      healthRecommendations: healthRecommendations,
      riskLevel: riskAnalysis.riskLevel,
      summary: summary,
      keyFindings: structuredData.testResults || [],
      followUpActions: healthRecommendations.followUpActions || [],
      aiModel: 'BioClinicalBERT',
      confidence: extractionResult.confidence || null,
      processingTime: extractionResult.processingTime || null,
      metadata: {
        structuredData,
        riskExplanation: riskAnalysis.explanation
      }
    });

    // Update report status
    await report.updateProcessingStatus('completed');

    logger.info(`Report processing completed: ${reportId}`);

  } catch (error) {
    logger.error(`Report processing failed: ${reportId}`, error);
    
    const report = await Report.findByPk(reportId);
    if (report) {
      await report.updateProcessingStatus('failed', error);
    }
  } finally {
    // Clean up temporary file if it was downloaded from S3
    if (filePath && filePath.includes('temp-')) {
      try {
        await fs.unlink(filePath);
        logger.info(`Temporary file cleaned up: ${filePath}`);
      } catch (cleanupError) {
        logger.warn(`Failed to clean up temporary file: ${filePath}`, cleanupError);
      }
    }
  }
}

// Get user's reports
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    if (status) whereClause.processingStatus = status;
    if (type) whereClause.reportType = type;

    const { count, rows: reports } = await Report.findAndCountAll({
      where: whereClause,
      include: [{
        model: SimplifiedReport,
        as: 'simplifiedReport',
        required: false
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      reports: reports.map(report => ({
        id: report.id,
        fileName: report.originalFileName,
        fileType: report.fileType,
        fileSize: report.fileSize,
        reportType: report.reportType,
        reportDate: report.reportDate,
        labName: report.labName,
        doctorName: report.doctorName,
        processingStatus: report.processingStatus,
        processingError: report.processingError,
        simplifiedReport: report.simplifiedReport ? {
          id: report.simplifiedReport.id,
          summary: report.simplifiedReport.summary,
          riskLevel: report.simplifiedReport.riskLevel,
          language: report.simplifiedReport.language,
          createdAt: report.simplifiedReport.createdAt
        } : null,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get specific report
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{
        model: SimplifiedReport,
        as: 'simplifiedReport'
      }]
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      report: {
        id: report.id,
        fileName: report.originalFileName,
        fileType: report.fileType,
        fileSize: report.fileSize,
        reportType: report.reportType,
        reportDate: report.reportDate,
        labName: report.labName,
        doctorName: report.doctorName,
        processingStatus: report.processingStatus,
        processingError: report.processingError,
        extractedText: report.extractedText,
        ocrConfidence: report.ocrConfidence,
        simplifiedReport: report.simplifiedReport,
        metadata: report.metadata,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      }
    });
  } catch (error) {
    logger.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Delete report
router.delete('/:id', async (req, res) => {
  try {
    const report = await Report.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Delete file from S3 if it exists
    if (report.s3Key) {
      try {
        await s3Service.deleteFile(report.s3Key);
        logger.info(`File deleted from S3: ${report.s3Key}`);
      } catch (s3Error) {
        logger.warn(`Failed to delete file from S3: ${report.s3Key}`, s3Error);
      }
    }

    // Delete local file if it exists
    if (report.filePath) {
      try {
        await fs.unlink(report.filePath);
        logger.info(`Local file deleted: ${report.filePath}`);
      } catch (fileError) {
        logger.warn(`Failed to delete local file: ${report.filePath}`, fileError);
      }
    }

    // Delete simplified report if exists
    await SimplifiedReport.destroy({
      where: { reportId: report.id }
    });

    // Delete report
    await report.destroy();

    logger.info(`Report deleted: ${req.params.id} by user ${req.user.id}`);

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    logger.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Reprocess report
router.post('/:id/reprocess', async (req, res) => {
  try {
    const report = await Report.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Delete existing simplified report
    await SimplifiedReport.destroy({
      where: { reportId: report.id }
    });

    // Start reprocessing
    processReportAsync(report.id);

    res.json({ message: 'Report reprocessing started' });
  } catch (error) {
    logger.error('Error reprocessing report:', error);
    res.status(500).json({ error: 'Failed to reprocess report' });
  }
});

// Get signed download URL for report file
router.get('/:id/download', async (req, res) => {
  try {
    const report = await Report.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (!report.s3Key) {
      return res.status(404).json({ error: 'File not available for download' });
    }

    // Generate signed URL (expires in 10 minutes)
    const signedUrl = await s3Service.getSignedUrl(report.s3Key, 600);

    res.json({
      downloadUrl: signedUrl,
      fileName: report.originalFileName,
      expiresIn: 600
    });
  } catch (error) {
    logger.error('Error generating download URL:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

module.exports = router;
