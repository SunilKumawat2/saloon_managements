import { pool } from '../config/db.js';

let DEMO_STYLISTS = [];

export const StylistModel = {
  async findAll(options = {}) {
    try {
      let sql = `
        SELECT s.*,
               b.name as branch_name
        FROM stylists s
        LEFT JOIN branches b ON s.branch_id = b.id
        ORDER BY s.id DESC
      `;
      const { rows } = await pool.query(sql);
      let result = (rows && rows.length > 0) ? rows : [...DEMO_STYLISTS];
      if (rows && rows.length > 0 && DEMO_STYLISTS.length > 0) {
        const dbIds = new Set(rows.map(r => String(r.id)));
        const extraDemo = DEMO_STYLISTS.filter(d => !dbIds.has(String(d.id)));
        result = [...rows, ...extraDemo];
      }

      // Filter by branch if specified
      if (options.branch_id && options.branch_id !== 'all') {
        result = result.filter(s => String(s.branch_id) === String(options.branch_id));
      }
      return result;
    } catch (err) {
      let result = [...DEMO_STYLISTS];
      if (options.branch_id && options.branch_id !== 'all') {
        result = result.filter(s => String(s.branch_id) === String(options.branch_id));
      }
      return result;
    }
  },

  async create({ name, phone, email, specialization, branch_id, is_active = true, rating = 5.0, admin_id, created_by_admin_id }) {
    try {
      let validBranchId = null;
      if (branch_id) {
        const checkB = await pool.query('SELECT id FROM branches WHERE id = $1', [parseInt(branch_id)]).catch(() => ({ rows: [] }));
        if (checkB.rows && checkB.rows.length > 0) {
          validBranchId = parseInt(branch_id);
        } else {
          const firstB = await pool.query('SELECT id FROM branches ORDER BY id ASC LIMIT 1').catch(() => ({ rows: [] }));
          if (firstB.rows && firstB.rows.length > 0) {
            validBranchId = firstB.rows[0].id;
          }
        }
      }

      const insertSql = `
        INSERT INTO stylists (name, phone, email, specialization, branch_id, is_active, is_available, rating, admin_id, created_by_admin_id)
        VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9)
        RETURNING *
      `;
      const insertParams = [
        name,
        phone || '',
        email || '',
        specialization || '',
        validBranchId,
        is_active,
        rating,
        admin_id ? parseInt(admin_id) : null,
        created_by_admin_id ? parseInt(created_by_admin_id) : null
      ];

      const { rows } = await pool.query(insertSql, insertParams);
      const created = rows[0];

      const enriched = await pool.query(
        `SELECT s.*, b.name as branch_name FROM stylists s LEFT JOIN branches b ON s.branch_id = b.id WHERE s.id = $1`,
        [created.id]
      ).catch(() => ({ rows: [created] }));

      return enriched.rows[0] || created;
    } catch (err) {
      console.error('StylistModel.create error:', err.message);
      const newStylist = {
        id: Date.now(),
        name, phone: phone || '', email: email || '',
        specialization: specialization || '',
        branch_id: branch_id ? parseInt(branch_id) : null,
        is_active: true, rating: rating || 5.0,
        created_at: new Date().toISOString()
      };
      DEMO_STYLISTS.unshift(newStylist);
      return newStylist;
    }
  },

  async update(id, { name, phone, email, specialization, branch_id, is_active, rating }) {
    const numId = parseInt(id);
    try {
      await pool.query(
        `UPDATE stylists
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone),
             specialization = COALESCE($3, specialization),
             branch_id = COALESCE($4, branch_id),
             is_active = COALESCE($5, is_active),
             is_available = COALESCE($5, is_available)
         WHERE id = $6`,
        [name, phone, specialization, branch_id ? parseInt(branch_id) : null, is_active, numId]
      );
      const enriched = await pool.query(
        `SELECT s.*, b.name as branch_name FROM stylists s LEFT JOIN branches b ON s.branch_id = b.id WHERE s.id = $1`,
        [numId]
      ).catch(() => ({ rows: [] }));
      return enriched.rows[0] || { id: numId, name, phone, specialization, branch_id, is_active };
    } catch (err) {
      console.error('StylistModel.update error:', err.message);
      DEMO_STYLISTS = DEMO_STYLISTS.map(s =>
        s.id === numId ? { ...s, name: name || s.name, phone: phone || s.phone, specialization: specialization || s.specialization, branch_id: branch_id || s.branch_id, is_active: is_active !== undefined ? is_active : s.is_active } : s
      );
      return DEMO_STYLISTS.find(s => s.id === numId);
    }
  },

  async delete(id) {
    const numId = parseInt(id);
    try {
      await pool.query('UPDATE appointments SET stylist_id = NULL WHERE stylist_id = $1', [numId]).catch(() => null);
      await pool.query('DELETE FROM stylists WHERE id = $1', [numId]).catch(() => null);
      await pool.query('DELETE FROM users WHERE id = $1', [numId]).catch(() => null);
      DEMO_STYLISTS = DEMO_STYLISTS.filter(s => s.id !== numId);
      return { deleted: true };
    } catch (err) {
      console.error('StylistModel.delete error:', err.message);
      DEMO_STYLISTS = DEMO_STYLISTS.filter(s => s.id !== numId);
      return { deleted: true };
    }
  },

  async toggleActive(id) {
    const numId = parseInt(id);
    try {
      const current = await pool.query('SELECT is_active, is_available FROM stylists WHERE id = $1', [numId]);
      const newVal = !(current.rows[0]?.is_active ?? current.rows[0]?.is_available);
      await pool.query('UPDATE stylists SET is_active = $1, is_available = $1 WHERE id = $2', [newVal, numId]);
      return { id: numId, is_active: newVal };
    } catch (err) {
      const s = DEMO_STYLISTS.find(s => s.id === numId);
      if (s) s.is_active = !s.is_active;
      return { id: numId, is_active: s?.is_active };
    }
  }
};
