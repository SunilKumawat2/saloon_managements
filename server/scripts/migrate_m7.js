import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saloon_db',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

async function migrateModule7() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Module 7 (Loyalty & Membership) Database Migration...');
    await client.query('BEGIN');

    // 1. Add referral_code column to customers table if not exists
    await client.query(`
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_code VARCHAR(30) UNIQUE;
    `);

    // Auto-generate referral codes for existing customers without one
    const customerRes = await client.query(`SELECT id, name, phone FROM customers WHERE referral_code IS NULL`);
    for (const cust of customerRes.rows) {
      const cleanName = (cust.name || 'CUST').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5);
      const code = `${cleanName}${cust.id.toString().padStart(3, '0')}`;
      await client.query(`UPDATE customers SET referral_code = $1 WHERE id = $2`, [code, cust.id]);
    }

    // 2. Table: memberships (Tier Plans)
    await client.query(`
      CREATE TABLE IF NOT EXISTS memberships (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
        validity_days INT NOT NULL DEFAULT 365,
        points_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
        benefits TEXT,
        badge_color VARCHAR(30) DEFAULT '#00E676',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Table: customer_memberships (Enrolled Customer Plans)
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_memberships (
        id SERIAL PRIMARY KEY,
        customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
        membership_id INT REFERENCES memberships(id) ON DELETE RESTRICT,
        start_date DATE NOT NULL DEFAULT CURRENT_DATE,
        end_date DATE NOT NULL,
        amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
        status VARCHAR(20) DEFAULT 'Active',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Table: loyalty_transactions (Points Audit Ledger)
    await client.query(`
      CREATE TABLE IF NOT EXISTS loyalty_transactions (
        id SERIAL PRIMARY KEY,
        customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
        bill_id INT REFERENCES bills(id) ON DELETE SET NULL,
        points INT NOT NULL,
        transaction_type VARCHAR(30) NOT NULL, -- 'earned', 'redeemed', 'referral_bonus', 'adjustment'
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Table: referrals (Referral Code Tracking)
    await client.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id INT REFERENCES customers(id) ON DELETE CASCADE,
        referred_id INT REFERENCES customers(id) ON DELETE SET NULL,
        referral_code VARCHAR(30) NOT NULL,
        reward_points INT DEFAULT 100,
        status VARCHAR(30) DEFAULT 'Rewarded', -- 'Pending', 'Rewarded'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed Default Membership Tiers
    await client.query(`
      INSERT INTO memberships (id, name, price, discount_percent, validity_days, points_multiplier, benefits, badge_color) VALUES
      (1, 'Silver Member', 999.00, 5.00, 365, 1.00, '5% Off on all services + Standard reward points', '#C0C0C0'),
      (2, 'Gold VIP Member', 2499.00, 10.00, 365, 1.50, '10% Off on all services + 1.5x reward points + Priority slots', '#FFD700'),
      (3, 'Platinum Elite Member', 4999.00, 20.00, 365, 2.00, '20% Off on all services + 2x reward points + Free welcome drink & birthday perk', '#E5E4E2')
      ON CONFLICT (id) DO UPDATE SET 
        price = EXCLUDED.price,
        discount_percent = EXCLUDED.discount_percent,
        benefits = EXCLUDED.benefits;
    `);

    // Reset sequence
    await client.query(`SELECT setval(pg_get_serial_sequence('memberships', 'id'), COALESCE((SELECT MAX(id) FROM memberships), 1));`);

    // Seed sample membership enrollment for first customer if exists
    const firstCustRes = await client.query(`SELECT id FROM customers ORDER BY id LIMIT 1`);
    if (firstCustRes.rows.length > 0) {
      const firstCustId = firstCustRes.rows[0].id;
      await client.query(`
        INSERT INTO customer_memberships (customer_id, membership_id, start_date, end_date, amount_paid, status, notes)
        VALUES ($1, 2, CURRENT_DATE, CURRENT_DATE + INTERVAL '365 days', 2499.00, 'Active', 'Gold VIP Annual Plan')
        ON CONFLICT DO NOTHING;
      `, [firstCustId]);

      await client.query(`
        INSERT INTO loyalty_transactions (customer_id, points, transaction_type, description)
        VALUES 
        ($1, 120, 'earned', 'Welcome Bonus & Previous Service Points')
        ON CONFLICT DO NOTHING;
      `, [firstCustId]);
    }

    await client.query('COMMIT');
    console.log('✅ Module 7 (Loyalty & Membership) Migration Completed Successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration Failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

migrateModule7();
