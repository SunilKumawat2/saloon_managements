import React, { useState, useEffect } from 'react';
import {
  UserCheck, Search, Plus, Phone, CheckCircle2,
  Clock, Users, ArrowRight, Scissors, AlertCircle,
  Edit3, Trash2, X, CreditCard, ChevronRight, Sparkles, Filter,
  Loader2, ChevronLeft, ChevronsLeft, ChevronsRight, Crown, Calendar
} from 'lucide-react';
import { Admin_Get_Appointments } from '../services/apiService';

const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'http://localhost:5000';

// Avatar component
const CustomerAvatar = ({ name, avatarUrl, size = 42 }) => {
  const fullUrl = avatarUrl ? `${API_BASE}${avatarUrl}` : null;
  const initial = name ? String(name).charAt(0).toUpperCase() : 'C';

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
      background: '#2563eb',
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
  members = [],
  onDeductMemberCredit,
  onCreateBill,
  onCheckIn,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onUpdateAppointmentStatus,
  onAddCustomer,
  selectedBranchId = 'all'
}) {
  const [customAlert, setCustomAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);

  // Booking Type, Date & Time Slot States
  const [bookingType, setBookingType] = useState('Walk-in'); // 'Walk-in', 'Scheduled', 'Phone'
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState(() => {
    const d = new Date();
    let hours = d.getHours();
    let minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  });

  // ─── Past Date/Time Detection Helper ───
  const isPastDateTime = React.useCallback((dateStr, timeStr) => {
    if (!dateStr) return false;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const selectedDate = String(dateStr).split('T')[0];

    if (selectedDate < todayStr) return true;
    if (selectedDate > todayStr) return false;

    if (selectedDate === todayStr && timeStr) {
      let hour = 0;
      let min = 0;
      const str = String(timeStr).trim().toLowerCase();

      if (str.includes('am') || str.includes('pm')) {
        const isPM = str.includes('pm');
        const clean = str.replace(/[^\d:]/g, '');
        const parts = clean.split(':');
        hour = parseInt(parts[0], 10) || 0;
        min = parseInt(parts[1], 10) || 0;
        if (isPM && hour < 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
      } else {
        const clean = str.replace(/[^\d:]/g, '');
        const parts = clean.split(':');
        hour = parseInt(parts[0], 10) || 0;
        min = parseInt(parts[1], 10) || 0;
      }

      const currentH = now.getHours();
      const currentM = now.getMinutes();

      if (hour < currentH || (hour === currentH && min < currentM)) {
        return true;
      }
    }

    return false;
  }, []);

  const [pastConfirmModal, setPastConfirmModal] = useState({
    isOpen: false,
    pendingDate: '',
    pendingTime: '',
    onConfirmAction: null
  });

  const handleDateChange = (newDate) => {
    if (isPastDateTime(newDate, bookingTime)) {
      setPastConfirmModal({
        isOpen: true,
        pendingDate: newDate,
        pendingTime: bookingTime,
        onConfirmAction: () => setBookingDate(newDate)
      });
    } else {
      setBookingDate(newDate);
    }
  };

  const handleTimeChange = (newTime) => {
    if (isPastDateTime(bookingDate, newTime)) {
      setPastConfirmModal({
        isOpen: true,
        pendingDate: bookingDate,
        pendingTime: newTime,
        onConfirmAction: () => setBookingTime(newTime)
      });
    } else {
      setBookingTime(newTime);
    }
  };

  const toggleServiceSelection = (serviceId) => {
    setSelectedServices(prev => {
      const isPresent = prev.some(id => String(id) === String(serviceId));
      if (isPresent) {
        return prev.filter(id => String(id) !== String(serviceId));
      } else {
        return [...prev, serviceId];
      }
    });
  };
  
  // Quick Add Customer State & Loaders
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);
  const [isAddingToQueue, setIsAddingToQueue] = useState(false);

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
    booking_type: 'Walk-in',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:00 AM',
    notes: ''
  });

  // ─── Pagination States & Backend API Sync ───
  const [pageSize, setPageSize]             = useState(10); // 5, 10, 20, 50, 100, or 'all'
  const [currentPage, setCurrentPage]       = useState(1);
  const [serverData, setServerData]         = useState(null);
  const [loadingBackend, setLoadingBackend] = useState(false);

  const fetchBackendQueue = React.useCallback(async () => {
    setLoadingBackend(true);
    try {
      const queryParams = {
        page: currentPage,
        limit: pageSize === 'all' ? 'all' : pageSize,
        search: queueSearch,
        status: queueFilter
      };
      const res = await Admin_Get_Appointments(queryParams).catch(() => null);
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
  }, [currentPage, pageSize, queueSearch, queueFilter]);

  // Trigger Backend API Call on Page, PageSize, Search, or Filter change
  useEffect(() => {
    fetchBackendQueue();
  }, [fetchBackendQueue, appointments.length]);

  // Search customer results
  const searchResults = searchTerm.length >= 2
    ? customers.filter(c =>
        String(c.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(c.phone ?? '').includes(searchTerm)
      ).slice(0, 6)
    : [];

  // Select customer handler
  const handleSelectCustomer = (c) => {
    setSelectedCustomer(c);
    setSearchTerm('');
    setQuickAddMode(false);
    setSelectedServices([]);
    setBookingType('Walk-in');
    setBookingDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    let hours = d.getHours();
    let minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    setBookingTime(`${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`);
  };

  // Quick Walk-in Creation
  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    if (!quickName || !quickPhone || isSubmittingQuick) return;

    setIsSubmittingQuick(true);
    try {
      const cleanPhone = String(quickPhone).trim();
      const cleanName = String(quickName).trim().toLowerCase();

      // Check if customer already exists by phone or name
      const existing = (customers || []).find(c => 
        (c.phone && String(c.phone).trim() === cleanPhone) || 
        (c.name && String(c.name).trim().toLowerCase() === cleanName)
      );

      if (existing) {
        setSelectedCustomer(existing);
        setSelectedServices([]);
        setQuickAddMode(false);
        setQuickName('');
        setQuickPhone('');
        return;
      }

      let newCust = { name: quickName, phone: quickPhone, email: '', notes: 'Walk-in Guest' };
      let created = null;
      if (onAddCustomer) {
        created = await onAddCustomer(newCust);
      }
      const createdObj = { ...(created || {}), id: created?.id || Date.now(), name: quickName, phone: quickPhone, isWalkIn: true };
      setSelectedCustomer(createdObj);
      setSelectedServices([]);
      setQuickAddMode(false);
      setQuickName('');
      setQuickPhone('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  // Add to Queue (Create Appointment)
  const handleAddToQueue = async (skipPastCheck = false) => {
    if (!selectedCustomer || isAddingToQueue) return;

    if (selectedServices.length === 0) {
      setCustomAlert({ title: 'Select Service Required', message: 'Please select at least one service for the walk-in customer check-in.', type: 'warning' });
      return;
    }

    if (selectedStylist && isStylistBookedAtSlot(selectedStylist, bookingDate, bookingTime)) {
      const stName = stylists.find(s => String(s.id) === String(selectedStylist))?.name || 'Selected Stylist';
      setCustomAlert({
        title: 'Stylist Time Slot Conflict',
        message: `⛔ Double-Booking Blocked: ${stName} is already booked for an appointment on ${bookingDate} at ${bookingTime}. Please choose another time slot or staff member.`,
        type: 'warning'
      });
      return;
    }

    // Past Date / Time Slot Confirmation Alert
    if (!skipPastCheck && isPastDateTime(bookingDate, bookingTime)) {
      setPastConfirmModal({
        isOpen: true,
        pendingDate: bookingDate,
        pendingTime: bookingTime,
        onConfirmAction: () => handleAddToQueue(true)
      });
      return;
    }

    setIsAddingToQueue(true);
    try {
      const selectedServiceObjs = services.filter(s => selectedServices.some(id => String(id) === String(s.id)));
      const combinedName = selectedServiceObjs.map(s => s.name).join(' + ') || 'Salon Services';
      const combinedTotal = selectedServiceObjs.reduce((sum, s) => sum + parseFloat(s.price || 0), 0);
      const styl = stylists.find(s => String(s.id) === String(selectedStylist));

      const newCheckIn = {
        customer_id: selectedCustomer.id || Date.now(),
        customer_name: selectedCustomer.name || 'Walk-in Guest',
        customer_phone: selectedCustomer.phone || '',
        stylist_id: selectedStylist ? parseInt(selectedStylist) : (stylists[0]?.id || 1),
        stylist_name: styl ? styl.name : (stylists[0]?.name || 'Unassigned Staff'),
        service_id: selectedServices[0] ? parseInt(selectedServices[0]) : 1,
        service_name: combinedName,
        booking_type: bookingType,
        appointment_date: bookingDate || new Date().toISOString().split('T')[0],
        appointment_time: bookingTime || '10:00 AM',
        status: 'Scheduled',
        total_amount: combinedTotal > 0 ? combinedTotal : 350.00,
        notes: `Reception ${bookingType} Check-in (${selectedServiceObjs.length} services: ${combinedName})`
      };

      if (onAddAppointment) {
        await onAddAppointment(newCheckIn);
      }
      setSelectedCustomer(null);
      setSelectedStylist('');
      setSelectedServices([]);
      fetchBackendQueue();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingToQueue(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (app) => {
    setEditingApp(app);
    setEditFormData({
      stylist_id: app.stylist_id || '',
      service_id: app.service_id || '',
      status: app.status || 'Scheduled',
      booking_type: app.booking_type || 'Walk-in',
      appointment_date: app.appointment_date || new Date().toISOString().split('T')[0],
      appointment_time: app.appointment_time || '10:00 AM',
      notes: app.notes || ''
    });
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (onUpdateAppointment && editingApp) {
      if (editFormData.stylist_id && isStylistBookedAtSlot(editFormData.stylist_id, editFormData.appointment_date, editFormData.appointment_time, editingApp.id)) {
        const stName = stylists.find(s => String(s.id) === String(editFormData.stylist_id))?.name || 'Selected Stylist';
        setCustomAlert({
          title: 'Stylist Time Slot Conflict',
          message: `⛔ Double-Booking Blocked: ${stName} is already booked for an appointment on ${editFormData.appointment_date} at ${editFormData.appointment_time}. Please choose another time slot or staff member.`,
          type: 'warning'
        });
        return;
      }
      const serv = services.find(s => String(s.id) === String(editFormData.service_id));
      await onUpdateAppointment(editingApp.id, {
        ...editFormData,
        total_amount: serv ? serv.price : editingApp.total_amount
      });
      fetchBackendQueue();
    }
    setEditingApp(null);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (onDeleteAppointment && deletingApp) {
      await onDeleteAppointment(deletingApp.id);
      fetchBackendQueue();
    }
    setDeletingApp(null);
  };

  // ─── Source of Truth Determination ───
  const rawList = React.useMemo(() => {
    if (!serverData?.data || !Array.isArray(serverData.data)) {
      return appointments;
    }
    const map = new Map();
    (appointments || []).forEach(item => {
      if (item && item.id) map.set(String(item.id), item);
    });
    serverData.data.forEach(item => {
      if (item && item.id) {
        const local = map.get(String(item.id));
        map.set(String(item.id), {
          ...item,
          customer_name: item.customer_name || local?.customer_name || 'Walk-in Guest',
          customer_phone: item.customer_phone || local?.customer_phone || ''
        });
      }
    });
    const combined = Array.from(map.values());
    combined.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    return combined;
  }, [serverData, appointments]);

  // Robust Date Normalizer: Converts ISO string, YYYY-MM-DD, or Date object to local "YYYY-MM-DD"
  const normalizeDateStr = (dateStr) => {
    if (!dateStr) return '';
    const str = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return str.split('T')[0].split(' ')[0];
  };

  // Robust Time Normalizer: Converts any 12h/24h string ("15:00:00", "03:00 PM", "3:00 PM", "15:00") to total minutes from midnight
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return -1;
    const str = String(timeStr).trim().toLowerCase();
    let hour = 0;
    let min = 0;

    if (str.includes('am') || str.includes('pm')) {
      const isPM = str.includes('pm');
      const clean = str.replace(/[^\d:]/g, '');
      const parts = clean.split(':');
      hour = parseInt(parts[0], 10) || 0;
      min = parseInt(parts[1], 10) || 0;
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
    } else {
      const clean = str.replace(/[^\d:]/g, '');
      const parts = clean.split(':');
      hour = parseInt(parts[0], 10) || 0;
      min = parseInt(parts[1], 10) || 0;
    }

    return hour * 60 + min;
  };

  // ─── Stylist Slot Conflict Detection Helper ───
  const isStylistBookedAtSlot = React.useCallback((stylistId, dateStr, timeStr, currentAppId = null) => {
    if (!stylistId || !dateStr || !timeStr) return false;
    
    const targetDate = normalizeDateStr(dateStr);
    const targetMinutes = parseTimeToMinutes(timeStr);
    if (targetMinutes === -1) return false;

    const targetStylist = (stylists || []).find(s => String(s.id) === String(stylistId));
    const targetStylistName = targetStylist?.name ? targetStylist.name.toLowerCase().trim() : '';

    return (rawList || []).some(app => {
      if (currentAppId && String(app.id) === String(currentAppId)) return false;
      if (app.status === 'Cancelled' || app.status === 'Completed') return false;

      const appStylistId = app.stylist_id != null ? String(app.stylist_id).trim() : '';
      const appStylistName = app.stylist_name ? String(app.stylist_name).toLowerCase().trim() : '';

      const matchStylist =
        (appStylistId && appStylistId === String(stylistId).trim()) ||
        (targetStylistName && appStylistName && (appStylistName === targetStylistName || appStylistName.includes(targetStylistName) || targetStylistName.includes(appStylistName)));

      if (!matchStylist) return false;

      const appDate = normalizeDateStr(app.appointment_date);
      if (appDate !== targetDate) return false;

      const appMinutes = parseTimeToMinutes(app.appointment_time);
      if (appMinutes === -1) return false;

      // Conflict if exact match or within 15-minute slot window
      return Math.abs(appMinutes - targetMinutes) < 15;
    });
  }, [rawList, stylists]);

  const filteredQueue = rawList.filter(a => {
    if (serverData?.pagination) {
      return true; // Already filtered on backend
    }
    const matchesFilter = queueFilter === 'All' || a.status === queueFilter;
    const matchesSearch = !queueSearch.trim() ||
      a.customer_name?.toLowerCase().includes(queueSearch.toLowerCase()) ||
      a.service_name?.toLowerCase().includes(queueSearch.toLowerCase()) ||
      a.stylist_name?.toLowerCase().includes(queueSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalItems = serverData?.pagination?.total ?? filteredQueue.length;
  const isAll = pageSize === 'all';
  const effectivePageSize = isAll ? (totalItems || 1) : Number(pageSize);
  const totalPages = serverData?.pagination?.totalPages ?? (isAll || effectivePageSize === 0 ? 1 : Math.ceil(totalItems / effectivePageSize));
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  const isServerPaginated = Boolean(serverData?.pagination && serverData.pagination.limit === pageSize);
  const paginatedQueue = isServerPaginated ? filteredQueue : filteredQueue.slice((safePage - 1) * effectivePageSize, safePage * effectivePageSize);

  const startIndex = isAll || totalItems === 0 ? 0 : (safePage - 1) * (isServerPaginated ? Number(pageSize) : effectivePageSize);
  const endIndex = isAll ? totalItems : Math.min(startIndex + paginatedQueue.length, totalItems);

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
          <div style={{ fontSize: '2rem', fontWeight: '900' }}>{stylists.filter(s => s.is_available !== false).length}</div>
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
                <div style={{ marginTop: '-8px', marginBottom: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  {searchResults.map(c => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <CustomerAvatar name={c.name} avatarUrl={c.avatar_url} size={38} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <Phone size={10} style={{ display: 'inline', marginRight: '4px' }} />{c.phone}
                          {' · '} 🏆 {c.loyalty_points || 0} pts
                        </div>
                        {c.membership_name && (
                          <div style={{
                            fontSize: '0.74rem', color: parseFloat(c.remaining_service_credit ?? 0) <= 0 ? '#ef4444' : (c.membership_badge_color || '#2563eb'),
                            fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px'
                          }}>
                            💳 {c.membership_name} {parseFloat(c.remaining_service_credit ?? 0) <= 0 ? '(₹0 Bal - Credit Used)' : `(₹${parseFloat(c.remaining_service_credit || 0).toLocaleString()} Credit)`}
                          </div>
                        )}
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
                    <button
                      type="submit"
                      disabled={isSubmittingQuick}
                      className="btn-primary"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        gap: '8px',
                        opacity: isSubmittingQuick ? 0.75 : 1,
                        cursor: isSubmittingQuick ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isSubmittingQuick ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Saving Walk-in...
                        </>
                      ) : (
                        'Save & Select Walk-in'
                      )}
                    </button>
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
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                      {selectedCustomer.membership_name ? (
                        <span style={{
                          fontSize: '0.75rem',
                          background: parseFloat(selectedCustomer.remaining_service_credit ?? 0) <= 0 ? 'rgba(239, 68, 68, 0.15)' : (selectedCustomer.membership_badge_color ? `${selectedCustomer.membership_badge_color}22` : 'rgba(0,230,118,0.18)'),
                          color: parseFloat(selectedCustomer.remaining_service_credit ?? 0) <= 0 ? '#ef4444' : (selectedCustomer.membership_badge_color || '#2563eb'),
                          border: `1px solid ${parseFloat(selectedCustomer.remaining_service_credit ?? 0) <= 0 ? '#ef4444' : (selectedCustomer.membership_badge_color || '#2563eb')}`,
                          padding: '3px 10px', borderRadius: '8px', fontWeight: '800'
                        }}>
                          💳 {selectedCustomer.membership_name} — {parseFloat(selectedCustomer.remaining_service_credit ?? 0) <= 0 ? '₹0.00 Credit Remaining (Exhausted)' : `₹${parseFloat(selectedCustomer.remaining_service_credit || 0).toLocaleString()} Credit Available`}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-sub)', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>
                          No Active Membership
                        </span>
                      )}
                    </div>
                  </div>
                  <CheckCircle2 size={22} style={{ marginLeft: 'auto', color: '#10b981' }} />
                </div>
              </div>

              {/* ─── Booking Type, Date & Time Slot Selection ─── */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 18px', marginBottom: '16px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-sub)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} style={{ color: 'var(--accent-gold)' }} />
                    Booking Type / Source *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      { id: 'Walk-in', label: '🚶 Walk-in (Today)', color: '#10b981' },
                      { id: 'Scheduled', label: '📅 Scheduled Slot', color: '#818cf8' },
                      { id: 'Phone', label: '📞 Phone Booking', color: '#f59e0b' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setBookingType(type.id)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          border: bookingType === type.id ? `1.5px solid ${type.color}` : '1px solid var(--border)',
                          background: bookingType === type.id ? `${type.color}22` : 'var(--input-bg)',
                          color: bookingType === type.id ? type.color : 'var(--text-sub)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Appointment Date */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Appointment Date *</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setBookingDate(new Date().toISOString().split('T')[0])}
                          style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--accent-gold)', borderRadius: '4px', padding: '1px 6px', cursor: 'pointer', fontWeight: '700' }}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const tm = new Date();
                            tm.setDate(tm.getDate() + 1);
                            setBookingDate(tm.toISOString().split('T')[0]);
                          }}
                          style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--text-sub)', borderRadius: '4px', padding: '1px 6px', cursor: 'pointer', fontWeight: '700' }}
                        >
                          Tomorrow
                        </button>
                      </div>
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={e => handleDateChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    />
                  </div>

                  {/* Time Slot Picker */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Time Slot *</span>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          let h = d.getHours();
                          let m = d.getMinutes();
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          h = h % 12; h = h ? h : 12;
                          m = m < 10 ? '0' + m : m;
                          const newT = `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
                          handleTimeChange(newT);
                        }}
                        style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#10b981', borderRadius: '4px', padding: '1px 6px', cursor: 'pointer', fontWeight: '700' }}
                      >
                        Now
                      </button>
                    </label>
                    <select
                      value={bookingTime}
                      onChange={e => handleTimeChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      <option value={bookingTime}>{bookingTime} (Selected Slot)</option>
                      {[
                        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
                        '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
                        '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
                        '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM'
                      ].map(slot => {
                        const isSlotTaken = selectedStylist ? isStylistBookedAtSlot(selectedStylist, bookingDate, slot) : false;
                        return (
                          <option key={slot} value={slot} disabled={isSlotTaken}>
                            {slot} {isSlotTaken ? '🔴 (Stylist Booked)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Conflict Warning Banner if Selected Stylist is already booked at this Date & Time */}
              {selectedStylist && isStylistBookedAtSlot(selectedStylist, bookingDate, bookingTime) && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1.5px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '12px',
                  color: '#ef4444',
                  fontSize: '0.84rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>⛔ Stylist Time Slot Conflict!</div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
                      <strong>{stylists.find(s => String(s.id) === String(selectedStylist))?.name || 'Selected Stylist'}</strong> is already booked on <strong>{bookingDate}</strong> at <strong>{bookingTime}</strong>. Please pick a different time slot or another staff member.
                    </div>
                  </div>
                </div>
              )}

              {/* Multi-Service Required & Stylist Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Services Required *</span>
                    <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: '800' }}>
                      {selectedServices.length} Selected
                    </span>
                  </label>
                  
                  {/* Multi-service Checklist Dropdown Container */}
                  <div style={{
                    background: 'var(--input-bg)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    padding: '8px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {services && services.length > 0 ? (
                      services.map(srv => {
                        const isChecked = selectedServices.some(id => String(id) === String(srv.id));
                        return (
                          <label
                            key={srv.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justify: 'space-between',
                              padding: '6px 10px',
                              background: isChecked ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                              border: isChecked ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleServiceSelection(srv.id)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10b981' }}
                              />
                              <span style={{ fontWeight: isChecked ? '700' : '400', fontSize: '0.82rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {srv.name}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isChecked ? '#10b981' : 'var(--text-sub)', marginLeft: '8px', flexShrink: 0 }}>
                              ₹{parseFloat(srv.price || 0).toFixed(2)}
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <div style={{ padding: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No catalog services loaded.
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Assign Stylist / Staff</span>
                      {selectedStylist && isStylistBookedAtSlot(selectedStylist, bookingDate, bookingTime) && (
                        <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: '800' }}>
                          ⛔ Already Booked
                        </span>
                      )}
                    </label>
                    <select value={selectedStylist} onChange={e => setSelectedStylist(e.target.value)}>
                      <option value="">— Any Stylist —</option>
                      {stylists.map(s => {
                        const isBooked = isStylistBookedAtSlot(s.id, bookingDate, bookingTime);
                        const isOffline = s.is_available === false;
                        return (
                          <option key={s.id} value={s.id} disabled={isOffline || isBooked}>
                            {s.name} {isBooked ? '⛔ (Booked at ' + bookingTime + ')' : isOffline ? '⚠️ (Busy/Offline)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Summary of Selected Multi-Services */}
                  {selectedServices.length > 0 && (
                    <div style={{ marginTop: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '10px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: '800', display: 'flex', justifyContent: 'space-between' }}>
                        <span>🛒 Services Selected ({selectedServices.length}):</span>
                        <button type="button" onClick={() => setSelectedServices([])} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '800' }}>Clear</button>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-main)', fontWeight: '600', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {services.filter(s => selectedServices.some(id => String(id) === String(s.id))).map(s => s.name).join(', ')}
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
                        Total Amount: ₹{services.filter(s => selectedServices.some(id => String(id) === String(s.id))).reduce((sum, s) => sum + parseFloat(s.price || 0), 0).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dual Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  disabled={isAddingToQueue}
                  onClick={handleAddToQueue}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    gap: '6px',
                    background: '#2563eb',
                    opacity: isAddingToQueue ? 0.75 : 1,
                    cursor: isAddingToQueue ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isAddingToQueue ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Adding to Queue...
                    </>
                  ) : (
                    <>
                      <Plus size={15} /> Add to Today's Queue
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const selectedObjs = services.filter(s => selectedServices.some(id => String(id) === String(s.id)));
                    onCheckIn(selectedCustomer, selectedStylist || null, selectedObjs);
                  }}
                  className="btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <CreditCard size={15} /> Direct POS Checkout
                </button>
                <button
                  type="button"
                  className="glass-card"
                  onClick={() => { setSelectedCustomer(null); setSelectedServices([]); }}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} style={{ color: '#818cf8' }} />
              Today's Service Menu (Click to Multi-Select)
            </h3>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-sub)', padding: '3px 10px', borderRadius: '12px', fontWeight: '700' }}>
              {services.length} Catalog Services
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
            {services.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                No services loaded.
              </div>
            ) : services.map(s => {
              const isSelected = selectedServices.some(id => String(id) === String(s.id));
              const formattedPrice = parseFloat(s.price || 0).toFixed(2);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleServiceSelection(s.id)}
                  title="Click to toggle multi-select for Walk-in Check-in"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    gap: '14px',
                    padding: '14px 16px',
                    background: isSelected ? 'rgba(52, 211, 153, 0.12)' : 'var(--bg-card)',
                    borderRadius: '12px',
                    border: isSelected ? '1.5px solid #34d399' : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 4px 16px rgba(52, 211, 153, 0.15)' : 'none'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-hover)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--bg-card)';
                  }}
                >
                  {/* Left: Icon + Service Details */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                      background: isSelected ? 'rgba(52, 211, 153, 0.25)' : 'rgba(129, 140, 248, 0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isSelected ? '#34d399' : '#818cf8', border: `1px solid ${isSelected ? 'rgba(52,211,153,0.4)' : 'rgba(129,140,248,0.25)'}`
                    }}>
                      <Scissors size={18} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontWeight: '800',
                          fontSize: '0.92rem',
                          color: isSelected ? '#34d399' : 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {s.name}
                        </span>
                        {isSelected && (
                          <span style={{ fontSize: '0.66rem', background: '#34d399', color: '#000', padding: '2px 7px', borderRadius: '8px', fontWeight: '900', flexShrink: 0 }}>
                            ✓ SELECTED
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.72rem' }}>
                          {s.category || 'Service'}
                        </span>
                        <span>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} /> {s.duration_minutes || 30} min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price Pill Badge */}
                  <div style={{
                    flexShrink: 0,
                    padding: '6px 14px',
                    borderRadius: '20px',
                    background: isSelected ? 'rgba(52, 211, 153, 0.25)' : 'rgba(245, 158, 11, 0.12)',
                    border: isSelected ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(245, 158, 11, 0.3)',
                    color: isSelected ? '#34d399' : 'var(--accent-gold)',
                    fontWeight: '900',
                    fontSize: '0.95rem',
                    letterSpacing: '0.02em',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    ₹{formattedPrice}
                  </div>
                </div>
              );
            })}
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
              {loadingBackend ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Loader2 size={28} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--accent)' }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)', fontWeight: '700' }}>
                        Loading queue check-ins from server...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : paginatedQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No check-ins in queue matching criteria.
                  </td>
                </tr>
              ) : paginatedQueue.map(app => {
                const customer = customers.find(c => 
                  String(c.id) === String(app.customer_id) || 
                  (c.phone && String(c.phone).trim() === String(app.customer_phone).trim())
                ) || { name: app.customer_name || 'Walk-in Guest', avatar_url: app.customer_avatar, phone: app.customer_phone };

                const activeMember = (members || []).find(m => {
                  if (m.status !== 'Active') return false;
                  const appPhone = String(app.customer_phone || customer?.phone || '').replace(/\D/g, '').slice(-10);
                  const mPhone = String(m.customer_phone || '').replace(/\D/g, '').slice(-10);

                  // Priority 1: Exact 10-digit phone match
                  if (appPhone && mPhone && appPhone.length === 10 && mPhone.length === 10) {
                    return appPhone === mPhone;
                  }

                  // Priority 2: Customer ID match
                  if (app.customer_id && m.customer_id && String(app.customer_id) === String(m.customer_id)) {
                    return true;
                  }

                  // Priority 3: Name match ONLY if phones do not conflict
                  if (app.customer_name && m.customer_name) {
                    const appName = String(app.customer_name).toLowerCase().trim();
                    const mName = String(m.customer_name).toLowerCase().trim();
                    if (appName === mName) {
                      if (appPhone && mPhone && appPhone !== mPhone) return false;
                      return true;
                    }
                  }

                  return false;
                });

                return (
                  <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {/* Customer */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CustomerAvatar name={customer.name} avatarUrl={customer.avatar_url} size={36} />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{customer.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{customer.phone || app.customer_phone || 'Walk-in'}</div>
                          {(activeMember || customer.membership_name) && (() => {
                            const remBal = activeMember ? parseFloat(activeMember.remaining_service_credit ?? 0) : parseFloat(customer.remaining_service_credit ?? 0);
                            return (
                              <div style={{
                                fontSize: '0.70rem',
                                color: activeMember?.badge_color || customer.membership_badge_color || '#10b981',
                                background: `${activeMember?.badge_color || customer.membership_badge_color || '#10b981'}22`,
                                border: `1px solid ${activeMember?.badge_color || customer.membership_badge_color || '#10b981'}`,
                                padding: '2px 8px', borderRadius: '6px', fontWeight: '800', marginTop: '3px', width: 'fit-content'
                              }}>
                                👑 {activeMember?.membership_name || customer.membership_name} {remBal <= 0 ? '(₹0 Bal - Credit Used)' : `(₹${remBal.toLocaleString()} Credit)`}
                              </div>
                            );
                          })()}
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

                    {/* Time & Booking Details */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} style={{ color: '#818cf8' }} /> {app.appointment_time || '10:00 AM'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          📅 {normalizeDateStr(app.appointment_date) || 'Today'}
                        </div>
                        {app.booking_type && (
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: '800',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            width: 'fit-content',
                            marginTop: '2px',
                            background: app.booking_type === 'Walk-in' ? 'rgba(16, 185, 129, 0.15)' : app.booking_type === 'Phone' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(129, 140, 248, 0.15)',
                            color: app.booking_type === 'Walk-in' ? '#10b981' : app.booking_type === 'Phone' ? '#f59e0b' : '#818cf8',
                            border: `1px solid ${app.booking_type === 'Walk-in' ? 'rgba(16, 185, 129, 0.3)' : app.booking_type === 'Phone' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(129, 140, 248, 0.3)'}`
                          }}>
                            {app.booking_type === 'Walk-in' ? '🚶 Walk-in' : app.booking_type === 'Phone' ? '📞 Phone' : '📅 Scheduled'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '12px 16px', fontWeight: '800', color: 'var(--accent-gold)' }}>
                      ₹{app.total_amount || 350}
                    </td>

                    {/* Queue Status Toggle */}
                    <td style={{ padding: '12px 16px' }}>
                      {app.status === 'Completed' || app.payment_status === 'Paid' ? (
                        <span style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          border: '1px solid #10b981',
                          padding: '4px 10px',
                          borderRadius: '10px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <CheckCircle2 size={12} /> Completed ✓
                        </span>
                      ) : (
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
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {app.status === 'Completed' || app.payment_status === 'Paid' ? (
                          <span
                            style={{
                              padding: '5px 10px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid #10b981',
                              borderRadius: '8px',
                              color: '#10b981',
                              fontSize: '0.76rem',
                              fontWeight: '800',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <CheckCircle2 size={12} /> Paid
                          </span>
                        ) : (
                          <>
                            {activeMember && (() => {
                              const serviceCost = parseFloat(app.total_amount || 350);
                              const avail = parseFloat(activeMember.remaining_service_credit ?? 0);
                              if (avail <= 0) return null;

                              const deductAmt = Math.min(serviceCost, avail);
                              const remainingDue = Math.max(0, serviceCost - deductAmt);

                              return (
                                <button
                                  onClick={async () => {
                                    if (deductAmt <= 0) {
                                      setCustomAlert({
                                        title: 'Insufficient Credit',
                                        message: `Customer has ₹0.00 credit remaining in ${activeMember.membership_name}. Please proceed with POS Billing Checkout.`,
                                        type: 'warning'
                                      });
                                      return;
                                    }

                                    if (remainingDue === 0) {
                                      // 100% Covered by Membership Wallet Credit
                                      if (onDeductMemberCredit) {
                                        onDeductMemberCredit(activeMember, deductAmt);
                                      }

                                      if (onCreateBill) {
                                        await onCreateBill({
                                          customer_id: app.customer_id || activeMember.customer_id || null,
                                          customer_name: app.customer_name || activeMember.customer_name || 'Walk-in Member',
                                          customer_phone: app.customer_phone || activeMember.customer_phone || '',
                                          stylist_id: app.stylist_id || null,
                                          stylist_name: app.stylist_name || 'Staff',
                                          subtotal: serviceCost,
                                          discount_amount: deductAmt,
                                          total: 0,
                                          grand_total: 0,
                                          payment_mode: 'Membership Wallet Credit',
                                          payment_status: 'Paid',
                                          notes: `Fully covered ₹${deductAmt.toFixed(2)} under Active Membership Plan (${activeMember.membership_name})`,
                                          items: [
                                            {
                                              service_name: app.service_name || 'Salon Care Service',
                                              quantity: 1,
                                              price: serviceCost,
                                              total: serviceCost
                                            }
                                          ]
                                        });
                                      }

                                      if (onUpdateAppointmentStatus) {
                                        await onUpdateAppointmentStatus(app.id, 'Completed');
                                      }

                                      fetchBackendQueue();
                                      setCustomAlert({
                                        title: '🎉 Walk-in Checkout Successful!',
                                        message: `Customer: ${app.customer_name || activeMember.customer_name}\nPlan: 100% Covered under ${activeMember.membership_name}\nRemaining Due: ₹0.00\nWallet Credit Deducted: ₹${deductAmt.toFixed(2)}`,
                                        type: 'success'
                                      });
                                    } else {
                                      // Partial credit case (e.g. ₹950 credit available for ₹1200 service)
                                      // Direct customer to POS Billing where ₹950 credit is automatically applied and net ₹250 is collected cleanly
                                      if (onCheckIn) {
                                        onCheckIn(
                                          { name: app.customer_name || activeMember.customer_name, phone: app.customer_phone || activeMember.customer_phone, id: app.customer_id || activeMember.customer_id },
                                          app.stylist_id,
                                          app.services?.length ? app.services : [{ id: app.id || Date.now(), name: app.service_name || 'Salon Service', price: serviceCost }]
                                        );
                                      }

                                      setCustomAlert({
                                        title: '💳 Membership Wallet Credit Ready!',
                                        message: `Customer: ${app.customer_name || activeMember.customer_name}\nPlan: ${activeMember.membership_name}\n• Total Service Charge: ₹${serviceCost.toFixed(2)}\n• Wallet Credit Applied: ₹${deductAmt.toFixed(2)}\n• Net Balance to Collect: ₹${remainingDue.toFixed(2)}\n\nOpening POS Billing for checkout...`,
                                        type: 'info'
                                      });
                                    }
                                  }}
                                  title={`Redeem Membership Credit (Avail: ₹${avail.toFixed(2)})`}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '5px 10px',
                                    background: 'rgba(245, 158, 11, 0.18)',
                                    border: '1px solid #f59e0b',
                                    borderRadius: '8px',
                                    color: '#f59e0b',
                                    fontSize: '0.76rem',
                                    fontWeight: '800',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Crown size={12} /> Use Credit (₹{deductAmt.toFixed(0)})
                                </button>
                              );
                            })()}

                            <button
                              onClick={() => {
                                let appServices = [];
                                const appCost = parseFloat(app.total_amount);
                                const hasAppCost = !isNaN(appCost) && appCost >= 0;

                                if (app.service_id) {
                                  const srv = services.find(s => String(s.id) === String(app.service_id));
                                  if (srv) {
                                    appServices.push({
                                      ...srv,
                                      price: hasAppCost ? appCost : parseFloat(srv.price || 0)
                                    });
                                  }
                                }
                                if (Array.isArray(app.service_ids)) {
                                  app.service_ids.forEach(id => {
                                    const srv = services.find(s => String(s.id) === String(id));
                                    if (srv && !appServices.some(m => String(m.id) === String(srv.id))) {
                                      appServices.push({
                                        ...srv,
                                        price: hasAppCost ? appCost : parseFloat(srv.price || 0)
                                      });
                                    }
                                  });
                                }
                                if (appServices.length === 0 && app.service_name) {
                                  const sName = String(app.service_name).toLowerCase();
                                  const srv = services.find(s => sName.includes(String(s.name || '').toLowerCase()));
                                  if (srv) {
                                    appServices.push({
                                      ...srv,
                                      price: hasAppCost ? appCost : parseFloat(srv.price || 0)
                                    });
                                  } else {
                                    appServices.push({
                                      id: app.service_id || Date.now(),
                                      name: app.service_name,
                                      price: hasAppCost ? appCost : 350,
                                      category: 'Service'
                                    });
                                  }
                                }
                                if (appServices.length === 1 && hasAppCost) {
                                  appServices[0] = { ...appServices[0], price: appCost };
                                }

                                onCheckIn(customer, app.stylist_id, appServices);
                              }}
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
                          </>
                        )}

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

        {/* ─── Queue Pagination Bar ─── */}
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          fontSize: '0.85rem',
          color: 'var(--text-sub)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
              <span>Show walk-ins:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  setPageSize(val);
                  setCurrentPage(1);
                }}
                style={{
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">All</option>
              </select>
            </label>

            {loadingBackend && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontWeight: '700', fontSize: '0.8rem' }}>
                <Loader2 size={14} className="animate-spin" /> Fetching queue...
              </span>
            )}
          </div>

          <div>
            Showing <strong style={{ color: 'var(--text-main)' }}>{totalItems > 0 ? startIndex + 1 : 0}</strong> to{' '}
            <strong style={{ color: 'var(--text-main)' }}>{endIndex}</strong> of{' '}
            <strong style={{ color: 'var(--text-main)' }}>{totalItems}</strong> entries
          </div>

          {!isAll && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                disabled={safePage === 1}
                onClick={() => setCurrentPage(1)}
                style={{
                  padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border)',
                  background: 'var(--input-bg)', color: 'var(--text-main)',
                  cursor: safePage === 1 ? 'not-allowed' : 'pointer', opacity: safePage === 1 ? 0.4 : 1
                }}
                title="First Page"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                disabled={safePage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{
                  padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border)',
                  background: 'var(--input-bg)', color: 'var(--text-main)',
                  cursor: safePage === 1 ? 'not-allowed' : 'pointer', opacity: safePage === 1 ? 0.4 : 1
                }}
                title="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>

              <span style={{ padding: '0 8px', fontWeight: '700', color: 'var(--text-main)' }}>
                Page {safePage} of {totalPages}
              </span>

              <button
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{
                  padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border)',
                  background: 'var(--input-bg)', color: 'var(--text-main)',
                  cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', opacity: safePage >= totalPages ? 0.4 : 1
                }}
                title="Next Page"
              >
                <ChevronRight size={14} />
              </button>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                style={{
                  padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border)',
                  background: 'var(--input-bg)', color: 'var(--text-main)',
                  cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', opacity: safePage >= totalPages ? 0.4 : 1
                }}
                title="Last Page"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          )}
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
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Booking Date</label>
                  <input
                    type="date"
                    value={editFormData.appointment_date || ''}
                    onChange={e => setEditFormData({...editFormData, appointment_date: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Time Slot</label>
                  <select
                    value={editFormData.appointment_time || ''}
                    onChange={e => setEditFormData({...editFormData, appointment_time: e.target.value})}
                  >
                    <option value={editFormData.appointment_time}>{editFormData.appointment_time || 'Select Slot'}</option>
                    {[
                      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
                      '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
                      '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
                      '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM'
                    ].map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Booking Type / Source</label>
                <select
                  value={editFormData.booking_type || 'Walk-in'}
                  onChange={e => setEditFormData({...editFormData, booking_type: e.target.value})}
                >
                  <option value="Walk-in">🚶 Walk-in (Today)</option>
                  <option value="Scheduled">📅 Scheduled Slot</option>
                  <option value="Phone">📞 Phone Call Booking</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Special request or preferences"
                  value={editFormData.notes || ''}
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

      {/* ─── THEME-MATCHED CUSTOM ALERT / NOTIFICATION MODAL ─── */}
      {customAlert && (
        <div className="modal-overlay" style={{ zIndex: 10000, animation: 'fadeIn 0.2s ease-out' }}>
          <div className="glass-panel modal-content" style={{
            maxWidth: '440px',
            width: '90%',
            padding: '32px 28px 28px',
            textAlign: 'center',
            borderRadius: '24px',
            border: customAlert.type === 'success' ? '1.5px solid #10b981' : customAlert.type === 'error' ? '1.5px solid #ef4444' : '1.5px solid var(--accent-gold)',
            boxShadow: customAlert.type === 'success' ? '0 20px 50px rgba(16, 185, 129, 0.25)' : customAlert.type === 'error' ? '0 20px 50px rgba(239, 68, 68, 0.25)' : '0 20px 50px rgba(245, 158, 11, 0.25)',
            background: 'var(--bg-surface)'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: customAlert.type === 'success' ? 'rgba(16, 185, 129, 0.16)' : customAlert.type === 'error' ? 'rgba(239, 68, 68, 0.16)' : 'rgba(245, 158, 11, 0.16)',
              color: customAlert.type === 'success' ? '#10b981' : customAlert.type === 'error' ? '#ef4444' : 'var(--accent-gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
              border: customAlert.type === 'success' ? '1.5px solid rgba(16, 185, 129, 0.4)' : customAlert.type === 'error' ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1.5px solid rgba(245, 158, 11, 0.4)'
            }}>
              {customAlert.type === 'success' ? <CheckCircle2 size={34} /> : customAlert.type === 'error' ? <AlertCircle size={34} /> : <Sparkles size={34} />}
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '10px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {customAlert.title || 'SalonPulse Notice'}
            </h3>

            <div style={{
              fontSize: '0.88rem',
              color: 'var(--text-sub)',
              marginBottom: '26px',
              lineHeight: '1.6',
              whiteSpace: 'pre-line',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '14px 16px',
              borderRadius: '14px',
              border: '1px solid var(--border)'
            }}>
              {customAlert.message}
            </div>

            <button
              type="button"
              onClick={() => setCustomAlert(null)}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.95rem',
                fontWeight: '900',
                borderRadius: '14px',
                background: customAlert.type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : customAlert.type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: customAlert.type === 'success' ? '0 4px 20px rgba(16, 185, 129, 0.4)' : '0 4px 20px rgba(37, 99, 235, 0.4)',
                cursor: 'pointer'
              }}
            >
              Done / Got It
            </button>
          </div>
        </div>
      )}

      {/* ─── PAST DATE/TIME WARNING CONFIRMATION MODAL ─── */}
      {pastConfirmModal.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 10000, animation: 'fadeIn 0.2s ease-out' }}>
          <div className="glass-panel modal-content" style={{
            maxWidth: '460px',
            width: '90%',
            padding: '32px 28px 28px',
            textAlign: 'center',
            borderRadius: '24px',
            border: '1.5px solid var(--accent-gold)',
            boxShadow: '0 20px 50px rgba(245, 158, 11, 0.25)',
            background: 'var(--bg-surface)'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.16)',
              color: 'var(--accent-gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
              border: '1.5px solid rgba(245, 158, 11, 0.4)'
            }}>
              <AlertCircle size={34} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '10px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Back-Dated Appointment Alert
            </h3>

            <div style={{
              fontSize: '0.88rem',
              color: 'var(--text-sub)',
              marginBottom: '24px',
              lineHeight: '1.6',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '14px 16px',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              textAlign: 'left'
            }}>
              <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>⚠️ Selected schedule is in the past:</div>
              <div style={{ fontWeight: '800', color: 'var(--accent-gold)', marginTop: '6px' }}>
                📅 Date: {pastConfirmModal.pendingDate || bookingDate}
                <br />
                ⏰ Time Slot: {pastConfirmModal.pendingTime || bookingTime}
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                This date/time slot is earlier than current live time. Do you want to proceed with back-dated check-in?
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setPastConfirmModal({ isOpen: false, pendingDate: '', pendingTime: '', onConfirmAction: null });
                }}
                className="glass-card"
                style={{ flex: 1, padding: '12px', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: '700' }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (pastConfirmModal.onConfirmAction) {
                    pastConfirmModal.onConfirmAction();
                  }
                  setPastConfirmModal({ isOpen: false, pendingDate: '', pendingTime: '', onConfirmAction: null });
                }}
                className="btn-primary"
                style={{
                  flex: 1.2,
                  padding: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
                  cursor: 'pointer'
                }}
              >
                ✓ Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceptionistView;
