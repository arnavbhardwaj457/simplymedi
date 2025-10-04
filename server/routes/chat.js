const express = require('express');
const { body, validationResult } = require('express-validator');
const { ChatMessage, Report, User } = require('../models');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateChatMessage = [
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters'),
  body('sessionId').optional({ values: 'null' }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return true;
    throw new Error('Invalid session ID format');
  }),
  body('reportId').optional({ values: 'null' }).custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return true;
    throw new Error('Invalid report ID format');
  }),
  body('language').optional().isIn(['english', 'hindi', 'bengali', 'tamil', 'telugu', 'kannada', 'marathi', 'gujarati', 'punjabi', 'arabic', 'french', 'mandarin'])
];

// Send message to AI chatbot
router.post('/message', validateChatMessage, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { message, sessionId, reportId, language = 'english' } = req.body;
    const startTime = Date.now();

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to use the chat feature'
      });
    }

    // Generate session ID if not provided
    const chatSessionId = sessionId || require('uuid').v4();

    // Get user's language preference (with error handling)
    let user;
    try {
      user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User account not found'
        });
      }
    } catch (dbError) {
      logger.error('Database error when fetching user:', dbError);
      // Continue without user preferences
      user = { id: req.user.id };
    }

    const userLanguage = language;

    // Build context
    let context = {
      userId: req.user.id,
      language: userLanguage,
      timestamp: new Date().toISOString()
    };

    // Add report context if reportId is provided
    if (reportId) {
      const report = await Report.findOne({
        where: {
          id: reportId,
          userId: req.user.id
        },
        include: ['simplifiedReport']
      });

      if (report && report.simplifiedReport) {
        context.report = {
          id: report.id,
          fileName: report.originalFileName,
          reportType: report.reportType,
          summary: report.simplifiedReport.summary,
          riskLevel: report.simplifiedReport.riskLevel,
          keyFindings: report.simplifiedReport.keyFindings,
          healthRecommendations: report.simplifiedReport.healthRecommendations
        };
      }
    }

    // Get recent chat history for context
    const recentMessages = await ChatMessage.findAll({
      where: {
        userId: req.user.id,
        sessionId: chatSessionId
      },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    context.recentMessages = recentMessages.map(msg => ({
      message: msg.message,
      response: msg.response,
      messageType: msg.messageType
    }));

    // Send message to n8n RAG system first, then fallback to AI service
    let aiResponse;
    let aiModel = 'n8n-rag';
    
    // ALWAYS try n8n RAG first - don't use fallback for medical questions
    try {
      if (!process.env.RAG_CHAT_WEBHOOK_URL) {
        logger.error('❌ RAG_CHAT_WEBHOOK_URL not configured!');
        throw new Error('RAG webhook not configured');
      }

      logger.info('🤖 Querying n8n RAG system...');
      logger.info(`   Question: "${message}"`);
      logger.info(`   User ID: ${req.user.id}`);
      
      const ragPayload = {
        chatInput: message,
        sessionId: chatSessionId,
        userId: req.user.id,
        reportId: reportId || null,
        language: userLanguage
      };

      logger.info(`📤 Sending to n8n: ${process.env.RAG_CHAT_WEBHOOK_URL.substring(0, 50)}...`);

      const ragResponse = await fetch(process.env.RAG_CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ragPayload)
      });

      logger.info(`📥 n8n responded with status: ${ragResponse.status}`);

      if (ragResponse.ok) {
        const ragResult = await ragResponse.json();
        logger.info(`📦 RAG Result keys: ${Object.keys(ragResult).join(', ')}`);
        
        aiResponse = ragResult.output || ragResult.response || ragResult.answer || ragResult.message;
        
        if (aiResponse && aiResponse.trim().length > 0) {
          logger.info(`✅ RAG response received: "${aiResponse.substring(0, 100)}..."`);
          logger.info(`   Response length: ${aiResponse.length} chars`);
          
          // DON'T use fallback - use RAG response even if it says "no information"
          // This is better than generic medical advice
          aiModel = 'n8n-rag';
        } else {
          logger.error('❌ Empty RAG response');
          throw new Error('Empty RAG response');
        }
      } else {
        const errorText = await ragResponse.text();
        logger.error(`❌ RAG request failed: ${ragResponse.status}`);
        logger.error(`   Error: ${errorText}`);
        throw new Error(`RAG request failed: ${ragResponse.status}`);
      }
    } catch (ragError) {
      logger.error('❌ RAG system error:', ragError.message);
      logger.error('   Stack:', ragError.stack);
      
      // Fallback to existing AI service
      try {
        aiResponse = await aiService.chatWithAI(message, context, userLanguage);
        aiModel = 'perplexity-fallback';
      } catch (aiError) {
        logger.error('AI service error:', aiError);
        // Provide final fallback response
        aiResponse = "I'm sorry, I'm experiencing technical difficulties right now. Please try again later, or contact support if the issue persists.";
        aiModel = 'fallback';
      }
    }

    const processingTime = Date.now() - startTime;

    // Save user message with error handling
    let userMessage;
    try {
      userMessage = await ChatMessage.create({
        userId: req.user.id,
        reportId: reportId || null,
        sessionId: chatSessionId,
        message: message,
        messageType: 'user',
        language: userLanguage,
        context: context,
        processingTime: processingTime
      });
    } catch (dbError) {
      logger.error('Database error saving user message:', dbError);
      // Continue without saving to database
      userMessage = {
        id: Date.now().toString(),
        message: message,
        createdAt: new Date()
      };
    }

    // Save AI response
    let aiMessage;
    try {
      aiMessage = await ChatMessage.create({
        userId: req.user.id,
        reportId: reportId || null,
        sessionId: chatSessionId,
        message: message,
        response: aiResponse,
        messageType: 'ai',
        language: userLanguage,
        aiModel: aiModel,
        context: context,
        processingTime: processingTime
      });
    } catch (dbError) {
      logger.error('Database error saving AI message:', dbError);
      // Continue without saving AI response to database
      aiMessage = {
        id: Date.now().toString() + '_ai',
        response: aiResponse,
        createdAt: new Date()
      };
    }

    logger.info(`Chat message processed: ${userMessage.id} by user ${req.user.id}`);

    res.json({
      id: aiMessage.id,
      message: aiResponse,
      sessionId: chatSessionId,
      language: userLanguage,
      processingTime: processingTime,
      timestamp: aiMessage.createdAt || new Date().toISOString(),
      success: true
    });
  } catch (error) {
    logger.error('Chat message error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Get chat history
router.get('/history', async (req, res) => {
  try {
    const { sessionId, reportId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    if (sessionId) whereClause.sessionId = sessionId;
    if (reportId) whereClause.reportId = reportId;

    const { count, rows: messages } = await ChatMessage.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      messages: messages.map(msg => ({
        id: msg.id,
        message: msg.message,
        response: msg.response,
        messageType: msg.messageType,
        sessionId: msg.sessionId,
        reportId: msg.reportId,
        language: msg.language,
        aiModel: msg.aiModel,
        confidence: msg.confidence,
        processingTime: msg.processingTime,
        isHelpful: msg.isHelpful,
        feedback: msg.feedback,
        createdAt: msg.createdAt
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Get chat sessions
router.get('/sessions', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get unique sessions with latest message info
    const sessions = await ChatMessage.findAll({
      where: { userId: req.user.id },
      attributes: [
        'sessionId',
        [require('sequelize').fn('MAX', require('sequelize').col('createdAt')), 'lastMessageAt'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'messageCount']
      ],
      group: ['sessionId'],
      order: [[require('sequelize').fn('MAX', require('sequelize').col('createdAt')), 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      sessions: sessions.map(session => ({
        sessionId: session.sessionId,
        lastMessageAt: session.dataValues.lastMessageAt,
        messageCount: parseInt(session.dataValues.messageCount)
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching chat sessions:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

// Provide feedback on AI response
router.post('/feedback/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { isHelpful, feedback } = req.body;

    const message = await ChatMessage.findOne({
      where: {
        id: messageId,
        userId: req.user.id,
        messageType: 'ai'
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await message.addFeedback(isHelpful, feedback);

    logger.info(`Feedback provided for message: ${messageId} by user ${req.user.id}`);

    res.json({ message: 'Feedback recorded successfully' });
  } catch (error) {
    logger.error('Error recording feedback:', error);
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

// Clear chat session
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const deletedCount = await ChatMessage.destroy({
      where: {
        sessionId: sessionId,
        userId: req.user.id
      }
    });

    logger.info(`Chat session cleared: ${sessionId} by user ${req.user.id}`);

    res.json({ 
      message: 'Chat session cleared successfully',
      deletedMessages: deletedCount
    });
  } catch (error) {
    logger.error('Error clearing chat session:', error);
    res.status(500).json({ error: 'Failed to clear chat session' });
  }
});

// Get messages from a specific session
router.get('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const messages = await ChatMessage.findAll({
      where: {
        sessionId: sessionId,
        userId: req.user.id
      },
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(messages);
  } catch (error) {
    logger.error('Error fetching session messages:', error);
    res.status(500).json({ error: 'Failed to fetch session messages' });
  }
});

// Get chat statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await ChatMessage.findAll({
      where: { userId: req.user.id },
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalMessages'],
        [require('sequelize').fn('COUNT', require('sequelize').fn('DISTINCT', require('sequelize').col('sessionId'))), 'totalSessions'],
        [require('sequelize').fn('AVG', require('sequelize').col('processingTime')), 'avgProcessingTime'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN "isHelpful" = true THEN 1 END')), 'helpfulResponses'],
        [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN "isHelpful" = false THEN 1 END')), 'unhelpfulResponses']
      ],
      raw: true
    });

    const result = stats[0] || {};
    
    res.json({
      totalMessages: parseInt(result.totalMessages) || 0,
      totalSessions: parseInt(result.totalSessions) || 0,
      avgProcessingTime: parseFloat(result.avgProcessingTime) || 0,
      helpfulResponses: parseInt(result.helpfulResponses) || 0,
      unhelpfulResponses: parseInt(result.unhelpfulResponses) || 0,
      satisfactionRate: result.totalMessages > 0 ? 
        ((parseInt(result.helpfulResponses) || 0) / (parseInt(result.helpfulResponses) + parseInt(result.unhelpfulResponses) || 1)) * 100 : 0
    });
  } catch (error) {
    logger.error('Error fetching chat stats:', error);
    res.status(500).json({ error: 'Failed to fetch chat statistics' });
  }
});

module.exports = router;
