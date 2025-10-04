const express = require('express');
const { body, validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// Simple validation
const validateMessage = [
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters')
];

// Simple chat endpoint without database dependencies
router.post('/message', validateMessage, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { message } = req.body;
    const startTime = Date.now();

    let aiResponse;
    let aiModel = 'n8n-rag';

    // Try n8n RAG first
    try {
      if (process.env.RAG_CHAT_WEBHOOK_URL) {
        logger.info('🤖 Querying n8n RAG system...');
        logger.info(`   Question: "${message}"`);
        
        const ragPayload = {
          chatInput: message,
          sessionId: 'web-session-' + Date.now(),
          userId: 'anonymous-user',
          language: 'english'
        };

        logger.info(`📤 Sending to n8n RAG...`);

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
            logger.info(`✅ Using RAG response: "${aiResponse.substring(0, 100)}..."`);
            aiModel = 'n8n-rag';
          } else {
            throw new Error('Empty RAG response');
          }
        } else {
          throw new Error(`RAG failed: ${ragResponse.status}`);
        }
      } else {
        throw new Error('RAG not configured');
      }
    } catch (ragError) {
      logger.warn('⚠️ RAG error, using fallback AI:', ragError.message);
      
      // Fallback to regular AI
      const context = {
        timestamp: new Date().toISOString(),
        sessionType: 'web'
      };
      aiResponse = await aiService.chatWithAI(message, context, 'english');
      aiModel = 'perplexity-fallback';
    }

    const processingTime = Date.now() - startTime;

    logger.info(`Chat message processed successfully in ${processingTime}ms`);

    // Simple response format
    res.json({
      id: Date.now().toString(),
      message: aiResponse,
      timestamp: new Date().toISOString(),
      processingTime: processingTime,
      success: true
    });

  } catch (error) {
    logger.error('Chat endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Sorry, I encountered an error. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check for chat service
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Chat Service',
    aiService: aiService.isAvailable(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;