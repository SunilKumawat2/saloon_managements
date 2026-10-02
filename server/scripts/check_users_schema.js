import { pool } from '../config/db.js';

async function check() {
  try {
    const cols = await pool.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('USERS COLUMNS:');
    console.table(cols.rows);

    const users = await pool.query('SELECT id, name, email, role_id, branch_id, password FROM users');
    console.log('CURRENT USERS IN DB:');
    console.table(users.rows);

    // Test creating an admin user with branch_id = null
    console.log('\n--- TESTING INSERT OF ADMIN WITH branch_id = null ---');
    try {
      const testEmail = `test_admin_${Date.now()}@saloon.com`;
      const insertRes = await pool.query(
        `INSERT INTO users (name, email, phone, role_id, branch_id, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        ['Test Salon Admin', testEmail, '9876543210', 1, null, 'admin123']
      );
      console.log('SUCCESSFULLY INSERTED:', insertRes.rows[0]);
    } catch (insertErr) {
      console.error('INSERT FAILED WITH ERROR:', insertErr.message);
      console.error(insertErr);
    }

    process.exit(0);
  } catch (err) {
    console.error('FATAL ERROR:', err);
    process.exit(1);
  }
}

check();
