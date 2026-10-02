import { UserModel } from '../models/User.js';
import { pool } from '../config/db.js';

async function testUserCreation() {
  console.log('🧪 Testing User Creation in PostgreSQL...');
  try {
    const testAdmin = {
      name: 'Test Salon Admin',
      email: `testadmin_${Date.now()}@saloon.com`,
      phone: '9876543210',
      role_id: 1,
      branch_id: null,
      password: 'password123'
    };

    const result = await UserModel.create(testAdmin);
    console.log('✅ Created User Result:', result);

    const dbCheck = await pool.query('SELECT * FROM users WHERE email = $1', [testAdmin.email]);
    console.log('🔍 DB Verification Query Rows:', dbCheck.rows);

    if (dbCheck.rows.length > 0) {
      console.log('🎉 SUCCESS! User successfully persisted in PostgreSQL database (pgAdmin accessible)!');
    } else {
      console.error('❌ FAIL! User was not saved in PostgreSQL database.');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Exception in creation test:', err.message);
    process.exit(1);
  }
}

testUserCreation();
