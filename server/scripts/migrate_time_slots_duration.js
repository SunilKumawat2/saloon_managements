import { pool } from '../config/db.js';

async function migrate() {
  try {
    console.log('Running time_slots schema migration for start_time, end_time, duration_minutes...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_slots (
        id SERIAL PRIMARY KEY,
        branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
        slot_time VARCHAR(20) NOT NULL,
        slot_name VARCHAR(100),
        start_time VARCHAR(10),
        end_time VARCHAR(10),
        duration_minutes INT DEFAULT 60,
        is_active BOOLEAN DEFAULT TRUE,
        admin_id INT,
        created_by_admin_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add columns if table already exists
    await pool.query(`
      ALTER TABLE time_slots
      ADD COLUMN IF NOT EXISTS start_time VARCHAR(10),
      ADD COLUMN IF NOT EXISTS end_time VARCHAR(10),
      ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 60;
    `);

    // Update existing records where start_time / end_time are null
    const { rows } = await pool.query(`SELECT id, slot_time, start_time, end_time FROM time_slots`);
    for (const r of rows) {
      const startTime = r.start_time || r.slot_time || '09:00';
      let endTime = r.end_time;
      if (!endTime) {
        const parts = startTime.split(':');
        const h = parseInt(parts[0]) || 9;
        const m = parseInt(parts[1]) || 0;
        const endTotal = h * 60 + m + 60;
        const endH = Math.floor(endTotal / 60) % 24;
        const endM = endTotal % 60;
        endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      }
      const dur = 60;
      await pool.query(
        `UPDATE time_slots SET start_time = $1, end_time = $2, duration_minutes = $3 WHERE id = $4`,
        [startTime, endTime, dur, r.id]
      );
    }

    console.log('✅ time_slots table successfully migrated with start_time, end_time, duration_minutes!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
