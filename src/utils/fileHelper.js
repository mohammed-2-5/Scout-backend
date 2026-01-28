const path = require('path');

class FileHelper {
  constructor() {
    this.mimeTypes = {
      // Images
      '.jpg': { mime: 'image/jpeg', type: 'image' },
      '.jpeg': { mime: 'image/jpeg', type: 'image' },
      '.png': { mime: 'image/png', type: 'image' },
      '.gif': { mime: 'image/gif', type: 'image' },
      '.bmp': { mime: 'image/bmp', type: 'image' },
      '.webp': { mime: 'image/webp', type: 'image' },

      // PDFs
      '.pdf': { mime: 'application/pdf', type: 'pdf' },

      // Videos
      '.mp4': { mime: 'video/mp4', type: 'video' },
      '.avi': { mime: 'video/x-msvideo', type: 'video' },
      '.wmv': { mime: 'video/x-ms-wmv', type: 'video' },
      '.mov': { mime: 'video/quicktime', type: 'video' },
      '.mkv': { mime: 'video/x-matroska', type: 'video' },
      '.flv': { mime: 'video/x-flv', type: 'video' },

      // Presentations
      '.ppt': { mime: 'application/vnd.ms-powerpoint', type: 'presentation' },
      '.pptx': { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', type: 'presentation' },

      // Documents (treated as PDF for categorization)
      '.doc': { mime: 'application/msword', type: 'pdf' },
      '.docx': { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', type: 'pdf' }
    };
  }

  getFileInfo(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const info = this.mimeTypes[ext];

    if (!info) {
      return {
        mime: 'application/octet-stream',
        type: 'unknown',
        ext
      };
    }

    return {
      mime: info.mime,
      type: info.type,
      ext
    };
  }

  isSupported(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ext in this.mimeTypes;
  }

  sanitizeFileName(fileName) {
    // Remove or replace problematic characters
    return fileName
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_');
  }

  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  extractTitle(filePath) {
    const baseName = path.basename(filePath, path.extname(filePath));
    // Clean up the title
    return baseName
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .trim();
  }

  getCategoryFromPath(filePath) {
    // Extract category from the parent directory name
    const parts = filePath.split(path.sep);
    if (parts.length > 1) {
      // Get the parent directory name
      const parentDir = parts[parts.length - 2];
      return parentDir;
    }
    return null;
  }
}

module.exports = new FileHelper();
