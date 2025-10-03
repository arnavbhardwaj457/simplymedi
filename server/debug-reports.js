const { Report, SimplifiedReport } = require('./models');

async function checkReports() {
  try {
    // Get recent reports with their simplified versions
    const reports = await Report.findAll({
      include: [{
        model: SimplifiedReport,
        as: 'simplifiedReport',
        required: false
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    console.log('\n=== Recent Reports Status ===');
    reports.forEach(report => {
      console.log(`Report ID: ${report.id}`);
      console.log(`File: ${report.originalFileName}`);
      console.log(`Status: ${report.processingStatus}`);
      console.log(`Error: ${report.processingError || 'None'}`);
      console.log(`Simplified Report: ${report.simplifiedReport ? 'Yes' : 'No'}`);
      console.log(`Created: ${report.createdAt}`);
      console.log('---');
    });

    // Check if any reports are stuck in processing
    const processingReports = await Report.findAll({
      where: { processingStatus: 'processing' }
    });

    console.log(`\n=== Reports stuck in processing: ${processingReports.length} ===`);
    processingReports.forEach(report => {
      console.log(`ID: ${report.id}, Created: ${report.createdAt}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error checking reports:', error);
    process.exit(1);
  }
}

checkReports();