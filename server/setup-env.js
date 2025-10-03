const fs = require('fs');
const path = require('path');

const envContent = `# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medimind
DB_USER=postgres
DB_PASSWORD=Arnav457@
DB_URL=postgresql://postgres:Arnav457@@localhost:5432/medimind

# JWT Configuration
JWT_SECRET=simplymedi_super_secret_jwt_key_2024_medical_app_secure_token
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=simplymedi_refresh_secret_key_2024_medical_app_secure_refresh_token
JWT_REFRESH_EXPIRES_IN=30d

# Encryption
ENCRYPTION_KEY=simplymedi_32_char_encryption_key_2024

# AI Services
HUGGINGFACE_API_KEY=your_huggingface_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key

# OCR Configuration
TESSERACT_DATA_PATH=./tesseract-data

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,txt

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=simplymedi_session_secret_2024

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=eu-north-1
AWS_S3_BUCKET=your_bucket_name_here`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('🔑 JWT secrets configured');
  console.log('🗄️  Database configuration set');
  console.log('☁️  AWS configuration added');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your server: npm start');
  console.log('2. Test login/registration in the frontend');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
}
