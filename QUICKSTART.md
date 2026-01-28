# Quick Start Guide

Get your Scout Content Backend running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd scout-backend
npm install
```

This will install all required packages (Express, SQLite, Sharp, etc.)

## Step 2: Initialize Database

```bash
npm run init-db
```

This creates the SQLite database with all necessary tables.

## Step 3: Import Your Files

```bash
npm run migrate
```

This will:
- Scan all your files (PDFs, images, videos)
- Copy them to the uploads folder
- Generate thumbnails
- Add them to the database

The migration process will show progress for each file.

## Step 4: Start the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Step 5: Test the API

Open your browser and visit:
- http://localhost:3000 - API info
- http://localhost:3000/health - Health check
- http://localhost:3000/api/v1/content - Get all content
- http://localhost:3000/api/v1/categories - Get all categories

## Next Steps

### For Mobile App Development

1. Use the content endpoint to fetch your files:
   ```javascript
   fetch('http://localhost:3000/api/v1/content?type=pdf')
   ```

2. Display thumbnails:
   ```javascript
   <Image source={{uri: 'http://localhost:3000/api/v1/content/1/thumbnail'}} />
   ```

3. Download files:
   ```javascript
   const fileUrl = 'http://localhost:3000/api/v1/content/1/file';
   ```

### Deploying to Production

Choose one of these free options:

**Railway (Easiest)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Docker**
```bash
docker-compose up -d
```

**PM2 (For VPS)**
```bash
npm install -g pm2
pm2 start server.js --name scout-backend
pm2 save
```

## Common Issues

**"Port 3000 already in use"**
- Change the port in `.env` file: `PORT=8080`

**"Cannot find module"**
- Run `npm install` again

**"Database locked"**
- Stop all running instances: `pm2 stop all` or close terminal

**"Sharp installation failed"**
- Run `npm rebuild sharp`

## Configuration

Edit `.env` file to customize:

```env
PORT=3000                    # Server port
DATABASE_PATH=./database/scout.db
UPLOAD_DIR=./uploads
API_PREFIX=/api/v1
ALLOWED_ORIGINS=*            # For CORS (use specific domain in production)
```

## Testing with cURL

```bash
# Get all content
curl http://localhost:3000/api/v1/content

# Search for content
curl "http://localhost:3000/api/v1/content?search=كشافة"

# Get statistics
curl http://localhost:3000/api/v1/content/stats

# Get categories
curl http://localhost:3000/api/v1/categories
```

## Need Help?

- Check README.md for full documentation
- Review server logs in the terminal
- Check database with SQLite browser

---

You're all set! Your Scout Content Backend is ready for mobile app integration.
