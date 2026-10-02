import React, { useState, useEffect } from 'react';
import { Building, MapPin, Phone, Plus, CheckCircle2, XCircle, Edit3, Power, Trash2, AlertTriangle, Search, Loader2 } from 'lucide-react';
import { Admin_Get_Branches } from '../services/apiService';

function BranchesManagementView({ 
  branches: initialBranches, 
  onAddBranch, 
  onUpdateBranch, 
  onToggleBranchStatus, 
  onDeleteBranch,
  selectedBranchId = 'all',
  onSelectBranch,
  currentUser
}) {
  const isSuperAdmin = Boolean(currentUser?.is_super_admin === true || currentUser?.email === 'admin@saloon.com' || String(currentUser?.role || currentUser?.role_name || '').toLowerCase() === 'super admin' || String(currentUser?.role || currentUser?.role_name || '').toLowerCase() === 'superadmin');
  const [branches, setBranches] = useState(initialBranches);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deletingBranch, setDeletingBranch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Pagination States & Backend Sync ───
  const [pageSize, setPageSize]             = useState(10); // 5, 10, 20, 50, 100, or 'all'
  const [currentPage, setCurrentPage]       = useState(1);
  const [serverData, setServerData]         = useState(null);
  const [loadingBackend, setLoadingBackend] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    address: '',
    phone: ''
  });

  useEffect(() => { setBranches(initialBranches); }, [initialBranches]);

  const fetchBackendBranches = async () => {
    setLoadingBackend(true);
    try {
      const queryParams = {
        page: currentPage,
        limit: pageSize === 'all' ? 'all' : pageSize,
        search: searchTerm
      };
      const res = await Admin_Get_Branches(queryParams).catch(() => null);
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

  useEffect(() => {
    let active = true;
    fetchBackendBranches();
    return () => { active = false; };
  }, [pageSize, currentPage, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e) => {
    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
    setPageSize(val);
    setCurrentPage(1);
  };

  // ─── Source of Truth & Filter ───
  const rawList = (serverData?.data && Array.isArray(serverData.data)) ? serverData.data : (branches || []);

  const filteredBranches = rawList.filter(branch => {
    if (!branch) return false;

    // Multi-tenant isolation: Salon Admins & Branch Users can ONLY view their own branches
    if (!isSuperAdmin && currentUser) {
      const isOwner = (branch.admin_id && String(branch.admin_id) === String(currentUser.id)) ||
                      (branch.created_by_user_id && String(branch.created_by_user_id) === String(currentUser.id)) ||
                      (currentUser.branch_id && String(branch.id) === String(currentUser.branch_id));
      if (!isOwner) return false;
    }

    if (serverData?.pagination && !searchTerm) {
      return true; // Already filtered on server
    }
    const term = searchTerm.toLowerCase();
    const bName = String(branch.name ?? '').toLowerCase();
    const bCode = String(branch.code ?? '').toLowerCase();
    const bCity = String(branch.city ?? '').toLowerCase();
    return bName.includes(term) || bCode.includes(term) || bCity.includes(term);
  });

  const totalItems = (!isSuperAdmin && currentUser) ? filteredBranches.length : (serverData?.pagination?.total ?? filteredBranches.length);
  const isAll = pageSize === 'all';
  const effectivePageSize = isAll ? (totalItems || 1) : Number(pageSize);
  const totalPages = (!isSuperAdmin && currentUser) ? (isAll || effectivePageSize === 0 ? 1 : Math.ceil(totalItems / effectivePageSize)) : (serverData?.pagination?.totalPages ?? (isAll || effectivePageSize === 0 ? 1 : Math.ceil(totalItems / effectivePageSize)));
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  const isServerPaginated = Boolean(serverData?.pagination && serverData.pagination.limit === pageSize && isSuperAdmin);
  const paginatedList = isServerPaginated ? filteredBranches : filteredBranches.slice((safePage - 1) * effectivePageSize, safePage * effectivePageSize);

  const startIndex = isAll || totalItems === 0 ? 0 : (safePage - 1) * (isServerPaginated ? Number(pageSize) : effectivePageSize);
  const endIndex = isAll ? totalItems : Math.min(startIndex + paginatedList.length, totalItems);

  const [phoneError, setPhoneError] = useState('');

  const handleOpenAdd = () => {
    setFormData({ name: '', code: '', city: '', address: '', phone: '' });
    setPhoneError('');
    setEditingBranch(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (branch) => {
    setEditingBranch(branch);
    const cleanPh = String(branch.phone || '').replace(/\D/g, '').slice(0, 10);
    setFormData({
      name: branch.name || '',
      code: branch.code || '',
      city: branch.city || '',
      address: branch.address || '',
      phone: cleanPh
    });
    setPhoneError('');
    setShowAddModal(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = String(formData.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setPhoneError('Contact phone number must be exactly 10 digits (e.g. 9876543210)');
      return;
    }
    setPhoneError('');
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = { ...formData, phone: cleanPhone };
      if (editingBranch) {
        const updated = await onUpdateBranch(editingBranch.id, payload);
        if (updated) {
          setServerData(prev => {
            if (!prev || !Array.isArray(prev.data)) return prev;
            return {
              ...prev,
              data: prev.data.map(b => String(b.id) === String(editingBranch.id) ? { ...b, ...updated } : b)
            };
          });
        }
      } else {
        const created = await onAddBranch(payload);
        if (created) {
          setServerData(prev => {
            const curList = Array.isArray(prev?.data) ? prev.data : [];
            const newTotal = (prev?.pagination?.total || curList.length) + 1;
            return {
              data: [created, ...curList.filter(b => String(b.id) !== String(created.id))],
              pagination: prev?.pagination ? {
                ...prev.pagination,
                total: newTotal,
                totalPages: Math.ceil(newTotal / (pageSize === 'all' ? (newTotal || 1) : pageSize))
              } : null
            };
          });
        }
      }
      setShowAddModal(false);
      setEditingBranch(null);
      setFormData({ name: '', code: '', city: '', address: '', phone: '' });
      fetchBackendBranches();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingBranch) {
      const targetId = deletingBranch.id;
      if (onDeleteBranch) {
        await onDeleteBranch(targetId);
      }
      setServerData(prev => {
        if (!prev || !Array.isArray(prev.data)) return prev;
        return {
          ...prev,
          data: prev.data.filter(b => String(b.id) !== String(targetId)),
          pagination: prev.pagination ? {
            ...prev.pagination,
            total: Math.max(0, (prev.pagination.total || 1) - 1)
          } : prev.pagination
        };
      });
      setDeletingBranch(null);
    }
  };

  return (
    <div>
      {/* ─── Active Branch Workspace Banner ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
            <Building size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isSuperAdmin ? '👑 SaaS System Master Control' : 'Active Salon Branch Context'}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '1px' }}>
              {isSuperAdmin
                ? '🌐 All System Branches Overview (Platform Master)'
                : (selectedBranchId === 'all'
                  ? '🌐 All My Branches'
                  : `🏢 ${branches.find(b => String(b.id) === String(selectedBranchId))?.name || `Branch #${selectedBranchId}`}`)}
            </div>
          </div>
        </div>

        {selectedBranchId !== 'all' && onSelectBranch && (
          <button
            onClick={() => onSelectBranch('all')}
            style={{
              background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border)',
              color: '#fff', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem',
              fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            🌐 Switch to All Branches View
          </button>
        )}
      </div>

      {/* ─── Top Control Bar ─── */}
      <div className="controls-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div className="search-input-wrapper" style={{ width: '320px' }}>
          <Search size={15} className="search-icon" />
          <input 
            type="text" 
            className="search-input-field search-input-compact" 
            placeholder="Search by branch name, code, city, or owner..." 
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

        {isSuperAdmin ? (
          <div style={{
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#60a5fa',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>👑</span>
            <span><strong>Super Admin View:</strong> Salon Owners create their own branches. You can monitor all system branches.</span>
          </div>
        ) : (
          <button className="btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add New Salon Branch
          </button>
        )}
      </div>

      {/* ─── Branches Grid Cards / Loader ─── */}
      {loadingBackend ? (
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', margin: '20px 0', borderRadius: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
            <Loader2 size={36} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.88rem', color: 'var(--text-sub)', fontWeight: '700', letterSpacing: '0.02em' }}>
              Fetching salon branches from server... (Page {currentPage}, Limit {pageSize})
            </span>
          </div>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '14px' }}>
          No salon branches found.
        </div>
      ) : (
        <div className="branches-grid">
          {paginatedList.map((branch) => {
            const isActive = branch.is_active !== false;

            return (
              <div key={branch.id} className="glass-panel branch-card" style={{ position: 'relative', opacity: isActive ? 1 : 0.75 }}>
                {/* Header */}
                <div className="branch-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="branch-code">{branch.code}</span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '6px' }}>{branch.name}</h3>
                    
                    {/* Salon Owner Badge */}
                    <div style={{ marginTop: '6px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: 'var(--accent-gold)',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}>
                        👑 Created By Admin: <strong>{branch.owner_name ? `${branch.owner_name} (${branch.owner_email || ''})` : (branch.admin_id ? `Admin #${branch.admin_id}` : 'Platform Admin')}</strong>
                      </span>
                    </div>
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
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {onSelectBranch ? (
                    String(selectedBranchId) === String(branch.id) ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(0,230,118,0.15)', color: '#00E676', border: '1px solid rgba(0,230,118,0.4)', padding: '5px 12px', borderRadius: '8px', fontWeight: '800', fontSize: '0.78rem' }}>
                        ✓ Active Workspace Branch
                      </span>
                    ) : (
                      <button
                        onClick={() => onSelectBranch(branch.id)}
                        style={{
                          background: 'var(--accent)', color: '#000', border: 'none',
                          padding: '5px 12px', borderRadius: '8px', fontWeight: '800',
                          fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex',
                          alignItems: 'center', gap: '5px'
                        }}
                      >
                        ⚡ Switch To Branch
                      </button>
                    )
                  ) : (
                    <span>Multi-Branch Integration</span>
                  )}

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
      )}

      {/* ─── Pagination Bar ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px',
        marginTop: '20px', padding: '12px 18px',
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
          Showing {totalItems > 0 ? startIndex + 1 : 0} – {endIndex} of <strong style={{ color: 'var(--accent)' }}>{totalItems}</strong> branches
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
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Contact Phone *</span>
                  <span style={{ fontSize: '0.72rem', color: (formData.phone?.length === 10) ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                    {formData.phone?.length || 0}/10 Digits
                  </span>
                </label>
                <input 
                  type="text" 
                  required
                  maxLength={10}
                  placeholder="Enter 10-digit mobile phone (e.g. 9876543210)" 
                  value={formData.phone} 
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: digits });
                    if (digits.length > 0 && digits.length < 10) {
                      setPhoneError(`Phone number must be 10 digits (${digits.length}/10)`);
                    } else {
                      setPhoneError('');
                    }
                  }} 
                  style={{
                    borderColor: phoneError ? '#ef4444' : (formData.phone?.length === 10) ? 'rgba(0,230,118,0.5)' : undefined
                  }}
                />
                {phoneError && (
                  <div style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ⚠️ {phoneError}
                  </div>
                )}
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
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
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
                      <Loader2 size={16} className="animate-spin" /> {editingBranch ? 'Saving...' : 'Creating Branch...'}
                    </>
                  ) : (
                    editingBranch ? 'Save Changes' : 'Save & Create Branch'
                  )}
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
