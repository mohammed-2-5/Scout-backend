const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Scout Content Backend API',
      version: '1.0.0',
      description: 'RESTful API for Scout Educational Content Library - manage PDFs, images, videos, and presentations with Cloudinary integration',
      contact: {
        name: 'API Support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://scout-backend-production-9429.up.railway.app/api/v1',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Content',
        description: 'Content management endpoints'
      },
      {
        name: 'Categories',
        description: 'Category management endpoints'
      },
      {
        name: 'Upload',
        description: 'File upload endpoints'
      },
      {
        name: 'Health',
        description: 'System health and status'
      }
    ],
    components: {
      schemas: {
        Content: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Content ID'
            },
            title: {
              type: 'string',
              description: 'English title'
            },
            title_ar: {
              type: 'string',
              description: 'Arabic title'
            },
            description: {
              type: 'string',
              description: 'Content description'
            },
            category_id: {
              type: 'integer',
              description: 'Category ID',
              nullable: true
            },
            category_name: {
              type: 'string',
              description: 'Category name (join)'
            },
            type: {
              type: 'string',
              enum: ['pdf', 'image', 'video', 'presentation'],
              description: 'Content type'
            },
            file_url: {
              type: 'string',
              description: 'Direct URL to file (Cloudinary)'
            },
            thumbnail_url: {
              type: 'string',
              description: 'Thumbnail URL'
            },
            file_size: {
              type: 'integer',
              description: 'File size in bytes'
            },
            mime_type: {
              type: 'string',
              description: 'MIME type'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Content tags'
            },
            view_count: {
              type: 'integer',
              description: 'Number of views'
            },
            download_count: {
              type: 'integer',
              description: 'Number of downloads'
            },
            is_featured: {
              type: 'boolean',
              description: 'Featured flag'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Category ID'
            },
            name: {
              type: 'string',
              description: 'English name'
            },
            name_ar: {
              type: 'string',
              description: 'Arabic name'
            },
            slug: {
              type: 'string',
              description: 'URL-friendly slug'
            },
            description: {
              type: 'string',
              description: 'Category description'
            },
            icon: {
              type: 'string',
              description: 'Icon emoji or URL'
            },
            parent_id: {
              type: 'integer',
              description: 'Parent category ID',
              nullable: true
            },
            order_index: {
              type: 'integer',
              description: 'Display order'
            },
            content_count: {
              type: 'integer',
              description: 'Number of content items'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Stats: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total content count'
            },
            byType: {
              type: 'object',
              properties: {
                pdf: { type: 'integer' },
                image: { type: 'integer' },
                video: { type: 'integer' },
                presentation: { type: 'integer' }
              }
            },
            totalViews: {
              type: 'integer',
              description: 'Total view count'
            },
            totalDownloads: {
              type: 'integer',
              description: 'Total download count'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Detailed error information'
            }
          }
        }
      },
      parameters: {
        ContentId: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Content ID',
          schema: {
            type: 'integer'
          }
        },
        CategoryId: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Category ID',
          schema: {
            type: 'integer'
          }
        },
        Limit: {
          name: 'limit',
          in: 'query',
          description: 'Number of items to return (max 100)',
          schema: {
            type: 'integer',
            default: 50,
            maximum: 100
          }
        },
        Offset: {
          name: 'offset',
          in: 'query',
          description: 'Number of items to skip',
          schema: {
            type: 'integer',
            default: 0
          }
        },
        Search: {
          name: 'search',
          in: 'query',
          description: 'Search query',
          schema: {
            type: 'string'
          }
        },
        Type: {
          name: 'type',
          in: 'query',
          description: 'Filter by content type',
          schema: {
            type: 'string',
            enum: ['pdf', 'image', 'video', 'presentation']
          }
        },
        CategoryFilter: {
          name: 'category_id',
          in: 'query',
          description: 'Filter by category ID',
          schema: {
            type: 'integer'
          }
        },
        Featured: {
          name: 'featured',
          in: 'query',
          description: 'Filter by featured status',
          schema: {
            type: 'boolean'
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './server.js'] // Path to API route files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
