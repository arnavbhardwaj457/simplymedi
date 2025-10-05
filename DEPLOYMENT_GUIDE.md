# 🚀 Quick Deployment Fix for Render

## ❌ Error Fixed
```
Error: Cannot find module '/opt/render/project/src/server/server/index.js'
```

## ✅ Solution Applied

### 1. Updated `package.json`
Changed start command to: `"start": "node server/index.js"`

### 2. Added `/api/health` Endpoint
Added health check endpoint in `server/index.js` for Render monitoring.

### 3. Created `render.yaml`
Proper deployment configuration with correct paths.

---

## 🚀 Deploy on Render

### Step 1: Update Render Service Settings

**Manual Configuration:**
1. Go to your Render service dashboard
2. **Build Command**: `cd server && npm install`
3. **Start Command**: `node server/index.js`
4. Save and deploy

**Or use render.yaml** (if you have one):
- Render will auto-detect configuration
- Just push to GitHub

### Step 2: Add Environment Variables

In Render Dashboard → Your Service → Environment, add:

```bash
# Database (use your actual values from local .env)
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_URL=postgresql://user:password@host/database

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
ENCRYPTION_KEY=your_encryption_key
SESSION_SECRET=your_session_secret

# AI Services (copy from your local server/.env)
GEMINI_API_KEY=your_gemini_key
HUGGINGFACE_API_KEY=your_huggingface_key
PERPLEXITY_API_KEY=your_perplexity_key

# AWS (copy from your local server/.env)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=eu-north-1
AWS_S3_BUCKET=your_bucket_name

# Other
NODE_ENV=production
PORT=10000
MAX_FILE_SIZE=10485760
```

**⚠️ Important**: Copy actual values from your local `server/.env` file

### Step 3: Verify Deployment

```bash
curl https://your-app.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-05T...",
  "uptime": 123.45,
  "database": "connected"
}
```

---

## 📁 Files Modified

- ✅ `package.json` - Fixed start command
- ✅ `server/index.js` - Added `/api/health` endpoint

---

## 🔒 Security Note

**Never commit these to GitHub:**
- `.env` files
- API keys
- Database passwords
- AWS credentials

Always use Render's environment variable system for secrets.

---

## 🆘 Troubleshooting

### Build fails
- Check that `server/package.json` exists
- Verify all dependencies are listed

### Can't connect to database
- Double-check `DB_URL` in environment variables
- Ensure database allows connections from Render

### 502 errors
- Check logs in Render dashboard
- Verify health check endpoint works
- Check `PORT` environment variable

---

## ✅ Expected Result

After deployment:
- ✅ Server starts successfully
- ✅ Health check passes
- ✅ Database connects
- ✅ API endpoints work

Your app will be live at: `https://your-app.onrender.com`
