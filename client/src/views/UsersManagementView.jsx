import React, { useState, useRef, useEffect } from 'react';
import {
  UserPlus, Search, Building, CheckCircle2, XCircle,
  Camera, Trash2, Edit3, ShieldOff, ShieldCheck, X, Upload, Loader2,
  Eye, EyeOff
} from 'lucide-react';
import {
  Admin_Get_Users,
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
          {String(user.name || '').charAt(0)}
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
          Are you sure you want to permanently delete <strong style={{ color: 'var(--text-main)' }}>{user?.name}</strong>? This action cannot be undone.
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
function UsersManagementView({ users: initialUsers, branches, roles, onAddUser, selectedBranchId = 'all', currentUser }) {
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
  const [addPhoneError, setAddPhoneError] = useState('');
  const [editPhoneError, setEditPhoneError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState({});

  // ─── Pagination & Server API Sync ───
  const [pageSize, setPageSize]             = useState(10); // 5, 10, 20, 50, 100, or 'all'
  const [currentPage, setCurrentPage]       = useState(1);
  const [serverData, setServerData]         = useState(null);
  const [loadingBackend, setLoadingBackend] = useState(false);

  useEffect(() => { setUsers(initialUsers); }, [initialUsers]);

  const fetchBackendUsers = async () => {
    setLoadingBackend(true);
    try {
      const queryParams = {
        page: currentPage,
        limit: pageSize === 'all' ? 'all' : pageSize,
        search: searchTerm,
        role: roleFilter
      };
      if (selectedBranchId && selectedBranchId !== 'all') {
        queryParams.branch_id = selectedBranchId;
      }
      const res = await Admin_Get_Users(queryParams).catch(() => null);
      if (res?.data) {
        if (res.data.pagination && Array.isArray(res.data.data)) {
          setServerData({ data: res.data.data, pagination: res.data.pagination });
        } else if (Array.isArray(res.data.data)) {
          setServerData({ data: res.data.data, pagination: null });
        }
      }
    } finally {
      setLoadingBackend(false);
    }
  };

  // Fetch Users from backend when page, pageSize, search, roleFilter or selectedBranchId changes
  useEffect(() => {
    let active = true;
    fetchBackendUsers();
    return () => { active = false; };
  }, [pageSize, currentPage, searchTerm, roleFilter, selectedBranchId]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e) => {
    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
    setPageSize(val);
    setCurrentPage(1);
  };

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
    const cleanPhone = String(newUser.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setAddPhoneError('Phone number must be exactly 10 digits (e.g. 9876543210)');
      return;
    }
    setAddPhoneError('');
    setIsSubmitting(true);
    try {
      const payload = {
        ...newUser,
        phone: cleanPhone,
        role_id: parseInt(newUser.role_id),
        branch_id: (parseInt(newUser.role_id) === 1 || newUser.role_id === '1') ? null : (newUser.branch_id ? parseInt(newUser.branch_id) : null)
      };
      const created = await onAddUser(payload);
      if (created) {
        setUsers(prev => [created, ...prev.filter(u => String(u.id) !== String(created.id))]);
        setServerData(prev => {
          if (!prev || !Array.isArray(prev.data)) return { data: [created], pagination: { total: 1, page: 1, limit: 10, totalPages: 1 } };
          return {
            ...prev,
            data: [created, ...prev.data.filter(u => String(u.id) !== String(created.id))],
            pagination: prev.pagination ? {
              ...prev.pagination,
              total: (prev.pagination.total || 0) + 1
            } : prev.pagination
          };
        });
      }
      if (avatarFile && created?.id) {
        const res = await Admin_Upload_User_Avatar(created.id, avatarFile).catch(() => null);
        if (res?.data?.data?.avatar_url) {
          const updatedAvatarUrl = res.data.data.avatar_url;
          setUsers(prev => prev.map(u => String(u.id) === String(created.id) ? { ...u, avatar_url: updatedAvatarUrl } : u));
          setServerData(prev => {
            if (!prev || !Array.isArray(prev.data)) return prev;
            return {
              ...prev,
              data: prev.data.map(u => String(u.id) === String(created.id) ? { ...u, avatar_url: updatedAvatarUrl } : u)
            };
          });
        }
      }
      setShowAddModal(false);
      setNewUser({ name: '', email: '', phone: '', role_id: 2, branch_id: 1, password: 'password123' });
      setAvatarFile(null);
      fetchBackendUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
      setAddPhoneError(err?.data?.message || err?.message || 'Error creating user in database');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = String(editUser.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setEditPhoneError('Phone number must be exactly 10 digits (e.g. 9876543210)');
      return;
    }
    setEditPhoneError('');
    setIsSubmitting(true);
    try {
      const res = await Admin_Update_User(editUser.id, {
        name: editUser.name,
        email: editUser.email,
        phone: cleanPhone,
        role_id: editUser.role_id,
        branch_id: editUser.branch_id,
      }).catch(() => null);
      if (res?.data?.data) {
        setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...res.data.data } : u));
      } else {
        setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...editUser, phone: cleanPhone } : u));
      }
      setEditUser(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    await Admin_Toggle_User_Status(userId).catch(() => null);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u));
  };

  const handleDeleteConfirm = async () => {
    if (deleteUser) {
      const targetId = deleteUser.id;
      await Admin_Delete_User(targetId).catch(() => null);
      setUsers(prev => prev.filter(u => String(u.id) !== String(targetId)));
      setServerData(prev => {
        if (!prev || !Array.isArray(prev.data)) return prev;
        return {
          ...prev,
          data: prev.data.filter(u => String(u.id) !== String(targetId)),
          pagination: prev.pagination ? {
            ...prev.pagination,
            total: Math.max(0, (prev.pagination.total || 1) - 1)
          } : prev.pagination
        };
      });
      setDeleteUser(null);
    }
  };

  // ─── Source of Truth & Filter ───
  const baseList = (serverData?.data && Array.isArray(serverData.data)) ? serverData.data : users;
  const isMaster = Boolean(
    currentUser?.is_super_admin === true ||
    currentUser?.email === 'admin@saloon.com' ||
    String(currentUser?.role || currentUser?.role_name || '').toLowerCase() === 'super admin' ||
    String(currentUser?.role || currentUser?.role_name || '').toLowerCase() === 'superadmin'
  );
  const availableRoles = isMaster ? roles : roles.filter(r => r.id !== 1 && r.name !== 'Admin' && r.name !== 'Super Admin');

  const rawList = baseList.filter(user => {
    if (!user) return false;

    if (!isMaster && currentUser) {
      const isSelf = String(user.id) === String(currentUser.id) || user.email === currentUser.email;
      if (isSelf) return true;

      // 1. Hide Super Admin
      if (user.is_super_admin || user.email === 'admin@saloon.com' || String(user.role || user.role_name || '').toLowerCase().includes('super')) {
        return false;
      }

      // 2. Hide other Salon Admins
      const uRole = String(user.role || user.role_name || '').toLowerCase();
      if ((user.role_id === 1 || uRole === 'admin') && !isSelf) {
        return false;
      }

      // 3. Multi-Tenant Scoping: Staff must belong to this Salon Admin
      if (user.admin_id && String(user.admin_id) === String(currentUser.id)) return true;
      if (user.created_by_user_id && String(user.created_by_user_id) === String(currentUser.id)) return true;

      const myBranchIds = new Set(
        branches
          .filter(b => b && (String(b.admin_id) === String(currentUser.id) || String(b.created_by_user_id) === String(currentUser.id)))
          .map(b => String(b.id))
      );
      if (user.branch_id && myBranchIds.has(String(user.branch_id))) return true;

      // Staff from another Salon Admin is hidden
      return false;
    }

    if (selectedBranchId !== 'all' && user.branch_id && String(user.branch_id) !== String(selectedBranchId)) {
      return false;
    }
    return true;
  });

  const filteredUsers = rawList.filter(user => {
    if (serverData?.pagination) {
      return true; // Already filtered on backend
    }
    const uName = String(user.name ?? '').toLowerCase();
    const uEmail = String(user.email ?? '').toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchSearch = uName.includes(term) || uEmail.includes(term);
    const matchRole = roleFilter === 'All' || user.role_name === roleFilter;
    return matchSearch && matchRole;
  });

  const totalItems = serverData?.pagination?.total ?? filteredUsers.length;
  const isAll = pageSize === 'all';
  const effectivePageSize = isAll ? (totalItems || 1) : Number(pageSize);
  const totalPages = serverData?.pagination?.totalPages ?? (isAll || effectivePageSize === 0 ? 1 : Math.ceil(totalItems / effectivePageSize));
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  const isServerPaginated = Boolean(serverData?.pagination && serverData.pagination.limit === pageSize);
  const paginatedList = isServerPaginated ? filteredUsers : filteredUsers.slice((safePage - 1) * effectivePageSize, safePage * effectivePageSize);

  const startIndex = isAll || totalItems === 0 ? 0 : (safePage - 1) * (isServerPaginated ? Number(pageSize) : effectivePageSize);
  const endIndex = isAll ? totalItems : Math.min(startIndex + paginatedList.length, totalItems);

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
              onChange={handleSearchChange} 
            />
            {searchTerm && (
              <button 
                type="button" 
                className="search-input-clear-btn" 
                onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <select className="select-filter" value={roleFilter} onChange={handleRoleFilterChange}>
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Receptionist">Receptionist</option>
            <option value="Staff">Staff</option>
          </select>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            const initRole = availableRoles[0]?.id || 2;
            const initBranch = (initRole === 1 || availableRoles[0]?.name === 'Admin') ? null : (branches[0]?.id || 1);
            setNewUser({ name: '', email: '', phone: '', role_id: initRole, branch_id: initBranch, password: 'password123' });
            setAddPhoneError('');
            setShowAddModal(true);
          }}
        >
          <UserPlus size={14} /> Add New User / Staff
        </button>
      </div>

      {/* ─── Users Table ─── */}
      <div className="glass-panel" style={{ overflow: 'hidden', position: 'relative' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>User Profile</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Phone</th>
              <th>Login Password</th>
              <th>Status</th>
              <th style={{ textAlign: 'right', paddingRight: '18px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingBackend ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '54px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                    <Loader2 size={36} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--accent)' }} />
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-sub)', fontWeight: '700', letterSpacing: '0.02em' }}>
                      Fetching users from server... (Page {currentPage}, Limit {pageSize})
                    </span>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No users found.</td></tr>
            ) : paginatedList.map(user => (
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
                <td style={{ fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      letterSpacing: showPasswordMap[user.id] ? '0.05em' : '0.15em',
                      color: showPasswordMap[user.id] ? 'var(--accent-gold)' : 'var(--text-muted)',
                      fontWeight: showPasswordMap[user.id] ? '700' : '400'
                    }}>
                      {showPasswordMap[user.id] ? (user.password || 'admin123') : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPasswordMap(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-sub)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '3px'
                      }}
                      title={showPasswordMap[user.id] ? 'Hide Password' : 'Show Password'}
                    >
                      {showPasswordMap[user.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </td>
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

      {/* ─── Pagination Bar ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px',
        marginTop: '16px', padding: '12px 18px',
        background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: '12px'
      }}>
        {/* Left: Per Page Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: 'var(--text-sub)' }}>
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            disabled={loadingBackend}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '4px 10px', color: 'var(--text-main)',
              fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', outline: 'none',
              opacity: loadingBackend ? 0.6 : 1
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value="all">All</option>
          </select>
          {loadingBackend && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', color: 'var(--accent)', fontWeight: '600' }}>
              <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading...
            </span>
          )}
        </div>

        {/* Middle: Range Information */}
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>
          Showing {totalItems > 0 ? startIndex + 1 : 0} – {endIndex} of <strong style={{ color: 'var(--accent)' }}>{totalItems}</strong> users
        </div>

        {/* Right: Page Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            disabled={loadingBackend || isAll || safePage <= 1}
            onClick={() => setCurrentPage(1)}
            style={{
              padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)',
              background: (loadingBackend || isAll || safePage <= 1) ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
              color: (loadingBackend || isAll || safePage <= 1) ? 'var(--text-muted)' : 'var(--text-main)',
              cursor: (loadingBackend || isAll || safePage <= 1) ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: '600',
              opacity: (loadingBackend || isAll || safePage <= 1) ? 0.4 : 1
            }}
            title="First Page"
          >
            « First
          </button>

          <button
            disabled={loadingBackend || isAll || safePage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            style={{
              padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border)',
              background: (loadingBackend || isAll || safePage <= 1) ? 'rgba(255,255,255,0.02)' : 'rgba(0,230,118,0.12)',
              color: (loadingBackend || isAll || safePage <= 1) ? 'var(--text-muted)' : 'var(--accent)',
              borderColor: (loadingBackend || isAll || safePage <= 1) ? 'var(--border)' : 'rgba(0,230,118,0.4)',
              cursor: (loadingBackend || isAll || safePage <= 1) ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: '700',
              opacity: (loadingBackend || isAll || safePage <= 1) ? 0.4 : 1
            }}
          >
            ‹ Previous
          </button>

          {!isAll && Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
            .map((p, idx, arr) => {
              const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
              return (
                <React.Fragment key={p}>
                  {showEllipsis && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0 2px' }}>...</span>}
                  <button
                    disabled={loadingBackend}
                    onClick={() => setCurrentPage(p)}
                    style={{
                      padding: '6px 12px', borderRadius: '8px',
                      border: p === safePage ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: p === safePage ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                      color: p === safePage ? '#000' : 'var(--text-main)',
                      fontWeight: p === safePage ? '800' : '600',
                      cursor: loadingBackend ? 'not-allowed' : 'pointer', fontSize: '0.82rem',
                      opacity: loadingBackend ? 0.6 : 1
                    }}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            disabled={loadingBackend || isAll || safePage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            style={{
              padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border)',
              background: (loadingBackend || isAll || safePage >= totalPages) ? 'rgba(255,255,255,0.02)' : 'rgba(0,230,118,0.12)',
              color: (loadingBackend || isAll || safePage >= totalPages) ? 'var(--text-muted)' : 'var(--accent)',
              borderColor: (loadingBackend || isAll || safePage >= totalPages) ? 'var(--border)' : 'rgba(0,230,118,0.4)',
              cursor: (loadingBackend || isAll || safePage >= totalPages) ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: '700',
              opacity: (loadingBackend || isAll || safePage >= totalPages) ? 0.4 : 1
            }}
          >
            Next ›
          </button>
        </div>
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
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Phone Number *</span>
                  <span style={{ fontSize: '0.72rem', color: (newUser.phone?.length === 10) ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                    {newUser.phone?.length || 0}/10 Digits
                  </span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                  value={newUser.phone}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNewUser({ ...newUser, phone: digits });
                    if (digits.length > 0 && digits.length < 10) {
                      setAddPhoneError(`Phone number must be 10 digits (${digits.length}/10)`);
                    } else {
                      setAddPhoneError('');
                    }
                  }}
                  style={{
                    borderColor: addPhoneError ? '#ef4444' : (newUser.phone?.length === 10) ? 'rgba(0,230,118,0.5)' : undefined
                  }}
                />
                {addPhoneError && (
                  <div style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ⚠️ {addPhoneError}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Login Password *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Assign password for branch user..."
                    value={newUser.password || ''}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    style={{ paddingRight: '42px', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      transition: 'color 0.2s',
                    }}
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff size={16} style={{ color: 'var(--accent-gold)' }} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Assign Role</label>
                  <select
                    value={newUser.role_id}
                    onChange={e => {
                      const rid = parseInt(e.target.value);
                      const rObj = availableRoles.find(r => r.id === rid);
                      const isAdmin = rObj?.name === 'Admin' || rid === 1;
                      setNewUser({
                        ...newUser,
                        role_id: rid,
                        branch_id: isAdmin ? null : (newUser.branch_id || branches[0]?.id || 1)
                      });
                    }}
                  >
                    {availableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assign Branch</label>
                  {(roles.find(r => r.id === newUser.role_id)?.name === 'Admin' || newUser.role_id === 1) ? (
                    <div style={{
                      padding: '8px 12px',
                      background: 'rgba(0, 230, 118, 0.08)',
                      border: '1px solid rgba(0, 230, 118, 0.25)',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      color: 'var(--accent-gold)',
                      fontWeight: '700',
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      🌐 Master Owner (No Branch Needed)
                    </div>
                  ) : (
                    <select
                      value={newUser.branch_id == null ? (branches[0]?.id || '') : newUser.branch_id}
                      onChange={e => setNewUser({ ...newUser, branch_id: e.target.value ? parseInt(e.target.value) : null })}
                    >
                      {branches.map(b => <option key={b.id} value={b.id}>🏢 {b.name}</option>)}
                    </select>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => { setShowAddModal(false); setAvatarFile(null); }} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)', fontSize: '0.8rem' }}>Cancel</button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isSubmitting ? 0.75 : 1,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Creating...
                    </>
                  ) : (
                    'Save & Create User'
                  )}
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
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Phone Number *</span>
                  <span style={{ fontSize: '0.72rem', color: (editUser.phone?.length === 10) ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                    {editUser.phone?.length || 0}/10 Digits
                  </span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  value={editUser.phone || ''}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setEditUser({ ...editUser, phone: digits });
                    if (digits.length > 0 && digits.length < 10) {
                      setEditPhoneError(`Phone number must be 10 digits (${digits.length}/10)`);
                    } else {
                      setEditPhoneError('');
                    }
                  }}
                  style={{
                    borderColor: editPhoneError ? '#ef4444' : (editUser.phone?.length === 10) ? 'rgba(0,230,118,0.5)' : undefined
                  }}
                />
                {editPhoneError && (
                  <div style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ⚠️ {editPhoneError}
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={editUser.role_id}
                    onChange={e => {
                      const rid = parseInt(e.target.value);
                      const rObj = availableRoles.find(r => r.id === rid);
                      const isAdmin = rObj?.name === 'Admin' || rid === 1;
                      setEditUser({
                        ...editUser,
                        role_id: rid,
                        branch_id: isAdmin ? null : (editUser.branch_id || branches[0]?.id || 1)
                      });
                    }}
                  >
                    {availableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Branch</label>
                  {(roles.find(r => r.id === editUser.role_id)?.name === 'Admin' || editUser.role_id === 1) ? (
                    <div style={{
                      padding: '8px 12px',
                      background: 'rgba(0, 230, 118, 0.08)',
                      border: '1px solid rgba(0, 230, 118, 0.25)',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      color: 'var(--accent-gold)',
                      fontWeight: '700',
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      🌐 Master Owner (No Branch Needed)
                    </div>
                  ) : (
                    <select
                      value={editUser.branch_id || ''}
                      onChange={e => setEditUser({ ...editUser, branch_id: parseInt(e.target.value) })}
                    >
                      {branches.map(b => <option key={b.id} value={b.id}>🏢 {b.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setEditUser(null)} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)', fontSize: '0.8rem' }}>Cancel</button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isSubmitting ? 0.75 : 1,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
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
