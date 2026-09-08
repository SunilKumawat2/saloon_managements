import React, { useState } from 'react';
import { Building, MapPin, Phone, Plus, CheckCircle2, XCircle, Edit3, Power, Trash2, AlertTriangle } from 'lucide-react';

function BranchesManagementView({ 
  branches, 
  onAddBranch, 
  onUpdateBranch, 
  onToggleBranchStatus, 
  onDeleteBranch 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deletingBranch, setDeletingBranch] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    address: '',
    phone: ''
  });

  const handleOpenAdd = () => {
    setFormData({ name: '', code: '', city: '', address: '', phone: '' });
    setEditingBranch(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || '',
      code: branch.code || '',
      city: branch.city || '',
      address: branch.address || '',
      phone: branch.phone || ''
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBranch) {
      onUpdateBranch(editingBranch.id, formData);
    } else {
      onAddBranch(formData);
    }
    setShowAddModal(false);
    setEditingBranch(null);
    setFormData({ name: '', code: '', city: '', address: '', phone: '' });
  };

  const handleDeleteConfirm = () => {
    if (deletingBranch) {
      onDeleteBranch(deletingBranch.id);
      setDeletingBranch(null);
    }
  };

  return (
    <div>
      {/* ─── Top Control Bar ─── */}
      <div className="controls-bar" style={{ justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Add New Salon Branch
        </button>
      </div>

      {/* ─── Branches Grid Cards ─── */}
      <div className="branches-grid">
        {branches.map((branch) => {
          const isActive = branch.is_active !== false;

          return (
            <div key={branch.id} className="glass-panel branch-card" style={{ position: 'relative', opacity: isActive ? 1 : 0.75 }}>
              {/* Header */}
              <div className="branch-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="branch-code">{branch.code}</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '6px' }}>{branch.name}</h3>
                </div>

                {/* Right Header: Status & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  {isActive ? (
                    <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '700' }}>
                      <CheckCircle2 size={14} /> Operational
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '700' }}>
                      <XCircle size={14} /> Offline / Closed
                    </span>
                  )}

                  {/* Icon Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button
                      className="action-icon-btn edit"
                      onClick={() => handleOpenEdit(branch)}
                      title="Edit Branch"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button
                      className={`action-icon-btn ${isActive ? 'block' : 'unblock'}`}
                      onClick={() => onToggleBranchStatus(branch.id)}
                      title={isActive ? 'Deactivate Branch' : 'Activate Branch'}
                    >
                      <Power size={14} />
                    </button>

                    <button
                      className="action-icon-btn delete"
                      onClick={() => setDeletingBranch(branch)}
                      title="Delete Branch"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div style={{ color: 'var(--text-sub)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                  <span>{branch.address ? `${branch.address}, ${branch.city}` : branch.city || 'No address provided'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                  <span>{branch.phone || 'N/A'}</span>
                </div>
              </div>

              {/* Card Footer */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Multi-Branch Integration</span>
                {isActive ? (
                  <span style={{ color: 'var(--success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Active
                  </span>
                ) : (
                  <span style={{ color: '#ef4444', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={12} /> Inactive
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Add / Edit Modal ─── */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '16px' }}>
              {editingBranch ? 'Edit Salon Branch' : 'Add New Salon Branch'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Branch Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. South Extension Salon" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Branch Code</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="SE-003" 
                    value={formData.code} 
                    onChange={(e) => setFormData({...formData, code: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="New Delhi" 
                    value={formData.city} 
                    onChange={(e) => setFormData({...formData, city: e.target.value})} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Full Address</label>
                <input 
                  type="text" 
                  placeholder="Market Area, Main Road" 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input 
                  type="text" 
                  placeholder="011-99887766" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowAddModal(false); setEditingBranch(null); }} 
                  className="glass-card" 
                  style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingBranch ? 'Save Changes' : 'Save & Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deletingBranch && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(239,68,68,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#ef4444' }}>
              <AlertTriangle size={24} />
            </div>
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>Delete Salon Branch?</h3>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-main)' }}>{deletingBranch.name}</strong> ({deletingBranch.code})? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button" 
                onClick={() => setDeletingBranch(null)} 
                className="glass-card" 
                style={{ padding: '8px 18px', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: '600' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteConfirm} 
                className="btn-primary" 
                style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
              >
                Yes, Delete Branch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BranchesManagementView;
