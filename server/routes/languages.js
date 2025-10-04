const express = require('express');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// Supported languages
const SUPPORTED_LANGUAGES = {
  'english': { name: 'English', nativeName: 'English', code: 'en' },
  'hindi': { name: 'Hindi', nativeName: 'हिन्दी', code: 'hi' },
  'bengali': { name: 'Bengali', nativeName: 'বাংলা', code: 'bn' },
  'tamil': { name: 'Tamil', nativeName: 'தமிழ்', code: 'ta' },
  'telugu': { name: 'Telugu', nativeName: 'తెలుగు', code: 'te' },
  'gujarati': { name: 'Gujarati', nativeName: 'ગુજરાતી', code: 'gu' },
  'kannada': { name: 'Kannada', nativeName: 'ಕನ್ನಡ', code: 'kn' },
  'marathi': { name: 'Marathi', nativeName: 'मराठी', code: 'mr' },
  'punjabi': { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', code: 'pa' },
  'arabic': { name: 'Arabic', nativeName: 'العربية', code: 'ar' },
  'french': { name: 'French', nativeName: 'Français', code: 'fr' },
  'spanish': { name: 'Spanish', nativeName: 'Español', code: 'es' },
  'chinese': { name: 'Chinese', nativeName: '中文', code: 'zh' },
  'german': { name: 'German', nativeName: 'Deutsch', code: 'de' }
};

// Get all supported languages
router.get('/supported', (req, res) => {
  try {
    res.json({
      languages: SUPPORTED_LANGUAGES,
      count: Object.keys(SUPPORTED_LANGUAGES).length
    });
  } catch (error) {
    logger.error('Error getting supported languages:', error);
    res.status(500).json({ error: 'Failed to get supported languages' });
  }
});

// Detect language of text
router.post('/detect', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required for language detection' });
    }

    // Use Gemini for language detection
    if (aiService.geminiApiKey) {
      try {
        const detectedLanguage = await aiService.detectLanguageWithGemini(text);
        
        res.json({
          detectedLanguage,
          confidence: 0.9, // Gemini typically has high confidence
          supportedLanguage: SUPPORTED_LANGUAGES[detectedLanguage] || null,
          originalText: text
        });
      } catch (error) {
        logger.error('Language detection with Gemini failed:', error);
        // Fallback to simple detection
        const fallbackLanguage = detectLanguageFallback(text);
        res.json({
          detectedLanguage: fallbackLanguage,
          confidence: 0.6,
          supportedLanguage: SUPPORTED_LANGUAGES[fallbackLanguage] || null,
          originalText: text
        });
      }
    } else {
      // Simple fallback language detection
      const fallbackLanguage = detectLanguageFallback(text);
      res.json({
        detectedLanguage: fallbackLanguage,
        confidence: 0.5,
        supportedLanguage: SUPPORTED_LANGUAGES[fallbackLanguage] || null,
        originalText: text
      });
    }
  } catch (error) {
    logger.error('Error detecting language:', error);
    res.status(500).json({ error: 'Failed to detect language' });
  }
});

// Translate text
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'auto' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required for translation' });
    }

    if (!targetLanguage) {
      return res.status(400).json({ error: 'Target language is required' });
    }

    if (!SUPPORTED_LANGUAGES[targetLanguage]) {
      return res.status(400).json({ 
        error: 'Unsupported target language',
        supportedLanguages: Object.keys(SUPPORTED_LANGUAGES)
      });
    }

    // Translate using AI service
    const translatedText = await aiService.translateText(
      text, 
      SUPPORTED_LANGUAGES[targetLanguage].code, 
      sourceLanguage === 'auto' ? 'auto' : SUPPORTED_LANGUAGES[sourceLanguage]?.code
    );

    res.json({
      originalText: text,
      translatedText,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      targetLanguageInfo: SUPPORTED_LANGUAGES[targetLanguage]
    });
  } catch (error) {
    logger.error('Error translating text:', error);
    res.status(500).json({ error: 'Failed to translate text' });
  }
});

// Simplify medical text in target language
router.post('/simplify', async (req, res) => {
  try {
    const { text, targetLanguage = 'english' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required for simplification' });
    }

    if (!SUPPORTED_LANGUAGES[targetLanguage]) {
      return res.status(400).json({ 
        error: 'Unsupported target language',
        supportedLanguages: Object.keys(SUPPORTED_LANGUAGES)
      });
    }

    // Simplify using AI service
    const simplifiedText = await aiService.simplifyMedicalTerms(text, targetLanguage);

    res.json({
      originalText: text,
      simplifiedText,
      targetLanguage: targetLanguage,
      targetLanguageInfo: SUPPORTED_LANGUAGES[targetLanguage]
    });
  } catch (error) {
    logger.error('Error simplifying medical text:', error);
    res.status(500).json({ error: 'Failed to simplify medical text' });
  }
});

// Get language statistics for user
router.get('/stats', async (req, res) => {
  try {
    // This could be extended to show user's language usage statistics
    const stats = {
      mostUsedLanguage: 'english',
      translationsCount: 0,
      simplificationsCount: 0,
      supportedLanguagesCount: Object.keys(SUPPORTED_LANGUAGES).length
    };

    res.json({ stats });
  } catch (error) {
    logger.error('Error getting language stats:', error);
    res.status(500).json({ error: 'Failed to get language statistics' });
  }
});

// Simple fallback language detection
function detectLanguageFallback(text) {
  // Simple character-based detection for major languages
  const hindiPattern = /[\u0900-\u097F]/;
  const arabicPattern = /[\u0600-\u06FF]/;
  const chinesePattern = /[\u4e00-\u9fff]/;
  const bengaliPattern = /[\u0980-\u09FF]/;
  const tamilPattern = /[\u0B80-\u0BFF]/;
  const teluguPattern = /[\u0C00-\u0C7F]/;
  const gujaratiPattern = /[\u0A80-\u0AFF]/;
  const kannadaPattern = /[\u0C80-\u0CFF]/;
  const marathiPattern = /[\u0900-\u097F]/; // Same as Hindi
  const punjobiPattern = /[\u0A00-\u0A7F]/;

  if (hindiPattern.test(text)) return 'hindi';
  if (arabicPattern.test(text)) return 'arabic';
  if (chinesePattern.test(text)) return 'chinese';
  if (bengaliPattern.test(text)) return 'bengali';
  if (tamilPattern.test(text)) return 'tamil';
  if (teluguPattern.test(text)) return 'telugu';
  if (gujaratiPattern.test(text)) return 'gujarati';
  if (kannadaPattern.test(text)) return 'kannada';
  if (punjobiPattern.test(text)) return 'punjabi';

  // Default to English
  return 'english';
}

module.exports = router;