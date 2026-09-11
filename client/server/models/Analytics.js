import { pool } from '../config/db.js';

const Analytics = {
  // 1. Revenue Performance Reports (Daily, Weekly, Monthly)
  getRevenueAnalytics: async () => {
    // Overall Revenue Stats
    const totalRes = await pool.query(`
      SELECT 
        COALESCE(SUM(total), 0) as grand_total_revenue,
        COALESCE(SUM(subtotal), 0) as subtotal_revenue,
        COALESCE(SUM(discount_amount), 0) as total_discounts,
        COALESCE(SUM(tax_amount), 0) as total_gst_tax,
        COALESCE(SUM(tip_amount), 0) as total_tips,
        COUNT(id) as total_bills,
        COALESCE(AVG(total), 0) as avg_bill_size
      FROM bills
      WHERE status = 'Paid'
    `);

    // Today's Revenue
    const todayRes = await pool.query(`
      SELECT COALESCE(SUM(total), 0) as today_revenue, COUNT(id) as today_bills
      FROM bills WHERE DATE(created_at) = CURRENT_DATE AND status = 'Paid'
    `);

    // This Month's Revenue
    const monthRes = await pool.query(`
      SELECT COALESCE(SUM(total), 0) as month_revenue, COUNT(id) as month_bills
      FROM bills 
      WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND status = 'Paid'
    `);

    // Payment Mode Distribution
    const modeRes = await pool.query(`
      SELECT payment_mode, COUNT(id) as count, COALESCE(SUM(total), 0) as amount
      FROM bills WHERE status = 'Paid'
      GROUP BY payment_mode
    `);

    // Daily Revenue Breakdown (Last 7 Days)
    const dailyRes = await pool.query(`
      SELECT DATE(created_at) as date, COALESCE(SUM(total), 0) as revenue, COUNT(id) as bills_count
      FROM bills
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND status = 'Paid'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);

    return {
      overall: totalRes.rows[0],
      today: todayRes.rows[0],
      month: monthRes.rows[0],
      paymentModes: modeRes.rows,
      dailyTrend: dailyRes.rows
    };
  },

  // 2. Staff Performance & Commission Breakdown
  getStaffPerformance: async () => {
    const res = await pool.query(`
      SELECT 
        s.id as stylist_id,
        s.name as stylist_name,
        s.specialization,
        s.rating,
        COUNT(b.id) as total_services_handled,
        COALESCE(SUM(b.subtotal), 0) as gross_revenue_generated,
        COALESCE(SUM(b.commission_amount), 0) as total_commission_earned,
        COALESCE(SUM(b.tip_amount), 0) as total_tips_received
      FROM stylists s
      LEFT JOIN bills b ON s.id = b.stylist_id AND b.status = 'Paid'
      GROUP BY s.id, s.name, s.specialization, s.rating
      ORDER BY gross_revenue_generated DESC
    `);
    return res.rows;
  },

  // 3. Inventory Consumption & Profit Margin Reports
  getInventoryMargin: async () => {
    // Total Inventory Valuation
    const stockValRes = await pool.query(`
      SELECT 
        COUNT(id) as total_products,
        COALESCE(SUM(stock * cost_price), 0) as total_cost_value,
        COALESCE(SUM(stock * selling_price), 0) as total_retail_value
      FROM products
    `);

    // Product Consumption Cost
    const usageRes = await pool.query(`
      SELECT 
        c.product_id,
        p.name as product_name,
        COALESCE(SUM(c.quantity_used), 0) as total_qty_used,
        COALESCE(SUM(c.quantity_used * p.cost_price), 0) as total_cost
      FROM service_product_consumption c
      JOIN products p ON c.product_id = p.id
      GROUP BY c.product_id, p.name
    `);

    // Top Selling Retail Products
    const retailRes = await pool.query(`
      SELECT id, name, category, stock, cost_price, selling_price,
             (selling_price - cost_price) as profit_per_unit,
             CASE WHEN selling_price > 0 THEN ROUND(((selling_price - cost_price) / selling_price * 100), 2) ELSE 0 END as margin_percent
      FROM products
      ORDER BY margin_percent DESC
    `);

    return {
      stockSummary: stockValRes.rows[0],
      usageBreakdown: usageRes.rows,
      productsMargin: retailRes.rows
    };
  },

  // 4. Customer Retention & Churn Analytics
  getCustomerRetention: async () => {
    // Total & Repeat Customers
    const custStatsRes = await pool.query(`
      SELECT 
        COUNT(c.id) as total_customers,
        COUNT(CASE WHEN bill_counts.visit_count > 1 THEN 1 END) as repeat_customers,
        COUNT(CASE WHEN bill_counts.visit_count = 1 THEN 1 END) as single_visit_customers
      FROM customers c
      LEFT JOIN (
        SELECT customer_id, COUNT(id) as visit_count FROM bills GROUP BY customer_id
      ) bill_counts ON c.id = bill_counts.customer_id
    `);

    // Churned clients (No bill in 60+ days)
    const churnRes = await pool.query(`
      SELECT c.id, c.name, c.phone, c.email, MAX(b.created_at) as last_visit_date,
             COALESCE(SUM(b.total), 0) as lifetime_spend
      FROM customers c
      LEFT JOIN bills b ON c.id = b.customer_id
      GROUP BY c.id
      HAVING MAX(b.created_at) IS NULL OR MAX(b.created_at) < CURRENT_DATE - INTERVAL '60 days'
      ORDER BY lifetime_spend DESC
      LIMIT 20
    `);

    const stats = custStatsRes.rows[0];
    const totalCust = parseInt(stats.total_customers) || 1;
    const repeatCust = parseInt(stats.repeat_customers) || 0;
    const retentionRate = ((repeatCust / totalCust) * 100).toFixed(1);

    return {
      totalCustomers: totalCust,
      repeatCustomers: repeatCust,
      singleVisitCustomers: parseInt(stats.single_visit_customers) || 0,
      retentionRatePercent: parseFloat(retentionRate),
      churnedClients: churnRes.rows
    };
  },

  // 5. Service Popularity & Peak Hours Analytics
  getPopularityAndPeakHours: async () => {
    // Top Demanded Services
    const serviceRes = await pool.query(`
      SELECT service_name, COUNT(id) as times_booked, SUM(price * qty) as total_revenue
      FROM bill_items
      GROUP BY service_name
      ORDER BY times_booked DESC
      LIMIT 10
    `);

    // Hourly Booking Matrix (9 AM - 9 PM)
    const hourlyRes = await pool.query(`
      SELECT EXTRACT(HOUR FROM appointment_time) as hour, COUNT(id) as appointment_count
      FROM appointments
      GROUP BY EXTRACT(HOUR FROM appointment_time)
      ORDER BY hour ASC
    `);

    return {
      topServices: serviceRes.rows,
      hourlyPeak: hourlyRes.rows
    };
  }
};

export default Analytics;
