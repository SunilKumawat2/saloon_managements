import { pool } from '../config/db.js';

// Reset all roles to their correct default permissions
const rolePermissions = [
  { name: 'Admin', permissions: ['all','manage_permissions','manage_users','manage_branches','manage_finances','manage_services','manage_inventory','manage_billing','manage_appointments','view_customers','view_reports'] },
  { name: 'Manager', permissions: ['manage_branch_users','manage_appointments','manage_services','manage_inventory','view_reports','view_customers'] },
  { name: 'Receptionist', permissions: ['manage_appointments','manage_billing','view_customers'] },
  { name: 'Staff', permissions: ['view_assigned_appointments','view_schedule'] },
  { name: 'Customer', permissions: ['book_appointments','view_history'] },
];

for (const role of rolePermissions) {
  try {
    const res = await pool.query(
      `UPDATE roles SET permissions = $1::jsonb WHERE name = $2 RETURNING id, name, permissions`,
      [JSON.stringify(role.permissions), role.name]
    );
    if (res.rows.length > 0) {
      console.log(`✅ ${role.name}:`, JSON.stringify(res.rows[0].permissions));
    } else {
      console.log(`⚠️  ${role.name}: not found in DB`);
    }
  } catch (err) {
    console.error(`❌ ${role.name}:`, err.message);
  }
}

console.log('\n✅ All roles reset to correct permissions!');
process.exit(0);
