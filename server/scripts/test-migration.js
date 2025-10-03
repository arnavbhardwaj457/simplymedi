const { sequelize } = require('../config/database');

async function testMigration() {
  try {
    console.log('Testing database migration...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check if reports table exists
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'reports'
    `);
    
    if (tables.length === 0) {
      console.log('❌ Reports table does not exist');
      return;
    }
    
    console.log('✅ Reports table exists');
    
    // Check for S3 fields
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'reports' 
      AND column_name IN ('s3Key', 's3Bucket', 's3Url', 'filePath')
      ORDER BY column_name
    `);
    
    console.log('\nColumn Status:');
    console.log('==============');
    
    const expectedColumns = ['s3Key', 's3Bucket', 's3Url', 'filePath'];
    const foundColumns = columns.map(col => col.column_name);
    
    expectedColumns.forEach(col => {
      if (foundColumns.includes(col)) {
        const columnInfo = columns.find(c => c.column_name === col);
        console.log(`✅ ${col}: ${columnInfo.data_type} (${columnInfo.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      } else {
        console.log(`❌ ${col}: Not found`);
      }
    });
    
    // Check for indexes
    const [indexes] = await sequelize.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'reports' 
      AND indexname LIKE '%s3%'
    `);
    
    console.log('\nIndex Status:');
    console.log('=============');
    
    if (indexes.length > 0) {
      indexes.forEach(idx => {
        console.log(`✅ ${idx.indexname}`);
      });
    } else {
      console.log('❌ No S3-related indexes found');
    }
    
    // Check for constraints
    const [constraints] = await sequelize.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'reports'::regclass
      AND conname LIKE '%file_location%'
    `);
    
    console.log('\nConstraint Status:');
    console.log('==================');
    
    if (constraints.length > 0) {
      constraints.forEach(constraint => {
        console.log(`✅ ${constraint.conname}: ${constraint.definition}`);
      });
    } else {
      console.log('❌ No file location constraint found');
    }
    
    // Test data integrity
    const [dataCheck] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(filePath) as has_file_path,
        COUNT(s3Key) as has_s3_key,
        COUNT(CASE WHEN filePath IS NULL AND s3Key IS NULL THEN 1 END) as missing_both
      FROM reports
    `);
    
    console.log('\nData Integrity Check:');
    console.log('=====================');
    console.log(`Total records: ${dataCheck[0].total_records}`);
    console.log(`Records with filePath: ${dataCheck[0].has_file_path}`);
    console.log(`Records with s3Key: ${dataCheck[0].has_s3_key}`);
    console.log(`Records missing both: ${dataCheck[0].missing_both}`);
    
    if (dataCheck[0].missing_both > 0) {
      console.log('⚠️  Warning: Some records are missing both filePath and s3Key');
    } else {
      console.log('✅ All records have either filePath or s3Key');
    }
    
    console.log('\n🎉 Migration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration test failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run test if called directly
if (require.main === module) {
  testMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = testMigration;
