import { pool } from '../config/db.js';

const ensureMembershipColumns = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS memberships (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        discount_percent DECIMAL(5, 2) DEFAULT 0,
        validity_days INT DEFAULT 365,
        points_multiplier DECIMAL(3, 2) DEFAULT 1.0,
        service_value_limit DECIMAL(10, 2) DEFAULT 0,
        benefits TEXT,
        badge_color VARCHAR(20) DEFAULT '#00E676',
        is_active BOOLEAN DEFAULT true,
        admin_id INT,
        branch_id INT,
        created_by_admin_id INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5, 2) DEFAULT 0;
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS validity_days INT DEFAULT 365;
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS points_multiplier DECIMAL(3, 2) DEFAULT 1.0;
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS service_value_limit DECIMAL(10, 2) DEFAULT 0;
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS benefits TEXT;
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS badge_color VARCHAR(20) DEFAULT '#00E676';
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS admin_id INT;
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS branch_id INT;
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS created_by_admin_id INT;

      ALTER TABLE customer_memberships ADD COLUMN IF NOT EXISTS admin_id INT;
      ALTER TABLE customer_memberships ADD COLUMN IF NOT EXISTS branch_id INT;
    `);
  } catch (err) {
    console.error('ensureMembershipColumns warning:', err.message);
  }
};

const Membership = {
  // Get membership tiers filtered by admin_id and branch_id
  getAllTiers: async (options = {}) => {
    await ensureMembershipColumns();
    const { admin_id, branch_id } = options;

    let query = `
      SELECT m.*, 
             b.name as branch_name,
             u.name as creator_name,
             u.email as creator_email
      FROM memberships m 
      LEFT JOIN branches b ON m.branch_id = b.id
      LEFT JOIN users u ON COALESCE(m.created_by_admin_id, m.admin_id) = u.id
    `;
    const conditions = [];
    const params = [];

    if (admin_id && admin_id !== 'all' && admin_id !== 'ALL') {
      params.push(parseInt(admin_id));
      conditions.push(`(m.admin_id = $${params.length} OR m.created_by_admin_id = $${params.length} OR m.admin_id IS NULL)`);
    }

    if (branch_id && branch_id !== 'all' && branch_id !== 'ALL') {
      params.push(parseInt(branch_id));
      conditions.push(`(m.branch_id = $${params.length} OR m.branch_id IS NULL)`);
    }

    conditions.push(`(m.is_active = true OR m.is_active IS NULL)`);

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY m.price ASC`;

    const res = await pool.query(query, params);
    return res.rows;
  },

  // Create membership tier with admin_id and branch_id isolation
  createTier: async ({ name, price, discount_percent, validity_days, points_multiplier, service_value_limit, benefits, badge_color, admin_id, branch_id, created_by_admin_id }) => {
    await ensureMembershipColumns();
    const p = parseFloat(price || 0);
    const svLimit = service_value_limit ? parseFloat(service_value_limit) : (p * 1.5);

    const safeAdminId = admin_id ? parseInt(admin_id) : null;
    const safeBranchId = branch_id && branch_id !== 'all' && branch_id !== 'ALL' ? parseInt(branch_id) : null;
    const safeCreatedBy = created_by_admin_id ? parseInt(created_by_admin_id) : safeAdminId;

    const res = await pool.query(`
      INSERT INTO memberships (name, price, discount_percent, validity_days, points_multiplier, service_value_limit, benefits, badge_color, admin_id, branch_id, created_by_admin_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      name,
      p,
      parseFloat(discount_percent || 0),
      parseInt(validity_days || 365),
      parseFloat(points_multiplier || 1.0),
      svLimit,
      benefits || '',
      badge_color || '#00E676',
      safeAdminId,
      safeBranchId,
      safeCreatedBy
    ]);
    return res.rows[0];
  },

  // Update tier
  updateTier: async (id, { name, price, discount_percent, validity_days, points_multiplier, service_value_limit, benefits, badge_color, is_active, admin_id, branch_id }) => {
    const safeBranchId = branch_id && branch_id !== 'all' && branch_id !== 'ALL' ? parseInt(branch_id) : null;
    const safeAdminId = admin_id ? parseInt(admin_id) : null;

    const res = await pool.query(`
      UPDATE memberships
      SET name = COALESCE($1, name),
          price = COALESCE($2, price),
          discount_percent = COALESCE($3, discount_percent),
          validity_days = COALESCE($4, validity_days),
          points_multiplier = COALESCE($5, points_multiplier),
          service_value_limit = COALESCE($6, service_value_limit),
          benefits = COALESCE($7, benefits),
          badge_color = COALESCE($8, badge_color),
          is_active = COALESCE($9, is_active),
          admin_id = COALESCE($10, admin_id),
          branch_id = COALESCE($11, branch_id)
      WHERE id = $12
      RETURNING *
    `, [name, price, discount_percent, validity_days, points_multiplier, service_value_limit, benefits, badge_color, is_active, safeAdminId, safeBranchId, id]);
    return res.rows[0];
  },

  // Delete membership tier permanently from DB
  deleteTier: async (id) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Set membership_id to NULL on any linked enrolled customers to allow clean permanent deletion
      await client.query(`UPDATE customer_memberships SET membership_id = NULL WHERE membership_id = $1`, [id]);
      // Permanently delete tier from memberships table
      const res = await client.query(`DELETE FROM memberships WHERE id = $1 RETURNING *`, [id]);
      await client.query('COMMIT');
      return { deleted: true, tier: res.rows[0], message: 'Membership plan permanently deleted from database!' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Get active enrollment for customer
  getCustomerActiveMembership: async (customerId) => {
    const res = await pool.query(`
      SELECT cm.*, m.name as membership_name, m.discount_percent, m.points_multiplier, m.badge_color, m.benefits, m.service_value_limit
      FROM customer_memberships cm
      JOIN memberships m ON cm.membership_id = m.id
      WHERE cm.customer_id = $1 AND cm.status = 'Active' AND cm.end_date >= CURRENT_DATE
      ORDER BY m.discount_percent DESC
      LIMIT 1
    `, [customerId]);
    return res.rows[0] || null;
  },

  // Get all enrolled customer subscriptions with Admin & Branch filtering
  getEnrolledMembers: async (options = {}) => {
    const { admin_id, branch_id } = options;

    let query = `
      SELECT cm.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.branch_id as customer_branch_id,
             m.name as membership_name, m.discount_percent, m.badge_color, m.price as plan_price, m.service_value_limit,
             b.name as branch_name
      FROM customer_memberships cm
      JOIN customers c ON cm.customer_id = c.id
      JOIN memberships m ON cm.membership_id = m.id
      LEFT JOIN branches b ON COALESCE(cm.branch_id, c.branch_id) = b.id
    `;

    const conditions = [];
    const params = [];

    if (admin_id && admin_id !== 'all' && admin_id !== 'ALL') {
      params.push(parseInt(admin_id));
      conditions.push(`(cm.admin_id = $${params.length} OR c.branch_id IN (SELECT id FROM branches WHERE admin_id = $${params.length} OR created_by_user_id = $${params.length}) OR cm.admin_id IS NULL)`);
    }

    if (branch_id && branch_id !== 'all' && branch_id !== 'ALL') {
      params.push(parseInt(branch_id));
      conditions.push(`(cm.branch_id = $${params.length} OR c.branch_id = $${params.length})`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY cm.created_at DESC`;

    const res = await pool.query(query, params);
    return res.rows;
  },

  // Enroll customer into plan with admin_id and branch_id
  enrollCustomer: async ({ customer_id, membership_id, amount_paid, notes, admin_id, branch_id }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch tier details for validity_days & service_value_limit
      const tierRes = await client.query(`SELECT * FROM memberships WHERE id = $1`, [membership_id]);
      if (tierRes.rows.length === 0) throw new Error('Membership tier not found');
      const tier = tierRes.rows[0];

      // Resolve branch_id & admin_id from customer if not directly provided
      const custRes = await client.query(`SELECT id, branch_id FROM customers WHERE id = $1`, [customer_id]);
      const custBranchId = custRes.rows[0]?.branch_id || null;

      const safeBranchId = branch_id && branch_id !== 'all' && branch_id !== 'ALL' ? parseInt(branch_id) : custBranchId;
      let safeAdminId = admin_id ? parseInt(admin_id) : tier.admin_id;

      if (!safeAdminId && safeBranchId) {
        const branchRes = await client.query(`SELECT admin_id FROM branches WHERE id = $1`, [safeBranchId]);
        if (branchRes.rows.length > 0) safeAdminId = branchRes.rows[0].admin_id;
      }

      // Cancel previous active memberships for this customer
      await client.query(`
        UPDATE customer_memberships SET status = 'Superseded' WHERE customer_id = $1 AND status = 'Active'
      `, [customer_id]);

      // Calculate end date
      const validityDays = tier.validity_days || 365;
      const endRes = await client.query(`SELECT CURRENT_DATE + ($1 || ' days')::INTERVAL as end_date`, [validityDays]);
      const endDate = endRes.rows[0].end_date;

      const totalCredit = parseFloat(tier.service_value_limit || (tier.price * 1.5) || 1500);

      const enrollRes = await client.query(`
        INSERT INTO customer_memberships (customer_id, membership_id, start_date, end_date, amount_paid, total_service_credit, used_service_credit, remaining_service_credit, status, notes, admin_id, branch_id)
        VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, 0, $5, 'Active', $6, $7, $8)
        RETURNING *
      `, [customer_id, membership_id, endDate, amount_paid || tier.price, totalCredit, notes || `${tier.name} Subscription`, safeAdminId, safeBranchId]);

      await client.query('COMMIT');
      return enrollRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Redeem / Deduct Customer Subscription Service Credit
  redeemMemberCredit: async ({ customer_membership_id, customer_id, service_name, amount, notes, admin_id, branch_id }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch active membership
      const cmRes = await client.query(
        `SELECT * FROM customer_memberships WHERE id = $1 AND status = 'Active'`,
        [customer_membership_id]
      );
      if (cmRes.rows.length === 0) throw new Error('Active customer membership subscription not found');
      const cm = cmRes.rows[0];

      const redeemAmt = parseFloat(amount || 0);
      const remaining = parseFloat(cm.remaining_service_credit || 0);

      if (redeemAmt <= 0) throw new Error('Redemption amount must be greater than zero');
      if (redeemAmt > remaining) {
        throw new Error(`Insufficient wallet credit balance. Available: ₹${remaining}, Attempted: ₹${redeemAmt}`);
      }

      const newUsed = parseFloat(cm.used_service_credit || 0) + redeemAmt;
      const newRemaining = remaining - redeemAmt;

      // Update customer_memberships balance
      const updatedCmRes = await client.query(`
        UPDATE customer_memberships
        SET used_service_credit = $1,
            remaining_service_credit = $2
        WHERE id = $3
        RETURNING *
      `, [newUsed, newRemaining, customer_membership_id]);

      const safeAdminId = admin_id ? parseInt(admin_id) : cm.admin_id;
      const safeBranchId = branch_id && branch_id !== 'all' && branch_id !== 'ALL' ? parseInt(branch_id) : cm.branch_id;

      // Log in membership_credit_logs
      await client.query(`
        INSERT INTO membership_credit_logs (customer_membership_id, customer_id, service_name, amount, notes, admin_id, branch_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [customer_membership_id, customer_id || cm.customer_id, service_name || 'Service Credit Deduction', redeemAmt, notes || '', safeAdminId, safeBranchId]);

      await client.query('COMMIT');
      return updatedCmRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Update customer membership enrollment
  updateEnrollment: async (id, { membership_id, end_date, total_service_credit, remaining_service_credit, status, notes, admin_id, branch_id }) => {
    const safeAdminId = admin_id ? parseInt(admin_id) : null;
    const safeBranchId = branch_id && branch_id !== 'all' && branch_id !== 'ALL' ? parseInt(branch_id) : null;

    const res = await pool.query(`
      UPDATE customer_memberships
      SET membership_id = COALESCE($1, membership_id),
          end_date = COALESCE($2, end_date),
          total_service_credit = COALESCE($3, total_service_credit),
          remaining_service_credit = COALESCE($4, remaining_service_credit),
          status = COALESCE($5, status),
          notes = COALESCE($6, notes),
          admin_id = COALESCE($7, admin_id),
          branch_id = COALESCE($8, branch_id)
      WHERE id = $9
      RETURNING *
    `, [membership_id, end_date, total_service_credit, remaining_service_credit, status, notes, safeAdminId, safeBranchId, id]);
    return res.rows[0];
  },

  // Delete customer membership enrollment
  deleteEnrollment: async (id) => {
    await pool.query(`DELETE FROM membership_credit_logs WHERE customer_membership_id = $1`, [id]);
    const res = await pool.query(`DELETE FROM customer_memberships WHERE id = $1 RETURNING *`, [id]);
    return res.rows[0];
  },

  // Reactivate customer membership subscription
  reactivateEnrollment: async (id) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const cmRes = await client.query(`SELECT cm.*, m.validity_days, m.service_value_limit, m.price FROM customer_memberships cm JOIN memberships m ON cm.membership_id = m.id WHERE cm.id = $1`, [id]);
      if (cmRes.rows.length === 0) throw new Error('Enrolled membership record not found');
      const cm = cmRes.rows[0];

      const validityDays = cm.validity_days || 365;
      const endRes = await client.query(`SELECT CURRENT_DATE + ($1 || ' days')::INTERVAL as end_date`, [validityDays]);
      const newEndDate = endRes.rows[0].end_date;

      const totalCredit = parseFloat(cm.total_service_credit || cm.service_value_limit || (cm.price * 1.5) || 1500);

      const updateRes = await client.query(`
        UPDATE customer_memberships
        SET status = 'Active',
            start_date = CURRENT_DATE,
            end_date = $1,
            total_service_credit = $2,
            used_service_credit = 0,
            remaining_service_credit = $2
        WHERE id = $3
        RETURNING *
      `, [newEndDate, totalCredit, id]);

      await client.query('COMMIT');
      return updateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

export default Membership;
