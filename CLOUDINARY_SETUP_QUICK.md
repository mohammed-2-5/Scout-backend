# ⚡ Quick Cloudinary Setup (5 Minutes)

## ✅ Already Done

- ✅ 977 files ready (all under Cloudinary limits)
- ✅ Excluded 2 large PDFs
- ✅ Compressed large files (video, images, PDFs)
- ✅ Backend API ready
- ✅ Migration script created

---

## 🎯 What You Need To Do (3 Steps)

### 1️⃣ Get Cloudinary Account (2 min)

1. Open: https://cloudinary.com/users/register/free
2. Sign up (email + password)
3. Copy your credentials from: https://console.cloudinary.com/

You'll see something like:
```
Cloud name: dcab12xyz
API Key: 123456789012345
API Secret: Abc123XYZ456def
```

---

### 2️⃣ Create `.env` File (1 min)

In `scout-backend` folder, create file named `.env`:

```env
CLOUDINARY_CLOUD_NAME=dcab12xyz
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=Abc123XYZ456def

PORT=3000
NODE_ENV=production
API_PREFIX=/api/v1
ALLOWED_ORIGINS=*
```

**Replace with YOUR values from step 1!**

---

### 3️⃣ Upload Files to Cloudinary (2 min setup, 20 min upload)

```bash
cd scout-backend
node migrate-to-cloudinary.js
```

Wait for upload to complete. You'll see:
```
✅ Uploaded: 977/977
```

**Done!** Your files are now on Cloudinary CDN.

---

## 🚀 Deploy Backend (Pick One)

### Railway.app (Easiest - Recommended)

1. Push code to GitHub
2. Go to: https://railway.app
3. "New Project" → "Deploy from GitHub"
4. Add environment variables (same as .env file)
5. Deploy!

Your API will be at: `https://your-app.railway.app`

### Render.com

1. Push code to GitHub
2. Go to: https://render.com
3. "New Web Service"
4. Build: `npm install`
5. Start: `node server.js`
6. Add environment variables
7. Deploy!

---

## 📱 Update Flutter App

Change base URL in your Flutter code:

```dart
const String baseUrl = 'https://your-app.railway.app/api/v1';
```

---

## ✅ Result

- 🌐 Files on Cloudinary CDN (fast, worldwide)
- 🚀 Backend API deployed (free hosting)
- 📱 Ready for Flutter app
- 💰 $0 cost (completely free)

---

## Files Summary

| Type | Count | Status |
|------|-------|--------|
| PDFs | 165 | ✅ All < 10MB |
| Images | 736 | ✅ All < 10MB |
| Videos | 28 | ✅ All < 100MB |
| Presentations | 48 | ✅ Compatible |
| **TOTAL** | **977** | ✅ Ready |

---

**That's it!** Your backend is ready for deployment. 🎉
