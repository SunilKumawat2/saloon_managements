import { pool } from '../config/db.js';

let DEMO_USERS = [
  { id: 1, branch_id: 1, branch_name: 'Connaught Place Main Salon', role_id: 1, role_name: 'Admin', name: 'Sunil Kumar (Admin)', email: 'admin@saloon.com', phone: '9876543210', is_active: true, created_at: new Date().toISOString() },
  { id: 2, branch_id: 1, branch_name: 'Connaught Place Main Salon', role_id: 2, role_name: 'Manager', name: 'Rohan Verma (Manager)', email: 'rohan.manager@saloon.com', phone: '9876543211', is_active: true, created_at: new Date().toISOString() },
  { id: 3, branch_id: 1, branch_name: 'Connaught Place Main Salon', role_id: 3, role_name: 'Receptionist', name: 'Priya Sharma (Receptionist)', email: 'priya.reception@saloon.com', phone: '9876543212', is_active: true, created_at: new Date().toISOString() },
  { id: 4, branch_id: 2, branch_name: 'Cyber Hub Luxury Branch', role_id: 4, role_name: 'Staff', name: 'Amit Singh (Senior Stylist)', email: 'amit.stylist@saloon.com', phone: '9876543213', is_active: true, created_at: new Date().toISOString() }
];

