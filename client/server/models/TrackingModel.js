import { pool } from '../config/db.js';

export const TrackingModel = {
  // ─── 1. STAFF TRACKING RECORDS ───
  async getStaffMetrics(options = {}) {
    const timeframe = options.timeframe || 'month'; // 'day', 'week', 'month', 'all'
    const branchId = options.branchId ? parseInt(options.branchId) : null;

    let dateCondApp = '';
    let dateCondBill = '';

    if (timeframe === 'day') {
      dateCondApp = `AND (a.created_at::date = CURRENT_DATE OR a.appointment_date::date = CURRENT_DATE)`;
      dateCondBill = `AND b.created_at::date = CURRENT_DATE`;
    } else if (timeframe === 'yesterday') {
      dateCondApp = `AND (a.created_at::date = CURRENT_DATE - INTERVAL '1 day' OR a.appointment_date::date = CURRENT_DATE - INTERVAL '1 day')`;
      dateCondBill = `AND b.created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
    } else if (timeframe === 'week') {
      dateCondApp = `AND (a.created_at >= CURRENT_DATE - INTERVAL '7 days' OR a.appointment_date >= CURRENT_DATE - INTERVAL '7 days')`;
      dateCondBill = `AND b.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (timeframe === 'month') {
      dateCondApp = `AND (a.created_at >= CURRENT_DATE - INTERVAL '30 days' OR a.appointment_date >= CURRENT_DATE - INTERVAL '30 days')`;
      dateCondBill = `AND b.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
    } else if (timeframe === 'custom' && options.startDate) {
      const sDate = options.startDate;
      const eDate = options.endDate || options.startDate;
      dateCondApp = `AND (a.created_at::date BETWEEN '${sDate}' AND '${eDate}' OR a.appointment_date::date BETWEEN '${sDate}' AND '${eDate}')`;
      dateCondBill = `AND b.created_at::date BETWEEN '${sDate}' AND '${eDate}'`;
    }

    let branchCondition = branchId ? `AND a.branch_id = ${branchId}` : '';

    try {
      // 1. Get all active stylists
      const stylistsRes = await pool.query(`SELECT id, name, phone, specialization, rating, is_available FROM stylists ORDER BY id ASC`);
      const stylists = stylistsRes.rows || [];

      // 2. Query combined service logs from appointments AND bills (deduplicated)
      const logsQuery = `
        SELECT 
          a.id, 
          a.stylist_id, 
          COALESCE(c.name, a.customer_name, 'Walk-in Guest') as customer_name,
          COALESCE(c.phone, a.customer_phone, '') as customer_phone,
          COALESCE(s.name, 'Salon Service') as service_name, 
          COALESCE(a.created_at, a.appointment_date) as log_date,
          a.status, 
          COALESCE(a.total_amount::numeric, 0) as total_amount
        FROM appointments a
        LEFT JOIN customers c ON a.customer_id = c.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.stylist_id IS NOT NULL ${dateCondApp} ${branchCondition}
        
        UNION ALL
        
        SELECT
          (10000 + b.id) as id, 
          b.stylist_id, 
          COALESCE(c.name, 'Walk-in Guest') as customer_name,
          COALESCE(c.phone, '') as customer_phone,
          'POS Billing Service' as service_name,
          b.created_at as log_date,
          'Completed' as status,
          COALESCE(b.subtotal::numeric, b.total::numeric, 0) as total_amount
        FROM bills b
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE b.stylist_id IS NOT NULL ${dateCondBill}
          AND NOT EXISTS (
            SELECT 1 FROM appointments a2 
            WHERE a2.customer_id = b.customer_id 
              AND a2.stylist_id = b.stylist_id 
              AND (a2.created_at::date = b.created_at::date OR a2.appointment_date::date = b.created_at::date)
          )
        
        ORDER BY log_date DESC
      `;

      const logsRes = await pool.query(logsQuery);
      const allLogs = logsRes.rows || [];

      // 3. Aggregate for each stylist
      const staffList = stylists.map(st => {
        const staffLogs = allLogs.filter(l => String(l.stylist_id) === String(st.id));
        const custSet = new Set(staffLogs.map(l => l.customer_phone || l.customer_name || l.customer_id));
        const totalRev = staffLogs.reduce((acc, l) => acc + (parseFloat(l.total_amount) || 0), 0);
        const completedCount = staffLogs.filter(l => l.status === 'Completed' || l.status === 'Paid').length;

        return {
          id: st.id,
          name: st.name,
          phone: st.phone,
          specialization: st.specialization || 'Senior Stylist & Hair Specialist',
          rating: st.rating || 5.0,
          is_available: st.is_available ?? true,
          customers_served: custSet.size,
          total_appointments: staffLogs.length,
          completed_count: completedCount,
          total_revenue: totalRev,
          service_logs: staffLogs.map(l => ({
            id: l.id,
            customer_name: l.customer_name,
            customer_phone: l.customer_phone,
            service_name: l.service_name,
            appointment_date: l.log_date ? new Date(l.log_date).toISOString().split('T')[0] : '',
            appointment_time: l.log_date ? new Date(l.log_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            status: l.status,
            total_amount: l.total_amount
          }))
        };
      });

      return {
        timeframe,
        total_staff: stylists.length,
        total_customers_served: staffList.reduce((acc, s) => acc + s.customers_served, 0),
        total_revenue_generated: staffList.reduce((acc, s) => acc + s.total_revenue, 0),
        staff_data: staffList
      };

    } catch (err) {
      console.error("Staff Metrics Error:", err.message);
      return { timeframe, total_staff: 0, total_customers_served: 0, total_revenue_generated: 0, staff_data: [] };
    }
  },

  // ─── 2. CUSTOMER TRACKING RECORDS ───
  async getCustomerTracking(search = '') {
    try {
      const q = String(search || '').trim();

      if (!q) {
        // Return top recent customers summary if no search query provided
        const summaryRes = await pool.query(`
          SELECT c.id, c.name, c.phone, c.email, c.loyalty_points, c.notes, c.created_at,
                 COUNT(DISTINCT a.id) as total_visits,
                 COALESCE(SUM(a.total_amount::numeric), 0) as total_spent,
                 MAX(a.appointment_date) as last_visit
          FROM customers c
          LEFT JOIN appointments a ON c.id = a.customer_id
          GROUP BY c.id
          ORDER BY last_visit DESC NULLS LAST, c.id DESC
          LIMIT 20
        `);
        return { query: '', results: summaryRes.rows || [] };
      }

      // Find matching customers by Name or Phone
      const custRes = await pool.query(`
        SELECT c.*
        FROM customers c
        WHERE c.name ILIKE $1 OR c.phone ILIKE $1
        ORDER BY c.id DESC
        LIMIT 10
      `, [`%${q}%`]);

      const customers = custRes.rows || [];

      // For each customer, gather full visit tracking history from appointments and bills
      const trackedCustomers = await Promise.all(customers.map(async (cust) => {
        // Fetch all appointments for this customer
        const appRes = await pool.query(`
          SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.total_amount, a.notes,
                 s.name as service_name, s.category as service_category,
                 st.name as stylist_name
          FROM appointments a
          LEFT JOIN services s ON a.service_id = s.id
          LEFT JOIN stylists st ON a.stylist_id = st.id
          WHERE a.customer_id = $1 OR a.customer_phone = $2
          ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `, [cust.id, cust.phone]);

        const appointments = appRes.rows || [];

        // Fetch all bills for this customer
        const billRes = await pool.query(`
          SELECT b.id, b.invoice_number, b.grand_total, b.payment_mode, b.created_at, b.status,
                 st.name as stylist_name
          FROM bills b
          LEFT JOIN stylists st ON b.stylist_id = st.id
          WHERE b.customer_id = $1 OR b.customer_phone = $2
          ORDER BY b.created_at DESC
        `, [cust.id, cust.phone]).catch(() => ({ rows: [] }));

        const bills = billRes.rows || [];

        // Calculate statistics
        const totalVisits = appointments.length || bills.length;
        const totalSpentApps = appointments.reduce((acc, a) => acc + parseFloat(a.total_amount || 0), 0);
        const totalSpentBills = bills.reduce((acc, b) => acc + parseFloat(b.grand_total || 0), 0);
        const totalSpent = Math.max(totalSpentApps, totalSpentBills);

        const lastVisitDate = appointments[0]?.appointment_date || (bills[0]?.created_at ? new Date(bills[0].created_at).toISOString().split('T')[0] : null);

        // Compute average visit frequency (in days) if 2 or more visits exist
        let avgFrequencyDays = null;
        if (appointments.length >= 2) {
          const dates = appointments.map(a => new Date(a.appointment_date).getTime()).sort((a, b) => a - b);
          const firstDate = dates[0];
          const lastDate = dates[dates.length - 1];
          const diffDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));
          avgFrequencyDays = Math.max(1, Math.round(diffDays / (dates.length - 1)));
        }

        return {
          id: cust.id,
          name: cust.name,
          phone: cust.phone,
          email: cust.email,
          gender: cust.gender,
          loyalty_points: cust.loyalty_points,
          avatar_url: cust.avatar_url,
          notes: cust.notes,
          created_at: cust.created_at,
          total_visits: totalVisits,
          total_spent: totalSpent,
          last_visit_date: lastVisitDate,
          avg_frequency_days: avgFrequencyDays,
          visit_history: appointments,
          billing_history: bills
        };
      }));

      return {
        query: q,
        results: trackedCustomers
      };

    } catch (err) {
      console.error("Customer Tracking Error:", err.message);
      return { query: search, results: [] };
    }
  }
};
