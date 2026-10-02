import { pool } from '../config/db.js';

async function migrateBranchesTable() {
  console.log('🔨 Migrating PostgreSQL branches table to support admin_id and created_by_user_id...');
  try {
    await pool.query(`
      ALTER TABLE branches 
      ADD COLUMN IF NOT EXISTS admin_id INT REFERENCES users(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS created_by_user_id INT REFERENCES users(id) ON DELETE CASCADE;
    `);
    console.log('✅ Successfully added admin_id and created_by_user_id columns to branches table!');

    // Check columns
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'branches'
    `);
    console.log('📊 Current branches table columns:', cols.rows.map(c => c.column_name));
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
    process.exit(1);
  }
}

migrateBranchesTable();
