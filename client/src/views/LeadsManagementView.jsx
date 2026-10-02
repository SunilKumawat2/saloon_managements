import React, { useState, useRef, useEffect } from 'react';
import {
  Target, Plus, Phone, Mail, Clock, AlertTriangle,
  BellRing, CheckCircle2, Edit3, Trash2, X, Search,
  UserCheck, Sparkles, Camera, Upload, Loader2
} from 'lucide-react';
import { Admin_Get_Leads } from '../services/apiService';

const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'http://localhost:5000';

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

// ─── Lead Avatar component (shows photo or initials fallback) ───
const LeadAvatar = ({ lead, previewUrl, size = 44, style = {} }) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [previewUrl, lead?.avatar_url, lead?.id]);

  const rawUrl = previewUrl || lead?.avatar_url;
  const avatarUrl = (rawUrl && !imgFailed)
    ? (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:') || rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
        ? rawUrl
        : `${API_BASE}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`)
    : null;

  const initials = lead?.name
    ? String(lead.name).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'LP';

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={lead?.name || 'Lead'}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid rgba(99, 102, 241, 0.3)',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        ...style
      }}
      onError={() => setImgFailed(true)}
    />
  ) : (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      flexShrink: 0,
      background: '#2563eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.38,
      fontWeight: '800',
      color: '#fff',
      border: '2px solid rgba(255,255,255,0.1)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      ...style
    }}>
      {initials}
    </div>
  );
};

