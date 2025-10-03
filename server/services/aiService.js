const axios = require('axios');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.googleTranslateApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  }

  // Medical term simplification using Hugging Face models
  async simplifyMedicalTerms(text, targetLanguage = 'english') {
    try {
      const models = {
        'english': 'microsoft/BioClinicalBERT',
        'hindi': 'ai4bharat/indic-bert',
        'spanish': 'dccuchile/bert-base-spanish-wwm-uncased'
      };

      const model = models[targetLanguage] || models['english'];
      
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          inputs: text,
          parameters: {
            max_length: 512,
            temperature: 0.7,
            do_sample: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.huggingfaceApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error simplifying medical terms:', error);
      throw new Error('Failed to simplify medical terms');
    }
  }

  // Extract medical entities from text
  async extractMedicalEntities(text) {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/dmis-lab/biobert-base-cased-v1.1',
        {
          inputs: text,
          parameters: {
            aggregation_strategy: 'simple'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.huggingfaceApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error extracting medical entities:', error);
      throw new Error('Failed to extract medical entities');
    }
  }

  // Generate health recommendations
  async generateHealthRecommendations(medicalData, userProfile) {
    try {
      const prompt = `
        Based on the following medical report data and user profile, provide personalized health recommendations:
        
        Medical Data: ${JSON.stringify(medicalData)}
        User Profile: ${JSON.stringify(userProfile)}
        
        Please provide:
        1. Dietary recommendations
        2. Lifestyle changes
        3. Exercise suggestions
        4. Follow-up actions
        5. Warning signs to watch for
        
        Format as JSON with categories and specific recommendations.
      `;

      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'llama-2-70b-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a medical AI assistant that provides personalized health recommendations based on medical data. Always recommend consulting with healthcare professionals for serious conditions.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      logger.error('Error generating health recommendations:', error);
      throw new Error('Failed to generate health recommendations');
    }
  }

  // Chat with AI assistant
  async chatWithAI(message, context = {}, language = 'english') {
    try {
      const systemPrompt = `
        You are a medical AI assistant helping patients understand their health reports. 
        You should:
        - Provide clear, simple explanations
        - Use patient-friendly language
        - Always recommend consulting healthcare professionals for serious concerns
        - Be empathetic and supportive
        - Respond in ${language}
        
        Context: ${JSON.stringify(context)}
      `;

      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'llama-2-70b-chat',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('Error in AI chat:', error);
      throw new Error('Failed to process chat message');
    }
  }

  // Translate text to target language
  async translateText(text, targetLanguage, sourceLanguage = 'auto') {
    try {
      const response = await axios.post(
        'https://translation.googleapis.com/language/translate/v2',
        {
          q: text,
          target: targetLanguage,
          source: sourceLanguage,
          format: 'text'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.googleTranslateApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data.translations[0].translatedText;
    } catch (error) {
      logger.error('Error translating text:', error);
      throw new Error('Failed to translate text');
    }
  }

  // Analyze report risk level
  async analyzeRiskLevel(medicalData) {
    try {
      const prompt = `
        Analyze the following medical data and determine the risk level:
        
        Medical Data: ${JSON.stringify(medicalData)}
        
        Risk levels: low, medium, high, critical
        
        Consider:
        - Abnormal values
        - Critical markers
        - Urgency indicators
        - Follow-up requirements
        
        Respond with only the risk level and a brief explanation.
      `;

      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'llama-2-70b-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a medical AI that analyzes risk levels. Be conservative and prioritize patient safety.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data.choices[0].message.content;
      const riskLevel = result.toLowerCase().match(/(low|medium|high|critical)/)?.[0] || 'medium';
      
      return {
        riskLevel,
        explanation: result
      };
    } catch (error) {
      logger.error('Error analyzing risk level:', error);
      return { riskLevel: 'medium', explanation: 'Unable to analyze risk level' };
    }
  }

  // Generate report summary
  async generateReportSummary(originalText, simplifiedText, medicalTerms) {
    try {
      const prompt = `
        Generate a concise summary of this medical report:
        
        Original Text: ${originalText.substring(0, 1000)}...
        Simplified Text: ${simplifiedText.substring(0, 1000)}...
        Key Medical Terms: ${JSON.stringify(medicalTerms)}
        
        Provide:
        1. Overall health status
        2. Key findings
        3. Areas of concern
        4. Next steps
        
        Keep it under 200 words and use simple language.
      `;

      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'llama-2-70b-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a medical AI that creates patient-friendly report summaries.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.5
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('Error generating report summary:', error);
      return 'Unable to generate summary at this time.';
    }
  }
}

module.exports = new AIService();
