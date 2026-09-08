import React, { useState } from 'react';
import { Target, Plus, Phone, Mail, Clock, AlertTriangle, BellRing, CheckCircle2 } from 'lucide-react';

// Helper: Check if a date is overdue or today
const getReminderStatus = (followupDate) => {
  if (!followupDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fDate = new Date(String(followupDate).split('T')[0]);
  fDate.setHours(0, 0, 0, 0);
  const diff = Math.round((fDate - today) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { type: 'overdue',  label: `Overdue by ${Math.abs(diff)} day(s)`, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
  if (diff === 0) return { type: 'today',   label: 'Follow-up DUE TODAY!', color: '#f59e0b', bg: 'rgba(245,158,11,0.14)' };
  if (diff <= 2)  return { type: 'upcoming', label: `Due in ${diff} day(s)`, color: '#818cf8', bg: 'rgba(129,140,248,0.12)' };
  return null;
};

function LeadsManagementView({ leads, onAddLead, onUpdateLeadStatus }) {
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'Walk-in',
    notes: '',
    followup_date: ''
  });

  // Leads that need follow-up attention (overdue or today or within 2 days)
  const urgentReminders = leads.filter(l => {
    const status = getReminderStatus(l.followup_date);
    return status && l.status !== 'Converted' && l.status !== 'Lost';
  });

  const filtered = leads.filter(l => statusFilter === 'All' || l.status === statusFilter);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddLead(newLead);
    setShowModal(false);
    setNewLead({ name: '', phone: '', email: '', source: 'Walk-in', notes: '', followup_date: '' });
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
                  {/* Quick Convert Button */}
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

      {/* Action & Filter Bar */}
      <div className="controls-bar">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select className="select-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Lead Pipeline Stages</option>
            <option value="New">New Inquiries</option>
            <option value="Contacted">Contacted / Follow-up</option>
            <option value="Converted">Converted to Client</option>
            <option value="Lost">Lost / Unresponsive</option>
          </select>
        </div>

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Capture New Lead
        </button>
      </div>

      {/* Lead Cards Pipeline Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No leads found in this stage.
          </div>
        ) : filtered.map((lead) => {
          const reminder = getReminderStatus(lead.followup_date);
          return (
            <div key={lead.id} className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>
                    Source: {lead.source}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '8px' }}>{lead.name}</h3>
                </div>

                <select 
                  value={lead.status} 
                  onChange={(e) => onUpdateLeadStatus(lead.id, e.target.value)}
                  style={{
                    background: lead.status === 'Converted' ? 'rgba(16, 185, 129, 0.2)' : lead.status === 'Contacted' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    color: lead.status === 'Converted' ? 'var(--success)' : lead.status === 'Contacted' ? 'var(--accent-gold)' : 'var(--primary-indigo)',
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
                  <option value="Converted">Converted</option>
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
          );
        })}
      </div>

      {/* Add Lead Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '16px' }}>Capture New Prospect Lead</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Prospect Name</label>
                <input type="text" required placeholder="e.g. Ranbir Kapoor" value={newLead.name} onChange={(e) => setNewLead({...newLead, name: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" required placeholder="9876543210" value={newLead.phone} onChange={(e) => setNewLead({...newLead, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Lead Source</label>
                  <select value={newLead.source} onChange={(e) => setNewLead({...newLead, source: e.target.value})}>
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
                <input type="email" placeholder="prospect@gmail.com" value={newLead.email} onChange={(e) => setNewLead({...newLead, email: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Follow-up Date (Reminder will appear for Receptionist)</label>
                <input type="date" value={newLead.followup_date} onChange={(e) => setNewLead({...newLead, followup_date: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Inquiry Notes</label>
                <input type="text" placeholder="e.g. Interested in pre-grooming package" value={newLead.notes} onChange={(e) => setNewLead({...newLead, notes: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)' }}>
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
    </div>
  );
}

export default LeadsManagementView;
