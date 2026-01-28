const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Get all categories
router.get('/', categoryController.getAll.bind(categoryController));

// Get category tree
router.get('/tree', categoryController.getTree.bind(categoryController));

// Get single category by ID
router.get('/:id', categoryController.getById.bind(categoryController));

// Get category by slug
router.get('/slug/:slug', categoryController.getBySlug.bind(categoryController));

// Create category
router.post('/', categoryController.create.bind(categoryController));

// Update category
router.put('/:id', categoryController.update.bind(categoryController));

// Delete category
router.delete('/:id', categoryController.delete.bind(categoryController));

module.exports = router;
