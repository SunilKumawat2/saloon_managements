import { pool } from '../config/db.js';

async function migrateModule5() {
  try {
    console.log('Running Module 5 database migrations...');

    await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50);`);
    await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;`);
    await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 18.00;`);
    await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10,2) DEFAULT 0;`);
    await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0;`);
    await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS split_details JSONB DEFAULT '{}'::jsonb;`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
        discount_value DECIMAL(10, 2) NOT NULL,
        min_bill_amount DECIMAL(10, 2) DEFAULT 0,
        max_discount_amount DECIMAL(10, 2) DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      INSERT INTO coupons (code, discount_type, discount_value, min_bill_amount, max_discount_amount) VALUES
        ('WELCOME10', 'percentage', 10.00, 0, 500.00),
        ('FESTIVE200', 'fixed', 200.00, 1000.00, NULL),
        ('BEAUTY15', 'percentage', 15.00, 500.00, 1000.00),
        ('VIP500', 'fixed', 500.00, 2000.00, NULL)
      ON CONFLICT (code) DO NOTHING;
    `);

    console.log('Module 5 DB migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Module 5 migration error:', err);
    process.exit(1);
  }
}

migrateModule5();
