# Scout Content Backend API

A complete backend API for managing Scout educational content including PDFs, images, videos, and presentations for mobile applications.

## Features

- RESTful API for content management
- Support for PDFs, images, videos, and presentations
- Automatic thumbnail generation
- Video streaming with range request support
- Category management with hierarchical structure
- Search and filtering
- SQLite database (file-based, no external DB needed)
- Completely free hosting options
- Docker support
- Built for mobile app integration

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite3
- **File Processing**: Sharp (images), Multer (uploads)
- **Security**: Helmet, CORS, Rate Limiting
- **Performance**: Compression, Response caching

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Installation

### 1. Clone or Copy the Project

```bash
cd scout-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

The `.env` file is already created with default values. Modify if needed:

```env
PORT=3000
NODE_ENV=development
DATABASE_PATH=./database/scout.db
UPLOAD_DIR=./uploads
API_PREFIX=/api/v1
ALLOWED_ORIGINS=*
```

### 4. Initialize Database

```bash
npm run init-db
```

### 5. Migrate Your Files

To import your existing content files into the system:

```bash
npm run migrate
```

This will:
- Scan all files in the parent directory
- Copy supported files to the uploads folder
- Generate thumbnails automatically
- Create database records for all content
- Organize content by categories

### 6. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start at `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /health
```

### Content Endpoints

#### Get All Content
```
GET /api/v1/content
Query Parameters:
  - category_id: Filter by category ID
  - type: Filter by type (pdf, image, video, presentation)
  - featured: true/false
  - search: Search in title and description
  - sortBy: Field to sort by (default: created_at)
  - sortDir: ASC or DESC (default: DESC)
  - limit: Number of items per page (default: 50)
  - offset: Pagination offset (default: 0)
```

#### Get Single Content
```
GET /api/v1/content/:id
```

#### Download/Stream File
```
GET /api/v1/content/:id/file
```

#### Get Thumbnail
```
GET /api/v1/content/:id/thumbnail
```

#### Get Statistics
```
GET /api/v1/content/stats
```

#### Update Content
```
PUT /api/v1/content/:id
Body: {
  title: string,
  description: string,
  category_id: number,
  is_featured: boolean,
  tags: string[]
}
```

#### Delete Content
```
DELETE /api/v1/content/:id
```

### Category Endpoints

#### Get All Categories
```
GET /api/v1/categories
```

#### Get Category Tree
```
GET /api/v1/categories/tree
```

#### Get Single Category
```
GET /api/v1/categories/:id
```

#### Get Category by Slug
```
GET /api/v1/categories/slug/:slug
```

#### Create Category
```
POST /api/v1/categories
Body: {
  name: string,
  name_ar: string,
  slug: string,
  description: string,
  icon: string,
  parent_id: number,
  order_index: number
}
```

#### Update Category
```
PUT /api/v1/categories/:id
```

#### Delete Category
```
DELETE /api/v1/categories/:id
```

## Mobile App Integration

### Example: Fetching Content List

```javascript
// Fetch all PDFs
const response = await fetch('http://your-api-url/api/v1/content?type=pdf&limit=20');
const data = await response.json();

data.data.forEach(item => {
  console.log(item.title);
  console.log(item.file_url);
  console.log(item.thumbnail_url);
});
```

### Example: Downloading a File

```javascript
// Direct download URL
const fileUrl = `http://your-api-url/api/v1/content/${contentId}/file`;

// Or get thumbnail
const thumbnailUrl = `http://your-api-url/api/v1/content/${contentId}/thumbnail`;
```

### Example: Video Streaming

```javascript
// Video player will automatically handle range requests
<video src={`http://your-api-url/api/v1/content/${videoId}/file`} controls />
```

### Example: Search Content

```javascript
const searchQuery = 'شارات';
const response = await fetch(`http://your-api-url/api/v1/content?search=${encodeURIComponent(searchQuery)}`);
const results = await response.json();
```

## Deployment Options

### Option 1: Railway.app (Recommended)

1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy automatically
4. Add volume storage for uploads and database

### Option 2: Render.com

1. Create account at [render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repository
4. Deploy with the provided `render.yaml`

### Option 3: Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t scout-backend .
docker run -p 3000:3000 -v ./database:/app/database -v ./uploads:/app/uploads scout-backend
```

