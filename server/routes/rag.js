const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const auth = require('../middleware/auth');
const { Report } = require('../models');
const logger = require('../utils/logger');

/**
 * @route POST /api/rag/chat
 * @desc Query medical knowledge using RAG
 * @access Private
 */
router.post('/chat', auth, async (req, res) => {
  try {
    const { query, context = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        message: 'Query is required' 
      });
    }

    // Add user context
    const enhancedContext = {
      ...context,
      userId: req.user.id,
      language: context.language || 'english'
    };

    logger.info('RAG chat query received', { 
      userId: req.user.id, 
      queryLength: query.length 
    });

    const response = await aiService.queryMedicalKnowledgeRAG(query, enhancedContext);

    res.json({
      success: true,
      data: {
        response: response.response,
        sources: response.sources || [],
        confidence: response.confidence || 0.8,
        model: response.model,
        fallback: response.fallback || false,
        processingTime: response.processingTime
      }
    });

  } catch (error) {
    logger.error('Error in RAG chat endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process RAG chat query',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/rag/process-document
 * @desc Process document for RAG indexing
 * @access Private
 */
router.post('/process-document', auth, async (req, res) => {
  try {
    const { reportId, documentData } = req.body;
    
    if (!reportId && !documentData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Report ID or document data is required' 
      });
    }

    let document = documentData;

    // If reportId provided, fetch the report
    if (reportId) {
      const report = await Report.findOne({
        where: { 
          id: reportId, 
          userId: req.user.id 
        }
      });

      if (!report) {
        return res.status(404).json({ 
          success: false, 
          message: 'Report not found' 
        });
      }

      document = {
        fileName: report.originalFileName || report.fileName,
        content: report.extractedText,
        url: report.s3Url,
        type: report.reportType,
        userId: req.user.id,
        reportId: report.id,
        category: 'medical_report'
      };
    } else {
      // Use provided document data
      document.userId = req.user.id;
    }

    logger.info('Processing document for RAG', { 
      userId: req.user.id, 
      fileName: document.fileName,
      reportId: reportId 
    });

    const result = await aiService.processDocumentForRAG(document);

    res.json({
      success: result.success,
      message: result.message,
      data: {
        embeddings: result.embeddings,
        vectorIds: result.vectorIds,
        fallback: result.fallback || false
      }
    });

  } catch (error) {
    logger.error('Error processing document for RAG:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process document for RAG',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/rag/recommendations
 * @desc Get medical recommendations using RAG
 * @access Private
 */
router.post('/recommendations', auth, async (req, res) => {
  try {
    const { reportId, reportData, userContext = {} } = req.body;

    let report = reportData;

    // If reportId provided, fetch the report
    if (reportId) {
      const dbReport = await Report.findOne({
        where: { 
          id: reportId, 
          userId: req.user.id 
        }
      });

      if (!dbReport) {
        return res.status(404).json({ 
          success: false, 
          message: 'Report not found' 
        });
      }

      report = dbReport.toJSON();
    }

    if (!report) {
      return res.status(400).json({ 
        success: false, 
        message: 'Report data is required' 
      });
    }

    // Add user context
    const enhancedContext = {
      ...userContext,
      userId: req.user.id,
      language: userContext.language || 'english'
    };

    logger.info('Getting RAG recommendations', { 
      userId: req.user.id, 
      reportType: report.reportType 
    });

    const recommendations = await aiService.getMedicalRecommendationsRAG(report, enhancedContext);

    res.json({
      success: recommendations.success,
      data: {
        recommendations: recommendations.recommendations,
        sources: recommendations.sources || [],
        confidence: recommendations.confidence || 0.8,
        relatedDocuments: recommendations.relatedDocuments || []
      }
    });

  } catch (error) {
    logger.error('Error getting RAG recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get RAG recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/rag/search
 * @desc Search medical knowledge base
 * @access Private
 */
router.get('/search', auth, async (req, res) => {
  try {
    const { 
      q: query, 
      category, 
      audience = 'patient', 
      language = 'english',
      technical_level: technicalLevel = 'simplified'
    } = req.query;

    if (!query) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }

    const filters = {
      category,
      audience,
      language,
      technicalLevel
    };

    logger.info('RAG knowledge search', { 
      userId: req.user.id, 
      query: query.substring(0, 50) + '...',
      filters 
    });

    const results = await aiService.searchMedicalKnowledge(query, filters);

    res.json({
      success: results.success,
      data: {
        results: results.results,
        totalResults: results.totalResults,
        processingTime: results.processingTime
      }
    });

  } catch (error) {
    logger.error('Error in RAG knowledge search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search medical knowledge base',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/rag/health
 * @desc Check RAG system health
 * @access Private
 */
router.get('/health', auth, async (req, res) => {
  try {
    logger.info('RAG health check requested', { userId: req.user.id });

    const health = await aiService.checkRAGSystemHealth();

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    logger.error('Error checking RAG system health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check RAG system health',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/rag/bulk-process
 * @desc Process multiple documents for RAG indexing
 * @access Private
 */
router.post('/bulk-process', auth, async (req, res) => {
  try {
    const { reportIds } = req.body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Array of report IDs is required' 
      });
    }

    // Fetch reports belonging to the user
    const reports = await Report.findAll({
      where: { 
        id: reportIds, 
        userId: req.user.id 
      }
    });

    if (reports.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No reports found' 
      });
    }

    logger.info('Bulk processing reports for RAG', { 
      userId: req.user.id, 
      reportCount: reports.length 
    });

    const results = [];

    // Process each report
    for (const report of reports) {
      try {
        const document = {
          fileName: report.originalFileName || report.fileName,
          content: report.extractedText,
          url: report.s3Url,
          type: report.reportType,
          userId: req.user.id,
          reportId: report.id,
          category: 'medical_report'
        };

        const result = await aiService.processDocumentForRAG(document);
        results.push({
          reportId: report.id,
          fileName: document.fileName,
          success: result.success,
          message: result.message,
          fallback: result.fallback || false
        });

      } catch (error) {
        results.push({
          reportId: report.id,
          fileName: report.originalFileName || report.fileName,
          success: false,
          message: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    res.json({
      success: true,
      data: {
        processed: results.length,
        successful: successCount,
        failed: failCount,
        results: results
      }
    });

  } catch (error) {
    logger.error('Error in bulk RAG processing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk process documents for RAG',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;