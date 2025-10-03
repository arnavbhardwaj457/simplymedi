#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up AWS S3 integration for SimplyMedi...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found. Please create one from env.example');
  console.log('   cp env.example .env');
  console.log('   # Then edit .env with your database and AWS credentials');
  process.exit(1);
}

console.log('✅ .env file found');

// Check required environment variables
require('dotenv').config();

const requiredVars = [
  'DB_HOST',
  'DB_NAME', 
  'DB_USER',
  'DB_PASSWORD',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\nPlease update your .env file with the required values.');
  process.exit(1);
}

console.log('✅ All required environment variables are set');

// Test database connection
console.log('\n🔍 Testing database connection...');
try {
  execSync('node -e "const { sequelize } = require(\'./config/database\'); sequelize.authenticate().then(() => { console.log(\'✅ Database connection successful\'); process.exit(0); }).catch(err => { console.error(\'❌ Database connection failed:\', err.message); process.exit(1); });"', { stdio: 'inherit' });
} catch (error) {
  console.log('❌ Database connection failed. Please check your database credentials.');
  process.exit(1);
}

// Check migration status
console.log('\n📊 Checking migration status...');
try {
  execSync('npm run migrate:status', { stdio: 'inherit' });
} catch (error) {
  console.log('❌ Failed to check migration status');
  process.exit(1);
}

// Ask user if they want to run migrations
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n❓ Do you want to run the database migration now? (y/N): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\n🔄 Running database migration...');
    try {
      execSync('npm run migrate:up', { stdio: 'inherit' });
      console.log('\n✅ Migration completed successfully!');
      
      // Test the migration
      console.log('\n🧪 Testing migration...');
      execSync('npm run migrate:test', { stdio: 'inherit' });
      
    } catch (error) {
      console.log('\n❌ Migration failed. Please check the error messages above.');
      rl.close();
      process.exit(1);
    }
  } else {
    console.log('\n⏭️  Skipping migration. You can run it later with: npm run migrate:up');
  }
  
  console.log('\n🎉 AWS S3 integration setup complete!');
  console.log('\nNext steps:');
  console.log('1. Start your server: npm run dev');
  console.log('2. Test file uploads to verify S3 integration');
  console.log('3. Check logs for any S3-related errors');
  
  rl.close();
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Setup cancelled by user');
  rl.close();
  process.exit(0);
});
