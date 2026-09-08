import React, { useState, useRef } from 'react';
import { Check, X, ShieldCheck, Save, RotateCcw, Loader2, Lightbulb, MousePointerClick } from 'lucide-react';
import { Admin_Update_Role_Permissions } from '../services/apiService';

// ─── Permission Definitions ───
const ALL_PERMISSIONS = [
  // System
  { key: 'all',                        label: 'Full System Control',       emoji: '🔐', desc: 'Poora system control — kuch bhi kar sakta hai', category: 'System' },
  { key: 'manage_users',               label: 'Staff & User Management',   emoji: '👥', desc: 'Nayi staff add, edit aur delete kar sakta hai', category: 'System' },
  { key: 'manage_branches',            label: 'Branch Management',         emoji: '🏢', desc: 'Nayi branches add aur manage kar sakta hai', category: 'System' },
  { key: 'manage_branch_users',        label: 'Branch Staff Control',      emoji: '👤', desc: 'Sirf apni branch ki staff manage kar sakta hai', category: 'System' },
  // Finance
  { key: 'manage_finances',            label: 'Revenue & Reports',         emoji: '💰', desc: 'Income reports aur financial data dekh sakta hai', category: 'Finance' },
  { key: 'manage_billing',             label: 'Billing & Checkout',        emoji: '🧾', desc: 'Bill generate aur payment accept kar sakta hai', category: 'Finance' },
  { key: 'view_reports',               label: 'Branch Reports',            emoji: '📊', desc: 'Branch ki performance report dekh sakta hai', category: 'Finance' },
  // Operations
  { key: 'manage_services',            label: 'Services & Pricing',        emoji: '✂️', desc: 'Services ka naam aur price set kar sakta hai', category: 'Operations' },
  { key: 'manage_appointments',        label: 'Booking & Calendar',        emoji: '📅', desc: 'Appointments book, reschedule ya cancel kar sakta hai', category: 'Operations' },
  { key: 'manage_inventory',           label: 'Stock & Inventory',         emoji: '📦', desc: 'Salon ka product stock track kar sakta hai', category: 'Operations' },
  // CRM
  { key: 'view_customers',             label: 'Customer Directory (CRM)',  emoji: '📋', desc: 'Sabhi customers ki profile aur contact dekh sakta hai', category: 'CRM' },
  // Restricted
  { key: 'view_assigned_appointments', label: 'Own Schedule Only',         emoji: '🗓️', desc: 'Sirf apne assigned appointments dekh sakta hai', category: 'Restricted' },
  // Customer
  { key: 'book_appointments',          label: 'Book Appointment',          emoji: '📱', desc: 'Customer khud appointment book kar sakta hai', category: 'Customer' },
  { key: 'view_history',               label: 'View Visit History',        emoji: '🕐', desc: 'Customer apni purani visits dekh sakta hai', category: 'Customer' },
];

const CATEGORIES = ['System', 'Finance', 'Operations', 'CRM', 'Restricted', 'Customer'];

