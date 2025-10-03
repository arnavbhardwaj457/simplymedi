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

    // Simple context without database lookups
    const context = {
      timestamp: new Date().toISOString(),
      sessionType: 'web'
    };

    // Get AI response
    const aiResponse = await aiService.chatWithAI(message, context, 'english');

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