import { pool } from '../config/db.js';

async function migrateUsersOwner() {
  try {
    console.log('--- Migrating users table to add admin_id & created_by_user_id ---');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS admin_id INT REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS created_by_user_id INT REFERENCES users(id) ON DELETE SET NULL;
    `);

    // Also update existing staff users to link them to their branch owner if branch has admin_id
    await pool.query(`
      UPDATE users u
      SET admin_id = b.admin_id, created_by_user_id = b.created_by_user_id
      FROM branches b
      WHERE u.branch_id = b.id AND b.admin_id IS NOT NULL AND u.admin_id IS NULL;
    `);

    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('UPDATED USERS TABLE COLUMNS:');
    console.table(cols.rows);

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateUsersOwner();
