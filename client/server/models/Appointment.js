import { pool } from '../config/db.js';

let DEMO_APPOINTMENTS = [
  { id: 101, branch_id: 1, customer_id: 1, customer_name: 'Rahul Kumar', stylist_id: 1, stylist_name: 'Rohan Sharma', service_id: 1, service_name: 'Classic Haircut & Styling', appointment_date: '2026-09-07', appointment_time: '14:30', status: 'Scheduled', total_amount: '350.00', notes: 'Classic Haircut slot' },
  { id: 102, branch_id: 1, customer_id: 2, customer_name: 'Sneha Kapoor', stylist_id: 2, stylist_name: 'Amit Verma', service_id: 3, service_name: 'Royal Gold Facial & Clean-up', appointment_date: '2026-09-07', appointment_time: '16:00', status: 'In-Progress', total_amount: '1200.00', notes: 'Royal Gold Facial' },
  { id: 103, branch_id: 2, customer_id: 3, customer_name: 'Karan Johar', stylist_id: 3, stylist_name: 'Priya Singh', service_id: 4, service_name: 'Keratin Hair Smoothing Treatment', appointment_date: '2026-09-08', appointment_time: '11:00', status: 'Completed', total_amount: '3500.00', notes: 'Keratin Hair Smoothing' }
];

export const AppointmentModel = {
  async findAll() {
    try {
      const query = `
        SELECT a.*, c.name as customer_name, c.phone as customer_phone, c.avatar_url as customer_avatar, s.name as service_name, st.name as stylist_name
        FROM appointments a
        LEFT JOIN customers c ON a.customer_id = c.id
        LEFT JOIN services s ON a.service_id = s.id
        LEFT JOIN stylists st ON a.stylist_id = st.id
        ORDER BY a.id DESC
      `;
      const { rows } = await pool.query(query);
      return rows;
    } catch (err) {
      return DEMO_APPOINTMENTS;
    }
  },

  async create({ branch_id, customer_id, customer_name, stylist_id, service_id, appointment_date, appointment_time, status, total_amount, notes }) {
    try {
      const insertQuery = `
        INSERT INTO appointments (branch_id, customer_id, stylist_id, service_id, appointment_date, appointment_time, status, total_amount, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const { rows } = await pool.query(insertQuery, [
        branch_id || 1,
        customer_id || 1,
        stylist_id || 1,
        service_id || 1,
        appointment_date || new Date().toISOString().split('T')[0],
        appointment_time || '10:00',
        status || 'Scheduled',
        total_amount || 350.00,
        notes || ''
      ]);

      const created = rows[0];
      // Fetch enriched row with joins
      const enriched = await pool.query(
        `SELECT a.*, c.name as customer_name, c.phone as customer_phone, c.avatar_url as customer_avatar, s.name as service_name, st.name as stylist_name
         FROM appointments a
         LEFT JOIN customers c ON a.customer_id = c.id
         LEFT JOIN services s ON a.service_id = s.id
         LEFT JOIN stylists st ON a.stylist_id = st.id
         WHERE a.id = $1`,
        [created.id]
      );

      return enriched.rows[0] || created;
    } catch (err) {
      const newApp = {
        id: Date.now(),
        branch_id: parseInt(branch_id || 1),
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

  async updateStatus(id, status) {
    const numericId = parseInt(id);
    try {
      const { rows } = await pool.query('UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *', [status, numericId]);
      const enriched = await pool.query(
        `SELECT a.*, c.name as customer_name, c.phone as customer_phone, c.avatar_url as customer_avatar, s.name as service_name, st.name as stylist_name
         FROM appointments a
         LEFT JOIN customers c ON a.customer_id = c.id
         LEFT JOIN services s ON a.service_id = s.id
         LEFT JOIN stylists st ON a.stylist_id = st.id
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
      const enriched = await pool.query(
        `SELECT a.*, c.name as customer_name, c.phone as customer_phone, c.avatar_url as customer_avatar, s.name as service_name, st.name as stylist_name
         FROM appointments a
         LEFT JOIN customers c ON a.customer_id = c.id
         LEFT JOIN services s ON a.service_id = s.id
         LEFT JOIN stylists st ON a.stylist_id = st.id
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
