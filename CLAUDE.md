# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scout Content Backend is a Node.js/Express REST API for managing educational content (PDFs, images, videos, presentations) for mobile applications. It uses SQLite for data storage and supports both local file storage and Cloudinary CDN.

## Essential Commands

### Development
```bash
npm install              # Install dependencies
npm run dev             # Start with auto-reload (uses nodemon)
npm start               # Start in production mode
npm test                # Run API tests
```

### Database
```bash
npm run init-db         # Initialize database schema
npm run migrate         # Import existing files from parent directory
```

### Utility Scripts
The root directory contains numerous utility scripts for Cloudinary operations:
- `node migrate-to-cloudinary.js` - Migrate local files to Cloudinary
- `node check-cloudinary-files.js` - Verify Cloudinary uploads
- `node fix-thumbnails.js` - Regenerate missing thumbnails
- `node scripts/generate-descriptions.js` - Generate content descriptions using Google Gemini AI

## Architecture

### Core Structure
```
server.js                    # Express app entry point with middleware setup
src/
  ├── controllers/          # Request handlers (contentController, categoryController, uploadController)
  ├── models/               # Database models (Content, Category) with static methods
  ├── routes/               # Express route definitions with Swagger docs
  ├── utils/                # Core utilities
  │   ├── database.js       # SQLite wrapper with promise-based API
  │   ├── cloudinaryHelper.js  # Cloudinary upload/delete operations
  │   ├── thumbnailGenerator.js # Generate thumbnails for PDFs/images
  │   ├── fileHelper.js     # File type detection and validation
  │   └── logger.js         # Winston logger with daily rotation
  ├── constants/            # Centralized constants (CONTENT_TYPES, CLOUDINARY_FOLDERS, etc.)
  ├── config/               # Configuration files (swagger.js)
  └── middleware/           # Custom middleware
```

### Database Layer

**Database Wrapper**: `src/utils/database.js` is a singleton class that wraps sqlite3 with promises. It provides:
- `db.run(sql, params)` - Execute INSERT/UPDATE/DELETE
- `db.get(sql, params)` - Fetch single row
- `db.all(sql, params)` - Fetch multiple rows
- `connect()` - Initialize DB and create tables/indexes
- `initTables()` - Creates schema with foreign keys and indexes

**Models** (`Content.js`, `Category.js`): Static class methods that build SQL queries and use the database wrapper. No ORM - raw SQL with parameterized queries for security.

### File Storage Architecture

**Dual Storage System**: Files can be stored locally OR on Cloudinary:
- Local files: Stored in `uploads/` subdirectories (pdf, images, videos, thumbnails)
- Cloudinary: Organized in folders (scout/pdfs, scout/images, etc.)
- Database tracks both: `file_path` (local), `file_url` (Cloudinary or relative URL)

**Fallback Handler** (server.js:56-105): The `/uploads/*` route checks local filesystem first, then queries database to redirect to Cloudinary URL if file is cloud-hosted. This enables seamless migration between storage backends.

**Content Types**: Defined in `src/constants/index.js`:
- `pdf` - PDFs
- `image` - Images (jpg, png, gif, webp, bmp, svg)
- `video` - Videos (mp4, avi, mov, wmv, flv, webm, mkv)
- `presentation` - PowerPoint/OpenDocument (ppt, pptx, odp)

### API Design Patterns

**Controllers**: Handle HTTP request/response, call model methods, return JSON responses with standard format:
```javascript
{ success: boolean, data: any, message?: string }
```

**Routes**: Define endpoint paths and bind controller methods. Heavily documented with Swagger JSDoc comments.

**Middleware Stack** (server.js):
1. Helmet (security headers)
2. CORS (configurable origins)
3. Compression (gzip)
4. Body parsing (JSON/URL-encoded)
5. Morgan logging (integrated with Winston)
6. Rate limiting (500 req/15min, skips static assets)

### Key Architectural Decisions

1. **No ORM**: Direct SQL for performance and simplicity. All queries use parameterized statements.

2. **Centralized Constants**: `src/constants/index.js` defines all magic strings, MIME types, error messages. Import and use these instead of hardcoding values.

