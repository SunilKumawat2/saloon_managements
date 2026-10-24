import { pool } from '../config/db.js';

async function migrateMultiTenantGateways() {
  console.log('🚀 Running Multi-Tenant & Branch-Isolated Payment Gateway Migration...');
  try {
    // 1. Ensure columns exist on payment_gateway_settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_gateway_settings (
        id SERIAL PRIMARY KEY,
        gateway_name VARCHAR(50) NOT NULL DEFAULT 'razorpay',
        key_id VARCHAR(255) NOT NULL,
        key_secret VARCHAR(255) NOT NULL,
        mode VARCHAR(20) DEFAULT 'test',
        is_enabled BOOLEAN DEFAULT true,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add multi-tenant columns
    await pool.query(`
      ALTER TABLE payment_gateway_settings 
      ADD COLUMN IF NOT EXISTS admin_id INT REFERENCES users(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(255),
      ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR',
      ADD COLUMN IF NOT EXISTS additional_config JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    // Drop old single-tenant unique constraint on gateway_name if it exists
    await pool.query(`
      ALTER TABLE payment_gateway_settings 
      DROP CONSTRAINT IF EXISTS payment_gateway_settings_gateway_name_key;
    `);

    // Create multi-tenant unique index for admin + branch + gateway_name
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_gateway_tenant 
      ON payment_gateway_settings (admin_id, COALESCE(branch_id, -1), gateway_name);
    `);

    // If there is any legacy row without admin_id, assign it to Super Admin (ID 1)
    await pool.query(`
      UPDATE payment_gateway_settings 
      SET admin_id = 1 
      WHERE admin_id IS NULL;
    `);

    console.log('✅ Multi-Tenant & Branch-Isolated Payment Gateway Migration Complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Error:', err);
    process.exit(1);
  }
}

migrateMultiTenantGateways();
