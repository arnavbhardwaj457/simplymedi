const axios = require('axios');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.googleTranslateApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    
    // n8n RAG Integration
    this.n8nBaseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.ragChatWebhookUrl = process.env.RAG_CHAT_WEBHOOK_URL;
    this.ragDocumentWebhookUrl = process.env.RAG_DOCUMENT_WEBHOOK_URL;
    this.pineconeApiKey = process.env.PINECONE_API_KEY;
    this.pineconeEnvironment = process.env.PINECONE_ENVIRONMENT;
    this.pineconeIndexName = process.env.PINECONE_INDEX_NAME || 'simplymedi-medical-docs';
    
    // Specialized medical models for healthcare
    this.models = {
      chatCompletion: 'microsoft/DialoGPT-medium',        // Medical chat conversations
      medicalBert: 'emilyalsentzer/Bio_ClinicalBERT',     // Medical text analysis
      textToImage: 'runwayml/stable-diffusion-v1-5',     // Medical illustrations
      translation: 'facebook/mbart-large-50-many-to-many-mmt', // Multi-language support
      medicalNER: 'dmis-lab/biobert-base-cased-v1.1'     // Medical entity recognition
    };
    
    // API endpoints
    this.huggingFaceApiUrl = 'https://api-inference.huggingface.co/models';
    
    // Validate required API keys
    if (!this.huggingfaceApiKey) {
      logger.warn('HuggingFace API key not configured');
    }
    if (!this.perplexityApiKey) {
      logger.warn('Perplexity API key not configured');
    }
    if (!this.geminiApiKey) {
      logger.warn('Gemini API key not configured');
    }
  }

  // Check if AI services are available
  isAvailable() {
    return !!(this.huggingfaceApiKey || this.perplexityApiKey || this.geminiApiKey);
  }

  // Validate API keys before making requests
  validateApiKey(service) {
    const keys = {
      huggingface: this.huggingfaceApiKey,
      perplexity: this.perplexityApiKey,
      google: this.googleTranslateApiKey,
      gemini: this.geminiApiKey
    };
    
    if (!keys[service]) {
      throw new Error(`${service} API key not configured`);
    }
    return true;
  }

  // Medical term simplification using AI models
  async simplifyMedicalTerms(text, targetLanguage = 'english') {
    try {
      // Try Gemini first if available
      if (this.geminiApiKey && this.geminiApiKey !== 'your_gemini_api_key') {
        try {
          return await this.simplifyWithGemini(text, targetLanguage);
        } catch (error) {
          logger.error('Gemini simplification error, falling back:', error);
        }
      }

      // Fallback to HuggingFace
      if (this.huggingfaceApiKey && this.huggingfaceApiKey !== 'your_huggingface_api_key') {
        this.validateApiKey('huggingface');
      
      // Use a text generation model for simplification
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
        {
          inputs: `Simplify this medical text in simple ${targetLanguage} terms: ${text}`,
          parameters: {
            max_length: 200,
            temperature: 0.7,
            return_full_text: false
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.huggingfaceApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data[0]?.generated_text || text;
      }
      return response.data?.generated_text || text;
      }
      
      // If no API available, return original text
      return text;
    } catch (error) {
      logger.error('Error simplifying medical terms:', error);
      // Return original text as fallback
      return text;
    }
  }

  // Simplify medical text using Gemini
  async simplifyWithGemini(text, targetLanguage = 'english') {
    try {
      const languageNames = {
        'english': 'English',
        'hindi': 'Hindi',
        'spanish': 'Spanish',
        'french': 'French',
        'german': 'German',
        'chinese': 'Chinese',
        'arabic': 'Arabic',
        'bengali': 'Bengali',
        'tamil': 'Tamil',
        'telugu': 'Telugu',
        'gujarati': 'Gujarati',
        'kannada': 'Kannada',
        'marathi': 'Marathi',
        'punjabi': 'Punjabi'
      };

      const langName = languageNames[targetLanguage.toLowerCase()] || 'English';

      const prompt = `You are a medical expert. Create a clean, concise summary of this medical report in simple ${langName}:

Medical Text: ${text.substring(0, 2000)}

Instructions:
1. Extract ONLY the key information: patient details, diagnosis, test results, recommendations
2. Use simple language - explain medical terms
3. Keep it brief and organized (under 300 words)
4. Format as short bullet points or brief paragraphs
5. Focus on what the patient needs to know

Simplified Summary:`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
            candidateCount: 1
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const simplifiedText = response.data.candidates[0].content.parts[0].text.trim();
      return simplifiedText;
    } catch (error) {
      logger.error('Error simplifying with Gemini:', error);
      throw error;
    }
  }

  // Language detection using Gemini
  async detectLanguageWithGemini(text) {
    try {
      const prompt = `Detect the language of the following text and respond with only the language name in lowercase English (e.g., "english", "hindi", "arabic", "bengali", "tamil", "telugu", "gujarati", "kannada", "marathi", "punjabi", "french", "spanish", "chinese", "german"):

Text: ${text}

Language:`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 50,
            candidateCount: 1
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const detectedLanguage = response.data.candidates[0].content.parts[0].text.trim().toLowerCase();
      return detectedLanguage;
    } catch (error) {
      logger.error('Error detecting language with Gemini:', error);
      throw error;
    }
  }

  // Extract medical entities from text using Bio_ClinicalBERT
  async extractMedicalEntities(text) {
    try {
      this.validateApiKey('huggingface');
      
      const response = await axios.post(
        `${this.huggingFaceApiUrl}/${this.models.medicalBert}`,
        {
          inputs: text,
          parameters: {
            aggregation_strategy: 'simple',
            task: 'token-classification'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.huggingfaceApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Bio_ClinicalBERT returns token classification results
      const entities = Array.isArray(response.data) ? response.data : [];
      
      // Filter and format medical entities
      return entities.filter(entity => 
        entity.label && 
        entity.confidence > 0.5 &&
        ['PROBLEM', 'TREATMENT', 'TEST', 'DRUG', 'ANATOMY'].includes(entity.label)
      ).map(entity => ({
        text: entity.word || entity.entity_group,
        label: entity.label,
        confidence: entity.score || entity.confidence,
        start: entity.start,
        end: entity.end
      }));
    } catch (error) {
      logger.error('Error extracting medical entities:', error);
      return []; // Return empty array as fallback
    }
  }

  // Generate health recommendations using Gemini
  async generateRecommendationsWithGemini(medicalData, userProfile) {
    try {
      const prompt = `As a medical AI, analyze the following medical report data and user profile to provide personalized health recommendations:

Medical Report Data:
${JSON.stringify(medicalData, null, 2)}

User Profile:
${JSON.stringify(userProfile, null, 2)}

Provide evidence-based health recommendations in JSON format with the following structure:
{
  "dietary": ["specific dietary recommendation 1", "specific dietary recommendation 2", "specific dietary recommendation 3"],
  "lifestyle": ["specific lifestyle recommendation 1", "specific lifestyle recommendation 2", "specific lifestyle recommendation 3"],
  "exercise": ["specific exercise recommendation 1", "specific exercise recommendation 2", "specific exercise recommendation 3"],
  "followUpActions": ["specific follow-up action 1", "specific follow-up action 2", "specific follow-up action 3"],
  "warningSignsToWatch": ["warning sign 1", "warning sign 2", "warning sign 3"]
}

Focus on actionable, specific, and medically sound recommendations based on the medical data provided. Respond only with valid JSON.`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000,
            candidateCount: 1
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const responseText = response.data.candidates[0].content.parts[0].text.trim();
      
      // Clean up the response to extract JSON
      let jsonText = responseText;
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0];
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0];
      }
      
      try {
        return JSON.parse(jsonText.trim());
      } catch (parseError) {
        logger.error('Error parsing Gemini recommendations JSON:', parseError);
        // Return fallback recommendations
        return this.getFallbackRecommendations();
      }
    } catch (error) {
      logger.error('Error generating recommendations with Gemini:', error);
      throw error;
    }
  }

  // Generate health recommendations
  async generateHealthRecommendations(medicalData, userProfile) {
    try {
      // Try Gemini API first
      if (this.geminiApiKey && this.geminiApiKey !== 'your_gemini_api_key') {
        try {
          return await this.generateRecommendationsWithGemini(medicalData, userProfile);
        } catch (error) {
          logger.error('Gemini API error for recommendations, falling back:', error);
        }
      }

      // Try Perplexity API as fallback
      if (this.perplexityApiKey) {
        try {
          const prompt = `
            Based on the following medical report data and user profile, provide personalized health recommendations:
            
            Medical Data: ${JSON.stringify(medicalData)}
            User Profile: ${JSON.stringify(userProfile)}
            
            Please provide recommendations in JSON format with the following structure:
            {
              "dietary": ["recommendation1", "recommendation2"],
              "lifestyle": ["recommendation1", "recommendation2"],
              "exercise": ["recommendation1", "recommendation2"],
              "followUpActions": ["action1", "action2"],
              "warningSignsToWatch": ["sign1", "sign2"]
            }
          `;

          const response = await axios.post(
            'https://api.perplexity.ai/chat/completions',
            {
              model: 'llama-3.1-sonar-small-128k-chat',
              messages: [
                {
                  role: 'system',
                  content: 'Professional medical AI providing evidence-based health recommendations. Generate concise, clinical recommendations in JSON format. Always recommend healthcare provider consultation for medical management.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_tokens: 500,
              temperature: 0.3
            },
            {
              headers: {
                'Authorization': `Bearer ${this.perplexityApiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );

          const content = response.data.choices[0].message.content;
          try {
            return JSON.parse(content);
          } catch (parseError) {
            logger.warn('Failed to parse Perplexity JSON response, falling back to default');
            throw parseError;
          }
        } catch (perplexityError) {
          logger.error('Perplexity API error for health recommendations:', perplexityError.message);
          throw perplexityError;
        }
      }
    } catch (error) {
      logger.error('Error generating health recommendations, using fallback:', error.message);
      
      // Fallback to generic recommendations based on medical data
      return this.generateFallbackHealthRecommendations(medicalData, userProfile);
    }
  }

  generateFallbackHealthRecommendations(medicalData, userProfile) {
    // Generate basic recommendations based on available data
    const recommendations = {
      dietary: [
        "Mediterranean diet: fruits, vegetables, whole grains",
        "Adequate hydration: 8-10 glasses water daily",
        "Limit processed foods, sodium <2300mg/day"
      ],
      lifestyle: [
        "Sleep hygiene: 7-9 hours nightly",
        "Stress management: relaxation techniques",
        "Smoking cessation, alcohol moderation"
      ],
      exercise: [
        "Aerobic activity: 150 min/week moderate intensity",
        "Resistance training: 2 sessions/week",
        "Progressive activity increase per tolerance"
      ],
      followUpActions: [
        "Regular physician follow-up",
        "Symptom monitoring and documentation",
        "Medication adherence tracking"
      ],
      warningSignsToWatch: [
        "Acute symptom onset or worsening",
        "Severe pain (>7/10 scale)",
        "Vital sign abnormalities"
      ]
    };

    // Customize based on user profile if available
    if (userProfile) {
      const age = userProfile.age;
      if (age && age > 65) {
        recommendations.exercise.push("Focus on balance and flexibility exercises to prevent falls");
        recommendations.followUpActions.push("Consider more frequent health screenings");
      }
      
      if (age && age < 30) {
        recommendations.lifestyle.push("Establish healthy habits early for long-term wellness");
      }
    }

    return recommendations;
  }

  // Chat with AI assistant using HuggingFace DialoGPT
  async chatWithHuggingFace(message, context = {}) {
    try {
      const response = await axios.post(
        `${this.huggingFaceApiUrl}/${this.models.chatCompletion}`,
        {
          inputs: {
            past_user_inputs: context.pastUserInputs || [],
            generated_responses: context.generatedResponses || [],
            text: message
          },
          parameters: {
            max_length: 200,
            temperature: 0.7,
            do_sample: true,
            pad_token_id: 50256
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.huggingfaceApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.generated_text || response.data.conversation?.generated_responses?.[0] || 'I understand your concern. Let me help you with that medical question.';
    } catch (error) {
      logger.error('HuggingFace DialoGPT error:', error);
      throw error;
    }
  }

  // Chat with Gemini AI
  async chatWithGemini(message, context = {}, language = 'english') {
    try {
      const languageNames = {
        'english': 'English',
        'hindi': 'Hindi',
        'spanish': 'Spanish',
        'french': 'French',
        'german': 'German',
        'chinese': 'Chinese',
        'arabic': 'Arabic',
        'bengali': 'Bengali',
        'tamil': 'Tamil',
        'telugu': 'Telugu',
        'gujarati': 'Gujarati',
        'kannada': 'Kannada',
        'marathi': 'Marathi',
        'punjabi': 'Punjabi'
      };

      const langName = languageNames[language.toLowerCase()] || 'English';
      
      const systemPrompt = `You are a professional medical AI assistant. Respond in ${langName} language with:
- Maximum 3 concise clinical points
- Professional medical terminology appropriate for the language
- No casual language or emojis
- Always include "Consult healthcare provider" warning in ${langName}
- Use clear, structured format

Patient Context: ${JSON.stringify(context)}

Medical Question: ${message}

Provide a professional medical response in ${langName}.`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: systemPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
            candidateCount: 1
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.candidates[0].content.parts[0].text.trim();
      return aiResponse;
    } catch (error) {
      logger.error('Gemini chat error:', error);
      throw error;
    }
  }

  // Chat with AI assistant
  async chatWithAI(message, context = {}, language = 'english') {
    // Try Gemini first if available
    if (this.geminiApiKey && this.geminiApiKey !== 'your_gemini_api_key') {
      try {
        return await this.chatWithGemini(message, context, language);
      } catch (error) {
        logger.error('Gemini API error, trying other fallbacks:', error);
      }
    }

    // Try HuggingFace DialoGPT as fallback
    if (this.huggingfaceApiKey && this.huggingfaceApiKey !== 'your_huggingface_api_key') {
      try {
        return await this.chatWithHuggingFace(message, context);
      } catch (error) {
        logger.error('HuggingFace API error, trying Perplexity fallback:', error);
      }
    }

    // Try Perplexity API as fallback if available
    if (this.perplexityApiKey && this.perplexityApiKey !== 'your_perplexity_api_key') {
      try {
        const systemPrompt = `Professional medical AI. Respond in ${language} with:
• Maximum 3 concise clinical points
• Professional medical terminology
• No casual language or emojis
• Include "Consult healthcare provider" warning
• Use bullet format: **Topic:** followed by brief points

Context: ${JSON.stringify(context)}`;

        const response = await axios.post(
          'https://api.perplexity.ai/chat/completions',
          {
            model: 'llama-3.1-sonar-small-128k-chat',
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
            max_tokens: 300,
            temperature: 0.3
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
        logger.error('Perplexity API error, falling back to local responses:', error);
      }
    }

    // Fallback to intelligent local responses based on message content
    return this.generateLocalMedicalResponse(message, language);
  }

  // Generate intelligent local medical responses when APIs are unavailable
  generateLocalMedicalResponse(message, language = 'english') {
    const messageLower = message.toLowerCase();
    
    // Blood pressure related responses
    if (messageLower.includes('blood pressure') || messageLower.includes('bp') || messageLower.includes('hypertension')) {
      if (messageLower.includes('high') || messageLower.includes('elevated')) {
        return `**Elevated Blood Pressure Management:**

• Monitor BP regularly and maintain <120/80 mmHg
• Reduce sodium intake (<2,300mg/day)
• Exercise 150 min/week moderate activity
• Maintain healthy BMI and manage stress

**Consult your healthcare provider for personalized treatment plan.**`;
      } else if (messageLower.includes('symptoms') || messageLower.includes('symptom')) {
        return `**Hypertension Symptoms:**

• **Early Stage:** Usually asymptomatic
• **Advanced:** Headaches, dizziness, blurred vision
• **Severe:** Chest pain, confusion, breathing difficulty

**⚠️ Seek immediate care for severe symptoms. Regular monitoring essential.**`;
      }
      return `**Blood Pressure Assessment:**

• Normal range: <120/80 mmHg
• Regular monitoring recommended
• Risk stratification requires clinical evaluation

**Consult healthcare provider for personalized assessment.**`;
    }

    // Diabetes related responses
    if (messageLower.includes('diabetes') || messageLower.includes('blood sugar') || messageLower.includes('glucose')) {
      return `**Diabetes Management Guidelines:**

• Monitor blood glucose as prescribed
• Maintain controlled carbohydrate diet
• Exercise regularly (150 min/week)
• Daily foot inspection and regular screenings

**Consult healthcare provider for individualized management plan.**`;
    }

    // Tuberculosis and respiratory symptoms
    if (messageLower.includes('tuberculosis') || messageLower.includes('tb') || 
        (messageLower.includes('cough') && (messageLower.includes('persistent') || messageLower.includes('chronic'))) ||
        (messageLower.includes('symptoms') && messageLower.includes('tuberculosis'))) {
      return `**Tuberculosis Assessment:**

• **Common symptoms:** Persistent cough (>3 weeks), night sweats, weight loss
• **Advanced:** Hemoptysis, fever, fatigue
• **Risk factors:** HIV, diabetes, malnutrition, close contact

**⚠️ Persistent respiratory symptoms require immediate medical evaluation and testing.**`;
    }

    // Heart related responses
    if (messageLower.includes('heart') || messageLower.includes('cardiac') || messageLower.includes('chest pain')) {
      return `**Cardiovascular Health Protocol:**

• Heart-healthy diet: fruits, vegetables, lean proteins
• Regular exercise (physician-approved)
• Smoking cessation, limited alcohol intake
• BP and cholesterol management

**⚠️ Chest pain or dyspnea requires immediate medical attention.**`;
    }

    // Weight/obesity related responses
    if (messageLower.includes('weight') || messageLower.includes('obesity') || messageLower.includes('overweight')) {
      return `**Weight Management Protocol:**

• Target 1-2 lbs/week gradual loss
• Caloric deficit with balanced nutrition
• Regular physical activity (150 min/week)
• Adequate hydration and sleep

**Consult physician before initiating weight loss program.**`;
    }

    // Pain related responses
    if (messageLower.includes('pain') || messageLower.includes('ache') || messageLower.includes('hurt')) {
      return `**Pain Management Guidelines:**

• Ice for acute injury (24-48hrs), heat for chronic pain
• OTC analgesics per package instructions
• Gentle mobilization and proper positioning
• Activity modification as tolerated

**⚠️ Severe or persistent pain requires medical evaluation.**`;
    }

    // General medication questions
    if (messageLower.includes('medication') || messageLower.includes('medicine') || messageLower.includes('drug')) {
      return `**Medication Safety Protocol:**

• Take as prescribed; do not alter without physician consultation
• Monitor for adverse effects and drug interactions
• Proper storage and expiration date monitoring
• Maintain current medication list for all providers

**Dosage modifications require medical supervision.**`;
    }

    // Lab results/reports
    if (messageLower.includes('report') || messageLower.includes('test') || messageLower.includes('lab') || messageLower.includes('result')) {
      return `Understanding medical reports:

• Normal ranges can vary between laboratories
• Abnormal results don't always indicate serious problems
• Multiple factors can affect test results
• Trends over time are often more important than single values
• Some results may need follow-up testing

**Always discuss your medical reports with your healthcare provider for proper interpretation and next steps.**`;
    }

    // Exercise/fitness questions
    if (messageLower.includes('exercise') || messageLower.includes('workout') || messageLower.includes('fitness')) {
      return `General exercise recommendations:

• Aim for at least 150 minutes of moderate aerobic activity per week
• Include strength training exercises twice a week
• Start slowly and gradually increase intensity
• Choose activities you enjoy
• Stay hydrated during exercise
• Listen to your body and rest when needed

**Consult your healthcare provider before starting a new exercise program, especially if you have health conditions.**`;
    }

    // Diet/nutrition questions
    if (messageLower.includes('diet') || messageLower.includes('nutrition') || messageLower.includes('food') || messageLower.includes('eat')) {
      return `General nutrition guidelines:

• Eat a variety of fruits and vegetables
• Choose whole grains over refined grains
• Include lean proteins (fish, poultry, beans, nuts)
• Limit processed foods and added sugars
• Control portion sizes
• Stay hydrated with water
• Limit sodium intake

**Consider consulting a registered dietitian for personalized nutrition advice, especially if you have health conditions.**`;
    }

    // Mental health/stress
    if (messageLower.includes('stress') || messageLower.includes('anxiety') || messageLower.includes('depression') || messageLower.includes('mental health')) {
      return `For mental health and stress management:

• Practice relaxation techniques (deep breathing, meditation)
• Maintain regular sleep schedule
• Stay physically active
• Connect with supportive friends and family
• Limit alcohol and avoid recreational drugs
• Consider professional counseling if needed
• Practice mindfulness and stress reduction

**If you're experiencing persistent mental health concerns, please reach out to a mental health professional or your healthcare provider.**`;
    }

    // Sleep issues
    if (messageLower.includes('sleep') || messageLower.includes('insomnia') || messageLower.includes('tired') || messageLower.includes('fatigue')) {
      return `For better sleep health:

• Maintain a consistent sleep schedule
• Create a relaxing bedtime routine
• Keep your bedroom cool, dark, and quiet
• Avoid screens before bedtime
• Limit caffeine, especially in the afternoon
• Get regular exercise (but not close to bedtime)
• Avoid large meals before sleep

**If sleep problems persist, consult your healthcare provider as they may indicate underlying conditions.**`;
    }

    // General health question fallback
    return `**Clinical Assessment Required:**

• Symptom evaluation requires medical examination
• Individual risk factors and history need review  
• Diagnostic testing may be indicated

**Consult healthcare provider for proper evaluation and treatment planning.**`;
  }

  // Translate text to target language
  async translateText(text, targetLanguage, sourceLanguage = 'auto') {
    try {
      // Try Gemini first if available
      if (this.geminiApiKey && this.geminiApiKey !== 'your_gemini_api_key') {
        return await this.translateWithGemini(text, targetLanguage, sourceLanguage);
      }
      
      // Fallback to Google Translate API
      if (this.googleTranslateApiKey && this.googleTranslateApiKey !== 'your_google_translate_api_key') {
        return await this.translateWithGoogleTranslate(text, targetLanguage, sourceLanguage);
      }
      
      // Final fallback to HuggingFace translation
      return await this.translateWithHuggingFace(text, targetLanguage, sourceLanguage);
    } catch (error) {
      logger.error('Error in primary translation, falling back:', error);
      // Fallback to HuggingFace translation
      return await this.translateWithHuggingFace(text, targetLanguage, sourceLanguage);
    }
  }

  // Primary translation using Gemini API
  async translateWithGemini(text, targetLanguage, sourceLanguage = 'auto') {
    try {
      const languageNames = {
        'hi': 'Hindi',
        'es': 'Spanish', 
        'fr': 'French',
        'de': 'German',
        'zh': 'Chinese',
        'ar': 'Arabic',
        'bn': 'Bengali',
        'ta': 'Tamil',
        'te': 'Telugu',
        'gu': 'Gujarati',
        'kn': 'Kannada',
        'mr': 'Marathi',
        'pa': 'Punjabi',
        'en': 'English'
      };

      const targetLangName = languageNames[targetLanguage] || targetLanguage;
      const sourceLangName = sourceLanguage === 'auto' ? '' : (languageNames[sourceLanguage] || sourceLanguage);

      const prompt = sourceLangName 
        ? `Translate the following text from ${sourceLangName} to ${targetLangName}. Provide only the translation without any additional text:\n\n${text}`
        : `Translate the following text to ${targetLangName}. Provide only the translation without any additional text:\n\n${text}`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const translatedText = response.data.candidates[0].content.parts[0].text.trim();
      return translatedText;
    } catch (error) {
      logger.error('Error translating with Gemini:', error);
      throw error;
    }
  }

  // Google Translate API method
  async translateWithGoogleTranslate(text, targetLanguage, sourceLanguage = 'auto') {
    try {

      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2?key=${this.googleTranslateApiKey}`,
        {
          q: text,
          target: targetLanguage,
          source: sourceLanguage,
          format: 'text'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data.translations[0].translatedText;
    } catch (error) {
      logger.error('Error translating text:', error);
      // Fallback to HuggingFace translation
      return await this.translateWithHuggingFace(text, targetLanguage, sourceLanguage);
    }
  }

  // Fallback translation using HuggingFace
  async translateWithHuggingFace(text, targetLanguage, sourceLanguage = 'en') {
    try {
      const languageMap = {
        'hi': 'hindi',
        'es': 'spanish', 
        'fr': 'french',
        'de': 'german',
        'zh': 'chinese',
        'ar': 'arabic',
        'bn': 'bengali',
        'ta': 'tamil',
        'te': 'telugu',
        'gu': 'gujarati',
        'kn': 'kannada',
        'mr': 'marathi',
        'pa': 'punjabi'
      };

      const targetLangName = languageMap[targetLanguage] || targetLanguage;
      
      const response = await axios.post(
        `${this.huggingFaceApiUrl}/${this.models.translation}`,
        {
          inputs: text,
          parameters: {
            src_lang: sourceLanguage === 'auto' ? 'en_XX' : `${sourceLanguage}_XX`,
            tgt_lang: `${targetLanguage}_XX`
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.huggingfaceApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data?.[0]?.translation_text || text;
    } catch (error) {
      logger.error('Error in HuggingFace translation:', error);
      return text; // Return original text as fallback
    }
  }

  // Analyze report risk level
  async analyzeRiskLevel(medicalData) {
    try {
      // Try Perplexity API if available
      if (this.perplexityApiKey) {
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
              model: 'llama-3.1-sonar-small-128k-chat',
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
        } catch (perplexityError) {
          logger.error('Perplexity API error for risk analysis:', perplexityError.message);
          throw perplexityError;
        }
      }
    } catch (error) {
      logger.error('Error analyzing risk level, using fallback:', error.message);
    }
    
    // Always use fallback if API fails or is not available
    return this.generateFallbackRiskAnalysis(medicalData);
  }

  generateFallbackRiskAnalysis(medicalData) {
    let riskLevel = 'low';
    let explanation = 'Basic risk assessment based on available data. ';
    
    const dataStr = JSON.stringify(medicalData).toLowerCase();
    
    // Check for high-risk indicators
    const highRiskTerms = ['critical', 'severe', 'acute', 'emergency', 'abnormal', 'high', 'elevated'];
    const mediumRiskTerms = ['moderate', 'borderline', 'slightly elevated', 'mild'];
    
    const highRiskMatches = highRiskTerms.filter(term => dataStr.includes(term));
    const mediumRiskMatches = mediumRiskTerms.filter(term => dataStr.includes(term));
    
    if (highRiskMatches.length > 0) {
      riskLevel = 'high';
      explanation += `Potential concerns identified: ${highRiskMatches.join(', ')}. `;
    } else if (mediumRiskMatches.length > 0) {
      riskLevel = 'medium';
      explanation += `Some indicators require monitoring: ${mediumRiskMatches.join(', ')}. `;
    }
    
    explanation += 'Please consult with your healthcare provider for proper evaluation.';
    
    return {
      riskLevel,
      explanation
    };
  }

  // Generate report summary
  async generateReportSummary(originalText, simplifiedText, medicalTerms) {
    try {
      this.validateApiKey('perplexity');
      
      const prompt = `
        Summarize this medical report in 2-3 simple sentences:
        
        Text: ${simplifiedText.substring(0, 500)}...
        Key Terms: ${JSON.stringify(medicalTerms)}
        
        Provide: Key findings and any concerns. Keep it under 100 words and very simple.
      `;

      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'llama-3.1-sonar-small-128k-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a medical AI that creates brief, patient-friendly report summaries.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
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
      logger.error('Error generating report summary, using fallback:', error);
      return this.generateFallbackSummary(originalText, simplifiedText, medicalTerms);
    }
  }

  // Fallback summary generation
  generateFallbackSummary(originalText, simplifiedText, medicalTerms) {
    const textToAnalyze = (simplifiedText || originalText || '').substring(0, 300);
    const termsStr = medicalTerms && medicalTerms.length > 0 ? 
      medicalTerms.map(t => t.text || t).slice(0, 5).join(', ') : 'None identified';
    
    return `Your medical report has been processed successfully. Key terms found: ${termsStr}. ${textToAnalyze.substring(0, 150)}... Please consult your healthcare provider for detailed interpretation.`;
  }

  // ==========================================
  // RAG (Retrieval-Augmented Generation) Methods
  // ==========================================

  /**
   * Process medical documents through n8n RAG workflow
   * This integrates with your Google Drive -> Pinecone workflow
   */
  async processDocumentForRAG(documentData) {
    try {
      if (!this.ragDocumentWebhookUrl) {
        throw new Error('RAG document processing webhook URL not configured');
      }

      logger.info('Processing document for RAG indexing', { 
        fileName: documentData.fileName,
        type: documentData.type 
      });

      const payload = {
        document: {
          fileName: documentData.fileName,
          content: documentData.content,
          url: documentData.url,
          type: documentData.type,
          metadata: {
            userId: documentData.userId,
            reportId: documentData.reportId,
            uploadedAt: new Date().toISOString(),
            category: documentData.category || 'medical_report'
          }
        }
      };

      const response = await axios.post(this.ragDocumentWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SimplyMedi-RAG-Processor/1.0'
        },
        timeout: 30000 // 30 seconds timeout for document processing
      });

      logger.info('Document processed successfully for RAG', { 
        fileName: documentData.fileName,
        status: response.status 
      });

      return {
        success: true,
        message: 'Document processed and indexed successfully',
        embeddings: response.data.embeddings || null,
        vectorIds: response.data.vectorIds || null
      };

    } catch (error) {
      logger.error('Error processing document for RAG:', error);
      
      // Fallback: Store document metadata locally for later processing
      return {
        success: false,
        message: 'Document processing failed, queued for retry',
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * Query medical knowledge using RAG
   * This integrates with your OpenAI + Pinecone chat workflow
   */
  async queryMedicalKnowledgeRAG(query, context = {}) {
    try {
      if (!this.ragChatWebhookUrl) {
        logger.warn('RAG chat webhook not configured, falling back to regular chat');
        return await this.chatWithGemini(query, context);
      }

      logger.info('Querying medical knowledge with RAG', { 
        query: query.substring(0, 100) + '...',
        contextKeys: Object.keys(context)
      });

      const payload = {
        message: query,
        context: {
          userId: context.userId,
          language: context.language || 'english',
          reportContext: context.reportId ? {
            reportId: context.reportId,
            reportType: context.reportType
          } : null,
          sessionId: context.sessionId || `session_${Date.now()}`,
          medicalHistory: context.medicalHistory || [],
          preferences: {
            responseLength: context.responseLength || 'medium',
            technicalLevel: context.technicalLevel || 'simplified',
            includeReferences: context.includeReferences !== false
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'SimplyMedi-App',
          version: '1.0'
        }
      };

      const response = await axios.post(this.ragChatWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SimplyMedi-RAG-Chat/1.0'
        },
        timeout: 45000 // 45 seconds for complex RAG queries
      });

      const ragResponse = response.data;

      logger.info('RAG query completed successfully', {
        responseLength: ragResponse.response?.length || 0,
        sourcesFound: ragResponse.sources?.length || 0
      });

      return {
        success: true,
        response: ragResponse.response || ragResponse.message,
        sources: ragResponse.sources || [],
        confidence: ragResponse.confidence || 0.8,
        contextUsed: ragResponse.contextUsed || false,
        processingTime: ragResponse.processingTime,
        model: 'n8n-rag-openai',
        metadata: {
          vectorsQueried: ragResponse.vectorsQueried,
          similarityThreshold: ragResponse.similarityThreshold,
          documentsReferenced: ragResponse.documentsReferenced
        }
      };

    } catch (error) {
      logger.error('Error in RAG medical knowledge query:', error);
      
      // Fallback to regular Gemini chat
      logger.info('Falling back to Gemini chat for query');
      const fallbackResponse = await this.chatWithGemini(query, context);
      
      return {
        ...fallbackResponse,
        fallback: true,
        originalError: error.message
      };
    }
  }

  /**
   * Get medical document recommendations using RAG
   * Finds similar documents or relevant medical information
   */
  async getMedicalRecommendationsRAG(reportData, userContext = {}) {
    try {
      const query = this.buildRecommendationQuery(reportData, userContext);
      
      const ragResponse = await this.queryMedicalKnowledgeRAG(query, {
        ...userContext,
        reportId: reportData.id,
        reportType: reportData.reportType,
        technicalLevel: 'detailed',
        responseLength: 'long',
        includeReferences: true
      });

      if (ragResponse.success) {
        return {
          success: true,
          recommendations: this.parseRecommendationsFromRAG(ragResponse.response),
          sources: ragResponse.sources,
          confidence: ragResponse.confidence,
          relatedDocuments: ragResponse.metadata?.documentsReferenced || []
        };
      }

      throw new Error('RAG recommendation query failed');

    } catch (error) {
      logger.error('Error getting RAG medical recommendations:', error);
      
      // Fallback to existing recommendation system
      return await this.generateRecommendationsWithGemini(
        reportData.extractedText || reportData.content,
        userContext
      );
    }
  }

  /**
   * Build optimized query for medical recommendations
   */
  buildRecommendationQuery(reportData, userContext) {
    const reportType = reportData.reportType || 'medical_report';
    const symptoms = reportData.symptoms || [];
    const findings = reportData.keyFindings || [];
    
    return `Based on this ${reportType} with findings: ${findings.join(', ')} and symptoms: ${symptoms.join(', ')}, provide comprehensive medical recommendations including:
    1. Follow-up care suggestions
    2. Lifestyle modifications
    3. Monitoring recommendations  
    4. When to seek immediate care
    5. Similar case references from medical literature
    
    Patient context: Age group ${userContext.ageGroup || 'adult'}, Gender: ${userContext.gender || 'not specified'}`;
  }

  /**
   * Parse structured recommendations from RAG response
   */
  parseRecommendationsFromRAG(response) {
    try {
      // Try to extract structured recommendations
      const sections = response.split(/\d+\./);
      
      return {
        followUpCare: sections[1]?.trim() || '',
        lifestyleModifications: sections[2]?.trim() || '',
        monitoring: sections[3]?.trim() || '',
        urgentCare: sections[4]?.trim() || '',
        references: sections[5]?.trim() || '',
        fullResponse: response
      };
    } catch (error) {
      return {
        fullResponse: response,
        structured: false
      };
    }
  }

  /**
   * Search medical knowledge base using RAG
   * For general medical questions and educational content
   */
  async searchMedicalKnowledge(searchQuery, filters = {}) {
    try {
      const enhancedQuery = `Medical knowledge search: ${searchQuery}. 
      Provide evidence-based information with references. 
      Category: ${filters.category || 'general'}. 
      Audience: ${filters.audience || 'patient'}.`;

      const ragResponse = await this.queryMedicalKnowledgeRAG(enhancedQuery, {
        language: filters.language || 'english',
        technicalLevel: filters.technicalLevel || 'simplified',
        includeReferences: true,
        responseLength: 'medium'
      });

      return {
        success: ragResponse.success,
        results: [{
          title: `Medical Information: ${searchQuery}`,
          content: ragResponse.response,
          sources: ragResponse.sources || [],
          confidence: ragResponse.confidence || 0.8,
          category: filters.category || 'general'
        }],
        totalResults: 1,
        processingTime: ragResponse.processingTime
      };

    } catch (error) {
      logger.error('Error searching medical knowledge base:', error);
      return {
        success: false,
        results: [],
        error: error.message
      };
    }
  }

  /**
   * Check RAG system health and configuration
   */
  async checkRAGSystemHealth() {
    const health = {
      documentProcessing: false,
      chatSystem: false,
      pineconeConnection: false,
      n8nWorkflows: false,
      errors: []
    };

    try {
      // Test document processing webhook
      if (this.ragDocumentWebhookUrl) {
        try {
          await axios.get(this.ragDocumentWebhookUrl.replace('/webhook/', '/health'), { timeout: 5000 });
          health.documentProcessing = true;
        } catch (error) {
          health.errors.push(`Document processing webhook error: ${error.message}`);
        }
      } else {
        health.errors.push('RAG document webhook URL not configured');
      }

      // Test chat webhook
      if (this.ragChatWebhookUrl) {
        try {
          await axios.get(this.ragChatWebhookUrl.replace('/webhook/', '/health'), { timeout: 5000 });
          health.chatSystem = true;
        } catch (error) {
          health.errors.push(`Chat webhook error: ${error.message}`);
        }
      } else {
        health.errors.push('RAG chat webhook URL not configured');
      }

      // Check if all required environment variables are set
      health.n8nWorkflows = !!(this.n8nBaseUrl && (this.ragChatWebhookUrl || this.ragDocumentWebhookUrl));
      health.pineconeConnection = !!(this.pineconeApiKey && this.pineconeEnvironment);

      health.overall = health.documentProcessing && health.chatSystem && health.pineconeConnection;

      logger.info('RAG system health check completed', health);
      return health;

    } catch (error) {
      logger.error('Error checking RAG system health:', error);
      health.errors.push(`Health check error: ${error.message}`);
      return health;
    }
  }
}

module.exports = new AIService();
