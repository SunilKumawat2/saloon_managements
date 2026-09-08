import React, { useState } from 'react';
import { UserCheck, Search, Plus, Phone, Mail, Award, Calendar, Crown, Star, Users } from 'lucide-react';

// Customer Segmentation Logic based on loyalty points & visit frequency
const getSegment = (customer) => {
  const points = customer.loyalty_points || 0;
  // VIP: 200+ points, Regular: 51-199, New: 0-50
  if (points >= 200) return { label: 'VIP', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '👑' };
  if (points >= 51)  return { label: 'Regular', color: '#818cf8', bg: 'rgba(99,102,241,0.15)', icon: '⭐' };
  return { label: 'New Client', color: '#34d399', bg: 'rgba(52,211,153,0.15)', icon: '🆕' };
};

function CustomersCRMView({ customers, onAddCustomer }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState('All');

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Female',
    dob: '',
    anniversary: '',
    notes: ''
  });

  // Filter by search AND segment
  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
    if (!matchSearch) return false;
    if (segmentFilter === 'All') return true;
    return getSegment(c).label === segmentFilter;
  });

  // Segment summary counts
  const vipCount = customers.filter(c => getSegment(c).label === 'VIP').length;
  const regularCount = customers.filter(c => getSegment(c).label === 'Regular').length;
  const newCount = customers.filter(c => getSegment(c).label === 'New Client').length;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddCustomer(newCustomer);
    setShowModal(false);
    setNewCustomer({ name: '', phone: '', email: '', gender: 'Female', dob: '', anniversary: '', notes: '' });
  };

  return (
    <div>
      {/* ─── Customer Segmentation Summary Tiles ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        
        {/* VIP Segment */}
        <div
          className="glass-card"
          onClick={() => setSegmentFilter(segmentFilter === 'VIP' ? 'All' : 'VIP')}
          style={{
            padding: '18px 20px',
            cursor: 'pointer',
            border: segmentFilter === 'VIP' ? '1.5px solid #f59e0b' : '1px solid var(--border)',
            transition: 'all 0.25s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Crown size={20} style={{ color: '#f59e0b' }} />
            <span style={{ fontWeight: '800', color: '#f59e0b', fontSize: '0.88rem' }}>VIP Clients</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: '#f59e0b' }}>{vipCount}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>200+ loyalty points</div>
        </div>

        {/* Regular Segment */}
        <div
          className="glass-card"
          onClick={() => setSegmentFilter(segmentFilter === 'Regular' ? 'All' : 'Regular')}
          style={{
            padding: '18px 20px',
            cursor: 'pointer',
            border: segmentFilter === 'Regular' ? '1.5px solid #818cf8' : '1px solid var(--border)',
            transition: 'all 0.25s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Star size={20} style={{ color: '#818cf8' }} />
            <span style={{ fontWeight: '800', color: '#818cf8', fontSize: '0.88rem' }}>Regular Clients</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: '#818cf8' }}>{regularCount}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>51–199 loyalty points</div>
        </div>

        {/* New Segment */}
        <div
          className="glass-card"
          onClick={() => setSegmentFilter(segmentFilter === 'New Client' ? 'All' : 'New Client')}
          style={{
            padding: '18px 20px',
            cursor: 'pointer',
            border: segmentFilter === 'New Client' ? '1.5px solid #34d399' : '1px solid var(--border)',
            transition: 'all 0.25s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Users size={20} style={{ color: '#34d399' }} />
            <span style={{ fontWeight: '800', color: '#34d399', fontSize: '0.88rem' }}>New Clients</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: '#34d399' }}>{newCount}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>0–50 loyalty points</div>
        </div>
      </div>

      {/* Active Segment Filter Indicator */}
      {segmentFilter !== 'All' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '10px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
            Showing segment: <strong>{segmentFilter}</strong> ({filtered.length} clients)
          </span>
          <button onClick={() => setSegmentFilter('All')} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem' }}>
            Clear Filter ✕
          </button>
        </div>
      )}

      {/* Search & Actions Bar */}
      <div className="controls-bar">
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="search-input" 
            style={{ paddingLeft: '36px' }}
            placeholder="Search customer by name or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add New Client Profile
        </button>
      </div>

      {/* Customer Directory Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Client Profile</th>
              <th>Contact Details</th>
              <th>Gender & DOB</th>
              <th>Segment & Loyalty</th>
              <th>Special Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No customer profiles found.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const segment = getSegment(c);
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="user-avatar" style={{ background: c.gender === 'Female' ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700' }}>{c.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ID: #CRM-00{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        <div><Phone size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--accent-gold)' }} /> {c.phone}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}><Mail size={12} style={{ display: 'inline', marginRight: '4px' }} /> {c.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.84rem' }}>
                        <div>{c.gender}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>DOB: {c.dob ? String(c.dob).split('T')[0] : 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      {/* Segment Badge */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: segment.bg, color: segment.color, padding: '3px 8px', borderRadius: '10px', fontWeight: '800', fontSize: '0.76rem', width: 'fit-content' }}>
                          {segment.icon} {segment.label}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-gold)', padding: '3px 8px', borderRadius: '10px', fontWeight: '700', fontSize: '0.76rem', width: 'fit-content' }}>
                          <Award size={11} /> {c.loyalty_points || 0} pts
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>
                      {c.notes || 'No notes added.'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '16px' }}>Add New Customer Profile</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Client Full Name</label>
                <input type="text" required placeholder="e.g. Deepika Padukone" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input type="text" required placeholder="9876543210" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select value={newCustomer.gender} onChange={(e) => setNewCustomer({...newCustomer, gender: e.target.value})}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="client@gmail.com" value={newCustomer.email} onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" value={newCustomer.dob} onChange={(e) => setNewCustomer({...newCustomer, dob: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Anniversary</label>
                  <input type="date" value={newCustomer.anniversary} onChange={(e) => setNewCustomer({...newCustomer, anniversary: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label>Preferences / Treatment Notes</label>
                <input type="text" placeholder="e.g. Prefers organic products, sensitive skin" value={newCustomer.notes} onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Customer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomersCRMView;
