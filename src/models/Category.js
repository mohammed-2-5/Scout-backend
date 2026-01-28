const db = require('../utils/database');

class Category {
  static async create(data) {
    const sql = `
      INSERT INTO categories (name, name_ar, slug, description, icon, parent_id, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.name,
      data.name_ar || data.name,
      data.slug,
      data.description || '',
      data.icon || '',
      data.parent_id || null,
      data.order_index || 0
    ];

    return await db.run(sql, params);
  }

  static async findById(id) {
    const sql = 'SELECT * FROM categories WHERE id = ?';
    return await db.get(sql, [id]);
  }

  static async findBySlug(slug) {
    const sql = 'SELECT * FROM categories WHERE slug = ?';
    return await db.get(sql, [slug]);
  }

  static async findAll() {
    const sql = `
      SELECT c.*, COUNT(content.id) as content_count
      FROM categories c
      LEFT JOIN content ON c.id = content.category_id
      GROUP BY c.id
      ORDER BY c.order_index ASC, c.name ASC
    `;
    return await db.all(sql);
  }

  static async findByParent(parentId = null) {
    const sql = `
      SELECT c.*, COUNT(content.id) as content_count
      FROM categories c
      LEFT JOIN content ON c.id = content.category_id
      WHERE c.parent_id ${parentId ? '= ?' : 'IS NULL'}
      GROUP BY c.id
      ORDER BY c.order_index ASC, c.name ASC
    `;
    const params = parentId ? [parentId] : [];
    return await db.all(sql, params);
  }

  static async update(id, data) {
    const fields = [];
    const params = [];

    if (data.name) {
      fields.push('name = ?');
      params.push(data.name);
    }
    if (data.name_ar) {
      fields.push('name_ar = ?');
      params.push(data.name_ar);
    }
    if (data.slug) {
      fields.push('slug = ?');
      params.push(data.slug);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      params.push(data.description);
    }
    if (data.icon !== undefined) {
      fields.push('icon = ?');
      params.push(data.icon);
    }
    if (data.parent_id !== undefined) {
      fields.push('parent_id = ?');
      params.push(data.parent_id);
    }
    if (data.order_index !== undefined) {
      fields.push('order_index = ?');
      params.push(data.order_index);
    }

    params.push(id);
    const sql = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
    return await db.run(sql, params);
  }

  static async delete(id) {
    // First, set category_id to NULL for all content in this category
    await db.run('UPDATE content SET category_id = NULL WHERE category_id = ?', [id]);

    // Delete the category
    const sql = 'DELETE FROM categories WHERE id = ?';
    return await db.run(sql, [id]);
  }

  static async getTree() {
    // Get all categories
    const categories = await this.findAll();

    // Build tree structure
    const categoryMap = {};
    const tree = [];

    // Create map
    categories.forEach(cat => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });

    // Build tree
    categories.forEach(cat => {
      if (cat.parent_id) {
        if (categoryMap[cat.parent_id]) {
          categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
        }
      } else {
        tree.push(categoryMap[cat.id]);
      }
    });

    return tree;
  }
}

module.exports = Category;
