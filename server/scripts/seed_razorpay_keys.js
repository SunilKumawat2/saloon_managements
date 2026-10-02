import { pool } from '../config/db.js';

async function seedRazorpayKeys() {
  try {
    const keyId = 'rzp_test_TfutS2M3FiTSWG';
    const keySecret = '6R7w2O6dKEHbTO0ws0tYSgQT';
    const mode = 'test';
    const isEnabled = true;

    const res = await pool.query(
      `INSERT INTO payment_gateway_settings (gateway_name, key_id, key_secret, mode, is_enabled, updated_at)
       VALUES ('razorpay', $1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (gateway_name)
       DO UPDATE SET key_id = $1, key_secret = $2, mode = $3, is_enabled = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [keyId, keySecret, mode, isEnabled]
    );

    console.log('✅ Real Razorpay Sandbox API Keys successfully saved into database!');
    console.log('Key ID:', res.rows[0].key_id);
    console.log('Mode:', res.rows[0].mode);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed Razorpay keys:', err);
    process.exit(1);
  }
}

seedRazorpayKeys();
