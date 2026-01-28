# Deployment Guide

Choose the best deployment option for your needs.

## Option 1: Railway.app (Easiest - Recommended)

Railway offers 500 free hours per month and easy deployment.

### Steps:

1. **Create Railway Account**
   - Visit [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy via GitHub**
   ```bash
   # Initialize git repository
   git init
   git add .
   git commit -m "Initial commit"

   # Push to GitHub
   git remote add origin your-repo-url
   git push -u origin main
   ```

3. **Connect to Railway**
   - Click "New Project" in Railway
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect and deploy

4. **Add Persistent Storage**
   - Click on your service
   - Go to "Volumes"
   - Add volume: `/app/database` (for database)
   - Add volume: `/app/uploads` (for files)

5. **Set Environment Variables** (if needed)
   - Go to "Variables" tab
   - Add: `NODE_ENV=production`
   - Add: `PORT=3000` (or Railway will set automatically)

6. **Deploy**
   - Railway will provide you with a URL
   - Your API will be at: `https://your-app.railway.app/api/v1`

**Cost**: Free for 500 hours/month (enough for demo)

---

## Option 2: Render.com

Free tier with automatic deployments.

### Steps:

1. **Create Render Account**
   - Visit [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repo

3. **Configure Service**
   - Name: scout-backend
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Add Disk Storage**
   - Go to service settings
   - Add disk at `/app/database`
   - Add disk at `/app/uploads`

5. **Deploy**
   - Click "Create Web Service"
   - Render provides a URL: `https://scout-backend.onrender.com`

**Note**: Free tier services spin down after inactivity (takes 30s to wake up).

---

## Option 3: Docker + Any VPS

Deploy with Docker on any server.

### Requirements:
- VPS with Docker installed (DigitalOcean, Linode, etc.)
- SSH access to server

### Steps:

1. **Build Docker Image**
   ```bash
   docker build -t scout-backend .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     --name scout-backend \
     -p 3000:3000 \
     -v $(pwd)/database:/app/database \
     -v $(pwd)/uploads:/app/uploads \
     --restart unless-stopped \
     scout-backend
   ```

3. **Or Use Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Configure Reverse Proxy (Optional)**

   Using Nginx:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Option 4: Oracle Cloud (Always Free)

Oracle offers always-free VMs with generous resources.

### Free Tier Includes:
- 2 AMD VMs with 1 GB RAM each
- 200 GB total storage
- 10 TB monthly outbound data transfer

### Steps:

1. **Create Oracle Cloud Account**
   - Visit [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
   - Sign up (requires credit card for verification, won't charge)

2. **Create Compute Instance**
   - Go to "Compute" → "Instances"
   - Click "Create Instance"
   - Choose "Always Free Eligible" shape
   - Select Ubuntu 22.04
   - Download SSH key

3. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@instance-ip
   ```

4. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

5. **Clone and Setup**
   ```bash
   git clone your-repo-url
   cd scout-backend
   npm install
   npm run init-db
   npm run migrate
   ```

6. **Start with PM2**
   ```bash
   pm2 start server.js --name scout-backend
   pm2 startup
   pm2 save
   ```

7. **Configure Firewall**
   ```bash
   sudo iptables -I INPUT 1 -p tcp --dport 3000 -j ACCEPT
   sudo netfilter-persistent save
   ```

8. **Also Configure in Oracle Console**
   - Go to Instance → Subnet → Security List
   - Add Ingress Rule: Port 3000, Source: 0.0.0.0/0

---

## Option 5: Local Server + Tunneling

For development/testing with external access.

### Using ngrok:

1. **Install ngrok**
   ```bash
   npm install -g ngrok
   ```

2. **Start Your Server**
   ```bash
   npm start
   ```

3. **Create Tunnel**
   ```bash
   ngrok http 3000
   ```

4. **Get Public URL**
   - ngrok provides a URL like: `https://abc123.ngrok.io`
   - Use this URL in your mobile app

**Note**: Free tier URL changes on restart. Paid plans give static URLs.

### Using Cloudflare Tunnel:

1. **Install cloudflared**
   - Download from [developers.cloudflare.com](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/)

2. **Create Tunnel**
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

3. **Get Public URL**
   - Cloudflare provides a URL
   - More stable than ngrok free tier

---

## Option 6: PM2 on VPS

Direct deployment on any Linux VPS.

### Requirements:
- VPS (AWS, DigitalOcean, Linode, etc.)
- Ubuntu/Debian Linux

### Steps:

1. **Connect to Server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs git
   ```

3. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

4. **Clone Repository**
   ```bash
   git clone your-repo-url
   cd scout-backend
   ```

5. **Install Dependencies**
   ```bash
   npm install
   ```

6. **Initialize**
   ```bash
   npm run init-db
   npm run migrate
   ```

7. **Start with PM2**
   ```bash
   pm2 start server.js --name scout-backend
   pm2 startup
   pm2 save
   ```

8. **Setup Nginx (Optional)**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/scout-backend
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/scout-backend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

9. **SSL with Let's Encrypt (Optional)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Environment Variables for Production

Update `.env` for production:

```env
NODE_ENV=production
PORT=3000
DATABASE_PATH=./database/scout.db
UPLOAD_DIR=./uploads
API_PREFIX=/api/v1
ALLOWED_ORIGINS=https://your-mobile-app.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

**Important**: Set `ALLOWED_ORIGINS` to your mobile app's domain or specific IPs for security.

---

## Post-Deployment Checklist

- [ ] Server is accessible via public URL
- [ ] Health check works: `/health`
- [ ] API endpoints respond: `/api/v1/content`
- [ ] Files are accessible: `/api/v1/content/1/file`
- [ ] Thumbnails load: `/api/v1/content/1/thumbnail`
- [ ] Database persists between restarts
- [ ] Uploaded files persist between restarts
- [ ] CORS is configured for your mobile app
- [ ] Rate limiting is working
- [ ] Error logging is enabled

---

## Monitoring

### Using PM2 (if applicable):

```bash
# View logs
pm2 logs scout-backend

# Monitor status
pm2 status

# Monitor resources
pm2 monit

# Restart if needed
pm2 restart scout-backend
```

### Health Check Endpoint:

Monitor `/health` endpoint to ensure server is running:

```bash
curl https://your-api-url/health
```

Set up external monitoring with:
- UptimeRobot (free)
- Pingdom
- StatusCake

---

## Scaling Considerations

For production with many users:

1. **Use CDN**: CloudFlare (free) for static files
2. **Add Caching**: Redis for API responses
3. **Load Balancer**: Multiple instances behind load balancer
4. **Database**: Migrate to PostgreSQL or MySQL
5. **File Storage**: Move to S3 or similar (when budget allows)
6. **Monitoring**: Add New Relic or Datadog

---

## Backup Strategy

### Database Backup:

```bash
# Backup database
cp database/scout.db database/scout.db.backup-$(date +%Y%m%d)

# Automated daily backup
echo "0 2 * * * cp /path/to/database/scout.db /path/to/backups/scout.db.\$(date +\%Y\%m\%d)" | crontab -
```

### File Backup:

```bash
# Backup uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Upload to cloud storage (optional)
# aws s3 cp uploads-backup.tar.gz s3://your-bucket/
```

---

## Troubleshooting

**Server not accessible**:
- Check firewall rules
- Verify port is open
- Check if service is running: `pm2 status` or `docker ps`

**Database errors**:
- Check database file permissions
- Verify disk space
- Check if database is locked (stop all instances)

**File upload/download issues**:
- Check uploads folder permissions: `chmod -R 755 uploads`
- Verify disk space
- Check file paths in database

**High memory usage**:
- Restart service: `pm2 restart scout-backend`
- Check for memory leaks in logs
- Consider using Docker with memory limits

---

## Security Recommendations

1. **Use HTTPS**: Always use SSL in production
2. **Environment Variables**: Never commit `.env` to git
3. **CORS**: Restrict to your mobile app domain
4. **Rate Limiting**: Adjust based on usage patterns
5. **Input Validation**: Already implemented
6. **Regular Updates**: Keep dependencies updated
7. **Firewall**: Only open necessary ports
8. **Backup**: Regular automated backups

---

Choose the option that best fits your needs and budget. Railway or Render are recommended for quick deployment, while Oracle Cloud is best for permanent free hosting.
