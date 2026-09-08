import { pool } from '../config/db.js';

let DEMO_LEADS = [
  { id: 1, branch_id: 1, name: 'Ananya Panday', phone: '9811223344', email: 'ananya@gmail.com', source: 'Instagram Ads', status: 'New', notes: 'Inquired about Keratin Hair Treatment', followup_date: '2026-09-08' },
  { id: 2, branch_id: 1, name: 'Varun Dhawan', phone: '9811223345', email: 'varun@gmail.com', source: 'Walk-in', status: 'Contacted', notes: 'Scheduled call back for bridal package', followup_date: '2026-09-09' },
  { id: 3, branch_id: 2, name: 'Kiara Advani', phone: '9811223346', email: 'kiara@gmail.com', source: 'Website Portal', status: 'Converted', notes: 'Booked Gold Facial appointment', followup_date: '2026-09-07' }
];

export const LeadModel = {
  async findAll() {
    try {
      const { rows } = await pool.query('SELECT * FROM leads ORDER BY id DESC');
      return rows.length > 0 ? rows : DEMO_LEADS;
    } catch (err) {
      return DEMO_LEADS;
    }
  },

  async create({ branch_id, name, phone, email, source, notes, followup_date }) {
    try {
      const query = `
        INSERT INTO leads (branch_id, name, phone, email, source, status, notes, followup_date)
        VALUES ($1, $2, $3, $4, $5, 'New', $6, $7)
        RETURNING *
      `;
      const { rows } = await pool.query(query, [branch_id || 1, name, phone, email, source || 'Walk-in', notes || '', followup_date || null]);
      return rows[0];
    } catch (err) {
      const newLead = {
        id: DEMO_LEADS.length + 1,
        branch_id: parseInt(branch_id || 1),
        name,
        phone,
        email,
        source: source || 'Walk-in',
        status: 'New',
        notes,
        followup_date,
        created_at: new Date().toISOString()
      };
      DEMO_LEADS.unshift(newLead);
      return newLead;
    }
  },

  async updateStatus(id, status) {
    try {
      const { rows } = await pool.query('UPDATE leads SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
      return rows[0];
    } catch (err) {
      const lead = DEMO_LEADS.find(l => l.id === parseInt(id));
      if (lead) lead.status = status;
      return lead;
    }
  }
};
