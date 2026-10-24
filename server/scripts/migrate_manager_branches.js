import { pool } from '../config/db.js';

async function migrateManagerBranches() {
  try {
    console.log('--- Adding allowed_branch_ids to users table ---');
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_branch_ids JSONB DEFAULT '[]'::jsonb;`);
    console.log('✅ Column allowed_branch_ids added successfully');

    // Also check existing managers and make sure their admin_id is resolved if null
    const { rows: managers } = await pool.query(`
      SELECT u.id, u.name, u.role_id, u.branch_id, u.admin_id, u.created_by_user_id, b.admin_id as branch_admin_id 
      FROM users u 
      LEFT JOIN branches b ON u.branch_id = b.id 
      WHERE u.role_id = 2
    `);
    console.log('Current managers:', managers);

    for (const m of managers) {
      if (!m.admin_id && m.branch_admin_id) {
        await pool.query(
          `UPDATE users SET admin_id = $1, created_by_user_id = COALESCE(created_by_user_id, $1) WHERE id = $2`,
          [m.branch_admin_id, m.id]
        );
        console.log(`Updated manager ${m.id} (${m.name}) with admin_id ${m.branch_admin_id}`);
      }
    }

    const { rows: updatedManagers } = await pool.query(
      `SELECT id, name, role_id, branch_id, admin_id, created_by_user_id, allowed_branch_ids FROM users WHERE role_id = 2`
    );
    console.log('Updated managers:', updatedManagers);
    console.log('✅ Manager branches migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrateManagerBranches();
