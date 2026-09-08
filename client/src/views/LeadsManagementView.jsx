import React, { useState } from 'react';
import {
  Target, Plus, Phone, Mail, Clock, AlertTriangle,
  BellRing, CheckCircle2, Edit3, Trash2, X, Search,
  UserCheck, Sparkles
} from 'lucide-react';

// Helper: Check if a date is overdue or today
const getReminderStatus = (followupDate) => {
  if (!followupDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fDate = new Date(String(followupDate).split('T')[0]);
  fDate.setHours(0, 0, 0, 0);
  const diff = Math.round((fDate - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { type: 'overdue', label: `Overdue by ${Math.abs(diff)} day(s)`, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
  if (diff === 0) return { type: 'today', label: 'Follow-up DUE TODAY!', color: '#f59e0b', bg: 'rgba(245,158,11,0.14)' };
  if (diff <= 2) return { type: 'upcoming', label: `Due in ${diff} day(s)`, color: '#818cf8', bg: 'rgba(129,140,248,0.12)' };
  return null;
};

function LeadsManagementView({ leads = [], onAddLead, onUpdateLead, onDeleteLead, onUpdateLeadStatus }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'Walk-in',
    notes: '',
    followup_date: '',
    status: 'New'
  });

  // Urgent reminders
  const urgentReminders = leads.filter(l => {
    const status = getReminderStatus(l.followup_date);
    return status && l.status !== 'Converted' && l.status !== 'Lost';
  });

  // Filtered leads
  const filtered = leads.filter(l => {
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    const matchesSearch = !searchQuery.trim() ||
      l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone?.includes(searchQuery) ||
      l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.source?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      source: 'Walk-in',
      notes: '',
      followup_date: '',
      status: 'New'
    });
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      source: lead.source || 'Walk-in',
      notes: lead.notes || '',
      followup_date: lead.followup_date ? String(lead.followup_date).split('T')[0] : '',
      status: lead.status || 'New'
    });
  };

  // Submit Add
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (onAddLead) onAddLead(formData);
    setShowAddModal(false);
  };

  // Submit Edit
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (onUpdateLead && editingLead) {
      onUpdateLead(editingLead.id, formData);
    }
    setEditingLead(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (onDeleteLead && deletingLead) {
      onDeleteLead(deletingLead.id);
    }
    setDeletingLead(null);
  };

  return (
    <div>
      {/* ─── AUTOMATED FOLLOW-UP REMINDERS PANEL ─── */}
      {urgentReminders.length > 0 && (
        <div style={{
          marginBottom: '24px',
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1.5px solid rgba(239,68,68,0.3)',
          borderRadius: '16px',
          padding: '20px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <BellRing size={20} style={{ color: '#ef4444' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#ef4444', margin: 0 }}>
              🔔 Receptionist Reminders — {urgentReminders.length} Follow-up Alert{urgentReminders.length > 1 ? 's' : ''}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {urgentReminders.map(lead => {
              const reminder = getReminderStatus(lead.followup_date);
              return (
                <div key={lead.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  background: reminder.bg,
                  border: `1px solid ${reminder.color}33`,
                  borderRadius: '10px',
                  padding: '12px 16px',
                }}>
                  {reminder.type === 'overdue'
                    ? <AlertTriangle size={16} style={{ color: reminder.color, flexShrink: 0 }} />
                    : <Clock size={16} style={{ color: reminder.color, flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: '800', color: '#fff' }}>{lead.name}</span>
                    <span style={{ marginLeft: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      ({lead.source}) — {lead.phone}
                    </span>
                    {lead.notes && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        📝 {lead.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: '800', color: reminder.color, fontSize: '0.82rem' }}>
                      {reminder.label}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {String(lead.followup_date).split('T')[0]}
                    </div>
                  </div>
                  {/* Quick Convert Dropdown */}
                  <select
                    value={lead.status}
                    onChange={(e) => onUpdateLeadStatus(lead.id, e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: '#fff',
                      border: '1px solid var(--border)',
                      padding: '5px 8px',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      outline: 'none',
                      flexShrink: 0,
                    }}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Converted">Converted ✓</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── No Reminders Banner ─── */}
      {urgentReminders.length === 0 && leads.length > 0 && (
        <div style={{
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 18px',
          background: 'rgba(52,211,153,0.07)',
          border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: '12px',
          fontSize: '0.88rem',
          color: '#34d399',
          fontWeight: '700',
        }}>
          <CheckCircle2 size={16} />
          All follow-ups are on schedule. No urgent reminders today. ✅
        </div>
      )}

      {/* ─── Action & Filter Bar ─── */}
      <div className="controls-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, phone, email, source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <select className="select-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Lead Pipeline Stages</option>
            <option value="New">New Inquiries</option>
            <option value="Contacted">Contacted / Follow-up</option>
            <option value="Converted">Converted to Client</option>
            <option value="Lost">Lost / Unresponsive</option>
          </select>
        </div>

        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Capture New Prospect
        </button>
      </div>

      {/* ─── Lead Cards Pipeline Grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
        {filtered.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            <Target size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p style={{ margin: 0 }}>No lead prospects found matching your search and filter criteria.</p>
          </div>
        ) : filtered.map((lead) => {
          const reminder = getReminderStatus(lead.followup_date);
          return (
            <div key={lead.id} className="glass-panel" style={{ padding: '24px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {/* Reminder indicator strip */}
              {reminder && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, ${reminder.color}, transparent)`,
                  borderRadius: '16px 16px 0 0',
                }} />
              )}
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>
                      Source: {lead.source}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '8px', marginBottom: 0 }}>{lead.name}</h3>
                  </div>

                  <select
                    value={lead.status}
                    onChange={(e) => onUpdateLeadStatus(lead.id, e.target.value)}
                    style={{
                      background: lead.status === 'Converted' ? 'rgba(16, 185, 129, 0.2)' : lead.status === 'Contacted' ? 'rgba(245, 158, 11, 0.2)' : lead.status === 'Lost' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                      color: lead.status === 'Converted' ? 'var(--success)' : lead.status === 'Contacted' ? 'var(--accent-gold)' : lead.status === 'Lost' ? '#ef4444' : 'var(--primary-indigo)',
                      border: '1px solid var(--border)',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Converted">Converted ✓</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)', display: 'flex', flexDirection: 'column', gap: '6px', margin: '14px 0' }}>
                  <div><Phone size={12} style={{ display: 'inline', marginRight: '6px', color: 'var(--accent-gold)' }} /> {lead.phone}</div>
                  <div><Mail size={12} style={{ display: 'inline', marginRight: '6px' }} /> {lead.email || 'N/A'}</div>
                  {lead.followup_date && (
                    <div style={{ color: reminder ? reminder.color : 'var(--accent-gold)', fontSize: '0.78rem', marginTop: '4px', fontWeight: reminder ? '800' : '400' }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      Follow-up: {String(lead.followup_date).split('T')[0]}
                      {reminder && ` — ${reminder.label}`}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  📝 {lead.notes || 'No follow-up notes.'}
                </div>
              </div>

              {/* Card Footer Action Buttons (Edit & Delete) */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                  onClick={() => handleOpenEdit(lead)}
                  title="Edit Lead Details"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    color: '#818cf8',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Edit3 size={13} /> Edit
                </button>

                <button
                  onClick={() => setDeletingLead(lead)}
                  title="Delete Lead"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── ADD PROSPECT LEAD MODAL ─── */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '520px', width: '90%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={20} style={{ color: 'var(--accent-gold)' }} /> Capture New Prospect Lead
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>Prospect Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ranbir Kapoor"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Lead Source</label>
                  <select value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})}>
                    <option value="Walk-in">Walk-in Inquiry</option>
                    <option value="Website Portal">Website Portal</option>
                    <option value="Instagram Ads">Instagram Ads</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="prospect@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Follow-up Date</label>
                  <input
                    type="date"
                    value={formData.followup_date}
                    onChange={(e) => setFormData({...formData, followup_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Pipeline Stage</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Inquiry Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Interested in pre-grooming package"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT PROSPECT LEAD MODAL ─── */}
      {editingLead && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '520px', width: '90%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={20} style={{ color: '#818cf8' }} /> Edit Lead — {editingLead.name}
              </h3>
              <button onClick={() => setEditingLead(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Prospect Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Lead Source</label>
                  <select value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})}>
                    <option value="Walk-in">Walk-in Inquiry</option>
                    <option value="Website Portal">Website Portal</option>
                    <option value="Instagram Ads">Instagram Ads</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Follow-up Date</label>
                  <input
                    type="date"
                    value={formData.followup_date}
                    onChange={(e) => setFormData({...formData, followup_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Pipeline Stage</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Inquiry Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setEditingLead(null)} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Lead Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {deletingLead && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '420px', width: '90%', padding: '28px', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#ef4444'
            }}>
              <Trash2 size={26} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>Delete Lead Prospect?</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to delete lead <strong>{deletingLead.name}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeletingLead(null)}
                className="glass-card"
                style={{ padding: '10px 20px', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: '700' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '10px 24px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeadsManagementView;
