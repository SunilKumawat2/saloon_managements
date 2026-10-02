import { pool } from '../config/db.js';

const Consumption = {
  getAll: async () => {
    const res = await pool.query(`
      SELECT spc.*, s.name as service_name, s.category as service_category,
             p.name as product_name, p.sku as product_sku
      FROM service_product_consumption spc
      JOIN services s ON spc.service_id = s.id
      JOIN products p ON spc.product_id = p.id
      ORDER BY spc.created_at DESC
    `);
    return res.rows;
  },

  create: async ({ service_id, product_id, quantity_consumed, unit, notes }) => {
    const res = await pool.query(`
      INSERT INTO service_product_consumption (service_id, product_id, quantity_consumed, unit, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [service_id, product_id, quantity_consumed || 1, unit || 'ml', notes || null]);
    return res.rows[0];
  },

  delete: async (id) => {
    const res = await pool.query(`DELETE FROM service_product_consumption WHERE id = $1 RETURNING *`, [id]);
    return res.rows[0];
  },

  update: async (id, { service_id, product_id, quantity_consumed, unit, notes }) => {
    const res = await pool.query(`
      UPDATE service_product_consumption
      SET service_id = COALESCE($1, service_id),
          product_id = COALESCE($2, product_id),
          quantity_consumed = COALESCE($3, quantity_consumed),
          unit = COALESCE($4, unit),
          notes = COALESCE($5, notes)
      WHERE id = $6
      RETURNING *
    `, [service_id, product_id, quantity_consumed, unit, notes, id]);
    const updated = res.rows[0];
    const enriched = await pool.query(`
      SELECT spc.*, s.name as service_name, s.category as service_category,
             p.name as product_name, p.sku as product_sku
      FROM service_product_consumption spc
      JOIN services s ON spc.service_id = s.id
      JOIN products p ON spc.product_id = p.id
      WHERE spc.id = $1
    `, [id]);
    return enriched.rows[0] || updated;
  }
};

export default Consumption;
