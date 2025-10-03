require('dotenv').config();
const { sequelize } = require('./config/database');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('Database config:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    // Don't log password for security
    password: process.env.DB_PASSWORD ? '***' : 'NOT SET'
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    console.log('🎉 You can now use login/registration');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Possible solutions:');
    console.log('1. Check if PostgreSQL is running');
    console.log('2. Verify the password in .env file');
    console.log('3. Try connecting manually: psql -U postgres -h localhost');
    console.log('4. Reset password: ALTER USER postgres PASSWORD \'new_password\';');
  }
}

testDatabaseConnection();
