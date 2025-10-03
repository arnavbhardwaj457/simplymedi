const { sequelize } = require('../config/database');
const { QueryInterface, DataTypes } = require('sequelize');

async function addS3Fields() {
  try {
    console.log('Adding S3 fields to reports table...');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Add S3 fields to reports table
    await queryInterface.addColumn('reports', 's3Key', {
      type: DataTypes.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('reports', 's3Bucket', {
      type: DataTypes.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('reports', 's3Url', {
      type: DataTypes.STRING,
      allowNull: true
    });
    
    // Make filePath optional since we'll use S3
    await queryInterface.changeColumn('reports', 'filePath', {
      type: DataTypes.STRING,
      allowNull: true
    });
    
    console.log('S3 fields added successfully!');
    
    // Add indexes for better performance
    await queryInterface.addIndex('reports', ['s3Key']);
    await queryInterface.addIndex('reports', ['userId', 's3Key']);
    
    console.log('Indexes added successfully!');
    
  } catch (error) {
    console.error('Error adding S3 fields:', error);
    throw error;
  }
}

async function removeS3Fields() {
  try {
    console.log('Removing S3 fields from reports table...');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Remove indexes first
    await queryInterface.removeIndex('reports', ['s3Key']);
    await queryInterface.removeIndex('reports', ['userId', 's3Key']);
    
    // Remove S3 columns
    await queryInterface.removeColumn('reports', 's3Key');
    await queryInterface.removeColumn('reports', 's3Bucket');
    await queryInterface.removeColumn('reports', 's3Url');
    
    // Make filePath required again
    await queryInterface.changeColumn('reports', 'filePath', {
      type: DataTypes.STRING,
      allowNull: false
    });
    
    console.log('S3 fields removed successfully!');
    
  } catch (error) {
    console.error('Error removing S3 fields:', error);
    throw error;
  }
}

// Run migration based on command line argument
const command = process.argv[2];

if (command === 'up') {
  addS3Fields()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
} else if (command === 'down') {
  removeS3Fields()
    .then(() => {
      console.log('Rollback completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Rollback failed:', error);
      process.exit(1);
    });
} else {
  console.log('Usage: node add-s3-fields.js [up|down]');
  console.log('  up   - Add S3 fields to reports table');
  console.log('  down - Remove S3 fields from reports table');
  process.exit(1);
}
