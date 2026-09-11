import { pool } from '../config/db.js';

async function migrateRazorpay() {
  console.log('🚀 Running Razorpay Payment Gateway Table Migration...');
  try {
    // Create payment_gateway_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_gateway_settings (
        id SERIAL PRIMARY KEY,
        gateway_name VARCHAR(50) NOT NULL UNIQUE,
        key_id VARCHAR(255) NOT NULL,
        key_secret VARCHAR(255) NOT NULL,
        mode VARCHAR(20) DEFAULT 'test',
        is_enabled BOOLEAN DEFAULT true,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default Razorpay Sandbox Test Credentials if not present
    await pool.query(`
      INSERT INTO payment_gateway_settings (gateway_name, key_id, key_secret, mode, is_enabled)
      VALUES ('razorpay', 'rzp_test_SalonPulse2026', 'secret_salonpulse_test_key', 'test', true)
      ON CONFLICT (gateway_name) DO NOTHING;
    `);

    // Add payment_gateway_ref, razorpay_order_id, razorpay_payment_id to bills table if missing
    await pool.query(`
      ALTER TABLE bills 
      ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'COMPLETED';
    `);

    console.log('✅ Razorpay Payment Gateway Migration Complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Error:', err);
    process.exit(1);
  }
}

migrateRazorpay();
