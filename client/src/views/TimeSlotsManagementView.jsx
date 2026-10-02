import React, { useState } from 'react';
import {
  Clock, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle,
  Sparkles, Filter, Building2, AlertCircle, X, Zap, Calendar, RefreshCw, Timer, CalendarDays
} from 'lucide-react';

const TimeSlotsManagementView = ({
  timeSlots = [],
  branches = [],
  onAddTimeSlot,
  onUpdateTimeSlot,
  onDeleteTimeSlot,
  onToggleActive,
  onGenerateRange,
  currentUser,
  userBranch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Helper time functions
  const parseMins = (tStr) => {
    if (!tStr) return 540; // 09:00
    const parts = String(tStr).split(':');
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    return h * 60 + m;
  };

  const getDurationMins = (start, end) => {
    if (!start || !end) return 60;
    const diff = parseMins(end) - parseMins(start);
    return diff > 0 ? diff : 60;
  };

  const addMinsToTimeStr = (tStr, mins = 60) => {
    if (!tStr) return '10:00';
    const total = (parseMins(tStr) + mins) % (24 * 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const format12H = (timeStr) => {
    if (!timeStr) return '';
    const parts = String(timeStr).split(':');
    const h = parseInt(parts[0]) || 9;
    const m = parseInt(parts[1]) || 0;
    const period = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  // Single Slot Form State
  const [formData, setFormData] = useState({
    start_time: '09:00',
    end_time: '10:00',
    duration_minutes: 60,
    slot_time: '09:00',
    slot_name: '09:00 AM - 10:00 AM (60 min)',
    day_of_week: 'ALL',
    specific_date: '',
    branch_id: currentUser?.branch_id || userBranch?.id || branches[0]?.id || 1,
    is_active: true
  });

  // Range Auto-Generator Form State
  const [genData, setGenData] = useState({
    branch_id: currentUser?.branch_id || userBranch?.id || branches[0]?.id || 1,
    start_time: '09:00',
    end_time: '20:00',
    interval_minutes: 60,
    day_of_week: 'ALL',
    specific_date: ''
  });

  const formatDateYMD = (val) => {
    if (!val) return '';
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const parts = str.split('T')[0].split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) return parts;
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return str.slice(0, 10);
  };

  const openAddModal = () => {
    setEditingSlot(null);
    const defaultBranchId = currentUser?.branch_id || userBranch?.id || branches[0]?.id || 1;
    const start = '09:00';
    const end = '10:00';
    const dur = 60;
    const initialDay = (selectedDay && selectedDay !== 'ALL' && selectedDay !== 'SPECIFIC_DATE')
      ? selectedDay
      : 'Monday';
    setFormData({
      start_time: start,
      end_time: end,
      duration_minutes: dur,
      slot_time: start,
      slot_name: `${format12H(start)} - ${format12H(end)} (${dur} min)`,
      day_of_week: initialDay,
      specific_date: '',
      branch_id: defaultBranchId,
      is_active: true
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (slot) => {
    setEditingSlot(slot);
    const start = slot.start_time || slot.slot_time || '09:00';
    const end = slot.end_time || addMinsToTimeStr(start, slot.duration_minutes || 60);
    const dur = slot.duration_minutes || getDurationMins(start, end);
    const specDate = formatDateYMD(slot.specific_date);
    setFormData({
      start_time: start,
      end_time: end,
      duration_minutes: dur,
      slot_time: start,
      slot_name: slot.slot_name || `${format12H(start)} - ${format12H(end)} (${dur} min)`,
      day_of_week: slot.day_of_week || 'ALL',
      specific_date: specDate,
      branch_id: slot.branch_id || currentUser?.branch_id || userBranch?.id || branches[0]?.id || 1,
      is_active: slot.is_active !== undefined ? Boolean(slot.is_active) : true
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleStartTimeChange = (newStart) => {
    const dur = formData.duration_minutes || 60;
    const newEnd = addMinsToTimeStr(newStart, dur);
    const computedDur = getDurationMins(newStart, newEnd);
    setFormData({
      ...formData,
      start_time: newStart,
      end_time: newEnd,
      slot_time: newStart,
      duration_minutes: computedDur,
      slot_name: `${format12H(newStart)} - ${format12H(newEnd)} (${computedDur} min)`
    });
  };

  const handleEndTimeChange = (newEnd) => {
    const computedDur = getDurationMins(formData.start_time, newEnd);
    setFormData({
      ...formData,
      end_time: newEnd,
      duration_minutes: computedDur,
      slot_name: `${format12H(formData.start_time)} - ${format12H(newEnd)} (${computedDur} min)`
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.start_time.trim() || !formData.end_time.trim()) {
      setErrorMsg('Both Start Time and End Time are required');
      return;
    }

    const dur = getDurationMins(formData.start_time, formData.end_time);
    if (dur <= 0) {
      setErrorMsg('End Time must be after Start Time');
      return;
    }

    const payload = {
      ...formData,
      duration_minutes: dur,
      slot_time: formData.start_time,
      slot_name: formData.slot_name || `${format12H(formData.start_time)} - ${format12H(formData.end_time)} (${dur} min)`
    };

    setIsSubmitting(true);
    try {
      if (editingSlot) {
        await onUpdateTimeSlot(editingSlot.id, payload);
        setSuccessMsg('Time slot updated successfully!');
      } else {
        await onAddTimeSlot(payload);
        setSuccessMsg('Time slot created successfully!');
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.data?.message || err.message || 'Failed to save time slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onGenerateRange(genData);
      setSuccessMsg('Time slots generated successfully!');
      setShowGenModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.data?.message || err.message || 'Failed to generate time slots');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await onDeleteTimeSlot(id);
      setDeleteConfirmId(null);
      setSuccessMsg('Time slot deleted permanently!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.data?.message || err.message || 'Failed to delete time slot');
    }
  };

  const handleToggle = async (id) => {
    try {
      await onToggleActive(id);
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  // Filter slots by Day & Date
  const filteredSlots = timeSlots.filter(s => {
    const sTime = s.start_time || s.slot_time || '';
    const eTime = s.end_time || '';
    const dayScope = s.day_of_week || 'ALL';
    const dateScope = s.specific_date || '';

    const matchesSearch = sTime.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          eTime.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.slot_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          format12H(sTime).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dayScope.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dateScope.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBranch = selectedBranch === 'ALL' || String(s.branch_id) === String(selectedBranch) || !s.branch_id;
    
    let matchesDay = true;
    if (selectedDay === 'SPECIFIC_DATE') {
      matchesDay = Boolean(s.specific_date);
    } else if (selectedDay !== 'ALL') {
      matchesDay = s.day_of_week === selectedDay || s.day_of_week === 'ALL';
    }

    return matchesSearch && matchesBranch && matchesDay;
  });

  const totalSlots = timeSlots.length;
  const activeSlots = timeSlots.filter(s => s.is_active !== false).length;

  const getSlotDetails = (slot) => {
    let start = slot.start_time || slot.slot_time;
    let end = slot.end_time;
    let duration = slot.duration_minutes;

    if ((!start || start === '00:00') && slot.slot_name) {
      const match = slot.slot_name.match(/(\d{1,2}:\d{2})\s*(?:AM|PM)?\s*-\s*(\d{1,2}:\d{2})/i);
      if (match) {
        start = match[1];
        end = match[2];
      }
    }

    if (!start || start === '00:00') start = '09:00';

    if (slot.slot_name && (!duration || duration === 60)) {
      const dMatch = slot.slot_name.match(/(\d+)\s*min/i);
      if (dMatch) duration = parseInt(dMatch[1]);
    }

    if (!duration && start && end) {
      duration = getDurationMins(start, end);
    }

    duration = duration || 60;

    if (!end || end === '00:00') {
      end = addMinsToTimeStr(start, duration);
    }

    return {
      startTime: start,
      endTime: end,
      durationMinutes: duration,
      displayName: slot.slot_name || `${format12H(start)} - ${format12H(end)} (${duration} min)`
    };
  };

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
            <Clock style={{ color: '#6366f1' }} size={28} />
            Salon Time Slots & Weekly Schedule Setup
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            Set custom Day-wise (Mon-Sun), Date-wise & Duration-wise appointment slots for your salon.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowGenModal(true)}
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#818cf8',
              borderRadius: '10px',
              padding: '12px 18px',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Zap size={18} /> 1-Click Auto Generator
          </button>

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
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Plus size={18} /> Add Custom Slot
          </button>
        </div>
      </div>

      {/* Alert Banners */}
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
          gap: '10px',
          fontSize: '14px'
        }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && !showModal && !showGenModal && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#f87171',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px'
        }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Summary KPI Cards */}
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
          <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Total Configured Slots</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#ffffff', marginTop: '6px' }}>{totalSlots}</div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '20px'
        }}>
          <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Active Available Slots</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#22c55e', marginTop: '6px' }}>{activeSlots}</div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '20px'
        }}>
          <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Disabled Slots</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#ef4444', marginTop: '6px' }}>{totalSlots - activeSlots}</div>
        </div>
      </div>

      {/* Day Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {[
          { key: 'ALL', label: '🌐 All Days (Master)' },
          { key: 'Monday', label: 'Mon' },
          { key: 'Tuesday', label: 'Tue' },
          { key: 'Wednesday', label: 'Wed' },
          { key: 'Thursday', label: 'Thu' },
          { key: 'Friday', label: 'Fri' },
          { key: 'Saturday', label: 'Sat' },
          { key: 'Sunday', label: 'Sun' },
          { key: 'SPECIFIC_DATE', label: '📆 Specific Date Overrides' }
        ].map(day => (
          <button
            key={day.key}
            onClick={() => setSelectedDay(day.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: selectedDay === day.key ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.12)',
              background: selectedDay === day.key ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.6)',
              color: selectedDay === day.key ? '#818cf8' : '#94a3b8',
              fontSize: '13px',
              fontWeight: selectedDay === day.key ? '700' : '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{
          position: 'relative',
          flex: '1 1 300px'
        }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search start time, day, date, label (e.g. Monday, 10:00)..."
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
              <option value="ALL">All Branches (Master View)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Slots Grid */}
      {filteredSlots.length === 0 ? (
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <Clock size={48} style={{ color: '#475569', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#cbd5e1' }}>No Time Slots Found for {selectedDay}</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px', maxWidth: '400px', margin: '6px auto 20px' }}>
            {searchTerm ? 'No time slot matches your search term.' : 'Click below to add custom time slots or generate slots for this day.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => setShowGenModal(true)}
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#818cf8',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Auto-Generate Slots
            </button>
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
              Add Custom Slot
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {filteredSlots.map(slot => {
            const isActive = slot.is_active !== false;
            const branchObj = branches.find(b => String(b.id) === String(slot.branch_id));
            const details = getSlotDetails(slot);

            return (
              <div
                key={slot.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.75)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.25)'}`,
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: isActive ? 1 : 0.7,
                  transition: 'all 0.2s'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    {/* Time Range Header */}
                    <span style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#ffffff',
                      fontFamily: 'monospace',
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      padding: '4px 10px',
                      borderRadius: '8px'
                    }}>
                      {format12H(details.startTime)} - {format12H(details.endTime)}
                    </span>

                    <button
                      onClick={() => handleToggle(slot.id)}
                      title={isActive ? 'Click to disable slot' : 'Click to enable slot'}
                      style={{
                        background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${isActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        color: isActive ? '#4ade80' : '#f87171',
                        borderRadius: '20px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  {/* Day & Date Scope Badge */}
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: slot.specific_date ? '#f59e0b' : (slot.day_of_week && slot.day_of_week !== 'ALL' ? '#818cf8' : '#cbd5e1'),
                    background: slot.specific_date ? 'rgba(245, 158, 11, 0.15)' : (slot.day_of_week && slot.day_of_week !== 'ALL' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.06)'),
                    border: `1px solid ${slot.specific_date ? 'rgba(245, 158, 11, 0.35)' : (slot.day_of_week && slot.day_of_week !== 'ALL' ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.12)')}`,
                    padding: '5px 12px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px'
                  }}>
                    <CalendarDays size={14} />
                    <span>
                      {slot.specific_date ? (
                        <>
                          <span style={{ fontWeight: '800' }}>📆 Date: {formatDateYMD(slot.specific_date)}</span>
                          {slot.day_of_week && slot.day_of_week !== 'ALL' ? ` (${slot.day_of_week})` : ''}
                        </>
                      ) : (
                        slot.day_of_week && slot.day_of_week !== 'ALL' 
                          ? `📅 Day: ${slot.day_of_week}` 
                          : '📅 Mon, Tue, Wed, Thu, Fri, Sat, Sun (All 7 Days)'
                      )}
                    </span>
                  </div>

                  {/* Slot Duration Badge & Label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#f59e0b',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Timer size={12} /> {details.durationMinutes} Mins
                    </span>

                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      ({details.startTime} - {details.endTime})
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    {details.displayName}
                  </div>

                  <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={12} style={{ color: '#6366f1' }} />
                    <span>{branchObj ? branchObj.name : (slot.branch_name || 'All Branches')}</span>
                  </div>
                </div>

                <div style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '10px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '6px',
                  marginTop: '14px'
                }}>
                  <button
                    onClick={() => openEditModal(slot)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#cbd5e1',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(slot.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#f87171',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Single Slot Modal */}
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
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                {editingSlot ? 'Edit Time Slot & Duration' : 'Add Custom Time Slot & Duration'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

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

              {/* Start & End Time 2 Column Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Start Time (HH:MM 24h) *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
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
                    End Time (HH:MM 24h) *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
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

              {/* Day of Week & Specific Date 2 Column Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Day of Week Scope
                  </label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
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
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                    <option value="ALL">Mon to Sun (All 7 Days)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Specific Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formatDateYMD(formData.specific_date)}
                    onChange={(e) => {
                      const val = e.target.value || '';
                      let dayOfWeek = formData.day_of_week;
                      if (val) {
                        const d = new Date(val);
                        if (!isNaN(d.getTime())) {
                          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          dayOfWeek = days[d.getUTCDay()];
                        }
                      }
                      setFormData({ ...formData, specific_date: val, day_of_week: dayOfWeek });
                    }}
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

              {/* Live Duration Calculation Box */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Timer size={18} style={{ color: '#818cf8' }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Calculated Slot Duration
                    </div>
                    <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: '700', marginTop: '2px' }}>
                      {format12H(formData.start_time)} to {format12H(formData.end_time)}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#6366f1',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '14px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
                }}>
                  {getDurationMins(formData.start_time, formData.end_time)} Mins
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                  Display Label / Slot Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. 09:00 AM - 10:00 AM Slot (60 min)"
                  value={formData.slot_name}
                  onChange={(e) => setFormData({ ...formData, slot_name: e.target.value })}
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

              {branches.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Branch Context (Salon Location) *
                  </label>
                  <select
                    value={formData.branch_id || 'ALL'}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value === 'ALL' ? null : e.target.value })}
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
                    <option value="ALL">🌐 All Branches (Global Shared Slot)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>🏢 {b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', marginBottom: '24px' }}>
                <input
                  type="checkbox"
                  id="is_active_cb"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' }}
                />
                <label htmlFor="is_active_cb" style={{ fontSize: '14px', color: '#cbd5e1', cursor: 'pointer' }}>
                  Available for Customer Appointment Booking
                </label>
              </div>

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
                  {isSubmitting ? 'Saving...' : (editingSlot ? 'Update Slot' : 'Save Time Slot')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1-Click Range Generator Modal */}
      {showGenModal && (
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
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} style={{ color: '#818cf8' }} /> 1-Click Operating Hours Slot Generator
              </h2>
              <button onClick={() => setShowGenModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerate} style={{ padding: '24px' }}>
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

              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
                Set opening and closing hours for your salon. All booking time slots will be generated automatically in seconds.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Salon Opening Time
                  </label>
                  <input
                    type="time"
                    required
                    value={genData.start_time}
                    onChange={(e) => setGenData({ ...genData, start_time: e.target.value })}
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
                    Salon Closing Time
                  </label>
                  <input
                    type="time"
                    required
                    value={genData.end_time}
                    onChange={(e) => setGenData({ ...genData, end_time: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Day of Week Scope
                  </label>
                  <select
                    value={genData.day_of_week}
                    onChange={(e) => setGenData({ ...genData, day_of_week: e.target.value })}
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
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                    <option value="ALL">Mon to Sun (All 7 Days)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Specific Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formatDateYMD(genData.specific_date)}
                    onChange={(e) => {
                      const val = e.target.value || '';
                      let dayOfWeek = genData.day_of_week;
                      if (val) {
                        const d = new Date(val);
                        if (!isNaN(d.getTime())) {
                          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          dayOfWeek = days[d.getUTCDay()];
                        }
                      }
                      setGenData({ ...genData, specific_date: val, day_of_week: dayOfWeek });
                    }}
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

              {branches.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                    Target Salon Branch Location *
                  </label>
                  <select
                    value={genData.branch_id || 'ALL'}
                    onChange={(e) => setGenData({ ...genData, branch_id: e.target.value === 'ALL' ? null : e.target.value })}
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
                    <option value="ALL">🌐 All Branches (Global Shared Schedule)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>🏢 {b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                  Slot Interval Duration
                </label>
                <select
                  value={genData.interval_minutes}
                  onChange={(e) => setGenData({ ...genData, interval_minutes: parseInt(e.target.value) })}
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
                  <option value={15}>15 Minutes Slot (e.g. 09:00 - 09:15, 09:15 - 09:30...)</option>
                  <option value={30}>30 Minutes Slot (e.g. 09:00 - 09:30, 09:30 - 10:00...)</option>
                  <option value={45}>45 Minutes Slot (e.g. 09:00 - 09:45, 09:45 - 10:30...)</option>
                  <option value={60}>60 Minutes / 1 Hour Slot (e.g. 09:00 - 10:00...)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
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
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Generating...' : '⚡ Auto-Generate All Slots'}
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
            maxWidth: '400px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <AlertCircle size={44} style={{ color: '#f87171', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>Delete Time Slot?</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px', marginBottom: '24px' }}>
              Are you sure you want to permanently delete this time slot? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
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
                Delete Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotsManagementView;
