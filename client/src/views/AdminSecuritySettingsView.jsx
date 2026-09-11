import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Sliders, Database, Users, Lock, Key, RefreshCw, Save,
  Plus, Edit2, Trash2, CheckCircle, AlertCircle, FileText, Download,
  Clock, Server, Globe, DollarSign, Percent, Shield, Eye, CreditCard
} from 'lucide-react';
import {
  Admin_Get_System_Settings,
  Admin_Update_System_Settings,
  Admin_Get_Audit_Logs,
  Admin_Get_Database_Backups,
  Admin_Create_Database_Backup,
  Admin_Get_Users,
  Admin_Create_User,
  Admin_Get_Branches,
  Admin_Get_Roles
} from '../services/apiService';

const AdminSecuritySettingsView = ({ onNavigateToMatrix }) => {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings', 'users', 'audit', 'backups'
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [backupProcessing, setBackupProcessing] = useState(false);

  // User creation modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '', email: '', phone: '', password: 'user123', role_id: '3', branch_id: '1'
  });

  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settRes, auditRes, backRes, userRes, branchRes] = await Promise.all([
        Admin_Get_System_Settings(),
        Admin_Get_Audit_Logs(),
        Admin_Get_Database_Backups(),
        Admin_Get_Users(),
        Admin_Get_Branches()
      ]);

      if (settRes.data?.success) setSettings(settRes.data.settings);
      if (auditRes.data?.success) setAuditLogs(auditRes.data.logs);
      if (backRes.data?.success) setBackups(backRes.data.backups);
      if (userRes.data?.users) setUsers(userRes.data.users);
      if (branchRes.data?.branches) setBranches(branchRes.data.branches);
    } catch (err) {
      console.error('Error fetching settings:', err);
      showFeedback('error', 'Failed to load system settings and audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 4000);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await Admin_Update_System_Settings(settings);
      showFeedback('success', 'System configuration & tax settings saved successfully!');
      fetchData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to save settings');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await Admin_Create_User(userForm);
      showFeedback('success', `User "${userForm.name}" created successfully!`);
      setIsUserModalOpen(false);
      setUserForm({ name: '', email: '', phone: '', password: 'user123', role_id: '3', branch_id: '1' });
      fetchData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to create user');
    }
  };

  const handleCreateBackup = async () => {
    setBackupProcessing(true);
    try {
      const res = await Admin_Create_Database_Backup();
      showFeedback('success', res.data?.message || 'Database backup dump file generated!');
      fetchData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to generate database backup');
    } finally {
      setBackupProcessing(false);
    }
  };

  return (
    <div style={{ padding: '24px', color: '#fff', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <ShieldCheck size={28} color="#10B981" /> Admin Panel & Security Settings
          </h1>
          <p style={{ color: '#90A4AE', fontSize: '14px', marginTop: '4px', margin: 0 }}>
            Centralized ERP configuration, user access control, security audit logs & database backup recovery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleCreateBackup}
            disabled={backupProcessing}
            style={{
              padding: '10px 18px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Database size={18} /> {backupProcessing ? 'Generating Dump...' : 'Create DB Backup'}
          </button>
          <button
            onClick={fetchData}
            style={{
              padding: '10px', background: '#1E293B', color: '#90A4AE',
              border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer'
            }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback.msg && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
          background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${feedback.type === 'error' ? '#EF4444' : '#10B981'}`,
          color: feedback.type === 'error' ? '#EF4444' : '#10B981',
          display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500'
        }}>
          {feedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {feedback.msg}
        </div>
      )}

      {/* Tabs Bar */}
      <div style={{
        display: 'flex', gap: '8px', borderBottom: '1px solid #334155',
        marginBottom: '24px', overflowX: 'auto'
      }}>
        {[
          { id: 'settings', label: 'Centralized System & Tax Settings', icon: Sliders },
          { id: 'users', label: 'User & Role Access Control', icon: Users },
          { id: 'audit', label: 'Security Audit Log', icon: Shield },
          { id: 'backups', label: 'Database Backup & Recovery', icon: Database }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px', background: 'transparent', border: 'none',
                borderBottom: isActive ? '3px solid #10B981' : '3px solid transparent',
                color: isActive ? '#10B981' : '#90A4AE', fontWeight: isActive ? '700' : '500',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '14px', whiteSpace: 'nowrap', transition: 'all 0.2s'
              }}
            >
              <Icon size={18} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CENTRALIZED SYSTEM & TAX SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} color="#10B981" /> Centralized System Configuration
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px' }}>Salon Business Name</label>
              <input
                type="text" required
                value={settings.salon_name || ''}
                onChange={e => setSettings({ ...settings, salon_name: e.target.value })}
                style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px' }}>Primary Contact Phone</label>
              <input
                type="text" required
                value={settings.contact_phone || ''}
                onChange={e => setSettings({ ...settings, contact_phone: e.target.value })}
                style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px' }}>Primary Currency</label>
              <select
                value={settings.currency_symbol || '₹'}
                onChange={e => setSettings({ ...settings, currency_symbol: e.target.value })}
                style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
              >
                <option value="₹">INR (₹) — Indian Rupee</option>
                <option value="$">USD ($) — US Dollar</option>
                <option value="€">EUR (€) — Euro</option>
                <option value="£">GBP (£) — British Pound</option>
                <option value="AED">AED (د.إ) — UAE Dirham</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px' }}>Default GST Tax Rate (%)</label>
              <select
                value={settings.default_gst_rate || '18.0'}
                onChange={e => setSettings({ ...settings, default_gst_rate: e.target.value })}
                style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
              >
                <option value="0.0">0% Tax Exempt</option>
                <option value="5.0">5% GST</option>
                <option value="12.0">12% GST</option>
                <option value="18.0">18% GST (Standard)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px' }}>Salon GSTIN Tax Number</label>
              <input
                type="text"
                value={settings.gstin_number || ''}
                onChange={e => setSettings({ ...settings, gstin_number: e.target.value })}
                style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px' }}>Default Stylist Commission Rate (%)</label>
              <input
                type="number" step="0.5"
                value={settings.default_commission_rate || '10.0'}
                onChange={e => setSettings({ ...settings, default_commission_rate: e.target.value })}
                style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px' }}>POS Thermal Receipt Bottom Note</label>
            <textarea
              rows="2"
              value={settings.receipt_footer_note || ''}
              onChange={e => setSettings({ ...settings, receipt_footer_note: e.target.value })}
              style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '12px 24px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Save size={18} /> Save System Settings
          </button>
        </form>
      )}

      {/* TAB 2: USER & ROLE ACCESS CONTROL */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>
              System Users & Administrative Roles
            </h3>
            <button
              onClick={() => setIsUserModalOpen(true)}
              style={{
                padding: '8px 16px', background: '#1E293B', color: '#10B981',
                border: '1px solid #10B981', borderRadius: '8px', fontWeight: '600',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Plus size={16} /> Add New User
            </button>
          </div>

          <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155', color: '#90A4AE', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 16px' }}>User Name</th>
                  <th style={{ padding: '14px 16px' }}>Email & Phone</th>
                  <th style={{ padding: '14px 16px' }}>Role</th>
                  <th style={{ padding: '14px 16px' }}>Branch</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>{u.name}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#E2E8F0' }}>{u.email}</div>
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>{u.phone}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
                        background: u.role_name === 'Admin' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                        color: u.role_name === 'Admin' ? '#EF4444' : '#10B981'
                      }}>
                        {u.role_name || u.role || 'Staff'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#CBD5E1', fontSize: '13px' }}>{u.branch_name || 'Main Salon'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                        background: 'rgba(16,185,129,0.15)', color: '#10B981'
                      }}>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY AUDIT LOG */}
      {activeTab === 'audit' && (
        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', fontWeight: '600', color: '#fff' }}>
            System Security Audit Trail & User Activity Logs
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155', color: '#90A4AE', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 16px' }}>Timestamp</th>
                <th style={{ padding: '14px 16px' }}>User</th>
                <th style={{ padding: '14px 16px' }}>Role</th>
                <th style={{ padding: '14px 16px' }}>Action</th>
                <th style={{ padding: '14px 16px' }}>Resource</th>
                <th style={{ padding: '14px 16px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                  <td style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '13px' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>{log.user_name}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', background: 'rgba(255,255,255,0.08)', color: '#10B981' }}>
                      {log.user_role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#10B981' }}>{log.action}</td>
                  <td style={{ padding: '14px 16px', color: '#CBD5E1', fontSize: '13px' }}>{log.resource}</td>
                  <td style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '13px' }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: DATABASE BACKUP & RECOVERY */}
      {activeTab === 'backups' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>
              PostgreSQL Database Backups & Recovery Registry
            </h3>
            <button
              onClick={handleCreateBackup}
              disabled={backupProcessing}
              style={{
                padding: '8px 16px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer'
              }}
            >
              <Database size={16} style={{ marginRight: '6px' }} /> Create On-Demand Backup
            </button>
          </div>

          <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155', color: '#90A4AE', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 16px' }}>Backup File Name</th>
                  <th style={{ padding: '14px 16px' }}>Backup Type</th>
                  <th style={{ padding: '14px 16px' }}>File Size</th>
                  <th style={{ padding: '14px 16px' }}>Created Date</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {backups.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>
                      <code style={{ color: '#10B981', background: '#0F172A', padding: '2px 8px', borderRadius: '4px' }}>{b.file_name}</code>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#CBD5E1' }}>{b.backup_type}</td>
                    <td style={{ padding: '14px 16px', color: '#94A3B8' }}>{(b.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</td>
                    <td style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '13px' }}>{new Date(b.created_at).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                        ✓ {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE USER */}
      {isUserModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: '#1E293B', border: '1px solid #334155', borderRadius: '16px',
            width: '100%', maxWidth: '480px', padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
              Add Administrative System User
            </h3>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Full Name</label>
                <input
                  type="text" required placeholder="e.g. Ramesh Kumar"
                  value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Email Address</label>
                <input
                  type="email" required placeholder="ramesh@saloon.com"
                  value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                <input
                  type="text" required placeholder="9876543210"
                  value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Role</label>
                  <select
                    value={userForm.role_id} onChange={e => setUserForm({ ...userForm, role_id: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="1">Admin</option>
                    <option value="2">Manager</option>
                    <option value="3">Receptionist</option>
                    <option value="4">Staff / Stylist</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Branch</label>
                  <select
                    value={userForm.branch_id} onChange={e => setUserForm({ ...userForm, branch_id: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: '#10B981', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Create System User
                </button>
                <button
                  type="button" onClick={() => setIsUserModalOpen(false)}
                  style={{ flex: 1, padding: '12px', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSecuritySettingsView;
