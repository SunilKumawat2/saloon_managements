import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

const targetDatabase = process.env.DB_NAME || 'saloon_db';

async function initializeDatabase() {
  console.log(`\n⚙️ Initializing PostgreSQL Database: '${targetDatabase}'...`);

  // Step 1: Connect to default 'postgres' database to create 'saloon_db'
  const rootClient = new Client({ ...dbConfig, database: 'postgres' });

  try {
    await rootClient.connect();
    console.log('✅ Connected to PostgreSQL Server.');

    // Check if database exists
    const res = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDatabase]);
    if (res.rows.length === 0) {
      console.log(`🔨 Creating database '${targetDatabase}'...`);
      await rootClient.query(`CREATE DATABASE "${targetDatabase}"`);
      console.log(`✅ Database '${targetDatabase}' created successfully!`);
    } else {
      console.log(`ℹ️ Database '${targetDatabase}' already exists.`);
    }
  } catch (err) {
    console.error('❌ Error creating database:', err.message);
    console.log('💡 Tip: Please check your DB_PASSWORD in server/.env file.');
    await rootClient.end();
    return;
  } finally {
    await rootClient.end();
  }

  // Step 2: Connect to target database 'saloon_db' and execute schema
  const dbClient = new Client({ ...dbConfig, database: targetDatabase });

  try {
    await dbClient.connect();
    console.log(`✅ Connected to '${targetDatabase}' database.`);

    const schemaPath = path.join(__dirname, '../config/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      console.log('🔨 Executing schema tables and initial seed data...');
      await dbClient.query(sql);
      console.log('🎉 Schema & Seed tables successfully created in PostgreSQL!');
    } else {
      console.error('⚠️ Schema file schema.sql not found at', schemaPath);
    }
  } catch (err) {
    console.error('❌ Error executing SQL schema:', err.message);
  } finally {
    await dbClient.end();
    console.log('🏁 Database setup process complete.\n');
  }
}

initializeDatabase();
