import { pool } from '../config/db.js';

// Pre-defined in-memory fallback for demo if database is not initialized yet
let DEMO_ROLES = [
  { id: 1, name: 'Admin', description: 'Super Administrator with full system control', permissions: ['all', 'manage_permissions', 'manage_users', 'manage_branches', 'manage_finances', 'manage_services', 'manage_inventory'] },
  { id: 2, name: 'Manager', description: 'Branch Operational Manager', permissions: ['manage_branch_users', 'manage_appointments', 'manage_services', 'manage_inventory', 'view_reports'] },
  { id: 3, name: 'Receptionist', description: 'Front Desk & Billing Handler', permissions: ['manage_appointments', 'manage_billing', 'view_customers'] },
  { id: 4, name: 'Staff', description: 'Stylist / Hair Artist', permissions: ['view_assigned_appointments', 'view_schedule'] },
  { id: 5, name: 'Customer', description: 'Client Portal User', permissions: ['book_appointments', 'view_history'] },
];

export const RoleModel = {
  async findAll() {
    try {
      const { rows } = await pool.query('SELECT * FROM roles ORDER BY id ASC');
      return rows.length > 0 ? rows : DEMO_ROLES;
    } catch (err) {
      return DEMO_ROLES;
    }
  },

  async findById(id) {
    try {
      const { rows } = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
      return rows[0] || DEMO_ROLES.find(r => r.id === parseInt(id));
    } catch (err) {
      return DEMO_ROLES.find(r => r.id === parseInt(id));
    }
  },

  async updatePermissions(id, permissions) {
    try {
      const { rows } = await pool.query(
        `UPDATE roles SET permissions = $1::jsonb WHERE id = $2 RETURNING *`,
        [JSON.stringify(permissions), id]
      );
      return rows[0];
    } catch (err) {
      DEMO_ROLES = DEMO_ROLES.map(r =>
        r.id === parseInt(id) ? { ...r, permissions } : r
      );
      return DEMO_ROLES.find(r => r.id === parseInt(id));
    }
  }
};

