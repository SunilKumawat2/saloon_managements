import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saloon_db',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

async function migrateMembershipWallet() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running Membership Wallet Service Credit Migration...');
    await client.query('BEGIN');

    // 1. Add service_value_limit to memberships table
    await client.query(`
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS service_value_limit DECIMAL(10, 2) DEFAULT 0;
    `);

    // Update existing tiers with default credit limits if zero
    await client.query(`
      UPDATE memberships SET service_value_limit = 1500 WHERE id = 1 AND (service_value_limit IS NULL OR service_value_limit = 0);
      UPDATE memberships SET service_value_limit = 3500 WHERE id = 2 AND (service_value_limit IS NULL OR service_value_limit = 0);
      UPDATE memberships SET service_value_limit = 7500 WHERE id = 3 AND (service_value_limit IS NULL OR service_value_limit = 0);
      UPDATE memberships SET service_value_limit = price * 1.5 WHERE service_value_limit IS NULL OR service_value_limit = 0;
    `);

    // 2. Add credit tracking columns to customer_memberships table
    await client.query(`
      ALTER TABLE customer_memberships ADD COLUMN IF NOT EXISTS total_service_credit DECIMAL(10, 2) DEFAULT 0;
      ALTER TABLE customer_memberships ADD COLUMN IF NOT EXISTS used_service_credit DECIMAL(10, 2) DEFAULT 0;
      ALTER TABLE customer_memberships ADD COLUMN IF NOT EXISTS remaining_service_credit DECIMAL(10, 2) DEFAULT 0;
    `);

    // Backfill customer_memberships table
    await client.query(`
      UPDATE customer_memberships cm
      SET total_service_credit = COALESCE(NULLIF(cm.total_service_credit, 0), m.service_value_limit, m.price * 1.5, 1500),
          used_service_credit = COALESCE(cm.used_service_credit, 0),
          remaining_service_credit = COALESCE(NULLIF(cm.remaining_service_credit, 0), m.service_value_limit, m.price * 1.5, 1500)
      FROM memberships m
      WHERE cm.membership_id = m.id AND (cm.total_service_credit IS NULL OR cm.total_service_credit = 0);
    `);

    // 3. Table: membership_credit_logs (Credit Deduction Ledger)
    await client.query(`
      CREATE TABLE IF NOT EXISTS membership_credit_logs (
        id SERIAL PRIMARY KEY,
        customer_membership_id INT REFERENCES customer_memberships(id) ON DELETE CASCADE,
        customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
        service_name VARCHAR(150),
        amount DECIMAL(10, 2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Membership Wallet Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrateMembershipWallet();
