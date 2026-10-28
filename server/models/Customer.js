import { pool } from '../config/db.js';

const parseValidDate = (val) => {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // Handle day-month string format e.g. "17 October", "13 October", "15 November"
  const match = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2].toLowerCase();
    const year = match[3] || '2000';
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthIdx = monthNames.indexOf(monthName);
    if (monthIdx !== -1) {
      const month = String(monthIdx + 1).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    try {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const CustomerModel = {
  async findAll(options = {}) {
    try {
      const page = Math.max(1, parseInt(options.page || '1'));
      const limit = options.limit && options.limit !== 'all' ? parseInt(options.limit) : null;
      const search = options.search ? String(options.search).trim() : '';

      const currentUser = options.currentUser || null;
      const branchId = options.branch_id;

      let baseSql = `
        FROM customers c
        LEFT JOIN branches b ON c.branch_id = b.id
        LEFT JOIN LATERAL (
          SELECT * FROM customer_memberships 
          WHERE customer_id = c.id AND status = 'Active' 
          ORDER BY created_at DESC LIMIT 1
        ) cm ON TRUE
        LEFT JOIN memberships m ON cm.membership_id = m.id
      `;
      const whereConditions = [];
      const queryParams = [];

      // Multi-tenant Scoping for Customers
      if (branchId && branchId !== 'all') {
        queryParams.push(parseInt(branchId));
        whereConditions.push(`c.branch_id = $${queryParams.length}`);
      }

      if (currentUser) {
        const roleStr = String(currentUser.role || currentUser.role_name || '').trim().toLowerCase();
        const isSuper = currentUser.is_super_admin === true || currentUser.email === 'admin@saloon.com' || roleStr.includes('super');

        if (!isSuper) {
          const ownerAdminId = currentUser.admin_id || currentUser.id;
          queryParams.push(ownerAdminId);
          const uidParam = `$${queryParams.length}`;
          whereConditions.push(`(c.admin_id = ${uidParam} OR (c.admin_id IS NULL AND (c.created_by_admin_id = ${uidParam} OR b.admin_id = ${uidParam} OR b.created_by_user_id = ${uidParam} OR c.branch_id IN (SELECT id FROM branches WHERE admin_id = ${uidParam} OR created_by_user_id = ${uidParam}))))`);
        }
      }

      if (search) {
        queryParams.push(`%${search}%`);
        whereConditions.push(`(c.name ILIKE $${queryParams.length} OR c.phone ILIKE $${queryParams.length})`);
      }

      if (whereConditions.length > 0) {
        baseSql += ' WHERE ' + whereConditions.join(' AND ');
      }

      const countRes = await pool.query(`SELECT COUNT(DISTINCT c.id) ${baseSql}`, queryParams);
      const total = parseInt(countRes.rows[0]?.count || '0');

      let selectSql = `
        SELECT c.*,
               cm.id as membership_enrollment_id,
               cm.remaining_service_credit,
               cm.total_service_credit,
               cm.used_service_credit,
               cm.status as membership_status,
               m.name as membership_name,
               m.badge_color as membership_badge_color,
               m.discount_percent as membership_discount
        ${baseSql} 
        ORDER BY c.id DESC
      `;

      if (limit && limit > 0) {
        const offset = (page - 1) * limit;
        const pageParams = [...queryParams, limit, offset];
        selectSql += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        const dataRes = await pool.query(selectSql, pageParams);
        let rows = (dataRes.rows && dataRes.rows.length > 0) ? dataRes.rows : [];
        rows = rows.map(c => typeof c.name === 'number' || c.name === '1' || !c.name ? { ...c, name: String(c.category || c.phone || 'Customer') } : c);

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
      let rows = dataRes.rows || [];
      rows = rows.map(c => typeof c.name === 'number' || c.name === '1' || !c.name ? { ...c, name: String(c.category || c.phone || 'Customer') } : c);
      return rows;
    } catch (err) {
      console.error('CustomerModel.findAll error:', err);
      return [];
    }
  },

  async findById(id) {
    try {
      const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
      return rows[0] || null;
    } catch (err) {
      console.error('CustomerModel.findById error:', err);
      return null;
    }
  },

  async create({ branch_id, name, phone, email, gender, dob, anniversary, notes, loyalty_points, admin_id, created_by_admin_id }) {
    const points = (loyalty_points !== undefined && loyalty_points !== null && loyalty_points !== '') ? parseInt(loyalty_points) : 0;
    const safeDob = parseValidDate(dob);
    const safeAnniversary = parseValidDate(anniversary);

    let validBranchId = branch_id ? parseInt(branch_id) : null;
    if (validBranchId) {
      try {
        const checkBranch = await pool.query('SELECT id FROM branches WHERE id = $1', [validBranchId]);
        if (!checkBranch.rows || checkBranch.rows.length === 0) validBranchId = null;
      } catch (e) {
        validBranchId = null;
      }
    }

    try {
      const query = `
        INSERT INTO customers (branch_id, name, phone, email, gender, dob, anniversary, notes, loyalty_points, admin_id, created_by_admin_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (phone) DO UPDATE 
        SET name = EXCLUDED.name,
            notes = COALESCE(NULLIF(EXCLUDED.notes, ''), customers.notes),
            loyalty_points = EXCLUDED.loyalty_points,
            admin_id = COALESCE(EXCLUDED.admin_id, customers.admin_id)
        RETURNING *
      `;
      const { rows } = await pool.query(query, [
        validBranchId,
        name,
        phone,
        email || null,
        gender || 'Female',
        safeDob,
        safeAnniversary,
        notes || '',
        points,
        admin_id ? parseInt(admin_id) : null,
        created_by_admin_id ? parseInt(created_by_admin_id) : (admin_id ? parseInt(admin_id) : null)
      ]);
      return rows[0];
    } catch (err) {
      console.error('Customer DB Insert error:', err.message);
      throw err;
    }
  },

  updateAvatar(id, avatarUrl) {
    pool.query('UPDATE customers SET avatar_url = $1 WHERE id = $2', [avatarUrl, id]).catch(() => null);
  },

  async update(id, { name, phone, email, gender, dob, anniversary, notes, loyalty_points, is_blocked, is_abandoned, status, block_reason }) {
    const safeDob = parseValidDate(dob);
    const safeAnniversary = parseValidDate(anniversary);

    try {
      const query = `
        UPDATE customers
        SET name        = COALESCE($1, name),
            phone       = COALESCE($2, phone),
            email       = COALESCE($3, email),
            gender      = COALESCE($4, gender),
            dob         = COALESCE($5::date, dob),
            anniversary = COALESCE($6::date, anniversary),
            notes       = COALESCE($7, notes),
            loyalty_points = COALESCE($8, loyalty_points),
            is_blocked  = COALESCE($9, is_blocked),
            is_abandoned = COALESCE($10, is_abandoned),
            status      = COALESCE($11, status),
            block_reason = COALESCE($12, block_reason)
        WHERE id = $13
        RETURNING *
      `;
      const { rows } = await pool.query(query, [
        name, phone, email, gender,
        safeDob,
        safeAnniversary,
        notes,
        loyalty_points !== undefined ? parseInt(loyalty_points) : null,
        is_blocked !== undefined ? Boolean(is_blocked) : null,
        is_abandoned !== undefined ? Boolean(is_abandoned) : null,
        status || null,
        block_reason || null,
        id
      ]);
      return rows[0];
    } catch (err) {
      console.error('CustomerModel.update error:', err);
      throw err;
    }
  },

  async toggleBlock(id, reason = null) {
    try {
      const query = `
        UPDATE customers
        SET is_blocked = NOT COALESCE(is_blocked, FALSE),
            blocked_at = CASE WHEN NOT COALESCE(is_blocked, FALSE) THEN CURRENT_TIMESTAMP ELSE NULL END,
            block_reason = CASE WHEN NOT COALESCE(is_blocked, FALSE) THEN $2 ELSE NULL END,
            status = CASE WHEN NOT COALESCE(is_blocked, FALSE) THEN 'Blocked' ELSE (CASE WHEN is_abandoned THEN 'Abandoned' ELSE 'Active' END) END
        WHERE id = $1
        RETURNING *
      `;
      const { rows } = await pool.query(query, [id, reason]);
      return rows[0];
    } catch (err) {
      console.error('CustomerModel.toggleBlock error:', err);
      throw err;
    }
  },

  async toggleAbandon(id) {
    try {
      const query = `
        UPDATE customers
        SET is_abandoned = NOT COALESCE(is_abandoned, FALSE),
            abandoned_at = CASE WHEN NOT COALESCE(is_abandoned, FALSE) THEN CURRENT_TIMESTAMP ELSE NULL END,
            status = CASE WHEN NOT COALESCE(is_abandoned, FALSE) THEN 'Abandoned' ELSE (CASE WHEN is_blocked THEN 'Blocked' ELSE 'Active' END) END
        WHERE id = $1
        RETURNING *
      `;
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (err) {
      console.error('CustomerModel.toggleAbandon error:', err);
      throw err;
    }
  },

  async delete(id) {
    try {
      await pool.query('DELETE FROM customers WHERE id = $1', [id]);
      return { deleted: true };
    } catch (err) {
      console.error('CustomerModel.delete error:', err);
      throw err;
    }
  }
};

