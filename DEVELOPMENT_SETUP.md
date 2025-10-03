# SimplyMedi Development Setup Guide

This guide will help you set up the SimplyMedi development environment and fix common issues.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Run the automated setup script
npm run setup
```

### Option 2: Manual Setup
```bash
# Install all dependencies
npm run install-all

# Set up environment files
cp server/env.example server/.env
# Edit server/.env with your credentials

# Create client environment file
echo "REACT_APP_API_URL=http://localhost:5000/api" > client/.env
```

## 🔧 Fixing Common Issues

### Issue: "Missing script: dev"
**Solution:**
```bash
# The dev script has been added to client/package.json
# Just run the setup script
npm run setup
```

### Issue: "'react-scripts' is not recognized"
**Solution:**
```bash
# Install client dependencies
cd client
npm install
```

### Issue: Dependencies not installed
**Solution:**
```bash
# Install all dependencies
npm run install-all
```

## 📋 Available Scripts

### Root Directory
| Script | Description |
|--------|-------------|
| `npm run setup` | Automated development setup |
| `npm run dev` | Start both frontend and backend |
| `npm run server` | Start backend only |
| `npm run client` | Start frontend only |
| `npm run install-all` | Install all dependencies |

### Server Directory (`cd server`)
| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm start` | Start production server |
| `npm run migrate:up` | Run database migrations |
| `npm run migrate:down` | Rollback migrations |
| `npm run migrate:status` | Check migration status |
| `npm run setup:s3` | Setup AWS S3 integration |

### Client Directory (`cd client`)
| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm start` | Start development server (same as dev) |
| `npm run build` | Build for production |
| `npm test` | Run tests |

## 🗄️ Database Setup

1. **Install PostgreSQL** (if not already installed)
2. **Create database:**
   ```sql
   CREATE DATABASE medimind;
   ```
3. **Update server/.env** with your database credentials
4. **Run migrations:**
   ```bash
   cd server
   npm run migrate:up
   ```

## ☁️ AWS S3 Setup

1. **Create AWS S3 bucket**
2. **Create IAM user** with S3 permissions
3. **Update server/.env** with AWS credentials:
   ```env
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=eu-north-1
   AWS_S3_BUCKET=your_bucket_name
   ```
4. **Run S3 setup:**
   ```bash
   cd server
   npm run setup:s3
   ```

## 🚀 Running the Application

### Development Mode (Both Frontend & Backend)
```bash
# From root directory
npm run dev
```

### Individual Services
```bash
# Backend only (port 5000)
npm run server

# Frontend only (port 3000)
npm run client
```

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 3000 and 5000
npx kill-port 3000 5000
```

### Database Connection Issues
```bash
# Test database connection
cd server
node -e "
const { sequelize } = require('./config/database');
sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database error:', err))
  .finally(() => process.exit());
"
```

### Missing Dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json
rm -rf server/node_modules server/package-lock.json
npm run install-all
```

### React Scripts Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
cd client
rm -rf node_modules package-lock.json
npm install
```

## 📁 Project Structure

```
SimplyMedi/
├── client/                 # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── migrations/
│   └── package.json
├── package.json           # Root package.json
├── setup-dev.js          # Development setup script
└── fix-client.js         # Client fix script
```

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## 📝 Environment Variables

### Server (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medimind
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-north-1
AWS_S3_BUCKET=your_bucket_name

# AI Services
HUGGINGFACE_API_KEY=your_huggingface_key
PERPLEXITY_API_KEY=your_perplexity_key
```

### Client (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs** for specific error messages
2. **Verify environment variables** are set correctly
3. **Ensure all dependencies** are installed
4. **Check database connection** and migrations
5. **Verify AWS credentials** if using S3

## 🎉 Success!

Once everything is set up, you should see:
- Backend running on port 5000
- Frontend running on port 3000
- Database connected and migrated
- S3 integration working (if configured)

Happy coding! 🚀
