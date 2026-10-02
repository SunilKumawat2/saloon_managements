import { pool } from '../config/db.js';

async function migrate() {
  try {
    console.log('Running time_slots schema migration for day_of_week and specific_date...');

    await pool.query(`
      ALTER TABLE time_slots
      ADD COLUMN IF NOT EXISTS day_of_week VARCHAR(20) DEFAULT 'ALL',
      ADD COLUMN IF NOT EXISTS specific_date VARCHAR(20) DEFAULT NULL;
    `);

    // Ensure all existing rows have default 'ALL'
    await pool.query(`UPDATE time_slots SET day_of_week = 'ALL' WHERE day_of_week IS NULL;`);

    console.log('✅ time_slots table successfully updated with day_of_week and specific_date!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
