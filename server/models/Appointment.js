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
        SELECT a.*, c.name as customer_name, s.name as service_name, st.name as stylist_name
        FROM appointments a
        LEFT JOIN customers c ON a.customer_id = c.id
        LEFT JOIN services s ON a.service_id = s.id
        LEFT JOIN stylists st ON a.stylist_id = st.id
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `;
      const { rows } = await pool.query(query);
      return rows.length > 0 ? rows : DEMO_APPOINTMENTS;
    } catch (err) {
      return DEMO_APPOINTMENTS;
    }
  },

  async create({ branch_id, customer_id, customer_name, stylist_id, service_id, appointment_date, appointment_time, total_amount, notes }) {
    try {
      const query = `
        INSERT INTO appointments (branch_id, customer_id, stylist_id, service_id, appointment_date, appointment_time, status, total_amount, notes)
        VALUES ($1, $2, $3, $4, $5, $6, 'Scheduled', $7, $8)
        RETURNING *
      `;
      const { rows } = await pool.query(query, [branch_id || 1, customer_id || 1, stylist_id || 1, service_id || 1, appointment_date, appointment_time, total_amount || 350.00, notes || '']);
      return rows[0];
    } catch (err) {
      const newApp = {
        id: DEMO_APPOINTMENTS.length + 101,
        branch_id: parseInt(branch_id || 1),
        customer_id: parseInt(customer_id || 1),
        customer_name: customer_name || 'Rahul Kumar',
        stylist_id: parseInt(stylist_id || 1),
        stylist_name: 'Rohan Sharma',
        service_id: parseInt(service_id || 1),
        service_name: 'Classic Haircut & Styling',
        appointment_date,
        appointment_time,
        status: 'Scheduled',
        total_amount: total_amount || '350.00',
        notes: notes || ''
      };
      DEMO_APPOINTMENTS.unshift(newApp);
      return newApp;
    }
  },

  async updateStatus(id, status) {
    try {
      const { rows } = await pool.query('UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
      return rows[0];
    } catch (err) {
      const app = DEMO_APPOINTMENTS.find(a => a.id === parseInt(id));
      if (app) app.status = status;
      return app;
    }
  }
};