### Option 4: Local Server / VPS

1. Install Node.js on your server
2. Clone the repository
3. Run `npm install`
4. Run `npm run init-db`
5. Run `npm run migrate`
6. Run `npm start`
7. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name scout-backend
   pm2 startup
   pm2 save
   ```

### Option 5: Oracle Cloud (Always Free)

1. Create Oracle Cloud account
2. Create Always Free VM instance
3. Install Node.js
4. Follow Local Server steps above
5. Configure firewall to allow port 3000

## Project Structure

```
scout-backend/
├── server.js              # Main application entry
├── package.json           # Dependencies
├── .env                   # Environment configuration
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose setup
├── src/
│   ├── controllers/       # Request handlers
│   │   ├── contentController.js
│   │   └── categoryController.js
│   ├── models/           # Database models
│   │   ├── Content.js
│   │   └── Category.js
│   ├── routes/           # API routes
│   │   ├── content.js
│   │   └── categories.js
│   ├── middleware/       # Custom middleware
│   └── utils/            # Utilities
│       ├── database.js
│       ├── thumbnailGenerator.js
│       └── fileHelper.js
├── uploads/              # Uploaded files
│   ├── pdf/
│   ├── images/
│   ├── videos/
│   └── thumbnails/
├── database/             # SQLite database
│   └── scout.db
└── scripts/              # Utility scripts
    ├── migrate.js        # File migration script
    └── init-db.js        # Database initialization
```

## Database Schema

### Content Table
- id (PRIMARY KEY)
- title (TEXT)
- title_ar (TEXT)
- description (TEXT)
- category_id (INTEGER, FOREIGN KEY)
- type (TEXT: pdf, image, video, presentation)
- file_path (TEXT)
- file_url (TEXT)
- thumbnail_path (TEXT)
- thumbnail_url (TEXT)
- file_size (INTEGER)
- mime_type (TEXT)
- tags (TEXT, JSON)
- view_count (INTEGER)
- download_count (INTEGER)
- is_featured (BOOLEAN)
- created_at (DATETIME)
- updated_at (DATETIME)

### Categories Table
- id (PRIMARY KEY)
- name (TEXT)
- name_ar (TEXT)
- slug (TEXT, UNIQUE)
- description (TEXT)
- icon (TEXT)
- parent_id (INTEGER, FOREIGN KEY)
- order_index (INTEGER)
- created_at (DATETIME)

## Performance Tips

1. **Enable Compression**: Already enabled via compression middleware
2. **Use Pagination**: Always use limit/offset parameters
3. **Cache Responses**: Implement caching in your mobile app
4. **Thumbnail First**: Load thumbnails before full images
5. **Stream Videos**: Use the built-in range request support
6. **CDN**: Use a CDN for static file delivery in production

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- Input validation
- SQL injection prevention (parameterized queries)

## Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env file or use environment variable
PORT=8080 npm start
```

### Database Locked
```bash
# Stop all running instances and restart
pm2 stop all
npm start
```

### Sharp Installation Issues
```bash
# Rebuild sharp for your platform
npm rebuild sharp
```

### File Upload Issues
```bash
# Check folder permissions
chmod -R 755 uploads/
```

## License

MIT License - Free to use for any purpose

## Support

For issues or questions:
1. Check the API documentation above
2. Review error logs in console
3. Check database integrity with SQLite browser

## Future Enhancements

- [ ] File upload via API
- [ ] User authentication
- [ ] Favorites/bookmarks
- [ ] Comments and ratings
- [ ] Full-text search
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] Batch operations
- [ ] Export functionality

---

Built with Node.js + Express for Scout Educational Content Management
