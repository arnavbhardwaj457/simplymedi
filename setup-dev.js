#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up SimplyMedi development environment...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json') || !fs.existsSync('client') || !fs.existsSync('server')) {
  console.log('❌ Please run this script from the SimplyMedi root directory');
  process.exit(1);
}

console.log('✅ Project structure looks good');

// Function to run command with error handling
function runCommand(command, cwd = process.cwd(), description = '') {
  try {
    console.log(`\n🔧 ${description || command}`);
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      shell: true
    });
    console.log(`✅ ${description || command} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description || command} failed:`, error.message);
    throw error;
  }
}

async function setupProject() {
  try {
    // Install root dependencies
    console.log('\n📦 Installing root dependencies...');
    runCommand('npm install', '.', 'Installing root dependencies');

    // Install server dependencies
    console.log('\n📦 Installing server dependencies...');
    runCommand('npm install', './server', 'Installing server dependencies');

    // Install client dependencies
    console.log('\n📦 Installing client dependencies...');
    runCommand('npm install', './client', 'Installing client dependencies');

    // Check if .env files exist
    console.log('\n🔍 Checking environment files...');
    
    if (!fs.existsSync('./server/.env')) {
      if (fs.existsSync('./server/env.example')) {
        console.log('📋 Creating .env file from env.example...');
        fs.copyFileSync('./server/env.example', './server/.env');
        console.log('✅ .env file created. Please update it with your credentials.');
      } else {
        console.log('⚠️  No env.example found. Please create a .env file manually.');
      }
    } else {
      console.log('✅ Server .env file exists');
    }

    if (!fs.existsSync('./client/.env')) {
      console.log('📋 Creating client .env file...');
      const clientEnvContent = `REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
`;
      fs.writeFileSync('./client/.env', clientEnvContent);
      console.log('✅ Client .env file created');
    } else {
      console.log('✅ Client .env file exists');
    }

    // Test if everything is working
    console.log('\n🧪 Testing setup...');
    
    // Check if we can run the dev scripts
    console.log('\n📋 Available scripts:');
    console.log('  Root:');
    runCommand('npm run', '.', 'Checking root scripts');
    
    console.log('\n  Server:');
    runCommand('npm run', './server', 'Checking server scripts');
    
    console.log('\n  Client:');
    runCommand('npm run', './client', 'Checking client scripts');

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update server/.env with your database and AWS credentials');
    console.log('2. Run database migration: cd server && npm run migrate:up');
    console.log('3. Start the development servers:');
    console.log('   - Backend: cd server && npm run dev');
    console.log('   - Frontend: cd client && npm run dev');
    console.log('   - Or both: npm run dev (from root)');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n🔧 Manual setup steps:');
    console.log('1. cd server && npm install');
    console.log('2. cd ../client && npm install');
    console.log('3. Copy server/env.example to server/.env and update it');
    console.log('4. Create client/.env with REACT_APP_API_URL=http://localhost:5000/api');
    process.exit(1);
  }
}

// Run setup
setupProject();
