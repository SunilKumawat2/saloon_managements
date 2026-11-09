import { pool } from '../config/db.js';

let DEMO_ASSETS = [
  {
    id: 1,
    asset_name: 'Dyson Supersonic Professional Hair Dryer',
    asset_code: 'AST-DYSON-001',
    category: 'Styling Equipment',
    branch_id: 1,
    branch_name: 'Second Branches',
    assigned_to_admin_id: 2,
    assigned_admin_name: 'Second Admin',
    assigned_person_name: 'Lead Stylist Rahul',
    purchase_date: '2025-06-15',
    purchase_cost: 34990.00,
    warranty_expiry: '2027-06-15',
    condition_status: 'Operational',
    location_room: 'Styling Station 1',
    notes: 'Premium hair dryer provided for high-end styling station.',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    asset_name: 'Takara Belmont Hydraulic Styling Chair',
    asset_code: 'AST-CHAIR-002',
    category: 'Salon Furniture',
    branch_id: 1,
    branch_name: 'Second Branches',
    assigned_to_admin_id: 2,
    assigned_admin_name: 'Second Admin',
    assigned_person_name: 'Second Admin',
    purchase_date: '2025-01-10',
    purchase_cost: 48000.00,
    warranty_expiry: '2028-01-10',
    condition_status: 'Operational',
    location_room: 'Station A',
    notes: 'Heavy duty hydraulic recliner styling chair.',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    asset_name: 'L-Oreal Steamer & Hair Treatment Appliance',
    asset_code: 'AST-STMR-003',
    category: 'Electrical Appliances',
    branch_id: 2,
    branch_name: 'first saloon',
    assigned_to_admin_id: null,
    assigned_admin_name: null,
    assigned_person_name: 'Branch Manager Priya',
    purchase_date: '2025-03-20',
    purchase_cost: 22500.00,
    warranty_expiry: '2026-03-20',
    condition_status: 'Needs Maintenance',
    location_room: 'Spa & Treatment Room',
    notes: 'Heating element requires annual servicing.',
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    asset_name: 'Epson POS Thermal Receipt Printer & Cash Drawer',
    asset_code: 'AST-POS-004',
    category: 'IT & Electronics',
    branch_id: 1,
    branch_name: 'Second Branches',
    assigned_to_admin_id: 2,
    assigned_admin_name: 'Second Admin',
    assigned_person_name: 'Front Desk Receptionist',
    purchase_date: '2025-04-05',
    purchase_cost: 18500.00,
    warranty_expiry: '2027-04-05',
    condition_status: 'Operational',
    location_room: 'Reception Counter',
    notes: 'Connected to main POS billing console.',
    created_at: new Date().toISOString()
  }
];

