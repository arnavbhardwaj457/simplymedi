require('dotenv').config();
const { User } = require('./models');
const { generateTokens } = require('./middleware/auth');

async function testAuth() {
  try {
    console.log('🔍 Testing authentication system...');
    
    // Test 1: Check if User model can be created
    console.log('\n1. Testing User model creation...');
    const testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });
    console.log('✅ User created successfully:', testUser.email);
    
    // Test 2: Check if tokens can be generated
    console.log('\n2. Testing JWT token generation...');
    const tokens = generateTokens(testUser.id);
    console.log('✅ Tokens generated successfully');
    console.log('Access token length:', tokens.accessToken.length);
    console.log('Refresh token length:', tokens.refreshToken.length);
    
    // Test 3: Check if public profile works
    console.log('\n3. Testing public profile...');
    const publicProfile = testUser.getPublicProfile();
    console.log('✅ Public profile generated:', publicProfile.email);
    
    // Clean up
    await testUser.destroy();
    console.log('\n✅ Test user cleaned up');
    
    console.log('\n🎉 All authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testAuth();
