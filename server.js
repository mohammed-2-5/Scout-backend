const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
require('dotenv').config();

const logger = require('./src/utils/logger');
const swaggerSpec = require('./src/config/swagger');
const db = require('./src/utils/database');
const contentRoutes = require('./src/routes/content');
const categoryRoutes = require('./src/routes/categories');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS === '*' ? '*' : process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware - integrate Morgan with Winston
const morganFormat = process.env.NODE_ENV === 'development' ? 'dev' : 'combined';
app.use(morgan(morganFormat, { stream: logger.stream }));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 500, // Increased from 100 to 500
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting for static assets (thumbnails, images, etc.)
    return req.path.includes('/thumbnail') || req.path.includes('/file');
  }
});
app.use('/api/', limiter);

// Custom handler for /uploads/* - checks local file first, then falls back to Cloudinary
const fs = require('fs');
app.use('/uploads', async (req, res, next) => {
  const localPath = path.join(__dirname, 'uploads', req.path);

  // Check if file exists locally
  if (fs.existsSync(localPath)) {
    return res.sendFile(localPath);
  }

  // File doesn't exist locally - try to find Cloudinary URL from database
  try {
    const Content = require('./src/models/Content');
    const filename = path.basename(req.path);
    const isThumbnail = req.path.includes('/thumbnails/');

    // Search for content with matching filename
    const allContent = await Content.findAll({ limit: 2000 });

    for (const item of allContent) {
      const itemFilePath = item.file_path || '';
      const itemThumbnailPath = item.thumbnail_path || '';
      const itemFilename = path.basename(itemFilePath);
      const itemThumbnailFilename = path.basename(itemThumbnailPath);

      // Match by exact filename or partial match
      const filenameClean = filename.replace(/\.[^/.]+$/, '').replace('_thumb', '');

      const isMatch =
        itemFilename === filename ||
        itemThumbnailFilename === filename ||
        filename.includes(filenameClean) ||
        itemFilename.includes(filenameClean);

      if (isMatch) {
        const redirectUrl = isThumbnail ? item.thumbnail_url : item.file_url;

        if (redirectUrl && redirectUrl.startsWith('http')) {
          logger.info(`📁 Redirect: ${req.path} → ${redirectUrl}`);
          return res.redirect(redirectUrl);
        }
      }
    }

    logger.warn(`📁 Not found: ${req.path}`);
    res.status(404).json({ success: false, message: 'File not found' });
  } catch (error) {
    logger.error('Uploads handler error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin dashboard static files
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Scout API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true
  }
}));

// Health check endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';
app.use(`${apiPrefix}/content`, contentRoutes);
app.use(`${apiPrefix}/categories`, categoryRoutes);

// Root endpoint
/**
 * @swagger
 * /:
 *   get:
 *     summary: API information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information and available endpoints
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Scout Content Backend API',
    version: '1.0.0',
    description: 'Backend API for Scout Educational Content Library',
    documentation: '/api-docs',
    endpoints: {
      health: '/health',
      docs: '/api-docs',
      content: `${apiPrefix}/content`,
      categories: `${apiPrefix}/categories`,
      stats: `${apiPrefix}/content/stats`
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await db.connect();
    logger.info('Database initialized successfully');

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 API: http://localhost:${PORT}${apiPrefix}`);
      logger.info(`💚 Health: http://localhost:${PORT}/health`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🛑 Shutting down gracefully...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🛑 Shutting down gracefully...');
  await db.close();
  process.exit(0);
});

startServer();
