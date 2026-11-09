import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saloon_db',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

async function migrateCustomersIsolation() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Customers/Clients Admin-to-Admin & Branch Isolation Migration...');
    await client.query('BEGIN');

    // 1. Add admin_id and created_by_admin_id to customers table
    console.log('👥 Updating customers table columns...');
    await client.query(`
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS admin_id INT REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by_admin_id INT REFERENCES users(id) ON DELETE SET NULL;
    `);

    // 2. Backfill admin_id from branch owner or default to admin 1
    console.log('🔄 Backfilling admin_id on customers...');
    await client.query(`
      UPDATE customers c
      SET admin_id = COALESCE(c.admin_id, b.admin_id, b.created_by_user_id, 1),
          created_by_admin_id = COALESCE(c.created_by_admin_id, b.admin_id, b.created_by_user_id, 1)
      FROM branches b
      WHERE c.branch_id = b.id AND c.admin_id IS NULL;
    `);

    await client.query(`
      UPDATE customers SET admin_id = 1 WHERE admin_id IS NULL;
    `);

    // 3. Create performance index for fast isolated queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_admin_branch ON customers(admin_id, branch_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Customers Isolation Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrateCustomersIsolation();