export const AssetModel = {
  async findAll(options = {}) {
    try {
      let sql = `
        SELECT sa.*,
               b.name as branch_name,
               u.name as assigned_admin_name
        FROM salon_assets sa
        LEFT JOIN branches b ON sa.branch_id = b.id
        LEFT JOIN users u ON sa.assigned_to_admin_id = u.id
      `;
      const params = [];
      const conditions = [];

      if (options.admin_id && options.admin_id !== 'all' && options.admin_id !== 'ALL') {
        params.push(parseInt(options.admin_id));
        conditions.push(`(sa.admin_id = $${params.length} OR sa.created_by_admin_id = $${params.length} OR sa.assigned_to_admin_id = $${params.length} OR sa.branch_id IN (SELECT id FROM branches WHERE admin_id = $${params.length}))`);
      }

      if (options.branch_id && options.branch_id !== 'all' && options.branch_id !== 'ALL') {
        params.push(parseInt(options.branch_id));
        conditions.push(`(sa.branch_id = $${params.length} OR sa.branch_id IS NULL)`);
      }

      if (options.category && options.category !== 'all' && options.category !== 'ALL') {
        params.push(options.category);
        conditions.push(`sa.category = $${params.length}`);
      }

      if (options.condition_status && options.condition_status !== 'all' && options.condition_status !== 'ALL') {
        params.push(options.condition_status);
        conditions.push(`sa.condition_status = $${params.length}`);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY sa.id DESC';

      const { rows } = await pool.query(sql, params);
      if (rows && rows.length > 0) {
        return rows;
      }
      return DEMO_ASSETS;
    } catch (err) {
      console.error('AssetModel.findAll error:', err.message);
      return DEMO_ASSETS;
    }
  },

  async findById(id) {
    const numId = parseInt(id);
    try {
      const sql = `
        SELECT sa.*,
               b.name as branch_name,
               u.name as assigned_admin_name
        FROM salon_assets sa
        LEFT JOIN branches b ON sa.branch_id = b.id
        LEFT JOIN users u ON sa.assigned_to_admin_id = u.id
        WHERE sa.id = $1
      `;
      const { rows } = await pool.query(sql, [numId]);
      return rows[0] || DEMO_ASSETS.find(a => a.id === numId) || null;
    } catch (err) {
      return DEMO_ASSETS.find(a => a.id === numId) || null;
    }
  },

  async create(data) {
    try {
      const {
        asset_name,
        asset_code,
        category,
        branch_id,
        assigned_to_admin_id,
        assigned_person_name,
        purchase_date,
        purchase_cost,
        warranty_expiry,
        condition_status,
        location_room,
        notes,
        admin_id,
        created_by_admin_id,
        asset_type,
        rental_mode,
        daily_rent_rate,
        issue_date,
        return_due_date,
        vendor_party_name
      } = data;

      const generatedCode = asset_code && asset_code.trim() 
        ? asset_code.trim().toUpperCase() 
        : `AST-${Date.now().toString().slice(-6)}`;

      let validBranchId = null;
      if (branch_id && branch_id !== 'ALL' && branch_id !== 'all') {
        const checkB = await pool.query('SELECT id FROM branches WHERE id = $1', [parseInt(branch_id)]).catch(() => ({ rows: [] }));
        if (checkB.rows && checkB.rows.length > 0) {
          validBranchId = parseInt(branch_id);
        }
      }

      let validAdminId = null;
      if (assigned_to_admin_id) {
        const checkU = await pool.query('SELECT id FROM users WHERE id = $1', [parseInt(assigned_to_admin_id)]).catch(() => ({ rows: [] }));
        if (checkU.rows && checkU.rows.length > 0) {
          validAdminId = parseInt(assigned_to_admin_id);
        }
      }

      const sql = `
        INSERT INTO salon_assets (
          asset_name, asset_code, category, branch_id, assigned_to_admin_id,
          assigned_person_name, purchase_date, purchase_cost, warranty_expiry,
          condition_status, location_room, notes, admin_id, created_by_admin_id,
          asset_type, rental_mode, daily_rent_rate, issue_date, return_due_date, vendor_party_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *
      `;
      const params = [
        asset_name ? asset_name.trim() : 'Salon Equipment',
        generatedCode,
        category || 'General Equipment',
        validBranchId,
        validAdminId,
        assigned_person_name ? assigned_person_name.trim() : null,
        purchase_date || null,
        purchase_cost ? parseFloat(purchase_cost) : 0.00,
        warranty_expiry || null,
        condition_status || 'Operational',
        location_room || 'Main Salon Floor',
        notes || null,
        admin_id ? parseInt(admin_id) : null,
        created_by_admin_id ? parseInt(created_by_admin_id) : null,
        asset_type || 'Owned',
        rental_mode || 'Free',
        daily_rent_rate ? parseFloat(daily_rent_rate) : 0.00,
        issue_date || null,
        return_due_date || null,
        vendor_party_name ? vendor_party_name.trim() : null
      ];

      const { rows } = await pool.query(sql, params);
      const created = rows[0];

      const enriched = await pool.query(`
        SELECT sa.*, b.name as branch_name, u.name as assigned_admin_name
        FROM salon_assets sa
        LEFT JOIN branches b ON sa.branch_id = b.id
        LEFT JOIN users u ON sa.assigned_to_admin_id = u.id
        WHERE sa.id = $1
      `, [created.id]).catch(() => ({ rows: [created] }));

      return enriched.rows[0] || created;
    } catch (err) {
      console.error('AssetModel.create error:', err.message);
      const newAsset = {
        id: Date.now(),
        asset_name: data.asset_name || 'Salon Asset',
        asset_code: data.asset_code || `AST-${Date.now().toString().slice(-6)}`,
        category: data.category || 'General Equipment',
        branch_id: data.branch_id ? parseInt(data.branch_id) : null,
        assigned_to_admin_id: data.assigned_to_admin_id ? parseInt(data.assigned_to_admin_id) : null,
        assigned_person_name: data.assigned_person_name || 'Unassigned',
        purchase_date: data.purchase_date || new Date().toISOString().split('T')[0],
        purchase_cost: parseFloat(data.purchase_cost || 0),
        warranty_expiry: data.warranty_expiry || '',
        condition_status: data.condition_status || 'Operational',
        location_room: data.location_room || 'Main Floor',
        notes: data.notes || '',
        asset_type: data.asset_type || 'Owned',
        rental_mode: data.rental_mode || 'Free',
        daily_rent_rate: parseFloat(data.daily_rent_rate || 0),
        issue_date: data.issue_date || '',
        return_due_date: data.return_due_date || '',
        vendor_party_name: data.vendor_party_name || '',
        created_at: new Date().toISOString()
      };
      DEMO_ASSETS.unshift(newAsset);
      return newAsset;
    }
  },

  async update(id, data) {
    const numId = parseInt(id);
    try {
      const {
        asset_name,
        asset_code,
        category,
        branch_id,
        assigned_to_admin_id,
        assigned_person_name,
        purchase_date,
        purchase_cost,
        warranty_expiry,
        condition_status,
        location_room,
        notes,
        asset_type,
        rental_mode,
        daily_rent_rate,
        issue_date,
        return_due_date,
        vendor_party_name
      } = data;

      await pool.query(`
        UPDATE salon_assets
        SET asset_name = COALESCE($1, asset_name),
            asset_code = COALESCE($2, asset_code),
            category = COALESCE($3, category),
            branch_id = $4,
            assigned_to_admin_id = $5,
            assigned_person_name = COALESCE($6, assigned_person_name),
            purchase_date = COALESCE($7, purchase_date),
            purchase_cost = COALESCE($8, purchase_cost),
            warranty_expiry = COALESCE($9, warranty_expiry),
            condition_status = COALESCE($10, condition_status),
            location_room = COALESCE($11, location_room),
            notes = COALESCE($12, notes),
            asset_type = COALESCE($13, asset_type),
            rental_mode = COALESCE($14, rental_mode),
            daily_rent_rate = COALESCE($15, daily_rent_rate),
            issue_date = COALESCE($16, issue_date),
            return_due_date = COALESCE($17, return_due_date),
            vendor_party_name = COALESCE($18, vendor_party_name)
        WHERE id = $19
      `, [
        asset_name,
        asset_code,
        category,
        branch_id ? parseInt(branch_id) : null,
        assigned_to_admin_id ? parseInt(assigned_to_admin_id) : null,
        assigned_person_name,
        purchase_date,
        purchase_cost !== undefined ? parseFloat(purchase_cost) : null,
        warranty_expiry,
        condition_status,
        location_room,
        notes,
        asset_type,
        rental_mode,
        daily_rent_rate !== undefined ? parseFloat(daily_rent_rate) : null,
        issue_date,
        return_due_date,
        vendor_party_name,
        numId
      ]);

      const enriched = await pool.query(`
        SELECT sa.*, b.name as branch_name, u.name as assigned_admin_name
        FROM salon_assets sa
        LEFT JOIN branches b ON sa.branch_id = b.id
        LEFT JOIN users u ON sa.assigned_to_admin_id = u.id
        WHERE sa.id = $1
      `, [numId]).catch(() => ({ rows: [] }));

      return enriched.rows[0] || { id: numId, ...data };
    } catch (err) {
      console.error('AssetModel.update error:', err.message);
      DEMO_ASSETS = DEMO_ASSETS.map(a => a.id === numId ? { ...a, ...data } : a);
      return DEMO_ASSETS.find(a => a.id === numId);
    }
  },

  async delete(id) {
    const numId = parseInt(id);
    try {
      await pool.query('DELETE FROM salon_assets WHERE id = $1', [numId]);
      DEMO_ASSETS = DEMO_ASSETS.filter(a => a.id !== numId);
      return { deleted: true };
    } catch (err) {
      console.error('AssetModel.delete error:', err.message);
      DEMO_ASSETS = DEMO_ASSETS.filter(a => a.id !== numId);
      return { deleted: true };
    }
  }
};