function LeadsManagementView({
  leads: initialLeads = [],
  branches = [],
  currentUser,
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  onUpdateLeadStatus,
  selectedBranchId = 'all'
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Pagination States & Backend Sync ───
  const [pageSize, setPageSize]             = useState(10); // 5, 10, 20, 50, 100, or 'all'
  const [currentPage, setCurrentPage]       = useState(1);
  const [serverData, setServerData]         = useState(null);
  const [loadingBackend, setLoadingBackend] = useState(false);

  // Image Upload State
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef(null);

  const defaultBranchId = selectedBranchId !== 'all' ? selectedBranchId : (branches && branches[0]?.id ? branches[0].id : null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    branch_id: defaultBranchId,
    name: '',
    phone: '',
    email: '',
    source: 'Walk-in',
    notes: '',
    followup_date: '',
    status: 'New'
  });

  useEffect(() => { setLeads(initialLeads); }, [initialLeads]);

  const fetchBackendLeads = async () => {
    setLoadingBackend(true);
    try {
      const queryParams = {
        page: currentPage,
        limit: pageSize === 'all' ? 'all' : pageSize,
        search: searchQuery,
        status: statusFilter
      };
      if (selectedBranchId && selectedBranchId !== 'all') {
        queryParams.branch_id = selectedBranchId;
      }
      const res = await Admin_Get_Leads(queryParams).catch(() => null);
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
    fetchBackendLeads();
    return () => { active = false; };
  }, [pageSize, currentPage, searchQuery, statusFilter, selectedBranchId]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e) => {
    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
    setPageSize(val);
    setCurrentPage(1);
  };

  // Urgent reminders
  const urgentReminders = leads.filter(l => {
    const status = getReminderStatus(l.followup_date);
    return status && l.status !== 'Converted' && l.status !== 'Lost';
  });

  // ─── Source of Truth & Filter ───
  const baseList = (serverData?.data && Array.isArray(serverData.data)) ? serverData.data : leads;

  const rawList = baseList.filter(l => {
    if (!l) return false;
    if (selectedBranchId !== 'all' && l.branch_id && String(l.branch_id) !== String(selectedBranchId)) {
      return false;
    }
    return true;
  });

  const filtered = rawList.filter(l => {
    if (serverData?.pagination) {
      return true; // Already filtered on server
    }
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    const matchesSearch = !searchQuery.trim() ||
      l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone?.includes(searchQuery) ||
      l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.source?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalItems = serverData?.pagination?.total ?? filtered.length;
  const isAll = pageSize === 'all';
  const effectivePageSize = isAll ? (totalItems || 1) : Number(pageSize);
  const totalPages = serverData?.pagination?.totalPages ?? (isAll || effectivePageSize === 0 ? 1 : Math.ceil(totalItems / effectivePageSize));
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  const isServerPaginated = Boolean(serverData?.pagination && serverData.pagination.limit === pageSize);
  const paginatedList = isServerPaginated ? filtered : filtered.slice((safePage - 1) * effectivePageSize, safePage * effectivePageSize);

  const startIndex = isAll || totalItems === 0 ? 0 : (safePage - 1) * (isServerPaginated ? Number(pageSize) : effectivePageSize);
  const endIndex = isAll ? totalItems : Math.min(startIndex + paginatedList.length, totalItems);

  // Handle Photo Picker Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const [phoneError, setPhoneError] = useState('');

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, phone: digitsOnly }));
    if (digitsOnly.length > 0 && digitsOnly.length < 10) {
      setPhoneError('Mobile number must be exactly 10 digits.');
    } else {
      setPhoneError('');
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      branch_id: selectedBranchId !== 'all' ? selectedBranchId : (branches && branches[0]?.id ? branches[0].id : null),
      name: '',
      phone: '',
      email: '',
      source: 'Walk-in',
      notes: '',
      followup_date: '',
      status: 'New'
    });
    setAvatarFile(null);
    setAvatarPreview('');
    setPhoneError('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      branch_id: lead.branch_id || (selectedBranchId !== 'all' ? selectedBranchId : (branches && branches[0]?.id ? branches[0].id : null)),
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      source: lead.source || 'Walk-in',
      notes: lead.notes || '',
      followup_date: lead.followup_date ? String(lead.followup_date).split('T')[0] : '',
      status: lead.status || 'New'
    });
    setAvatarFile(null);
    setAvatarPreview(lead.avatar_url ? `${API_BASE}${lead.avatar_url}` : '');
    setPhoneError('');
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submit Add
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const phoneClean = String(formData.phone || '').trim();
    if (!phoneClean || phoneClean.length !== 10 || !/^\d{10}$/.test(phoneClean)) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const activeBranch = formData.branch_id || (selectedBranchId !== 'all' ? selectedBranchId : (branches && branches[0]?.id ? branches[0].id : null));
      const payload = { ...formData, branch_id: activeBranch, phone: phoneClean };
      if (onAddLead) {
        const created = await onAddLead(payload, avatarFile);
        if (created) {
          setServerData(prev => {
            const curList = Array.isArray(prev?.data) ? prev.data : [];
            const newTotal = (prev?.pagination?.total || curList.length) + 1;
            return {
              data: [created, ...curList.filter(l => String(l.id) !== String(created.id))],
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
      fetchBackendLeads();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const phoneClean = String(formData.phone || '').trim();
    if (!phoneClean || phoneClean.length !== 10 || !/^\d{10}$/.test(phoneClean)) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (onUpdateLead && editingLead) {
        const activeBranch = formData.branch_id || (selectedBranchId !== 'all' ? selectedBranchId : (branches && branches[0]?.id ? branches[0].id : null));
        const payload = { ...formData, branch_id: activeBranch, phone: phoneClean };
        const updated = await onUpdateLead(editingLead.id, payload, avatarFile);
        if (updated) {
          setServerData(prev => {
            if (!prev || !Array.isArray(prev.data)) return prev;
            return {
              ...prev,
              data: prev.data.map(l => String(l.id) === String(editingLead.id) ? { ...l, ...updated } : l)
            };
          });
        }
      }
      setEditingLead(null);
      fetchBackendLeads();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (deletingLead) {
      const targetId = deletingLead.id;
      if (onDeleteLead) {
        await onDeleteLead(targetId);
      }
      setServerData(prev => {
        if (!prev || !Array.isArray(prev.data)) return prev;
        return {
          ...prev,
          data: prev.data.filter(l => String(l.id) !== String(targetId)),
          pagination: prev.pagination ? {
            ...prev.pagination,
            total: Math.max(0, (prev.pagination.total || 1) - 1)
          } : prev.pagination
        };
      });
      setDeletingLead(null);
    }
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
                  borderRadius: '12px',
                  padding: '12px 16px',
                }}>
                  <LeadAvatar lead={lead} size={38} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: '800', color: '#fff', fontSize: '0.95rem' }}>{lead.name}</span>
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
              onChange={handleSearchChange}
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: '30px',
                paddingTop: '8px',
                paddingBottom: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <select className="select-filter" value={statusFilter} onChange={handleStatusFilterChange}>
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

      {/* ─── Lead Cards Pipeline Grid / Loader ─── */}
      {loadingBackend ? (
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', margin: '20px 0', borderRadius: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
            <Loader2 size={36} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.88rem', color: 'var(--text-sub)', fontWeight: '700', letterSpacing: '0.02em' }}>
              Fetching lead prospects from pipeline... (Page {currentPage}, Limit {pageSize})
            </span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '22px' }}>
          {filtered.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              <Target size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ margin: 0 }}>No lead prospects found matching your search and filter criteria.</p>
            </div>
          ) : paginatedList.map((lead) => {
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
                  {/* Header with Photo Avatar & Name */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <LeadAvatar lead={lead} size={48} />
                      <div>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                          Source: {lead.source}
                        </span>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginTop: '4px', marginBottom: 0, color: '#fff' }}>{lead.name}</h3>
                      </div>
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
                        outline: 'none',
                        flexShrink: 0
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
                    title="Edit Lead Details & Photo"
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
                    <Edit3 size={13} /> Edit Details
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
          Showing {totalItems > 0 ? startIndex + 1 : 0} – {endIndex} of <strong style={{ color: 'var(--accent)' }}>{totalItems}</strong> leads
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
              {/* Profile Photo Upload Picker */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'relative',
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    border: '2px dashed var(--accent-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                  }}
                >
                  <LeadAvatar lead={{ name: formData.name }} previewUrl={avatarPreview} size={84} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    opacity: avatarPreview ? 0 : 1,
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={(e) => { if (avatarPreview) e.currentTarget.style.opacity = '0'; }}
                  >
                    <Camera size={22} />
                    <span style={{ fontSize: '0.62rem', fontWeight: '800', marginTop: '2px' }}>UPLOAD</span>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Click camera icon to select profile photo
                </span>
              </div>

              {branches && branches.length > 0 && (
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Salon Branch *</label>
                  <select
                    value={formData.branch_id || (branches[0]?.id || '')}
                    onChange={(e) => setFormData({ ...formData, branch_id: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id} style={{ background: '#1e1e1e', color: '#fff' }}>
                        🏢 {b.name} ({b.code || `ID:${b.id}`})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210 (10 digits)"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                  />
                  {phoneError && (
                    <div style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', fontWeight: '700' }}>
                      ⚠️ {phoneError}
                    </div>
                  )}
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
                      <Loader2 size={16} className="animate-spin" /> Saving Lead...
                    </>
                  ) : (
                    'Save Prospect Lead'
                  )}
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
              {/* Profile Photo Upload Picker */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'relative',
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    border: '2px dashed #818cf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                  }}
                >
                  <LeadAvatar lead={editingLead} previewUrl={avatarPreview} size={84} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    opacity: avatarPreview ? 0 : 1,
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={(e) => { if (avatarPreview) e.currentTarget.style.opacity = '0'; }}
                  >
                    <Camera size={22} />
                    <span style={{ fontSize: '0.62rem', fontWeight: '800', marginTop: '2px' }}>CHANGE</span>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Click camera icon to change profile photo
                </span>
              </div>

              {branches && branches.length > 0 && (
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Salon Branch *</label>
                  <select
                    value={formData.branch_id || (branches[0]?.id || '')}
                    onChange={(e) => setFormData({ ...formData, branch_id: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id} style={{ background: '#1e1e1e', color: '#fff' }}>
                        🏢 {b.name} ({b.code || `ID:${b.id}`})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210 (10 digits)"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                  />
                  {phoneError && (
                    <div style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', fontWeight: '700' }}>
                      ⚠️ {phoneError}
                    </div>
                  )}
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
                      <Loader2 size={16} className="animate-spin" /> Updating...
                    </>
                  ) : (
                    'Update Lead Details'
                  )}
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
