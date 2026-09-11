import { pool } from '../config/db.js';

const Supplier = {
  getAll: async () => {
    const res = await pool.query(`SELECT * FROM suppliers ORDER BY created_at DESC`);
    return res.rows;
  },

  create: async ({ name, company_name, phone, email, gstin, address }) => {
    const res = await pool.query(`
      INSERT INTO suppliers (name, company_name, phone, email, gstin, address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, company_name || null, phone, email || null, gstin || null, address || null]);
    return res.rows[0];
  },

  update: async (id, { name, company_name, phone, email, gstin, address }) => {
    const res = await pool.query(`
      UPDATE suppliers
      SET name = COALESCE($1, name),
          company_name = COALESCE($2, company_name),
          phone = COALESCE($3, phone),
          email = COALESCE($4, email),
          gstin = COALESCE($5, gstin),
          address = COALESCE($6, address)
      WHERE id = $7
      RETURNING *
    `, [name, company_name, phone, email, gstin, address, id]);
    return res.rows[0];
  },

  delete: async (id) => {
    const res = await pool.query(`DELETE FROM suppliers WHERE id = $1 RETURNING *`, [id]);
    return res.rows[0];
  }
};

export default Supplier;
