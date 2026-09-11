import { pool } from '../config/db.js';

const Loyalty = {
  // Get points transaction ledger for customer or system-wide
  getTransactions: async (customerId = null) => {
    let query = `
      SELECT lt.*, c.name as customer_name, c.phone as customer_phone
      FROM loyalty_transactions lt
      JOIN customers c ON lt.customer_id = c.id
    `;
    const params = [];
    if (customerId) {
      query += ` WHERE lt.customer_id = $1`;
      params.push(customerId);
    }
    query += ` ORDER BY lt.created_at DESC LIMIT 100`;

    const res = await pool.query(query, params);
    return res.rows;
  },

  // Log point transaction and update customer balance
  addTransaction: async ({ customer_id, bill_id = null, points, transaction_type, description }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const transRes = await client.query(`
        INSERT INTO loyalty_transactions (customer_id, bill_id, points, transaction_type, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [customer_id, bill_id, points, transaction_type, description]);

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

  // Get referral list
  getReferrals: async () => {
    const res = await pool.query(`
      SELECT r.*, 
             ref.name as referrer_name, ref.phone as referrer_phone,
             rec.name as referred_name, rec.phone as referred_phone
      FROM referrals r
      JOIN customers ref ON r.referrer_id = ref.id
      LEFT JOIN customers rec ON r.referred_id = rec.id
      ORDER BY r.created_at DESC
    `);
    return res.rows;
  },

  // Apply referral code when a new customer registers or completes booking
  applyReferralCode: async ({ referral_code, referred_customer_id }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Find referrer
      const refRes = await client.query(`SELECT id, name, loyalty_points FROM customers WHERE UPPER(referral_code) = UPPER($1)`, [referral_code]);
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

      const bonusPoints = 100;

      // Insert referral record
      const refInsert = await client.query(`
        INSERT INTO referrals (referrer_id, referred_id, referral_code, reward_points, status)
        VALUES ($1, $2, $3, $4, 'Rewarded')
        RETURNING *
      `, [referrer.id, referred_customer_id, referral_code, bonusPoints]);

      // Credit bonus points to Referrer
      await client.query(`
        INSERT INTO loyalty_transactions (customer_id, points, transaction_type, description)
        VALUES ($1, $2, 'referral_bonus', $3)
      `, [referrer.id, bonusPoints, `Referral reward bonus for inviting new client`]);

      await client.query(`
        UPDATE customers SET loyalty_points = loyalty_points + $1 WHERE id = $2
      `, [bonusPoints, referrer.id]);

      // Also credit welcome bonus 50 points to Referred Customer
      await client.query(`
        INSERT INTO loyalty_transactions (customer_id, points, transaction_type, description)
        VALUES ($1, 50, 'earned', 'Welcome bonus for using referral code')
      `, [referred_customer_id]);

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