const CATEGORY_COLORS = {
  System:     { bg: 'rgba(99,102,241,0.14)',  text: '#818cf8', border: 'rgba(99,102,241,0.3)' },
  Finance:    { bg: 'rgba(0,230,118,0.12)',   text: '#00e676', border: 'rgba(0,230,118,0.3)' },
  Operations: { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  Restricted: { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  CRM:        { bg: 'rgba(236,72,153,0.12)',  text: '#ec4899', border: 'rgba(236,72,153,0.3)' },
  Customer:   { bg: 'rgba(14,165,233,0.12)',  text: '#38bdf8', border: 'rgba(14,165,233,0.3)' },
};

const ROLE_TAG_LABELS = {
  Admin: 'admin',
  Manager: 'manager',
  Receptionist: 'receptionist',
  Staff: 'staff',
  Customer: 'customer',
};

function PermissionsMatrixView({ roles, onUpdateRoles }) {
  // ── CRITICAL: Use a ref to hold permissions map to avoid stale closure ──
  // permMap: { [roleId]: string[] }
  const [permMap, setPermMap] = useState(() => {
    const map = {};
    roles.forEach(r => {
      map[r.id] = Array.isArray(r.permissions) ? [...r.permissions] : [];
    });
    return map;
  });

  // Track which roles have unsaved changes
  const [dirtyMap, setDirtyMap] = useState({}); // { roleId: true/false }
  const [saving, setSaving]     = useState({}); // { roleId: true/false }
  const [savedFlash, setSavedFlash] = useState({}); // { roleId: true/false }

  const originalPermsRef = useRef({});
  React.useEffect(() => {
    const map = {};
    roles.forEach(r => {
      map[r.id] = Array.isArray(r.permissions) ? [...r.permissions] : [];
    });
    originalPermsRef.current = map;
    // Only initialize if not already set (avoid overwriting user changes)
    setPermMap(prev => {
      const hasAny = Object.keys(prev).length > 0;
      if (hasAny) return prev; // Don't overwrite user's in-progress edits
      return map;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPerm = (roleId, permKey) => {
    const perms = permMap[roleId] || [];
    return perms.includes('all') || perms.includes(permKey);
  };

  const togglePerm = (e, roleId, permKey) => {
    e.stopPropagation();
    e.preventDefault();

    // Admin's "all" permission is locked — cannot be removed
    const role = roles.find(r => r.id === roleId);
    if (role?.name === 'Admin' && permKey === 'all') return;

    setPermMap(prev => {
      const currentPerms = [...(prev[roleId] || [])];
      let newPerms;
      if (currentPerms.includes(permKey)) {
        newPerms = currentPerms.filter(p => p !== permKey);
      } else {
        newPerms = [...currentPerms, permKey];
      }
      return { ...prev, [roleId]: newPerms };
    });

    // Mark as dirty
    setDirtyMap(prev => ({ ...prev, [roleId]: true }));
  };

  const resetRole = (e, roleId) => {
    e.stopPropagation();
    const original = originalPermsRef.current[roleId] || [];
    setPermMap(prev => ({ ...prev, [roleId]: [...original] }));
    setDirtyMap(prev => ({ ...prev, [roleId]: false }));
  };

  const saveRole = async (e, role) => {
    e.stopPropagation();
    const newPerms = permMap[role.id] || [];
    setSaving(prev => ({ ...prev, [role.id]: true }));

    try {
      const res = await Admin_Update_Role_Permissions(role.id, newPerms).catch(() => null);
      if (res?.data?.data && onUpdateRoles) {
        onUpdateRoles(res.data.data);
      }
      // Update original ref so future resets go to new saved state
      originalPermsRef.current[role.id] = [...newPerms];
      setDirtyMap(prev => ({ ...prev, [role.id]: false }));
      setSavedFlash(prev => ({ ...prev, [role.id]: true }));
      setTimeout(() => setSavedFlash(prev => ({ ...prev, [role.id]: false })), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(prev => ({ ...prev, [role.id]: false }));
    }
  };

  return (
    <div>
      {/* ─── User-Friendly How-To Banner ─── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,230,118,0.1) 0%, rgba(99,102,241,0.08) 100%)',
        border: '1.5px solid rgba(0,230,118,0.25)',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start',
      }}>
        <div style={{ fontSize: '1.6rem', flexShrink: 0 }}>💡</div>
        <div>
          <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '6px' }}>
            Permissions kaise set karein?
          </div>
          <div style={{ fontSize: '0.83rem', color: 'var(--text-sub)', lineHeight: '1.7' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0,230,118,0.15)', padding: '1px 8px', borderRadius: '6px', color: 'var(--success)', fontWeight: '700', marginRight: '6px' }}>
              ✓ Green
            </span>
            matlab <strong>Permission Hai</strong> &nbsp;•&nbsp;
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239,68,68,0.12)', padding: '1px 8px', borderRadius: '6px', color: '#ef4444', fontWeight: '700', marginRight: '6px', marginLeft: '6px' }}>
              ✗ Red
            </span>
            matlab <strong>Permission Nahi Hai</strong>
            <br />
            👆 <strong>Kisi bhi cell par click karo</strong> — permission on ya off ho jayegi.
            Phir upar us role ke <strong style={{ color: 'var(--success)' }}>💾 Save</strong> button dabao — database mein save ho jayega.
          </div>
        </div>
      </div>

      {/* ─── Main Matrix Table ─── */}
      <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: '800px', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ minWidth: '260px', paddingLeft: '20px', textAlign: 'left' }}>
                🔑 Permission / Adhikar
              </th>
              {roles.map(role => {
                const isDirty = !!dirtyMap[role.id];
                const isSaving = !!saving[role.id];
                const isSavedFlash = !!savedFlash[role.id];

                return (
                  <th key={role.id} style={{ textAlign: 'center', minWidth: '140px', verticalAlign: 'bottom', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span className={`role-tag ${ROLE_TAG_LABELS[role.name] || 'staff'}`}>
                        {role.name}
                      </span>

                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        {/* Save Button */}
                        <button
                          onClick={(e) => saveRole(e, { ...role, permissions: permMap[role.id] || [] })}
                          disabled={!isDirty || isSaving}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '5px 12px', borderRadius: '8px',
                            fontSize: '0.72rem', fontWeight: '800',
                            border: 'none', cursor: isDirty ? 'pointer' : 'default',
                            transition: 'all 0.22s',
                            background: isSavedFlash
                              ? 'rgba(0,230,118,0.2)'
                              : isDirty
                                ? 'var(--success)'
                                : 'rgba(255,255,255,0.06)',
                            color: isSavedFlash
                              ? '#00e676'
                              : isDirty ? '#000' : 'var(--text-muted)',
                            boxShadow: isDirty ? '0 2px 12px rgba(0,230,118,0.35)' : 'none',
                          }}
                        >
                          {isSaving ? (
                            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : isSavedFlash ? (
                            <Check size={12} />
                          ) : (
                            <Save size={12} />
                          )}
                          {isSavedFlash ? 'Saved!' : isSaving ? '...' : '💾 Save'}
                        </button>

                        {/* Reset Button */}
                        <button
                          onClick={(e) => resetRole(e, role.id)}
                          disabled={!isDirty}
                          title="Reset — undo changes"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: '7px',
                            border: '1.5px solid var(--border)',
                            background: 'transparent', cursor: isDirty ? 'pointer' : 'default',
                            color: isDirty ? '#ef4444' : 'var(--text-muted)',
                            transition: 'all 0.18s',
                          }}
                        >
                          <RotateCcw size={12} />
                        </button>
                      </div>

                      {/* Unsaved changes indicator */}
                      {isDirty && (
                        <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: '700', background: 'rgba(251,191,36,0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                          ⚠ Unsaved
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {CATEGORIES.map(category => {
              const permsInCat = ALL_PERMISSIONS.filter(p => p.category === category);
              if (permsInCat.length === 0) return null;
              const catColor = CATEGORY_COLORS[category];

              return (
                <React.Fragment key={category}>
                  {/* Category Divider Row */}
                  <tr key={`cat-${category}`}>
                    <td
                      colSpan={roles.length + 1}
                      style={{
                        padding: '6px 20px',
                        fontSize: '0.68rem',
                        fontWeight: '900',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        background: catColor.bg,
                        color: catColor.text,
                        borderTop: `1px solid ${catColor.border}`,
                        borderBottom: `1px solid ${catColor.border}`,
                        userSelect: 'none',
                      }}
                    >
                      {category === 'System' && '⚙️ System'}
                      {category === 'Finance' && '💰 Finance'}
                      {category === 'Operations' && '🔧 Operations'}
                      {category === 'CRM' && '👤 CRM'}
                      {category === 'Restricted' && '🔒 Restricted'}
                      {category === 'Customer' && '🛍️ Customer'}
                    </td>
                  </tr>

                  {/* Permission Rows */}
                  {permsInCat.map(perm => (
                    <tr key={`perm-${perm.key}`}>
                      {/* Permission Label */}
                      <td style={{ paddingLeft: '20px', paddingTop: '10px', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: 'var(--text-main)', fontSize: '0.88rem' }}>
                          <span style={{ fontSize: '1rem' }}>{perm.emoji}</span>
                          {perm.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', marginLeft: '28px' }}>
                          {perm.desc}
                        </div>
                      </td>

                      {/* Toggle Cells per Role */}
                      {roles.map(role => {
                        const granted = hasPerm(role.id, perm.key);
                        const isLocked = role.name === 'Admin' && perm.key === 'all';

                        return (
                          <td key={`cell-${perm.key}-${role.id}`} style={{ textAlign: 'center', padding: '8px' }}>
                            <button
                              type="button"
                              onClick={(e) => togglePerm(e, role.id, perm.key)}
                              disabled={isLocked}
                              title={
                                isLocked
                                  ? 'Admin ka Full Control lock hai — hata nahi sakte'
                                  : granted
                                    ? 'Click karein — permission hatao'
                                    : 'Click karein — permission do'
                              }
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                border: 'none',
                                outline: 'none',
                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                background: granted
                                  ? 'rgba(0, 230, 118, 0.18)'
                                  : 'rgba(239, 68, 68, 0.1)',
                                color: granted ? '#00e676' : '#ef4444',
                                boxShadow: granted
                                  ? '0 0 0 1.5px rgba(0,230,118,0.4)'
                                  : '0 0 0 1px rgba(239,68,68,0.25)',
                                transition: 'transform 0.12s ease, background 0.18s ease',
                                fontSize: '1rem',
                                opacity: isLocked ? 0.7 : 1,
                              }}
                              onMouseEnter={e => {
                                if (!isLocked) e.currentTarget.style.transform = 'scale(1.2)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              {granted
                                ? <Check size={16} strokeWidth={3} />
                                : <X size={16} strokeWidth={3} />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PermissionsMatrixView;
