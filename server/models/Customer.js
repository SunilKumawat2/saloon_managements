import { pool } from '../config/db.js';

let DEMO_CUSTOMERS = [
  { id: 1, branch_id: 1, name: 'Rahul Kumar', phone: '9988776655', email: 'rahul.k@gmail.com', gender: 'Male', dob: '1995-08-15', loyalty_points: 120, notes: 'Prefers Rohan Sharma for haircut' },
  { id: 2, branch_id: 1, name: 'Sneha Kapoor', phone: '9988776656', email: 'sneha.k@outlook.com', gender: 'Female', dob: '1998-11-22', loyalty_points: 250, notes: 'Regular facial client, sensitive skin' },
  { id: 3, branch_id: 2, name: 'Karan Johar', phone: '9988776657', email: 'karan@media.com', gender: 'Male', dob: '1990-03-10', loyalty_points: 80, notes: 'Prefers weekend morning slots' }
];

export const CustomerModel = {
  async findAll() {
    try {
      const { rows } = await pool.query('SELECT * FROM customers ORDER BY id DESC');
      return rows.length > 0 ? rows : DEMO_CUSTOMERS;
    } catch (err) {
      return DEMO_CUSTOMERS;
    }
  },

  async findById(id) {
    try {
      const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
      return rows[0] || DEMO_CUSTOMERS.find(c => c.id === parseInt(id));
    } catch (err) {
      return DEMO_CUSTOMERS.find(c => c.id === parseInt(id));
    }
  },

  async create({ branch_id, name, phone, email, gender, dob, anniversary, notes }) {
    try {
      const query = `
        INSERT INTO customers (branch_id, name, phone, email, gender, dob, anniversary, notes, loyalty_points)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 50)
        RETURNING *
      `;
      const { rows } = await pool.query(query, [branch_id || 1, name, phone, email, gender || 'Unspecified', dob || null, anniversary || null, notes || '']);
      return rows[0];
    } catch (err) {
      const newCustomer = {
        id: DEMO_CUSTOMERS.length + 1,
        branch_id: parseInt(branch_id || 1),
        name, phone, email,
        gender: gender || 'Unspecified',
        dob, anniversary,
        loyalty_points: 50,
        notes,
        created_at: new Date().toISOString()
      };
      DEMO_CUSTOMERS.unshift(newCustomer);
      return newCustomer;
    }
  },

  async update(id, { name, phone, email, gender, dob, anniversary, notes, loyalty_points }) {
    try {
      const query = `
        UPDATE customers
        SET name        = COALESCE($1, name),
            phone       = COALESCE($2, phone),
            email       = COALESCE($3, email),
            gender      = COALESCE($4, gender),
            dob         = COALESCE($5::date, dob),
            anniversary = COALESCE($6::date, anniversary),
            notes       = COALESCE($7, notes),
            loyalty_points = COALESCE($8, loyalty_points)
        WHERE id = $9
        RETURNING *
      `;
      const { rows } = await pool.query(query, [
        name, phone, email, gender,
        dob || null,
        anniversary || null,
        notes,
        loyalty_points !== undefined ? parseInt(loyalty_points) : null,
        id
      ]);
      return rows[0];
    } catch (err) {
      DEMO_CUSTOMERS = DEMO_CUSTOMERS.map(c =>
        c.id === id ? { ...c, name, phone, email, gender, dob, anniversary, notes, loyalty_points } : c
      );
      return DEMO_CUSTOMERS.find(c => c.id === id);
    }
  },

  async delete(id) {
    try {
      await pool.query('DELETE FROM customers WHERE id = $1', [id]);
      return { deleted: true };
    } catch (err) {
      DEMO_CUSTOMERS = DEMO_CUSTOMERS.filter(c => c.id !== id);
      return { deleted: true };
    }
  }
};

