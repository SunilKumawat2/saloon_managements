import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saloon_db',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

async function migrateModule10() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Module 10 (Admin Panel & Security Settings) Database Migration...');
    await client.query('BEGIN');

    // 1. Table: system_settings (Key-Value Configuration Store)
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'General', -- 'General', 'Tax_Currency', 'Security', 'POS_Receipt'
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Table: system_audit_logs (Security Audit Trail)
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(100),
        user_role VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        ip_address VARCHAR(45) DEFAULT '127.0.0.1',
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Table: database_backups (System Backup Registry)
    await client.query(`
      CREATE TABLE IF NOT EXISTS database_backups (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(150) NOT NULL,
        backup_type VARCHAR(50) DEFAULT 'Full DB Dump', -- 'Full DB Dump', 'Schema Only', 'Data Dump'
        file_size_bytes BIGINT DEFAULT 1048576,
        status VARCHAR(30) DEFAULT 'Completed', -- 'Completed', 'In-Progress', 'Failed'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed Default System Settings
    await client.query(`
      INSERT INTO system_settings (setting_key, setting_value, category, description) VALUES
      ('salon_name', 'Connaught Place Main Salon & Wellness Spa', 'General', 'Main salon business name displayed on portal & invoices'),
      ('contact_phone', '011-23456789', 'General', 'Salon primary contact phone number'),
      ('contact_email', 'support@saloonpulse.com', 'General', 'Salon official email address'),
      ('currency_symbol', '₹', 'Tax_Currency', 'Primary currency symbol (₹ INR, $ USD, € EUR, £ GBP)'),
      ('currency_code', 'INR', 'Tax_Currency', 'Primary ISO currency code'),
      ('default_gst_rate', '18.0', 'Tax_Currency', 'Default GST rate percentage for POS billing'),
      ('gstin_number', '07AAAAA0000A1Z5', 'Tax_Currency', 'Salon official GSTIN Tax registration number'),
      ('default_commission_rate', '10.0', 'General', 'Default stylist commission rate percentage'),
      ('security_session_timeout', '60', 'Security', 'User session inactivity timeout in minutes'),
      ('receipt_footer_note', 'Thank you for visiting SalonPulse! Please visit again.', 'POS_Receipt', 'Printable receipt bottom footer text')
      ON CONFLICT (setting_key) DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        updated_at = CURRENT_TIMESTAMP;
    `);

    // Reset sequence
    await client.query(`SELECT setval(pg_get_serial_sequence('system_settings', 'id'), COALESCE((SELECT MAX(id) FROM system_settings), 1));`);

    // Seed Sample Audit Trail Logs
    await client.query(`
      INSERT INTO system_audit_logs (user_id, user_name, user_role, action, resource, details) VALUES
      (1, 'Sunil Kumar (Admin)', 'Admin', 'LOGIN', 'Auth System', 'User logged in successfully from IP 127.0.0.1'),
      (1, 'Sunil Kumar (Admin)', 'Admin', 'UPDATE_SETTINGS', 'System Settings', 'Updated GST Tax Rate to 18.0% and Currency to INR (₹)'),
      (1, 'Sunil Kumar (Admin)', 'Admin', 'BACKUP_CREATED', 'Database Backups', 'Created manual full database backup: saloon_db_backup_20260910.sql')
      ON CONFLICT DO NOTHING;
    `);

    await client.query(`SELECT setval(pg_get_serial_sequence('system_audit_logs', 'id'), COALESCE((SELECT MAX(id) FROM system_audit_logs), 1));`);

    // Seed Sample Database Backup File Registry
    await client.query(`
      INSERT INTO database_backups (file_name, backup_type, file_size_bytes, status) VALUES
      ('saloon_db_backup_20260910_auto.sql', 'Full DB Dump', 4521984, 'Completed'),
      ('saloon_db_backup_20260909_daily.sql', 'Full DB Dump', 4210542, 'Completed')
      ON CONFLICT DO NOTHING;
    `);

    await client.query(`SELECT setval(pg_get_serial_sequence('database_backups', 'id'), COALESCE((SELECT MAX(id) FROM database_backups), 1));`);

    await client.query('COMMIT');
    console.log('✅ Module 10 (Admin Panel & Security Settings) Migration Completed Successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration Failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

migrateModule10();
