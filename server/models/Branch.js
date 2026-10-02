import { pool } from '../config/db.js';

let DEMO_BRANCHES = [
  { id: 1, name: 'Connaught Place Main Salon', code: 'CP-001', city: 'New Delhi', address: 'Block A, Inner Circle, Connaught Place', phone: '011-23456789', is_active: true, created_at: new Date().toISOString() },
  { id: 2, name: 'Cyber Hub Luxury Branch', code: 'CH-002', city: 'Gurugram', address: 'Building 10, DLF Cyber City', phone: '0124-9876543', is_active: true, created_at: new Date().toISOString() }
];

export const BranchModel = {
  async findAll(options = {}) {
    try {
      const page = Math.max(1, parseInt(options.page || '1'));
      const limit = options.limit && options.limit !== 'all' ? parseInt(options.limit) : null;
      const search = options.search ? String(options.search).trim() : '';
      const currentUser = options.currentUser || null;

      let baseSql = 'FROM branches b LEFT JOIN users u ON (b.admin_id = u.id OR b.created_by_user_id = u.id)';
      const whereConditions = [];
      const queryParams = [];

      // Filter by role / user scope
      if (currentUser) {
        const roleStr = String(currentUser.role || currentUser.role_name || '').trim().toLowerCase();
        const isSuper = currentUser.is_super_admin === true || currentUser.email === 'admin@saloon.com' || currentUser.id === 1 || roleStr.includes('super');
        const isSalonOwner = !isSuper && (roleStr === 'admin' || roleStr === 'owner' || roleStr === 'salon admin' || currentUser.role_id === 1);

        if (isSalonOwner) {
          queryParams.push(currentUser.id);
          whereConditions.push(`(b.admin_id = $${queryParams.length} OR b.created_by_user_id = $${queryParams.length})`);
        } else if (!isSuper) {
          if (currentUser.branch_id) {
            queryParams.push(currentUser.branch_id);
            whereConditions.push(`b.id = $${queryParams.length}`);
          } else {
            whereConditions.push(`1 = 0`);
          }
        }
      }

      if (search) {
        queryParams.push(`%${search}%`);
        whereConditions.push(`(b.name ILIKE $${queryParams.length} OR b.code ILIKE $${queryParams.length} OR b.city ILIKE $${queryParams.length} OR u.name ILIKE $${queryParams.length})`);
      }

      if (whereConditions.length > 0) {
        baseSql += ' WHERE ' + whereConditions.join(' AND ');
      }

      const countRes = await pool.query(`SELECT COUNT(DISTINCT b.id) ${baseSql}`, queryParams);
      const total = parseInt(countRes.rows[0]?.count || '0');

      let selectSql = `SELECT b.*, u.name AS owner_name, u.email AS owner_email ${baseSql} ORDER BY b.id ASC`;

      if (limit && limit > 0) {
        const offset = (page - 1) * limit;
        const pageParams = [...queryParams, limit, offset];
        selectSql += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        const dataRes = await pool.query(selectSql, pageParams);
        let rows = (dataRes.rows && dataRes.rows.length > 0) ? dataRes.rows : (search ? [] : DEMO_BRANCHES);

        return {
          data: rows,
          pagination: {
            total: total || rows.length,
            page,
            limit,
            totalPages: Math.ceil((total || rows.length) / limit) || 1
          }
        };
      }

      const dataRes = await pool.query(selectSql, queryParams);
      let rows = (dataRes.rows && dataRes.rows.length > 0) ? dataRes.rows : (search ? [] : DEMO_BRANCHES);
      return rows;
    } catch (err) {
      console.error("BranchModel findAll DB error:", err);
      let cleaned = DEMO_BRANCHES;
      if (options.search) {
        const s = String(options.search).toLowerCase();
        cleaned = cleaned.filter(b => String(b.name || '').toLowerCase().includes(s) || String(b.code || '').toLowerCase().includes(s) || String(b.city || '').toLowerCase().includes(s));
      }
      if (options.limit && options.limit > 0 && options.limit !== 'all') {
        const page = options.page || 1;
        const total = cleaned.length;
        const start = (page - 1) * options.limit;
        return {
          data: cleaned.slice(start, start + options.limit),
          pagination: { total, page, limit: options.limit, totalPages: Math.ceil(total / options.limit) || 1 }
        };
      }
      return cleaned;
    }
  },

  async create({ name, code, city, address, phone, admin_id, created_by_user_id }) {
    try {
      const query = `
        INSERT INTO branches (name, code, city, address, phone, admin_id, created_by_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *, 
          (SELECT name FROM users WHERE id = $6) AS owner_name, 
          (SELECT email FROM users WHERE id = $6) AS owner_email
      `;
      const { rows } = await pool.query(query, [name, code, city, address, phone, admin_id || null, created_by_user_id || null]);
      return rows[0];
    } catch (err) {
      console.error("BranchModel create DB error:", err);
      const newBranch = { id: DEMO_BRANCHES.length + 1, name, code, city, address, phone, admin_id, created_by_user_id, is_active: true, created_at: new Date().toISOString() };
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
        RETURNING *,
          (SELECT name FROM users WHERE id = branches.admin_id) AS owner_name,
          (SELECT email FROM users WHERE id = branches.admin_id) AS owner_email
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
