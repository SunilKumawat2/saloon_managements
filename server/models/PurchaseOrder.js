import { pool } from '../config/db.js';

const PurchaseOrder = {
  getAll: async () => {
    const res = await pool.query(`
      SELECT po.*, s.name as supplier_name, s.company_name as supplier_company
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      ORDER BY po.created_at DESC
    `);

    // Fetch items for each PO
    const orders = res.rows;
    for (const po of orders) {
      const itemsRes = await pool.query(`
        SELECT poi.*, p.name as product_name, p.sku
        FROM purchase_order_items poi
        JOIN products p ON poi.product_id = p.id
        WHERE poi.po_id = $1
      `, [po.id]);
      po.items = itemsRes.rows;
    }
    return orders;
  },

  create: async ({ supplier_id, items, notes, branch_id }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const po_number = `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      let total_amount = 0;

      for (const item of items) {
        total_amount += parseFloat(item.unit_cost) * parseInt(item.quantity);
      }

      const poRes = await client.query(`
        INSERT INTO purchase_orders (po_number, supplier_id, branch_id, status, total_amount, notes, order_date)
        VALUES ($1, $2, $3, 'Ordered', $4, $5, CURRENT_DATE)
        RETURNING *
      `, [po_number, supplier_id || null, branch_id || null, total_amount, notes || null]);

      const po = poRes.rows[0];

      for (const item of items) {
        const itemTotal = parseFloat(item.unit_cost) * parseInt(item.quantity);
        await client.query(`
          INSERT INTO purchase_order_items (po_id, product_id, unit_cost, quantity, total_price)
          VALUES ($1, $2, $3, $4, $5)
        `, [po.id, item.product_id, item.unit_cost, item.quantity, itemTotal]);
      }

      await client.query('COMMIT');
      return po;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  updateStatus: async (id, status) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const currentPoRes = await client.query(`SELECT * FROM purchase_orders WHERE id = $1`, [id]);
      const currentPo = currentPoRes.rows[0];

      let received_date = currentPo.received_date;
      if (status === 'Received' && currentPo.status !== 'Received') {
        received_date = new Date();

        // Increment product stock quantities automatically upon PO delivery
        const itemsRes = await client.query(`SELECT * FROM purchase_order_items WHERE po_id = $1`, [id]);
        for (const item of itemsRes.rows) {
          await client.query(`UPDATE products SET quantity = quantity + $1 WHERE id = $2`, [item.quantity, item.product_id]);
          await client.query(`
            INSERT INTO stock_adjustment_logs (product_id, change_qty, reason, performed_by, notes)
            VALUES ($1, $2, 'Purchase Order Delivered', 'System', $3)
          `, [item.product_id, item.quantity, `PO #${currentPo.po_number}`]);
        }
      }

      const res = await client.query(`
        UPDATE purchase_orders
        SET status = $1, received_date = $2
        WHERE id = $3
        RETURNING *
      `, [status, received_date, id]);

      await client.query('COMMIT');
      return res.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

export default PurchaseOrder;
