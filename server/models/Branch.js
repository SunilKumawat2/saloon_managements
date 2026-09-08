import { pool } from '../config/db.js';

let DEMO_BRANCHES = [
  { id: 1, name: 'Connaught Place Main Salon', code: 'CP-001', city: 'New Delhi', address: 'Block A, Inner Circle, Connaught Place', phone: '011-23456789', is_active: true, created_at: new Date().toISOString() },
  { id: 2, name: 'Cyber Hub Luxury Branch', code: 'CH-002', city: 'Gurugram', address: 'Building 10, DLF Cyber City', phone: '0124-9876543', is_active: true, created_at: new Date().toISOString() }
];

export const BranchModel = {
  async findAll() {
    try {
      const { rows } = await pool.query('SELECT * FROM branches ORDER BY id ASC');
      return rows.length > 0 ? rows : DEMO_BRANCHES;
    } catch (err) {
      return DEMO_BRANCHES;
    }
  },

  async create({ name, code, city, address, phone }) {
    try {
      const query = `
        INSERT INTO branches (name, code, city, address, phone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const { rows } = await pool.query(query, [name, code, city, address, phone]);
      return rows[0];
    } catch (err) {
      const newBranch = { id: DEMO_BRANCHES.length + 1, name, code, city, address, phone, is_active: true, created_at: new Date().toISOString() };
      DEMO_BRANCHES.push(newBranch);
      return newBranch;
    }
  },

  async update(id, { name, code, city, address, phone }) {
    try {
      const query = `
        UPDATE branches
        SET name = COALESCE($1, name),
            code = COALESCE($2, code),
            city = COALESCE($3, city),
            address = COALESCE($4, address),
            phone = COALESCE($5, phone)
        WHERE id = $6
        RETURNING *
      `;
      const { rows } = await pool.query(query, [name, code, city, address, phone, id]);
      return rows[0];
    } catch (err) {
      DEMO_BRANCHES = DEMO_BRANCHES.map(b => b.id === id ? { ...b, name, code, city, address, phone } : b);
      return DEMO_BRANCHES.find(b => b.id === id);
    }
  },

  async toggleStatus(id) {
    try {
      const query = `
        UPDATE branches SET is_active = NOT is_active WHERE id = $1
        RETURNING *
      `;
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (err) {
      const branch = DEMO_BRANCHES.find(b => b.id === id);
      if (branch) branch.is_active = !branch.is_active;
      return branch;
    }
  },

  async delete(id) {
    try {
      await pool.query(`DELETE FROM branches WHERE id = $1`, [id]);
      return { deleted: true };
    } catch (err) {
      DEMO_BRANCHES = DEMO_BRANCHES.filter(b => b.id !== id);
      return { deleted: true };
    }
  }
};
