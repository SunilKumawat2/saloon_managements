import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const { Pool } = pg;

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'saloon_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

async function migrateStaffAttendance() {
  console.log('🚀 Running Staff Attendance Migration...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS staff_attendance (
        id SERIAL PRIMARY KEY,
        staff_id INT NOT NULL,
        staff_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'Staff Stylist',
        branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
        admin_id INT,
        attendance_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Present',
        check_in_time VARCHAR(10) DEFAULT '09:30',
        check_out_time VARCHAR(10) DEFAULT '18:30',
        working_hours DECIMAL(4, 2) DEFAULT 9.0,
        overtime_hours DECIMAL(4, 2) DEFAULT 0.0,
        notes TEXT,
        marked_by INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_staff_attendance_day UNIQUE (staff_id, attendance_date)
      );

      CREATE INDEX IF NOT EXISTS idx_staff_attendance_date ON staff_attendance(attendance_date);
      CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_id ON staff_attendance(staff_id);
      CREATE INDEX IF NOT EXISTS idx_staff_attendance_branch_id ON staff_attendance(branch_id);
    `;

    await client.query(createTableQuery);
    await client.query('COMMIT');
    console.log('✅ staff_attendance table created/verified successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateStaffAttendance();
