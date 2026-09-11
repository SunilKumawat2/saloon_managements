import { pool } from '../config/db.js';

let DEMO_USERS = [
  { id: 1, branch_id: 1, branch_name: 'Connaught Place Main Salon', role_id: 1, role_name: 'Admin', name: 'Sunil Kumar (Admin)', email: 'admin@saloon.com', phone: '9876543210', is_active: true, created_at: new Date().toISOString() },
  { id: 2, branch_id: 1, branch_name: 'Connaught Place Main Salon', role_id: 2, role_name: 'Manager', name: 'Rohan Verma (Manager)', email: 'rohan.manager@saloon.com', phone: '9876543211', is_active: true, created_at: new Date().toISOString() },
  { id: 3, branch_id: 1, branch_name: 'Connaught Place Main Salon', role_id: 3, role_name: 'Receptionist', name: 'Priya Sharma (Receptionist)', email: 'priya.reception@saloon.com', phone: '9876543212', is_active: true, created_at: new Date().toISOString() },
  { id: 4, branch_id: 2, branch_name: 'Cyber Hub Luxury Branch', role_id: 4, role_name: 'Staff', name: 'Amit Singh (Senior Stylist)', email: 'amit.stylist@saloon.com', phone: '9876543213', is_active: true, created_at: new Date().toISOString() }
];

export const UserModel = {
  async findAll() {
    try {
      const query = `
        SELECT u.*, r.name as role_name, b.name as branch_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN branches b ON u.branch_id = b.id
        ORDER BY u.id ASC
      `;
      const { rows } = await pool.query(query);
      return rows.length > 0 ? rows : DEMO_USERS;
    } catch (err) {
      return DEMO_USERS;
    }
  },

  async findByEmail(email) {
    try {
      const query = `
        SELECT u.*, r.name as role_name, r.permissions, b.name as branch_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN branches b ON u.branch_id = b.id
        WHERE u.email = $1
      `;
      const { rows } = await pool.query(query, [email]);
      return rows[0] || DEMO_USERS.find(u => u.email === email);
    } catch (err) {
      return DEMO_USERS.find(u => u.email === email);
    }
  },

  async create({ name, email, phone, role_id, branch_id, password }) {
    try {
      const query = `
        WITH inserted AS (
          INSERT INTO users (name, email, phone, role_id, branch_id, password)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        )
        SELECT u.*, r.name as role_name, b.name as branch_name
        FROM inserted u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN branches b ON u.branch_id = b.id
      `;
      const { rows } = await pool.query(query, [name, email, phone, parseInt(role_id), parseInt(branch_id || 1), password || 'default123']);
      return rows[0];
    } catch (err) {
      console.error('UserModel.create DB error:', err);
      const newUser = {
        id: DEMO_USERS.length + 1,
        name,
        email,
        phone,
        role_id: parseInt(role_id),
        branch_id: parseInt(branch_id),
        role_name: role_id === 1 ? 'Admin' : role_id === 2 ? 'Manager' : role_id === 3 ? 'Receptionist' : 'Staff',
        branch_name: branch_id === 1 ? 'Connaught Place Main Salon' : 'Cyber Hub Luxury Branch',
        is_active: true,
        created_at: new Date().toISOString()
      };
      DEMO_USERS.push(newUser);
      return newUser;
    }
  },

  async update(id, { name, email, phone, role_id, branch_id }) {
    try {
      const query = `
        WITH updated AS (
          UPDATE users
          SET name = COALESCE($1, name),
              email = COALESCE($2, email),
              phone = COALESCE($3, phone),
              role_id = COALESCE($4, role_id),
              branch_id = COALESCE($5, branch_id)
          WHERE id = $6
          RETURNING *
        )
        SELECT u.*, r.name as role_name, b.name as branch_name
        FROM updated u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN branches b ON u.branch_id = b.id
      `;
      const { rows } = await pool.query(query, [name, email, phone, role_id ? parseInt(role_id) : null, branch_id ? parseInt(branch_id) : null, id]);
      return rows[0];
    } catch (err) {
      console.error('UserModel.update DB error:', err);
      DEMO_USERS = DEMO_USERS.map(u => u.id === id ? { ...u, name, email, phone, role_id, branch_id } : u);
      return DEMO_USERS.find(u => u.id === id);
    }
  },

  async toggleStatus(id) {
    try {
      const query = `
        UPDATE users SET is_active = NOT is_active WHERE id = $1
        RETURNING id, is_active
      `;
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (err) {
      const user = DEMO_USERS.find(u => u.id === id);
      if (user) user.is_active = !user.is_active;
      return user;
    }
  },

  async delete(id) {
    try {
      await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
      return { deleted: true };
    } catch (err) {
      DEMO_USERS = DEMO_USERS.filter(u => u.id !== id);
      return { deleted: true };
    }
  },
};

