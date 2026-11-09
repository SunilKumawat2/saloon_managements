import { pool } from '../config/db.js';

async function syncAllSequences() {
  console.log('🔄 Checking PostgreSQL connection and syncing sequences...');
  try {
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log('📊 Current DB Users Count:', userCount.rows[0].count);

    const tables = ['users', 'branches', 'roles', 'services', 'stylists', 'customers', 'leads', 'appointments', 'bills'];
    for (const table of tables) {
      try {
        const res = await pool.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1))`);
        console.log(`✅ Synced sequence for '${table}':`, res.rows[0].setval);
      } catch (e) {
        console.log(`⚠️ Sequence sync warning for '${table}':`, e.message);
      }
    }
    console.log('🎉 All table sequences successfully synced with PostgreSQL!');
    process.exit(0);
  } catch (err) {
    console.error('❌ PostgreSQL DB Error:', err.message);
    process.exit(1);
  }
}

syncAllSequences();
