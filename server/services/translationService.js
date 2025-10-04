const axios = require('axios');
const logger = require('../utils/logger');

class TranslationService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    // Cache for translations to reduce API calls
    this.translationCache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Get cache key for translation
   */
  getCacheKey(text, targetLang, context = '') {
    return `${text}_${targetLang}_${context}`;
  }

  /**
   * Translate UI text using Gemini API with context awareness
   */
  async translateUIText(text, targetLanguage, context = 'general') {
    try {
      if (!this.geminiApiKey) {
        throw new Error('Gemini API not configured');
      }

      // Check cache first
      const cacheKey = this.getCacheKey(text, targetLanguage, context);
      const cached = this.translationCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        logger.info(`📦 Using cached translation for: ${text}`);
        return cached.translation;
      }

      // Create context-aware prompt
      const prompt = this.buildTranslationPrompt(text, targetLanguage, context);
      
      logger.info(`🌍 Translating UI text to ${targetLanguage}: "${text}"`);
      
      const response = await axios.post(
        `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }]
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const translation = response.data.candidates[0].content.parts[0].text.trim();

      // Cache the result
      this.translationCache.set(cacheKey, {
        translation,
        timestamp: Date.now()
      });

      return translation;
    } catch (error) {
      logger.error('Translation error:', error.response?.data || error.message);
      return text; // Return original text on error
    }
  }

  /**
   * Build context-aware translation prompt
   */
  buildTranslationPrompt(text, targetLanguage, context) {
    const contextDescriptions = {
      'medical': 'medical and healthcare',
      'button': 'user interface button or action',
      'label': 'form label or field name',
      'message': 'notification or message',
      'navigation': 'navigation menu item',
      'general': 'general application'
    };

    const contextDesc = contextDescriptions[context] || contextDescriptions['general'];

    return `You are a professional translator specializing in UI/UX and ${contextDesc} terminology.

Translate the following English text to ${targetLanguage}:
"${text}"

Requirements:
1. Maintain the same tone and formality level
2. Keep it concise and UI-friendly (same length if possible)
3. Use appropriate ${contextDesc} terminology
4. For buttons/actions, use imperative form
5. Preserve any placeholders like {name}, {count}, etc.
6. Return ONLY the translated text, no explanations

Translation:`;
  }

  /**
   * Translate multiple UI texts in batch
   */
  async translateBatch(texts, targetLanguage, context = 'general') {
    try {
      const translations = await Promise.all(
        texts.map(text => this.translateUIText(text, targetLanguage, context))
      );

      return texts.reduce((acc, text, index) => {
        acc[text] = translations[index];
        return acc;
      }, {});
    } catch (error) {
      logger.error('Batch translation error:', error);
      return texts.reduce((acc, text) => {
        acc[text] = text;
        return acc;
      }, {});
    }
  }

  /**
   * Translate entire UI component structure
   */
  async translateComponent(component, targetLanguage) {
    try {
      if (!this.geminiApiKey) {
        throw new Error('Gemini API not configured');
      }

      const prompt = `You are a professional UI translator. Translate all text content in this JSON component to ${targetLanguage}.

Component structure:
${JSON.stringify(component, null, 2)}

Requirements:
1. Maintain the JSON structure exactly
2. Only translate the text values, not keys
3. Keep placeholders and variables intact
4. Use appropriate UI/UX terminology
5. Return ONLY valid JSON

Translated component:`;

      const response = await axios.post(
        `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }]
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const translatedText = response.data.candidates[0].content.parts[0].text.trim();

      // Extract JSON from response
      const jsonMatch = translatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return component;
    } catch (error) {
      logger.error('Component translation error:', error.response?.data || error.message);
      return component;
    }
  }

  /**
   * Detect if text contains UI/technical terms that shouldn't be translated
   */
  shouldPreserveText(text) {
    const preservePatterns = [
      /^[A-Z_]+$/, // Constants
      /^\$\{.*\}$/, // Template variables
      /^https?:\/\//, // URLs
      /^[0-9]+$/, // Pure numbers
      /^#[0-9A-Fa-f]{6}$/, // Hex colors
    ];

    return preservePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Smart translation that preserves technical terms
   */
  async smartTranslate(text, targetLanguage, context = 'general') {
    if (this.shouldPreserveText(text)) {
      return text;
    }

    return this.translateUIText(text, targetLanguage, context);
  }

  /**
   * Translate with RTL support for Arabic
   */
  async translateWithDirection(text, targetLanguage, context = 'general') {
    const translation = await this.translateUIText(text, targetLanguage, context);
    const isRTL = ['arabic', 'hebrew', 'urdu', 'persian'].includes(targetLanguage.toLowerCase());

    return {
      text: translation,
      direction: isRTL ? 'rtl' : 'ltr',
      isRTL
    };
  }

  /**
   * Get language-specific formatting rules
   */
  getFormattingRules(language) {
    const rules = {
      'arabic': {
        direction: 'rtl',
        numberFormat: 'ar-SA',
        dateFormat: 'ar-SA',
        currency: 'SAR'
      },
      'hindi': {
        direction: 'ltr',
        numberFormat: 'hi-IN',
        dateFormat: 'hi-IN',
        currency: 'INR'
      },
      'english': {
        direction: 'ltr',
        numberFormat: 'en-US',
        dateFormat: 'en-US',
        currency: 'USD'
      },
      'french': {
        direction: 'ltr',
        numberFormat: 'fr-FR',
        dateFormat: 'fr-FR',
        currency: 'EUR'
      },
      'spanish': {
        direction: 'ltr',
        numberFormat: 'es-ES',
        dateFormat: 'es-ES',
        currency: 'EUR'
      },
      'chinese': {
        direction: 'ltr',
        numberFormat: 'zh-CN',
        dateFormat: 'zh-CN',
        currency: 'CNY'
      }
    };

    return rules[language.toLowerCase()] || rules['english'];
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.translationCache.clear();
    logger.info('🗑️ Translation cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.translationCache.size,
      entries: Array.from(this.translationCache.keys()).slice(0, 10) // First 10 entries
    };
  }
}

module.exports = new TranslationService();
