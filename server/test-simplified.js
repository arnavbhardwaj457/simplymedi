// Test simplified report creation with existing extracted text
const aiService = require('./services/aiService');
const { SimplifiedReport } = require('./models');

async function testSimplifiedReportCreation() {
  try {
    const sampleMedicalText = `Medical Report
Patient Name: Mr. Rakesh Kumar
Age/Sex: 52 years / Male

Test Results:
- Blood Pressure: 140/90 mmHg (High)
- Blood Glucose: 180 mg/dL (Elevated)
- Hemoglobin: 12.5 g/dL (Normal)
- Total Cholesterol: 220 mg/dL (Borderline High)

Recommendations:
- Monitor blood pressure regularly
- Follow diabetic diet
- Regular exercise recommended`;

    console.log('🧪 Testing Simplified Report Creation...\n');
    
    console.log('1. Testing medical term simplification...');
    const simplifiedResult = await aiService.simplifyMedicalTerms(sampleMedicalText, 'english');
    console.log('✅ Simplified text created');
    console.log('Length:', simplifiedResult.length);

    console.log('\n2. Testing medical entity extraction...');
    const medicalEntities = await aiService.extractMedicalEntities(sampleMedicalText);
    console.log('✅ Medical entities extracted');
    console.log('Count:', medicalEntities.length);

    console.log('\n3. Testing risk analysis...');
    const riskAnalysis = await aiService.analyzeRiskLevel({
      testResults: ['High blood pressure', 'Elevated glucose', 'Borderline high cholesterol']
    });
    console.log('✅ Risk analysis completed');
    console.log('Risk Level:', riskAnalysis.riskLevel);
    console.log('Explanation:', riskAnalysis.explanation);

    console.log('\n4. Testing health recommendations...');
    const healthRecommendations = await aiService.generateHealthRecommendations(
      { testResults: ['High blood pressure', 'Elevated glucose'] },
      { age: 52, gender: 'male' }
    );
    console.log('✅ Health recommendations generated');
    console.log('Follow-up actions:', healthRecommendations?.followUpActions?.length || 'None');

    console.log('\n5. Testing report summary...');
    const summary = await aiService.generateReportSummary(
      sampleMedicalText,
      simplifiedResult,
      medicalEntities
    );
    console.log('✅ Summary generated');
    console.log('Summary length:', summary.length);

    console.log('\n🎉 All AI processing components working successfully!');
    console.log('\n📋 Sample Results:');
    console.log('- Simplified Text Sample:', simplifiedResult.substring(0, 100) + '...');
    console.log('- Risk Level:', riskAnalysis.riskLevel);
    console.log('- Summary Sample:', summary.substring(0, 100) + '...');
    
    console.log('\n✅ Simplified reports should now be created for new uploads!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimplifiedReportCreation();