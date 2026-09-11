import React, { useState, useRef } from 'react';
import {
  Search, Plus, Phone, Mail, Award, Crown, Star, Users,
  Edit3, Trash2, AlertTriangle, Eye, X, Calendar, User,
  Heart, StickyNote, Gift, ChevronRight, Camera, Upload, Loader2
} from 'lucide-react';
import { Admin_Upload_Customer_Avatar } from '../services/apiService';

const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'http://localhost:5000';

// ─── Segmentation ───
const getSegment = (customer) => {
  const points = customer.loyalty_points || 0;
  if (points >= 200) return { label: 'VIP',        color: '#f59e0b', bg: 'rgba(245,158,11,0.18)', icon: '👑' };
  if (points >= 51)  return { label: 'Regular',    color: '#818cf8', bg: 'rgba(99,102,241,0.18)', icon: '⭐' };
  return               { label: 'New Client', color: '#34d399', bg: 'rgba(52,211,153,0.18)', icon: '🆕' };
};

const EMPTY_FORM = { name: '', phone: '', email: '', gender: 'Female', dob: '', anniversary: '', notes: '', loyalty_points: '' };

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

// ─── Avatar component (shows photo or initials) ───
const CustomerAvatar = ({ customer, size = 40, style = {} }) => {
  const avatarUrl = customer.avatar_url ? `${API_BASE}${customer.avatar_url}` : null;
  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={customer.name}
      style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', flexShrink: 0, ...style
      }}
      onError={e => { e.target.style.display = 'none'; }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: customer.gender === 'Female'
        ? 'linear-gradient(135deg,#ec4899,#8b5cf6)'
        : 'linear-gradient(135deg,#6366f1,#3b82f6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: '800', color: '#fff', ...style
    }}>
      {customer.name?.charAt(0)?.toUpperCase()}
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

function CustomersCRMView({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer }) {
  const [searchTerm, setSearchTerm]         = useState('');
  const [segmentFilter, setSegmentFilter]   = useState('All');
  const [modalMode, setModalMode]           = useState(null);
  const [editTarget, setEditTarget]         = useState(null);
  const [formData, setFormData]             = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [profileCustomer, setProfileCustomer] = useState(null);
  // Track avatar changes (for add: store file, for edit: upload immediately)
  const [avatarFile, setAvatarFile]         = useState(null);
  const [avatarPreview, setAvatarPreview]   = useState(null);

  // ─── Filtering ───
  const filtered = customers.filter(c => {
    const matchSearch = String(c.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) || String(c.phone ?? '').includes(searchTerm);
    if (!matchSearch) return false;
    if (segmentFilter === 'All') return true;
    return getSegment(c).label === segmentFilter;
  });

  const vipCount     = customers.filter(c => getSegment(c).label === 'VIP').length;
  const regularCount = customers.filter(c => getSegment(c).label === 'Regular').length;
  const newCount     = customers.filter(c => getSegment(c).label === 'New Client').length;

  const field = (key) => ({ value: formData[key], onChange: e => setFormData(p => ({ ...p, [key]: e.target.value })) });

  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setEditTarget(null);
    setAvatarFile(null); setAvatarPreview(null);
    setModalMode('add');
  };

  const openEdit = (c) => {
    setEditTarget(c);
    setFormData({
      name: c.name || '', phone: c.phone || '', email: c.email || '',
      gender: c.gender || 'Female',
      dob: c.dob ? String(c.dob).split('T')[0] : '',
      anniversary: c.anniversary ? String(c.anniversary).split('T')[0] : '',
      notes: c.notes || '',
      loyalty_points: c.loyalty_points !== undefined ? c.loyalty_points : '',
    });
    setAvatarFile(null);
    setAvatarPreview(c.avatar_url ? `${API_BASE}${c.avatar_url}` : null);
    setModalMode('edit');
  };

  const closeModal = () => { setModalMode(null); setEditTarget(null); setAvatarFile(null); setAvatarPreview(null); };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modalMode === 'edit' && editTarget) {
      await onUpdateCustomer(editTarget.id, formData, avatarFile);
    } else {
      await onAddCustomer(formData, avatarFile);
    }
    closeModal();
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) { onDeleteCustomer(deleteTarget.id); setDeleteTarget(null); setProfileCustomer(null); }
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
              onClick={() => setSegmentFilter(segmentFilter === label ? 'All' : label)}
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
            <button onClick={() => setSegmentFilter('All')} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem' }}>Clear ✕</button>
          </div>
        )}

        {/* Search & Add */}
        <div className="controls-bar">
          <div className="search-input-wrapper" style={{ width: '280px' }}>
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="search-input-field search-input-compact" 
              placeholder="Search by name or phone..." 
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
          <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add New Client</button>
        </div>

        {/* Table */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
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
              {filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>No customer profiles found.</td></tr>
              ) : filtered.map((c) => {
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
                        <div>{c.gender}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>DOB: {c.dob ? String(c.dob).split('T')[0] : 'N/A'}</div>
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

            {/* Details */}
            <div style={{ marginBottom: '14px' }}>
              <InfoRow icon={<Phone size={14} />}    label="Mobile"       value={c.phone} />
              <InfoRow icon={<Mail size={14} />}     label="Email"        value={c.email} />
              <InfoRow icon={<User size={14} />}     label="Gender"       value={c.gender} />
              <InfoRow icon={<Calendar size={14} />} label="Date of Birth" value={c.dob ? String(c.dob).split('T')[0] : null} />
              <InfoRow icon={<Heart size={14} />}    label="Anniversary"  value={c.anniversary ? String(c.anniversary).split('T')[0] : null} />
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
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)', display: 'block' }} />
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(0,230,118,0.4)', cursor: 'pointer' }}>
                      <Camera size={28} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                  <label htmlFor="customer-avatar-input" style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--glass-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                    <Camera size={13} />
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
                  <input type="text" required placeholder="9876543210" {...field('phone')} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select {...field('gender')}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="client@gmail.com" {...field('email')} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" {...field('dob')} />
                </div>
                <div className="form-group">
                  <label>Anniversary</label>
                  <input type="date" {...field('anniversary')} />
                </div>
              </div>

              {modalMode === 'edit' && (
                <div className="form-group">
                  <label>Loyalty Points</label>
                  <input type="number" min="0" placeholder="e.g. 150" {...field('loyalty_points')} />
                </div>
              )}

              <div className="form-group">
                <label>Preferences / Treatment Notes</label>
                <input type="text" placeholder="e.g. Sensitive skin, prefers organic products" {...field('notes')} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '22px' }}>
                <button type="button" onClick={closeModal} className="glass-card" style={{ padding: '8px 18px', cursor: 'pointer', color: 'var(--text-sub)' }}>Cancel</button>
                <button type="submit" className="btn-primary">{modalMode === 'edit' ? 'Save Changes' : 'Create Profile'}</button>
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
