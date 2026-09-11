import { pool } from '../config/db.js';

const Membership = {
  // Get all membership tiers
  getAllTiers: async () => {
    const res = await pool.query(`SELECT * FROM memberships ORDER BY price ASC`);
    return res.rows;
  },

  // Create membership tier
  createTier: async ({ name, price, discount_percent, validity_days, points_multiplier, benefits, badge_color }) => {
    const res = await pool.query(`
      INSERT INTO memberships (name, price, discount_percent, validity_days, points_multiplier, benefits, badge_color)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      name,
      parseFloat(price || 0),
      parseFloat(discount_percent || 0),
      parseInt(validity_days || 365),
      parseFloat(points_multiplier || 1.0),
      benefits || '',
      badge_color || '#00E676'
    ]);
    return res.rows[0];
  },

  // Update tier
  updateTier: async (id, { name, price, discount_percent, validity_days, points_multiplier, benefits, badge_color, is_active }) => {
    const res = await pool.query(`
      UPDATE memberships
      SET name = COALESCE($1, name),
          price = COALESCE($2, price),
          discount_percent = COALESCE($3, discount_percent),
          validity_days = COALESCE($4, validity_days),
          points_multiplier = COALESCE($5, points_multiplier),
          benefits = COALESCE($6, benefits),
          badge_color = COALESCE($7, badge_color),
          is_active = COALESCE($8, is_active)
      WHERE id = $9
      RETURNING *
    `, [name, price, discount_percent, validity_days, points_multiplier, benefits, badge_color, is_active, id]);
    return res.rows[0];
  },

  // Get active enrollment for customer
  getCustomerActiveMembership: async (customerId) => {
    const res = await pool.query(`
      SELECT cm.*, m.name as membership_name, m.discount_percent, m.points_multiplier, m.badge_color, m.benefits
      FROM customer_memberships cm
      JOIN memberships m ON cm.membership_id = m.id
      WHERE cm.customer_id = $1 AND cm.status = 'Active' AND cm.end_date >= CURRENT_DATE
      ORDER BY m.discount_percent DESC
      LIMIT 1
    `, [customerId]);
    return res.rows[0] || null;
  },

  // Get all enrolled customer subscriptions
  getEnrolledMembers: async () => {
    const res = await pool.query(`
      SELECT cm.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
             m.name as membership_name, m.discount_percent, m.badge_color, m.price as plan_price
      FROM customer_memberships cm
      JOIN customers c ON cm.customer_id = c.id
      JOIN memberships m ON cm.membership_id = m.id
      ORDER BY cm.created_at DESC
    `);
    return res.rows;
  },

  // Enroll customer into plan
  enrollCustomer: async ({ customer_id, membership_id, amount_paid, notes }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch tier details for validity_days
      const tierRes = await client.query(`SELECT * FROM memberships WHERE id = $1`, [membership_id]);
      if (tierRes.rows.length === 0) throw new Error('Membership tier not found');
      const tier = tierRes.rows[0];

      // Cancel previous active memberships for this customer
      await client.query(`
        UPDATE customer_memberships SET status = 'Superseded' WHERE customer_id = $1 AND status = 'Active'
      `, [customer_id]);

      // Calculate end date
      const validityDays = tier.validity_days || 365;
      const endRes = await client.query(`SELECT CURRENT_DATE + ($1 || ' days')::INTERVAL as end_date`, [validityDays]);
      const endDate = endRes.rows[0].end_date;

      const enrollRes = await client.query(`
        INSERT INTO customer_memberships (customer_id, membership_id, start_date, end_date, amount_paid, status, notes)
        VALUES ($1, $2, CURRENT_DATE, $3, $4, 'Active', $5)
        RETURNING *
      `, [customer_id, membership_id, endDate, amount_paid || tier.price, notes || `${tier.name} Subscription`]);

      await client.query('COMMIT');
      return enrollRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

export default Membership;
