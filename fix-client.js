#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Fixing client setup issues...\n');

try {
  // Navigate to client directory
  process.chdir('./client');
  
  console.log('📦 Installing client dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('✅ Dependencies installed successfully!');
  
  console.log('\n📋 Available scripts:');
  execSync('npm run', { stdio: 'inherit' });
  
  console.log('\n🎉 Client setup fixed!');
  console.log('\nYou can now run:');
  console.log('  npm run dev    (from client directory)');
  console.log('  npm start      (from client directory)');
  console.log('  npm run client (from root directory)');
  
} catch (error) {
  console.error('❌ Fix failed:', error.message);
  console.log('\nManual fix steps:');
  console.log('1. cd client');
  console.log('2. npm install');
  console.log('3. npm run dev');
}
