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

async function migrateLoyaltyIsolation() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Admin & Branch Data Isolation Migration for Loyalty & Membership...');
    await client.query('BEGIN');

    // 1. Table: memberships - Add admin_id, branch_id, created_by_admin_id
    console.log('📦 Updating memberships table...');
    await client.query(`
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS admin_id INT REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id) ON DELETE SET NULL;
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS created_by_admin_id INT REFERENCES users(id) ON DELETE SET NULL;
    `);

    // 2. Table: customer_memberships - Add admin_id, branch_id
    console.log('👥 Updating customer_memberships table...');
    await client.query(`
      ALTER TABLE customer_memberships ADD COLUMN IF NOT EXISTS admin_id INT REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE customer_memberships ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id) ON DELETE SET NULL;
    `);

    // 3. Table: loyalty_transactions - Add admin_id, branch_id
    console.log('📊 Updating loyalty_transactions table...');
    await client.query(`
      ALTER TABLE loyalty_transactions ADD COLUMN IF NOT EXISTS admin_id INT REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE loyalty_transactions ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id) ON DELETE SET NULL;
    `);

    // 4. Table: referrals - Add admin_id, branch_id
    console.log('🤝 Updating referrals table...');
    await client.query(`
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS admin_id INT REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id) ON DELETE SET NULL;
    `);

    // 5. Table: membership_credit_logs - Add admin_id, branch_id
    console.log('💳 Updating membership_credit_logs table...');
    await client.query(`
      ALTER TABLE membership_credit_logs ADD COLUMN IF NOT EXISTS admin_id INT REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE membership_credit_logs ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id) ON DELETE SET NULL;
    `);

    // Backfill admin_id & branch_id for customer_memberships from customer records and branches
    await client.query(`
      UPDATE customer_memberships cm
      SET admin_id = COALESCE(cm.admin_id, (SELECT admin_id FROM branches WHERE id = c.branch_id LIMIT 1), 1),
          branch_id = COALESCE(cm.branch_id, c.branch_id)
      FROM customers c
      WHERE cm.customer_id = c.id AND (cm.admin_id IS NULL OR cm.branch_id IS NULL);
    `);

    // Backfill loyalty_transactions from customers or bills
    await client.query(`
      UPDATE loyalty_transactions lt
      SET admin_id = COALESCE(lt.admin_id, (SELECT admin_id FROM branches WHERE id = c.branch_id LIMIT 1), 1),
          branch_id = COALESCE(lt.branch_id, c.branch_id)
      FROM customers c
      WHERE lt.customer_id = c.id AND (lt.admin_id IS NULL OR lt.branch_id IS NULL);
    `);

    // Backfill referrals from referrer customer
    await client.query(`
      UPDATE referrals r
      SET admin_id = COALESCE(r.admin_id, (SELECT admin_id FROM branches WHERE id = c.branch_id LIMIT 1), 1),
          branch_id = COALESCE(r.branch_id, c.branch_id)
      FROM customers c
      WHERE r.referrer_id = c.id AND (r.admin_id IS NULL OR r.branch_id IS NULL);
    `);

    // Backfill membership_credit_logs
    await client.query(`
      UPDATE membership_credit_logs mcl
      SET admin_id = COALESCE(mcl.admin_id, cm.admin_id, 1),
          branch_id = COALESCE(mcl.branch_id, cm.branch_id)
      FROM customer_memberships cm
      WHERE mcl.customer_membership_id = cm.id AND (mcl.admin_id IS NULL OR mcl.branch_id IS NULL);
    `);

    // Create performance indexes for isolation queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_memberships_admin_branch ON memberships(admin_id, branch_id);
      CREATE INDEX IF NOT EXISTS idx_customer_memberships_admin_branch ON customer_memberships(admin_id, branch_id);
      CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_admin_branch ON loyalty_transactions(admin_id, branch_id);
      CREATE INDEX IF NOT EXISTS idx_referrals_admin_branch ON referrals(admin_id, branch_id);
      CREATE INDEX IF NOT EXISTS idx_membership_credit_logs_admin_branch ON membership_credit_logs(admin_id, branch_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Admin & Branch Isolation Migration for Loyalty & Membership completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrateLoyaltyIsolation();
