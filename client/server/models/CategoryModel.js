import { pool } from '../config/db.js';

class CategoryModel {
  static async findAllCategories() {
    const query = `
      SELECT * FROM service_categories 
      ORDER BY id ASC;
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  static async findCategoryById(id) {
    const query = `SELECT * FROM service_categories WHERE id = $1;`;
    const res = await pool.query(query, [id]);
    return res.rows[0];
  }

  static async createCategory(categoryData) {
    const { name, description } = categoryData;
    const query = `
      INSERT INTO service_categories (name, description)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const values = [name, description || ''];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async updateCategory(id, categoryData) {
    const { name, description } = categoryData;
    const query = `
      UPDATE service_categories
      SET name = COALESCE($1, name),
          description = COALESCE($2, description)
      WHERE id = $3
      RETURNING *;
    `;
    const values = [name, description, id];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async deleteCategory(id) {
    const query = `DELETE FROM service_categories WHERE id = $1 RETURNING *;`;
    const res = await pool.query(query, [id]);
    return res.rows[0];
  }
}

export default CategoryModel;
