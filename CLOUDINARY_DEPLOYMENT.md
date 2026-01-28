# 🚀 Deploy Scout Backend with Cloudinary

This guide shows you how to deploy your backend for **FREE** using Cloudinary for file storage.

## 📊 What You're Deploying

- **977 files** (165 PDFs, 736 images, 28 videos, 48 presentations)
- All files under Cloudinary free tier limits ✅
- Node.js + Express backend
- SQLite database

---

## Step 1: Create Cloudinary Account (FREE)

1. Go to: https://cloudinary.com/users/register/free
2. Sign up with email
3. After login, go to: https://console.cloudinary.com/
4. You'll see your dashboard with credentials

**Copy these 3 values:**
```
Cloud Name: dcxxxxxxx
API Key: 123456789012345
API Secret: AbCdEfGhIjKlMnOpQrStUvWxYz
```

---

## Step 2: Configure Backend

1. **Create `.env` file** in `scout-backend` folder:

```bash
cd scout-backend
```

Create file named `.env` with this content:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Server Configuration
PORT=3000
NODE_ENV=production
API_PREFIX=/api/v1
ALLOWED_ORIGINS=*
```

**Replace** `your_cloud_name_here`, `your_api_key_here`, `your_api_secret_here` with your actual values from Step 1.

---

## Step 3: Upload Files to Cloudinary

Run the migration script:

```bash
npm install
node migrate-to-cloudinary.js
```

This will:
- Upload all 977 files to Cloudinary
- Update database with Cloudinary URLs
- Show progress for each file
- Take approximately 15-30 minutes

**Expected output:**
```
✅ Uploaded: 977/977
⚠️  Skipped: 0
❌ Failed: 0
```

---

## Step 4: Deploy Backend

### Option A: Railway.app (Recommended - Easiest)

1. Go to https://railway.app
2. Click "Start a New Project"
3. Connect GitHub (push your code to GitHub first)
4. Or use "Deploy from GitHub repo"
5. Add environment variables in Railway dashboard
6. Deploy!

**Free tier:** $5 credit/month

### Option B: Render.com

1. Go to https://render.com
2. Create "New Web Service"
3. Connect GitHub repo
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables
7. Deploy!

**Free tier:** 750 hours/month

### Option C: Fly.io

1. Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
2. Run:
```bash
fly launch
fly secrets set CLOUDINARY_CLOUD_NAME=xxx CLOUDINARY_API_KEY=xxx CLOUDINARY_API_SECRET=xxx
fly deploy
```

**Free tier:** 3 VMs

---

## Step 5: Update Flutter App

After deployment, update your Flutter app's base URL:

```dart
const String baseUrl = 'https://your-app.railway.app/api/v1';
```

---

## 🎯 What You Get

| Feature | Status |
|---------|--------|
| **Storage** | 977 files on Cloudinary (free 25GB) |
| **Backend** | Node.js API deployed (free hosting) |
| **Database** | SQLite with all metadata |
| **Bandwidth** | Cloudinary CDN (fast worldwide) |
| **Cost** | $0 (completely free) |

---

## 📱 Testing Your API

After deployment, test:

```bash
# Health check
curl https://your-app.railway.app/health

# Get stats
curl https://your-app.railway.app/api/v1/content/stats

# Get categories
curl https://your-app.railway.app/api/v1/categories
```

---

## ⚠️ Important Notes

1. **Cloudinary Free Tier Limits:**
   - 25 monthly credits (≈25GB storage + bandwidth)
   - 500 admin API calls/hour
   - Perfect for your 977 files ✅

2. **Excluded Files:**
   - 2 large PDFs were excluded (over 10MB limit)
   - You can compress and add them later

3. **Database Backup:**
   - Database is in `scout-backend/database/scout.db`
   - Keep a backup copy locally

---

## 🆘 Troubleshooting

**Migration fails?**
- Check `.env` file has correct Cloudinary credentials
- Check internet connection
- Try running migration again (it skips already uploaded files)

**Deployment fails?**
- Ensure `package.json` has all dependencies
- Check logs in hosting platform dashboard
- Ensure environment variables are set correctly

---

## ✅ Next Steps

After successful deployment:

1. ✅ Files are on Cloudinary CDN (fast loading)
2. ✅ Backend API is live
3. ✅ Ready to integrate with Flutter app
4. 🔜 Build your Flutter mobile app!

---

**Need help?** Check the hosting platform docs or re-run migration if files are missing.
