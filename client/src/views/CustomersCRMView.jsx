import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Plus, Phone, Mail, Award, Crown, Star, Users,
  Edit3, Trash2, AlertTriangle, Eye, X, Calendar, User,
  Heart, StickyNote, Gift, ChevronRight, Camera, Upload, Loader2
} from 'lucide-react';
import { Admin_Upload_Customer_Avatar, Admin_Get_Customers } from '../services/apiService';
import { BACKEND_URL } from '../config/Config';

const API_BASE = BACKEND_URL;

// ─── Segmentation ───
const getSegment = (customer) => {
  const points = customer.loyalty_points || 0;
  if (points >= 200) return { label: 'VIP',        color: '#f59e0b', bg: 'rgba(245,158,11,0.18)', icon: '👑' };
  if (points >= 51)  return { label: 'Regular',    color: '#818cf8', bg: 'rgba(99,102,241,0.18)', icon: '⭐' };
  return               { label: 'New Client', color: '#34d399', bg: 'rgba(52,211,153,0.18)', icon: '🆕' };
};

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

const parseDayMonth = (dateStr) => {
  if (!dateStr) return { day: '', month: '' };
  const str = String(dateStr).trim();
  if (!str || str === 'N/A') return { day: '', month: '' };

  if (str.includes('-')) {
    const cleanDate = str.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const m = parts[1].padStart(2, '0');
      const d = String(parseInt(parts[2], 10) || '');
      return { day: d, month: m };
    } else if (parts.length === 2) {
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);
      if (p1 > 12) {
        return { day: String(p1), month: String(p2).padStart(2, '0') };
      } else {
        return { day: String(p2), month: String(p1).padStart(2, '0') };
      }
    }
  }

  const spaceParts = str.split(/\s+/);
  if (spaceParts.length >= 2) {
    const day = spaceParts[0].replace(/\D/g, '');
    const monthStr = spaceParts.slice(1).join(' ').toLowerCase();
    const foundMonth = MONTHS.find(m => 
      m.label.toLowerCase().startsWith(monthStr) || 
      m.value === monthStr ||
      m.value === monthStr.padStart(2, '0')
    );
    return { day, month: foundMonth ? foundMonth.value : '' };
  }

  return { day: '', month: '' };
};

const formatDayMonthLabel = (dateStr) => {
  if (!dateStr || dateStr === 'N/A') return null;
  const { day, month } = parseDayMonth(dateStr);
  if (day && month) {
    const monthObj = MONTHS.find(m => m.value === month);
    if (monthObj) return `${day} ${monthObj.label}`;
  }
  return dateStr;
};

const calculateAge = (dobString) => {
  if (!dobString) return null;
  const str = String(dobString).trim();
  const yearMatch = str.match(/\b(19|20)\d{2}\b/);
  if (!yearMatch) return null;
  const dobDate = new Date(str);
  if (isNaN(dobDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();
  const monthDiff = today.getMonth() - dobDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
};

const calculateAnniversaryYears = (annivString) => {
  if (!annivString) return null;
  const str = String(annivString).trim();
  const yearMatch = str.match(/\b(19|20)\d{2}\b/);
  if (!yearMatch) return null;
  const annivDate = new Date(str);
  if (isNaN(annivDate.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - annivDate.getFullYear();
  const monthDiff = today.getMonth() - annivDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < annivDate.getDate())) {
    years--;
  }
  return years >= 0 ? years : null;
};

const EMPTY_FORM = {
  name: '', phone: '', email: '', gender: '',
  dob_day: '', dob_month: '', anniversary_day: '', anniversary_month: '',
  notes: '', loyalty_points: '0'
};

// ─── Loyalty Bar ───
const LoyaltyBar = ({ points }) => {
  const next  = points >= 200 ? 200 : points >= 51 ? 200 : 51;
  const pct   = Math.min((points / next) * 100, 100);
  const color = points >= 200 ? '#f59e0b' : points >= 51 ? '#818cf8' : '#34d399';
  return (
    <div>
      <div style={{ height: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '8px', transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
        {points >= 200 ? 'VIP Status Achieved 👑' : `${points} / ${next} pts to next level`}
      </div>
    </div>
  );
};

// ─── Info Row ───
const InfoRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
    <span style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }}>{icon}</span>
    <div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '0.86rem', color: value ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: value ? '600' : '400', marginTop: '1px' }}>{value || '—'}</div>
    </div>
  </div>
);

