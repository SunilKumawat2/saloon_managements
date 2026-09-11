import React, { useState } from 'react';
import {
  UserCheck, Search, Plus, Phone, CheckCircle2,
  Clock, Users, ArrowRight, Scissors, AlertCircle,
  Edit3, Trash2, X, CreditCard, ChevronRight, Sparkles, Filter
} from 'lucide-react';

const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'http://localhost:5000';

// Avatar component
const CustomerAvatar = ({ name, avatarUrl, size = 42 }) => {
  const fullUrl = avatarUrl ? `${API_BASE}${avatarUrl}` : null;
  const initial = name ? name.charAt(0).toUpperCase() : 'C';

  return fullUrl ? (
    <img
      src={fullUrl}
      alt={name}
      style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(52, 211, 153, 0.3)'
      }}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #34d399, #059669)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: '800', color: '#fff'
    }}>
      {initial}
    </div>
  );
};

function ReceptionistView({
  customers = [],
  stylists = [],
  services = [],
  appointments = [],
  onCheckIn,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onUpdateAppointmentStatus,
  onAddCustomer
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState('');
  const [selectedService, setSelectedService] = useState('');
  
  // Quick Add Customer State
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');

  // Queue Filters
  const [queueFilter, setQueueFilter] = useState('All');
  const [queueSearch, setQueueSearch] = useState('');

  // Edit / Delete Modals
  const [editingApp, setEditingApp] = useState(null);
  const [deletingApp, setDeletingApp] = useState(null);
  const [editFormData, setEditFormData] = useState({
    stylist_id: '',
    service_id: '',
    status: 'Scheduled',
    notes: ''
  });

  // Search customer results
  const searchResults = searchTerm.length >= 2
    ? customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
      ).slice(0, 6)
    : [];

  // Select customer handler
  const handleSelectCustomer = (c) => {
    setSelectedCustomer(c);
    setSearchTerm('');
    setQuickAddMode(false);
  };

  // Quick Walk-in Creation
  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    if (!quickName || !quickPhone) return;

    let newCust = { name: quickName, phone: quickPhone, email: '', notes: 'Walk-in Guest' };
    if (onAddCustomer) {
      await onAddCustomer(newCust);
    }
    const created = customers.find(c => c.phone === quickPhone) || { name: quickName, phone: quickPhone, isWalkIn: true };
    setSelectedCustomer(created);
    setQuickAddMode(false);
    setQuickName('');
    setQuickPhone('');
  };

  // Add to Queue (Create Appointment)
  const handleAddToQueue = () => {
    if (!selectedCustomer) return;

    const serv = services.find(s => String(s.id) === String(selectedService));
    const styl = stylists.find(s => String(s.id) === String(selectedStylist));

    const newCheckIn = {
      customer_id: selectedCustomer.id || 1,
      customer_name: selectedCustomer.name,
      stylist_id: selectedStylist ? parseInt(selectedStylist) : (stylists[0]?.id || 1),
      stylist_name: styl ? styl.name : 'Staff',
      service_id: selectedService ? parseInt(selectedService) : (services[0]?.id || 1),
      service_name: serv ? serv.name : 'Salon Service',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Scheduled',
      total_amount: serv ? serv.price : 350.00,
      notes: 'Reception Walk-in Check-in'
    };

    if (onAddAppointment) {
      onAddAppointment(newCheckIn);
    }
    setSelectedCustomer(null);
    setSelectedStylist('');
    setSelectedService('');
  };

  // Open Edit Modal
  const handleOpenEdit = (app) => {
    setEditingApp(app);
    setEditFormData({
      stylist_id: app.stylist_id || '',
      service_id: app.service_id || '',
      status: app.status || 'Scheduled',
      notes: app.notes || ''
    });
  };

  // Submit Edit
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (onUpdateAppointment && editingApp) {
      const serv = services.find(s => String(s.id) === String(editFormData.service_id));
      onUpdateAppointment(editingApp.id, {
        ...editFormData,
        total_amount: serv ? serv.price : editingApp.total_amount
      });
    }
    setEditingApp(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (onDeleteAppointment && deletingApp) {
      onDeleteAppointment(deletingApp.id);
    }
    setDeletingApp(null);
  };

  // Filter Queue Entries
  const filteredQueue = appointments.filter(a => {
    const matchesFilter = queueFilter === 'All' || a.status === queueFilter;
    const matchesSearch = !queueSearch.trim() ||
      a.customer_name?.toLowerCase().includes(queueSearch.toLowerCase()) ||
      a.service_name?.toLowerCase().includes(queueSearch.toLowerCase()) ||
      a.stylist_name?.toLowerCase().includes(queueSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeQueueCount = appointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled').length;

  return (
    <div>
      {/* ─── Header Stats Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Users size={18} style={{ color: 'var(--accent-gold)' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>Total Customers</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900' }}>{customers.length}</div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Scissors size={18} style={{ color: '#818cf8' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>Available Stylists</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900' }}>{stylists.filter(s => s.is_available).length}</div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <CheckCircle2 size={18} style={{ color: '#34d399' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>Services Catalog</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900' }}>{services.length}</div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Clock size={18} style={{ color: '#ec4899' }} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-sub)' }}>Active Walk-in Queue</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: '#ec4899' }}>{activeQueueCount}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* ─── LEFT PANEL: Walk-in Customer Check-in Counter ─── */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck size={20} style={{ color: 'var(--accent-gold)' }} />
            Walk-in Check-in Counter
          </h3>

          {/* Search Box */}
          {!selectedCustomer && (
            <>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Search Customer (Name or Phone)</span>
                  {searchTerm && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: '700' }}>
                      {searchResults.length} customer(s) found
                    </span>
                  )}
                </label>
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    className="search-input-field"
                    placeholder="Search by customer name or mobile number..."
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
              </div>


              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div style={{ marginTop: '-8px', marginBottom: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  {searchResults.map(c => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <CustomerAvatar name={c.name} avatarUrl={c.avatar_url} size={38} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <Phone size={10} style={{ display: 'inline', marginRight: '4px' }} />{c.phone}
                          {' · '} 🏆 {c.loyalty_points || 0} pts
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  ))}
                </div>
              )}

              {searchTerm.length >= 2 && searchResults.length === 0 && (
                <div style={{ padding: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--accent-gold)' }}>
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  No existing customer found. Create quick walk-in below.
                </div>
              )}

              {/* Quick Walk-in Add */}
              {!quickAddMode ? (
                <button
                  className="glass-card"
                  onClick={() => setQuickAddMode(true)}
                  style={{ width: '100%', padding: '12px', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}
                >
                  <Plus size={15} /> Quick Walk-in (New Customer)
                </button>
              ) : (
                <form onSubmit={handleQuickAddSubmit} style={{ marginTop: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label>Customer Name *</label>
                      <input type="text" required placeholder="Full Name" value={quickName} onChange={e => setQuickName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input type="text" required placeholder="9876543210" value={quickPhone} onChange={e => setQuickPhone(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save & Select Walk-in</button>
                    <button type="button" onClick={() => setQuickAddMode(false)} className="glass-card" style={{ padding: '8px 14px', cursor: 'pointer', color: 'var(--text-sub)' }}>✕</button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ─── Selected Customer Check-in Form ─── */}
          {selectedCustomer && (
            <div>
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1.5px solid rgba(52,211,153,0.3)', borderRadius: '14px', padding: '18px 20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                  <CustomerAvatar name={selectedCustomer.name} avatarUrl={selectedCustomer.avatar_url} size={48} />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{selectedCustomer.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedCustomer.phone}</div>
                    {selectedCustomer.isWalkIn && (
                      <span style={{ fontSize: '0.72rem', background: 'rgba(245,158,11,0.15)', color: 'var(--accent-gold)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                        Walk-in Guest
                      </span>
                    )}
                  </div>
                  <CheckCircle2 size={22} style={{ marginLeft: 'auto', color: '#34d399' }} />
                </div>
              </div>

              {/* Service & Stylist Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label>Service Required</label>
                  <select value={selectedService} onChange={e => setSelectedService(e.target.value)}>
                    <option value="">— Select Service —</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} (₹{s.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Assign Stylist / Staff</label>
                  <select value={selectedStylist} onChange={e => setSelectedStylist(e.target.value)}>
                    <option value="">— Any Stylist —</option>
                    {stylists.map(s => (
                      <option key={s.id} value={s.id} disabled={!s.is_available}>
                        {s.name} {!s.is_available ? '(Busy)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dual Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleAddToQueue}
                  className="btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  <Plus size={15} /> Add to Today's Queue
                </button>
                <button
                  type="button"
                  onClick={() => onCheckIn(selectedCustomer, selectedStylist || null)}
                  className="btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <CreditCard size={15} /> Direct POS Checkout
                </button>
                <button
                  type="button"
                  className="glass-card"
                  onClick={() => setSelectedCustomer(null)}
                  style={{ padding: '10px 14px', cursor: 'pointer', color: 'var(--text-sub)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT PANEL: Service Menu Reference ─── */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} style={{ color: '#818cf8' }} />
            Today's Service Menu
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
            {services.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No services loaded.</div>
            ) : services.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{s.name}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {s.category} · ⏱ {s.duration_minutes} min
                  </div>
                </div>
                <span style={{ fontWeight: '900', color: 'var(--accent-gold)', fontSize: '1rem' }}>₹{s.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TODAY'S WALK-IN QUEUE & APPOINTMENTS (FULL CRUD TABLE) ─── */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} style={{ color: '#ec4899' }} /> Live Walk-in Queue & Appointments Manager
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Manage today's check-ins, update service status, assign stylists, or send directly to POS billing checkout.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="search-input-wrapper" style={{ width: '220px' }}>
              <Search size={15} className="search-icon" />
              <input
                type="text"
                className="search-input-field search-input-compact"
                placeholder="Search queue..."
                value={queueSearch}
                onChange={e => setQueueSearch(e.target.value)}
              />
              {queueSearch && (
                <button
                  type="button"
                  className="search-input-clear-btn"
                  onClick={() => setQueueSearch('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={queueFilter}
              onChange={e => setQueueFilter(e.target.value)}
              className="select-filter"
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              <option value="All">All Queue Statuses</option>
              <option value="Scheduled">Scheduled / Waiting</option>
              <option value="In-Progress">In-Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Queue Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px' }}>Customer</th>
                <th style={{ padding: '12px 16px' }}>Service</th>
                <th style={{ padding: '12px 16px' }}>Assigned Stylist</th>
                <th style={{ padding: '12px 16px' }}>Time</th>
                <th style={{ padding: '12px 16px' }}>Amount</th>
                <th style={{ padding: '12px 16px' }}>Queue Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No check-ins in queue matching criteria.
                  </td>
                </tr>
              ) : filteredQueue.map(app => {
                const customer = customers.find(c => String(c.id) === String(app.customer_id)) || { name: app.customer_name || 'Walk-in Guest', avatar_url: app.customer_avatar };
                return (
                  <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {/* Customer */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CustomerAvatar name={customer.name} avatarUrl={customer.avatar_url} size={36} />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{customer.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{customer.phone || 'Walk-in'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Service */}
                    <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '0.88rem' }}>
                      {app.service_name || 'Haircut & Styling'}
                    </td>

                    {/* Stylist */}
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                      ✂️ {app.stylist_name || 'Unassigned'}
                    </td>

                    {/* Time */}
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {app.appointment_time || '10:00'}
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '12px 16px', fontWeight: '800', color: 'var(--accent-gold)' }}>
                      ₹{app.total_amount || 350}
                    </td>

                    {/* Queue Status Toggle */}
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={app.status}
                        onChange={(e) => onUpdateAppointmentStatus(app.id, e.target.value)}
                        style={{
                          background: app.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' : app.status === 'In-Progress' ? 'rgba(245, 158, 11, 0.2)' : app.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                          color: app.status === 'Completed' ? 'var(--success)' : app.status === 'In-Progress' ? 'var(--accent-gold)' : app.status === 'Cancelled' ? '#ef4444' : 'var(--primary-indigo)',
                          border: '1px solid var(--border)',
                          padding: '4px 8px',
                          borderRadius: '10px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="Scheduled">Scheduled (Waiting)</option>
                        <option value="In-Progress">In-Progress</option>
                        <option value="Completed">Completed ✓</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {/* Direct POS Billing */}
                        <button
                          onClick={() => onCheckIn(customer, app.stylist_id)}
                          title="Checkout via POS Billing"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '8px',
                            color: '#34d399',
                            fontSize: '0.76rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          <CreditCard size={12} /> Checkout
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(app)}
                          title="Edit Queue Entry"
                          style={{
                            padding: '5px 10px',
                            background: 'rgba(99, 102, 241, 0.12)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            borderRadius: '8px',
                            color: '#818cf8',
                            fontSize: '0.76rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit3 size={12} /> Edit
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeletingApp(app)}
                          title="Cancel/Delete Entry"
                          style={{
                            padding: '5px 10px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            fontSize: '0.76rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={12} />
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

      {/* ─── EDIT QUEUE ENTRY MODAL ─── */}
      {editingApp && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '480px', width: '90%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} style={{ color: '#818cf8' }} /> Edit Queue Entry — {editingApp.customer_name}
              </h3>
              <button onClick={() => setEditingApp(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Assigned Stylist</label>
                <select
                  value={editFormData.stylist_id}
                  onChange={e => setEditFormData({...editFormData, stylist_id: e.target.value})}
                >
                  <option value="">— Select Stylist —</option>
                  {stylists.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Service</label>
                <select
                  value={editFormData.service_id}
                  onChange={e => setEditFormData({...editFormData, service_id: e.target.value})}
                >
                  <option value="">— Select Service —</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Queue Status</label>
                <select
                  value={editFormData.status}
                  onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                >
                  <option value="Scheduled">Scheduled (Waiting)</option>
                  <option value="In-Progress">In-Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Special request or preferences"
                  value={editFormData.notes}
                  onChange={e => setEditFormData({...editFormData, notes: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setEditingApp(null)} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE / CANCEL CONFIRMATION MODAL ─── */}
      {deletingApp && (
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

            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>Cancel Check-in Entry?</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to remove <strong>{deletingApp.customer_name}</strong> from the queue?
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeletingApp(null)}
                className="glass-card"
                style={{ padding: '10px 20px', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: '700' }}
              >
                Keep in Queue
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
                Delete Check-in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceptionistView;
