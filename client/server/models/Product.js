import { pool } from '../config/db.js';

const Product = {
  getAll: async () => {
    const res = await pool.query(`
      SELECT p.*, s.name as supplier_name, s.company_name as supplier_company
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.created_at DESC
    `);
    return res.rows;
  },

  getById: async (id) => {
    const res = await pool.query(`
      SELECT p.*, s.name as supplier_name
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = $1
    `, [id]);
    return res.rows[0];
  },

  create: async ({ sku, name, category, type, unit, quantity, min_threshold, cost_price, retail_price, supplier_id, description, branch_id }) => {
    const generatedSku = sku || `SKU-${Date.now().toString().slice(-6)}`;
    const res = await pool.query(`
      INSERT INTO products (sku, name, category, type, unit, quantity, min_threshold, cost_price, retail_price, supplier_id, description, branch_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [generatedSku, name, category || 'Hair Care', type || 'Both', unit || 'pcs', quantity || 0, min_threshold || 10, cost_price || 0, retail_price || 0, supplier_id || null, description || null, branch_id || null]);
    return res.rows[0];
  },

  update: async (id, { name, category, type, unit, quantity, min_threshold, cost_price, retail_price, supplier_id, description }) => {
    const res = await pool.query(`
      UPDATE products
      SET name = COALESCE($1, name),
          category = COALESCE($2, category),
          type = COALESCE($3, type),
          unit = COALESCE($4, unit),
          quantity = COALESCE($5, quantity),
          min_threshold = COALESCE($6, min_threshold),
          cost_price = COALESCE($7, cost_price),
          retail_price = COALESCE($8, retail_price),
          supplier_id = $9,
          description = COALESCE($10, description)
      WHERE id = $11
      RETURNING *
    `, [name, category, type, unit, quantity, min_threshold, cost_price, retail_price, supplier_id || null, description, id]);
    return res.rows[0];
  },

  adjustStock: async (id, changeQty, reason, performed_by, notes) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const prodRes = await client.query(`UPDATE products SET quantity = quantity + $1 WHERE id = $2 RETURNING *`, [changeQty, id]);
      const updatedProd = prodRes.rows[0];

      await client.query(`
        INSERT INTO stock_adjustment_logs (product_id, change_qty, reason, performed_by, notes)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, changeQty, reason || 'Manual Adjustment', performed_by || 'Admin', notes || null]);

      await client.query('COMMIT');
      return updatedProd;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  delete: async (id) => {
    const res = await pool.query(`DELETE FROM products WHERE id = $1 RETURNING *`, [id]);
    return res.rows[0];
  }
};

export default Product;
