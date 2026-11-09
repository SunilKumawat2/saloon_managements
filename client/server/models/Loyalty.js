import { pool } from '../config/db.js';

const Loyalty = {
  // Get points transaction ledger for customer or system-wide with Admin & Branch isolation
  getTransactions: async (options = {}) => {
    let customerId = null;
    let admin_id = null;
    let branch_id = null;

    if (typeof options === 'object' && options !== null) {
      customerId = options.customerId || options.customer_id || null;
      admin_id = options.admin_id || null;
      branch_id = options.branch_id || null;
    } else if (options) {
      customerId = options;
    }

    let query = `
      SELECT lt.*, c.name as customer_name, c.phone as customer_phone, b.name as branch_name
      FROM loyalty_transactions lt
      JOIN customers c ON lt.customer_id = c.id
      LEFT JOIN branches b ON COALESCE(lt.branch_id, c.branch_id) = b.id
    `;
    const conditions = [];
    const params = [];

    if (customerId) {
      params.push(parseInt(customerId));
      conditions.push(`lt.customer_id = $${params.length}`);
    }

    if (admin_id && admin_id !== 'all' && admin_id !== 'ALL') {
      params.push(parseInt(admin_id));
      conditions.push(`(lt.admin_id = $${params.length} OR c.branch_id IN (SELECT id FROM branches WHERE admin_id = $${params.length} OR created_by_user_id = $${params.length}) OR lt.admin_id IS NULL)`);
    }

    if (branch_id && branch_id !== 'all' && branch_id !== 'ALL') {
      params.push(parseInt(branch_id));
      conditions.push(`(lt.branch_id = $${params.length} OR c.branch_id = $${params.length})`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY lt.created_at DESC LIMIT 200`;

    const res = await pool.query(query, params);
    return res.rows;
  },

  // Log point transaction and update customer balance with Admin & Branch isolation
  addTransaction: async ({ customer_id, bill_id = null, points, transaction_type, description, admin_id = null, branch_id = null }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const custRes = await client.query(`SELECT id, branch_id FROM customers WHERE id = $1`, [customer_id]);
      const custBranchId = custRes.rows[0]?.branch_id || null;
      const safeBranchId = branch_id && branch_id !== 'all' && branch_id !== 'ALL' ? parseInt(branch_id) : custBranchId;

      let safeAdminId = admin_id ? parseInt(admin_id) : null;
      if (!safeAdminId && safeBranchId) {
        const bRes = await client.query(`SELECT admin_id FROM branches WHERE id = $1`, [safeBranchId]);
        if (bRes.rows.length > 0) safeAdminId = bRes.rows[0].admin_id;
      }

      const transRes = await client.query(`
        INSERT INTO loyalty_transactions (customer_id, bill_id, points, transaction_type, description, admin_id, branch_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [customer_id, bill_id, points, transaction_type, description, safeAdminId, safeBranchId]);

      // Update total customer balance
      await client.query(`
        UPDATE customers
        SET loyalty_points = GREATEST(0, loyalty_points + $1)
        WHERE id = $2
      `, [points, customer_id]);

      await client.query('COMMIT');
      return transRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Get referral list with Admin & Branch isolation
  getReferrals: async (options = {}) => {
    const { admin_id, branch_id } = options;

    let query = `
      SELECT r.*, 
             ref.name as referrer_name, ref.phone as referrer_phone,
             rec.name as referred_name, rec.phone as referred_phone,
             b.name as branch_name
      FROM referrals r
      JOIN customers ref ON r.referrer_id = ref.id
      LEFT JOIN customers rec ON r.referred_id = rec.id
      LEFT JOIN branches b ON COALESCE(r.branch_id, ref.branch_id) = b.id
    `;

    const conditions = [];
    const params = [];

    if (admin_id && admin_id !== 'all' && admin_id !== 'ALL') {
      params.push(parseInt(admin_id));
      conditions.push(`(r.admin_id = $${params.length} OR ref.branch_id IN (SELECT id FROM branches WHERE admin_id = $${params.length} OR created_by_user_id = $${params.length}) OR r.admin_id IS NULL)`);
    }

    if (branch_id && branch_id !== 'all' && branch_id !== 'ALL') {
      params.push(parseInt(branch_id));
      conditions.push(`(r.branch_id = $${params.length} OR ref.branch_id = $${params.length})`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY r.created_at DESC`;

    const res = await pool.query(query, params);
    return res.rows;
  },

  // Apply referral code when a new customer registers or completes booking
  applyReferralCode: async ({ referral_code, referred_customer_id, admin_id = null, branch_id = null }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Find referrer
      const refRes = await client.query(`SELECT id, name, loyalty_points, branch_id FROM customers WHERE UPPER(referral_code) = UPPER($1)`, [referral_code]);
      if (refRes.rows.length === 0) {
        throw new Error('Invalid Referral Code');
      }
      const referrer = refRes.rows[0];

      if (referrer.id === parseInt(referred_customer_id)) {
        throw new Error('Self-referral is not allowed');
      }

      // Check if already referred
      const checkRes = await client.query(`SELECT id FROM referrals WHERE referred_id = $1`, [referred_customer_id]);
      if (checkRes.rows.length > 0) {
        throw new Error('Customer has already used a referral code');
      }

      const safeBranchId = branch_id && branch_id !== 'all' && branch_id !== 'ALL' ? parseInt(branch_id) : referrer.branch_id;
      let safeAdminId = admin_id ? parseInt(admin_id) : null;
      if (!safeAdminId && safeBranchId) {
        const bRes = await client.query(`SELECT admin_id FROM branches WHERE id = $1`, [safeBranchId]);
        if (bRes.rows.length > 0) safeAdminId = bRes.rows[0].admin_id;
      }

      const bonusPoints = 100;

      // Insert referral record
      const refInsert = await client.query(`
        INSERT INTO referrals (referrer_id, referred_id, referral_code, reward_points, status, admin_id, branch_id)
        VALUES ($1, $2, $3, $4, 'Rewarded', $5, $6)
        RETURNING *
      `, [referrer.id, referred_customer_id, referral_code, bonusPoints, safeAdminId, safeBranchId]);

      // Credit bonus points to Referrer
      await client.query(`
        INSERT INTO loyalty_transactions (customer_id, points, transaction_type, description, admin_id, branch_id)
        VALUES ($1, $2, 'referral_bonus', $3, $4, $5)
      `, [referrer.id, bonusPoints, `Referral reward bonus for inviting new client`, safeAdminId, safeBranchId]);

      await client.query(`
        UPDATE customers SET loyalty_points = loyalty_points + $1 WHERE id = $2
      `, [bonusPoints, referrer.id]);

      // Also credit welcome bonus 50 points to Referred Customer
      await client.query(`
        INSERT INTO loyalty_transactions (customer_id, points, transaction_type, description, admin_id, branch_id)
        VALUES ($1, 50, 'earned', 'Welcome bonus for using referral code', $2, $3)
      `, [referred_customer_id, safeAdminId, safeBranchId]);

      await client.query(`
        UPDATE customers SET loyalty_points = loyalty_points + 50 WHERE id = $1
      `, [referred_customer_id]);

      await client.query('COMMIT');
      return refInsert.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

export default Loyalty;
