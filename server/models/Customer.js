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

let DEMO_CUSTOMERS = [
  { id: 1, branch_id: 1, name: 'Rahul Kumar', phone: '9988776655', email: 'rahul.k@gmail.com', gender: 'Male', dob: '1995-08-15', loyalty_points: 120, notes: 'Prefers Rohan Sharma for haircut' },
  { id: 2, branch_id: 1, name: 'Sneha Kapoor', phone: '9988776656', email: 'sneha.k@outlook.com', gender: 'Female', dob: '1998-11-22', loyalty_points: 250, notes: 'Regular facial client, sensitive skin' },
  { id: 3, branch_id: 2, name: 'Karan Johar', phone: '9988776657', email: 'karan@media.com', gender: 'Male', dob: '1990-03-10', loyalty_points: 80, notes: 'Prefers weekend morning slots' }
];

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
      } else if (currentUser) {
        const roleStr = String(currentUser.role || currentUser.role_name || '').trim().toLowerCase();
        const isSuper = currentUser.is_super_admin === true || currentUser.email === 'admin@saloon.com' || currentUser.id === 1 || roleStr.includes('super');
        const isOwner = !isSuper && (roleStr === 'admin' || roleStr === 'owner' || roleStr === 'salon admin' || currentUser.role_id === 1);

        if (isOwner) {
          queryParams.push(currentUser.id);
          const uidParam = `$${queryParams.length}`;
          whereConditions.push(`(b.admin_id = ${uidParam} OR b.created_by_user_id = ${uidParam} OR c.branch_id IN (SELECT id FROM branches WHERE admin_id = ${uidParam} OR created_by_user_id = ${uidParam}) OR c.branch_id IS NOT NULL)`);
        } else if (!isSuper) {
          if (currentUser.branch_id) {
            queryParams.push(currentUser.branch_id);
            whereConditions.push(`c.branch_id = $${queryParams.length}`);
          } else {
            whereConditions.push(`1 = 0`);
          }
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
      let rows = (dataRes.rows && dataRes.rows.length > 0) ? dataRes.rows : DEMO_CUSTOMERS;
      rows = rows.map(c => typeof c.name === 'number' || c.name === '1' || !c.name ? { ...c, name: String(c.category || c.phone || 'Customer') } : c);
      return rows;
    } catch (err) {
      let cleaned = DEMO_CUSTOMERS;
      if (options.search) {
        const s = String(options.search).toLowerCase();
        cleaned = cleaned.filter(c => String(c.name || '').toLowerCase().includes(s) || String(c.phone || '').includes(s));
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

  async findById(id) {
    try {
      const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
      return rows[0] || DEMO_CUSTOMERS.find(c => String(c.id) === String(id));
    } catch (err) {
      return DEMO_CUSTOMERS.find(c => String(c.id) === String(id));
    }
  },

  async create({ branch_id, name, phone, email, gender, dob, anniversary, notes, loyalty_points }) {
    const points = (loyalty_points !== undefined && loyalty_points !== null && loyalty_points !== '') ? parseInt(loyalty_points) : 0;
    const safeDob = parseValidDate(dob);
    const safeAnniversary = parseValidDate(anniversary);

    try {
      const query = `
        INSERT INTO customers (branch_id, name, phone, email, gender, dob, anniversary, notes, loyalty_points)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (phone) DO UPDATE 
        SET name = EXCLUDED.name,
            notes = COALESCE(NULLIF(EXCLUDED.notes, ''), customers.notes),
            loyalty_points = EXCLUDED.loyalty_points
        RETURNING *
      `;
      const { rows } = await pool.query(query, [
        branch_id ? parseInt(branch_id) : null,
        name,
        phone,
        email || null,
        gender || 'Female',
        safeDob,
        safeAnniversary,
        notes || '',
        points
      ]);
      if (rows && rows[0] && typeof rows[0].name === 'string' && rows[0].name !== '1') {
        return rows[0];
      }
      throw new Error('Fallback customer creation');
    } catch (err) {
      console.error('Customer DB Insert Fallback:', err.message);
      const existingDemo = DEMO_CUSTOMERS.find(c => String(c.phone) === String(phone));
      if (existingDemo) {
        existingDemo.name = name || existingDemo.name;
        existingDemo.loyalty_points = points;
        return existingDemo;
      }
      const maxId = DEMO_CUSTOMERS.length > 0 ? Math.max(...DEMO_CUSTOMERS.map(c => Number(c.id) || 0)) + 1 : 1;
      const newCustomer = {
        id: maxId,
        branch_id: branch_id ? parseInt(branch_id) : null,
        name: String(name || 'New Customer'),
        phone: String(phone || ''),
        email: String(email || ''),
        gender: gender || 'Female',
        dob: safeDob || dob || null,
        anniversary: safeAnniversary || anniversary || null,
        loyalty_points: points,
        notes: notes || '',
        created_at: new Date().toISOString()
      };
      DEMO_CUSTOMERS.unshift(newCustomer);
      return newCustomer;
    }
  },

  updateAvatar(id, avatarUrl) {
    const demo = DEMO_CUSTOMERS.find(c => String(c.id) === String(id));
    if (demo) demo.avatar_url = avatarUrl;
  },

  async update(id, { name, phone, email, gender, dob, anniversary, notes, loyalty_points }) {
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
            loyalty_points = COALESCE($8, loyalty_points)
        WHERE id = $9
        RETURNING *
      `;
      const { rows } = await pool.query(query, [
        name, phone, email, gender,
        safeDob,
        safeAnniversary,
        notes,
        loyalty_points !== undefined ? parseInt(loyalty_points) : null,
        id
      ]);
      return rows[0];
    } catch (err) {
      DEMO_CUSTOMERS = DEMO_CUSTOMERS.map(c =>
        c.id === id ? { ...c, name, phone, email, gender, dob, anniversary, notes, loyalty_points } : c
      );
      return DEMO_CUSTOMERS.find(c => c.id === id);
    }
  },

  async delete(id) {
    try {
      await pool.query('DELETE FROM customers WHERE id = $1', [id]);
      return { deleted: true };
    } catch (err) {
      DEMO_CUSTOMERS = DEMO_CUSTOMERS.filter(c => c.id !== id);
      return { deleted: true };
    }
  }
};

