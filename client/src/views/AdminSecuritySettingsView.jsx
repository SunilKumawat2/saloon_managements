import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Sliders, Database, Users, Lock, Key, RefreshCw, Save,
  Plus, Edit2, Trash2, CheckCircle, CheckCircle2, AlertCircle, FileText, Download,
  Clock, Server, Globe, DollarSign, Percent, Shield, Eye, CreditCard, Building,
  Sparkles, Palette, Upload, Image, Trash, Scissors, Receipt
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
  Admin_Get_Roles,
  Admin_Get_Gateway_Config,
  Admin_Get_Gateway_List,
  Admin_Update_Gateway_Config
} from '../services/apiService';
import { useBranding, THEME_PALETTES } from '../context/BrandingContext';

const AdminSecuritySettingsView = ({ onNavigateToMatrix, currentUser, branches: propBranches = [], selectedBranchId = 'all', initialTab = 'settings' }) => {
  const { brandSettings, updateLocalBranding } = useBranding();
  const [activeTab, setActiveTab] = useState(initialTab || 'settings'); // 'settings', 'branding', 'users', 'audit', 'backups', 'gateway'
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [backupProcessing, setBackupProcessing] = useState(false);

  // Multi-Tenant Payment Gateway Configuration State
  const [selectedGatewayBranch, setSelectedGatewayBranch] = useState(() => (selectedBranchId !== 'all' ? String(selectedBranchId) : ''));
  const [gatewayList, setGatewayList] = useState([]);
  const [supportedGateways, setSupportedGateways] = useState([
    { id: 'razorpay', name: 'Razorpay Payment Gateway (UPI, Cards, Netbanking)' },
    { id: 'stripe', name: 'Stripe Payments (Credit/Debit & International)' }
  ]);
  const [gatewayForm, setGatewayForm] = useState({
    gateway_name: 'razorpay',
    key_id: '',
    key_secret: '',
    mode: 'test',
    is_enabled: true,
    currency: 'INR',
    has_keys: false
  });
  const [gatewaySaving, setGatewaySaving] = useState(false);
  const displayBranches = (branches && branches.length > 0) ? branches : (propBranches || []);

  // User creation modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '', email: '', phone: '', password: 'user123', role_id: '3', branch_id: '1'
  });

  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const effectiveBranches = propBranches && propBranches.length > 0 ? propBranches : branches;

  const fetchGatewayConfigForBranch = async (branchId, gwName = gatewayForm.gateway_name) => {
    try {
      const res = await Admin_Get_Gateway_Config({
        branch_id: branchId || undefined,
        gateway_name: gwName
      });
      if (res?.data?.data) {
        const d = res.data.data;
        setGatewayForm({
          gateway_name: d.gateway_name || gwName || 'razorpay',
          key_id: d.key_id || '',
          key_secret: '',
          mode: d.mode || 'test',
          is_enabled: d.is_enabled ?? true,
          currency: d.currency || 'INR',
          has_keys: Boolean(d.has_keys)
        });
      }
      if (res?.data?.supported_gateways) {
        setSupportedGateways(res.data.supported_gateways);
      }
    } catch (e) {
      console.error('Error loading gateway for branch:', e);
    }
  };

  const fetchGatewayList = async () => {
    try {
      const res = await Admin_Get_Gateway_List();
      if (res?.data?.data) {
        setGatewayList(res.data.data);
      }
    } catch (e) {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settRes, auditRes, backRes, userRes, branchRes, gwRes, gwListRes] = await Promise.all([
        Admin_Get_System_Settings().catch(() => null),
        Admin_Get_Audit_Logs().catch(() => null),
        Admin_Get_Database_Backups().catch(() => null),
        Admin_Get_Users().catch(() => null),
        Admin_Get_Branches().catch(() => null),
        Admin_Get_Gateway_Config({ branch_id: selectedGatewayBranch || undefined }).catch(() => null),
        Admin_Get_Gateway_List().catch(() => null)
      ]);

      if (settRes?.data?.success) setSettings(settRes.data.settings);
      if (auditRes?.data?.success) setAuditLogs(auditRes.data.logs);
      if (backRes?.data?.success) setBackups(backRes.data.backups);
      if (userRes?.data?.users) setUsers(userRes.data.users);
      if (branchRes?.data?.branches) setBranches(branchRes.data.branches);
      if (gwListRes?.data?.data) setGatewayList(gwListRes.data.data);

      if (gwRes?.data?.data) {
        const d = gwRes.data.data;
        setGatewayForm({
          gateway_name: d.gateway_name || 'razorpay',
          key_id: d.key_id || '',
          key_secret: '',
          mode: d.mode || 'test',
          is_enabled: d.is_enabled ?? true,
          currency: d.currency || 'INR',
          has_keys: Boolean(d.has_keys)
        });
      }
      if (gwRes?.data?.supported_gateways) {
        setSupportedGateways(gwRes.data.supported_gateways);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      showFeedback('error', 'Failed to load system settings and audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSelect = (branchVal) => {
    setSelectedGatewayBranch(branchVal);
    fetchGatewayConfigForBranch(branchVal, gatewayForm.gateway_name);
  };

  const handleSaveGatewayConfig = async (e) => {
    e.preventDefault();
    setGatewaySaving(true);
    try {
      const payload = {
        ...gatewayForm,
        branch_id: selectedGatewayBranch ? parseInt(selectedGatewayBranch) : null
      };
      const res = await Admin_Update_Gateway_Config(payload);
      showFeedback('success', res?.data?.message || 'Payment Gateway Configuration Saved & Activated!');
      fetchGatewayConfigForBranch(selectedGatewayBranch, gatewayForm.gateway_name);
      fetchGatewayList();
    } catch (err) {
      showFeedback('error', err?.data?.message || err.message || 'Failed to update payment gateway config.');
    } finally {
      setGatewaySaving(false);
    }
  };

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 4000);
  };

  const handleSaveSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      await Admin_Update_System_Settings(settings);
      updateLocalBranding(settings);
      showFeedback('success', 'System configuration & White Label branding saved successfully!');
      fetchData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to save settings');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showFeedback('error', 'Logo file size exceeds 2MB limit. Please upload a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setSettings(prev => ({ ...prev, logo_url: base64 }));
      updateLocalBranding({ logo_url: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setSettings(prev => ({ ...prev, favicon_url: base64 }));
      updateLocalBranding({ favicon_url: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handlePaletteSelect = (pal) => {
    setSettings(prev => ({ ...prev, theme_palette: pal.id, theme_color: pal.hex }));
    updateLocalBranding({ theme_palette: pal.id, theme_color: pal.hex });
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
            <ShieldCheck size={28} color="#3b82f6" /> Admin Panel & Security Settings
          </h1>
          <p style={{ color: '#90A4AE', fontSize: '14px', marginTop: '4px', margin: 0 }}>
            Centralized ERP configuration, user access control, security audit logs & database backup recovery.
          </p>
        </div>


      </div>

      {/* Feedback Toast */}
      {feedback.msg && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
          background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(37, 99, 235, 0.15)',
          border: `1px solid ${feedback.type === 'error' ? '#EF4444' : '#2563eb'}`,
          color: feedback.type === 'error' ? '#EF4444' : '#3b82f6',
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
          { id: 'branding', label: 'White Label & Brand Setup', icon: Sparkles },
          { id: 'gateway', label: 'Payment Gateway & Sandbox Setup', icon: CreditCard },
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
                borderBottom: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
                color: isActive ? 'var(--accent-gold)' : '#90A4AE', fontWeight: isActive ? '700' : '500',
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
            <Sliders size={20} color="#3b82f6" /> Centralized System Configuration
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
              padding: '12px 24px', background: 'var(--accent-gold)',
              color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <Save size={18} /> Save System Settings
          </button>
        </form>
      )}

      {/* TAB: WHITE LABELING & CUSTOM BRANDING SUITE */}
      {activeTab === 'branding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                background: 'var(--accent-gold-glow)',
                border: '1px solid var(--accent-gold)',
                borderRadius: '10px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={22} style={{ color: 'var(--accent-gold)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                  White Labeling & Custom Salon Branding Suite
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-sub)', margin: '4px 0 0 0' }}>
                  Rebrand the entire ERP portal and POS billing system with your salon's custom logo, name, tagline, theme colors, and custom receipt notes.
                </p>
              </div>
            </div>
          </div>

          {/* Main 2-Column Layout: Controls (Left) & Real-time Previews (Right) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
            
            {/* Column 1: Configuration Controls Form */}
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Card 1: Brand Identity */}
              <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '22px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building size={16} color="var(--accent-gold)" /> 1. Salon Business Identity
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                      Salon / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Luxe Glow Unisex Salon"
                      value={settings.salon_name || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setSettings(prev => ({ ...prev, salon_name: val }));
                        updateLocalBranding({ salon_name: val });
                      }}
                      style={{ width: '100%', padding: '10px 14px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', fontWeight: '600' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                      Salon Tagline / Slogan
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Luxury Hair Studio & Wellness Spa"
                      value={settings.salon_tagline || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setSettings(prev => ({ ...prev, salon_tagline: val }));
                        updateLocalBranding({ salon_tagline: val });
                      }}
                      style={{ width: '100%', padding: '10px 14px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +91 98765 43210"
                        value={settings.contact_phone || ''}
                        onChange={e => setSettings(prev => ({ ...prev, contact_phone: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                        Official Email
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. info@luxeglow.com"
                        value={settings.contact_email || ''}
                        onChange={e => setSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Custom Logo & Favicon */}
              <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '22px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Image size={16} color="var(--accent-gold)" /> 2. Custom Logo & App Icon
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                      Upload Salon Logo (PNG, SVG, JPG, WebP — max 2MB)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{
                        padding: '10px 16px',
                        background: '#0F172A',
                        border: '1.5px dashed var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Upload size={16} color="var(--accent-gold)" /> Choose Logo File
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleLogoUpload}
                        />
                      </label>
                      {settings.logo_url && (
                        <button
                          type="button"
                          onClick={() => {
                            setSettings(prev => ({ ...prev, logo_url: '' }));
                            updateLocalBranding({ logo_url: '' });
                          }}
                          style={{
                            padding: '10px 14px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid #ef4444',
                            borderRadius: '8px',
                            color: '#ef4444',
                            fontSize: '0.82rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Trash size={14} /> Remove Logo
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                      Or Paste Logo Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://yourdomain.com/salon-logo.png"
                      value={settings.logo_url || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setSettings(prev => ({ ...prev, logo_url: val }));
                        updateLocalBranding({ logo_url: val });
                      }}
                      style={{ width: '100%', padding: '10px 14px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  {settings.logo_url && (
                    <div style={{
                      padding: '12px',
                      background: 'rgba(0,0,0,0.4)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        padding: 0,
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <img
                          src={settings.logo_url}
                          alt="Logo Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '10px' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fff' }}>Logo Active & Loaded</div>
                        <div style={{ fontSize: '0.74rem', color: '#10b981' }}>Displayed on sidebar, login screen, and receipts</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Theme Color & Luxury Palettes */}
              <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '22px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Palette size={16} color="var(--accent-gold)" /> 3. Brand Color Palette & Accent Theme
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#90A4AE', marginBottom: '16px' }}>
                  Select from pre-tuned salon palettes or choose a custom hex code. All buttons, highlights, badges, and glows dynamically update.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                  {THEME_PALETTES.map(pal => {
                    const isSelected = (settings.theme_palette === pal.id) ||
                      (!settings.theme_palette && (settings.theme_color || '#2563eb').toLowerCase() === pal.hex.toLowerCase());
                    return (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => handlePaletteSelect(pal)}
                        style={{
                          padding: '10px 12px',
                          background: isSelected ? 'rgba(255,255,255,0.1)' : '#0F172A',
                          border: isSelected ? `2px solid ${pal.hex}` : '1px solid #334155',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: pal.hex,
                          boxShadow: `0 0 10px ${pal.glow}`,
                          border: '2px solid rgba(255,255,255,0.8)'
                        }} />
                        <span style={{ fontSize: '0.74rem', fontWeight: isSelected ? '800' : '500', color: isSelected ? '#fff' : '#90A4AE', textAlign: 'center' }}>
                          {pal.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: '#0F172A', borderRadius: '10px', border: '1px solid #334155' }}>
                  <label style={{ fontSize: '13px', color: '#90A4AE', fontWeight: '600' }}>Custom Color Picker:</label>
                  <input
                    type="color"
                    value={settings.theme_color || '#2563eb'}
                    onChange={e => {
                      const color = e.target.value;
                      setSettings(prev => ({ ...prev, theme_color: color, theme_palette: 'custom' }));
                      updateLocalBranding({ theme_color: color, theme_palette: 'custom' });
                    }}
                    style={{ width: '42px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <span style={{ fontSize: '0.84rem', fontFamily: 'monospace', fontWeight: '800', color: settings.theme_color || '#2563eb' }}>
                    {settings.theme_color || '#2563eb'}
                  </span>
                </div>
              </div>

              {/* Card 4: Invoice & POS Receipt Customization */}
              <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '22px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="var(--accent-gold)" /> 4. POS Receipt & Invoice Customization
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                      Official Salon GSTIN / Tax Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 07AAAAA0000A1Z5"
                      value={settings.gstin_number || ''}
                      onChange={e => setSettings(prev => ({ ...prev, gstin_number: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                      Thermal Receipt Bottom Note / Thank You Greeting
                    </label>
                    <textarea
                      rows="2"
                      placeholder="e.g. Thank you for visiting Luxe Glow! Follow us on Instagram @luxeglow for offers."
                      value={settings.receipt_footer_note || ''}
                      onChange={e => setSettings(prev => ({ ...prev, receipt_footer_note: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Save & Apply Changes Button */}
              <button
                type="submit"
                style={{
                  padding: '14px 28px',
                  background: 'var(--accent-gold)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: 'var(--shadow-glow)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Save size={18} /> Save & Apply White Label Branding
              </button>
            </form>

            {/* Column 2: Live Real-time Previews */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Preview 1: Sidebar & Navigation Mock */}
              <div style={{
                background: '#0a0a0a',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <div style={{ fontSize: '0.78rem', color: '#90A4AE', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={14} color="var(--accent-gold)" /> Live Preview: Sidebar & App Shell
                </div>

                <div style={{
                  background: '#000',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  {/* Brand Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: settings.logo_url ? 'transparent' : 'rgba(255,255,255,0.05)',
                      border: settings.logo_url ? 'none' : '1px solid var(--accent-gold)',
                      boxShadow: settings.logo_url ? 'none' : '0 0 15px var(--accent-gold-glow)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      padding: 0
                    }}>
                      {settings.logo_url ? (
                        <img
                          src={settings.logo_url}
                          alt="Logo"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '12px' }}
                        />
                      ) : (
                        <Scissors size={20} color="var(--accent-gold)" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>
                        {settings.salon_name || 'SalonPulse'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', marginTop: '2px' }}>
                        {settings.salon_tagline || 'ERP & CRM Portal'}
                      </div>
                    </div>
                  </div>

                  {/* Mock Nav Item with Active Theme */}
                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--active-bg)',
                      border: '1px solid var(--border-active)',
                      color: 'var(--text-active)',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-gold)' }} />
                      <span>Active Menu Item (Themed)</span>
                    </div>
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      color: '#90A4AE',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#334155' }} />
                      <span>Standard Menu Item</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview 2: Thermal Receipt Printout Mock */}
              <div style={{
                background: '#0a0a0a',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <div style={{ fontSize: '0.78rem', color: '#90A4AE', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={14} color="var(--accent-gold)" /> Live Preview: Thermal Receipt / Invoice
                </div>

                <div style={{
                  background: '#f8fafc',
                  color: '#0f172a',
                  borderRadius: '10px',
                  padding: '20px 18px',
                  fontFamily: 'monospace',
                  fontSize: '0.76rem',
                  lineHeight: '1.45',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  border: '1px dashed #cbd5e1'
                }}>
                  {/* Receipt Header */}
                  <div style={{ textAlign: 'center', borderBottom: '1px dashed #94a3b8', paddingBottom: '12px', marginBottom: '12px' }}>
                    {settings.logo_url && (
                      <div style={{ marginBottom: '8px' }}>
                        <img src={settings.logo_url} alt="Receipt Logo" style={{ maxHeight: '36px', maxWidth: '100px', objectFit: 'contain' }} />
                      </div>
                    )}
                    <div style={{ fontWeight: '900', fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                      {settings.salon_name || 'SALONPULSE ERP'}
                    </div>
                    {settings.salon_tagline && (
                      <div style={{ fontSize: '0.68rem', color: '#475569' }}>{settings.salon_tagline}</div>
                    )}
                    {settings.contact_phone && (
                      <div style={{ fontSize: '0.68rem', color: '#475569' }}>Phone: {settings.contact_phone}</div>
                    )}
                    {settings.gstin_number && (
                      <div style={{ fontSize: '0.68rem', color: '#475569' }}>GSTIN: {settings.gstin_number}</div>
                    )}
                  </div>

                  {/* Sample Items */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    <span>ITEM</span>
                    <span>AMOUNT</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                    <span>Classic Haircut & Styling</span>
                    <span>₹450.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                    <span>Beard Grooming & Spa</span>
                    <span>₹250.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #94a3b8', paddingTop: '6px', marginTop: '6px', fontWeight: '800' }}>
                    <span>TOTAL AMOUNT</span>
                    <span>₹700.00</span>
                  </div>

                  {/* Receipt Footer */}
                  <div style={{ textAlign: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed #94a3b8', fontSize: '0.7rem', color: '#475569' }}>
                    {settings.receipt_footer_note || 'Thank you for visiting! Please visit again.'}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* TAB: PAYMENT GATEWAY & SANDBOX SETUP */}
      {activeTab === 'gateway' && (
        <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={22} color="#3b82f6" /> Payment Gateway Integration (Multi-Tenant & Branch Scoped)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#90A4AE', marginTop: '4px', margin: 0 }}>
                Connect your salon's Razorpay or Stripe merchant credentials. Each admin and branch manages their own payment accounts independently.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '0.75rem', padding: '4px 12px', borderRadius: '12px', fontWeight: '800',
                background: gatewayForm.mode === 'test' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(37, 99, 235, 0.18)',
                color: gatewayForm.mode === 'test' ? '#F59E0B' : '#3b82f6',
                border: `1px solid ${gatewayForm.mode === 'test' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(37, 99, 235, 0.4)'}`
              }}>
                ⚡ Mode: {gatewayForm.mode === 'test' ? 'Sandbox / Test Mode' : 'Live Production'}
              </span>
              <span style={{
                fontSize: '0.75rem', padding: '4px 12px', borderRadius: '12px', fontWeight: '800',
                background: gatewayForm.has_keys ? (gatewayForm.is_enabled ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)') : 'rgba(239, 68, 68, 0.18)',
                color: gatewayForm.has_keys ? (gatewayForm.is_enabled ? '#10b981' : '#f59e0b') : '#ef4444',
                border: `1px solid ${gatewayForm.has_keys ? (gatewayForm.is_enabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)') : 'rgba(239, 68, 68, 0.4)'}`
              }}>
                {gatewayForm.has_keys ? (gatewayForm.is_enabled ? '● Active & Connected' : '⏸️ Disabled') : '⚠️ No Keys Configured'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveGatewayConfig}>
            {/* Scope / Branch Selection Card */}
            <div style={{ marginBottom: '22px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: '1', minWidth: '260px' }}>
                  <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                    🏢 Target Branch / Gateway Configuration Scope:
                  </label>
                  <select
                    value={selectedGatewayBranch}
                    onChange={e => handleBranchSelect(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#0F172A', border: '1px solid #3b82f6', borderRadius: '8px', color: '#fff', fontWeight: '700' }}
                  >
                    <option value="">🏢 All My Branches (Default / Account-Wide Settings)</option>
                    {displayBranches.map(b => (
                      <option key={b.id} value={String(b.id)}>
                        📍 Branch #{b.id}: {b.name} ({b.city || 'Active Branch'})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '420px', lineHeight: '1.4' }}>
                  {selectedGatewayBranch ? (
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                      <strong style={{ color: '#60a5fa' }}>Branch Override Mode:</strong> You are setting dedicated credentials for this branch. POS checkouts at this branch will deposit directly into this branch's gateway account.
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      <strong style={{ color: '#34d399' }}>Default Scope Mode:</strong> These credentials will apply to all your salon branches automatically, unless a branch has dedicated custom keys.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Provider, Mode, Status, Currency */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px' }}>Payment Provider</label>
                <select
                  value={gatewayForm.gateway_name}
                  onChange={e => {
                    const nextGw = e.target.value;
                    setGatewayForm(prev => ({ ...prev, gateway_name: nextGw }));
                    fetchGatewayConfigForBranch(selectedGatewayBranch, nextGw);
                  }}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                >
                  {supportedGateways.map(gw => (
                    <option key={gw.id} value={gw.id}>{gw.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px' }}>Environment Mode</label>
                <select
                  value={gatewayForm.mode}
                  onChange={e => setGatewayForm({ ...gatewayForm, mode: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="test">Sandbox / Test Mode (Safe for testing without real money)</option>
                  <option value="live">Live / Production Mode (Real bank deposits)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px' }}>Gateway Status</label>
                <select
                  value={gatewayForm.is_enabled ? 'true' : 'false'}
                  onChange={e => setGatewayForm({ ...gatewayForm, is_enabled: e.target.value === 'true' })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="true">Enabled (Active for POS Checkout)</option>
                  <option value="false">Disabled (Hide online payment in POS)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px' }}>Settlement Currency</label>
                <select
                  value={gatewayForm.currency || 'INR'}
                  onChange={e => setGatewayForm({ ...gatewayForm, currency: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="AED">AED (د.إ - UAE Dirham)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                </select>
              </div>
            </div>

            {/* API Credentials */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px' }}>
                  Merchant Key ID {gatewayForm.gateway_name === 'razorpay' ? '(rzp_test_... or rzp_live_...)' : '(pk_test_... or pk_live_...)'}
                </label>
                <input
                  type="text"
                  placeholder={gatewayForm.gateway_name === 'razorpay' ? 'rzp_test_YourKeyIDHere' : 'pk_test_YourPublishableKey'}
                  value={gatewayForm.key_id}
                  onChange={e => setGatewayForm({ ...gatewayForm, key_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '6px' }}>
                  Secret Key (Encrypted & Kept Secure)
                </label>
                <input
                  type="password"
                  placeholder={gatewayForm.has_keys ? '•••••••••••••••• (Leave blank to keep existing key)' : 'Enter Secret Key'}
                  value={gatewayForm.key_secret}
                  onChange={e => setGatewayForm({ ...gatewayForm, key_secret: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.25)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontWeight: '800', fontSize: '0.86rem', color: '#3b82f6', marginBottom: '4px' }}>
                💡 Payment Gateway Setup & POS Checkout Rules:
              </div>
              <ul style={{ fontSize: '0.78rem', color: '#90A4AE', paddingLeft: '20px', lineHeight: '1.6', margin: 0 }}>
                <li>When credentials are saved and enabled, your POS Billing checkout screen will display the official <strong>Razorpay / Stripe Gateway Checkout SDK</strong> button.</li>
                <li>If a branch has not configured API keys, online checkout is automatically hidden so customers can only be billed via <strong>Cash</strong> or <strong>Card Terminal</strong>.</li>
                <li>All customer transactions, webhook signatures, and settlements are strictly isolated per admin and branch.</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={gatewaySaving}
              style={{
                padding: '12px 28px', background: '#2563eb',
                color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
              }}
            >
              <Save size={18} /> {gatewaySaving ? 'Saving Configuration...' : 'Save & Activate Payment Gateway'}
            </button>
          </form>

          {/* Branch Payment Gateway Connections Overview Table */}
          <div style={{ marginTop: '36px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building size={18} color="#3b82f6" /> Branch Payment Gateway Connections Overview
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#90A4AE', margin: 0, marginTop: '2px' }}>
                  Real-time status of configured payment gateway credentials across all your salon branches.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { fetchGatewayList(); fetchGatewayConfigForBranch(selectedGatewayBranch, gatewayForm.gateway_name); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: '8px', padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                <RefreshCw size={14} /> Refresh Overview
              </button>
            </div>

            <div style={{ overflowX: 'auto', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '12px 14px' }}>Scope / Branch</th>
                    <th style={{ padding: '12px 14px' }}>Gateway Provider</th>
                    <th style={{ padding: '12px 14px' }}>Environment</th>
                    <th style={{ padding: '12px 14px' }}>Key ID Preview</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Quick Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Default Row */}
                  {(() => {
                    const defaultCfg = gatewayList.find(g => !g.branch_id);
                    const isSelected = selectedGatewayBranch === '';
                    return (
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#fff' }}>
                          🏢 All Branches (Default)
                        </td>
                        <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                          {defaultCfg ? defaultCfg.gateway_name.toUpperCase() : 'RAZORPAY'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: defaultCfg?.mode === 'live' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: defaultCfg?.mode === 'live' ? '#10b981' : '#f59e0b' }}>
                            {defaultCfg ? (defaultCfg.mode === 'live' ? 'Live' : 'Sandbox') : 'Not Set'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#94a3b8' }}>
                          {defaultCfg?.key_id ? `${defaultCfg.key_id.slice(0, 8)}••••` : 'None'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {defaultCfg ? (
                            defaultCfg.is_enabled ? (
                              <span style={{ color: '#10b981', fontWeight: '700' }}>● Active Default</span>
                            ) : (
                              <span style={{ color: '#f59e0b' }}>⏸️ Disabled</span>
                            )
                          ) : (
                            <span style={{ color: '#94a3b8' }}>⚪ Not Configured</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleBranchSelect('')}
                            style={{
                              padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700',
                              background: isSelected ? '#2563eb' : 'rgba(255,255,255,0.08)',
                              color: '#fff', border: 'none', cursor: 'pointer'
                            }}
                          >
                            {isSelected ? 'Editing' : 'Edit Default'}
                          </button>
                        </td>
                      </tr>
                    );
                  })()}

                  {/* Branch Rows */}
                  {displayBranches.map(branch => {
                    const branchCfg = gatewayList.find(g => g.branch_id === branch.id);
                    const isSelected = selectedGatewayBranch === String(branch.id);
                    return (
                      <tr key={branch.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '600', color: '#f1f5f9' }}>
                          📍 {branch.name}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                          {branchCfg ? branchCfg.gateway_name.toUpperCase() : 'Inherit Default'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {branchCfg ? (
                            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: branchCfg.mode === 'live' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: branchCfg.mode === 'live' ? '#10b981' : '#f59e0b' }}>
                              {branchCfg.mode === 'live' ? 'Live' : 'Sandbox'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Inherited</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#94a3b8' }}>
                          {branchCfg?.key_id ? `${branchCfg.key_id.slice(0, 8)}••••` : 'Default Key'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {branchCfg ? (
                            branchCfg.is_enabled ? (
                              <span style={{ color: '#10b981', fontWeight: '700' }}>● Dedicated Branch Key</span>
                            ) : (
                              <span style={{ color: '#f59e0b' }}>⏸️ Disabled</span>
                            )
                          ) : (
                            <span style={{ color: '#94a3b8' }}>🔗 Uses Default</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleBranchSelect(String(branch.id))}
                            style={{
                              padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700',
                              background: isSelected ? '#2563eb' : 'rgba(255,255,255,0.08)',
                              color: '#fff', border: 'none', cursor: 'pointer'
                            }}
                          >
                            {isSelected ? 'Editing' : 'Configure Branch'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
                padding: '8px 16px', background: '#1E293B', color: '#3b82f6',
                border: '1px solid #2563eb', borderRadius: '8px', fontWeight: '600',
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
                        background: u.role_name === 'Admin' ? 'rgba(239,68,68,0.15)' : 'rgba(37,99,235,0.15)',
                        color: u.role_name === 'Admin' ? '#EF4444' : '#3b82f6'
                      }}>
                        {u.role_name || u.role || 'Staff'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#CBD5E1', fontSize: '13px' }}>{u.branch_name || 'Main Salon'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                        background: 'rgba(37,99,235,0.15)', color: '#3b82f6'
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
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', background: 'rgba(255,255,255,0.08)', color: '#3b82f6' }}>
                      {log.user_role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#3b82f6' }}>{log.action}</td>
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
                padding: '8px 16px', background: '#2563eb',
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
                      <code style={{ color: '#3b82f6', background: '#0F172A', padding: '2px 8px', borderRadius: '4px' }}>{b.file_name}</code>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#CBD5E1' }}>{b.backup_type}</td>
                    <td style={{ padding: '14px 16px', color: '#94A3B8' }}>{(b.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</td>
                    <td style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '13px' }}>{new Date(b.created_at).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: 'rgba(37,99,235,0.15)', color: '#3b82f6' }}>
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
                  style={{ flex: 1, padding: '12px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
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
