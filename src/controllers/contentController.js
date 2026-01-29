const Content = require('../models/Content');
const path = require('path');
const fs = require('fs').promises;
const { deleteFromCloudinary, getResourceType, getPublicIdFromUrl } = require('../utils/cloudinaryHelper');

// Helper function to transform content URLs for API responses
function transformContentUrls(item, req) {
  if (!item) return item;

  const baseUrl = `${req.protocol}://${req.get('host')}`;

  // If file_url is a local path, convert to API endpoint
  if (item.file_url && item.file_url.startsWith('/uploads/')) {
    item.file_url = `${baseUrl}/api/v1/content/${item.id}/file`;
  }

  // If thumbnail_url is a local path, convert to API endpoint
  if (item.thumbnail_url && item.thumbnail_url.startsWith('/uploads/')) {
    item.thumbnail_url = `${baseUrl}/api/v1/content/${item.id}/thumbnail`;
  }

  return item;
}

// Transform array of content items
function transformContentArray(items, req) {
  return items.map(item => transformContentUrls(item, req));
}

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

      // Transform URLs for backward compatibility
      const transformedContent = transformContentArray(content, req);

      res.json({
        success: true,
        data: transformedContent,
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

      // Transform URLs for backward compatibility
      const transformedContent = transformContentUrls(content, req);

      res.json({
        success: true,
        data: transformedContent
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
        // Proxy the file from Cloudinary with correct headers
        const https = require('https');
        const http = require('http');

        const protocol = content.file_url.startsWith('https://') ? https : http;

        // Determine correct content type
        let contentType = content.mime_type || 'application/octet-stream';
        if (content.type === 'pdf' && !contentType.includes('pdf')) {
          contentType = 'application/pdf';
        }

        // Set response headers before proxying
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(content.title || 'file')}"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=86400');

        // Proxy the request
        protocol.get(content.file_url, (proxyRes) => {
          if (proxyRes.statusCode === 200) {
            // Forward content-length if available
            if (proxyRes.headers['content-length']) {
              res.setHeader('Content-Length', proxyRes.headers['content-length']);
            }
            proxyRes.pipe(res);
          } else {
            console.error(`Cloudinary returned ${proxyRes.statusCode} for ${content.file_url}`);
            res.status(proxyRes.statusCode).json({
              success: false,
              message: `Failed to fetch file from storage (${proxyRes.statusCode})`
            });
          }
        }).on('error', (error) => {
          console.error('Error proxying file:', error);
          res.status(500).json({
            success: false,
            message: 'Error streaming file',
            error: error.message
          });
        });
        return;
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

      // Transform URLs for backward compatibility
      const transformedContent = transformContentArray(content, req);

      res.json({
        success: true,
        data: transformedContent
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

      // Transform URLs for backward compatibility
      const transformedContent = transformContentArray(content, req);

      res.json({
        success: true,
        data: transformedContent
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
