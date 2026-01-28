const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { upload, controller: uploadController } = require('../controllers/uploadController');

// Get all content (with filters)
router.get('/', contentController.getAll.bind(contentController));

// Get statistics
router.get('/stats', contentController.getStats.bind(contentController));

// Get popular content (most viewed/downloaded)
router.get('/popular', contentController.getPopular.bind(contentController));

// Get supported file types
router.get('/types', uploadController.getSupportedTypes.bind(uploadController));

// Get single content by ID
router.get('/:id', contentController.getById.bind(contentController));

// Get related content
router.get('/:id/related', contentController.getRelated.bind(contentController));

// Download/stream file
router.get('/:id/file', contentController.downloadFile.bind(contentController));

// Get thumbnail
router.get('/:id/thumbnail', contentController.getThumbnail.bind(contentController));

// Upload single file
router.post('/', upload.single('file'), uploadController.uploadFile.bind(uploadController));

// Upload multiple files
router.post('/bulk', upload.array('files', 50), uploadController.uploadMultiple.bind(uploadController));

// Update content
router.put('/:id', contentController.update.bind(contentController));

// Delete content
router.delete('/:id', contentController.delete.bind(contentController));

module.exports = router;

