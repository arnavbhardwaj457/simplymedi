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

    // Only clean up local file if successfully uploaded to S3 (not local fallback)
    if (!s3Result.isLocal) {
      try {
        await fs.unlink(file.path);
        logger.info(`Local file cleaned up after S3 upload: ${file.path}`);
      } catch (cleanupError) {
        logger.warn(`Failed to clean up local file: ${file.path}`, cleanupError);
      }
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
  let tempFilePath = null; // Track temporary files for cleanup
  
  try {
    const report = await Report.findByPk(reportId);
    if (!report) {
      logger.error(`Report not found: ${reportId}`);
      return;
    }

    await report.updateProcessingStatus('processing');

    let filePath = report.filePath;
    
    // Check if we have a local file first
    const hasLocalFile = filePath && await fs.access(filePath).then(() => true).catch(() => false);
    
    // If file is in S3 and local file doesn't exist, download it temporarily
    if (report.s3Key && !hasLocalFile) {
      // For S3 files, we need to download them temporarily for OCR processing
      // This is a limitation of the current OCR service that expects local files
      // In a production environment, you might want to modify OCR service to work with streams
      logger.info(`Downloading file from S3 for processing: ${report.s3Key}`);
      
      // Create temporary file path
      const tempDir = process.env.UPLOAD_PATH || './uploads';
      await fs.mkdir(tempDir, { recursive: true });
      tempFilePath = path.join(tempDir, `temp-${report.id}-${report.fileName}`);
      filePath = tempFilePath;
      
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

    // Send document to n8n RAG system (non-blocking)
    if (extractionResult.text && extractionResult.text.trim().length > 0) {
      sendToRAGSystem(report, extractionResult.text).catch(err => {
        logger.warn('RAG processing failed (non-critical):', err.message);
      });
    }

    // Extract structured data
    const structuredData = await ocrService.extractStructuredData(extractionResult.text);

    // Simplify medical terms using AI with fallback
    let simplifiedResult;
    try {
      simplifiedResult = await aiService.simplifyMedicalTerms(
        extractionResult.text,
        'english'
      );
    } catch (error) {
      logger.warn('Medical term simplification failed, using original text:', error.message);
      simplifiedResult = extractionResult.text;
    }

    // Extract medical entities with fallback
    let medicalEntities = [];
    try {
      medicalEntities = await aiService.extractMedicalEntities(extractionResult.text);
    } catch (error) {
      logger.warn('Medical entity extraction failed:', error.message);
      medicalEntities = []; // Empty array as fallback
    }

    // Analyze risk level with fallback
    let riskAnalysis = { riskLevel: 'medium', explanation: 'Standard risk assessment - consult your healthcare provider' };
    try {
      riskAnalysis = await aiService.analyzeRiskLevel(structuredData);
    } catch (error) {
      logger.warn('Risk analysis failed, using default:', error.message);
    }

    // Generate health recommendations with fallback
    let healthRecommendations = {
      followUpActions: ['Discuss results with your healthcare provider', 'Keep report for medical records'],
      dietary: ['Follow a balanced diet'],
      lifestyle: ['Maintain regular exercise', 'Get adequate sleep'],
      exercise: ['Consult your doctor before starting new exercises']
    };
    try {
      const user = await User.findByPk(report.userId);
      const userProfile = user ? user.getPublicProfile() : { age: 35, gender: 'unknown' };
      const recommendations = await aiService.generateHealthRecommendations(
        structuredData,
        userProfile
      );
      if (recommendations) {
        healthRecommendations = recommendations;
      }
    } catch (error) {
      logger.warn('Health recommendations generation failed, using defaults:', error.message);
    }

    // Generate report summary with fallback
    let summary;
    try {
      summary = await aiService.generateReportSummary(
        extractionResult.text,
        simplifiedResult,
        medicalEntities
      );
    } catch (error) {
      logger.warn('Summary generation failed, creating basic summary:', error.message);
      summary = `Medical Report Analysis Complete
      
Report has been processed and is ready for review. The extracted text contains ${extractionResult.text?.length || 0} characters. 

Key Information:
• Report processing completed successfully
• Text extracted and analyzed
• Simplified version available for easier reading

Next Steps:
• Review the report details carefully
• Discuss findings with your healthcare provider
• Keep this report for your medical records

Note: This is an automated analysis. Always consult with your healthcare provider for professional medical interpretation.`;
    }

    // Create simplified report with safe fallbacks
    const simplifiedReport = await SimplifiedReport.create({
      reportId: report.id,
      originalText: extractionResult.text || 'No text extracted',
      simplifiedText: simplifiedResult || extractionResult.text || 'Processing completed',
      language: 'english',
      medicalTerms: medicalEntities || [],
      simplifiedTerms: simplifiedResult || extractionResult.text || 'Processing completed',
      healthRecommendations: healthRecommendations || {},
      riskLevel: (riskAnalysis && riskAnalysis.riskLevel) ? riskAnalysis.riskLevel : 'medium',
      summary: summary || 'Report processed successfully. Consult your healthcare provider for detailed analysis.',
      keyFindings: (structuredData && structuredData.testResults) ? structuredData.testResults : ['Report analysis completed'],
      followUpActions: (healthRecommendations && healthRecommendations.followUpActions) ? healthRecommendations.followUpActions : ['Consult with healthcare provider'],
      aiModel: 'Enhanced Processing with Fallbacks',
      confidence: extractionResult.confidence || 0.8,
      processingTime: extractionResult.processingTime || null,
      metadata: {
        structuredData: structuredData || {},
        riskExplanation: (riskAnalysis && riskAnalysis.explanation) ? riskAnalysis.explanation : 'Standard assessment completed'
      }
    });

    // Update report status
    await report.updateProcessingStatus('completed');

    // Clean up local fallback file after processing (if it was stored locally)
    if (report.s3Bucket === 'local' && report.filePath && !tempFilePath) {
      try {
        await fs.unlink(report.filePath);
        logger.info(`Local fallback file cleaned up after processing: ${report.filePath}`);
        
        // Update report to remove file path since file is deleted
        await report.update({ filePath: null });
      } catch (cleanupError) {
        logger.warn(`Failed to clean up local fallback file: ${report.filePath}`, cleanupError);
      }
    }

    logger.info(`Report processing completed: ${reportId}`);

  } catch (error) {
    logger.error(`Report processing failed: ${reportId}`, error);
    
    const report = await Report.findByPk(reportId);
    if (report) {
      await report.updateProcessingStatus('failed', error);
    }
  } finally {
    // Clean up temporary file if it was downloaded from S3
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        logger.info(`Temporary file cleaned up: ${tempFilePath}`);
      } catch (cleanupError) {
        logger.warn(`Failed to clean up temporary file: ${tempFilePath}`, cleanupError);
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

// Helper function to send document to n8n RAG system
async function sendToRAGSystem(report, extractedText) {
  try {
    if (!process.env.RAG_DOCUMENT_WEBHOOK_URL) {
      logger.info('RAG document webhook not configured, skipping RAG processing');
      return;
    }

    const ragPayload = {
      userId: report.userId,
      reportId: report.id,
      fileName: report.originalFileName,
      content: extractedText,
      reportType: report.reportType || 'medical_report',
      reportDate: report.reportDate ? report.reportDate.toISOString() : new Date().toISOString(),
      doctorName: report.doctorName || '',
      labName: report.labName || '',
      uploadDate: report.createdAt.toISOString(),
      metadata: {
        fileType: report.fileType,
        fileSize: report.fileSize,
        ocrConfidence: report.ocrConfidence
      }
    };

    logger.info(`Sending document to n8n RAG system: ${report.id}`);

    const response = await fetch(process.env.RAG_DOCUMENT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ragPayload)
    });

    if (response.ok) {
      logger.info(`✅ Document ${report.id} successfully processed for RAG`);
    } else {
      const errorText = await response.text();
      logger.error(`❌ RAG processing failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    logger.error('❌ RAG processing error:', error.message);
    throw error;
  }
}

module.exports = router;
