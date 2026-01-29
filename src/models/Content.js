const db = require('../utils/database');

class Content {
  static async create(data) {
    const sql = `
      INSERT INTO content (title, title_ar, description, category_id, type, file_path,
                          file_url, thumbnail_path, thumbnail_url, file_size, mime_type,
                          tags, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.title,
      data.title_ar || data.title,
      data.description || '',
      data.category_id || null,
      data.type,
      data.file_path,
      data.file_url,
      data.thumbnail_path || null,
      data.thumbnail_url || null,
      data.file_size || 0,
      data.mime_type || '',
      data.tags ? JSON.stringify(data.tags) : '[]',
      data.is_featured || 0
    ];

    return await db.run(sql, params);
  }

  static async findById(id) {
    const sql = `
      SELECT c.*, cat.name as category_name, cat.name_ar as category_name_ar
      FROM content c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.id = ?
    `;
    return await db.get(sql, [id]);
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT c.*, cat.name as category_name, cat.name_ar as category_name_ar
      FROM content c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.category_id) {
      sql += ' AND c.category_id = ?';
      params.push(filters.category_id);
    }

    if (filters.type) {
      sql += ' AND c.type = ?';
      params.push(filters.type);
    }

    if (filters.is_featured) {
      sql += ' AND c.is_featured = 1';
    }

    if (filters.search) {
      sql += ' AND (c.title LIKE ? OR c.title_ar LIKE ? OR c.description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Sorting
    const orderBy = filters.orderBy || 'created_at';
    const orderDir = filters.orderDir || 'DESC';
    sql += ` ORDER BY c.${orderBy} ${orderDir}`;

    // Pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await db.all(sql, params);
  }

  static async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as total FROM content WHERE 1=1';
    const params = [];

    if (filters.category_id) {
      sql += ' AND category_id = ?';
      params.push(filters.category_id);
    }

    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.search) {
      sql += ' AND (title LIKE ? OR title_ar LIKE ? OR description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const result = await db.get(sql, params);
    return result.total;
  }

  static async update(id, data) {
    const fields = [];
    const params = [];

    if (data.title) {
      fields.push('title = ?');
      params.push(data.title);
    }
    if (data.description) {
      fields.push('description = ?');
      params.push(data.description);
    }
    if (data.category_id !== undefined) {
      fields.push('category_id = ?');
      params.push(data.category_id);
    }
    if (data.is_featured !== undefined) {
      fields.push('is_featured = ?');
      params.push(data.is_featured);
    }
    if (data.tags) {
      fields.push('tags = ?');
      params.push(JSON.stringify(data.tags));
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE content SET ${fields.join(', ')} WHERE id = ?`;
    return await db.run(sql, params);
  }

  static async delete(id) {
    const sql = 'DELETE FROM content WHERE id = ?';
    return await db.run(sql, [id]);
  }

  static async incrementViewCount(id) {
    const sql = 'UPDATE content SET view_count = view_count + 1 WHERE id = ?';
    return await db.run(sql, [id]);
  }

  static async incrementDownloadCount(id) {
    const sql = 'UPDATE content SET download_count = download_count + 1 WHERE id = ?';
    return await db.run(sql, [id]);
  }

  static async getStats() {
    const sql = `
      SELECT
        COUNT(*) as total_content,
        SUM(CASE WHEN type = 'pdf' THEN 1 ELSE 0 END) as total_pdf,
        SUM(CASE WHEN type = 'image' THEN 1 ELSE 0 END) as total_images,
        SUM(CASE WHEN type = 'video' THEN 1 ELSE 0 END) as total_videos,
        SUM(CASE WHEN type = 'presentation' THEN 1 ELSE 0 END) as total_presentations,
        SUM(view_count) as total_views,
        SUM(download_count) as total_downloads,
        (SELECT COUNT(*) FROM categories) as total_categories
      FROM content
    `;
    return await db.get(sql);
  }

  // Get popular content (most viewed or downloaded)
  static async getPopular(sortBy = 'view_count', limit = 10) {
    const validSortFields = ['view_count', 'download_count'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'view_count';

    const sql = `
      SELECT c.*, cat.name as category_name, cat.name_ar as category_name_ar
      FROM content c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.${sortField} > 0
      ORDER BY c.${sortField} DESC
      LIMIT ?
    `;
    return await db.all(sql, [limit]);
  }

  // Get related content (same category or type)
  static async getRelated(contentId, limit = 6) {
    // First get the current content's category and type
    const current = await this.findById(contentId);
    if (!current) return [];

    const sql = `
      SELECT c.*, cat.name as category_name, cat.name_ar as category_name_ar
      FROM content c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.id != ?
        AND (c.category_id = ? OR c.type = ?)
      ORDER BY
        CASE WHEN c.category_id = ? THEN 0 ELSE 1 END,
        c.view_count DESC
      LIMIT ?
    `;
    return await db.all(sql, [contentId, current.category_id, current.type, current.category_id, limit]);
  }
}

module.exports = Content;
