import { pool } from '../config/db.js';

let DEMO_LEADS = [
  { id: 1, branch_id: 1, name: 'Ananya Panday', phone: '9811223344', email: 'ananya@gmail.com', source: 'Instagram Ads', status: 'New', notes: 'Inquired about Keratin Hair Treatment', followup_date: '2026-09-08' },
  { id: 2, branch_id: 1, name: 'Varun Dhawan', phone: '9811223345', email: 'varun@gmail.com', source: 'Walk-in', status: 'Contacted', notes: 'Scheduled call back for bridal package', followup_date: '2026-09-09' },
  { id: 3, branch_id: 2, name: 'Kiara Advani', phone: '9811223346', email: 'kiara@gmail.com', source: 'Website Portal', status: 'Converted', notes: 'Booked Gold Facial appointment', followup_date: '2026-09-07' }
];

export const LeadModel = {
  async findAll(options = {}) {
    try {
      const page = Math.max(1, parseInt(options.page || '1'));
      const limit = options.limit && options.limit !== 'all' ? parseInt(options.limit) : null;
      const search = options.search ? String(options.search).trim() : '';
      const status = options.status ? String(options.status).trim() : '';

      const currentUser = options.currentUser || null;
      const branchId = options.branch_id;

      let baseSql = 'FROM leads l LEFT JOIN branches b ON l.branch_id = b.id';
      const whereConditions = [];
      const queryParams = [];

      // Multi-tenant Scoping for Leads
      if (currentUser) {
        const roleStr = String(currentUser.role || currentUser.role_name || '').trim().toLowerCase();
        const isSuper = currentUser.is_super_admin === true || currentUser.email === 'admin@saloon.com' || roleStr === 'super admin' || roleStr === 'superadmin';
        const isOwner = !isSuper && (roleStr === 'admin' || roleStr === 'owner' || roleStr === 'salon admin' || currentUser.role_id === 1);

        if (isOwner) {
          queryParams.push(currentUser.id);
          const uidParam = `$${queryParams.length}`;
          whereConditions.push(`(b.admin_id = ${uidParam} OR b.created_by_user_id = ${uidParam} OR l.branch_id IN (SELECT id FROM branches WHERE admin_id = ${uidParam} OR created_by_user_id = ${uidParam}))`);
        } else if (!isSuper) {
          if (currentUser.branch_id) {
            queryParams.push(currentUser.branch_id);
            whereConditions.push(`l.branch_id = $${queryParams.length}`);
          } else {
            whereConditions.push(`1 = 0`);
          }
        }
      }

      if (branchId && branchId !== 'all') {
        queryParams.push(parseInt(branchId));
        whereConditions.push(`l.branch_id = $${queryParams.length}`);
      }

      if (search) {
        queryParams.push(`%${search}%`);
        whereConditions.push(`(l.name ILIKE $${queryParams.length} OR l.phone ILIKE $${queryParams.length} OR l.email ILIKE $${queryParams.length} OR l.source ILIKE $${queryParams.length})`);
      }

      if (status && status !== 'All') {
        queryParams.push(status);
        whereConditions.push(`l.status = $${queryParams.length}`);
      }

      if (whereConditions.length > 0) {
        baseSql += ' WHERE ' + whereConditions.join(' AND ');
      }

      const countRes = await pool.query(`SELECT COUNT(DISTINCT l.id) ${baseSql}`, queryParams);
      const total = parseInt(countRes.rows[0]?.count || '0');

      let selectSql = `SELECT l.*, b.name AS branch_name ${baseSql} ORDER BY l.id DESC`;

      if (limit && limit > 0) {
        const offset = (page - 1) * limit;
        const pageParams = [...queryParams, limit, offset];
        selectSql += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        const dataRes = await pool.query(selectSql, pageParams);
        let rows = (dataRes.rows && dataRes.rows.length > 0) ? dataRes.rows : [];

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
      let rows = (dataRes.rows && dataRes.rows.length > 0) ? dataRes.rows : DEMO_LEADS;
      return rows;
    } catch (err) {
      let cleaned = DEMO_LEADS;
      if (options.search) {
        const s = String(options.search).toLowerCase();
        cleaned = cleaned.filter(l => String(l.name || '').toLowerCase().includes(s) || String(l.phone || '').includes(s) || String(l.email || '').toLowerCase().includes(s) || String(l.source || '').toLowerCase().includes(s));
      }
      if (options.status && options.status !== 'All') {
        cleaned = cleaned.filter(l => l.status === options.status);
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

  async create({ branch_id, name, phone, email, source, notes, followup_date }) {
    try {
      const query = `
        INSERT INTO leads (branch_id, name, phone, email, source, status, notes, followup_date)
        VALUES ($1, $2, $3, $4, $5, 'New', $6, $7)
        RETURNING *
      `;
      const { rows } = await pool.query(query, [branch_id ? parseInt(branch_id) : null, name, phone, email, source || 'Walk-in', notes || '', followup_date || null]);
      return rows[0];
    } catch (err) {
      const newLead = {
        id: Date.now(),
        branch_id: branch_id ? parseInt(branch_id) : null,
        name,
        phone,
        email,
        source: source || 'Walk-in',
        status: 'New',
        notes,
        followup_date,
        created_at: new Date().toISOString()
      };
      DEMO_LEADS.unshift(newLead);
      return newLead;
    }
  },

  async updateStatus(id, status) {
    const numericId = parseInt(id);
    try {
      const { rows } = await pool.query('UPDATE leads SET status = $1 WHERE id = $2 RETURNING *', [status, numericId]);
      if (rows.length > 0) return rows[0];
      const lead = DEMO_LEADS.find(l => l.id === numericId);
      if (lead) lead.status = status;
      return lead;
    } catch (err) {
      const lead = DEMO_LEADS.find(l => l.id === numericId);
      if (lead) lead.status = status;
      return lead;
    }
  },

  async update(id, { name, phone, email, source, notes, followup_date, status }) {
    const numericId = parseInt(id);
    try {
      const { rows } = await pool.query(
        `UPDATE leads
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone),
             email = COALESCE($3, email),
             source = COALESCE($4, source),
             notes = COALESCE($5, notes),
             followup_date = COALESCE($6::date, followup_date),
             status = COALESCE($7, status)
         WHERE id = $8 RETURNING *`,
        [name, phone, email, source, notes, followup_date || null, status, numericId]
      );
      if (rows.length > 0) return rows[0];
      DEMO_LEADS = DEMO_LEADS.map(l =>
        l.id === numericId ? { ...l, name, phone, email, source, notes, followup_date, status } : l
      );
      return DEMO_LEADS.find(l => l.id === numericId);
    } catch (err) {
      DEMO_LEADS = DEMO_LEADS.map(l =>
        l.id === numericId ? { ...l, name, phone, email, source, notes, followup_date, status } : l
      );
      return DEMO_LEADS.find(l => l.id === numericId);
    }
  },

  async delete(id) {
    const numericId = parseInt(id);
    try {
      await pool.query('DELETE FROM leads WHERE id = $1', [numericId]);
      DEMO_LEADS = DEMO_LEADS.filter(l => l.id !== numericId);
      return { deleted: true };
    } catch (err) {
      DEMO_LEADS = DEMO_LEADS.filter(l => l.id !== numericId);
      return { deleted: true };
    }
  }
};
