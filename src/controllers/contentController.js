const Content = require('../models/Content');
const path = require('path');
const fs = require('fs').promises;
const { deleteFromCloudinary, getResourceType, getPublicIdFromUrl } = require('../utils/cloudinaryHelper');

class ContentController {
  // Get all content with filters
  async getAll(req, res) {
    try {
      const filters = {
        category_id: req.query.category_id,
        type: req.query.type,
        is_featured: req.query.featured === 'true',
        search: req.query.search,
        orderBy: req.query.sortBy || 'created_at',
        orderDir: req.query.sortDir || 'DESC',
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const content = await Content.findAll(filters);
      const total = await Content.count(filters);

      res.json({
        success: true,
        data: content,
        pagination: {
          total,
          limit: filters.limit,
          offset: filters.offset,
          pages: Math.ceil(total / filters.limit)
        }
      });
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching content',
        error: error.message
      });
    }
  }

  // Get single content by ID
  async getById(req, res) {
    try {
      const content = await Content.findById(req.params.id);

      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }

      // Increment view count
      await Content.incrementViewCount(req.params.id);

      // Parse tags if stored as JSON string
      if (content.tags) {
        try {
          content.tags = JSON.parse(content.tags);
        } catch (e) {
          content.tags = [];
        }
      }

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching content',
        error: error.message
      });
    }
  }

  // Download/Stream file
  async downloadFile(req, res) {
    try {
      const content = await Content.findById(req.params.id);

      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }

      // Increment download count
      await Content.incrementDownloadCount(req.params.id);

      // Check if file_url is a Cloudinary URL (or any external URL)
      if (content.file_url && (content.file_url.startsWith('http://') || content.file_url.startsWith('https://'))) {
        // Redirect to Cloudinary URL
        return res.redirect(content.file_url);
      }

      // Fallback: Try to serve from local file system (for backward compatibility)
      const filePath = path.resolve(content.file_path);

      // Check if file exists locally
      try {
        await fs.access(filePath);
      } catch (error) {
        // File not found locally, check if there's a file_url
        if (content.file_url) {
          return res.redirect(content.file_url);
        }
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }

      // Set headers
      res.setHeader('Content-Type', content.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(content.title)}"`);

      // For videos, support range requests for streaming
      if (content.type === 'video') {
        const stat = await fs.stat(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunksize = (end - start) + 1;

          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': content.mime_type
          });

          const readStream = require('fs').createReadStream(filePath, { start, end });
          readStream.pipe(res);
        } else {
          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': content.mime_type
          });
          require('fs').createReadStream(filePath).pipe(res);
        }
      } else {
        // For other files, send normally
        res.sendFile(filePath);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      res.status(500).json({
        success: false,
        message: 'Error downloading file',
        error: error.message
      });
    }
  }

  // Get thumbnail
  async getThumbnail(req, res) {
    try {
      const content = await Content.findById(req.params.id);

      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }

      // Check if thumbnail_url is a Cloudinary URL (or any external URL)
      if (content.thumbnail_url && (content.thumbnail_url.startsWith('http://') || content.thumbnail_url.startsWith('https://'))) {
        // Redirect to Cloudinary URL
        return res.redirect(content.thumbnail_url);
      }

      // Fallback: Try to serve from local file system
      if (!content.thumbnail_path) {
        return res.status(404).json({
          success: false,
          message: 'Thumbnail not found'
        });
      }

      const thumbnailPath = path.resolve(content.thumbnail_path);

      // Check if file exists locally
      try {
        await fs.access(thumbnailPath);
      } catch (error) {
        // Return a placeholder or redirect to a default thumbnail
        if (content.thumbnail_url) {
          return res.redirect(content.thumbnail_url);
        }
        return res.status(404).json({
          success: false,
          message: 'Thumbnail file not found'
        });
      }

      res.sendFile(thumbnailPath);
    } catch (error) {
      console.error('Error fetching thumbnail:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching thumbnail',
        error: error.message
      });
    }
  }

  // Get statistics
  async getStats(req, res) {
    try {
      const stats = await Content.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching statistics',
        error: error.message
      });
    }
  }

  // Update content
  async update(req, res) {
    try {
      const { title, description, category_id, is_featured, tags } = req.body;

      await Content.update(req.params.id, {
        title,
        description,
        category_id,
        is_featured,
        tags
      });

      const updated = await Content.findById(req.params.id);

      res.json({
        success: true,
        data: updated,
        message: 'Content updated successfully'
      });
    } catch (error) {
      console.error('Error updating content:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating content',
        error: error.message
      });
    }
  }

  // Delete content
  async delete(req, res) {
    try {
      const content = await Content.findById(req.params.id);

      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }

      // Try to delete from Cloudinary if it's a Cloudinary URL
      if (content.file_url && content.file_url.includes('cloudinary.com')) {
        const publicId = getPublicIdFromUrl(content.file_url);
        if (publicId) {
          const resourceType = getResourceType(content.type);
          console.log(`🗑️ Deleting from Cloudinary: ${publicId} (${resourceType})`);
          await deleteFromCloudinary(publicId, resourceType);
        }
      }

      // Try to delete local files (if they exist)
      try {
        if (content.file_path && !content.file_path.startsWith('scout/')) {
          await fs.unlink(content.file_path);
        }
        if (content.thumbnail_path && !content.thumbnail_path.startsWith('scout/')) {
          await fs.unlink(content.thumbnail_path);
        }
      } catch (error) {
        // Files might not exist locally, that's fine
        console.log('Note: Local files not found or already deleted');
      }

      // Delete from database
      await Content.delete(req.params.id);

      res.json({
        success: true,
        message: 'Content deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting content',
        error: error.message
      });
    }
  }

  // Get popular content
  async getPopular(req, res) {
    try {
      const sortBy = req.query.sortBy || 'view_count'; // view_count or download_count
      const limit = parseInt(req.query.limit) || 10;

      const content = await Content.getPopular(sortBy, limit);

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      console.error('Error fetching popular content:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching popular content',
        error: error.message
      });
    }
  }

  // Get related content
  async getRelated(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 6;
      const content = await Content.getRelated(req.params.id, limit);

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      console.error('Error fetching related content:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching related content',
        error: error.message
      });
    }
  }
}

module.exports = new ContentController();
