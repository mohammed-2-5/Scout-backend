const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of all categories with content count
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
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/', categoryController.getAll.bind(categoryController));

/**
 * @swagger
 * /categories/tree:
 *   get:
 *     summary: Get hierarchical category tree
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Hierarchical category tree structure
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/Category'
 *                       - type: object
 *                         properties:
 *                           children:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/Category'
 */
router.get('/tree', categoryController.getTree.bind(categoryController));

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryId'
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', categoryController.getById.bind(categoryController));

/**
 * @swagger
 * /categories/slug/{slug}:
 *   get:
 *     summary: Get category by slug
 *     tags: [Categories]
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         description: Category slug (URL-friendly identifier)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 */
router.get('/slug/:slug', categoryController.getBySlug.bind(categoryController));

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - name_ar
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 description: English category name
 *               name_ar:
 *                 type: string
 *                 description: Arabic category name
 *               slug:
 *                 type: string
 *                 description: URL-friendly slug (must be unique)
 *               description:
 *                 type: string
 *                 description: Category description
 *               icon:
 *                 type: string
 *                 description: Icon emoji or URL
 *               parent_id:
 *                 type: integer
 *                 description: Parent category ID (for hierarchical categories)
 *               order_index:
 *                 type: integer
 *                 description: Display order
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Missing required fields or duplicate slug
 */
router.post('/', categoryController.create.bind(categoryController));

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               name_ar:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               parent_id:
 *                 type: integer
 *               order_index:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 */
router.put('/:id', categoryController.update.bind(categoryController));

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryId'
 *     responses:
 *       200:
 *         description: Category deleted successfully (content will be orphaned)
 *       404:
 *         description: Category not found
 */
router.delete('/:id', categoryController.delete.bind(categoryController));

module.exports = router;
