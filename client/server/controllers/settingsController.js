import Settings from '../models/Settings.js';

export const getSystemSettings = async (req, res) => {
  try {
    const data = await Settings.getAllSettings();
    res.json({ success: true, settings: data.settingsMap, list: data.list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSystemSettings = async (req, res) => {
  try {
    await Settings.updateSettings(req.body, req.user);
    res.json({ success: true, message: 'System settings saved successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await Settings.getAuditLogs();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDatabaseBackups = async (req, res) => {
  try {
    const backups = await Settings.getBackups();
    res.json({ success: true, backups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createDatabaseBackup = async (req, res) => {
  try {
    const backup = await Settings.createBackup(req.user);
    res.json({ success: true, backup, message: `Database backup file "${backup.file_name}" created successfully!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
