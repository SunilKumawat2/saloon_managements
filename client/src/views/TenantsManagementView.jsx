import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Crown,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  LayoutList,
  LayoutGrid,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  Calendar,
  X,
  LogIn
} from 'lucide-react';
import {
  Get_All_Tenants,
  Get_Subscription_Plans,
  Create_Tenant,
  Update_Tenant,
  Toggle_Tenant_Status,
  Extend_Tenant_Trial,
  Impersonate_Tenant
} from '../services/apiService';

const TenantsManagementView = ({ currentUser }) => {
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Active' | 'Trial' | 'Suspended'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    slug: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    password: 'password123',
    plan_id: 2,
    status: 'Trial',
    initial_branch_city: 'New Delhi'
  });
  const [isCreating, setIsCreating] = useState(false);

  const [editingTenant, setEditingTenant] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    plan_id: 1,
    status: 'Active'
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [tenantsRes, plansRes] = await Promise.all([
        Get_All_Tenants(),
        Get_Subscription_Plans()
      ]);
      if (tenantsRes.data?.data) {
        setTenants(tenantsRes.data.data);
      }
      if (plansRes.data?.data) {
        setPlans(plansRes.data.data);
      }
    } catch (err) {
      console.error('Error loading tenants:', err);
      showFeedback('error', err.data?.message || err.message || 'Failed to fetch salon organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await Create_Tenant(createForm);
      showFeedback('success', res.data?.message || `Salon "${createForm.name}" registered successfully!`);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        slug: '',
        owner_name: '',
        owner_email: '',
        owner_phone: '',
        password: 'password123',
        plan_id: 2,
        status: 'Trial',
        initial_branch_city: 'New Delhi'
      });
      await loadData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to register salon organization');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEdit = (tenant) => {
    setEditingTenant(tenant);
    setEditForm({
      name: tenant.name,
      owner_name: tenant.owner_name,
      owner_email: tenant.owner_email,
      owner_phone: tenant.owner_phone || '',
      plan_id: tenant.plan_id || 1,
      status: tenant.status || 'Active'
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;
    setIsUpdating(true);
    try {
      const res = await Update_Tenant(editingTenant.id, editForm);
      showFeedback('success', res.data?.message || 'Salon details updated!');
      setEditingTenant(null);
      await loadData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to update salon');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleStatus = async (tenantId) => {
    try {
      const res = await Toggle_Tenant_Status(tenantId);
      showFeedback('success', res.data?.message || 'Salon status updated');
      await loadData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to toggle status');
    }
  };

  const handleExtendTrial = async (tenantId, days = 14) => {
    try {
      const res = await Extend_Tenant_Trial(tenantId, days);
      showFeedback('success', res.data?.message || `Trial extended by ${days} days!`);
      await loadData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to extend trial');
    }
  };

  const handleImpersonate = async (tenantId) => {
    try {
      const res = await Impersonate_Tenant(tenantId);
      if (res.data?.data?.token) {
        // Save support mode token and reload
        localStorage.setItem('saloon_jwt_token', res.data.data.token);
        if (res.data?.data?.user) {
          localStorage.setItem('saloon_user_cache', JSON.stringify(res.data.data.user));
          localStorage.setItem('saloon_user', JSON.stringify(res.data.data.user));
        }
        localStorage.setItem('saloon_is_impersonating', 'true');
        localStorage.setItem('saloon_active_tab', 'dashboard');
        window.location.reload();
      }
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to switch into Support Mode');
    }
  };

  // Filtered tenants
  const filteredTenants = tenants.filter(t => {
    const s = searchTerm.toLowerCase();
    const matchSearch =
      (t.name || '').toLowerCase().includes(s) ||
      (t.slug || '').toLowerCase().includes(s) ||
      (t.owner_name || '').toLowerCase().includes(s) ||
      (t.owner_email || '').toLowerCase().includes(s) ||
      (t.owner_phone || '').toLowerCase().includes(s);

    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // KPI Calculations
  const totalSalons = tenants.length;
  const activeSalons = tenants.filter(t => t.status === 'Active').length;
  const trialSalons = tenants.filter(t => t.status === 'Trial').length;
  const suspendedSalons = tenants.filter(t => t.status === 'Suspended').length;
  const totalBranches = tenants.reduce((acc, t) => acc + (parseInt(t.branch_count) || 0), 0);
  const totalMRR = tenants
    .filter(t => t.status === 'Active')
    .reduce((acc, t) => acc + (parseFloat(t.price_monthly) || 0), 0);

  return (
    <div style={{ padding: '16px 20px', color: '#e2e8f0', minHeight: '100vh', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Banner Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', background: 'var(--active-bg)', border: '1px solid var(--border-gold)', color: 'var(--accent-gold)', fontSize: '0.70rem', fontWeight: '700', marginBottom: '6px' }}>
            <Building2 size={13} />
            SaaS Multi-Tenant Architecture
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crown style={{ color: 'var(--accent-gold)' }} size={22} />
            Salon Organizations & Tenants Registry
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.80rem', marginTop: '2px', marginBottom: 0 }}>
            Directory of all independent salon businesses, owner profiles, subscription status, and live outlet counts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          style={{
            background: 'var(--accent-gold)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 18px',
            fontWeight: '700',
            fontSize: '0.80rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px var(--accent-gold-glow)',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} /> Onboard New Salon Organization
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback.msg && (
        <div style={{
          background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
          border: `1px solid ${feedback.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
          color: feedback.type === 'error' ? '#f87171' : '#4ade80',
          padding: '10px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.82rem',
          fontWeight: '600'
        }}>
          {feedback.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {feedback.msg}
        </div>
      )}

      {/* Top 5 KPI Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '0.70rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TOTAL SALONS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff', marginTop: '4px' }}>{totalSalons}</div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>Registered SaaS Organizations</div>
        </div>

        <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '0.70rem', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ACTIVE VS SUSPENDED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#4ade80', marginTop: '4px' }}>
            {activeSalons} <span style={{ fontSize: '0.88rem', color: suspendedSalons > 0 ? '#f87171' : '#64748b', fontWeight: '600' }}>/ {suspendedSalons} Suspended</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>Active paying vs inactive</div>
        </div>

        <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '0.70rem', color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.04em' }}>IN FREE TRIAL</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#facc15', marginTop: '4px' }}>{trialSalons}</div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>14-day evaluation accounts</div>
        </div>

        <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid var(--border-gold)', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '0.70rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>MONTHLY REVENUE (MRR)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--accent-gold)', marginTop: '4px' }}>
            ₹{totalMRR.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>Active recurring subscription run-rate</div>
        </div>

        <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '0.70rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>OUTLETS MANAGED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#38bdf8', marginTop: '4px' }}>{totalBranches}</div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>Total branches across tenants</div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '10px 14px',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '8px',
          padding: '6px 12px',
          width: '300px'
        }}>
          <Search size={15} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search salon by name, email, owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '0.78rem',
              width: '100%'
            }}
          />
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'ALL', label: 'All Salons' },
            { id: 'Active', label: 'Active' },
            { id: 'Trial', label: 'In Trial' },
            { id: 'Suspended', label: 'Suspended' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              style={{
                background: statusFilter === f.id ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.06)',
                color: statusFilter === f.id ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.74rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: statusFilter === f.id ? '0 1px 6px var(--accent-gold-glow)' : 'none'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* View Switcher: Table / Cards */}
        <div style={{
          display: 'inline-flex',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '6px',
          padding: '2px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{
              background: viewMode === 'table' ? 'var(--accent-gold)' : 'transparent',
              color: viewMode === 'table' ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: '4px',
              height: '24px',
              padding: '0 8px',
              fontSize: '0.72rem',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: viewMode === 'table' ? '0 1px 6px var(--accent-gold-glow)' : 'none'
            }}
          >
            <LayoutList size={12} /> Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            style={{
              background: viewMode === 'cards' ? 'var(--accent-gold)' : 'transparent',
              color: viewMode === 'cards' ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: '4px',
              height: '24px',
              padding: '0 8px',
              fontSize: '0.72rem',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: viewMode === 'cards' ? '0 1px 6px var(--accent-gold-glow)' : 'none'
            }}
          >
            <LayoutGrid size={12} /> Cards
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredTenants.length === 0 ? (
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center'
        }}>
          <Building2 size={36} style={{ color: '#475569', marginBottom: '10px' }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#cbd5e1', margin: 0 }}>No Salon Organizations Found</h3>
          <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '4px auto 14px', maxWidth: '360px' }}>
            {searchTerm ? 'No salon matches your search query.' : 'Click below to register and onboard your first salon tenant.'}
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'var(--accent-gold)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '0.76rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 8px var(--accent-gold-glow)'
            }}
          >
            + Onboard Salon
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '8px 12px', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Salon Organization</th>
                  <th style={{ padding: '8px 12px', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Owner Contact</th>
                  <th style={{ padding: '8px 12px', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Subscribed Tier</th>
                  <th style={{ padding: '8px 12px', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Outlets & Team</th>
                  <th style={{ padding: '8px 12px', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Status & Validity</th>
                  <th style={{ padding: '8px 12px', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map(tenant => {
                  const isSuspended = tenant.status === 'Suspended';
                  const isTrial = tenant.status === 'Trial';
                  const planCode = tenant.plan_code || 'STARTER';

                  return (
                    <tr
                      key={tenant.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Col 1: Salon Name & Slug */}
                      <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.80rem' }}>
                          {tenant.name}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '1px' }}>
                          ID: #{tenant.id} • {tenant.slug}
                        </div>
                      </td>

                      {/* Col 2: Owner Contact */}
                      <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '0.76rem' }}>
                          {tenant.owner_name}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span>{tenant.owner_email}</span>
                          {tenant.owner_phone && <span>• {tenant.owner_phone}</span>}
                        </div>
                      </td>

                      {/* Col 3: Plan */}
                      <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: planCode === 'ENTERPRISE' ? 'var(--active-bg)' : planCode === 'GROWTH' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                          color: planCode === 'ENTERPRISE' ? 'var(--accent-gold)' : planCode === 'GROWTH' ? '#38bdf8' : '#cbd5e1',
                          border: `1px solid ${planCode === 'ENTERPRISE' ? 'var(--border-gold)' : planCode === 'GROWTH' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.15)'}`
                        }}>
                          👑 {tenant.plan_name || 'Starter'} (₹{Number(tenant.price_monthly || 999).toLocaleString()}/mo)
                        </span>
                      </td>

                      {/* Col 4: Branches & Staff */}
                      <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '0.74rem', color: '#ffffff', fontWeight: '600' }}>
                          🏢 {tenant.branch_count} Branches
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '1px' }}>
                          👥 {tenant.staff_count} Staff • 🛒 {tenant.customer_count || 0} Clients
                        </div>
                      </td>

                      {/* Col 5: Status */}
                      <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: isSuspended ? 'rgba(239, 68, 68, 0.15)' : isTrial ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                          color: isSuspended ? '#f87171' : isTrial ? '#facc15' : '#4ade80',
                          border: `1px solid ${isSuspended ? 'rgba(239, 68, 68, 0.3)' : isTrial ? 'rgba(234, 179, 8, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          ● {tenant.status}
                        </span>
                        {tenant.days_remaining !== null && (
                          <div style={{ fontSize: '0.64rem', color: '#94a3b8', marginTop: '2px' }}>
                            {tenant.days_remaining > 365 ? 'Lifetime Access' : `${tenant.days_remaining} Days Left`}
                          </div>
                        )}
                      </td>

                      {/* Col 6: Actions */}
                      <td style={{ padding: '8px 12px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                          {/* Impersonate Button */}
                          <button
                            type="button"
                            onClick={() => handleImpersonate(tenant.id)}
                            title="Support Impersonation: Login as this Salon"
                            style={{
                              background: 'var(--active-bg)',
                              border: '1px solid var(--border-gold)',
                              color: 'var(--accent-gold)',
                              borderRadius: '4px',
                              height: '24px',
                              padding: '0 6px',
                              fontSize: '0.66rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <LogIn size={11} /> Support Login
                          </button>

                          {/* Extend Trial */}
                          {isTrial && (
                            <button
                              type="button"
                              onClick={() => handleExtendTrial(tenant.id, 14)}
                              title="Extend Trial by 14 Days"
                              style={{
                                background: 'rgba(234, 179, 8, 0.15)',
                                border: '1px solid rgba(234, 179, 8, 0.35)',
                                color: '#facc15',
                                borderRadius: '4px',
                                height: '24px',
                                padding: '0 6px',
                                fontSize: '0.66rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              +14d Trial
                            </button>
                          )}

                          {/* Suspend / Reactivate */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(tenant.id)}
                            title={isSuspended ? 'Reactivate Salon Account' : 'Suspend Salon Account'}
                            style={{
                              background: isSuspended ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                              border: `1px solid ${isSuspended ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.3)'}`,
                              color: isSuspended ? '#4ade80' : '#f87171',
                              borderRadius: '4px',
                              height: '24px',
                              padding: '0 6px',
                              fontSize: '0.66rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            {isSuspended ? 'Activate' : 'Suspend'}
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(tenant)}
                            title="Edit Salon Profile"
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#cbd5e1',
                              borderRadius: '4px',
                              height: '24px',
                              padding: '0 6px',
                              fontSize: '0.66rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '14px'
        }}>
          {filteredTenants.map(tenant => {
            const isSuspended = tenant.status === 'Suspended';
            const isTrial = tenant.status === 'Trial';

            return (
              <div
                key={tenant.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.75)',
                  border: isSuspended ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                        {tenant.name}
                      </h3>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        ID #{tenant.id} • {tenant.slug}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.66rem',
                      fontWeight: '800',
                      padding: '2px 7px',
                      borderRadius: '12px',
                      background: isSuspended ? 'rgba(239, 68, 68, 0.15)' : isTrial ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                      color: isSuspended ? '#f87171' : isTrial ? '#facc15' : '#4ade80',
                      border: `1px solid ${isSuspended ? 'rgba(239, 68, 68, 0.3)' : isTrial ? 'rgba(234, 179, 8, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
                    }}>
                      ● {tenant.status}
                    </span>
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', padding: '10px', margin: '10px 0', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '0.74rem', color: '#cbd5e1', fontWeight: '600' }}>
                      👤 {tenant.owner_name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                      ✉️ {tenant.owner_email}
                    </div>
                    {tenant.owner_phone && (
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                        📞 {tenant.owner_phone}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', margin: '6px 0 14px' }}>
                    <span>👑 {tenant.plan_name || 'Starter'} Tier</span>
                    <span>🏢 {tenant.branch_count} Branches • {tenant.staff_count} Staff</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleImpersonate(tenant.id)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '6px',
                      background: 'var(--active-bg)',
                      border: '1px solid var(--border-gold)',
                      color: 'var(--accent-gold)',
                      fontSize: '0.70rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <LogIn size={12} /> Support Login
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(tenant)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#cbd5e1',
                      fontSize: '0.70rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(tenant.id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: isSuspended ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${isSuspended ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      color: isSuspended ? '#4ade80' : '#f87171',
                      fontSize: '0.70rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {isSuspended ? 'Activate' : 'Suspend'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: REGISTER NEW SALON ORGANIZATION */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid var(--border-gold)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} style={{ color: 'var(--accent-gold)' }} />
                Onboard New Salon Organization
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '16px', lineHeight: '1.4' }}>
              This automatically establishes the isolated tenant boundary, creates their primary outlet, registers the owner admin, and seeds default service categories.
            </p>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Salon Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Looks Unisex Studio"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.80rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Primary City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai / Delhi"
                    value={createForm.initial_branch_city}
                    onChange={(e) => setCreateForm({ ...createForm, initial_branch_city: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.80rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>URL Slug / Subdomain (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. looks-mumbai"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.80rem', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '6px 0', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--accent-gold)', marginBottom: '8px' }}>
                  Salon Owner Administrator Credentials:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Owner Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={createForm.owner_name}
                      onChange={(e) => setCreateForm({ ...createForm, owner_name: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.80rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Owner Mobile Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={createForm.owner_phone}
                      onChange={(e) => setCreateForm({ ...createForm, owner_phone: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.80rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Owner Login Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="rajesh@looks.com"
                      value={createForm.owner_email}
                      onChange={(e) => setCreateForm({ ...createForm, owner_email: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.80rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Initial Password *</label>
                    <input
                      type="text"
                      required
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.80rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Subscription Tier</label>
                  <select
                    value={createForm.plan_id}
                    onChange={(e) => setCreateForm({ ...createForm, plan_id: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.80rem' }}
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>👑 {p.name} (₹{Number(p.price_monthly).toLocaleString()}/mo)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Initial Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.80rem' }}
                  >
                    <option value="Trial">14-Day Free Trial</option>
                    <option value="Active">Active (Subscribed)</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    fontSize: '0.80rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--accent-gold)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '0.80rem',
                    cursor: isCreating ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 10px var(--accent-gold-glow)'
                  }}
                >
                  {isCreating ? 'Provisioning Tenant...' : 'Deploy Salon Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT SALON ORGANIZATION */}
      {editingTenant && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid var(--border-gold)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} style={{ color: 'var(--accent-gold)' }} />
                Edit Salon Organization (#{editingTenant.id})
              </h3>
              <button onClick={() => setEditingTenant(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Salon Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.80rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Owner Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.owner_name}
                    onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.80rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Owner Phone</label>
                  <input
                    type="text"
                    value={editForm.owner_phone}
                    onChange={(e) => setEditForm({ ...editForm, owner_phone: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.80rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Owner Email</label>
                <input
                  type="email"
                  required
                  value={editForm.owner_email}
                  onChange={(e) => setEditForm({ ...editForm, owner_email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.80rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Subscription Tier</label>
                  <select
                    value={editForm.plan_id}
                    onChange={(e) => setEditForm({ ...editForm, plan_id: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.80rem' }}
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>👑 {p.name} (₹{Number(p.price_monthly).toLocaleString()}/mo)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.80rem' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    fontSize: '0.80rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--accent-gold)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '0.80rem',
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 10px var(--accent-gold-glow)'
                  }}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantsManagementView;

