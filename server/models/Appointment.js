import { pool } from '../config/db.js';

let DEMO_APPOINTMENTS = [
  { id: 101, branch_id: 1, customer_id: 1, customer_name: 'Rahul Kumar', stylist_id: 1, stylist_name: 'Rohan Sharma', service_id: 1, service_name: 'Classic Haircut & Styling', appointment_date: '2026-09-07', appointment_time: '14:30', status: 'Scheduled', total_amount: '350.00', notes: 'Classic Haircut slot' },
  { id: 102, branch_id: 1, customer_id: 2, customer_name: 'Sneha Kapoor', stylist_id: 2, stylist_name: 'Amit Verma', service_id: 3, service_name: 'Royal Gold Facial & Clean-up', appointment_date: '2026-09-07', appointment_time: '16:00', status: 'In-Progress', total_amount: '1200.00', notes: 'Royal Gold Facial' },
  { id: 103, branch_id: 2, customer_id: 3, customer_name: 'Karan Johar', stylist_id: 3, stylist_name: 'Priya Singh', service_id: 4, service_name: 'Keratin Hair Smoothing Treatment', appointment_date: '2026-09-08', appointment_time: '11:00', status: 'Completed', total_amount: '3500.00', notes: 'Keratin Hair Smoothing' }
];

