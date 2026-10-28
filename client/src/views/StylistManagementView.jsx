import React, { useState } from 'react';
import {
  UserCheck, Plus, Search, Edit2, Trash2, Scissors, Phone, Mail,
  Building2, CheckCircle2, XCircle, Sparkles, Filter, ShieldCheck,
  Star, User, AlertCircle, X, Check, List, LayoutGrid, ClipboardCheck
} from 'lucide-react';
import StaffServicesSelector from '../components/StaffServicesSelector';

const StylistManagementView = ({
  stylists = [],
  branches = [],
  services = [],
  onAddStylist,
  onUpdateStylist,
  onDeleteStylist,
  onToggleActive,
  onNavigateAttendance,
  currentUser,
  userBranch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' (default) or 'grid'
  const [showModal, setShowModal] = useState(false);
  const [editingStylist, setEditingStylist] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const defaultBranchId = currentUser?.branch_id || userBranch?.id || (branches && branches[0]?.id ? branches[0].id : 1);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    service_ids: [],
    phone: '',
    email: '',
    branch_id: defaultBranchId,
    experience_years: 2,
    rating: 4.8,
    is_active: true
  });

  const openAddModal = () => {
    setEditingStylist(null);
    setFormData({
      name: '',
      specialization: '',
      service_ids: [],
      phone: '',
      email: '',
      branch_id: currentUser?.branch_id || userBranch?.id || (branches && branches[0]?.id ? branches[0].id : 1),
      experience_years: 2,
      rating: 4.8,
      is_active: true
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (stylist) => {
    setEditingStylist(stylist);
    let parsedServices = [];
    if (Array.isArray(stylist.service_ids)) {
      parsedServices = stylist.service_ids;
    } else if (typeof stylist.service_ids === 'string') {
      try { parsedServices = JSON.parse(stylist.service_ids); } catch(e) {}
    }

    setFormData({
      name: stylist.name || '',
      specialization: stylist.specialization || '',
      service_ids: parsedServices,
      phone: stylist.phone || '',
      email: stylist.email || '',
      branch_id: stylist.branch_id || userBranch?.id || branches[0]?.id || 1,
      experience_years: stylist.experience_years || 2,
      rating: stylist.rating || 4.8,
      is_active: stylist.is_active !== undefined ? Boolean(stylist.is_active) : true
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.name.trim()) {
      setErrorMsg('Stylist name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStylist) {
        await onUpdateStylist(editingStylist.id, formData);
        setSuccessMsg('Stylist updated successfully!');
      } else {
        await onAddStylist(formData);
        setSuccessMsg('Stylist added successfully!');
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.data?.message || err.message || 'Failed to save stylist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await onDeleteStylist(id);
      setDeleteConfirmId(null);
      setSuccessMsg('Stylist removed permanently!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.data?.message || err.message || 'Failed to delete stylist');
    }
  };

  const handleToggle = async (id) => {
    try {
      await onToggleActive(id);
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const getStylistServices = (stylist) => {
    let ids = stylist?.service_ids;
    if (typeof ids === 'string') {
      try { ids = JSON.parse(ids); } catch (e) { ids = []; }
    }
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const numIds = ids.map(id => Number(id));
    return (services || []).filter(s => numIds.includes(Number(s.id)));
  };

  // Filter stylists
  const filteredStylists = stylists.filter(s => {
    const matchesSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.specialization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.phone || '').includes(searchTerm);
    const matchesBranch = selectedBranch === 'ALL' || String(s.branch_id) === String(selectedBranch);
    return matchesSearch && matchesBranch;
  });

  const totalStylists = stylists.length;
  const activeStylists = stylists.filter(s => s.is_active !== false).length;

  return (
    <div style={{ padding: '24px', color: '#e2e8f0', minHeight: '100vh' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scissors style={{ color: '#6366f1' }} size={28} />
            Stylist & Staff Management
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            Manage your salon experts, set active availability, and assign stylists to appointments.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {onNavigateAttendance && (
            <button
              onClick={onNavigateAttendance}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#facc15',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                borderRadius: '10px',
                padding: '12px 18px',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                transition: 'transform 0.2s, background 0.2s'
              }}
            >
              <ClipboardCheck size={18} /> Staff Attendance
            </button>
          )}

          <button
            onClick={openAddModal}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              transition: 'transform 0.2s, boxShadow 0.2s'
            }}
          >
            <Plus size={18} /> Add New Stylist
          </button>
        </div>
      </div>

      {/* Toast Messages */}
      {successMsg && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          color: '#4ade80',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* KPI Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '20px'
        }}>
          <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Total Stylists</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#ffffff', marginTop: '6px' }}>{totalStylists}</div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '20px'
        }}>
          <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Active Available</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#22c55e', marginTop: '6px' }}>{activeStylists}</div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '20px'
        }}>
          <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Inactive / On Leave</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#ef4444', marginTop: '6px' }}>{totalStylists - activeStylists}</div>
        </div>
      </div>

      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          flex: '1 1 400px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{
            position: 'relative',
            flex: '1 1 260px'
          }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search stylist name, phone or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {branches.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} style={{ color: '#94a3b8' }} />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="ALL">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* View Mode Switcher: Table View (Default) or Cards View */}
        <div style={{
          display: 'flex',
          background: 'rgba(30, 41, 59, 0.8)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '2px'
        }}>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'table' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
              color: viewMode === 'table' ? '#818cf8' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            title="Table View (Default)"
          >
            <List size={16} /> Table
          </button>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'grid' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
              color: viewMode === 'grid' ? '#818cf8' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            title="Cards View"
          >
            <LayoutGrid size={16} /> Cards
          </button>
        </div>
      </div>

      {/* Content Display: Empty State OR Table View (Default) OR Grid View */}
      {filteredStylists.length === 0 ? (
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <Scissors size={48} style={{ color: '#475569', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#cbd5e1' }}>No Stylists Found</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px', maxWidth: '400px', margin: '6px auto 20px' }}>
            {searchTerm ? 'No stylist matches your search query.' : 'Click below to add your first salon stylist.'}
          </p>
          <button
            onClick={openAddModal}
            style={{
              background: '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Add Stylist Now
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ─── TABLE VIEW (DEFAULT) ─── */
        <div style={{
          background: 'rgba(30, 41, 59, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <th style={{ padding: '16px 20px' }}>Stylist & Staff Member</th>
                  <th style={{ padding: '16px 20px' }}>Specialization</th>
                  <th style={{ padding: '16px 20px' }}>Contact Info</th>
                  <th style={{ padding: '16px 20px' }}>Assigned Branch</th>
                  <th style={{ padding: '16px 20px' }}>Experience & Rating</th>
                  <th style={{ padding: '16px 20px' }}>Availability Status</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStylists.map((stylist, index) => {
                  const isActive = stylist.is_active !== false;
                  const branchObj = branches.find(b => String(b.id) === String(stylist.branch_id));
                  return (
                    <tr
                      key={stylist.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        transition: 'background 0.2s',
                        background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.06)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'}
                    >
                      {/* Stylist & Staff */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '16px',
                            color: '#ffffff',
                            flexShrink: 0,
                            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
                          }}>
                            {stylist.name ? stylist.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>
                              {stylist.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                              ID: #{stylist.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Specialization & Services */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '280px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            color: '#c084fc',
                            background: 'rgba(168, 85, 247, 0.12)',
                            border: '1px solid rgba(168, 85, 247, 0.25)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: '600',
                            width: 'fit-content'
                          }}>
                            <Scissors size={12} />
                            {stylist.specialization || 'Hair Stylist & Grooming'}
                          </span>
                          {(() => {
                            const assigned = getStylistServices(stylist);
                            if (assigned.length === 0) return null;
                            return (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {assigned.slice(0, 3).map(svc => (
                                  <span key={svc.id} style={{
                                    fontSize: '11px',
                                    color: '#38bdf8',
                                    background: 'rgba(56, 189, 248, 0.1)',
                                    border: '1px solid rgba(56, 189, 248, 0.25)',
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {svc.name}
                                  </span>
                                ))}
                                {assigned.length > 3 && (
                                  <span style={{
                                    fontSize: '10px',
                                    color: '#94a3b8',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    padding: '2px 6px',
                                    borderRadius: '6px'
                                  }}>
                                    +{assigned.length - 3} more
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                          {stylist.phone ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0' }}>
                              <Phone size={13} style={{ color: '#6366f1' }} />
                              <span>{stylist.phone}</span>
                            </div>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '12px' }}>No phone</span>
                          )}
                          {stylist.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px' }}>
                              <Mail size={12} style={{ color: '#6366f1' }} />
                              <span>{stylist.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Assigned Branch */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#cbd5e1' }}>
                          <Building2 size={14} style={{ color: '#38bdf8' }} />
                          <span style={{ fontWeight: '500' }}>
                            {branchObj ? branchObj.name : (stylist.branch_name || 'Main Branch')}
                          </span>
                        </div>
                      </td>

                      {/* Experience & Rating */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#f59e0b', fontWeight: '600' }}>
                            <Star size={13} fill="#f59e0b" style={{ color: '#f59e0b' }} />
                            <span>{stylist.rating || 4.8} / 5.0</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={11} style={{ color: '#94a3b8' }} />
                            <span>{stylist.experience_years ? `${stylist.experience_years} Yrs Experience` : '2 Yrs Experience'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Availability Status */}
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          onClick={() => handleToggle(stylist.id)}
                          title={isActive ? 'Click to set Inactive / Leave' : 'Click to set Active Available'}
                          style={{
                            background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            border: `1px solid ${isActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            color: isActive ? '#4ade80' : '#f87171',
                            borderRadius: '20px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.2s'
                          }}
                        >
                          {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {isActive ? 'Active' : 'Inactive / Leave'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(stylist)}
                            title="Edit Stylist"
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#cbd5e1',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              cursor: 'pointer',
                              transition: 'background 0.2s, color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                              e.currentTarget.style.color = '#cbd5e1';
                            }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(stylist.id)}
                            title="Delete Stylist"
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: '#f87171',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              cursor: 'pointer',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Table Footer */}
          <div style={{
            padding: '12px 20px',
            background: 'rgba(15, 23, 42, 0.5)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#94a3b8'
          }}>
            <span>Showing <strong>{filteredStylists.length}</strong> of <strong>{stylists.length}</strong> stylists</span>
            <span>Tip: Click on status badge to toggle Active / Leave availability</span>
          </div>
        </div>
      ) : (
        /* ─── CARDS GRID VIEW ─── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '20px'
        }}>
          {filteredStylists.map(stylist => {
            const isActive = stylist.is_active !== false;
            const branchObj = branches.find(b => String(b.id) === String(stylist.branch_id));
            
            return (
              <div
                key={stylist.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.75)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.2)'}`,
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  opacity: isActive ? 1 : 0.75,
                  transition: 'transform 0.2s, border-color 0.2s'
                }}
              >
                <div>
                  {/* Card Header: Name & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '18px',
                        color: '#ffffff',
                        boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
                      }}>
                        {stylist.name ? stylist.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                          {stylist.name}
                        </h3>
                        <span style={{ fontSize: '12px', color: '#a855f7', fontWeight: '500' }}>
                          {stylist.specialization || 'Hair Stylist'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggle(stylist.id)}
                      title={isActive ? 'Click to deactivate' : 'Click to activate'}
                      style={{
                        background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${isActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        color: isActive ? '#4ade80' : '#f87171',
                        borderRadius: '20px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#94a3b8', margin: '14px 0' }}>
                    {stylist.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={14} style={{ color: '#6366f1' }} />
                        <span>{stylist.phone}</span>
                      </div>
                    )}
                    {stylist.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={14} style={{ color: '#6366f1' }} />
                        <span>{stylist.email}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={14} style={{ color: '#6366f1' }} />
                      <span>Branch: {branchObj ? branchObj.name : (stylist.branch_name || 'Main Branch')}</span>
                    </div>
                    {stylist.experience_years && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={14} style={{ color: '#f59e0b' }} />
                        <span>Experience: {stylist.experience_years} Years</span>
                      </div>
                    )}
                  </div>

                  {(() => {
                    const assigned = getStylistServices(stylist);
                    if (assigned.length === 0) return null;
                    return (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Scissors size={11} style={{ color: '#38bdf8' }} />
                          <span>Assigned Services ({assigned.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {assigned.slice(0, 4).map(svc => (
                            <span key={svc.id} style={{
                              fontSize: '11px',
                              color: '#38bdf8',
                              background: 'rgba(56, 189, 248, 0.1)',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              padding: '2px 7px',
                              borderRadius: '6px'
                            }}>
                              {svc.name}
                            </span>
                          ))}
                          {assigned.length > 4 && (
                            <span style={{
                              fontSize: '10px',
                              color: '#94a3b8',
                              background: 'rgba(255, 255, 255, 0.05)',
                              padding: '2px 6px',
                              borderRadius: '6px'
                            }}>
                              +{assigned.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Footer Actions */}
                <div style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  marginTop: '10px'
                }}>
                  <button
                    onClick={() => openEditModal(stylist)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={14} /> Edit
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(stylist.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#f87171',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '760px',
            maxHeight: 'calc(100vh - 40px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                {editingStylist ? 'Edit Stylist Details' : 'Add New Stylist'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              {errorMsg && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. vikram@salon.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Staff Specialized Services Multi-Selector from Services Catalog */}
                <div style={{ gridColumn: 'span 2' }}>
                  <StaffServicesSelector
                    services={services}
                    selectedServiceIds={formData.service_ids}
                    specialization={formData.specialization}
                    onChange={({ service_ids, specialization }) => setFormData(prev => ({ ...prev, service_ids, specialization }))}
                  />
                </div>

                {branches.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                      Branch
                    </label>
                    <select
                      value={formData.branch_id}
                      onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px'
                      }}
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', marginBottom: '24px' }}>
                <input
                  type="checkbox"
                  id="is_active_cb"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' }}
                />
                <label htmlFor="is_active_cb" style={{ fontSize: '14px', color: '#cbd5e1', cursor: 'pointer' }}>
                  Available for Customer Booking
                </label>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Saving...' : (editingStylist ? 'Update Stylist' : 'Add Stylist')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '420px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '14px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
              Delete Stylist Permanently?
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '10px 0 24px' }}>
              Are you sure you want to delete this stylist? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => handleDelete(deleteConfirmId)}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StylistManagementView;
