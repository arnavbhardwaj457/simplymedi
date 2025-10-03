// Manual trigger to create simplified report for existing reports
const { Report, SimplifiedReport } = require('./models');
const aiService = require('./services/aiService');

async function createSimplifiedReportForLatest() {
  try {
    // Get the latest report without simplified report
    const report = await Report.findOne({
      where: {
        processingStatus: 'completed'
      },
      include: [{
        model: SimplifiedReport,
        as: 'simplifiedReport',
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    if (!report) {
      console.log('No completed reports found');
      return;
    }

    if (report.simplifiedReport) {
      console.log('Report already has simplified version');
      return;
    }

    console.log(`Creating simplified version for report ${report.id}`);
    console.log(`Original text length: ${report.extractedText?.length || 0}`);

    // Generate simplified version using AI service (will use fallbacks)
    const simplifiedText = await aiService.simplifyMedicalTerms(
      report.extractedText || 'No text extracted',
      'english'
    );

    // Extract medical entities
    const medicalEntities = await aiService.extractMedicalEntities(report.extractedText || '');

    // Analyze risk level
    const riskAnalysis = await aiService.analyzeRiskLevel({
      extractedText: report.extractedText,
      testResults: ['Medical report analysis']
    });

    // Generate health recommendations
    const healthRecommendations = await aiService.generateHealthRecommendations(
      { extractedText: report.extractedText },
      { age: 35, gender: 'unknown' } // Default profile
    );

    // Generate summary
    const summary = await aiService.generateReportSummary(
      report.extractedText || '',
      simplifiedText,
      medicalEntities
    );

    // Create simplified report
    const simplifiedReport = await SimplifiedReport.create({
      reportId: report.id,
      originalText: report.extractedText,
      simplifiedText: simplifiedText,
      language: 'english',
      medicalTerms: medicalEntities,
      simplifiedTerms: simplifiedText,
      healthRecommendations: healthRecommendations,
      riskLevel: riskAnalysis?.riskLevel || 'low',
      summary: summary,
      keyFindings: ['Automated processing completed'],
      followUpActions: healthRecommendations?.followUpActions || ['Consult with healthcare provider'],
      aiModel: 'Fallback Processing',
      confidence: 0.8,
      processingTime: null,
      metadata: {
        riskExplanation: riskAnalysis?.explanation || 'Standard risk assessment'
      }
    });

    console.log('✅ Simplified report created successfully!');
    console.log('Risk level:', simplifiedReport.riskLevel);
    console.log('Summary length:', simplifiedReport.summary?.length || 0);
    console.log('Simplified text length:', simplifiedReport.simplifiedText?.length || 0);

  } catch (error) {
    console.error('❌ Error creating simplified report:', error);
  }
}

createSimplifiedReportForLatest().then(() => process.exit(0));