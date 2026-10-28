import React, { useState, useRef, useEffect } from 'react';
import {
  UserPlus, Search, Building, CheckCircle2, XCircle,
  Camera, Trash2, Edit3, ShieldOff, ShieldCheck, X, Upload, Loader2,
  Eye, EyeOff, Phone, Mail, Scissors, Clock, Copy, Check
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
import StaffServicesSelector from '../components/StaffServicesSelector';

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
function UsersManagementView({ users: initialUsers, branches, roles, services = [], onAddUser, selectedBranchId = 'all', currentUser }) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Helper to detect if a role represents staff / stylist
  const isStaffRole = (roleId) => {
    const rObj = (roles || []).find(r => r.id === parseInt(roleId));
    const rName = String(rObj?.name || '').toLowerCase();
    return parseInt(roleId) === 4 || rName.includes('staff') || rName.includes('stylist') || rName.includes('artist');
  };

  // Filter branches strictly to branches belonging to / created by this admin
  const adminBranches = React.useMemo(() => {
    if (!branches || !Array.isArray(branches)) return [];
    if (!currentUser) return branches;
    const roleStr = String(currentUser.role || currentUser.role_name || '').toLowerCase();
    const isSuper = currentUser.is_super_admin === true || currentUser.email === 'admin@saloon.com' || roleStr.includes('super');
    if (isSuper) return branches;

    const isSalonOwner = !isSuper && (currentUser.role_id === 1 || roleStr.includes('admin') || roleStr.includes('owner'));
    const curAdminId = String(
      isSalonOwner
        ? (currentUser.id || currentUser.admin_id || '')
        : (currentUser.admin_id || currentUser.created_by_user_id || currentUser.id || '')
    );

    const filtered = branches.filter(b => {
      const bAdmin = String(b.admin_id || b.created_by_user_id || b.created_by_admin_id || b.owner_id || b.created_by || '');
      const bCreator = String(b.created_by_user_id || b.created_by || '');
      return bAdmin === curAdminId || bCreator === curAdminId || (currentUser.branch_id && String(b.id) === String(currentUser.branch_id));
    });
    return filtered.length > 0 ? filtered : branches;
  }, [branches, currentUser]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);       // user object being edited
  const [deleteUser, setDeleteUser] = useState(null);   // user to confirm delete

  // Add form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role_id: 2,
    branch_id: 1,
    password: 'password123',
    manager_access_mode: 'all',
    allowed_branch_ids: [],
    specialization: '',
    service_ids: []
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addPhoneError, setAddPhoneError] = useState('');
  const [editPhoneError, setEditPhoneError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [viewingUser, setViewingUser] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

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
      const isMgr = (parseInt(newUser.role_id) === 2 || roles.find(r => r.id === parseInt(newUser.role_id))?.name === 'Manager');
      const isRec = (parseInt(newUser.role_id) === 3 || roles.find(r => r.id === parseInt(newUser.role_id))?.name === 'Receptionist');
      let allowedBranches = [];
      if (isMgr) {
        if (newUser.manager_access_mode === 'all') {
          allowedBranches = [];
        } else {
          allowedBranches = (newUser.allowed_branch_ids || []).map(Number).filter(n => !isNaN(n));
        }
      } else if (isRec) {
        if (newUser.manager_access_mode === 'all') {
          allowedBranches = adminBranches.map(b => b.id);
        } else if (newUser.manager_access_mode === 'specific') {
          allowedBranches = (newUser.allowed_branch_ids || []).map(Number).filter(n => !isNaN(n));
          if (allowedBranches.length === 0 && newUser.branch_id) {
            allowedBranches = [Number(newUser.branch_id)];
          }
        } else {
          // single
          const primary = Number(newUser.branch_id || adminBranches[0]?.id);
          allowedBranches = primary ? [primary] : [];
        }
      }

      const primaryBranchId = (parseInt(newUser.role_id) === 1 || newUser.role_id === '1')
        ? null
        : (isMgr && allowedBranches.length > 0
            ? allowedBranches[0]
            : (isRec && allowedBranches.length > 0
                ? (allowedBranches.includes(Number(newUser.branch_id)) ? Number(newUser.branch_id) : allowedBranches[0])
                : (newUser.branch_id ? parseInt(newUser.branch_id) : (adminBranches[0]?.id || 1))));

      const payload = {
        ...newUser,
        phone: cleanPhone,
        role_id: parseInt(newUser.role_id),
        branch_id: primaryBranchId,
        allowed_branch_ids: allowedBranches
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
      setNewUser({ name: '', email: '', phone: '', role_id: 2, branch_id: 1, password: 'password123', manager_access_mode: 'all', allowed_branch_ids: [], specialization: '', service_ids: [] });
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
      const isMgr = (parseInt(editUser.role_id) === 2 || roles.find(r => r.id === parseInt(editUser.role_id))?.name === 'Manager');
      const isRec = (parseInt(editUser.role_id) === 3 || roles.find(r => r.id === parseInt(editUser.role_id))?.name === 'Receptionist');
      let allowedBranches = [];
      if (isMgr) {
        if (editUser.manager_access_mode === 'all') {
          allowedBranches = [];
        } else {
          allowedBranches = (editUser.allowed_branch_ids || []).map(Number).filter(n => !isNaN(n));
        }
      } else if (isRec) {
        if (editUser.manager_access_mode === 'all') {
          allowedBranches = adminBranches.map(b => b.id);
        } else if (editUser.manager_access_mode === 'specific') {
          allowedBranches = (editUser.allowed_branch_ids || []).map(Number).filter(n => !isNaN(n));
          if (allowedBranches.length === 0 && editUser.branch_id) {
            allowedBranches = [Number(editUser.branch_id)];
          }
        } else {
          // single
          const primary = Number(editUser.branch_id || adminBranches[0]?.id);
          allowedBranches = primary ? [primary] : [];
        }
      }

      const primaryBranchId = (parseInt(editUser.role_id) === 1 || editUser.role_id === '1')
        ? null
        : (isMgr && allowedBranches.length > 0
            ? allowedBranches[0]
            : (isRec && allowedBranches.length > 0
                ? (allowedBranches.includes(Number(editUser.branch_id)) ? Number(editUser.branch_id) : allowedBranches[0])
                : (editUser.branch_id || adminBranches[0]?.id || 1)));

      const res = await Admin_Update_User(editUser.id, {
        name: editUser.name,
        email: editUser.email,
        phone: cleanPhone,
        role_id: editUser.role_id,
        branch_id: primaryBranchId,
        allowed_branch_ids: allowedBranches,
        specialization: editUser.specialization || '',
        service_ids: editUser.service_ids || []
      }).catch(() => null);
      if (res?.data?.data) {
        setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...res.data.data, allowed_branch_ids: allowedBranches } : u));
      } else {
        setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...editUser, phone: cleanPhone, allowed_branch_ids: allowedBranches } : u));
      }
      setEditUser(null);
      fetchBackendUsers();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    await Admin_Toggle_User_Status(userId).catch(() => null);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u));
    setViewingUser(prev => prev && prev.id === userId ? { ...prev, is_active: !prev.is_active } : prev);
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard?.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getUserAssignedServices = (u) => {
    if (!u) return [];
    let ids = u.service_ids;
    if (typeof ids === 'string') {
      try { ids = JSON.parse(ids); } catch (e) { ids = []; }
    }
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const numIds = ids.map(id => Number(id));
    return (services || []).filter(s => numIds.includes(Number(s.id)));
  };

  const openEditUserModal = (user) => {
    let allowed = user.allowed_branch_ids;
    if (typeof allowed === 'string') {
      try { allowed = JSON.parse(allowed); } catch (e) { allowed = []; }
    }
    const isMgr = (user.role_id === 2 || roles.find(r => r.id === user.role_id)?.name === 'Manager');
    const isRec = (user.role_id === 3 || roles.find(r => r.id === user.role_id)?.name === 'Receptionist');
    let mode = 'single';
    if (isMgr) {
      mode = (Array.isArray(allowed) && allowed.length > 0) ? 'specific' : 'all';
    } else if (isRec) {
      if (Array.isArray(allowed) && allowed.length > 1) {
        mode = (adminBranches.length > 0 && allowed.length >= adminBranches.length) ? 'all' : 'specific';
      } else {
        mode = 'single';
      }
    }
    let parsedServices = [];
    if (Array.isArray(user.service_ids)) {
      parsedServices = user.service_ids;
    } else if (typeof user.service_ids === 'string') {
      try { parsedServices = JSON.parse(user.service_ids); } catch(e) {}
    }
    setEditUser({
      ...user,
      specialization: user.specialization || '',
      service_ids: parsedServices,
      manager_access_mode: mode,
      allowed_branch_ids: Array.isArray(allowed) && allowed.length > 0 ? allowed : (user.branch_id ? [user.branch_id] : [])
    });
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
        adminBranches.map(b => String(b.id))
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
            const initBranch = (initRole === 1 || availableRoles[0]?.name === 'Admin') ? null : (adminBranches[0]?.id || 1);
            setNewUser({
              name: '',
              email: '',
              phone: '',
              role_id: initRole,
              branch_id: initBranch,
              password: 'password123',
              manager_access_mode: (initRole === 2) ? 'all' : 'single',
              allowed_branch_ids: (initRole === 2) ? adminBranches.map(b => b.id) : (initBranch ? [initBranch] : [])
            });
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
                  <div
                    onClick={() => setViewingUser(user)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                    title="Click to view full staff details"
                  >
                    <UserAvatar user={user} size={34} onUpload={handleAvatarUpload} />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.84rem', color: '#f8fafc', transition: 'color 0.15s' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`role-tag ${user.role_name?.toLowerCase() || 'staff'}`}>
                    {user.role_name || 'Staff'}
                  </span>
                  {user.specialization && (
                    <div
                      style={{
                        fontSize: '0.66rem',
                        color: '#818cf8',
                        marginTop: '3px',
                        maxWidth: '180px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: '600'
                      }}
                      title={user.specialization}
                    >
                      ✂️ {user.specialization}
                    </div>
                  )}
                </td>
                <td>
                  {(() => {
                    const isAdm = roles.find(r => r.id === user.role_id)?.name === 'Admin' || user.role_id === 1;
                    const isMgr = roles.find(r => r.id === user.role_id)?.name === 'Manager' || user.role_id === 2;
                    const isRec = roles.find(r => r.id === user.role_id)?.name === 'Receptionist' || user.role_id === 3;
                    if (isAdm) {
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: '700' }}>
                          <Building size={12} /> 🌐 Master Owner
                        </div>
                      );
                    }
                    if (isMgr) {
                      let allowed = user.allowed_branch_ids;
                      if (typeof allowed === 'string') {
                        try { allowed = JSON.parse(allowed); } catch (e) { allowed = []; }
                      }
                      if (Array.isArray(allowed) && allowed.length > 0) {
                        const matchedBranches = adminBranches.filter(b => allowed.map(String).includes(String(b.id)));
                        const names = matchedBranches.map(b => b.name).join(', ');
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }} title={names || 'Selected Branches'}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#38bdf8', fontWeight: '700' }}>
                              <Building size={12} /> 🏢 {matchedBranches.length} Permitted {matchedBranches.length === 1 ? 'Branch' : 'Branches'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {names || `Branches: ${allowed.join(', ')}`}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#38bdf8', fontWeight: '700' }}>
                          <Building size={12} /> 🌐 All Salon Branches
                        </div>
                      );
                    }
                    if (isRec) {
                      let allowed = user.allowed_branch_ids;
                      if (typeof allowed === 'string') {
                        try { allowed = JSON.parse(allowed); } catch (e) { allowed = []; }
                      }
                      if (Array.isArray(allowed) && allowed.length > 1) {
                        const matchedBranches = adminBranches.filter(b => allowed.map(String).includes(String(b.id)));
                        const names = matchedBranches.map(b => b.name).join(', ');
                        const isAll = adminBranches.length > 0 && matchedBranches.length >= adminBranches.length;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }} title={names || 'Selected Branches'}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#c084fc', fontWeight: '700' }}>
                              <Building size={12} /> {isAll ? '🌐 All Salon Branches' : `🏢 ${matchedBranches.length} Branches Access`}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {names || `Branches: ${allowed.join(', ')}`}
                            </span>
                          </div>
                        );
                      }
                    }
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}>
                        <Building size={12} style={{ color: 'var(--accent-gold)' }} /> {user.branch_name || 'Main Salon'}
                      </div>
                    );
                  })()}
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
                    {/* View Details Button */}
                    <button
                      className="action-icon-btn view"
                      onClick={() => setViewingUser(user)}
                      title="View Staff Details"
                    >
                      <Eye size={14} />
                    </button>

                    {/* Edit User Button */}
                    <button
                      className="action-icon-btn edit"
                      onClick={() => openEditUserModal(user)}
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
          <div className="glass-panel modal-content" style={{ maxWidth: '760px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Add New System User</h3>
              <button onClick={() => { setShowAddModal(false); setAvatarFile(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-sub)', marginBottom: '6px', display: 'block' }}>
                Profile Photo <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(Optional)</span>
              </label>
              <AvatarUploadZone previewFile={avatarFile} onFileSelect={setAvatarFile} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Full Name</label>
                  <input type="text" required placeholder="e.g. Vikram Malhotra" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Email Address</label>
                  <input type="email" required placeholder="vikram@saloon.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
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

                <div className="form-group" style={{ margin: 0 }}>
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
                      const isMgr = rObj?.name === 'Manager' || rid === 2;
                      const isRec = rObj?.name === 'Receptionist' || rid === 3;
                      const fallbackBranch = newUser.branch_id || adminBranches[0]?.id || 1;
                      setNewUser({
                        ...newUser,
                        role_id: rid,
                        branch_id: isAdmin ? null : fallbackBranch,
                        manager_access_mode: isMgr ? 'all' : (isRec ? 'single' : 'single'),
                        allowed_branch_ids: isMgr ? [] : (isRec ? [fallbackBranch] : [])
                      });
                    }}
                  >
                    {availableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    {((roles.find(r => r.id === newUser.role_id)?.name === 'Receptionist') || newUser.role_id === 3) ? 'Primary Assigned Branch' : 'Assign Branch'}
                  </label>
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
                  ) : ((roles.find(r => r.id === newUser.role_id)?.name === 'Manager') || newUser.role_id === 2) ? (
                    <div style={{
                      padding: '8px 12px',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      color: '#38bdf8',
                      fontWeight: '700',
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      👑 Multi-Branch Manager (Set Below)
                    </div>
                  ) : (
                    <select
                      value={newUser.branch_id == null ? (adminBranches[0]?.id || '') : newUser.branch_id}
                      onChange={e => {
                        const bId = e.target.value ? parseInt(e.target.value) : null;
                        const isRecRole = (roles.find(r => r.id === newUser.role_id)?.name === 'Receptionist') || newUser.role_id === 3;
                        setNewUser(prev => ({
                          ...prev,
                          branch_id: bId,
                          allowed_branch_ids: (isRecRole && (prev.manager_access_mode === 'single' || !prev.manager_access_mode))
                            ? (bId ? [bId] : [])
                            : prev.allowed_branch_ids
                        }));
                      }}
                    >
                      {adminBranches.map(b => <option key={b.id} value={b.id}>🏢 {b.name}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* Manager Multi-Branch Permission Scope Selector */}
              {((roles.find(r => r.id === newUser.role_id)?.name === 'Manager') || newUser.role_id === 2) && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <Building size={14} /> Manager Branch Access Control
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Branch Permission Scope
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginBottom: newUser.manager_access_mode === 'specific' ? '10px' : '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '700', color: newUser.manager_access_mode === 'all' ? 'var(--accent-gold)' : 'var(--text-sub)' }}>
                      <input
                        type="radio"
                        name="add_manager_branch_mode"
                        checked={newUser.manager_access_mode === 'all'}
                        onChange={() => setNewUser({ ...newUser, manager_access_mode: 'all', allowed_branch_ids: [] })}
                      />
                      <span>🌐 All Branches (Full Access)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '700', color: newUser.manager_access_mode === 'specific' ? 'var(--accent-gold)' : 'var(--text-sub)' }}>
                      <input
                        type="radio"
                        name="add_manager_branch_mode"
                        checked={newUser.manager_access_mode === 'specific'}
                        onChange={() => {
                          const initialBranches = adminBranches.slice(0, 1).map(b => b.id);
                          setNewUser({ ...newUser, manager_access_mode: 'specific', allowed_branch_ids: initialBranches, branch_id: initialBranches[0] || null });
                        }}
                      />
                      <span>🏢 Specific Branches Only</span>
                    </label>
                  </div>

                  {newUser.manager_access_mode === 'specific' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', maxHeight: '130px', overflowY: 'auto' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        Check which branches this manager is permitted to access:
                      </span>
                      {adminBranches.map(b => {
                        const isChecked = (newUser.allowed_branch_ids || []).map(String).includes(String(b.id));
                        return (
                          <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', cursor: 'pointer', padding: '2px 0' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const currentSet = new Set((newUser.allowed_branch_ids || []).map(String));
                                if (e.target.checked) currentSet.add(String(b.id));
                                else currentSet.delete(String(b.id));
                                const newArr = Array.from(currentSet).map(Number);
                                setNewUser({ ...newUser, allowed_branch_ids: newArr, branch_id: newArr[0] || null });
                              }}
                            />
                            <span style={{ fontWeight: isChecked ? '700' : '500', color: isChecked ? 'var(--text-main)' : 'var(--text-sub)' }}>
                              🏢 {b.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({b.code || `ID:${b.id}`})</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Receptionist Multi-Branch Permission Scope Selector */}
              {((roles.find(r => r.id === newUser.role_id)?.name === 'Receptionist') || newUser.role_id === 3) && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  background: 'rgba(168, 85, 247, 0.05)',
                  border: '1px solid rgba(168, 85, 247, 0.28)',
                  borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <Building size={14} /> Receptionist Branch Access Control
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Multi-Branch Policy
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: newUser.manager_access_mode === 'specific' ? '10px' : '4px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '700', color: (newUser.manager_access_mode === 'single' || !newUser.manager_access_mode) ? '#a855f7' : 'var(--text-sub)' }}>
                        <input
                          type="radio"
                          name="add_receptionist_branch_mode"
                          checked={newUser.manager_access_mode === 'single' || !newUser.manager_access_mode}
                          onChange={() => {
                            const primary = newUser.branch_id || adminBranches[0]?.id || 1;
                            setNewUser({ ...newUser, manager_access_mode: 'single', allowed_branch_ids: [primary], branch_id: primary });
                          }}
                        />
                        <span>🏢 Single Assigned Branch Only</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '700', color: newUser.manager_access_mode === 'specific' ? '#a855f7' : 'var(--text-sub)' }}>
                        <input
                          type="radio"
                          name="add_receptionist_branch_mode"
                          checked={newUser.manager_access_mode === 'specific'}
                          onChange={() => {
                            const primary = newUser.branch_id || adminBranches[0]?.id || 1;
                            const initial = (newUser.allowed_branch_ids && newUser.allowed_branch_ids.length > 0)
                              ? newUser.allowed_branch_ids
                              : [primary];
                            setNewUser({ ...newUser, manager_access_mode: 'specific', allowed_branch_ids: initial, branch_id: primary });
                          }}
                        />
                        <span>🏢 Specific Branches Only</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '700', color: newUser.manager_access_mode === 'all' ? '#a855f7' : 'var(--text-sub)' }}>
                        <input
                          type="radio"
                          name="add_receptionist_branch_mode"
                          checked={newUser.manager_access_mode === 'all'}
                          onChange={() => setNewUser({ ...newUser, manager_access_mode: 'all', allowed_branch_ids: adminBranches.map(b => b.id) })}
                        />
                        <span>🌐 All Salon Branches</span>
                      </label>
                    </div>

                    {(newUser.manager_access_mode === 'single' || !newUser.manager_access_mode) && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '6px' }}>
                        🔒 <strong>Single Branch:</strong> Receptionist will only see & manage customers/appointments of their assigned branch (<em>{adminBranches.find(b => String(b.id) === String(newUser.branch_id))?.name || 'Assigned'}</em>).
                      </div>
                    )}

                    {newUser.manager_access_mode === 'all' && (
                      <div style={{ fontSize: '0.72rem', color: '#c084fc', background: 'rgba(168, 85, 247, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                        🌐 <strong>All Salon Branches:</strong> Receptionist has full multi-branch access to switch between all {adminBranches.length} branches.
                      </div>
                    )}
                  </div>

                  {newUser.manager_access_mode === 'specific' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', maxHeight: '130px', overflowY: 'auto' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        Select which branches this receptionist is permitted to access ({newUser.allowed_branch_ids?.length || 0} selected):
                      </span>
                      {adminBranches.map(b => {
                        const isChecked = (newUser.allowed_branch_ids || []).map(String).includes(String(b.id));
                        return (
                          <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', cursor: 'pointer', padding: '2px 0' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const currentSet = new Set((newUser.allowed_branch_ids || []).map(String));
                                if (e.target.checked) currentSet.add(String(b.id));
                                else currentSet.delete(String(b.id));
                                const newArr = Array.from(currentSet).map(Number);
                                setNewUser({
                                  ...newUser,
                                  allowed_branch_ids: newArr,
                                  branch_id: newArr.includes(Number(newUser.branch_id)) ? newUser.branch_id : (newArr[0] || newUser.branch_id)
                                });
                              }}
                            />
                            <span style={{ fontWeight: isChecked ? '700' : '500', color: isChecked ? 'var(--text-main)' : 'var(--text-sub)' }}>
                              🏢 {b.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({b.code || `ID:${b.id}`})</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Staff / Stylist Specialized Services Multi-Selector */}
              {isStaffRole(newUser.role_id) && (
                <StaffServicesSelector
                  services={services}
                  selectedServiceIds={newUser.service_ids}
                  specialization={newUser.specialization}
                  onChange={({ service_ids, specialization }) => setNewUser(prev => ({ ...prev, service_ids, specialization }))}
                />
              )}

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
          <div className="glass-panel modal-content" style={{ maxWidth: '760px', width: '100%' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Full Name</label>
                  <input type="text" required value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Email Address</label>
                  <input type="email" required value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
                </div>
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
                      const isMgr = rObj?.name === 'Manager' || rid === 2;
                      const isRec = rObj?.name === 'Receptionist' || rid === 3;
                      const fallbackBranch = editUser.branch_id || adminBranches[0]?.id || 1;
                      setEditUser({
                        ...editUser,
                        role_id: rid,
                        branch_id: isAdmin ? null : fallbackBranch,
                        manager_access_mode: isMgr ? (editUser.manager_access_mode || 'all') : (isRec ? (editUser.manager_access_mode || 'single') : 'single'),
                        allowed_branch_ids: isMgr ? (editUser.allowed_branch_ids || []) : (isRec ? (editUser.allowed_branch_ids?.length ? editUser.allowed_branch_ids : [fallbackBranch]) : [])
                      });
                    }}
                  >
                    {availableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    {((roles.find(r => r.id === editUser.role_id)?.name === 'Receptionist') || editUser.role_id === 3) ? 'Primary Assigned Branch' : 'Branch'}
                  </label>
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
                  ) : ((roles.find(r => r.id === editUser.role_id)?.name === 'Manager') || editUser.role_id === 2) ? (
                    <div style={{
                      padding: '8px 12px',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      color: '#38bdf8',
                      fontWeight: '700',
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      👑 Multi-Branch Manager (Set Below)
                    </div>
                  ) : (
                    <select
                      value={editUser.branch_id == null ? (adminBranches[0]?.id || '') : editUser.branch_id}
                      onChange={e => {
                        const bId = e.target.value ? parseInt(e.target.value) : null;
                        const isRecRole = (roles.find(r => r.id === editUser.role_id)?.name === 'Receptionist') || editUser.role_id === 3;
                        setEditUser(prev => ({
                          ...prev,
                          branch_id: bId,
                          allowed_branch_ids: (isRecRole && (prev.manager_access_mode === 'single' || !prev.manager_access_mode))
                            ? (bId ? [bId] : [])
                            : prev.allowed_branch_ids
                        }));
                      }}
                    >
                      {adminBranches.map(b => <option key={b.id} value={b.id}>🏢 {b.name}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* Manager Multi-Branch Permission Scope Selector for Edit */}
              {((roles.find(r => r.id === editUser.role_id)?.name === 'Manager') || editUser.role_id === 2) && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <Building size={14} /> Manager Branch Access Control
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Branch Permission Scope
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginBottom: editUser.manager_access_mode === 'specific' ? '10px' : '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '700', color: editUser.manager_access_mode === 'all' ? 'var(--accent-gold)' : 'var(--text-sub)' }}>
                      <input
                        type="radio"
                        name="edit_manager_branch_mode"
                        checked={editUser.manager_access_mode === 'all'}
                        onChange={() => setEditUser({ ...editUser, manager_access_mode: 'all', allowed_branch_ids: [] })}
                      />
                      <span>🌐 All Branches (Full Access)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '700', color: editUser.manager_access_mode === 'specific' ? 'var(--accent-gold)' : 'var(--text-sub)' }}>
                      <input
                        type="radio"
                        name="edit_manager_branch_mode"
                        checked={editUser.manager_access_mode === 'specific'}
                        onChange={() => {
                          const initialBranches = (editUser.allowed_branch_ids && editUser.allowed_branch_ids.length > 0)
                            ? editUser.allowed_branch_ids
                            : (editUser.branch_id ? [editUser.branch_id] : adminBranches.slice(0, 1).map(b => b.id));
                          setEditUser({ ...editUser, manager_access_mode: 'specific', allowed_branch_ids: initialBranches, branch_id: initialBranches[0] || null });
                        }}
                      />
                      <span>🏢 Specific Branches Only</span>
                    </label>
                  </div>

                  {editUser.manager_access_mode === 'specific' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', maxHeight: '130px', overflowY: 'auto' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        Check which branches this manager is permitted to access:
                      </span>
                      {adminBranches.map(b => {
                        const isChecked = (editUser.allowed_branch_ids || []).map(String).includes(String(b.id));
                        return (
                          <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', cursor: 'pointer', padding: '2px 0' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const currentSet = new Set((editUser.allowed_branch_ids || []).map(String));
                                if (e.target.checked) currentSet.add(String(b.id));
                                else currentSet.delete(String(b.id));
                                const newArr = Array.from(currentSet).map(Number);
                                setEditUser({ ...editUser, allowed_branch_ids: newArr, branch_id: newArr[0] || null });
                              }}
                            />
                            <span style={{ fontWeight: isChecked ? '700' : '500', color: isChecked ? 'var(--text-main)' : 'var(--text-sub)' }}>
                              🏢 {b.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({b.code || `ID:${b.id}`})</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Receptionist Multi-Branch Permission Scope Selector for Edit */}
              {((roles.find(r => r.id === editUser.role_id)?.name === 'Receptionist') || editUser.role_id === 3) && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  background: 'rgba(168, 85, 247, 0.05)',
                  border: '1px solid rgba(168, 85, 247, 0.28)',
                  borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <Building size={14} /> Receptionist Branch Access Control
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Multi-Branch Policy
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: editUser.manager_access_mode === 'specific' ? '10px' : '4px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '700', color: (editUser.manager_access_mode === 'single' || !editUser.manager_access_mode) ? '#a855f7' : 'var(--text-sub)' }}>
                        <input
                          type="radio"
                          name="edit_receptionist_branch_mode"
                          checked={editUser.manager_access_mode === 'single' || !editUser.manager_access_mode}
                          onChange={() => {
                            const primary = editUser.branch_id || adminBranches[0]?.id || 1;
                            setEditUser({ ...editUser, manager_access_mode: 'single', allowed_branch_ids: [primary], branch_id: primary });
                          }}
                        />
                        <span>🏢 Single Assigned Branch Only</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '700', color: editUser.manager_access_mode === 'specific' ? '#a855f7' : 'var(--text-sub)' }}>
                        <input
                          type="radio"
                          name="edit_receptionist_branch_mode"
                          checked={editUser.manager_access_mode === 'specific'}
                          onChange={() => {
                            const primary = editUser.branch_id || adminBranches[0]?.id || 1;
                            const initial = (editUser.allowed_branch_ids && editUser.allowed_branch_ids.length > 0)
                              ? editUser.allowed_branch_ids
                              : [primary];
                            setEditUser({ ...editUser, manager_access_mode: 'specific', allowed_branch_ids: initial, branch_id: primary });
                          }}
                        />
                        <span>🏢 Specific Branches Only</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '700', color: editUser.manager_access_mode === 'all' ? '#a855f7' : 'var(--text-sub)' }}>
                        <input
                          type="radio"
                          name="edit_receptionist_branch_mode"
                          checked={editUser.manager_access_mode === 'all'}
                          onChange={() => setEditUser({ ...editUser, manager_access_mode: 'all', allowed_branch_ids: adminBranches.map(b => b.id) })}
                        />
                        <span>🌐 All Salon Branches</span>
                      </label>
                    </div>

                    {(editUser.manager_access_mode === 'single' || !editUser.manager_access_mode) && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '6px' }}>
                        🔒 <strong>Single Branch:</strong> Receptionist will only see & manage customers/appointments of their assigned branch (<em>{adminBranches.find(b => String(b.id) === String(editUser.branch_id))?.name || 'Assigned'}</em>).
                      </div>
                    )}

                    {editUser.manager_access_mode === 'all' && (
                      <div style={{ fontSize: '0.72rem', color: '#c084fc', background: 'rgba(168, 85, 247, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                        🌐 <strong>All Salon Branches:</strong> Receptionist has full multi-branch access to switch between all {adminBranches.length} branches.
                      </div>
                    )}
                  </div>

                  {editUser.manager_access_mode === 'specific' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', maxHeight: '130px', overflowY: 'auto' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        Select which branches this receptionist is permitted to access ({editUser.allowed_branch_ids?.length || 0} selected):
                      </span>
                      {adminBranches.map(b => {
                        const isChecked = (editUser.allowed_branch_ids || []).map(String).includes(String(b.id));
                        return (
                          <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', cursor: 'pointer', padding: '2px 0' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const currentSet = new Set((editUser.allowed_branch_ids || []).map(String));
                                if (e.target.checked) currentSet.add(String(b.id));
                                else currentSet.delete(String(b.id));
                                const newArr = Array.from(currentSet).map(Number);
                                setEditUser({
                                  ...editUser,
                                  allowed_branch_ids: newArr,
                                  branch_id: newArr.includes(Number(editUser.branch_id)) ? editUser.branch_id : (newArr[0] || editUser.branch_id)
                                });
                              }}
                            />
                            <span style={{ fontWeight: isChecked ? '700' : '500', color: isChecked ? 'var(--text-main)' : 'var(--text-sub)' }}>
                              🏢 {b.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({b.code || `ID:${b.id}`})</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Staff / Stylist Specialized Services Multi-Selector */}
              {isStaffRole(editUser.role_id) && (
                <StaffServicesSelector
                  services={services}
                  selectedServiceIds={editUser.service_ids}
                  specialization={editUser.specialization}
                  onChange={({ service_ids, specialization }) => setEditUser(prev => ({ ...prev, service_ids, specialization }))}
                />
              )}

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

      {/* ─── STAFF & USER DETAILS MODAL ─── */}
      {viewingUser && (
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <div
            className="glass-panel modal-content"
            style={{
              maxWidth: '740px',
              width: '100%',
              padding: '0',
              overflow: 'hidden',
              borderRadius: '18px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: '#0f172a',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            }}
          >
            {/* Top Banner Header */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '22px 24px',
              position: 'relative'
            }}>
              {/* Close Button */}
              <button
                onClick={() => setViewingUser(null)}
                style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#cbd5e1',
                  cursor: 'pointer'
                }}
                title="Close details"
              >
                <X size={16} />
              </button>

              {/* Profile Info in Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                {/* Avatar with status indicator */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '26px',
                    color: '#ffffff',
                    boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
                    border: '3px solid rgba(255, 255, 255, 0.2)',
                    overflow: 'hidden'
                  }}>
                    {viewingUser.avatar_url ? (
                      <img
                        src={`${BACKEND_URL}${viewingUser.avatar_url}`}
                        alt={viewingUser.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      viewingUser.name ? viewingUser.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  {/* Status Dot */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: viewingUser.is_active !== false ? '#22c55e' : '#ef4444',
                      border: '2px solid #0f172a',
                      boxShadow: viewingUser.is_active !== false ? '0 0 8px #22c55e' : '0 0 8px #ef4444'
                    }}
                    title={viewingUser.is_active !== false ? 'Status: Active' : 'Status: Blocked'}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                      {viewingUser.name}
                    </h2>
                    <span className={`role-tag ${viewingUser.role_name?.toLowerCase() || 'staff'}`} style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                      {viewingUser.role_name || 'Staff'}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      padding: '3px 9px',
                      borderRadius: '12px',
                      background: viewingUser.is_active !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: viewingUser.is_active !== false ? '#4ade80' : '#f87171',
                      border: `1px solid ${viewingUser.is_active !== false ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                      {viewingUser.is_active !== false ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {viewingUser.is_active !== false ? 'Active' : 'Blocked'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '0.78rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                    <span>User ID: <strong style={{ color: '#ffffff' }}>#{viewingUser.id}</strong></span>
                    <span>•</span>
                    <span>{viewingUser.email}</span>
                    {viewingUser.created_at && (
                      <>
                        <span>•</span>
                        <span>Joined: {new Date(viewingUser.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: 'calc(90vh - 170px)', overflowY: 'auto' }}>
              
              {/* Contact & Branch Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                
                {/* Phone Card */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Phone Number
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(viewingUser.phone, 'phone')}
                      style={{ background: 'none', border: 'none', color: copiedField === 'phone' ? '#4ade80' : '#64748b', cursor: 'pointer', padding: '2px' }}
                      title="Copy phone"
                    >
                      {copiedField === 'phone' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', fontWeight: '700', color: '#f8fafc' }}>
                    <Phone size={15} style={{ color: '#6366f1' }} />
                    {viewingUser.phone ? (
                      <a href={`tel:${viewingUser.phone}`} style={{ color: '#f8fafc', textDecoration: 'none' }} title="Call staff">
                        {viewingUser.phone}
                      </a>
                    ) : (
                      <span style={{ color: '#64748b', fontWeight: '400', fontSize: '0.82rem' }}>No phone provided</span>
                    )}
                  </div>
                </div>

                {/* Email Card */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Email Address
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(viewingUser.email, 'email')}
                      style={{ background: 'none', border: 'none', color: copiedField === 'email' ? '#4ade80' : '#64748b', cursor: 'pointer', padding: '2px' }}
                      title="Copy email"
                    >
                      {copiedField === 'email' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', fontWeight: '700', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Mail size={15} style={{ color: '#38bdf8', flexShrink: 0 }} />
                    <a href={`mailto:${viewingUser.email}`} style={{ color: '#f8fafc', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis' }} title="Send email">
                      {viewingUser.email}
                    </a>
                  </div>
                </div>

                {/* Branch Card */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Assigned Branch
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: '700', color: '#f8fafc' }}>
                    <Building size={15} style={{ color: 'var(--accent-gold)' }} />
                    <span>{viewingUser.branch_name || 'Main Salon Branch'}</span>
                  </div>
                  {(() => {
                    let allowed = viewingUser.allowed_branch_ids;
                    if (typeof allowed === 'string') {
                      try { allowed = JSON.parse(allowed); } catch (e) { allowed = []; }
                    }
                    if (Array.isArray(allowed) && allowed.length > 0) {
                      const matched = adminBranches.filter(b => allowed.map(String).includes(String(b.id)));
                      return (
                        <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '2px' }}>
                          Permitted: {matched.map(b => b.name).join(', ') || `${allowed.length} branches`}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Specialized Services Section */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1.5px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '14px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#818cf8'
                    }}>
                      <Scissors size={15} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                        Specialization & Services Provided
                      </h4>
                      {viewingUser.specialization ? (
                        <span style={{ fontSize: '0.74rem', color: '#c084fc', fontWeight: '600' }}>
                          ✂️ {viewingUser.specialization}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          General Salon Services
                        </span>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const assigned = getUserAssignedServices(viewingUser);
                    return (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: '#818cf8',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        padding: '3px 10px',
                        borderRadius: '12px'
                      }}>
                        {assigned.length} {assigned.length === 1 ? 'Service Linked' : 'Services Linked'}
                      </span>
                    );
                  })()}
                </div>

                {/* List of services cards */}
                {(() => {
                  const assigned = getUserAssignedServices(viewingUser);
                  if (assigned.length === 0) {
                    return (
                      <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '10px',
                        border: '1px dashed rgba(255, 255, 255, 0.1)'
                      }}>
                        <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 10px 0' }}>
                          No specific services from the catalog have been linked to this staff member yet.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const target = viewingUser;
                            setViewingUser(null);
                            openEditUserModal(target);
                          }}
                          style={{
                            background: 'rgba(99, 102, 241, 0.2)',
                            border: '1px solid rgba(99, 102, 241, 0.4)',
                            color: '#a5b4fc',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          + Assign Services Now
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '8px',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      paddingRight: '4px'
                    }}>
                      {assigned.map(svc => (
                        <div
                          key={svc.id}
                          style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: '700', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {svc.name}
                            </span>
                            {svc.category && (
                              <span style={{
                                fontSize: '0.62rem',
                                color: '#38bdf8',
                                background: 'rgba(56, 189, 248, 0.15)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                flexShrink: 0
                              }}>
                                {svc.category}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', marginTop: '2px' }}>
                            <span style={{ color: 'var(--accent-gold)', fontWeight: '800' }}>
                              ₹{parseFloat(svc.price || 0).toFixed(2)}
                            </span>
                            {svc.duration && (
                              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={11} /> {svc.duration}m
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Security & Credentials Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    System Login Password
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '0.82rem',
                      color: showPasswordMap[`detail_${viewingUser.id}`] ? 'var(--accent-gold)' : '#94a3b8',
                      fontWeight: '700'
                    }}>
                      {showPasswordMap[`detail_${viewingUser.id}`] ? (viewingUser.password || 'password123') : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPasswordMap(p => ({ ...p, [`detail_${viewingUser.id}`]: !p[`detail_${viewingUser.id}`] }))}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                      title="Toggle password view"
                    >
                      {showPasswordMap[`detail_${viewingUser.id}`] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Account Status
                  </div>
                  <div style={{ fontSize: '0.82rem', color: viewingUser.is_active !== false ? '#4ade80' : '#f87171', fontWeight: '700', marginTop: '4px' }}>
                    {viewingUser.is_active !== false ? '✅ Active / Permitted' : '⛔ Blocked / Restricted'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0, 0, 0, 0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => handleToggleStatus(viewingUser.id)}
                style={{
                  background: viewingUser.is_active !== false ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                  border: `1px solid ${viewingUser.is_active !== false ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                  color: viewingUser.is_active !== false ? '#f87171' : '#4ade80',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {viewingUser.is_active !== false ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                {viewingUser.is_active !== false ? 'Block Account' : 'Activate Account'}
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setViewingUser(null)}
                  className="glass-card"
                  style={{ padding: '8px 18px', cursor: 'pointer', color: 'var(--text-sub)', fontSize: '0.82rem' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingUser;
                    setViewingUser(null);
                    openEditUserModal(target);
                  }}
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit3 size={14} /> Edit Staff Details
                </button>
              </div>
            </div>
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