const CustomerAvatar = ({ customer, size = 40, style = {} }) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [customer?.avatar_url, customer?.id]);

  const rawUrl = customer?.avatar_url;
  const avatarUrl = (rawUrl && !imgFailed)
    ? (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:') || rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
        ? rawUrl
        : `${API_BASE}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`)
    : null;

  const initial = String(customer?.name || 'C').charAt(0).toUpperCase();

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={String(customer?.name || 'Customer')}
      style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', flexShrink: 0, ...style
      }}
      onError={() => setImgFailed(true)}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: '#2563eb',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: '800', color: '#fff', ...style
    }}>
      {initial}
    </div>
  );
};

// ─── Image Upload Picker ───
const AvatarUploadPicker = ({ currentUrl, customerId, onUploaded }) => {
  const fileRef  = useRef(null);
  const [preview, setPreview]   = useState(currentUrl ? `${API_BASE}${currentUrl}` : null);
  const [pending, setPending]   = useState(null); // File object waiting to be uploaded
  const [uploading, setUploading] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPending(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!pending || !customerId) return;
    setUploading(true);
    try {
      const res = await Admin_Upload_Customer_Avatar(customerId, pending).catch(() => null);
      if (res?.data?.avatarUrl) {
        onUploaded(res.data.avatarUrl);
        setPending(null);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Preview */}
        {preview ? (
          <img src={preview} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)', display: 'block' }} />
        ) : (
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)' }}>
            <Camera size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
        )}
        {/* Camera overlay */}
        <button type="button" onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--glass-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
          <Camera size={13} />
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      {/* Upload button when a new file is selected */}
      {pending && !uploading && (
        <button type="button" onClick={handleUpload} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px', margin: '8px auto 0', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', padding: '5px 14px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
          <Upload size={13} /> Upload Photo
        </button>
      )}
      {uploading && (
        <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...
        </div>
      )}
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>Click camera icon to choose photo</div>
    </div>
  );
};

