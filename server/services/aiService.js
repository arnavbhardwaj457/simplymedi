const axios = require('axios');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.googleTranslateApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    
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
  }

  // Check if AI services are available
  isAvailable() {
    return !!(this.huggingfaceApiKey || this.perplexityApiKey);
  }

  // Validate API keys before making requests
  validateApiKey(service) {
    const keys = {
      huggingface: this.huggingfaceApiKey,
      perplexity: this.perplexityApiKey,
      google: this.googleTranslateApiKey
    };
    
    if (!keys[service]) {
      throw new Error(`${service} API key not configured`);
    }
    return true;
  }

  // Medical term simplification using Hugging Face models
  async simplifyMedicalTerms(text, targetLanguage = 'english') {
    try {
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
    } catch (error) {
      logger.error('Error simplifying medical terms:', error);
      // Return original text as fallback
      return text;
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

  // Generate health recommendations
  async generateHealthRecommendations(medicalData, userProfile) {
    try {
      // Try Perplexity API first
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
                  content: 'You are a medical AI assistant that provides personalized health recommendations based on medical data. Always recommend consulting with healthcare professionals for serious conditions. Respond only with valid JSON.'
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
        "Maintain a balanced diet rich in fruits and vegetables",
        "Stay adequately hydrated by drinking plenty of water",
        "Limit processed foods and excessive sodium intake"
      ],
      lifestyle: [
        "Maintain regular sleep schedule (7-9 hours per night)",
        "Manage stress through relaxation techniques",
        "Avoid smoking and limit alcohol consumption"
      ],
      exercise: [
        "Engage in regular physical activity as advised by your healthcare provider",
        "Include both cardiovascular and strength training exercises",
        "Start slowly and gradually increase intensity"
      ],
      followUpActions: [
        "Schedule regular check-ups with your healthcare provider",
        "Monitor any symptoms and report changes to your doctor",
        "Keep track of your medical history and medications"
      ],
      warningSignsToWatch: [
        "Unusual or persistent symptoms",
        "Severe pain or discomfort",
        "Changes in vital signs or overall health status"
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

  // Chat with AI assistant
  async chatWithAI(message, context = {}, language = 'english') {
    // Try HuggingFace DialoGPT first if available
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
        return `High blood pressure (hypertension) can be concerning. Here are some general recommendations:

• Monitor your blood pressure regularly
• Reduce sodium intake (less than 2,300mg per day)
• Exercise regularly (at least 30 minutes, 5 days a week)
• Maintain a healthy weight
• Limit alcohol consumption
• Manage stress through relaxation techniques
• Take prescribed medications as directed

**Important: Please consult with your healthcare provider for personalized treatment and to rule out underlying conditions.**`;
      } else if (messageLower.includes('symptoms') || messageLower.includes('symptom')) {
        return `Common symptoms of high blood pressure include:

**Early stages:** Often no symptoms (why it's called "silent killer")

**Advanced stages may include:**
• Headaches (especially in the morning)
• Dizziness or lightheadedness  
• Blurred vision
• Chest pain
• Shortness of breath
• Nausea
• Fatigue

**Severe hypertension symptoms:**
• Severe headaches
• Vision problems
• Confusion
• Chest pain
• Difficulty breathing

**⚠️ If you experience severe symptoms, seek immediate medical attention. Regular monitoring is essential as high BP often has no symptoms.**`;
      }
      return `Blood pressure is an important health indicator. Normal BP is typically below 120/80 mmHg. If you have concerns about your blood pressure, I recommend monitoring it regularly and consulting with your healthcare provider for personalized advice.`;
    }

    // Diabetes related responses
    if (messageLower.includes('diabetes') || messageLower.includes('blood sugar') || messageLower.includes('glucose')) {
      return `For diabetes management, consider these general guidelines:

• Monitor blood sugar levels as recommended by your doctor
• Follow a balanced diet with controlled carbohydrate intake
• Exercise regularly to help control blood sugar
• Take medications as prescribed
• Stay hydrated
• Check feet daily for any wounds or changes
• Regular eye and kidney checkups

**Always consult your healthcare provider for personalized diabetes management plans.**`;
    }

    // Heart related responses
    if (messageLower.includes('heart') || messageLower.includes('cardiac') || messageLower.includes('chest pain')) {
      return `Heart health is crucial. For general heart wellness:

• Eat a heart-healthy diet (fruits, vegetables, whole grains, lean proteins)
• Exercise regularly (as approved by your doctor)
• Avoid smoking and limit alcohol
• Manage stress
• Get adequate sleep (7-9 hours)
• Control blood pressure and cholesterol

**⚠️ If you're experiencing chest pain, shortness of breath, or other concerning symptoms, seek immediate medical attention.**`;
    }

    // Weight/obesity related responses
    if (messageLower.includes('weight') || messageLower.includes('obesity') || messageLower.includes('overweight')) {
      return `For healthy weight management:

• Aim for gradual weight loss (1-2 pounds per week)
• Focus on a balanced diet with portion control
• Include regular physical activity
• Stay hydrated
• Get adequate sleep
• Track your progress
• Consider consulting a nutritionist

**Consult your healthcare provider before starting any weight loss program, especially if you have underlying health conditions.**`;
    }

    // Pain related responses
    if (messageLower.includes('pain') || messageLower.includes('ache') || messageLower.includes('hurt')) {
      return `For pain management, here are some general approaches:

• Apply ice for acute injuries (first 24-48 hours)
• Use heat for muscle tension and chronic pain
• Over-the-counter pain relievers (follow package directions)
• Gentle stretching and movement when possible
• Rest the affected area
• Maintain good posture

**⚠️ Seek medical attention if pain is severe, persistent, or accompanied by other concerning symptoms.**`;
    }

    // General medication questions
    if (messageLower.includes('medication') || messageLower.includes('medicine') || messageLower.includes('drug')) {
      return `Regarding medications:

• Always take as prescribed by your healthcare provider
• Don't stop medications without consulting your doctor
• Be aware of potential side effects
• Store medications properly
• Check expiration dates
• Keep an updated list of all medications
• Inform all healthcare providers about your medications

**Never adjust dosages or stop medications without medical guidance.**`;
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
    return `Thank you for your health question. While I can provide general health information, I strongly recommend discussing your specific concerns with a qualified healthcare provider who can:

• Review your complete medical history
• Perform necessary examinations
• Order appropriate tests if needed
• Provide personalized treatment recommendations

**For urgent medical concerns, please contact your healthcare provider immediately or seek emergency care.**

Is there a specific aspect of your health question you'd like me to address with general information?`;
  }

  // Translate text to target language
  async translateText(text, targetLanguage, sourceLanguage = 'auto') {
    try {
      // If Google Translate API key is not configured, use HuggingFace translation
      if (!this.googleTranslateApiKey || this.googleTranslateApiKey === 'your_google_translate_api_key') {
        return await this.translateWithHuggingFace(text, targetLanguage, sourceLanguage);
      }

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
          model: 'llama-3.1-sonar-small-128k-chat',
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
      logger.error('Error generating report summary, using fallback:', error);
      return this.generateFallbackSummary(originalText, simplifiedText, medicalTerms);
    }
  }

  // Fallback summary generation
  generateFallbackSummary(originalText, simplifiedText, medicalTerms) {
    const textToAnalyze = (simplifiedText || originalText || '').substring(0, 500);
    const termsStr = medicalTerms && medicalTerms.length > 0 ? 
      medicalTerms.map(t => t.text || t).join(', ') : 'None identified';
    
    return `**Medical Report Summary**

**Report Analysis:** This report has been processed and simplified for better understanding. 

**Key Medical Terms Found:** ${termsStr}

**Text Sample:** ${textToAnalyze.substring(0, 200)}${textToAnalyze.length > 200 ? '...' : ''}

**Next Steps:**
• Review the simplified version with your healthcare provider
• Discuss any questions or concerns about the findings
• Follow recommended follow-up appointments
• Keep this report for your medical records

**Important:** This is an automated analysis. Always consult with your healthcare provider for professional medical interpretation and advice.`;
  }
}

module.exports = new AIService();
