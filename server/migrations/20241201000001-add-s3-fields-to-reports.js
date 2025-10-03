'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting migration: Add S3 fields to reports table...');
      
      // Add S3 fields to reports table
      await queryInterface.addColumn('reports', 's3Key', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'S3 object key for the uploaded file'
      }, { transaction });
      
      await queryInterface.addColumn('reports', 's3Bucket', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'S3 bucket name where the file is stored'
      }, { transaction });
      
      await queryInterface.addColumn('reports', 's3Url', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'S3 object URL for the uploaded file'
      }, { transaction });
      
      // Make filePath optional since we'll use S3
      await queryInterface.changeColumn('reports', 'filePath', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Local file path (optional when using S3)'
      }, { transaction });
      
      // Add indexes for better performance
      await queryInterface.addIndex('reports', ['s3Key'], {
        name: 'reports_s3_key_idx',
        transaction
      });
      
      await queryInterface.addIndex('reports', ['userId', 's3Key'], {
        name: 'reports_user_s3_key_idx',
        transaction
      });
      
      // Add a check constraint to ensure either filePath or s3Key is present
      await queryInterface.sequelize.query(`
        ALTER TABLE reports 
        ADD CONSTRAINT reports_file_location_check 
        CHECK (filePath IS NOT NULL OR s3Key IS NOT NULL)
      `, { transaction });
      
      await transaction.commit();
      console.log('Migration completed successfully: S3 fields added to reports table');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting rollback: Remove S3 fields from reports table...');
      
      // Remove check constraint
      await queryInterface.sequelize.query(`
        ALTER TABLE reports 
        DROP CONSTRAINT IF EXISTS reports_file_location_check
      `, { transaction });
      
      // Remove indexes first
      await queryInterface.removeIndex('reports', 'reports_s3_key_idx', { transaction });
      await queryInterface.removeIndex('reports', 'reports_user_s3_key_idx', { transaction });
      
      // Remove S3 columns
      await queryInterface.removeColumn('reports', 's3Key', { transaction });
      await queryInterface.removeColumn('reports', 's3Bucket', { transaction });
      await queryInterface.removeColumn('reports', 's3Url', { transaction });
      
      // Make filePath required again
      await queryInterface.changeColumn('reports', 'filePath', {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Local file path'
      }, { transaction });
      
      await transaction.commit();
      console.log('Rollback completed successfully: S3 fields removed from reports table');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
