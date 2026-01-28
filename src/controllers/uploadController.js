const Content = require('../models/Content');
const thumbnailGenerator = require('../utils/thumbnailGenerator');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');

// Define allowed file types
const ALLOWED_TYPES = {
  pdf: {
    mimes: ['application/pdf'],
    extensions: ['.pdf']
  },
  image: {
    mimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/tiff', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.tif', '.tiff', '.webp']
  },
  video: {
    mimes: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/avi'],
    extensions: ['.mp4', '.mpeg', '.mov', '.wmv', '.flv', '.webm', '.avi']
  },
  presentation: {
    mimes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    extensions: ['.ppt', '.pptx']
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

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const type = getContentType(file.originalname);
    if (!type) {
      return cb(new Error('Unsupported file type'), null);
    }

    const uploadDir = path.join(process.env.UPLOAD_DIR || './uploads', type === 'image' ? 'images' : type);
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
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
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  }
});

class UploadController {
  // Upload single file
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const file = req.file;
      const type = getContentType(file.originalname);
      
      // Get metadata from request body
      const { title, title_ar, description, category_id, tags, is_featured } = req.body;
      
      // Generate filename for display
      const displayTitle = title || path.basename(file.originalname, path.extname(file.originalname));
      
      // Generate thumbnail
      const thumbnailDir = path.join(process.env.UPLOAD_DIR || './uploads', 'thumbnails');
      await fs.mkdir(thumbnailDir, { recursive: true });
      
      const thumbnailFilename = `thumb_${path.basename(file.filename, path.extname(file.filename))}.jpg`;
      const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
      
      await thumbnailGenerator.generate(file.path, thumbnailPath, type);
      
      // Create content record
      const contentData = {
        title: displayTitle,
        title_ar: title_ar || displayTitle,
        description: description || '',
        category_id: category_id || null,
        type: type,
        file_path: file.path,
        file_url: `/uploads/${type === 'image' ? 'images' : type}/${file.filename}`,
        thumbnail_path: thumbnailPath,
        thumbnail_url: `/uploads/thumbnails/${thumbnailFilename}`,
        file_size: file.size,
        mime_type: file.mimetype,
        tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
        is_featured: is_featured === 'true' || is_featured === true ? 1 : 0
      };

      const result = await Content.create(contentData);
      const newContent = await Content.findById(result.id);

      res.status(201).json({
        success: true,
        data: newContent,
        message: 'Content uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading file',
        error: error.message
      });
    }
  }

  // Upload multiple files
  async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const { category_id } = req.body;
      const results = [];
      const errors = [];

      for (const file of req.files) {
        try {
          const type = getContentType(file.originalname);
          const displayTitle = path.basename(file.originalname, path.extname(file.originalname));
          
          // Generate thumbnail
          const thumbnailDir = path.join(process.env.UPLOAD_DIR || './uploads', 'thumbnails');
          await fs.mkdir(thumbnailDir, { recursive: true });
          
          const thumbnailFilename = `thumb_${path.basename(file.filename, path.extname(file.filename))}.jpg`;
          const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
          
          await thumbnailGenerator.generate(file.path, thumbnailPath, type);
          
          // Create content record
          const contentData = {
            title: displayTitle,
            title_ar: displayTitle,
            description: '',
            category_id: category_id || null,
            type: type,
            file_path: file.path,
            file_url: `/uploads/${type === 'image' ? 'images' : type}/${file.filename}`,
            thumbnail_path: thumbnailPath,
            thumbnail_url: `/uploads/thumbnails/${thumbnailFilename}`,
            file_size: file.size,
            mime_type: file.mimetype,
            tags: [],
            is_featured: 0
          };

          const result = await Content.create(contentData);
          results.push({
            id: result.id,
            title: displayTitle,
            type: type
          });
        } catch (err) {
          errors.push({
            filename: file.originalname,
            error: err.message
          });
        }
      }

      res.status(201).json({
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
      console.error('Error uploading files:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading files',
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
