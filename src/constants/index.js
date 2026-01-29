/**
 * Application Constants
 * Centralized constants to avoid magic strings throughout the codebase
 */

// Content Types
const CONTENT_TYPES = {
  PDF: 'pdf',
  IMAGE: 'image',
  VIDEO: 'video',
  PRESENTATION: 'presentation'
};

// Cloudinary Folders
const CLOUDINARY_FOLDERS = {
  PDFS: 'scout/pdfs',
  IMAGES: 'scout/images',
  VIDEOS: 'scout/videos',
  PRESENTATIONS: 'scout/presentations',
  OTHER: 'scout/other'
};

// Cloudinary Resource Types
const CLOUDINARY_RESOURCE_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  RAW: 'raw',
  AUTO: 'auto'
};

// File Extensions
const FILE_EXTENSIONS = {
  PDF: ['.pdf'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'],
  VIDEO: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'],
  PRESENTATION: ['.ppt', '.pptx', '.odp']
};

// MIME Types
const MIME_TYPES = {
  // PDFs
  PDF: 'application/pdf',

  // Images
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  WEBP: 'image/webp',
  BMP: 'image/bmp',
  SVG: 'image/svg+xml',

  // Videos
  MP4: 'video/mp4',
  AVI: 'video/x-msvideo',
  MOV: 'video/quicktime',
  WMV: 'video/x-ms-wmv',
  FLV: 'video/x-flv',
  WEBM: 'video/webm',
  MKV: 'video/x-matroska',

  // Presentations
  PPT: 'application/vnd.ms-powerpoint',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ODP: 'application/vnd.oasis.opendocument.presentation'
};

// Sort Fields
const SORT_FIELDS = {
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  TITLE: 'title',
  VIEW_COUNT: 'view_count',
  DOWNLOAD_COUNT: 'download_count'
};

// Sort Directions
const SORT_DIRECTIONS = {
  ASC: 'ASC',
  DESC: 'DESC'
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0
};

// File Upload Limits
const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB in bytes
  MAX_BULK_FILES: 50
};

// Thumbnail Settings
const THUMBNAIL = {
  WIDTH: 300,
  HEIGHT: 300,
  QUALITY: 80,
  TRANSFORMATION: 'c_thumb,w_300,h_300'
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// Error Messages
const ERROR_MESSAGES = {
  FILE_NOT_FOUND: 'File not found',
  CONTENT_NOT_FOUND: 'Content not found',
  CATEGORY_NOT_FOUND: 'Category not found',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'File upload failed',
  DATABASE_ERROR: 'Database error',
  CLOUDINARY_ERROR: 'Cloudinary upload error',
  NO_FILES_UPLOADED: 'No files uploaded',
  TOO_MANY_FILES: 'Too many files. Maximum is',
  INVALID_CONTENT_TYPE: 'Invalid content type'
};

// Success Messages
const SUCCESS_MESSAGES = {
  CONTENT_CREATED: 'Content created successfully',
  CONTENT_UPDATED: 'Content updated successfully',
  CONTENT_DELETED: 'Content deleted successfully',
  CATEGORY_CREATED: 'Category created successfully',
  CATEGORY_UPDATED: 'Category updated successfully',
  CATEGORY_DELETED: 'Category deleted successfully',
  FILES_UPLOADED: 'Files uploaded successfully'
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  STATS: 300, // 5 minutes
  CATEGORIES: 600, // 10 minutes
  POPULAR: 180, // 3 minutes
  CONTENT_LIST: 60 // 1 minute
};

module.exports = {
  CONTENT_TYPES,
  CLOUDINARY_FOLDERS,
  CLOUDINARY_RESOURCE_TYPES,
  FILE_EXTENSIONS,
  MIME_TYPES,
  SORT_FIELDS,
  SORT_DIRECTIONS,
  PAGINATION,
  UPLOAD_LIMITS,
  THUMBNAIL,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CACHE_TTL
};
