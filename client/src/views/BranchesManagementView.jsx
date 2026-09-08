import React, { useState } from 'react';
import { Building, MapPin, Phone, Plus, CheckCircle2, Users } from 'lucide-react';

function BranchesManagementView({ branches, onAddBranch }) {
  const [showModal, setShowModal] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: '',
    code: '',
    city: '',
    address: '',
    phone: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddBranch(newBranch);
    setShowModal(false);
    setNewBranch({ name: '', code: '', city: '', address: '', phone: '' });
  };

  return (
    <div>
      <div className="controls-bar" style={{ justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add New Salon Branch
        </button>
      </div>

      <div className="branches-grid">
        {branches.map((branch) => (
          <div key={branch.id} className="glass-panel branch-card">
            <div className="branch-card-header">
              <div>
                <span className="branch-code">{branch.code}</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '6px' }}>{branch.name}</h3>
              </div>
              <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '700' }}>
                <CheckCircle2 size={14} /> Operational
              </span>
            </div>

            <div style={{ color: 'var(--text-sub)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={14} style={{ color: 'var(--accent-gold)' }} />
                <span>{branch.address}, {branch.city}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} style={{ color: 'var(--accent-gold)' }} />
                <span>{branch.phone || 'N/A'}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Multi-Branch Integration</span>
              <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>Active</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '16px' }}>Add New Salon Branch</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Branch Name</label>
                <input type="text" required placeholder="e.g. South Extension Salon" value={newBranch.name} onChange={(e) => setNewBranch({...newBranch, name: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Branch Code</label>
                  <input type="text" required placeholder="SE-003" value={newBranch.code} onChange={(e) => setNewBranch({...newBranch, code: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input type="text" required placeholder="New Delhi" value={newBranch.city} onChange={(e) => setNewBranch({...newBranch, city: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label>Full Address</label>
                <input type="text" placeholder="Market Area, Main Road" value={newBranch.address} onChange={(e) => setNewBranch({...newBranch, address: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input type="text" placeholder="011-99887766" value={newBranch.phone} onChange={(e) => setNewBranch({...newBranch, phone: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save & Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BranchesManagementView;
