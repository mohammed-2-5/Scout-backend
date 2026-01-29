const Content = require('../models/Content');
const { uploadToCloudinary, getResourceType, deleteFromCloudinary, getPublicIdFromUrl } = require('../utils/cloudinaryHelper');
const {
  CONTENT_TYPES,
  FILE_EXTENSIONS,
  UPLOAD_LIMITS,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} = require('../constants');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const os = require('os');

// Define allowed file types using constants
const ALLOWED_TYPES = {
  [CONTENT_TYPES.PDF]: {
    extensions: FILE_EXTENSIONS.PDF
  },
  [CONTENT_TYPES.IMAGE]: {
    extensions: FILE_EXTENSIONS.IMAGE
  },
  [CONTENT_TYPES.VIDEO]: {
    extensions: FILE_EXTENSIONS.VIDEO
  },
  [CONTENT_TYPES.PRESENTATION]: {
    extensions: FILE_EXTENSIONS.PRESENTATION
  }
};

// Get content type from extension
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();

  for (const [type, config] of Object.entries(ALLOWED_TYPES)) {
    if (config.extensions.includes(ext)) {
      return type;
    }
  }
  return null;
}

// Configure multer storage to use temp directory
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const type = getContentType(file.originalname);
    if (!type) {
      return cb(new Error('Unsupported file type'), null);
    }

    // Use OS temp directory for temporary storage
    const tempDir = path.join(os.tmpdir(), 'scout-uploads');

    try {
      await fs.mkdir(tempDir, { recursive: true });
      cb(null, tempDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    // Clean filename (remove special characters)
    const cleanName = basename.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const type = getContentType(file.originalname);
  if (type) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: PDF, Images, Videos, Presentations'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: UPLOAD_LIMITS.MAX_FILE_SIZE
  }
});

class UploadController {
  /**
   * Helper method to process a single file upload
   * @param {Object} file - Multer file object
   * @param {Object} metadata - Additional metadata (title, description, etc.)
   * @returns {Object} Upload result with content data or error
   */
  async processFileUpload(file, metadata = {}) {
    try {
      const type = getContentType(file.originalname);
      const displayTitle = metadata.title || path.basename(file.originalname, path.extname(file.originalname));

      logger.info(`📤 Uploading ${file.originalname} to Cloudinary...`);

      // Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(file.path, type);

      // Clean up temp file
      try {
        await fs.unlink(file.path);
      } catch (cleanupError) {
        logger.warn('Could not delete temp file:', cleanupError.message);
      }

      if (!cloudinaryResult.success) {
        return {
          success: false,
          error: cloudinaryResult.error
        };
      }

      logger.info(`✅ Uploaded to Cloudinary: ${cloudinaryResult.url}`);

      // Create content record
      const contentData = {
        title: displayTitle,
        title_ar: metadata.title_ar || displayTitle,
        description: metadata.description || '',
        category_id: metadata.category_id || null,
        type: type,
        file_path: cloudinaryResult.publicId,
        file_url: cloudinaryResult.url,
        thumbnail_path: cloudinaryResult.publicId,
        thumbnail_url: cloudinaryResult.thumbnailUrl,
        file_size: file.size,
        mime_type: file.mimetype,
        tags: metadata.tags ? (typeof metadata.tags === 'string' ? JSON.parse(metadata.tags) : metadata.tags) : [],
        is_featured: metadata.is_featured === 'true' || metadata.is_featured === true ? 1 : 0
      };

      const result = await Content.create(contentData);
      const newContent = await Content.findById(result.id);

      return {
        success: true,
        data: newContent
      };
    } catch (error) {
      logger.error('Error processing file upload:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload single file
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.NO_FILES_UPLOADED
        });
      }

      const result = await this.processFileUpload(req.file, req.body);

      if (!result.success) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: ERROR_MESSAGES.UPLOAD_FAILED,
          error: result.error
        });
      }

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: result.data,
        message: SUCCESS_MESSAGES.CONTENT_CREATED
      });
    } catch (error) {
      logger.error('Error uploading file:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.UPLOAD_FAILED,
        error: error.message
      });
    }
  }

  // Upload multiple files
  async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.NO_FILES_UPLOADED
        });
      }

      if (req.files.length > UPLOAD_LIMITS.MAX_BULK_FILES) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `${ERROR_MESSAGES.TOO_MANY_FILES} ${UPLOAD_LIMITS.MAX_BULK_FILES}`
        });
      }

      const { category_id } = req.body;
      const results = [];
      const errors = [];

      for (const file of req.files) {
        const metadata = {
          category_id: category_id || null
        };

        const result = await this.processFileUpload(file, metadata);

        if (result.success) {
          results.push({
            id: result.data.id,
            title: result.data.title,
            type: result.data.type,
            url: result.data.file_url
          });
        } else {
          errors.push({
            filename: file.originalname,
            error: result.error
          });
        }
      }

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: {
          uploaded: results,
          errors: errors,
          total: results.length,
          failed: errors.length
        },
        message: `Uploaded ${results.length} files successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`
      });
    } catch (error) {
      logger.error('Error uploading files:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.UPLOAD_FAILED,
        error: error.message
      });
    }
  }

  // Get supported file types
  getSupportedTypes(req, res) {
    const types = {};
    for (const [type, config] of Object.entries(ALLOWED_TYPES)) {
      types[type] = config.extensions;
    }

    res.json({
      success: true,
      data: types
    });
  }
}

module.exports = {
  upload,
  controller: new UploadController()
};