3. **Logging**: Winston logger (`src/utils/logger.js`) with daily rotation. Logs stored in `logs/` directory. Always use `logger.info()`, `logger.error()`, etc., never `console.log()`.

4. **Swagger Documentation**: API docs auto-generated from JSDoc comments and served at `/api-docs`. Update comments when modifying routes.

5. **Thumbnail Generation**: Handled by `thumbnailGenerator.js` using Sharp for images and pdf-thumbnail for PDFs. Thumbnails are 300x300 by default (configurable in constants).

6. **Video Streaming**: Content controller (`downloadFile` method) supports HTTP range requests for video streaming.

7. **Category Hierarchy**: Categories support parent-child relationships via `parent_id` foreign key. Use `/api/v1/categories/tree` for nested structure.

## Environment Configuration

Required variables (see `.env.example`):
```bash
PORT=3000
NODE_ENV=development|production
DATABASE_PATH=./database/scout.db
UPLOAD_DIR=./uploads
API_PREFIX=/api/v1
ALLOWED_ORIGINS=*  # Comma-separated URLs or *
RATE_LIMIT_WINDOW=15  # Minutes
RATE_LIMIT_MAX=500    # Requests per window
```

Optional Cloudinary variables (see `.env.cloudinary.example`):
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Common Development Workflows

### Adding a New Endpoint

1. Add controller method in appropriate controller file
2. Add route in `src/routes/` with Swagger JSDoc
3. If needed, add model method in `src/models/`
4. Use constants from `src/constants/index.js`
5. Log actions with Winston logger

### Modifying Database Schema

1. Update `initTables()` in `src/utils/database.js`
2. Add migration logic if needed (currently no formal migrations)
3. Update model methods to match new schema
4. Test with `npm run init-db` on fresh database

### Testing Cloudinary Integration

1. Copy `.env.cloudinary.example` to `.env` and fill credentials
2. Run `node test-cloudinary.js` to verify connection
3. Run `node migrate-to-cloudinary.js` to upload existing files
4. Use `node check-cloudinary-files.js` to audit uploads

### Debugging File Access Issues

1. Check `logs/combined.log` and `logs/error.log` for Winston logs
2. Verify file paths in database: `SELECT file_path, file_url FROM content WHERE id=X`
3. Test direct access: `curl http://localhost:3000/api/v1/content/:id/file`
4. For Cloudinary files, check redirect behavior in `/uploads/*` handler

## Database Schema Reference

### content table
- Primary key: `id` (autoincrement)
- Foreign key: `category_id` → categories(id)
- File references: `file_path`, `file_url`, `thumbnail_path`, `thumbnail_url`
- Type constraint: CHECK(type IN ('pdf', 'image', 'video', 'presentation'))
- Indexes: category_id, type, is_featured
- Metadata: tags (JSON string), view_count, download_count
- Bilingual fields: title/title_ar, description/description_ar

### categories table
- Primary key: `id` (autoincrement)
- Self-referencing FK: `parent_id` → categories(id)
- Unique: `slug`
- Hierarchical ordering: `order_index`
- Bilingual: name/name_ar

## Important Implementation Notes

- **File Uploads**: Upload controller uses Multer middleware. Single file via POST `/content`, bulk via POST `/content/bulk` (max 50 files).

- **Graceful Shutdown**: Server listens for SIGINT/SIGTERM and closes database connection before exit.

- **Admin Interface**: Static HTML dashboard at `/admin` with vanilla JS frontend for content management.

- **API Prefix**: All routes use `/api/v1` prefix (configurable). Health check at `/health` is outside this prefix.

- **Arabic Support**: All content and categories support dual language (English/Arabic) for Scout's bilingual context.

- **View/Download Tracking**: Increment counters via `Content.incrementViewCount(id)` and `Content.incrementDownloadCount(id)`.

- **Related Content**: Algorithm in `Content.getRelated()` prioritizes same category, then same type, sorted by views.

## Deployment Notes

- Railway/Render configs provided (`railway.json`, `railway.toml`, `render.yaml`)
- Docker support via `Dockerfile` and `docker-compose.yml`
- Requires persistent volumes for `/database` and `/uploads` directories
- Database file must survive container restarts
- See `DEPLOYMENT.md` and `README_DEPLOYMENT.md` for platform-specific instructions
