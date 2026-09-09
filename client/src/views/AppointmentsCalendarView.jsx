import React, { useState } from 'react';
import {
  Calendar, Clock, Scissors, UserCheck, Plus, CheckCircle2,
  AlertCircle, ChevronLeft, ChevronRight, MessageSquare, Send,
  ShieldCheck, Lock, Edit3, Trash2, X, Search, Phone, User,
  Sparkles, RefreshCw, CalendarDays, LayoutGrid, ListFilter
} from 'lucide-react';

const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'http://localhost:5000';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00'
];

// Helper: Format Date robustly to YYYY-MM-DD
const formatDateKey = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr);
  if (str.includes('T')) {
    const d = new Date(str);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return str.split(' ')[0].split('T')[0];
};

// Helper: Calculate end time + 15m buffer
const getServiceEndTimeWithBuffer = (startTimeStr, durationMinutes = 45, bufferMinutes = 15) => {
  if (!startTimeStr) return '';
  const parts = String(startTimeStr).split(':');
  const h = parseInt(parts[0]) || 10;
  const m = parseInt(parts[1]) || 0;
  const totalMinutes = h * 60 + m + (durationMinutes || 45) + (bufferMinutes || 15);
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

function AppointmentsCalendarView({
  appointments = [],
  customers = [],
  stylists = [],
  services = [],
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onUpdateAppointmentStatus
}) {
  // Calendar View Mode: 'dayGrid' | 'weekGrid' | 'tableList'
  const [viewMode, setViewMode] = useState('dayGrid');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [reschedulingApp, setReschedulingApp] = useState(null);
  const [deletingApp, setDeletingApp] = useState(null);
  const [reminderApp, setReminderApp] = useState(null);
  const [reminderToast, setReminderToast] = useState('');

  // New Booking State
  const [newApp, setNewApp] = useState({
    customer_id: customers[0]?.id || 1,
    stylist_id: stylists[0]?.id || 1,
    service_id: services[0]?.id || 1,
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '11:00',
    source: 'Online Self-Booking',
    notes: ''
  });

  // Edit Booking State
  const [editData, setEditData] = useState({
    customer_id: '',
    stylist_id: '',
    service_id: '',
    appointment_date: '',
    appointment_time: '',
    status: 'Scheduled',
    notes: ''
  });

  // Reschedule State
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleStylist, setRescheduleStylist] = useState('');

  // Open Add Modal & Sync Selected Date
  const handleOpenAddModal = () => {
    setNewApp({
      customer_id: customers[0]?.id || 1,
      stylist_id: stylists[0]?.id || 1,
      service_id: services[0]?.id || 1,
      appointment_date: selectedDate,
      appointment_time: '11:00',
      source: 'Online Self-Booking',
      notes: ''
    });
    setShowAddModal(true);
  };

  // Date Nav Handlers
  const handleShiftDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Submit Add Booking
  const handleAddSubmit = (e) => {
    e.preventDefault();
    const selectedService = services.find(s => String(s.id) === String(newApp.service_id));
    const selectedCust = customers.find(c => String(c.id) === String(newApp.customer_id));
    const selectedStylist = stylists.find(s => String(s.id) === String(newApp.stylist_id));

    if (onAddAppointment) {
      onAddAppointment({
        ...newApp,
        customer_id: parseInt(newApp.customer_id),
        stylist_id: parseInt(newApp.stylist_id),
        service_id: parseInt(newApp.service_id),
        customer_name: selectedCust?.name || 'Walk-in Client',
        service_name: selectedService?.name || 'Salon Service',
        stylist_name: selectedStylist?.name || 'Staff',
        total_amount: selectedService?.price || 350.00
      });
    }
    setShowAddModal(false);
  };

  // Submit Edit
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (onUpdateAppointment && editingApp) {
      const selectedService = services.find(s => String(s.id) === String(editData.service_id));
      const selectedCust = customers.find(c => String(c.id) === String(editData.customer_id));
      const selectedStylist = stylists.find(s => String(s.id) === String(editData.stylist_id));

      onUpdateAppointment(editingApp.id, {
        ...editData,
        customer_name: selectedCust?.name || editingApp.customer_name,
        service_name: selectedService?.name || editingApp.service_name,
        stylist_name: selectedStylist?.name || editingApp.stylist_name,
        total_amount: selectedService ? selectedService.price : editingApp.total_amount
      });
    }
    setEditingApp(null);
  };

  // Submit 1-Click Reschedule
  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (onUpdateAppointment && reschedulingApp) {
      const selectedStylist = stylists.find(s => String(s.id) === String(rescheduleStylist));
      onUpdateAppointment(reschedulingApp.id, {
        ...reschedulingApp,
        appointment_date: rescheduleDate,
        appointment_time: rescheduleTime,
        stylist_id: parseInt(rescheduleStylist || reschedulingApp.stylist_id),
        stylist_name: selectedStylist?.name || reschedulingApp.stylist_name
      });
    }
    setReschedulingApp(null);
  };

  // Submit Delete / Cancel
  const handleConfirmDelete = () => {
    if (onDeleteAppointment && deletingApp) {
      onDeleteAppointment(deletingApp.id);
    }
    setDeletingApp(null);
  };

  // Send Simulated SMS / WhatsApp Reminder
  const handleSendReminder = (type) => {
    const channel = type === 'whatsapp' ? 'WhatsApp 🟢' : 'SMS 💬';
    setReminderToast(`✅ Auto-reminder sent via ${channel} to ${reminderApp.customer_name} (${reminderApp.customer_phone || 'Customer'})!`);
    setTimeout(() => {
      setReminderToast('');
      setReminderApp(null);
    }, 2800);
  };

  // Filtered Appointments with Robust Formatting
  const filteredAppointments = appointments.filter(app => {
    const appDateKey = formatDateKey(app.appointment_date);
    const selDateKey = formatDateKey(selectedDate);
    const matchesDate = viewMode === 'tableList' || appDateKey === selDateKey;
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    
    const custName = app.customer_name || customers.find(c => String(c.id) === String(app.customer_id))?.name || '';
    const servName = app.service_name || services.find(s => String(s.id) === String(app.service_id))?.name || '';
    const stylName = app.stylist_name || stylists.find(st => String(st.id) === String(app.stylist_id))?.name || '';

    const matchesSearch = !searchQuery.trim() ||
      custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      servName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stylName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesStatus && matchesSearch;
  });

  return (
    <div>
      {/* ─── TOAST NOTIFICATION FOR REMINDERS ─── */}
      {reminderToast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff', padding: '14px 22px', borderRadius: '12px',
          fontWeight: '800', fontSize: '0.9rem', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <CheckCircle2 size={20} /> {reminderToast}
        </div>
      )}

      {/* ─── ACTION & VIEW CONTROL BAR ─── */}
      <div className="controls-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {/* Left: View Switcher Tabs */}
        <div style={{ display: 'flex', background: 'var(--input-bg)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setViewMode('dayGrid')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px',
              border: 'none', background: viewMode === 'dayGrid' ? 'var(--primary-indigo)' : 'transparent',
              color: viewMode === 'dayGrid' ? '#fff' : 'var(--text-sub)', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer'
            }}
          >
            <CalendarDays size={14} /> Interactive Day Grid
          </button>
          <button
            onClick={() => setViewMode('weekGrid')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px',
              border: 'none', background: viewMode === 'weekGrid' ? 'var(--primary-indigo)' : 'transparent',
              color: viewMode === 'weekGrid' ? '#fff' : 'var(--text-sub)', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer'
            }}
          >
            <LayoutGrid size={14} /> Week View
          </button>
          <button
            onClick={() => setViewMode('tableList')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px',
              border: 'none', background: viewMode === 'tableList' ? 'var(--primary-indigo)' : 'transparent',
              color: viewMode === 'tableList' ? '#fff' : 'var(--text-sub)', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer'
            }}
          >
            <ListFilter size={14} /> Appointments List
          </button>
        </div>

        {/* Middle: Date Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => handleShiftDate(-1)}
            className="glass-card"
            style={{ padding: '8px 12px', cursor: 'pointer', color: 'var(--text-main)', borderRadius: '8px' }}
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>

          <input
            type="date"
            className="search-input"
            style={{ width: '160px', textAlign: 'center', fontWeight: '700' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <button
            onClick={() => handleShiftDate(1)}
            className="glass-card"
            style={{ padding: '8px 12px', cursor: 'pointer', color: 'var(--text-main)', borderRadius: '8px' }}
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="glass-card"
            style={{ padding: '8px 12px', cursor: 'pointer', color: 'var(--accent-gold)', fontWeight: '700', fontSize: '0.8rem' }}
          >
            Today
          </button>
        </div>

        {/* Right: Book Appointment Button */}
        <button className="btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} /> Book New Appointment
        </button>
      </div>

      {/* ─── 1. INTERACTIVE DAY TIME GRID (THEME ADAPTIVE DESIGN) ─── */}
      {viewMode === 'dayGrid' && (
        <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Clock size={18} style={{ color: 'var(--accent-gold)' }} />
                Daily Schedule Matrix — {selectedDate}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Real-time staff availability, slot duration, and 15-min sanitation buffer locking
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.76rem', fontWeight: '700' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#818cf8' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#818cf8' }}></span> Scheduled
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-gold)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-gold)' }}></span> In-Progress
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#34d399' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399' }}></span> Completed
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ef4444' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span> Cancelled
              </span>
            </div>
          </div>

          <div style={{ minWidth: '760px' }}>
            {/* Grid Header Columns (Stylists) */}
            <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${stylists.length || 3}, 1fr)`, gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
              <div style={{ background: 'var(--input-bg)', padding: '14px', fontWeight: '800', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                TIME SLOT
              </div>
              {stylists.map(st => (
                <div key={st.id} style={{ background: 'var(--input-bg)', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text-main)' }}>{st.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.is_available ? '#34d399' : '#ef4444' }}></span>
                    {st.specialization} · {st.is_available ? 'Available' : 'Busy'}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slot Rows */}
            {TIME_SLOTS.map(time => (
              <div key={time} style={{ display: 'grid', gridTemplateColumns: `100px repeat(${stylists.length || 3}, 1fr)`, gap: '1px', background: 'var(--border)', borderTop: 'none' }}>
                {/* Time Column */}
                <div style={{ background: 'var(--bg-card)', padding: '16px 10px', fontWeight: '800', fontSize: '0.82rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {time}
                </div>

                {/* Stylist Columns for this Time Slot */}
                {stylists.map((st, idx) => {
                  const matched = filteredAppointments.filter(a => {
                    const isStylistMatch = String(a.stylist_id) === String(st.id) || (!a.stylist_id && idx === 0);
                    const appHour = a.appointment_time ? String(a.appointment_time).split(':')[0] : '';
                    const targetHour = time.split(':')[0];
                    return isStylistMatch && appHour === targetHour;
                  });

                  return (
                    <div key={st.id} style={{ background: 'var(--bg-panel)', padding: '8px', minHeight: '88px', position: 'relative' }}>
                      {matched.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Open Slot</span>
                        </div>
                      ) : (
                        matched.map(app => {
                          const custName = app.customer_name || customers.find(c => String(c.id) === String(app.customer_id))?.name || 'Walk-in Client';
                          const servName = app.service_name || services.find(s => String(s.id) === String(app.service_id))?.name || 'Salon Service';
                          const serv = services.find(s => String(s.id) === String(app.service_id));
                          const duration = serv?.duration_minutes || 45;
                          const bufferEnd = getServiceEndTimeWithBuffer(app.appointment_time, duration, 15);

                          return (
                            <div
                              key={app.id}
                              style={{
                                background: app.status === 'Completed' ? 'rgba(16, 185, 129, 0.12)' : app.status === 'In-Progress' ? 'rgba(245, 158, 11, 0.12)' : app.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                                border: `1.5px solid ${app.status === 'Completed' ? '#34d399' : app.status === 'In-Progress' ? '#f59e0b' : app.status === 'Cancelled' ? '#ef4444' : '#818cf8'}`,
                                borderRadius: '10px',
                                padding: '10px 12px',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)' }}>{custName}</span>
                                  <span style={{ fontSize: '0.68rem', background: 'rgba(99,102,241,0.15)', padding: '1px 6px', borderRadius: '4px', color: 'var(--primary-indigo)', fontWeight: '700' }}>
                                    {app.source || 'Walk-in'}
                                  </span>
                                </div>

                                <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: '700' }}>
                                  ✂️ {servName}
                                </div>

                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>⏱ {duration}m (+15m Buffer)</span>
                                  <span style={{ color: 'var(--primary-indigo)', fontWeight: '700' }}>🔒 Slot till {bufferEnd}</span>
                                </div>
                              </div>

                              {/* Quick Action Bar for Slot Card */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                                <span style={{ fontWeight: '900', color: 'var(--text-main)', fontSize: '0.82rem' }}>₹{app.total_amount || serv?.price || 350}</span>

                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    onClick={() => setReminderApp({ ...app, customer_name: custName, service_name: servName })}
                                    title="Send Auto SMS/WhatsApp Reminder"
                                    style={{ background: 'rgba(52,211,153,0.2)', border: 'none', color: '#059669', borderRadius: '6px', padding: '4px 7px', cursor: 'pointer' }}
                                  >
                                    <MessageSquare size={12} />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setReschedulingApp({ ...app, customer_name: custName });
                                      setRescheduleDate(formatDateKey(app.appointment_date));
                                      setRescheduleTime(app.appointment_time || '11:00');
                                      setRescheduleStylist(app.stylist_id);
                                    }}
                                    title="1-Click Reschedule"
                                    style={{ background: 'rgba(245,158,11,0.2)', border: 'none', color: '#d97706', borderRadius: '6px', padding: '4px 7px', cursor: 'pointer' }}
                                  >
                                    <RefreshCw size={12} />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setEditingApp(app);
                                      setEditData({
                                        customer_id: app.customer_id,
                                        stylist_id: app.stylist_id,
                                        service_id: app.service_id,
                                        appointment_date: formatDateKey(app.appointment_date),
                                        appointment_time: app.appointment_time,
                                        status: app.status,
                                        notes: app.notes || ''
                                      });
                                    }}
                                    title="Edit Booking"
                                    style={{ background: 'rgba(99,102,241,0.2)', border: 'none', color: '#4f46e5', borderRadius: '6px', padding: '4px 7px', cursor: 'pointer' }}
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 2. INTERACTIVE WEEK VIEW GRID (THEME ADAPTIVE) ─── */}
      {viewMode === 'weekGrid' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <LayoutGrid size={18} style={{ color: 'var(--primary-indigo)' }} />
            Weekly Appointments Overview
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
              const currDate = new Date(selectedDate);
              const dayOffset = idx - (currDate.getDay() === 0 ? 6 : currDate.getDay() - 1);
              const target = new Date(currDate);
              target.setDate(target.getDate() + dayOffset);
              const targetStr = formatDateKey(target);
              const isSelected = targetStr === selectedDate;
              const dayApps = appointments.filter(a => formatDateKey(a.appointment_date) === targetStr);

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(targetStr)}
                  style={{
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)',
                    border: `1.5px solid ${isSelected ? 'var(--primary-indigo)' : 'var(--border)'}`,
                    borderRadius: '12px',
                    padding: '14px',
                    minHeight: '220px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontWeight: '800', fontSize: '0.9rem', color: isSelected ? 'var(--primary-indigo)' : 'var(--text-main)' }}>
                    {day}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    {targetStr}
                  </div>

                  <div style={{ fontSize: '0.72rem', background: 'var(--input-bg)', color: 'var(--text-sub)', padding: '3px 8px', borderRadius: '6px', fontWeight: '700', marginBottom: '10px' }}>
                    {dayApps.length} Booking{dayApps.length !== 1 ? 's' : ''}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dayApps.slice(0, 4).map(app => {
                      const custName = app.customer_name || customers.find(c => String(c.id) === String(app.customer_id))?.name || 'Walk-in Client';
                      const servName = app.service_name || services.find(s => String(s.id) === String(app.service_id))?.name || 'Salon Service';
                      return (
                        <div key={app.id} style={{ background: 'var(--input-bg)', borderRadius: '6px', padding: '6px 8px', fontSize: '0.72rem', borderLeft: '3px solid var(--accent-gold)' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{app.appointment_time} - {custName}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{servName}</div>
                        </div>
                      );
                    })}
                    {dayApps.length > 4 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', textAlign: 'center' }}>+ {dayApps.length - 4} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 3. FULL APPOINTMENTS LIST TABLE VIEW ─── */}
      {viewMode === 'tableList' && (
        <div className="glass-panel" style={{ overflow: 'hidden', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search appointment, client, service..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', paddingLeft: '36px', paddingTop: '8px', paddingBottom: '8px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
              </div>

              <select className="select-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In-Progress">In-Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--input-bg)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px' }}>Booking ID & Time</th>
                <th style={{ padding: '12px 16px' }}>Customer Name</th>
                <th style={{ padding: '12px 16px' }}>Salon Service</th>
                <th style={{ padding: '12px 16px' }}>Assigned Stylist</th>
                <th style={{ padding: '12px 16px' }}>Booking Source</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Total Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No appointments found matching your search.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => {
                  const custName = app.customer_name || customers.find(c => String(c.id) === String(app.customer_id))?.name || 'Walk-in Client';
                  const servName = app.service_name || services.find(s => String(s.id) === String(app.service_id))?.name || 'Salon Service';
                  const stylName = app.stylist_name || stylists.find(st => String(st.id) === String(app.stylist_id))?.name || 'Staff';

                  return (
                    <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '800', color: 'var(--accent-gold)' }}>#APT-{app.id}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {formatDateKey(app.appointment_date)} at {app.appointment_time}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{custName}</div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                          <Scissors size={14} style={{ color: 'var(--accent-gold)' }} />
                          {servName}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                        {stylName}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '0.74rem', background: 'rgba(99,102,241,0.15)', color: 'var(--primary-indigo)', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                          {app.source || 'Online Portal'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={app.status}
                          onChange={(e) => onUpdateAppointmentStatus(app.id, e.target.value)}
                          style={{
                            background: app.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : app.status === 'In-Progress' ? 'rgba(245, 158, 11, 0.15)' : app.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                            color: app.status === 'Completed' ? 'var(--success)' : app.status === 'In-Progress' ? 'var(--accent-gold)' : app.status === 'Cancelled' ? '#ef4444' : 'var(--primary-indigo)',
                            border: '1px solid var(--border)',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="In-Progress">In-Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td style={{ padding: '12px 16px', fontWeight: '800', color: 'var(--text-main)' }}>
                        ₹ {parseFloat(app.total_amount || 350).toFixed(2)}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setReminderApp({ ...app, customer_name: custName, service_name: servName, stylist_name: stylName })}
                            title="Send Auto Reminder (SMS / WhatsApp)"
                            style={{ padding: '5px 10px', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', color: '#059669', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer' }}
                          >
                            <MessageSquare size={12} />
                          </button>

                          <button
                            onClick={() => {
                              setReschedulingApp({ ...app, customer_name: custName });
                              setRescheduleDate(formatDateKey(app.appointment_date));
                              setRescheduleTime(app.appointment_time || '11:00');
                              setRescheduleStylist(app.stylist_id);
                            }}
                            title="1-Click Reschedule"
                            style={{ padding: '5px 10px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', color: 'var(--accent-gold)', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer' }}
                          >
                            <RefreshCw size={12} />
                          </button>

                          <button
                            onClick={() => {
                              setEditingApp(app);
                              setEditData({
                                customer_id: app.customer_id,
                                stylist_id: app.stylist_id,
                                service_id: app.service_id,
                                appointment_date: formatDateKey(app.appointment_date),
                                appointment_time: app.appointment_time,
                                status: app.status,
                                notes: app.notes || ''
                              });
                            }}
                            title="Edit Booking"
                            style={{ padding: '5px 10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: 'var(--primary-indigo)', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer' }}
                          >
                            <Edit3 size={12} />
                          </button>

                          <button
                            onClick={() => setDeletingApp({ ...app, customer_name: custName })}
                            title="Cancel/Delete Booking"
                            style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MODAL 1: BOOK NEW APPOINTMENT ─── */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '520px', width: '90%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Calendar size={20} style={{ color: 'var(--accent-gold)' }} /> Book Salon Appointment
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>Select Customer</label>
                <select value={newApp.customer_id} onChange={(e) => setNewApp({ ...newApp, customer_id: e.target.value })}>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Select Service</label>
                  <select value={newApp.service_id} onChange={(e) => setNewApp({ ...newApp, service_id: e.target.value })}>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Assign Stylist</label>
                  <select value={newApp.stylist_id} onChange={(e) => setNewApp({ ...newApp, stylist_id: e.target.value })}>
                    {stylists.map(st => <option key={st.id} value={st.id}>{st.name} ({st.specialization})</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Appointment Date</label>
                  <input type="date" required value={newApp.appointment_date} onChange={(e) => setNewApp({ ...newApp, appointment_date: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Booking Time Slot</label>
                  <select value={newApp.appointment_time} onChange={(e) => setNewApp({ ...newApp, appointment_time: e.target.value })}>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Booking Source</label>
                <select value={newApp.source} onChange={(e) => setNewApp({ ...newApp, source: e.target.value })}>
                  <option value="Online Self-Booking">Online Self-Booking Portal</option>
                  <option value="Walk-in Desk">Walk-in Reception Desk</option>
                  <option value="Phone Booking">Phone Call Booking</option>
                </select>
              </div>

              <div className="form-group">
                <label>Booking Notes</label>
                <input type="text" placeholder="e.g. Requested VIP room or pre-wash" value={newApp.notes} onChange={(e) => setNewApp({ ...newApp, notes: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: EDIT APPOINTMENT ─── */}
      {editingApp && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '520px', width: '90%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Edit3 size={18} style={{ color: 'var(--primary-indigo)' }} /> Edit Booking #APT-{editingApp.id}
              </h3>
              <button onClick={() => setEditingApp(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Select Service</label>
                  <select value={editData.service_id} onChange={(e) => setEditData({ ...editData, service_id: e.target.value })}>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Assign Stylist</label>
                  <select value={editData.stylist_id} onChange={(e) => setEditData({ ...editData, stylist_id: e.target.value })}>
                    {stylists.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Appointment Date</label>
                  <input type="date" required value={editData.appointment_date} onChange={(e) => setEditData({ ...editData, appointment_date: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Booking Time</label>
                  <select value={editData.appointment_time} onChange={(e) => setEditData({ ...editData, appointment_time: e.target.value })}>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In-Progress">In-Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <input type="text" value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
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

      {/* ─── MODAL 3: 1-CLICK RESCHEDULE MODAL ─── */}
      {reschedulingApp && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '460px', width: '90%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <RefreshCw size={18} style={{ color: 'var(--accent-gold)' }} /> 1-Click Reschedule Slot
              </h3>
              <button onClick={() => setReschedulingApp(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div>Rescheduling booking for <strong style={{ color: 'var(--text-main)' }}>{reschedulingApp.customer_name}</strong></div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>Current: {formatDateKey(reschedulingApp.appointment_date)} at {reschedulingApp.appointment_time}</div>
            </div>

            <form onSubmit={handleRescheduleSubmit}>
              <div className="form-group">
                <label>New Appointment Date</label>
                <input type="date" required value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
              </div>

              <div className="form-group">
                <label>New Time Slot</label>
                <select value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)}>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Re-assign Stylist (Optional)</label>
                <select value={rescheduleStylist} onChange={(e) => setRescheduleStylist(e.target.value)}>
                  {stylists.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setReschedulingApp(null)} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: AUTO APPOINTMENT REMINDER (SMS / WHATSAPP INTEGRATION PREVIEW) ─── */}
      {reminderApp && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '500px', width: '90%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Send size={18} style={{ color: '#34d399' }} /> Auto Appointment Reminders (SMS / WhatsApp)
              </h3>
              <button onClick={() => setReminderApp(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
              Recipient: <strong style={{ color: 'var(--text-main)' }}>{reminderApp.customer_name}</strong> ({reminderApp.customer_phone || '9876543210'})
            </div>

            {/* Live Message Template Preview Box */}
            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                💬 Live Reminder Payload Preview
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: 0, lineHeight: '1.5', fontFamily: 'sans-serif' }}>
                "Hi <strong>{reminderApp.customer_name}</strong>! Your salon appointment for <strong>{reminderApp.service_name}</strong> with <strong>{reminderApp.stylist_name}</strong> is confirmed for <strong>{formatDateKey(reminderApp.appointment_date)}</strong> at <strong>{reminderApp.appointment_time}</strong>. Please arrive 5 minutes early. Reply 1 to Confirm, 2 to Reschedule. — SalonPulse ERP"
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => handleSendReminder('sms')}
                style={{ flex: 1, padding: '10px 14px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid var(--primary-indigo)', color: 'var(--primary-indigo)', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <MessageSquare size={16} /> Send SMS Gateway
              </button>

              <button
                type="button"
                onClick={() => handleSendReminder('whatsapp')}
                style={{ flex: 1, padding: '10px 14px', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid #34d399', color: '#059669', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Send size={16} /> WhatsApp Business API
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: DELETE / CANCEL CONFIRMATION ─── */}
      {deletingApp && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '420px', width: '90%', padding: '28px', textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: '#ef4444'
            }}>
              <Trash2 size={26} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main)' }}>Cancel Booking #APT-{deletingApp.id}?</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to cancel the booking for <strong>{deletingApp.customer_name}</strong>?
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeletingApp(null)}
                className="glass-card"
                style={{ padding: '10px 20px', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: '700' }}
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '10px 24px', background: '#ef4444', color: '#fff',
                  border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer'
                }}
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentsCalendarView;
