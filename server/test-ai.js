const AIService = require('./services/aiService');
require('dotenv').config();

async function testAIService() {
  console.log('🧪 Testing AI Service...\n');

  // Test if service is available
  console.log('📡 Service availability:', AIService.isAvailable() ? '✅ Available' : '❌ Not Available');

  // Test medical term simplification
  try {
    console.log('\n🔬 Testing medical term simplification...');
    const simplifiedText = await AIService.simplifyMedicalTerms(
      'The patient presents with acute myocardial infarction and requires immediate percutaneous coronary intervention.',
      'english'
    );
    console.log('✅ Simplified text:', simplifiedText);
  } catch (error) {
    console.log('❌ Simplification error:', error.message);
  }

  // Test medical entity extraction
  try {
    console.log('\n🏥 Testing medical entity extraction...');
    const entities = await AIService.extractMedicalEntities(
      'Patient has diabetes mellitus type 2 and hypertension. Blood pressure is 160/90 mmHg.'
    );
    console.log('✅ Extracted entities:', entities);
  } catch (error) {
    console.log('❌ Entity extraction error:', error.message);
  }

  // Test AI chat
  try {
    console.log('\n💬 Testing AI chat...');
    const chatResponse = await AIService.chatWithAI(
      'What does high blood pressure mean?',
      {},
      'english'
    );
    console.log('✅ Chat response:', chatResponse);
  } catch (error) {
    console.log('❌ Chat error:', error.message);
  }

  // Test translation
  try {
    console.log('\n🌐 Testing translation...');
    const translatedText = await AIService.translateText(
      'Your blood test results are normal',
      'hi',
      'en'
    );
    console.log('✅ Translated text:', translatedText);
  } catch (error) {
    console.log('❌ Translation error:', error.message);
  }

  // Test risk analysis
  try {
    console.log('\n⚠️ Testing risk analysis...');
    const riskAnalysis = await AIService.analyzeRiskLevel({
      bloodPressure: '160/90',
      cholesterol: '250',
      bloodSugar: '140'
    });
    console.log('✅ Risk analysis:', riskAnalysis);
  } catch (error) {
    console.log('❌ Risk analysis error:', error.message);
  }

  console.log('\n🎉 AI Service test completed!');
}

// Run the test
testAIService().catch(console.error);