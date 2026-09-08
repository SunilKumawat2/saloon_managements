import React, { useState, useCallback } from 'react';
import { Check, X, ShieldCheck, Save, RotateCcw, Info, Loader2 } from 'lucide-react';
import { Admin_Update_Role_Permissions } from '../services/apiService';

// All permission definitions with descriptions
const ALL_PERMISSIONS = [
  { key: 'all',                        label: 'Full Admin System Control',          desc: 'Complete unrestricted access to the entire system', category: 'System' },
  { key: 'manage_users',               label: 'Create & Manage System Users',        desc: 'Add, edit, delete users and assign roles', category: 'System' },
  { key: 'manage_branches',            label: 'Create & Manage Branches',            desc: 'Add and configure salon branches', category: 'System' },
  { key: 'manage_finances',            label: 'View Financial & Revenue Reports',    desc: 'Access income statements and revenue dashboards', category: 'Finance' },
  { key: 'manage_services',            label: 'Manage Services & Pricing Catalog',   desc: 'Add, edit, delete salon services and prices', category: 'Operations' },
  { key: 'manage_appointments',        label: 'Create & Manage Bookings',            desc: 'Book, reschedule, and cancel appointments', category: 'Operations' },
  { key: 'manage_billing',             label: 'Generate Bills & Process Checkout',   desc: 'Create invoices and accept payments', category: 'Finance' },
  { key: 'manage_inventory',           label: 'Stock & Inventory Management',        desc: 'Track and manage salon product inventory', category: 'Operations' },
  { key: 'view_assigned_appointments', label: 'View Own Assigned Schedule',          desc: 'View only personally assigned appointments', category: 'Restricted' },
  { key: 'view_customers',             label: 'View Customer Profiles (CRM)',        desc: 'Access customer database and contact details', category: 'CRM' },
  { key: 'manage_branch_users',        label: 'Manage Branch-Level Staff',           desc: 'Add and manage staff within own branch', category: 'System' },
  { key: 'view_reports',               label: 'View Branch Reports',                 desc: 'Access branch-level operational reports', category: 'Finance' },
  { key: 'book_appointments',          label: 'Self Book Appointments (Customer)',   desc: 'Customers can book their own appointments', category: 'Customer' },
  { key: 'view_history',               label: 'View Own Visit History',              desc: 'Customers can view their own service history', category: 'Customer' },
];

