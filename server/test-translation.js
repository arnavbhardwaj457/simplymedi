/**
 * Test script for Gemini-powered multilingual translation service
 * Run with: node server/test-translation.js (from root directory)
 * Or: node test-translation.js (from server directory)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

if (!GEMINI_API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

console.log('🔑 Gemini API Key found');
console.log('🚀 Initializing translation test...\n');

async function testTranslation(text, targetLanguage, context = 'general') {
  console.log(`📝 Testing: "${text}" → ${targetLanguage} (${context})`);
  
  try {
    const prompt = `You are a professional translator specializing in UI/UX and ${context} terminology.

Translate the following English text to ${targetLanguage}:
"${text}"

Requirements:
1. Maintain the same tone and formality level
2. Keep it concise and UI-friendly (same length if possible)
3. Use appropriate ${context} terminology
4. For buttons/actions, use imperative form
5. Return ONLY the translated text, no explanations

Translation:`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
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

    console.log(`✅ Result: "${translation}"\n`);
    return translation;
  } catch (error) {
    console.error(`❌ Error: ${error.response?.data?.error?.message || error.message}\n`);
    return null;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  SimplyMedi Translation Service Test Suite');
  console.log('═══════════════════════════════════════════════════\n');

  // Test 1: Simple UI translation
  console.log('TEST 1: Simple UI Translation');
  console.log('─────────────────────────────────────────────────────');
  await testTranslation('Welcome to SimplyMedi', 'Hindi', 'general');

  // Test 2: Button text
  console.log('TEST 2: Button Text Translation');
  console.log('─────────────────────────────────────────────────────');
  await testTranslation('Book Appointment', 'Spanish', 'button');

  // Test 3: Medical terminology
  console.log('TEST 3: Medical Terminology');
  console.log('─────────────────────────────────────────────────────');
  await testTranslation('Upload Medical Report', 'French', 'medical');

  // Test 4: Form label
  console.log('TEST 4: Form Label Translation');
  console.log('─────────────────────────────────────────────────────');
  await testTranslation('Enter your full name', 'Bengali', 'label');

  // Test 5: Navigation menu
  console.log('TEST 5: Navigation Menu Item');
  console.log('─────────────────────────────────────────────────────');
  await testTranslation('Dashboard', 'Tamil', 'navigation');

  // Test 6: Arabic (RTL language)
  console.log('TEST 6: RTL Language (Arabic)');
  console.log('─────────────────────────────────────────────────────');
  await testTranslation('Chat with Doctor', 'Arabic', 'button');

  // Test 7: Chinese
  console.log('TEST 7: Chinese Translation');
  console.log('─────────────────────────────────────────────────────');
  await testTranslation('View Reports', 'Chinese', 'navigation');

  // Test 8: Complex sentence
  console.log('TEST 8: Complex Sentence');
  console.log('─────────────────────────────────────────────────────');
  await testTranslation(
    'Get instant answers to your health questions',
    'German',
    'general'
  );

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ All tests completed!');
  console.log('═══════════════════════════════════════════════════');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
