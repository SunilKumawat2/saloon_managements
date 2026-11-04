import Settings from '../models/Settings.js';

export const getSystemSettings = async (req, res) => {
  try {
    const data = await Settings.getAllSettings();
    res.json({ success: true, settings: data.settingsMap, list: data.list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Public Branding / White Labeling info (accessible without authentication for login screen & app shell)
export const getPublicBranding = async (req, res) => {
  try {
    const data = await Settings.getAllSettings();
    const map = data.settingsMap || {};
    res.json({
      success: true,
      branding: {
        salon_name: map.salon_name || 'SalonPulse',
        salon_tagline: map.salon_tagline || 'ERP & CRM Portal',
        logo_url: map.logo_url || '',
        favicon_url: map.favicon_url || '',
        theme_color: map.theme_color || '#2563eb',
        theme_palette: map.theme_palette || 'cobalt_blue',
        contact_phone: map.contact_phone || '',
        contact_email: map.contact_email || '',
        currency_symbol: map.currency_symbol || '₹',
        currency_code: map.currency_code || 'INR',
        default_gst_rate: map.default_gst_rate || '18.0',
        gstin_number: map.gstin_number || '',
        receipt_footer_note: map.receipt_footer_note || 'Thank you for visiting! Please visit again.',
        invoice_header_text: map.invoice_header_text || '',
        invoice_terms: map.invoice_terms || ''
      }
    });
  } catch (err) {
    res.json({
      success: true,
      branding: {
        salon_name: 'SalonPulse',
        salon_tagline: 'ERP & CRM Portal',
        logo_url: '',
        favicon_url: '',
        theme_color: '#2563eb',
        theme_palette: 'cobalt_blue',
        contact_phone: '',
        contact_email: '',
        currency_symbol: '₹',
        currency_code: 'INR',
        default_gst_rate: '18.0',
        gstin_number: '',
        receipt_footer_note: 'Thank you for visiting! Please visit again.',
        invoice_header_text: '',
        invoice_terms: ''
      }
    });
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
