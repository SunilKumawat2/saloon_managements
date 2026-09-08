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
  }
};