function CustomersCRMView({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer, selectedBranchId = 'all', currentUser }) {
  const [searchTerm, setSearchTerm]         = useState('');
  const [segmentFilter, setSegmentFilter]   = useState('All');
  const [modalMode, setModalMode]           = useState(null);
  const [editTarget, setEditTarget]         = useState(null);
  const [formData, setFormData]             = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [profileCustomer, setProfileCustomer] = useState(null);
  const [avatarFile, setAvatarFile]         = useState(null);
  const [avatarPreview, setAvatarPreview]   = useState(null);

  // ─── Pagination States & Backend API Sync ───
  const [pageSize, setPageSize]             = useState(10); // 5, 10, 20, 50, 100, or 'all'
  const [currentPage, setCurrentPage]       = useState(1);
  const [serverData, setServerData]         = useState(null);
  const [loadingBackend, setLoadingBackend] = useState(false);

  // Trigger Backend API Call on Page, PageSize, Search or Branch change
  useEffect(() => {
    let active = true;
    const fetchBackendCustomers = async () => {
      setLoadingBackend(true);
      try {
        const queryParams = {
          page: currentPage,
          limit: pageSize === 'all' ? 'all' : pageSize,
          search: searchTerm
        };
        if (selectedBranchId && selectedBranchId !== 'all') {
          queryParams.branch_id = selectedBranchId;
        }
        const res = await Admin_Get_Customers(queryParams).catch(() => null);
        if (active && res?.data) {
          if (res.data.pagination && Array.isArray(res.data.data)) {
            setServerData({ data: res.data.data, pagination: res.data.pagination });
          } else if (Array.isArray(res.data.data)) {
            setServerData({ data: res.data.data, pagination: null });
          }
        }
      } finally {
        if (active) setLoadingBackend(false);
      }
    };
    fetchBackendCustomers();
    return () => { active = false; };
  }, [pageSize, currentPage, searchTerm, selectedBranchId]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSegmentSelect = (label) => {
    setSegmentFilter(segmentFilter === label ? 'All' : label);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e) => {
    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
    setPageSize(val);
    setCurrentPage(1);
  };

  // ─── Source of Truth Determination ───
  const baseList = (serverData?.data && Array.isArray(serverData.data)) ? serverData.data : customers;

  const isScopedUser = currentUser && currentUser.branch_id && !String(currentUser.role || '').toLowerCase().includes('admin');
  const activeBranchContext = isScopedUser ? currentUser.branch_id : selectedBranchId;

  const rawList = baseList.filter(c => {
    if (!c) return false;
    if (isScopedUser) {
      return String(c.branch_id) === String(currentUser.branch_id);
    }
    if (activeBranchContext !== 'all' && activeBranchContext != null) {
      if (c.branch_id && String(c.branch_id) !== String(activeBranchContext)) {
        return false;
      }
    }
    return true;
  });

  const filtered = rawList.filter(c => {
    if (serverData?.pagination) {
      if (segmentFilter === 'All') return true;
      return getSegment(c).label === segmentFilter;
    }
    const matchSearch = String(c.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) || String(c.phone ?? '').includes(searchTerm);
    if (!matchSearch) return false;
    if (segmentFilter === 'All') return true;
    return getSegment(c).label === segmentFilter;
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

  const vipCount     = rawList.filter(c => getSegment(c).label === 'VIP').length;
  const regularCount = rawList.filter(c => getSegment(c).label === 'Regular').length;
  const newCount     = rawList.filter(c => getSegment(c).label === 'New Client').length;

  const field = (key) => ({ value: formData[key], onChange: e => setFormData(p => ({ ...p, [key]: e.target.value })) });

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setEditTarget(null);
    setAvatarFile(null); setAvatarPreview(null);
    setPhoneError('');
    setModalMode('add');
  };

  const openEdit = (c) => {
    setEditTarget(c);
    const dobParsed = parseDayMonth(c.dob);
    const annivParsed = parseDayMonth(c.anniversary);
    setFormData({
      name: c.name || '', phone: c.phone || '', email: c.email || '',
      gender: c.gender || '',
      dob_day: dobParsed.day,
      dob_month: dobParsed.month,
      anniversary_day: annivParsed.day,
      anniversary_month: annivParsed.month,
      notes: c.notes || '',
      loyalty_points: c.loyalty_points !== undefined ? c.loyalty_points : '',
    });
    setAvatarFile(null);
    const existingAvatar = c.avatar_url ? (
      c.avatar_url.startsWith('data:') || c.avatar_url.startsWith('blob:') || c.avatar_url.startsWith('http://') || c.avatar_url.startsWith('https://')
        ? c.avatar_url
        : `${API_BASE}${c.avatar_url.startsWith('/') ? '' : '/'}${c.avatar_url}`
    ) : null;
    setAvatarPreview(existingAvatar);
    setPhoneError('');
    setModalMode('edit');
  };

  const closeModal = () => { setModalMode(null); setEditTarget(null); setAvatarFile(null); setAvatarPreview(null); setPhoneError(''); };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phoneClean = String(formData.phone || '').trim();
    if (!phoneClean || phoneClean.length !== 10 || !/^\d{10}$/.test(phoneClean)) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (isSubmitting) return;

    let formattedDob = null;
    if (formData.dob_day && formData.dob_month) {
      const d = String(formData.dob_day).padStart(2, '0');
      const m = String(formData.dob_month).padStart(2, '0');
      formattedDob = `2000-${m}-${d}`;
    }

    let formattedAnniversary = null;
    if (formData.anniversary_day && formData.anniversary_month) {
      const d = String(formData.anniversary_day).padStart(2, '0');
      const m = String(formData.anniversary_month).padStart(2, '0');
      formattedAnniversary = `2000-${m}-${d}`;
    }

    const payload = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      gender: formData.gender,
      dob: formattedDob,
      anniversary: formattedAnniversary,
      notes: formData.notes,
      loyalty_points: formData.loyalty_points
    };

    setIsSubmitting(true);
    try {
      let savedCust;
      if (modalMode === 'edit' && editTarget) {
        savedCust = await onUpdateCustomer(editTarget.id, payload, avatarFile);
      } else {
        savedCust = await onAddCustomer(payload, avatarFile);
      }
      if (savedCust) {
        setServerData(prev => {
          if (!prev || !Array.isArray(prev.data)) return prev;
          const exists = prev.data.some(c => String(c.id) === String(savedCust.id));
          const updatedList = exists
            ? prev.data.map(c => String(c.id) === String(savedCust.id) ? { ...c, ...savedCust } : c)
            : [savedCust, ...prev.data];
          return { ...prev, data: updatedList };
        });
      }
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      const targetId = deleteTarget.id;
      if (onDeleteCustomer) {
        await onDeleteCustomer(targetId);
      }
      setServerData(prev => {
        if (!prev || !Array.isArray(prev.data)) return prev;
        return {
          ...prev,
          data: prev.data.filter(c => String(c.id) !== String(targetId)),
          pagination: prev.pagination ? {
            ...prev.pagination,
            total: Math.max(0, (prev.pagination.total || 1) - 1)
          } : prev.pagination
        };
      });
      setDeleteTarget(null);
      setProfileCustomer(null);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

      {/* ─── Main Content ─── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Segment Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'VIP',        count: vipCount,     color: '#f59e0b', icon: <Crown size={20} />,  sub: '200+ loyalty points' },
            { label: 'Regular',    count: regularCount, color: '#818cf8', icon: <Star size={20} />,   sub: '51–199 loyalty points' },
            { label: 'New Client', count: newCount,     color: '#34d399', icon: <Users size={20} />,  sub: '0–50 loyalty points' },
          ].map(({ label, count, color, icon, sub }) => (
            <div key={label} className="glass-card"
              onClick={() => handleSegmentSelect(label)}
              style={{ padding: '18px 20px', cursor: 'pointer', border: segmentFilter === label ? `1.5px solid ${color}` : '1px solid var(--border)', transition: 'all 0.25s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ color }}>{icon}</span>
                <span style={{ fontWeight: '800', color, fontSize: '0.88rem' }}>{label} Clients</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color }}>{count}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Active filter badge */}
        {segmentFilter !== 'All' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '10px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>Showing: <strong>{segmentFilter}</strong> ({filtered.length} clients)</span>
            <button onClick={() => handleSegmentSelect('All')} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem' }}>Clear ✕</button>
          </div>
        )}

        {/* Search, Page Size Dropdown & Add Customer */}
        <div className="controls-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div className="search-input-wrapper" style={{ width: '280px' }}>
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                className="search-input-field search-input-compact" 
                placeholder="Search by name or phone..." 
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

            {/* Dropdown for Items Per Page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-sub)', fontWeight: '600' }}>
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value="all">Show All</option>
              </select>
            </div>
          </div>

          <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add New Client</button>
        </div>

        {/* Table */}
        <div className="glass-panel" style={{ overflow: 'hidden', position: 'relative' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Client Profile</th>
                <th>Contact Details</th>
                <th>Gender & DOB</th>
                <th>Segment & Loyalty</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingBackend ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '54px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                      <Loader2 size={36} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--accent)' }} />
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-sub)', fontWeight: '700', letterSpacing: '0.02em' }}>
                        Fetching data from server... (Page {currentPage}, Limit {pageSize})
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>No customer profiles found.</td></tr>
              ) : paginatedList.map((c) => {
                const segment = getSegment(c);
                const isActive = profileCustomer?.id === c.id;
                return (
                  <tr key={c.id} style={{ background: isActive ? 'rgba(0,230,118,0.04)' : undefined }}>

                    {/* Profile — click name to open drawer */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                        onClick={() => setProfileCustomer(isActive ? null : c)}>
                        <CustomerAvatar customer={c} size={40} />
                        <div>
                          <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {c.name}
                            <ChevronRight size={13} style={{ color: 'var(--accent)', opacity: 0.7 }} />
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ID: #CRM-{String(c.id).padStart(3, '0')}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        <div><Phone size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--accent-gold)' }} />{c.phone}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                          <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />{c.email || 'N/A'}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.84rem' }}>
                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>{c.gender}</span>
                          {calculateAge(c.dob) !== null && (
                            <span style={{
                              background: 'rgba(0,230,118,0.15)',
                              color: '#00E676',
                              border: '1px solid rgba(0,230,118,0.3)',
                              padding: '1px 7px',
                              borderRadius: '10px',
                              fontSize: '0.72rem',
                              fontWeight: '800'
                            }}>
                              {calculateAge(c.dob)} yrs old
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          DOB: {formatDayMonthLabel(c.dob) || 'N/A'}
                        </div>
                        {c.anniversary && (
                          <div style={{ fontSize: '0.74rem', color: '#818cf8', marginTop: '2px', fontWeight: '600' }}>
                            ❤️ Anniv: {formatDayMonthLabel(c.anniversary)}
                            {calculateAnniversaryYears(c.anniversary) !== null && ` (${calculateAnniversaryYears(c.anniversary)} yrs)`}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: segment.bg, color: segment.color, padding: '3px 8px', borderRadius: '10px', fontWeight: '800', fontSize: '0.76rem', width: 'fit-content' }}>
                          {segment.icon} {segment.label}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245,158,11,0.12)', color: 'var(--accent-gold)', padding: '3px 8px', borderRadius: '10px', fontWeight: '700', fontSize: '0.76rem', width: 'fit-content' }}>
                          <Award size={11} /> {c.loyalty_points || 0} pts
                        </span>
                        {c.membership_name ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: c.membership_badge_color ? `${c.membership_badge_color}22` : 'rgba(0, 230, 118, 0.18)',
                            color: c.membership_badge_color || '#00E676',
                            border: `1px solid ${c.membership_badge_color || '#00E676'}`,
                            padding: '3px 8px', borderRadius: '10px', fontWeight: '700', fontSize: '0.75rem', width: 'fit-content'
                          }}>
                            💳 {c.membership_name} (₹{parseFloat(c.remaining_service_credit || 0).toLocaleString()} Credit)
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: 'rgba(148, 163, 184, 0.1)', color: '#94A3B8',
                            padding: '3px 8px', borderRadius: '10px', fontWeight: '600', fontSize: '0.72rem', width: 'fit-content'
                          }}>
                            No Membership
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ color: 'var(--text-sub)', fontSize: '0.85rem', maxWidth: '160px' }}>{c.notes || '—'}</td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button className="action-icon-btn view" onClick={() => setProfileCustomer(isActive ? null : c)} title="View Full Profile">
                          <Eye size={14} />
                        </button>
                        <button className="action-icon-btn edit" onClick={() => openEdit(c)} title="Edit Customer">
                          <Edit3 size={14} />
                        </button>
                        <button className="action-icon-btn delete" onClick={() => setDeleteTarget(c)} title="Delete Customer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
            Showing {totalItems > 0 ? startIndex + 1 : 0} – {endIndex} of <strong style={{ color: 'var(--accent)' }}>{totalItems}</strong> clients
          </div>

          {/* Right: Page Navigation Buttons (Always Visible) */}
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

            <button
              disabled={isAll || safePage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              style={{
                padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)',
                background: (isAll || safePage >= totalPages) ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                color: (isAll || safePage >= totalPages) ? 'var(--text-muted)' : 'var(--text-main)',
                cursor: (isAll || safePage >= totalPages) ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: '600',
                opacity: (isAll || safePage >= totalPages) ? 0.4 : 1
              }}
              title="Last Page"
            >
              Last »
            </button>
          </div>
        </div>
      </div>

      {/* ─── Profile Drawer ─── */}
      {profileCustomer && (() => {
        const seg = getSegment(profileCustomer);
        const c = customers.find(x => x.id === profileCustomer.id) || profileCustomer;
        return (
          <div style={{
            width: '300px', flexShrink: 0,
            background: 'var(--glass-bg)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '22px',
            position: 'sticky', top: '0',
            animation: 'fadeInRight 0.22s ease',
          }}>
            <button onClick={() => setProfileCustomer(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>

            {/* Big Avatar */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <CustomerAvatar customer={c} size={72} style={{ margin: '0 auto 10px', boxShadow: `0 0 0 4px ${seg.bg}` }} />
              <div style={{ fontWeight: '800', fontSize: '1rem' }}>{c.name}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '1px' }}>ID: #CRM-{String(c.id).padStart(3, '0')}</div>
              <div style={{ marginTop: '6px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: seg.bg, color: seg.color, padding: '3px 10px', borderRadius: '12px', fontWeight: '800', fontSize: '0.78rem' }}>
                  {seg.icon} {seg.label}
                </span>
              </div>
            </div>

            {/* Loyalty */}
            <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: '10px', padding: '12px', marginBottom: '14px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                  <Award size={12} style={{ display: 'inline', marginRight: '4px' }} />Loyalty Points
                </span>
                <span style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--accent-gold)' }}>{c.loyalty_points || 0}</span>
              </div>
              <LoyaltyBar points={c.loyalty_points || 0} />
            </div>

            {/* Membership & Wallet Credit */}
            <div style={{
              background: c.membership_badge_color ? `${c.membership_badge_color}15` : 'rgba(0, 230, 118, 0.08)',
              borderRadius: '10px', padding: '12px', marginBottom: '14px',
              border: `1px solid ${c.membership_badge_color || '#00E676'}44`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.82rem', color: c.membership_badge_color || '#00E676' }}>
                  💳 Subscription Plan
                </span>
                <span style={{ fontWeight: '800', fontSize: '0.85rem', color: c.membership_badge_color || '#00E676' }}>
                  {c.membership_name || 'No Active Plan'}
                </span>
              </div>
              {c.membership_name ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: '4px' }}>
                  Service Credit Balance: <strong style={{ color: '#00E676' }}>₹{parseFloat(c.remaining_service_credit || 0).toLocaleString()}</strong> / ₹{parseFloat(c.total_service_credit || 0).toLocaleString()}
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  No active membership enrolled.
                </div>
              )}
            </div>

            {/* Details */}
            <div style={{ marginBottom: '14px' }}>
              <InfoRow icon={<Phone size={14} />}    label="Mobile"       value={c.phone} />
              <InfoRow icon={<Mail size={14} />}     label="Email"        value={c.email} />
              <InfoRow icon={<User size={14} />}     label="Gender"       value={c.gender} />
              <InfoRow icon={<Calendar size={14} />} label="Date of Birth" value={formatDayMonthLabel(c.dob) ? `${formatDayMonthLabel(c.dob)}${calculateAge(c.dob) !== null ? ` (${calculateAge(c.dob)} yrs)` : ''}` : null} />
              <InfoRow icon={<Heart size={14} />}    label="Anniversary"  value={formatDayMonthLabel(c.anniversary) ? `${formatDayMonthLabel(c.anniversary)}${calculateAnniversaryYears(c.anniversary) !== null ? ` (${calculateAnniversaryYears(c.anniversary)} yrs)` : ''}` : null} />
              <InfoRow icon={<StickyNote size={14} />} label="Notes"      value={c.notes} />
              <InfoRow icon={<Gift size={14} />}     label="Member Since" value={c.created_at ? String(c.created_at).split('T')[0] : null} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-primary" style={{ flex: 1, fontSize: '0.8rem', padding: '8px 10px' }} onClick={() => { openEdit(c); setProfileCustomer(null); }}>
                <Edit3 size={12} /> Edit Profile
              </button>
              <button onClick={() => setDeleteTarget(c)} style={{ padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem' }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        );
      })()}

      {/* ─── Add / Edit Modal ─── */}
      {modalMode && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '18px' }}>
              {modalMode === 'edit' ? '✏️ Edit Client Profile' : '+ Add New Client Profile'}
            </h3>

            <form onSubmit={handleSubmit}>
              {/* Photo Upload */}
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <label htmlFor="customer-avatar-input" style={{ cursor: 'pointer', display: 'block', position: 'relative' }}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)', display: 'block' }} />
                    ) : (
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(0,230,118,0.4)' }}>
                        <Camera size={28} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                      <Camera size={13} />
                    </div>
                  </label>
                </div>
                <input id="customer-avatar-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleAvatarChange} />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {avatarFile ? `📸 ${avatarFile.name}` : 'Click camera icon to upload profile photo'}
                </div>
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" required placeholder="e.g. Priya Sharma" {...field('name')} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210 (10 digits)"
                    value={formData.phone || ''}
                    onChange={handlePhoneChange}
                  />
                  {phoneError && (
                    <div style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px', fontWeight: '700' }}>
                      ⚠️ {phoneError}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select {...field('gender')}>
                    <option value="">Select Your Gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>Date of Birth <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '0.75rem' }}>(Optional)</span></label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '6px' }}>
                    <select
                      value={formData.dob_day || ''}
                      onChange={e => setFormData(p => ({ ...p, dob_day: e.target.value }))}
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={String(d)}>{d}</option>
                      ))}
                    </select>
                    <select
                      value={formData.dob_month || ''}
                      onChange={e => setFormData(p => ({ ...p, dob_month: e.target.value }))}
                    >
                      <option value="">Month</option>
                      {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>Anniversary <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '0.75rem' }}>(Optional)</span></label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '6px' }}>
                    <select
                      value={formData.anniversary_day || ''}
                      onChange={e => setFormData(p => ({ ...p, anniversary_day: e.target.value }))}
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={String(d)}>{d}</option>
                      ))}
                    </select>
                    <select
                      value={formData.anniversary_month || ''}
                      onChange={e => setFormData(p => ({ ...p, anniversary_month: e.target.value }))}
                    >
                      <option value="">Month</option>
                      {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="client@gmail.com" {...field('email')} />
              </div>

              <div className="form-group">
                <label>{modalMode === 'edit' ? 'Loyalty Points' : 'Initial Loyalty Points'}</label>
                <input type="number" min="0" placeholder="e.g. 0, 50, 100" {...field('loyalty_points')} />
              </div>

              <div className="form-group">
                <label>Preferences / Treatment Notes</label>
                <input type="text" placeholder="e.g. Sensitive skin, prefers organic products" {...field('notes')} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '22px' }}>
                <button type="button" onClick={closeModal} className="glass-card" style={{ padding: '8px 18px', cursor: 'pointer', color: 'var(--text-sub)' }}>Cancel</button>
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
                      <Loader2 size={16} className="animate-spin" /> {modalMode === 'edit' ? 'Saving Changes...' : 'Creating Profile...'}
                    </>
                  ) : (
                    modalMode === 'edit' ? 'Save Changes' : 'Create Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm ─── */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(239,68,68,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#ef4444' }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '8px' }}>Delete Client Profile?</h3>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.84rem', marginBottom: '22px', lineHeight: '1.5' }}>
              Permanently delete <strong style={{ color: 'var(--text-main)' }}>{deleteTarget.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" onClick={() => setDeleteTarget(null)} className="glass-card" style={{ padding: '8px 18px', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: '600' }}>Cancel</button>
              <button type="button" onClick={handleDeleteConfirm} className="btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .action-icon-btn.view { background: rgba(0,230,118,0.08); color: #00e676; border: 1px solid rgba(0,230,118,0.25); }
        .action-icon-btn.view:hover { background: rgba(0,230,118,0.2); }
      `}</style>
    </div>
  );
}

export default CustomersCRMView;