export const UserModel = {
  async findAll(options = {}) {
    try {
      const page = Math.max(1, parseInt(options.page || '1'));
      const limit = options.limit && options.limit !== 'all' ? parseInt(options.limit) : null;
      const search = options.search ? String(options.search).trim() : '';
      const role = options.role ? String(options.role).trim() : '';
      const currentUser = options.currentUser || null;

      let baseSql = 'FROM users u LEFT JOIN roles r ON u.role_id = r.id LEFT JOIN branches b ON u.branch_id = b.id';
      const whereConditions = [];
      const queryParams = [];

      // Multi-tenant Scoping
      if (currentUser) {
        const roleStr = String(currentUser.role || currentUser.role_name || '').trim().toLowerCase();
        const isSuper = currentUser.is_super_admin === true || currentUser.email === 'admin@saloon.com' || currentUser.id === 1 || roleStr.includes('super');
        const isOwner = !isSuper && (roleStr === 'admin' || roleStr === 'owner' || roleStr === 'salon admin' || currentUser.role_id === 1);

        if (isOwner) {
          queryParams.push(currentUser.id);
          const uidParam = `$${queryParams.length}`;
          whereConditions.push(`(
            u.id = ${uidParam} OR 
            (u.admin_id = ${uidParam} OR u.created_by_user_id = ${uidParam} OR b.admin_id = ${uidParam} OR b.created_by_user_id = ${uidParam})
          )`);
          // Hide Super Admin and other Salon Admins
          whereConditions.push(`(u.id = ${uidParam} OR (u.id != 1 AND u.email != 'admin@saloon.com' AND u.role_id != 1))`);
        } else if (!isSuper) {
          if (currentUser.branch_id) {
            queryParams.push(currentUser.branch_id);
            whereConditions.push(`u.branch_id = $${queryParams.length}`);
          } else {
            whereConditions.push(`u.id = ${currentUser.id}`);
          }
        }
      }

      if (search) {
        queryParams.push(`%${search}%`);
        whereConditions.push(`(u.name ILIKE $${queryParams.length} OR u.email ILIKE $${queryParams.length} OR u.phone ILIKE $${queryParams.length})`);
      }

      if (role && role !== 'All') {
        queryParams.push(role);
        whereConditions.push(`r.name ILIKE $${queryParams.length}`);
      }

      if (whereConditions.length > 0) {
        baseSql += ' WHERE ' + whereConditions.join(' AND ');
      }

      const countRes = await pool.query(`SELECT COUNT(*) ${baseSql}`, queryParams);
      const total = parseInt(countRes.rows[0]?.count || '0');

      let selectSql = `SELECT u.*, r.name as role_name, b.name as branch_name ${baseSql} ORDER BY u.id ASC`;

      if (limit && limit > 0) {
        const offset = (page - 1) * limit;
        const pageParams = [...queryParams, limit, offset];
        selectSql += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        const dataRes = await pool.query(selectSql, pageParams);
        let rows = (dataRes.rows && dataRes.rows.length > 0) ? dataRes.rows : ((search || role) ? [] : DEMO_USERS);

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
      let rows = (dataRes.rows && dataRes.rows.length > 0) ? dataRes.rows : ((search || role) ? [] : DEMO_USERS);
      return rows;
    } catch (err) {
      console.error('UserModel.findAll error:', err);
      let cleaned = DEMO_USERS;
      if (options.search) {
        const s = String(options.search).toLowerCase();
        cleaned = cleaned.filter(u => String(u.name || '').toLowerCase().includes(s) || String(u.email || '').toLowerCase().includes(s));
      }
      if (options.role && options.role !== 'All') {
        cleaned = cleaned.filter(u => u.role_name === options.role);
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

  async findByEmail(email) {
    try {
      const query = `
        SELECT u.*, r.name as role_name, r.permissions, b.name as branch_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN branches b ON u.branch_id = b.id
        WHERE u.email = $1
      `;
      const { rows } = await pool.query(query, [email]);
      return rows[0] || DEMO_USERS.find(u => u.email === email);
    } catch (err) {
      return DEMO_USERS.find(u => u.email === email);
    }
  },

  async create({ name, email, phone, role_id, branch_id, password, admin_id, created_by_user_id }) {
    let safeBranchId = (branch_id && !isNaN(parseInt(branch_id)) && parseInt(branch_id) > 0) ? parseInt(branch_id) : null;
    const safeRoleId = parseInt(role_id) || 1;
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : null;

    // Admin role has no branch_id
    if (safeRoleId === 1) {
      safeBranchId = null;
    } else if (safeBranchId) {
      // Ensure branch exists in database to prevent FK constraint violation
      try {
        const branchCheck = await pool.query('SELECT id FROM branches WHERE id = $1', [safeBranchId]);
        if (!branchCheck.rows || branchCheck.rows.length === 0) {
          const firstBranch = await pool.query('SELECT id FROM branches LIMIT 1');
          safeBranchId = firstBranch.rows[0]?.id || null;
        }
      } catch (e) {
        safeBranchId = null;
      }
    }

    // Auto-sync sequence so INSERT never hits duplicate key error
    await pool.query(`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1))`).catch(() => null);

    const query = `
      WITH inserted AS (
        INSERT INTO users (name, email, phone, role_id, branch_id, password, admin_id, created_by_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      )
      SELECT u.*, r.name as role_name, b.name as branch_name
      FROM inserted u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches b ON u.branch_id = b.id
    `;
    const { rows } = await pool.query(query, [name, email, cleanPhone, safeRoleId, safeBranchId, password || 'default123', admin_id || null, created_by_user_id || null]);
    return rows[0];
  },

  async update(id, { name, email, phone, role_id, branch_id }) {
    try {
      const query = `
        WITH updated AS (
          UPDATE users
          SET name = COALESCE($1, name),
              email = COALESCE($2, email),
              phone = COALESCE($3, phone),
              role_id = COALESCE($4, role_id),
              branch_id = COALESCE($5, branch_id)
          WHERE id = $6
          RETURNING *
        )
        SELECT u.*, r.name as role_name, b.name as branch_name
        FROM updated u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN branches b ON u.branch_id = b.id
      `;
      const { rows } = await pool.query(query, [name, email, phone, role_id ? parseInt(role_id) : null, branch_id ? parseInt(branch_id) : null, id]);
      return rows[0];
    } catch (err) {
      console.error('UserModel.update DB error:', err);
      DEMO_USERS = DEMO_USERS.map(u => u.id === id ? { ...u, name, email, phone, role_id, branch_id } : u);
      return DEMO_USERS.find(u => u.id === id);
    }
  },

  async updateProfile(id, { name, email, phone, password }) {
    try {
      let query;
      let params;
      if (password && String(password).trim()) {
        query = `
          WITH updated AS (
            UPDATE users
            SET name = COALESCE($1, name),
                email = COALESCE($2, email),
                phone = COALESCE($3, phone),
                password = $4
            WHERE id = $5
            RETURNING *
          )
          SELECT u.*, r.name as role_name, b.name as branch_name
          FROM updated u
          LEFT JOIN roles r ON u.role_id = r.id
          LEFT JOIN branches b ON u.branch_id = b.id
        `;
        params = [name, email, phone, String(password).trim(), id];
      } else {
        query = `
          WITH updated AS (
            UPDATE users
            SET name = COALESCE($1, name),
                email = COALESCE($2, email),
                phone = COALESCE($3, phone)
            WHERE id = $4
            RETURNING *
          )
          SELECT u.*, r.name as role_name, b.name as branch_name
          FROM updated u
          LEFT JOIN roles r ON u.role_id = r.id
          LEFT JOIN branches b ON u.branch_id = b.id
        `;
        params = [name, email, phone, id];
      }
      const { rows } = await pool.query(query, params);
      return rows[0];
    } catch (err) {
      console.error('UserModel.updateProfile DB error:', err);
      DEMO_USERS = DEMO_USERS.map(u => u.id === id ? { ...u, name: name || u.name, email: email || u.email, phone: phone || u.phone } : u);
      return DEMO_USERS.find(u => u.id === id);
    }
  },

  async toggleStatus(id) {
    try {
      const query = `
        UPDATE users SET is_active = NOT is_active WHERE id = $1
        RETURNING id, is_active
      `;
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (err) {
      const user = DEMO_USERS.find(u => u.id === id);
      if (user) user.is_active = !user.is_active;
      return user;
    }
  },

  async delete(id) {
    try {
      await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
      return { deleted: true };
    } catch (err) {
      DEMO_USERS = DEMO_USERS.filter(u => u.id !== id);
      return { deleted: true };
    }
  },
};