const CATEGORY_COLORS = {
  System:     { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8' },
  Finance:    { bg: 'rgba(0,230,118,0.12)',   text: '#00e676' },
  Operations: { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24' },
  Restricted: { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444' },
  CRM:        { bg: 'rgba(236,72,153,0.12)',  text: '#ec4899' },
  Customer:   { bg: 'rgba(14,165,233,0.12)',  text: '#38bdf8' },
};

function PermissionsMatrixView({ roles, onUpdateRoles }) {
  // localRoles is the editable in-memory state; initially mirrors props
  const [localRoles, setLocalRoles] = useState(() =>
    roles.map(r => ({
      ...r,
      permissions: Array.isArray(r.permissions) ? [...r.permissions] : []
    }))
  );
  const [saving, setSaving] = useState({}); // { roleId: bool }
  const [saved, setSaved]   = useState({}); // { roleId: bool } — green flash
  const [tooltip, setTooltip] = useState(null); // { permKey, roleId }

  // Sync local state when parent refreshes roles (e.g. after full re-fetch)
  const rolesKey = roles.map(r => r.id + r.permissions?.join('')).join('|');
  React.useEffect(() => {
    setLocalRoles(roles.map(r => ({
      ...r,
      permissions: Array.isArray(r.permissions) ? [...r.permissions] : []
    })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolesKey]);

  const hasPerm = (perms, key) => {
    if (!Array.isArray(perms)) return false;
    return perms.includes('all') || perms.includes(key);
  };

  const togglePerm = useCallback((roleId, permKey) => {
    setLocalRoles(prev => prev.map(r => {
      if (r.id !== roleId) return r;
      let perms = [...r.permissions];
      // Can't remove 'all' from Admin directly — must be explicit
      if (perms.includes(permKey)) {
        perms = perms.filter(p => p !== permKey);
      } else {
        perms = [...perms, permKey];
      }
      return { ...r, permissions: perms };
    }));
  }, []);

  const saveRole = async (role) => {
    setSaving(prev => ({ ...prev, [role.id]: true }));
    try {
      const res = await Admin_Update_Role_Permissions(role.id, role.permissions).catch(() => null);
      if (res?.data?.data) {
        // Update parent state
        if (onUpdateRoles) onUpdateRoles(res.data.data);
      }
      setSaved(prev => ({ ...prev, [role.id]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [role.id]: false })), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(prev => ({ ...prev, [role.id]: false }));
    }
  };

  const resetRole = (roleId) => {
    const original = roles.find(r => r.id === roleId);
    if (original) {
      setLocalRoles(prev => prev.map(r =>
        r.id === roleId
          ? { ...r, permissions: Array.isArray(original.permissions) ? [...original.permissions] : [] }
          : r
      ));
    }
  };

  const isDirty = (roleId) => {
    const original = roles.find(r => r.id === roleId);
    const local = localRoles.find(r => r.id === roleId);
    if (!original || !local) return false;
    const origPerms = (Array.isArray(original.permissions) ? original.permissions : []).slice().sort().join(',');
    const localPerms = (Array.isArray(local.permissions) ? local.permissions : []).slice().sort().join(',');
    return origPerms !== localPerms;
  };

  // Group permissions by category
  const permsByCategory = ALL_PERMISSIONS.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div>
      {/* ─── Header ─── */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--success)' }} />
              Role-Based Access Control (RBAC) Matrix
            </h3>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.82rem', marginTop: '4px' }}>
              Click any cell to grant or revoke a permission. Changes are highlighted — press <strong>Save</strong> per role to apply.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(CATEGORY_COLORS).map(([cat, clr]) => (
              <span key={cat} style={{ fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '9px', background: clr.bg, color: clr.text }}>{cat}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Permission Matrix Table ─── */}
      <div className="glass-panel" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: '780px' }}>
          <thead>
            <tr>
              <th style={{ minWidth: '260px' }}>Permission Scope</th>
              {localRoles.map(role => (
                <th key={role.id} style={{ textAlign: 'center', minWidth: '130px', verticalAlign: 'bottom', paddingBottom: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span className={`role-tag ${role.name.toLowerCase()}`}>{role.name}</span>

                    {/* Save & Reset per-role actions */}
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => saveRole(role)}
                        disabled={!isDirty(role.id) || saving[role.id]}
                        title="Save changes for this role"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '4px 10px', borderRadius: '7px', fontSize: '0.7rem',
                          fontWeight: '700', cursor: isDirty(role.id) ? 'pointer' : 'not-allowed',
                          border: 'none',
                          background: saved[role.id]
                            ? 'rgba(0,230,118,0.25)'
                            : isDirty(role.id)
                              ? 'var(--success)'
                              : 'rgba(255,255,255,0.06)',
                          color: saved[role.id]
                            ? '#00e676'
                            : isDirty(role.id) ? '#000' : 'var(--text-muted)',
                          transition: 'all 0.2s',
                          opacity: saving[role.id] ? 0.6 : 1,
                        }}
                      >
                        {saving[role.id]
                          ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                          : saved[role.id] ? <Check size={11} /> : <Save size={11} />}
                        {saved[role.id] ? 'Saved!' : 'Save'}
                      </button>

                      <button
                        onClick={() => resetRole(role.id)}
                        disabled={!isDirty(role.id)}
                        title="Reset to last saved state"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '4px 8px', borderRadius: '7px', fontSize: '0.7rem',
                          fontWeight: '700', cursor: isDirty(role.id) ? 'pointer' : 'not-allowed',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: isDirty(role.id) ? '#ef4444' : 'var(--text-muted)',
                          transition: 'all 0.2s',
                        }}
                      >
                        <RotateCcw size={11} />
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Object.entries(permsByCategory).map(([category, perms]) => (
              <React.Fragment key={category}>
                {/* Category Header Row */}
                <tr>
                  <td
                    colSpan={localRoles.length + 1}
                    style={{
                      padding: '6px 16px',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      background: CATEGORY_COLORS[category]?.bg || 'rgba(255,255,255,0.03)',
                      color: CATEGORY_COLORS[category]?.text || 'var(--text-muted)',
                    }}
                  >
                    {category}
                  </td>
                </tr>

                {perms.map(perm => (
                  <tr key={perm.key} style={{ transition: 'background 0.15s' }}>
                    {/* Permission label + info tooltip */}
                    <td style={{ fontWeight: '600', color: 'var(--text-main)', paddingLeft: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{perm.label}</span>
                        <span
                          style={{ cursor: 'help', color: 'var(--text-muted)', flexShrink: 0 }}
                          title={perm.desc}
                        >
                          <Info size={12} />
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '400' }}>
                        {perm.desc}
                      </div>
                    </td>

                    {/* Toggle cells for each role */}
                    {localRoles.map(role => {
                      const granted = hasPerm(role.permissions, perm.key);
                      const isProtected = role.name === 'Admin' && perm.key === 'all'; // protect admin "all"

                      return (
                        <td key={role.id} style={{ textAlign: 'center', padding: '10px 8px' }}>
                          <button
                            onClick={() => !isProtected && togglePerm(role.id, perm.key)}
                            disabled={isProtected}
                            title={isProtected ? 'Admin always has full access' : (granted ? 'Click to revoke this permission' : 'Click to grant this permission')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: isProtected ? 'not-allowed' : 'pointer',
                              transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
                              transform: 'scale(1)',
                              background: granted
                                ? 'rgba(0, 230, 118, 0.18)'
                                : 'rgba(239, 68, 68, 0.08)',
                              color: granted ? 'var(--success)' : '#ef4444',
                              boxShadow: granted ? '0 0 0 1.5px rgba(0,230,118,0.3)' : '0 0 0 1px rgba(239,68,68,0.2)',
                            }}
                            onMouseEnter={e => {
                              if (!isProtected) e.currentTarget.style.transform = 'scale(1.18)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            {granted
                              ? <Check size={15} strokeWidth={2.5} />
                              : <X size={15} strokeWidth={2.5} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── Help footer ─── */}
      <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)', fontSize: '0.78rem', color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Info size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
        <span>
          <strong>How to use:</strong> Click any green ✓ or red ✗ cell to toggle a permission. Changes are highlighted. Click <strong>Save</strong> button on each role column header to persist changes to the database.
        </span>
      </div>
    </div>
  );
}

export default PermissionsMatrixView;
