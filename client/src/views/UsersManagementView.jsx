import React, { useState, useRef, useEffect } from 'react';
import {
  UserPlus, Search, Building, CheckCircle2, XCircle,
  Camera, Trash2, Edit3, ShieldOff, ShieldCheck, X, Upload
} from 'lucide-react';
import {
  Admin_Upload_User_Avatar,
  Admin_Remove_User_Avatar,
  Admin_Update_User,
  Admin_Delete_User,
  Admin_Toggle_User_Status,
} from '../services/apiService';
import { BACKEND_URL } from '../config/Config';


// ─── Reusable Avatar with hover-upload ───
function UserAvatar({ user, size = 34, onUpload }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [hover, setHover] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await Admin_Upload_User_Avatar(user.id, file).catch(() => null);
      if (res?.data?.data?.avatar_url && onUpload) {
        onUpload(user.id, res.data.data.avatar_url);
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const avatarUrl = user.avatar_url ? `${BACKEND_URL}${user.avatar_url}` : null;

  return (
    <div
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user.name}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--accent-gold)' }}
        />
      ) : (
        <div className="user-avatar" style={{ width: size, height: size, fontSize: size * 0.42 + 'px' }}>
          {user.name.charAt(0)}
        </div>
      )}
      {hover && onUpload && (
        <div
          onClick={() => inputRef.current?.click()}
          title="Click to upload photo"
          style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'rgba(0,0,0,0.65)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          {uploading
            ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            : <Camera size={13} style={{ color: '#fff' }} />
          }
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleFileChange} />
    </div>
  );
}

// ─── Avatar Upload Dropzone (used inside modal) ───
function AvatarUploadZone({ previewFile, onFileSelect }) {
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) onFileSelect(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{
        border: `1.5px dashed ${dragOver ? 'var(--accent-gold)' : 'var(--border)'}`,
        borderRadius: '10px',
        padding: '14px',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragOver ? 'rgba(0,230,118,0.06)' : 'rgba(255,255,255,0.02)',
        transition: 'all 0.2s',
        marginBottom: '12px',
      }}
    >
      {previewFile ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
          <img src={URL.createObjectURL(previewFile)} alt="preview" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--accent-gold)' }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: '700', fontSize: '0.8rem' }}>{previewFile.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to change</div>
          </div>
        </div>
      ) : (
        <>
          <Upload size={18} style={{ color: 'var(--accent-gold)', marginBottom: '4px' }} />
          <div style={{ fontWeight: '700', fontSize: '0.78rem', color: 'var(--text-sub)' }}>
            Click or drag & drop to upload profile photo
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            JPG, PNG, WebP or GIF — Max 5MB
          </div>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) onFileSelect(e.target.files[0]); }} />
    </div>
  );
}

