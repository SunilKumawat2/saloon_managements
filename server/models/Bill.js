import { pool } from '../config/db.js';

const Bill = {
  // Get all bills with customer name
  getAll: async () => {
    const result = await pool.query(`
      SELECT b.*, c.name as customer_name, c.phone as customer_phone,
             s.name as stylist_name,
             br.name as branch_name
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN stylists s ON b.stylist_id = s.id
      LEFT JOIN branches br ON b.branch_id = br.id
      ORDER BY b.created_at DESC
    `);
    return result.rows;
  },

  // Get single bill with its items
  getById: async (id) => {
    const billRes = await pool.query(`
      SELECT b.*, c.name as customer_name, c.phone as customer_phone,
             s.name as stylist_name
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN stylists s ON b.stylist_id = s.id
      WHERE b.id = $1
    `, [id]);

    const itemsRes = await pool.query(
      `SELECT * FROM bill_items WHERE bill_id = $1`,
      [id]
    );

    return { ...billRes.rows[0], items: itemsRes.rows };
  },

  // Create bill + bill_items in a transaction
  create: async ({
    branch_id, customer_id, stylist_id, items, payment_mode,
    discount_code, discount_amount = 0, tax_rate = 18.00,
    tip_amount = 0, commission_amount = 0, split_details = {}, notes
  }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Calculate totals
      const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price) * (i.qty || 1), 0);
      const disc = parseFloat(discount_amount) || 0;
      const taxable = Math.max(0, subtotal - disc);
      const taxRateNum = parseFloat(tax_rate);
      const tax_amount = parseFloat(((taxable * taxRateNum) / 100).toFixed(2));
      const tip = parseFloat(tip_amount) || 0;
      const total = parseFloat((taxable + tax_amount + tip).toFixed(2));
      const comm = parseFloat(commission_amount) || parseFloat((subtotal * 0.10).toFixed(2));

      // Check customer & stylist existence to avoid foreign key violations
      let validCustomerId = null;
      if (customer_id) {
        const cCheck = await client.query(`SELECT id FROM customers WHERE id = $1`, [customer_id]);
        if (cCheck.rows.length > 0) validCustomerId = customer_id;
      }

      let validStylistId = null;
      if (stylist_id) {
        const sCheck = await client.query(`SELECT id FROM stylists WHERE id = $1`, [stylist_id]);
        if (sCheck.rows.length > 0) validStylistId = stylist_id;
      }

      // Insert bill
      const billRes = await client.query(`
        INSERT INTO bills (
          branch_id, customer_id, stylist_id, subtotal, tax_amount, total,
          payment_mode, discount_code, discount_amount, tax_rate, tip_amount,
          commission_amount, split_details, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        branch_id || null, validCustomerId, validStylistId, subtotal, tax_amount, total,
        payment_mode || 'Cash', discount_code || null, disc, taxRateNum, tip,
        comm, JSON.stringify(split_details || {}), notes || null
      ]);

      const bill = billRes.rows[0];

      // Insert bill items
      for (const item of items) {
        await client.query(`
          INSERT INTO bill_items (bill_id, service_id, service_name, price, qty)
          VALUES ($1, $2, $3, $4, $5)
        `, [bill.id, item.service_id || null, item.service_name, item.price, item.qty || 1]);
      }

      // Update customer loyalty points & process redemptions
      if (validCustomerId) {
        // Handle Points Redemption if requested
        const pointsRedeemedNum = parseInt(split_details?.points_redeemed || 0);
        if (pointsRedeemedNum > 0) {
          await client.query(
            `UPDATE customers SET loyalty_points = GREATEST(0, loyalty_points - $1) WHERE id = $2`,
            [pointsRedeemedNum, validCustomerId]
          );
          await client.query(
            `INSERT INTO loyalty_transactions (customer_id, bill_id, points, transaction_type, description)
             VALUES ($1, $2, $3, 'redeemed', $4)`,
            [validCustomerId, bill.id, -pointsRedeemedNum, `Redeemed ${pointsRedeemedNum} points for bill #${bill.id} discount`]
          );
        }

        // Check active membership points multiplier
        const tierRes = await client.query(`
          SELECT m.points_multiplier
          FROM customer_memberships cm
          JOIN memberships m ON cm.membership_id = m.id
          WHERE cm.customer_id = $1 AND cm.status = 'Active' AND cm.end_date >= CURRENT_DATE
          ORDER BY m.discount_percent DESC LIMIT 1
        `, [validCustomerId]);

        const multiplier = tierRes.rows.length > 0 ? parseFloat(tierRes.rows[0].points_multiplier || 1.0) : 1.0;
        const basePoints = Math.floor(total / 10);
        const earnedPoints = Math.floor(basePoints * multiplier);

        if (earnedPoints > 0) {
          await client.query(
            `UPDATE customers SET loyalty_points = loyalty_points + $1 WHERE id = $2`,
            [earnedPoints, validCustomerId]
          );
          await client.query(
            `INSERT INTO loyalty_transactions (customer_id, bill_id, points, transaction_type, description)
             VALUES ($1, $2, $3, 'earned', $4)`,
            [validCustomerId, bill.id, earnedPoints, `Earned ${earnedPoints} loyalty points on bill #${bill.id}${multiplier > 1 ? ` (${multiplier}x Tier Multiplier)` : ''}`]
          );
        }
      }

      await client.query('COMMIT');
      return bill;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

export default Bill;