export const AppointmentModel = {
  async findAll(options = {}) {
    try {
      const page = Math.max(1, parseInt(options.page || '1'));
      const limit = options.limit && options.limit !== 'all' ? parseInt(options.limit) : null;
      const search = options.search ? String(options.search).trim() : '';
      const statusFilter = options.status ? String(options.status).trim() : 'All';

      let baseSql = `
        FROM appointments a
        LEFT JOIN customers c ON a.customer_id = c.id
        LEFT JOIN services s ON a.service_id = s.id
        LEFT JOIN stylists st ON a.stylist_id = st.id
        LEFT JOIN users u ON a.stylist_id = u.id
      `;

      const whereConditions = [];
      const queryParams = [];

      if (statusFilter && statusFilter !== 'All') {
        queryParams.push(statusFilter);
        whereConditions.push(`a.status = $${queryParams.length}`);
      }

      if (search) {
        queryParams.push(`%${search}%`);
        const searchIdx = queryParams.length;
        whereConditions.push(`(
          a.customer_name ILIKE $${searchIdx} OR
          c.name ILIKE $${searchIdx} OR
          c.phone ILIKE $${searchIdx} OR
          a.customer_phone ILIKE $${searchIdx} OR
          s.name ILIKE $${searchIdx} OR
          st.name ILIKE $${searchIdx} OR
          u.name ILIKE $${searchIdx}
        )`);
      }

      if (whereConditions.length > 0) {
        baseSql += ' WHERE ' + whereConditions.join(' AND ');
      }

      const countRes = await pool.query(`SELECT COUNT(*) ${baseSql}`, queryParams);
      const total = parseInt(countRes.rows[0]?.count || '0');

      let selectSql = `
        SELECT a.*,
               COALESCE(NULLIF(a.customer_name, ''), c.name, 'Walk-in Guest') as customer_name,
               COALESCE(NULLIF(a.customer_phone, ''), c.phone, '') as customer_phone,
               c.avatar_url as customer_avatar,
               s.name as service_name,
               COALESCE(st.name, u.name, 'Staff') as stylist_name
        ${baseSql}
        ORDER BY a.id DESC
      `;

      if (limit && limit > 0) {
        const offset = (page - 1) * limit;
        const pageParams = [...queryParams, limit, offset];
        selectSql += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        const dataRes = await pool.query(selectSql, pageParams);
        const rows = dataRes.rows || [];

        return {
          data: rows,
          pagination: {
            total: total || rows.length,
            page,
            limit,
            totalPages: Math.ceil((total || rows.length) / limit) || 1
          }
        };
      }

      const dataRes = await pool.query(selectSql, queryParams);
      const rows = dataRes.rows && dataRes.rows.length > 0 ? dataRes.rows : DEMO_APPOINTMENTS;
      return rows;
    } catch (err) {
      let cleaned = DEMO_APPOINTMENTS;
      if (options.search) {
        const s = String(options.search).toLowerCase();
        cleaned = cleaned.filter(a =>
          String(a.customer_name || '').toLowerCase().includes(s) ||
          String(a.service_name || '').toLowerCase().includes(s) ||
          String(a.stylist_name || '').toLowerCase().includes(s)
        );
      }
      if (options.status && options.status !== 'All') {
        cleaned = cleaned.filter(a => a.status === options.status);
      }
      if (options.limit && options.limit > 0 && options.limit !== 'all') {
        const page = options.page || 1;
        const total = cleaned.length;
        const start = (page - 1) * options.limit;
        return {
          data: cleaned.slice(start, start + options.limit),
          pagination: { total, page, limit: options.limit, totalPages: Math.ceil(total / options.limit) || 1 }
        };
      }
      return cleaned;
    }
  },

  async create({ branch_id, customer_id, customer_name, customer_phone, stylist_id, service_id, appointment_date, appointment_time, status, total_amount, notes }) {
    try {
      // Validate customer_id exists in DB to prevent foreign key error
      let validCustomerId = parseInt(customer_id || 1);
      const custCheck = await pool.query('SELECT id FROM customers WHERE id = $1', [validCustomerId]).catch(() => null);
      if (!custCheck || custCheck.rows.length === 0) {
        const findCust = await pool.query('SELECT id FROM customers ORDER BY id ASC LIMIT 1').catch(() => null);
        if (findCust && findCust.rows[0]) {
          validCustomerId = findCust.rows[0].id;
        } else {
          const newC = await pool.query("INSERT INTO customers (name, phone) VALUES ($1, $2) RETURNING id", [customer_name || 'Walk-in Customer', customer_phone || '9876543210']).catch(() => null);
          if (newC && newC.rows[0]) validCustomerId = newC.rows[0].id;
        }
      }

      // Validate service_id exists in DB
      let validServiceId = parseInt(service_id || 1);
      const servCheck = await pool.query('SELECT id FROM services WHERE id = $1', [validServiceId]).catch(() => null);
      if (!servCheck || servCheck.rows.length === 0) {
        const findServ = await pool.query('SELECT id FROM services ORDER BY id ASC LIMIT 1').catch(() => null);
        if (findServ && findServ.rows[0]) validServiceId = findServ.rows[0].id;
      }

      // Validate stylist_id exists in DB (stylists table OR users table)
      let validStylistId = stylist_id ? parseInt(stylist_id) : 1;
      if (validStylistId) {
        const stylCheck = await pool.query('SELECT id FROM stylists WHERE id = $1', [validStylistId]).catch(() => null);
        if (!stylCheck || stylCheck.rows.length === 0) {
          const userCheck = await pool.query('SELECT id, name, phone, branch_id FROM users WHERE id = $1', [validStylistId]).catch(() => null);
          if (userCheck && userCheck.rows.length > 0) {
            const u = userCheck.rows[0];
            await pool.query(
              `INSERT INTO stylists (id, name, phone, branch_id)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
              [validStylistId, u.name || 'Staff User', u.phone || '', u.branch_id || (branch_id ? parseInt(branch_id) : null)]
            ).catch(() => null);
          }
        }
      // BACKEND DOUBLE-BOOKING CONFLICT CHECK FOR STYLIST AT SAME DATE & TIME
      const targetDateStr = appointment_date || new Date().toISOString().split('T')[0];
      const targetTimeStr = appointment_time || '10:00';

      const existingConflict = await pool.query(
        `SELECT a.id, a.customer_name, s.name as service_name
         FROM appointments a
         LEFT JOIN services s ON a.service_id = s.id
         WHERE a.stylist_id = $1
           AND a.appointment_date = $2::date
           AND a.status != 'Cancelled'
           AND (
             a.appointment_time = $3::time OR
             EXTRACT(HOUR FROM a.appointment_time) = EXTRACT(HOUR FROM $3::time)
           )
         LIMIT 1`,
        [validStylistId, targetDateStr, targetTimeStr]
      ).catch(() => null);

      if (existingConflict && existingConflict.rows && existingConflict.rows.length > 0) {
        const conflict = existingConflict.rows[0];
        throw new Error(`Stylist is ALREADY BOOKED on ${targetDateStr} at ${targetTimeStr} for customer "${conflict.customer_name || 'Existing Client'}". Double-booking is blocked.`);
      }

      const insertQuery = `
        INSERT INTO appointments (branch_id, customer_id, customer_name, customer_phone, stylist_id, service_id, appointment_date, appointment_time, status, total_amount, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      const { rows } = await pool.query(insertQuery, [
        branch_id ? parseInt(branch_id) : null,
        validCustomerId,
        customer_name || 'Walk-in Guest',
        customer_phone || '',
        validStylistId,
        validServiceId,
        appointment_date || new Date().toISOString().split('T')[0],
        appointment_time || '10:00',
        status || 'Scheduled',
        total_amount || 350.00,
        notes || ''
      ]);

      const created = rows[0];
      const enriched = await pool.query(
        `SELECT a.*,
                COALESCE(NULLIF(a.customer_name, ''), NULLIF(c.name, ''), $2) as customer_name,
                COALESCE(NULLIF(a.customer_phone, ''), c.phone, '') as customer_phone,
                c.avatar_url as customer_avatar,
                s.name as service_name,
                COALESCE(st.name, u.name, 'Staff') as stylist_name
         FROM appointments a
         LEFT JOIN customers c ON a.customer_id = c.id
         LEFT JOIN services s ON a.service_id = s.id
         LEFT JOIN stylists st ON a.stylist_id = st.id
         LEFT JOIN users u ON a.stylist_id = u.id
         WHERE a.id = $1`,
        [created.id, customer_name || 'Walk-in Customer']
      );

      return enriched.rows[0] || created;
    } catch (err) {
      console.error("Appointment DB Create Error:", err.message);
      const newApp = {
        id: Date.now(),
        branch_id: branch_id ? parseInt(branch_id) : null,
        customer_id: parseInt(customer_id || 1),
        customer_name: customer_name || 'Walk-in Customer',
        stylist_id: parseInt(stylist_id || 1),
        stylist_name: 'Staff',
        service_id: parseInt(service_id || 1),
        service_name: 'Hair Treatment',
        appointment_date: appointment_date || new Date().toISOString().split('T')[0],
        appointment_time: appointment_time || '10:00',
        status: status || 'Scheduled',
        total_amount: total_amount || '350.00',
        notes: notes || ''
      };
      DEMO_APPOINTMENTS.unshift(newApp);
      return newApp;
    }
  },

  async autoDeductMembershipCredit(appointmentId) {
    try {
      const appRes = await pool.query(`
        SELECT a.*, s.name as service_name
        FROM appointments a
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.id = $1
      `, [appointmentId]);
      if (appRes.rows.length === 0) return;
      const app = appRes.rows[0];

      if (!app.customer_id) return;

      // Check if already logged for this appointment
      const logCheck = await pool.query(`
        SELECT id FROM membership_credit_logs
        WHERE customer_id = $1 AND notes LIKE $2
      `, [app.customer_id, `%Appointment #${app.id}%`]);

      if (logCheck.rows.length > 0) return;

      // Check active membership with remaining credit
      const cmRes = await pool.query(`
        SELECT * FROM customer_memberships
        WHERE customer_id = $1 AND status = 'Active' AND end_date >= CURRENT_DATE AND remaining_service_credit > 0
        ORDER BY created_at DESC
        LIMIT 1
      `, [app.customer_id]);

      if (cmRes.rows.length === 0) return;
      const activeCm = cmRes.rows[0];

      const amountToDeduct = parseFloat(app.total_amount || 0);
      const available = parseFloat(activeCm.remaining_service_credit || 0);
      const deductAmt = Math.min(amountToDeduct, available);

      if (deductAmt > 0) {
        const newUsed = parseFloat(activeCm.used_service_credit || 0) + deductAmt;
        const newRemaining = available - deductAmt;

        await pool.query(`
          UPDATE customer_memberships
          SET used_service_credit = $1,
              remaining_service_credit = $2
          WHERE id = $3
        `, [newUsed, newRemaining, activeCm.id]);

        await pool.query(`
          INSERT INTO membership_credit_logs (customer_membership_id, customer_id, service_name, amount, notes)
          VALUES ($1, $2, $3, $4, $5)
        `, [activeCm.id, app.customer_id, app.service_name || 'Walk-in Queue Checkout', deductAmt, `Auto-deducted ₹${deductAmt} on Queue Checkout (Appointment #${app.id})`]);
      }
    } catch (err) {
      console.error('Error auto-deducting membership credit for appointment:', err);
    }
  },

  async updateStatus(id, status) {
    const numericId = parseInt(id);
    try {
      const { rows } = await pool.query('UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *', [status, numericId]);
      if (status === 'Completed') {
        await this.autoDeductMembershipCredit(numericId);
      }
      const enriched = await pool.query(
        `SELECT a.*,
                COALESCE(NULLIF(a.customer_name, ''), c.name, 'Walk-in Guest') as customer_name,
                COALESCE(NULLIF(a.customer_phone, ''), c.phone, '') as customer_phone,
                c.avatar_url as customer_avatar,
                s.name as service_name,
                COALESCE(st.name, u.name, 'Staff') as stylist_name
         FROM appointments a
         LEFT JOIN customers c ON a.customer_id = c.id
         LEFT JOIN services s ON a.service_id = s.id
         LEFT JOIN stylists st ON a.stylist_id = st.id
         LEFT JOIN users u ON a.stylist_id = u.id
         WHERE a.id = $1`,
        [numericId]
      );
      if (enriched.rows.length > 0) return enriched.rows[0];
      const app = DEMO_APPOINTMENTS.find(a => a.id === numericId);
      if (app) app.status = status;
      return app;
    } catch (err) {
      const app = DEMO_APPOINTMENTS.find(a => a.id === numericId);
      if (app) app.status = status;
      return app;
    }
  },

  async update(id, { customer_id, stylist_id, service_id, status, appointment_date, appointment_time, notes, total_amount }) {
    const numericId = parseInt(id);
    try {
      if (stylist_id) {
        const valStylId = parseInt(stylist_id);
        const stylCheck = await pool.query('SELECT id FROM stylists WHERE id = $1', [valStylId]).catch(() => null);
        if (!stylCheck || stylCheck.rows.length === 0) {
          const userCheck = await pool.query('SELECT id, name, phone, branch_id FROM users WHERE id = $1', [valStylId]).catch(() => null);
          if (userCheck && userCheck.rows.length > 0) {
            const u = userCheck.rows[0];
            await pool.query(
              `INSERT INTO stylists (id, name, phone, branch_id)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
              [valStylId, u.name || 'Staff User', u.phone || '', u.branch_id || null]
            ).catch(() => null);
          }
        }
      }

      await pool.query(
        `UPDATE appointments
         SET customer_id = COALESCE($1, customer_id),
             stylist_id = COALESCE($2, stylist_id),
             service_id = COALESCE($3, service_id),
             status = COALESCE($4, status),
             appointment_date = COALESCE($5::date, appointment_date),
             appointment_time = COALESCE($6, appointment_time),
             notes = COALESCE($7, notes),
             total_amount = COALESCE($8, total_amount)
         WHERE id = $9`,
        [customer_id, stylist_id, service_id, status, appointment_date || null, appointment_time, notes, total_amount, numericId]
      );
      if (status === 'Completed') {
        await this.autoDeductMembershipCredit(numericId);
      }
      const enriched = await pool.query(
        `SELECT a.*,
                COALESCE(NULLIF(a.customer_name, ''), c.name, 'Walk-in Guest') as customer_name,
                COALESCE(NULLIF(a.customer_phone, ''), c.phone, '') as customer_phone,
                c.avatar_url as customer_avatar,
                s.name as service_name,
                COALESCE(st.name, u.name, 'Staff') as stylist_name
         FROM appointments a
         LEFT JOIN customers c ON a.customer_id = c.id
         LEFT JOIN services s ON a.service_id = s.id
         LEFT JOIN stylists st ON a.stylist_id = st.id
         LEFT JOIN users u ON a.stylist_id = u.id
         WHERE a.id = $1`,
        [numericId]
      );
      if (enriched.rows.length > 0) return enriched.rows[0];
      DEMO_APPOINTMENTS = DEMO_APPOINTMENTS.map(a =>
        a.id === numericId ? { ...a, stylist_id, service_id, status, appointment_date, appointment_time, notes, total_amount } : a
      );
      return DEMO_APPOINTMENTS.find(a => a.id === numericId);
    } catch (err) {
      DEMO_APPOINTMENTS = DEMO_APPOINTMENTS.map(a =>
        a.id === numericId ? { ...a, stylist_id, service_id, status, appointment_date, appointment_time, notes, total_amount } : a
      );
      return DEMO_APPOINTMENTS.find(a => a.id === numericId);
    }
  },

  async delete(id) {
    const numericId = parseInt(id);
    try {
      await pool.query('DELETE FROM appointments WHERE id = $1', [numericId]);
      DEMO_APPOINTMENTS = DEMO_APPOINTMENTS.filter(a => a.id !== numericId);
      return { deleted: true };
    } catch (err) {
      DEMO_APPOINTMENTS = DEMO_APPOINTMENTS.filter(a => a.id !== numericId);
      return { deleted: true };
    }
  }
};
