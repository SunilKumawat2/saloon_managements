import React, { useState } from 'react';
import { UserCheck, Search, Plus, Phone, Mail, Award, Crown, Star, Users, Edit3, Trash2, AlertTriangle } from 'lucide-react';

// ─── Customer Segmentation Logic ───
const getSegment = (customer) => {
  const points = customer.loyalty_points || 0;
  if (points >= 200) return { label: 'VIP',        color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: '👑' };
  if (points >= 51)  return { label: 'Regular',    color: '#818cf8', bg: 'rgba(99,102,241,0.15)',  icon: '⭐' };
  return               { label: 'New Client', color: '#34d399', bg: 'rgba(52,211,153,0.15)',  icon: '🆕' };
};

const EMPTY_FORM = { name: '', phone: '', email: '', gender: 'Female', dob: '', anniversary: '', notes: '', loyalty_points: '' };

function CustomersCRMView({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer }) {
  const [searchTerm, setSearchTerm]       = useState('');
  const [segmentFilter, setSegmentFilter] = useState('All');

  // Modal state: null = closed | 'add' | 'edit'
  const [modalMode, setModalMode]     = useState(null);
  const [editTarget, setEditTarget]   = useState(null);
  const [formData, setFormData]       = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ─── Filtering ───
  const filtered = customers.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);
    if (!matchSearch) return false;
    if (segmentFilter === 'All') return true;
    return getSegment(c).label === segmentFilter;
  });

  const vipCount     = customers.filter(c => getSegment(c).label === 'VIP').length;
  const regularCount = customers.filter(c => getSegment(c).label === 'Regular').length;
  const newCount     = customers.filter(c => getSegment(c).label === 'New Client').length;

  // ─── Open Modals ───
  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setEditTarget(null);
    setModalMode('add');
  };

  const openEdit = (customer) => {
    setEditTarget(customer);
    setFormData({
      name:          customer.name         || '',
      phone:         customer.phone        || '',
      email:         customer.email        || '',
      gender:        customer.gender       || 'Female',
      dob:           customer.dob ? String(customer.dob).split('T')[0] : '',
      anniversary:   customer.anniversary  ? String(customer.anniversary).split('T')[0] : '',
      notes:         customer.notes        || '',
      loyalty_points: customer.loyalty_points !== undefined ? customer.loyalty_points : '',
    });
    setModalMode('edit');
  };

  const closeModal = () => { setModalMode(null); setEditTarget(null); };

  // ─── Submit Add / Edit ───
  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === 'edit' && editTarget) {
      onUpdateCustomer(editTarget.id, formData);
    } else {
      onAddCustomer(formData);
    }
    closeModal();
  };

  // ─── Delete ───
  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDeleteCustomer(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const field = (key) => ({ value: formData[key], onChange: e => setFormData(p => ({ ...p, [key]: e.target.value })) });

  return (
    <div>
      {/* ─── Segment Tiles ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'VIP', count: vipCount,     color: '#f59e0b', icon: <Crown size={20} />,  sub: '200+ loyalty points' },
          { label: 'Regular', count: regularCount, color: '#818cf8', icon: <Star size={20} />,   sub: '51–199 loyalty points' },
          { label: 'New Client', count: newCount,     color: '#34d399', icon: <Users size={20} />, sub: '0–50 loyalty points' },
        ].map(({ label, count, color, icon, sub }) => (
          <div
            key={label}
            className="glass-card"
            onClick={() => setSegmentFilter(segmentFilter === label ? 'All' : label)}
            style={{
              padding: '18px 20px', cursor: 'pointer',
              border: segmentFilter === label ? `1.5px solid ${color}` : '1px solid var(--border)',
              transition: 'all 0.25s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ color }}>{icon}</span>
              <span style={{ fontWeight: '800', color, fontSize: '0.88rem' }}>{label} Clients</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color }}>{count}</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Segment filter indicator */}
      {segmentFilter !== 'All' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '10px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
            Showing: <strong>{segmentFilter}</strong> ({filtered.length} clients)
          </span>
          <button onClick={() => setSegmentFilter('All')} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem' }}>
            Clear Filter ✕
          </button>
        </div>
      )}

      {/* ─── Search & Add Bar ─── */}
      <div className="controls-bar">
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text" className="search-input" style={{ paddingLeft: '36px' }}
            placeholder="Search by name or phone..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add New Client Profile
        </button>
      </div>

      {/* ─── Customer Table ─── */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Client Profile</th>
              <th>Contact Details</th>
              <th>Gender & DOB</th>
              <th>Segment & Loyalty</th>
              <th>Special Notes</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No customer profiles found.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const segment = getSegment(c);
                return (
                  <tr key={c.id}>
                    {/* Profile */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="user-avatar" style={{ background: c.gender === 'Female' ? 'linear-gradient(135deg,#ec4899,#8b5cf6)' : 'linear-gradient(135deg,#6366f1,#3b82f6)', flexShrink: 0 }}>
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700' }}>{c.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ID: #CRM-{String(c.id).padStart(3, '0')}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        <div><Phone size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--accent-gold)' }} />{c.phone}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                          <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />{c.email || 'N/A'}
                        </div>
                      </div>
                    </td>

                    {/* Gender & DOB */}
                    <td>
                      <div style={{ fontSize: '0.84rem' }}>
                        <div>{c.gender}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          DOB: {c.dob ? String(c.dob).split('T')[0] : 'N/A'}
                        </div>
                      </div>
                    </td>

                    {/* Segment */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: segment.bg, color: segment.color, padding: '3px 8px', borderRadius: '10px', fontWeight: '800', fontSize: '0.76rem', width: 'fit-content' }}>
                          {segment.icon} {segment.label}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245,158,11,0.12)', color: 'var(--accent-gold)', padding: '3px 8px', borderRadius: '10px', fontWeight: '700', fontSize: '0.76rem', width: 'fit-content' }}>
                          <Award size={11} /> {c.loyalty_points || 0} pts
                        </span>
                      </div>
                    </td>

                    {/* Notes */}
                    <td style={{ color: 'var(--text-sub)', fontSize: '0.85rem', maxWidth: '200px' }}>
                      {c.notes || '—'}
                    </td>

                    {/* Action Buttons */}
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className="action-icon-btn edit"
                          onClick={() => openEdit(c)}
                          title="Edit Customer"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="action-icon-btn delete"
                          onClick={() => setDeleteTarget(c)}
                          title="Delete Customer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Add / Edit Modal ─── */}
      {modalMode && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '18px' }}>
              {modalMode === 'edit' ? '✏️ Edit Client Profile' : '+ Add New Client Profile'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" required placeholder="e.g. Priya Sharma" {...field('name')} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input type="text" required placeholder="9876543210" {...field('phone')} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select {...field('gender')}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="client@gmail.com" {...field('email')} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" {...field('dob')} />
                </div>
                <div className="form-group">
                  <label>Anniversary</label>
                  <input type="date" {...field('anniversary')} />
                </div>
              </div>

              {modalMode === 'edit' && (
                <div className="form-group">
                  <label>Loyalty Points</label>
                  <input type="number" min="0" placeholder="e.g. 150" {...field('loyalty_points')} />
                </div>
              )}

              <div className="form-group">
                <label>Preferences / Treatment Notes</label>
                <input type="text" placeholder="e.g. Sensitive skin, prefers organic products" {...field('notes')} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={closeModal} className="glass-card" style={{ padding: '8px 18px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'edit' ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(239,68,68,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#ef4444' }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '8px' }}>Delete Client Profile?</h3>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.84rem', marginBottom: '22px', lineHeight: '1.5' }}>
              Are you sure you want to permanently delete <strong style={{ color: 'var(--text-main)' }}>{deleteTarget.name}</strong>?
              Their appointment and billing history may also be affected. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" onClick={() => setDeleteTarget(null)} className="glass-card" style={{ padding: '8px 18px', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: '600' }}>
                Cancel
              </button>
              <button type="button" onClick={handleDeleteConfirm} className="btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomersCRMView;
