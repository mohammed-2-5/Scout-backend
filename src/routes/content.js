const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { upload, controller: uploadController } = require('../controllers/uploadController');

/**
 * @swagger
 * /content:
 *   get:
 *     summary: Get all content
 *     tags: [Content]
 *     parameters:
 *       - $ref: '#/components/parameters/Search'
 *       - $ref: '#/components/parameters/Type'
 *       - $ref: '#/components/parameters/CategoryFilter'
 *       - $ref: '#/components/parameters/Featured'
 *       - $ref: '#/components/parameters/Limit'
 *       - $ref: '#/components/parameters/Offset'
 *     responses:
 *       200:
 *         description: List of content items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 *                 total:
 *                   type: integer
 */
router.get('/', contentController.getAll.bind(contentController));

/**
 * @swagger
 * /content/stats:
 *   get:
 *     summary: Get content statistics
 *     tags: [Content]
 *     responses:
 *       200:
 *         description: Content statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Stats'
 */
router.get('/stats', contentController.getStats.bind(contentController));

/**
 * @swagger
 * /content/popular:
 *   get:
 *     summary: Get popular content
 *     tags: [Content]
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [view_count, download_count]
 *           default: view_count
 *     responses:
 *       200:
 *         description: Popular content items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 */
router.get('/popular', contentController.getPopular.bind(contentController));

/**
 * @swagger
 * /content/types:
 *   get:
 *     summary: Get supported file types
 *     tags: [Content]
 *     responses:
 *       200:
 *         description: Supported file types and extensions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get('/types', uploadController.getSupportedTypes.bind(uploadController));

/**
 * @swagger
 * /content/{id}:
 *   get:
 *     summary: Get content by ID
 *     tags: [Content]
 *     parameters:
 *       - $ref: '#/components/parameters/ContentId'
 *     responses:
 *       200:
 *         description: Content details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Content'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', contentController.getById.bind(contentController));

/**
 * @swagger
 * /content/{id}/related:
 *   get:
 *     summary: Get related content
 *     tags: [Content]
 *     parameters:
 *       - $ref: '#/components/parameters/ContentId'
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Related content items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 */
router.get('/:id/related', contentController.getRelated.bind(contentController));

/**
 * @swagger
 * /content/{id}/file:
 *   get:
 *     summary: Download or stream file
 *     tags: [Content]
 *     parameters:
 *       - $ref: '#/components/parameters/ContentId'
 *     responses:
 *       200:
 *         description: File content
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       302:
 *         description: Redirect to Cloudinary URL
 *       404:
 *         description: File not found
 */
router.get('/:id/file', contentController.downloadFile.bind(contentController));

/**
 * @swagger
 * /content/{id}/thumbnail:
 *   get:
 *     summary: Get content thumbnail
 *     tags: [Content]
 *     parameters:
 *       - $ref: '#/components/parameters/ContentId'
 *     responses:
 *       200:
 *         description: Thumbnail image
 *       302:
 *         description: Redirect to thumbnail URL
 *       404:
 *         description: Thumbnail not found
 */
router.get('/:id/thumbnail', contentController.getThumbnail.bind(contentController));

/**
 * @swagger
 * /content:
 *   post:
 *     summary: Upload single file
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (PDF, image, video, presentation)
 *               title:
 *                 type: string
 *                 description: Content title
 *               title_ar:
 *                 type: string
 *                 description: Arabic title
 *               description:
 *                 type: string
 *                 description: Content description
 *               category_id:
 *                 type: integer
 *                 description: Category ID
 *               tags:
 *                 type: string
 *                 description: JSON array of tags
 *               is_featured:
 *                 type: boolean
 *                 description: Featured flag
 *     responses:
 *       201:
 *         description: Content uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Content'
 *                 message:
 *                   type: string
 *       400:
 *         description: No file uploaded or invalid file type
 *       500:
 *         description: Upload failed
 */
router.post('/', upload.single('file'), uploadController.uploadFile.bind(uploadController));

/**
 * @swagger
 * /content/bulk:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload (max 50)
 *               category_id:
 *                 type: integer
 *                 description: Category ID for all files
 *     responses:
 *       201:
 *         description: Files uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploaded:
 *                       type: array
 *                       items:
 *                         type: object
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *       400:
 *         description: No files uploaded or too many files
 */
router.post('/bulk', upload.array('files', 50), uploadController.uploadMultiple.bind(uploadController));

/**
 * @swagger
 * /content/{id}:
 *   put:
 *     summary: Update content metadata
 *     tags: [Content]
 *     parameters:
 *       - $ref: '#/components/parameters/ContentId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               title_ar:
 *                 type: string
 *               description:
 *                 type: string
 *               category_id:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_featured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Content updated successfully
 *       404:
 *         description: Content not found
 */
router.put('/:id', contentController.update.bind(contentController));

/**
 * @swagger
 * /content/{id}:
 *   delete:
 *     summary: Delete content
 *     tags: [Content]
 *     parameters:
 *       - $ref: '#/components/parameters/ContentId'
 *     responses:
 *       200:
 *         description: Content deleted successfully
 *       404:
 *         description: Content not found
 */
router.delete('/:id', contentController.delete.bind(contentController));

module.exports = router;

