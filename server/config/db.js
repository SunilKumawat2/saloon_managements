import pg from 'pg';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config(); // fallback

const { Pool } = pg;

export const pool = process.env.DATABASE_URL
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

// Database connectivity check
export const testDbConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as database_name');
    return {
      connected: true,
      time: res.rows[0].current_time,
      database: res.rows[0].database_name,
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
    };
  }
};