// ─── Confirm Delete Dialog ───
function ConfirmDialog({ user, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ padding: '24px', maxWidth: '380px', textAlign: 'center' }}>
        <div style={{ width: '42px', height: '42px', background: 'rgba(239,68,68,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <Trash2 size={18} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '6px' }}>Delete User?</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>
          Are you sure you want to permanently delete <strong style={{ color: '#fff' }}>{user?.name}</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={onCancel} className="glass-card" style={{ padding: '8px 18px', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: '700', fontSize: '0.8rem' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '8px 18px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '0.8rem' }}>
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───
function UsersManagementView({ users: initialUsers, branches, roles, onAddUser }) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);       // user object being edited
  const [deleteUser, setDeleteUser] = useState(null);   // user to confirm delete

  // Add form state
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', role_id: 2, branch_id: 1, password: 'password123' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setUsers(initialUsers); }, [initialUsers]);

  // ─── Handlers ───
  const handleAvatarUpload = (userId, avatarUrl) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, avatar_url: avatarUrl } : u));
  };

  const handleRemoveAvatar = async (userId) => {
    await Admin_Remove_User_Avatar(userId).catch(() => null);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, avatar_url: null } : u));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await onAddUser(newUser);
      if (avatarFile && created?.id) {
        const res = await Admin_Upload_User_Avatar(created.id, avatarFile).catch(() => null);
        if (res?.data?.data?.avatar_url) {
          setUsers(prev => prev.map(u => u.id === created.id ? { ...u, avatar_url: res.data.data.avatar_url } : u));
        }
      }
    } finally {
      setIsSubmitting(false);
      setShowAddModal(false);
      setNewUser({ name: '', email: '', phone: '', role_id: 2, branch_id: 1, password: 'password123' });
      setAvatarFile(null);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await Admin_Update_User(editUser.id, {
        name: editUser.name,
        email: editUser.email,
        phone: editUser.phone,
        role_id: editUser.role_id,
        branch_id: editUser.branch_id,
      }).catch(() => null);
      if (res?.data?.data) {
        setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...res.data.data } : u));
      } else {
        setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...editUser } : u));
      }
    } finally {
      setIsSubmitting(false);
      setEditUser(null);
    }
  };

  const handleToggleStatus = async (userId) => {
    await Admin_Toggle_User_Status(userId).catch(() => null);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u));
  };

  const handleDeleteConfirm = async () => {
    await Admin_Delete_User(deleteUser.id).catch(() => null);
    setUsers(prev => prev.filter(u => u.id !== deleteUser.id));
    setDeleteUser(null);
  };

  const filteredUsers = users.filter(user => {
    const uName = (user.name || '').toLowerCase();
    const uEmail = (user.email || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchSearch = uName.includes(term) || uEmail.includes(term);
    const matchRole = roleFilter === 'All' || user.role_name === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div>
      {/* ─── Top Action Bar ─── */}
      <div className="controls-bar">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="search-input-wrapper" style={{ width: '260px' }}>
            <Search size={15} className="search-icon" />
            <input 
              type="text" 
              className="search-input-field search-input-compact" 
              placeholder="Search by name or email..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
            {searchTerm && (
              <button 
                type="button" 
                className="search-input-clear-btn" 
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <select className="select-filter" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Receptionist">Receptionist</option>
            <option value="Staff">Staff</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={14} /> Add New User / Staff
        </button>
      </div>

      {/* ─── Users Table ─── */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>User Profile</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Phone</th>
              <th>Status</th>
              <th style={{ textAlign: 'right', paddingRight: '18px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No users found.</td></tr>
            ) : filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UserAvatar user={user} size={34} onUpload={handleAvatarUpload} />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.84rem' }}>{user.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`role-tag ${user.role_name?.toLowerCase() || 'staff'}`}>
                    {user.role_name || 'Staff'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}>
                    <Building size={12} style={{ color: 'var(--accent-gold)' }} /> {user.branch_name || 'Main Salon'}
                  </div>
                </td>
                <td style={{ fontSize: '0.78rem' }}>{user.phone || 'N/A'}</td>
                <td>
                  {user.is_active !== false ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '0.76rem', fontWeight: '700' }}>
                      <CheckCircle2 size={12} /> Active
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.76rem', fontWeight: '700' }}>
                      <XCircle size={12} /> Blocked
                    </span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {/* Icon Buttons with Tooltips */}
                    <button
                      className="action-icon-btn edit"
                      onClick={() => setEditUser({ ...user })}
                      title="Edit User"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button
                      className={`action-icon-btn ${user.is_active !== false ? 'block' : 'unblock'}`}
                      onClick={() => handleToggleStatus(user.id)}
                      title={user.is_active !== false ? 'Block User' : 'Unblock User'}
                    >
                      {user.is_active !== false ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                    </button>

                    {user.avatar_url && (
                      <button
                        className="action-icon-btn remove-photo"
                        onClick={() => handleRemoveAvatar(user.id)}
                        title="Remove Profile Photo"
                      >
                        <Camera size={14} />
                      </button>
                    )}

                    <button
                      className="action-icon-btn delete"
                      onClick={() => setDeleteUser(user)}
                      title="Delete User"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── ADD USER MODAL ─── */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Add New System User</h3>
              <button onClick={() => { setShowAddModal(false); setAvatarFile(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-sub)', marginBottom: '6px', display: 'block' }}>
                Profile Photo <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(Optional)</span>
              </label>
              <AvatarUploadZone previewFile={avatarFile} onFileSelect={setAvatarFile} />

              <div className="form-group">
                <label>Full Name</label>
                <input type="text" required placeholder="e.g. Vikram Malhotra" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input type="email" required placeholder="vikram@saloon.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" placeholder="9876543210" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Assign Role</label>
                  <select value={newUser.role_id} onChange={e => setNewUser({ ...newUser, role_id: parseInt(e.target.value) })}>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assign Branch</label>
                  <select value={newUser.branch_id} onChange={e => setNewUser({ ...newUser, branch_id: parseInt(e.target.value) })}>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => { setShowAddModal(false); setAvatarFile(null); }} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)', fontSize: '0.8rem' }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Save & Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT USER MODAL ─── */}
      {editUser && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '460px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Edit User Profile</h3>
              <button onClick={() => setEditUser(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <UserAvatar user={editUser} size={42} onUpload={(uid, url) => { setEditUser(prev => ({ ...prev, avatar_url: url })); handleAvatarUpload(uid, url); }} />
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{editUser.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                  Hover avatar and click 📷 icon to change photo.
                </div>
              </div>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" required value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" required value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" value={editUser.phone || ''} onChange={e => setEditUser({ ...editUser, phone: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Role</label>
                  <select value={editUser.role_id} onChange={e => setEditUser({ ...editUser, role_id: parseInt(e.target.value) })}>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Branch</label>
                  <select value={editUser.branch_id} onChange={e => setEditUser({ ...editUser, branch_id: parseInt(e.target.value) })}>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setEditUser(null)} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)', fontSize: '0.8rem' }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM DIALOG ─── */}
      {deleteUser && (
        <ConfirmDialog user={deleteUser} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteUser(null)} />
      )}
    </div>
  );
}

export default UsersManagementView;
