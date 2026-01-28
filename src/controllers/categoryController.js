const Category = require('../models/Category');

class CategoryController {
  // Get all categories
  async getAll(req, res) {
    try {
      const categories = await Category.findAll();

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching categories',
        error: error.message
      });
    }
  }

  // Get category tree
  async getTree(req, res) {
    try {
      const tree = await Category.getTree();

      res.json({
        success: true,
        data: tree
      });
    } catch (error) {
      console.error('Error fetching category tree:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching category tree',
        error: error.message
      });
    }
  }

  // Get single category
  async getById(req, res) {
    try {
      const category = await Category.findById(req.params.id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching category',
        error: error.message
      });
    }
  }

  // Get category by slug
  async getBySlug(req, res) {
    try {
      const category = await Category.findBySlug(req.params.slug);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching category',
        error: error.message
      });
    }
  }

  // Create category
  async create(req, res) {
    try {
      const { name, name_ar, slug, description, icon, parent_id, order_index } = req.body;

      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          message: 'Name and slug are required'
        });
      }

      const result = await Category.create({
        name,
        name_ar,
        slug,
        description,
        icon,
        parent_id,
        order_index
      });

      const category = await Category.findById(result.id);

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully'
      });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating category',
        error: error.message
      });
    }
  }

  // Update category
  async update(req, res) {
    try {
      const { name, name_ar, slug, description, icon, parent_id, order_index } = req.body;

      await Category.update(req.params.id, {
        name,
        name_ar,
        slug,
        description,
        icon,
        parent_id,
        order_index
      });

      const category = await Category.findById(req.params.id);

      res.json({
        success: true,
        data: category,
        message: 'Category updated successfully'
      });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating category',
        error: error.message
      });
    }
  }

  // Delete category
  async delete(req, res) {
    try {
      await Category.delete(req.params.id);

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting category',
        error: error.message
      });
    }
  }
}

module.exports = new CategoryController();
