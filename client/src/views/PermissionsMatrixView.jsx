import React from 'react';
import { ShieldCheck, Check, X } from 'lucide-react';

function PermissionsMatrixView({ roles }) {
  const allPermissions = [
    { key: 'all', label: 'Full Admin System Control' },
    { key: 'manage_users', label: 'Create & Manage System Users' },
    { key: 'manage_branches', label: 'Create & Manage Branches' },
    { key: 'manage_finances', label: 'View Financial & Revenue Reports' },
    { key: 'manage_services', label: 'Manage Services & Pricing Catalog' },
    { key: 'manage_appointments', label: 'Create & Manage Bookings' },
    { key: 'manage_billing', label: 'Generate Bills & Process Checkout' },
    { key: 'manage_inventory', label: 'Stock & Inventory Management' },
    { key: 'view_assigned_appointments', label: 'View Own Assigned Schedule' },
  ];

  const hasPerm = (rolePerms, permKey) => {
    if (!rolePerms) return false;
    return rolePerms.includes('all') || rolePerms.includes(permKey);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Role-Based Access Control (RBAC) Matrix</h3>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginTop: '4px' }}>
          Configured permission boundaries for Admin, Manager, Receptionist, Staff, and Client roles.
        </p>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Permission Scope</th>
            {roles.map(r => (
              <th key={r.id} style={{ textAlign: 'center' }}>
                <span className={`role-tag ${r.name.toLowerCase()}`}>{r.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allPermissions.map(p => (
            <tr key={p.key}>
              <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{p.label}</td>
              {roles.map(r => {
                const granted = hasPerm(r.permissions, p.key);
                return (
                  <td key={r.id} style={{ textAlign: 'center' }}>
                    {granted ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
                        <Check size={14} />
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--text-muted)' }}>
                        <X size={14} />
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PermissionsMatrixView;
