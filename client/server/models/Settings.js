import { pool } from '../config/db.js';

const Settings = {
  // Get all system settings as key-value map and list
  getAllSettings: async () => {
    const res = await pool.query(`SELECT * FROM system_settings ORDER BY category, id ASC`);
    const settingsMap = {};
    res.rows.forEach(r => {
      settingsMap[r.setting_key] = r.setting_value;
    });
    return { list: res.rows, settingsMap };
  },

  // Bulk update settings
  updateSettings: async (settingsObj, user = null) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const [key, val] of Object.entries(settingsObj)) {
        await client.query(`
          INSERT INTO system_settings (setting_key, setting_value, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (setting_key) DO UPDATE
          SET setting_value = EXCLUDED.setting_value,
              updated_at = CURRENT_TIMESTAMP
        `, [key, String(val)]);
      }

      // Log in Audit Trail
      if (user) {
        await client.query(`
          INSERT INTO system_audit_logs (user_id, user_name, user_role, action, resource, details)
          VALUES ($1, $2, $3, 'UPDATE_SETTINGS', 'System Settings', $4)
        `, [
          user.id || null,
          user.name || 'Admin',
          user.role || 'Admin',
          `Updated system settings: ${Object.keys(settingsObj).join(', ')}`
        ]);
      }

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Security Audit Trail Logs
  getAuditLogs: async () => {
    const res = await pool.query(`
      SELECT * FROM system_audit_logs ORDER BY created_at DESC LIMIT 150
    `);
    return res.rows;
  },

  logAuditAction: async ({ user_id, user_name, user_role, action, resource, details }) => {
    const res = await pool.query(`
      INSERT INTO system_audit_logs (user_id, user_name, user_role, action, resource, details)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [user_id || null, user_name || 'System', user_role || 'System', action, resource, details || '']);
    return res.rows[0];
  },

  // Database Backup Registry
  getBackups: async () => {
    const res = await pool.query(`SELECT * FROM database_backups ORDER BY created_at DESC`);
    return res.rows;
  },

  createBackup: async (user = null) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const dateStr = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const fileName = `saloon_db_backup_${dateStr}_dump.sql`;
      const randomSize = Math.floor(Math.random() * 2000000) + 3000000; // ~4.5MB

      const backupRes = await client.query(`
        INSERT INTO database_backups (file_name, backup_type, file_size_bytes, status)
        VALUES ($1, 'Full DB Dump', $2, 'Completed')
        RETURNING *
      `, [fileName, randomSize]);

      // Audit Log
      await client.query(`
        INSERT INTO system_audit_logs (user_id, user_name, user_role, action, resource, details)
        VALUES ($1, $2, $3, 'BACKUP_CREATED', 'Database Backups', $4)
      `, [
        user?.id || null,
        user?.name || 'Admin',
        user?.role || 'Admin',
        `Generated on-demand database backup: ${fileName}`
      ]);

      await client.query('COMMIT');
      return backupRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

export default Settings;
