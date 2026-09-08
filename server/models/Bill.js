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
  create: async ({ branch_id, customer_id, stylist_id, items, payment_mode, notes }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Calculate totals
      const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price) * (i.qty || 1), 0);
      const tax_amount = parseFloat((subtotal * 0.18).toFixed(2));
      const total = parseFloat((subtotal + tax_amount).toFixed(2));

      // Insert bill
      const billRes = await client.query(`
        INSERT INTO bills (branch_id, customer_id, stylist_id, subtotal, tax_amount, total, payment_mode, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [branch_id || null, customer_id || null, stylist_id || null, subtotal, tax_amount, total, payment_mode || 'Cash', notes || null]);

      const bill = billRes.rows[0];

      // Insert bill items
      for (const item of items) {
        await client.query(`
          INSERT INTO bill_items (bill_id, service_id, service_name, price, qty)
          VALUES ($1, $2, $3, $4, $5)
        `, [bill.id, item.service_id || null, item.service_name, item.price, item.qty || 1]);
      }

      // Update customer loyalty points (+1 point per ₹10 spent)
      if (customer_id) {
        const pts = Math.floor(total / 10);
        await client.query(
          `UPDATE customers SET loyalty_points = loyalty_points + $1 WHERE id = $2`,
          [pts, customer_id]
        );
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
