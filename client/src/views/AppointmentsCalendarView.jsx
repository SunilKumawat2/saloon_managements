import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar, Clock, Scissors, UserCheck, Plus, CheckCircle2,
  AlertCircle, ChevronLeft, ChevronRight, MessageSquare, Send,
  ShieldCheck, Lock, Edit3, Trash2, X, Search, Phone, User,
  Sparkles, RefreshCw, CalendarDays, LayoutGrid, ListFilter,
  ChevronDown, Check, Crown, Star, Award, AlertTriangle, UserX
} from 'lucide-react';
import { Admin_Get_Staff_Attendance } from '../services/apiService';

const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'http://localhost:5000';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00'
];

// Helper: Format Date robustly to YYYY-MM-DD in local time
const formatDateKey = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const d = new Date(str);
  if (isNaN(d.getTime())) {
    return str.split('T')[0].split(' ')[0];
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  timeSlots = [],
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

  // New Booking State - Customer empty by default, supports multiple services
  const [newApp, setNewApp] = useState({
    customer_id: '',
    stylist_id: stylists[0]?.id || '',
    service_id: services[0]?.id || '',
    service_ids: services[0]?.id ? [services[0].id] : [],
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '11:00',
    source: 'Online Self-Booking',
    notes: ''
  });

  // Searchable Customer State for Book Appointment Modal
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerSelectRef = useRef(null);

  // Multi-service booking state for Book Appointment Modal
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('ALL');
  const servicesSelectRef = useRef(null);

  // Staff Attendance Cache by Date: { [dateKey]: Map<staff_id, record> }
  const [attendanceDateMap, setAttendanceDateMap] = useState({});
  const [loadingAttendanceDate, setLoadingAttendanceDate] = useState(false);

  // Unavailable Staff Confirmation Warning Modal State
  const [unavailableWarningModal, setUnavailableWarningModal] = useState({
    isOpen: false,
    stylist: null,
    availability: null,
    targetDate: '',
    targetTime: '',
    previousStylistId: '',
    targetStylistId: '',
    context: 'add' // 'add' | 'edit' | 'reschedule'
  });

  // Close customer and services dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerSelectRef.current && !customerSelectRef.current.contains(event.target)) {
        setIsCustomerDropdownOpen(false);
      }
      if (servicesSelectRef.current && !servicesSelectRef.current.contains(event.target)) {
        setIsServicesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedCustomerObj = useMemo(() => {
    if (!newApp.customer_id || !customers) return null;
    return customers.find(c => String(c.id) === String(newApp.customer_id)) || null;
  }, [newApp.customer_id, customers]);

  const filteredModalCustomers = useMemo(() => {
    if (!customers || customers.length === 0) return [];
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.toLowerCase().trim();
    return customers.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && String(c.phone).includes(q))
    );
  }, [customers, customerSearchQuery]);

  // Customer Type & Segmentation Helper
  const getCustomerType = (cust, allApps = []) => {
    if (!cust) return { label: 'New Client', icon: '🆕', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.35)', desc: 'First or recent salon visitor' };

    if (cust.is_blocked || cust.status === 'Blocked') {
      return {
        label: 'Blocked Client',
        icon: '🚫',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.2)',
        border: 'rgba(239, 68, 68, 0.5)',
        desc: cust.block_reason ? `Blocked: ${cust.block_reason}` : 'This client is currently blocked'
      };
    }

    if (cust.is_abandoned || cust.status === 'Abandoned') {
      return {
        label: 'Abandoned Client',
        icon: '⚠️',
        color: '#f97316',
        bg: 'rgba(249, 115, 22, 0.2)',
        border: 'rgba(249, 115, 22, 0.5)',
        desc: 'Customer marked as abandoned (dormant)'
      };
    }

    const points = Number(cust.loyalty_points || 0);
    const membershipName = cust.membership_name;

    const custApps = (allApps || []).filter(a =>
      (a.customer_id && String(a.customer_id) === String(cust.id)) ||
      (a.customer_name && cust.name && String(a.customer_name).toLowerCase().trim() === String(cust.name).toLowerCase().trim())
    );
    const visitCount = (cust.total_visits != null && cust.total_visits > 0)
      ? Math.max(cust.total_visits, custApps.length)
      : custApps.length;

    if (membershipName) {
      return {
        label: `💎 ${membershipName}`,
        icon: '👑',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.18)',
        border: 'rgba(245, 158, 11, 0.4)',
        desc: `Active Member: ${membershipName}`
      };
    }

    if (points >= 200 || visitCount >= 5) {
      return {
        label: 'VIP Client',
        icon: '👑',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.18)',
        border: 'rgba(245, 158, 11, 0.4)',
        desc: 'High-Value VIP regular customer'
      };
    }

    if (visitCount >= 2 || points >= 50) {
      return {
        label: 'Regular Client',
        icon: '⭐',
        color: '#818cf8',
        bg: 'rgba(99, 102, 241, 0.18)',
        border: 'rgba(99, 102, 241, 0.4)',
        desc: 'Frequent returning regular client'
      };
    }

    return {
      label: 'New Client',
      icon: '🆕',
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.15)',
      border: 'rgba(52, 211, 153, 0.35)',
      desc: 'First or recent new visitor'
    };
  };

  // Detailed History and Metrics for Selected Customer
  const customerHistoryStats = useMemo(() => {
    if (!selectedCustomerObj) return null;

    const userApps = (appointments || []).filter(a => {
      const matchId = a.customer_id && String(a.customer_id) === String(selectedCustomerObj.id);
      const matchName = a.customer_name && selectedCustomerObj.name &&
        String(a.customer_name).toLowerCase().trim() === String(selectedCustomerObj.name).toLowerCase().trim();
      return matchId || matchName;
    });

    const totalVisits = (selectedCustomerObj.total_visits != null && selectedCustomerObj.total_visits > 0)
      ? Math.max(selectedCustomerObj.total_visits, userApps.length)
      : userApps.length;

    const completedApps = userApps.filter(a => String(a.status || '').toLowerCase() === 'completed');
    const cancelledApps = userApps.filter(a => String(a.status || '').toLowerCase() === 'cancelled');

    const sortedApps = [...userApps].sort((a, b) => {
      const dateA = new Date(a.appointment_date || 0).getTime();
      const dateB = new Date(b.appointment_date || 0).getTime();
      return dateB - dateA;
    });

    const lastApp = sortedApps[0] || null;
    let lastVisitDate = totalVisits === 0 ? 'First Visit' : 'None yet';
    let lastServiceName = null;

    if (lastApp) {
      lastVisitDate = formatDateKey(lastApp.appointment_date);
      lastServiceName = lastApp.service_name || services.find(s => String(s.id) === String(lastApp.service_id))?.name || null;
    }

    const stylistCounts = {};
    userApps.forEach(a => {
      const sId = a.stylist_id;
      const sName = a.stylist_name || stylists.find(s => String(s.id) === String(sId))?.name;
      if (sId && sName) {
        if (!stylistCounts[sId]) {
          stylistCounts[sId] = { id: sId, name: sName, count: 0 };
        }
        stylistCounts[sId].count += 1;
      }
    });

    let favStylist = null;
    Object.values(stylistCounts).forEach(item => {
      if (!favStylist || item.count > favStylist.count) {
        favStylist = item;
      }
    });

    const typeInfo = getCustomerType(selectedCustomerObj, appointments);

    return {
      typeInfo,
      totalVisits,
      completedCount: completedApps.length,
      cancelledCount: cancelledApps.length,
      lastVisitDate,
      lastServiceName,
      favStylist,
      loyaltyPoints: selectedCustomerObj.loyalty_points || 0,
      notes: selectedCustomerObj.notes || ''
    };
  }, [selectedCustomerObj, appointments, services, stylists]);

  const getDayNameFromDateStr = (dateStr) => {
    if (!dateStr) return '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return days[d.getDay()];
  };

  const availableTimeSlots = useMemo(() => {
    if (!timeSlots || timeSlots.length === 0) return TIME_SLOTS;
    const targetDate = newApp?.appointment_date || selectedDate;
    const dayName = getDayNameFromDateStr(targetDate);

    const active = timeSlots.filter(s => {
      if (s.is_active === false) return false;

      if (s.specific_date && targetDate) {
        return s.specific_date === targetDate;
      }
      if (s.specific_date && s.specific_date !== targetDate) {
        return false;
      }

      if (s.day_of_week && s.day_of_week !== 'ALL' && dayName) {
        return s.day_of_week === dayName;
      }

      return true;
    });

    return active.length > 0 ? active : timeSlots.filter(s => s.is_active !== false);
  }, [timeSlots, newApp?.appointment_date, selectedDate]);

  const getSlotValue = (slotItem) => typeof slotItem === 'object' ? (slotItem.start_time || slotItem.slot_time) : slotItem;

  const getSlotLabel = (slotItem) => {
    if (typeof slotItem === 'object') {
      const s = slotItem.start_time || slotItem.slot_time;
      const e = slotItem.end_time;
      const d = slotItem.duration_minutes || 60;
      let extra = '';
      if (slotItem.specific_date) {
        extra = ` [📆 Date: ${String(slotItem.specific_date).split('T')[0]}]`;
      } else if (slotItem.day_of_week && slotItem.day_of_week !== 'ALL') {
        extra = ` [📅 ${slotItem.day_of_week}]`;
      }
      return e ? `${s} - ${e} (${d} min)${extra}` : `${s} (${d} min)${extra}`;
    }
    return slotItem;
  };

  // Sync default IDs when stylists, customers, or services load
  React.useEffect(() => {
    if (stylists && stylists.length > 0) {
      setNewApp(prev => {
        const exists = stylists.some(s => String(s.id) === String(prev.stylist_id));
        return exists ? prev : { ...prev, stylist_id: stylists[0].id };
      });
    }
  }, [stylists]);

  React.useEffect(() => {
    if (customers && customers.length > 0) {
      setNewApp(prev => {
        if (!prev.customer_id) return prev;
        const exists = customers.some(c => String(c.id) === String(prev.customer_id));
        return exists ? prev : { ...prev, customer_id: '' };
      });
    }
  }, [customers]);

  React.useEffect(() => {
    if (services && services.length > 0) {
      setNewApp(prev => {
        const hasServiceIds = Array.isArray(prev.service_ids) && prev.service_ids.length > 0;
        if (hasServiceIds) return prev;
        const exists = services.some(s => String(s.id) === String(prev.service_id));
        const defaultId = exists ? prev.service_id : services[0].id;
        return {
          ...prev,
          service_id: defaultId,
          service_ids: [defaultId]
        };
      });
    }
  }, [services]);

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
  const [rescheduleOverrideConfirmed, setRescheduleOverrideConfirmed] = useState(false);

  // Open Add Modal & Sync Selected Date
  const handleOpenAddModal = () => {
    const defaultStylistId = (stylists && stylists.length > 0) ? stylists[0].id : '';
    const defaultServiceId = (services && services.length > 0) ? services[0].id : '';

    setNewApp({
      customer_id: '',
      stylist_id: defaultStylistId,
      service_id: defaultServiceId,
      service_ids: defaultServiceId ? [defaultServiceId] : [],
      appointment_date: selectedDate,
      appointment_time: '11:00',
      source: 'Online Self-Booking',
      notes: ''
    });
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
    setIsServicesDropdownOpen(false);
    setServiceSearchQuery('');
    setServiceCategoryFilter('ALL');
    setShowAddModal(true);
  };

  // Date Nav Handlers
  const handleShiftDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const parseSafeId = (idVal) => {
    if (idVal == null) return idVal;
    const num = Number(idVal);
    return isNaN(num) ? idVal : num;
  };

  const normalizeDate = (d) => {
    return formatDateKey(d);
  };

  // Normalize time to HH:MM — handles "11:00", "11:00:00", "11:00 AM", etc.
  const normalizeHour = (t) => {
    if (!t) return '';
    const str = String(t).trim();
    // Match HH:MM from any format like "11:00:00", "11:00", "9:30 AM"
    const match = str.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return match[1].padStart(2, '0') + ':' + match[2];
    }
    // Fallback: just hour number
    const hourOnly = str.match(/(\d{1,2})/);
    return hourOnly ? hourOnly[1].padStart(2, '0') + ':00' : '';
  };

  const checkDoubleBooking = (dateStr, timeStr, stylistId, excludeAppId = null) => {
    if (!dateStr || !timeStr) return null;
    const effectiveStylistId = stylistId || (stylists[0] && stylists[0].id);
    if (!effectiveStylistId) return null;

    const normTargetDate = normalizeDate(dateStr);
    const normTargetHour = normalizeHour(timeStr);

    return appointments.find(app => {
      if (excludeAppId && String(app.id) === String(excludeAppId)) return false;
      if (String(app.status || '').toLowerCase() === 'cancelled') return false;

      const normAppDate = normalizeDate(app.appointment_date);
      const normAppHour = normalizeHour(app.appointment_time);

      const appDateMatch = normAppDate === normTargetDate;
      const appTimeMatch = normAppHour === normTargetHour;

      const isStylistMatch = String(app.stylist_id) === String(effectiveStylistId) ||
        (app.stylist_name && stylists.some(s => String(s.id) === String(effectiveStylistId) && String(app.stylist_name).toLowerCase().trim() === String(s.name).toLowerCase().trim()));

      return appDateMatch && appTimeMatch && isStylistMatch;
    });
  };

  // Load staff attendance records for a specific date
  const loadStaffAttendanceForDate = async (targetDate) => {
    const dateKey = formatDateKey(targetDate);
    if (!dateKey || attendanceDateMap[dateKey]) return;
    try {
      setLoadingAttendanceDate(true);
      const res = await Admin_Get_Staff_Attendance({ date: dateKey, limit: 0 });
      if (res && res.data && Array.isArray(res.data.data)) {
        const map = new Map();
        res.data.data.forEach(r => map.set(String(r.staff_id), r));
        setAttendanceDateMap(prev => ({ ...prev, [dateKey]: map }));
      }
    } catch (err) {
      console.warn('Could not fetch staff attendance for date:', dateKey, err);
    } finally {
      setLoadingAttendanceDate(false);
    }
  };

  // Auto-fetch staff attendance whenever appointment dates change
  useEffect(() => {
    const d = newApp.appointment_date || selectedDate;
    if (d) loadStaffAttendanceForDate(d);
  }, [newApp.appointment_date, selectedDate]);

  useEffect(() => {
    if (editingApp && editData.appointment_date) {
      loadStaffAttendanceForDate(editData.appointment_date);
    }
  }, [editingApp, editData.appointment_date]);

  useEffect(() => {
    if (reschedulingApp && rescheduleDate) {
      loadStaffAttendanceForDate(rescheduleDate);
    }
  }, [reschedulingApp, rescheduleDate]);

  // Comprehensive Availability Check: Checks Attendance Status + Appointment Double-Booking
  const getStylistAvailability = (stylistId, dateStr, timeStr, excludeAppId = null) => {
    const sId = String(stylistId || '');
    if (!sId) {
      return {
        isAvailable: false,
        status: 'NONE',
        badge: '⚪ No Staff',
        tag: '[No Staff]',
        shortTag: '[No Staff]',
        color: '#94a3b8',
        title: 'No Staff Selected',
        reason: 'Please select a staff member'
      };
    }

    const stObj = stylists.find(s => String(s.id) === sId);
    const stName = stObj?.name || 'Staff';

    // 1. Conflict Check: Double-booked at this specific appointment date & time
    const conflict = checkDoubleBooking(dateStr, timeStr, sId, excludeAppId);
    if (conflict) {
      const cTime = conflict.appointment_time || timeStr;
      return {
        isAvailable: false,
        status: 'DOUBLE_BOOKED',
        badge: '🔴 Booked',
        tag: `🔴 [Unavailable - Booked at ${cTime}]`,
        shortTag: '🔴 [Booked]',
        color: '#f87171',
        title: 'Already Booked for Another Appointment',
        reason: `${stName} is already booked at ${cTime} for client "${conflict.customer_name || 'Client'}" (${conflict.service_name || 'Service'}).`,
        conflict
      };
    }

    // 2. Attendance Check for dateStr
    const dateKey = formatDateKey(dateStr);
    const dateMap = attendanceDateMap[dateKey];
    const rec = dateMap ? dateMap.get(sId) : null;
    const todayKey = new Date().toISOString().split('T')[0];
    const isToday = dateKey === todayKey;

    if (rec) {
      // Marked Absent
      if (rec.status === 'Absent') {
        return {
          isAvailable: false,
          status: 'ABSENT',
          badge: '🔴 Absent',
          tag: '🔴 [Unavailable - Absent Today]',
          shortTag: '🔴 [Absent]',
          color: '#f87171',
          title: 'Marked Absent in Daily Register',
          reason: `${stName} is marked ABSENT in staff attendance on ${dateKey}${rec.notes ? ` (${rec.notes})` : ''}.`
        };
      }

      // Marked On Leave
      if (rec.status === 'On Leave') {
        return {
          isAvailable: false,
          status: 'ON_LEAVE',
          badge: '🟣 On Leave',
          tag: '🟣 [Unavailable - On Leave]',
          shortTag: '🟣 [On Leave]',
          color: '#c084fc',
          title: 'Approved Leave in Daily Attendance',
          reason: `${stName} is on approved LEAVE on ${dateKey}${rec.notes ? ` (${rec.notes})` : ''}.`
        };
      }

      // Marked Short Leave
      if (rec.status === 'Short Leave') {
        return {
          isAvailable: false,
          status: 'SHORT_LEAVE',
          badge: '⏱️ Short Leave',
          tag: '⏱️ [Unavailable - Short Leave]',
          shortTag: '⏱️ [Short Leave]',
          color: '#22d3ee',
          title: 'On Approved Short Leave / Permission',
          reason: `${stName} has an approved Short Leave on ${dateKey}${rec.notes ? ` (${rec.notes})` : ''}.`
        };
      }

      // If Today: Check Live Shift Punch (Clock-in / Clock-out)
      if (isToday) {
        if (rec.check_out_time) {
          return {
            isAvailable: false,
            status: 'CLOCKED_OUT',
            badge: '⚪ Shift Ended',
            tag: `⚪ [Unavailable - Shift Ended at ${rec.check_out_time}]`,
            shortTag: '⚪ [Shift Ended]',
            color: '#94a3b8',
            title: 'Shift Ended / Clocked Out',
            reason: `${stName} already clocked out at ${rec.check_out_time} (Shift Completed).`
          };
        }

        if (rec.check_in_time && !rec.check_out_time) {
          return {
            isAvailable: true,
            status: 'AVAILABLE',
            badge: '🟢 Available (On Floor)',
            tag: '🟢 [Available - On Floor]',
            shortTag: '🟢 [Available]',
            color: '#4ade80',
            title: 'Clocked In & Ready on Floor',
            reason: `${stName} clocked in at ${rec.check_in_time} and is currently ready on the salon floor.`
          };
        }
      }

      // Marked Present, Late, Half Day
      if (rec.status === 'Present' || rec.status === 'Late' || rec.status === 'Half Day') {
        return {
          isAvailable: true,
          status: 'AVAILABLE',
          badge: '🟢 Available',
          tag: '🟢 [Available]',
          shortTag: '🟢 [Available]',
          color: '#4ade80',
          title: 'Marked on Duty & Available',
          reason: `${stName} is on duty on ${dateKey}.`
        };
      }
    }

    // If today and no attendance record exists yet
    if (isToday) {
      return {
        isAvailable: false,
        status: 'NOT_CLOCKED_IN',
        badge: '🟡 Not Clocked In',
        tag: '🟡 [Unavailable - Not Clocked In Yet]',
        shortTag: '🟡 [Not Clocked In]',
        color: '#facc15',
        title: 'Staff Member Has Not Clocked In Today',
        reason: `${stName} has not clocked in yet today in salon attendance.`
      };
    }

    // Future date without leave recorded
    return {
      isAvailable: true,
      status: 'AVAILABLE',
      badge: '🟢 Available',
      tag: '🟢 [Available]',
      shortTag: '🟢 [Available]',
      color: '#4ade80',
      title: 'Scheduled on Roster',
      reason: `${stName} is scheduled on the salon roster for this date.`
    };
  };

  // Stylist Selection Handler with Immediate Warning Confirmation Modal for Unavailable Staff
  const handleStylistSelectChange = (selectedId, context = 'add') => {
    const selectedSt = stylists.find(s => String(s.id) === String(selectedId));
    if (!selectedSt) return;

    let targetDate = newApp.appointment_date;
    let targetTime = newApp.appointment_time;
    let previousStylistId = newApp.stylist_id;
    let excludeId = null;

    if (context === 'edit') {
      targetDate = editData.appointment_date;
      targetTime = editData.appointment_time;
      previousStylistId = editData.stylist_id;
      excludeId = editingApp?.id;
    } else if (context === 'reschedule') {
      targetDate = rescheduleDate;
      targetTime = rescheduleTime;
      previousStylistId = rescheduleStylist;
      excludeId = reschedulingApp?.id;
    }

    const avail = getStylistAvailability(selectedId, targetDate, targetTime, excludeId);

    if (!avail.isAvailable) {
      // Trigger Warning & Confirmation Modal!
      setUnavailableWarningModal({
        isOpen: true,
        stylist: selectedSt,
        availability: avail,
        targetDate,
        targetTime,
        previousStylistId,
        targetStylistId: selectedId,
        context
      });
    } else {
      // Directly assign available staff
      if (context === 'add') {
        setNewApp(prev => ({ ...prev, stylist_id: selectedId, stylist_override_confirmed: false }));
      } else if (context === 'edit') {
        setEditData(prev => ({ ...prev, stylist_id: selectedId, stylist_override_confirmed: false }));
      } else if (context === 'reschedule') {
        setRescheduleStylist(selectedId);
      }
    }
  };

  // Confirm Assignment of Unavailable Staff (Override)
  const handleConfirmUnavailableAssignment = () => {
    const { targetStylistId, context } = unavailableWarningModal;
    if (context === 'add') {
      setNewApp(prev => ({ ...prev, stylist_id: targetStylistId, stylist_override_confirmed: true }));
    } else if (context === 'edit') {
      setEditData(prev => ({ ...prev, stylist_id: targetStylistId, stylist_override_confirmed: true }));
    } else if (context === 'reschedule') {
      setRescheduleStylist(targetStylistId);
      setRescheduleOverrideConfirmed(true);
    }
    setUnavailableWarningModal({
      isOpen: false,
      stylist: null,
      availability: null,
      targetDate: '',
      targetTime: '',
      previousStylistId: '',
      targetStylistId: '',
      context: 'add'
    });
  };

  // Cancel Assignment of Unavailable Staff (Keep previous selection)
  const handleCancelUnavailableAssignment = () => {
    setUnavailableWarningModal({
      isOpen: false,
      stylist: null,
      availability: null,
      targetDate: '',
      targetTime: '',
      previousStylistId: '',
      targetStylistId: '',
      context: 'add'
    });
  };

  // Multi-service memoized list and calculations for Book Appointment Modal
  const selectedServicesList = useMemo(() => {
    if (!newApp.service_ids || newApp.service_ids.length === 0) {
      if (newApp.service_id) {
        const single = services.find(s => String(s.id) === String(newApp.service_id));
        return single ? [single] : [];
      }
      return [];
    }
    return services.filter(s => newApp.service_ids.some(id => String(id) === String(s.id)));
  }, [newApp.service_ids, newApp.service_id, services]);

  const totalServicesPrice = useMemo(() => {
    return selectedServicesList.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  }, [selectedServicesList]);

  const totalServicesDuration = useMemo(() => {
    return selectedServicesList.reduce((sum, s) => sum + (Number(s.duration) || 30), 0);
  }, [selectedServicesList]);

  const serviceCategories = useMemo(() => {
    const cats = new Set();
    services.forEach(s => {
      if (s.category && typeof s.category === 'string') cats.add(s.category.trim());
    });
    return ['ALL', ...Array.from(cats)];
  }, [services]);

  const filteredServicesList = useMemo(() => {
    let list = services || [];
    if (serviceCategoryFilter && serviceCategoryFilter !== 'ALL') {
      list = list.filter(s => (s.category || '').toLowerCase() === serviceCategoryFilter.toLowerCase());
    }
    if (serviceSearchQuery.trim()) {
      const q = serviceSearchQuery.toLowerCase().trim();
      list = list.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [services, serviceCategoryFilter, serviceSearchQuery]);

  const handleToggleBookingService = (serviceId) => {
    setNewApp(prev => {
      const currentIds = Array.isArray(prev.service_ids)
        ? [...prev.service_ids]
        : (prev.service_id ? [prev.service_id] : []);
      const existsIndex = currentIds.findIndex(id => String(id) === String(serviceId));
      let updatedIds;
      if (existsIndex >= 0) {
        updatedIds = currentIds.filter(id => String(id) !== String(serviceId));
      } else {
        updatedIds = [...currentIds, serviceId];
      }
      return {
        ...prev,
        service_ids: updatedIds,
        service_id: updatedIds.length > 0 ? updatedIds[0] : ''
      };
    });
  };

  // Smart Stylist Prioritization & Sorting:
  // Stylists who provide the selected services automatically appear at the TOP!
  const sortedStylists = useMemo(() => {
    if (!stylists || stylists.length === 0) return [];
    if (selectedServicesList.length === 0) {
      return stylists.map(st => ({
        ...st,
        matchCount: 0,
        matchPct: 0,
        isFullMatch: false,
        isPartialMatch: false,
        matchBadge: 'Stylist'
      }));
    }

    const analyzed = stylists.map(st => {
      let matchCount = 0;
      const matchedServiceNames = [];

      selectedServicesList.forEach(srv => {
        const srvId = Number(srv.id);
        let matches = false;
        if (Array.isArray(st.service_ids) && st.service_ids.some(id => Number(id) === srvId)) {
          matches = true;
        } else if (st.specialization && typeof st.specialization === 'string') {
          const specLower = st.specialization.toLowerCase();
          const srvNameLower = (srv.name || '').toLowerCase();
          if (srvNameLower && (specLower.includes(srvNameLower) || srvNameLower.includes(specLower))) {
            matches = true;
          }
        }

        if (matches) {
          matchCount++;
          matchedServiceNames.push(srv.name);
        }
      });

      const isFullMatch = matchCount === selectedServicesList.length && selectedServicesList.length > 0;
      const isPartialMatch = matchCount > 0 && !isFullMatch;
      const matchPct = Math.round((matchCount / selectedServicesList.length) * 100);

      let matchBadge = '';
      if (isFullMatch) {
        matchBadge = selectedServicesList.length > 1
          ? `⭐ Specialist for all ${selectedServicesList.length} services`
          : '⭐ Specialist for this service';
      } else if (isPartialMatch) {
        matchBadge = `✂️ Specialist for ${matchCount}/${selectedServicesList.length} services`;
      } else {
        matchBadge = 'General Stylist';
      }

      return {
        ...st,
        matchCount,
        matchPct,
        isFullMatch,
        isPartialMatch,
        matchBadge,
        matchedServiceNames
      };
    });

    return analyzed.sort((a, b) => {
      // 1. Available stylists first, unavailable stylists below!
      const aAvail = getStylistAvailability(a.id, newApp.appointment_date, newApp.appointment_time);
      const bAvail = getStylistAvailability(b.id, newApp.appointment_date, newApp.appointment_time);
      if (aAvail.isAvailable !== bAvail.isAvailable) {
        return aAvail.isAvailable ? -1 : 1;
      }
      // 2. Highest match count first (specialists on top)
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      // 3. Higher rating first
      const rA = Number(a.rating) || 0;
      const rB = Number(b.rating) || 0;
      if (rB !== rA) return rB - rA;
      // 4. Alphabetical by name
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [stylists, selectedServicesList, newApp.appointment_date, newApp.appointment_time, attendanceDateMap]);

  // Top recommended specialist (prioritizes available specialists)
  const topSpecialist = useMemo(() => {
    if (!sortedStylists || sortedStylists.length === 0) return null;
    return sortedStylists.find(s => {
      const av = getStylistAvailability(s.id, newApp.appointment_date, newApp.appointment_time);
      return s.matchCount > 0 && av.isAvailable;
    }) || sortedStylists.find(s => s.matchCount > 0) || null;
  }, [sortedStylists, newApp.appointment_date, newApp.appointment_time, attendanceDateMap]);

  // Currently selected stylist's match details
  const selectedStylistMatchInfo = useMemo(() => {
    if (!newApp.stylist_id || !sortedStylists) return null;
    return sortedStylists.find(s => String(s.id) === String(newApp.stylist_id)) || null;
  }, [newApp.stylist_id, sortedStylists]);

  // Auto-switch to top available specialist if current stylist has 0 matches or is unavailable
  useEffect(() => {
    if (sortedStylists.length > 0 && selectedServicesList.length > 0 && !newApp.stylist_override_confirmed) {
      const currentSelected = sortedStylists.find(s => String(s.id) === String(newApp.stylist_id));
      const currentAvail = currentSelected ? getStylistAvailability(currentSelected.id, newApp.appointment_date, newApp.appointment_time) : null;
      if (!currentSelected || currentSelected.matchCount === 0 || !currentAvail?.isAvailable) {
        const topAvailable = sortedStylists.find(s => {
          const av = getStylistAvailability(s.id, newApp.appointment_date, newApp.appointment_time);
          return s.matchCount > 0 && av.isAvailable;
        }) || sortedStylists.find(s => {
          const av = getStylistAvailability(s.id, newApp.appointment_date, newApp.appointment_time);
          return av.isAvailable;
        });
        if (topAvailable && String(topAvailable.id) !== String(newApp.stylist_id)) {
          setNewApp(prev => ({ ...prev, stylist_id: topAvailable.id }));
        }
      }
    }
  }, [selectedServicesList.length, sortedStylists, attendanceDateMap, newApp.appointment_date, newApp.appointment_time]);

  // Submit Add Booking
  const handleAddSubmit = (e) => {
    e.preventDefault();

    if (!newApp.customer_id) {
      alert('⚠️ Please search and select a customer before confirming booking.');
      setIsCustomerDropdownOpen(true);
      return;
    }

    if (!newApp.service_ids || newApp.service_ids.length === 0) {
      alert('⚠️ Please select at least one salon service.');
      setIsServicesDropdownOpen(true);
      return;
    }

    let effectiveStylistId = newApp.stylist_id;
    let selectedStylist = stylists.find(s => String(s.id) === String(effectiveStylistId));

    if (!selectedStylist && sortedStylists && sortedStylists.length > 0) {
      selectedStylist = sortedStylists[0];
      effectiveStylistId = selectedStylist.id;
    }

    // Availability & Warning Confirmation Check:
    // If the assigned staff is unavailable and admin hasn't confirmed the override, prompt Warning Modal!
    const avail = getStylistAvailability(effectiveStylistId, newApp.appointment_date, newApp.appointment_time);
    if (!avail.isAvailable && !newApp.stylist_override_confirmed) {
      setUnavailableWarningModal({
        isOpen: true,
        stylist: selectedStylist,
        availability: avail,
        targetDate: newApp.appointment_date,
        targetTime: newApp.appointment_time,
        previousStylistId: newApp.stylist_id,
        targetStylistId: effectiveStylistId,
        context: 'add'
      });
      return;
    }

    const selectedCust = customers.find(c => String(c.id) === String(newApp.customer_id)) || null;
    if (selectedCust?.is_blocked || selectedCust?.status === 'Blocked') {
      alert(`🚫 Cannot book appointment: Customer "${selectedCust.name}" is BLOCKED${selectedCust.block_reason ? ` (${selectedCust.block_reason})` : ''}. Please unblock this customer in CRM before booking.`);
      return;
    }

    const combinedServiceName = selectedServicesList.map(s => s.name).join(', ');
    const primaryService = selectedServicesList[0] || (services.find(s => String(s.id) === String(newApp.service_id)) || services[0]);

    if (onAddAppointment) {
      onAddAppointment({
        ...newApp,
        customer_id: parseSafeId(newApp.customer_id),
        stylist_id: parseSafeId(effectiveStylistId),
        service_id: parseSafeId(primaryService?.id),
        service_ids: selectedServicesList.map(s => parseSafeId(s.id)),
        customer_name: selectedCust?.name || 'Walk-in Client',
        service_name: combinedServiceName || primaryService?.name || 'Salon Service',
        stylist_name: selectedStylist?.name || 'Staff',
        total_amount: totalServicesPrice > 0 ? totalServicesPrice : (primaryService?.price || 350.00),
        stylist_override_confirmed: Boolean(newApp.stylist_override_confirmed)
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

      const avail = getStylistAvailability(editData.stylist_id, editData.appointment_date, editData.appointment_time, editingApp.id);
      if (!avail.isAvailable && !editData.stylist_override_confirmed) {
        setUnavailableWarningModal({
          isOpen: true,
          stylist: selectedStylist,
          availability: avail,
          targetDate: editData.appointment_date,
          targetTime: editData.appointment_time,
          previousStylistId: editingApp.stylist_id,
          targetStylistId: editData.stylist_id,
          context: 'edit'
        });
        return;
      }

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
      const targetStylistId = rescheduleStylist || reschedulingApp.stylist_id;
      const selectedStylist = stylists.find(s => String(s.id) === String(targetStylistId));

      const avail = getStylistAvailability(targetStylistId, rescheduleDate, rescheduleTime, reschedulingApp.id);
      if (!avail.isAvailable && !rescheduleOverrideConfirmed) {
        setUnavailableWarningModal({
          isOpen: true,
          stylist: selectedStylist,
          availability: avail,
          targetDate: rescheduleDate,
          targetTime: rescheduleTime,
          previousStylistId: reschedulingApp.stylist_id,
          targetStylistId,
          context: 'reschedule'
        });
        return;
      }

      onUpdateAppointment(reschedulingApp.id, {
        ...reschedulingApp,
        appointment_date: rescheduleDate,
        appointment_time: rescheduleTime,
        stylist_id: parseSafeId(targetStylistId),
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

  // Send Real SMS / WhatsApp Reminder Deep Links
  const handleSendReminder = (type) => {
    if (!reminderApp) return;

    const rawPhone = (reminderApp.customer_phone || '9876543210').replace(/\D/g, '');
    const phoneWithCountry = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const custName = reminderApp.customer_name || 'Valued Client';
    const servName = reminderApp.service_name || 'Salon Service';
    const stylName = reminderApp.stylist_name || 'Senior Stylist';
    const dateStr = formatDateKey(reminderApp.appointment_date);
    const timeStr = reminderApp.appointment_time || '11:00';

    const messageText = `Hi ${custName}! Your salon appointment for ${servName} with ${stylName} is confirmed for ${dateStr} at ${timeStr}. Please arrive 5 minutes early. Reply 1 to Confirm, 2 to Reschedule. — SalonPulse ERP`;
    const encodedText = encodeURIComponent(messageText);

    if (type === 'whatsapp') {
      const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodedText}`;
      window.open(waUrl, '_blank');
      setReminderToast(`✅ Opened WhatsApp Web with reminder for ${custName} (${rawPhone})!`);
    } else {
      const smsUrl = `sms:${rawPhone}?body=${encodedText}`;
      window.open(smsUrl, '_blank');
      setReminderToast(`✅ Sent SMS Reminder Gateway trigger to ${custName} (${rawPhone})!`);
    }

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
            {availableTimeSlots.map(slotItem => {
              const time = getSlotValue(slotItem);
              const label = getSlotLabel(slotItem);
              return (
                <div key={time} style={{ display: 'grid', gridTemplateColumns: `100px repeat(${stylists.length || 3}, 1fr)`, gap: '1px', background: 'var(--border)', borderTop: 'none' }}>
                  {/* Time Column */}
                  <div style={{ background: 'var(--bg-card)', padding: '16px 10px', fontWeight: '800', fontSize: '0.78rem', color: 'var(--accent-gold)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <span>{time}</span>
                    {typeof slotItem === 'object' && slotItem.end_time && (
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: '600' }}>till {slotItem.end_time}</span>
                    )}
                  </div>

                  {/* Stylist Columns for this Time Slot */}
                  {stylists.map((st, idx) => {
                    const matched = filteredAppointments.filter(a => {
                      const isDirectMatch = String(a.stylist_id) === String(st.id) ||
                        (a.stylist_name && st.name && String(a.stylist_name).toLowerCase().trim() === String(st.name).toLowerCase().trim());
                      const isLegacyOrUnassigned = idx === 0 && !stylists.some(s =>
                        String(s.id) === String(a.stylist_id) ||
                        (s.name && a.stylist_name && String(s.name).toLowerCase().trim() === String(a.stylist_name).toLowerCase().trim())
                      );
                      const isStylistMatch = isDirectMatch || isLegacyOrUnassigned;
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
                                        setRescheduleOverrideConfirmed(false);
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
              );
            })}
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
                              setRescheduleOverrideConfirmed(false);
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
        <div className="modal-overlay" style={{ overflowY: 'auto', padding: '16px 10px' }}>
          <div className="glass-panel modal-content appointment-modal-compact" style={{ maxWidth: '680px', width: '94%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', padding: '16px 20px', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', letterSpacing: '0.01em' }}>
                <Calendar size={15} style={{ color: 'var(--accent-gold)' }} /> Book Appointment
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              {/* Searchable Select Customer Field */}
              <div className="form-group" ref={customerSelectRef} style={{ position: 'relative', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <label style={{ margin: 0, fontWeight: '600', fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.02em' }}>
                    Select Customer <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  {selectedCustomerObj ? (
                    <span style={{ fontSize: '0.64rem', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle2 size={10} /> Customer Selected
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                      Search by name or mobile
                    </span>
                  )}
                </div>

                {/* If NO customer is selected (Default State) */}
                {!selectedCustomerObj ? (
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Search
                      size={12}
                      style={{
                        position: 'absolute',
                        left: '9px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--accent-gold)',
                        pointerEvents: 'none'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search customer by name or mobile number..."
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        setIsCustomerDropdownOpen(true);
                      }}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                      style={{
                        width: '100%',
                        height: '30px',
                        padding: '3px 28px',
                        backgroundColor: 'rgba(9, 14, 24, 0.95)',
                        border: isCustomerDropdownOpen ? '1.5px solid #2563eb' : '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '0.70rem',
                        fontWeight: '500',
                        outline: 'none',
                        boxShadow: isCustomerDropdownOpen ? '0 0 0 2px rgba(37, 99, 235, 0.3)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />
                    <div
                      onClick={() => setIsCustomerDropdownOpen(prev => !prev)}
                      style={{
                        position: 'absolute',
                        right: '9px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <ChevronDown
                        size={13}
                        style={{
                          transform: isCustomerDropdownOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  /* If Customer IS Selected */
                  <div
                    onClick={() => setIsCustomerDropdownOpen(prev => !prev)}
                    style={{
                      width: '100%',
                      height: '30px',
                      padding: '3px 8px',
                      backgroundColor: 'rgba(9, 14, 24, 0.95)',
                      border: isCustomerDropdownOpen ? '1.5px solid #2563eb' : '1px solid rgba(37, 99, 235, 0.5)',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '0.70rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: isCustomerDropdownOpen ? '0 0 0 2px rgba(37, 99, 235, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                      <User size={12} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                      <span style={{ fontWeight: '600', fontSize: '0.70rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedCustomerObj.name}
                      </span>
                      {selectedCustomerObj.phone && (
                        <span style={{ fontSize: '0.64rem', color: '#94a3b8', flexShrink: 0 }}>
                          ({selectedCustomerObj.phone})
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewApp(prev => ({ ...prev, customer_id: '' }));
                          setCustomerSearchQuery('');
                          setIsCustomerDropdownOpen(true);
                        }}
                        title="Deselect Customer"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#cbd5e1',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={11} />
                      </button>
                      <ChevronDown
                        size={14}
                        style={{
                          color: 'var(--text-muted)',
                          transform: isCustomerDropdownOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Dropdown Floating Results Menu */}
                {isCustomerDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      background: 'rgba(10, 15, 29, 0.98)',
                      backdropFilter: 'blur(20px)',
                      border: '1.5px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '12px',
                      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85)',
                      zIndex: 100,
                      overflow: 'hidden'
                    }}
                  >
                    {/* Search input inside dropdown when customer was already selected */}
                    {selectedCustomerObj && (
                      <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.03)' }}>
                        <div style={{ position: 'relative' }}>
                          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input
                            type="text"
                            autoFocus
                            value={customerSearchQuery}
                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                            placeholder="Type to search another customer..."
                            style={{
                              width: '100%',
                              height: '32px',
                              padding: '4px 8px 4px 30px',
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontSize: '0.78rem',
                              outline: 'none'
                            }}
                          />
                          {customerSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setCustomerSearchQuery('')}
                              style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer'
                              }}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Customer Options List */}
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {filteredModalCustomers.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.80rem' }}>
                          No customer found matching "{customerSearchQuery}"
                        </div>
                      ) : (
                        filteredModalCustomers.map(c => {
                          const isSelected = String(c.id) === String(newApp.customer_id);
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                if (c.is_blocked || c.status === 'Blocked') {
                                  alert(`🚫 Customer "${c.name}" is BLOCKED${c.block_reason ? ` (Reason: ${c.block_reason})` : ''}. Appointments cannot be booked for blocked clients.`);
                                  return;
                                }
                                setNewApp(prev => ({ ...prev, customer_id: c.id }));
                                setCustomerSearchQuery('');
                                setIsCustomerDropdownOpen(false);
                              }}
                              style={{
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: (c.is_blocked || c.status === 'Blocked') ? 'not-allowed' : 'pointer',
                                background: isSelected ? 'rgba(37, 99, 235, 0.22)' : ((c.is_blocked || c.status === 'Blocked') ? 'rgba(239, 68, 68, 0.07)' : 'transparent'),
                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                transition: 'background 0.15s ease',
                                opacity: (c.is_blocked || c.status === 'Blocked') ? 0.75 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: isSelected ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: '700',
                                  color: isSelected ? '#ffffff' : 'var(--accent-gold)'
                                }}>
                                  {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                                      {c.name}
                                    </span>
                                    {(() => {
                                      const t = getCustomerType(c, appointments);
                                      return (
                                        <span style={{
                                          fontSize: '0.62rem',
                                          fontWeight: '700',
                                          padding: '1px 5px',
                                          borderRadius: '4px',
                                          background: t.bg,
                                          color: t.color,
                                          border: `1px solid ${t.border}`,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '2px'
                                        }}>
                                          {t.icon} {t.label}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <Phone size={10} /> {c.phone || 'No phone'}
                                    {c.loyalty_points ? <span style={{ color: '#f59e0b', marginLeft: '4px' }}>• 🏆 {c.loyalty_points} pts</span> : null}
                                  </div>
                                </div>
                              </div>

                              {isSelected && (
                                <Check size={16} style={{ color: '#38bdf8' }} />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Selected Customer Type & History Card ─── */}
              {customerHistoryStats && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%)',
                  border: `1.5px solid ${customerHistoryStats.typeInfo.border}`,
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
                }}>
                  {/* Top Row: Customer Type Badges & Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: customerHistoryStats.typeInfo.bg,
                        color: customerHistoryStats.typeInfo.color,
                        border: `1px solid ${customerHistoryStats.typeInfo.border}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>{customerHistoryStats.typeInfo.icon}</span>
                        <span>{customerHistoryStats.typeInfo.label}</span>
                      </span>

                      {selectedCustomerObj.membership_name && (
                        <span style={{
                          fontSize: '0.70rem',
                          fontWeight: '700',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          background: 'rgba(234, 179, 8, 0.15)',
                          color: '#eab308',
                          border: '1px solid rgba(234, 179, 8, 0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          💳 {selectedCustomerObj.membership_name} {selectedCustomerObj.membership_discount ? `(${selectedCustomerObj.membership_discount}% OFF)` : ''}
                        </span>
                      )}

                      {customerHistoryStats.cancelledCount > 0 && (
                        <span style={{
                          fontSize: '0.66rem',
                          fontWeight: '700',
                          padding: '1px 6px',
                          borderRadius: '5px',
                          background: 'rgba(239, 68, 68, 0.14)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                          ⚠️ {customerHistoryStats.cancelledCount} Cancelled
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      {customerHistoryStats.typeInfo.desc}
                    </div>
                  </div>

                  {/* Metric Counters Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '6px',
                    background: 'rgba(15, 23, 42, 0.65)',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    textAlign: 'center',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: '600' }}>Total Bookings</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#ffffff', marginTop: '1px' }}>
                        {customerHistoryStats.totalVisits}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: '600' }}>Completed</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#34d399', marginTop: '1px' }}>
                        {customerHistoryStats.completedCount}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: '600' }}>Loyalty Points</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#f59e0b', marginTop: '1px' }}>
                        🏆 {customerHistoryStats.loyaltyPoints}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: '600' }}>Last Visit</div>
                      <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#38bdf8', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {customerHistoryStats.lastVisitDate}
                      </div>
                    </div>
                  </div>

                  {/* Service & Stylist History Details */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                    fontSize: '0.70rem',
                    color: '#cbd5e1'
                  }}>
                    {customerHistoryStats.lastServiceName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#94a3b8' }}>Last Availed:</span>
                        <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>
                          ✂️ {customerHistoryStats.lastServiceName}
                        </span>
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8' }}>
                        🌟 First-time booking at salon
                      </div>
                    )}

                    {customerHistoryStats.favStylist && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#94a3b8' }}>Fav Stylist:</span>
                        <button
                          type="button"
                          onClick={() => setNewApp(prev => ({ ...prev, stylist_id: customerHistoryStats.favStylist.id }))}
                          title="Click to assign favorite stylist"
                          style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                            borderRadius: '5px',
                            padding: '1px 6px',
                            color: '#818cf8',
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          👤 {customerHistoryStats.favStylist.name} (Select)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Customer Personal Notes / Allergy Warning */}
                  {customerHistoryStats.notes && (
                    <div style={{
                      marginTop: '6px',
                      padding: '4px 8px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      borderLeft: '2.5px solid #f59e0b',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      color: '#fde68a'
                    }}>
                      <strong style={{ color: '#fbbf24' }}>Client Note: </strong>
                      <span>{customerHistoryStats.notes}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Multi-Service Selector Field */}
              <div className="form-group" ref={servicesSelectRef} style={{ position: 'relative', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: '600', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                    <Scissors size={12} style={{ color: 'var(--accent-gold)' }} />
                    Select Services <span style={{ color: '#ef4444' }}>*</span>
                    {selectedServicesList.length > 0 && (
                      <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '1px 7px', borderRadius: '10px', fontSize: '0.62rem', fontWeight: '700' }}>
                        {selectedServicesList.length} Selected
                      </span>
                    )}
                  </label>
                  {selectedServicesList.length > 0 && (
                    <div style={{ fontSize: '0.66rem', color: '#34d399', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Est. Total: ₹{totalServicesPrice}</span>
                      <span style={{ color: '#64748b' }}>•</span>
                      <span style={{ color: '#94a3b8' }}>~{totalServicesDuration} min</span>
                    </div>
                  )}
                </div>

                {/* Trigger Box showing Chips */}
                <div
                  onClick={() => setIsServicesDropdownOpen(!isServicesDropdownOpen)}
                  style={{
                    minHeight: '34px',
                    padding: '4px 8px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: isServicesDropdownOpen ? '1px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: isServicesDropdownOpen ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {selectedServicesList.length === 0 ? (
                    <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Plus size={12} /> Click here to select one or more services...
                    </span>
                  ) : (
                    <>
                      {selectedServicesList.map(srv => (
                        <span
                          key={srv.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'rgba(59, 130, 246, 0.18)',
                            border: '1px solid rgba(59, 130, 246, 0.35)',
                            color: '#93c5fd',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: '600',
                            userSelect: 'none'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{srv.name}</span>
                          <span style={{ color: '#6ee7b7', fontSize: '0.62rem' }}>₹{srv.price}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBookingService(srv.id);
                            }}
                            title="Remove service"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#93c5fd',
                              cursor: 'pointer',
                              padding: '0 2px',
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 1
                            }}
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                      <span style={{ fontSize: '0.65rem', color: '#60a5fa', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px', padding: '2px 4px' }}>
                        <Plus size={11} /> Add more
                      </span>
                    </>
                  )}
                  <ChevronDown size={13} style={{ marginLeft: selectedServicesList.length === 0 ? 'auto' : '2px', transform: isServicesDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', color: '#94a3b8' }} />
                </div>

                {/* Dropdown Popover */}
                {isServicesDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      boxShadow: '0 12px 28px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                      zIndex: 60,
                      padding: '8px',
                      maxHeight: '320px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Search Bar */}
                    <div style={{ position: 'relative', marginBottom: '6px' }}>
                      <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        type="text"
                        placeholder="Search services by name or category..."
                        value={serviceSearchQuery}
                        onChange={(e) => setServiceSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '5px 8px 5px 26px',
                          fontSize: '0.7rem',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '5px',
                          color: '#f8fafc',
                          outline: 'none'
                        }}
                        autoFocus
                      />
                      {serviceSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setServiceSearchQuery('')}
                          style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>

                    {/* Category Filter Pills */}
                    {serviceCategories.length > 2 && (
                      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '6px', borderBottom: '1px solid rgba(51, 65, 85, 0.6)' }}>
                        {serviceCategories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setServiceCategoryFilter(cat)}
                            style={{
                              padding: '2px 8px',
                              fontSize: '0.62rem',
                              fontWeight: serviceCategoryFilter === cat ? '700' : '500',
                              borderRadius: '12px',
                              border: serviceCategoryFilter === cat ? '1px solid #3b82f6' : '1px solid rgba(71, 85, 105, 0.4)',
                              background: serviceCategoryFilter === cat ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                              color: serviceCategoryFilter === cat ? '#60a5fa' : '#94a3b8',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Services List with Checkboxes */}
                    <div style={{ overflowY: 'auto', maxHeight: '180px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {filteredServicesList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '12px', color: '#64748b', fontSize: '0.7rem' }}>
                          No services found matching "{serviceSearchQuery}"
                        </div>
                      ) : (
                        filteredServicesList.map(srv => {
                          const isSelected = (newApp.service_ids || []).some(id => String(id) === String(srv.id));
                          return (
                            <div
                              key={srv.id}
                              onClick={() => handleToggleBookingService(srv.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '5px 8px',
                                borderRadius: '5px',
                                background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                border: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.12s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // handled by parent div click
                                  style={{ cursor: 'pointer', accentColor: '#3b82f6', width: '13px', height: '13px' }}
                                />
                                <div>
                                  <div style={{ fontSize: '0.72rem', fontWeight: isSelected ? '700' : '500', color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                                    {srv.name}
                                  </div>
                                  <div style={{ fontSize: '0.62rem', color: '#64748b', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    {srv.category && <span style={{ color: '#94a3b8' }}>{srv.category}</span>}
                                    {srv.duration && <span>• {srv.duration} min</span>}
                                  </div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#34d399' }}>
                                  ₹{srv.price}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Popover Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #334155' }}>
                      <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                        {selectedServicesList.length} of {services.length} selected
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsServicesDropdownOpen(false)}
                        style={{
                          background: '#3b82f6',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '0.68rem',
                          fontWeight: '600',
                          padding: '3px 10px',
                          cursor: 'pointer'
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Assign Stylist with Smart Prioritization & Top Matching Specialist on TOP */}
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: '600', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                    <UserCheck size={12} style={{ color: 'var(--accent-gold)' }} />
                    Assign Stylist
                  </label>
                  {selectedStylistMatchInfo && selectedServicesList.length > 0 && (
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: '600',
                      color: selectedStylistMatchInfo.isFullMatch ? '#34d399' : (selectedStylistMatchInfo.isPartialMatch ? '#60a5fa' : '#94a3b8'),
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      {selectedStylistMatchInfo.isFullMatch ? '⭐ Service Specialist' : (selectedStylistMatchInfo.isPartialMatch ? '✂️ Partial Match' : '')}
                    </span>
                  )}
                </div>

                {(() => {
                  const currentSelectedId = sortedStylists.some(st => String(st.id) === String(newApp.stylist_id)) ? newApp.stylist_id : (sortedStylists[0]?.id || '');
                  const currentAvail = getStylistAvailability(currentSelectedId, newApp.appointment_date, newApp.appointment_time);
                  const availableStylists = sortedStylists.filter(st => getStylistAvailability(st.id, newApp.appointment_date, newApp.appointment_time).isAvailable);
                  const unavailableStylists = sortedStylists.filter(st => !getStylistAvailability(st.id, newApp.appointment_date, newApp.appointment_time).isAvailable);

                  return (
                    <>
                      <select
                        value={currentSelectedId}
                        onChange={(e) => handleStylistSelectChange(e.target.value, 'add')}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          height: '34px',
                          border: currentAvail.isAvailable ? '1px solid #334155' : '1.5px solid rgba(239, 68, 68, 0.6)',
                          background: currentAvail.isAvailable ? '#1e293b' : 'rgba(30, 41, 59, 0.95)',
                          color: '#f8fafc'
                        }}
                      >
                        {/* Group 1: 🟢 Available Staff (On Floor & Free) */}
                        {availableStylists.length > 0 && (
                          <optgroup label="🟢 Available Staff (Ready on Floor / Scheduled)">
                            {availableStylists.map(st => {
                              const av = getStylistAvailability(st.id, newApp.appointment_date, newApp.appointment_time);
                              const icon = st.isFullMatch ? '⭐' : (st.isPartialMatch ? '✂️' : '👤');
                              return (
                                <option key={st.id} value={st.id} style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: '600' }}>
                                  {icon} {st.name} — {st.matchBadge} ({st.specialization}) {av.tag}
                                </option>
                              );
                            })}
                          </optgroup>
                        )}

                        {/* Group 2: 🔴 Unavailable Staff (Off Duty / Leave / Booked) */}
                        {unavailableStylists.length > 0 && (
                          <optgroup label="🔴 Unavailable Staff (Off Duty / Leave / Booked - Warning on selection)">
                            {unavailableStylists.map(st => {
                              const av = getStylistAvailability(st.id, newApp.appointment_date, newApp.appointment_time);
                              return (
                                <option key={st.id} value={st.id} style={{ fontSize: '0.72rem', color: '#f87171' }}>
                                  ⚠️ {st.name} — {st.matchBadge} ({st.specialization}) {av.tag}
                                </option>
                              );
                            })}
                          </optgroup>
                        )}
                      </select>

                      {/* Live Staff Availability Status Ribbon */}
                      <div style={{
                        marginTop: '4px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.67rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        background: currentAvail.isAvailable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.12)',
                        border: currentAvail.isAvailable ? '1px solid rgba(34, 197, 94, 0.35)' : '1.5px solid rgba(239, 68, 68, 0.45)',
                        color: currentAvail.isAvailable ? '#4ade80' : '#f87171'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                          <span style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: currentAvail.isAvailable ? '#22c55e' : '#ef4444',
                            boxShadow: currentAvail.isAvailable ? '0 0 6px #22c55e' : '0 0 6px #ef4444',
                            display: 'inline-block'
                          }} />
                          {currentAvail.badge}
                          {newApp.stylist_override_confirmed && !currentAvail.isAvailable && (
                            <span style={{ fontSize: '0.6rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.18)', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '1px 5px', borderRadius: '3px' }}>
                              ⚠️ Override Confirmed
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize: '0.64rem', color: currentAvail.isAvailable ? '#cbd5e1' : '#fca5a5' }}>
                          {currentAvail.reason}
                        </span>
                      </div>
                    </>
                  );
                })()}

                {/* Smart Recommendation Banner / Hint */}
                {topSpecialist && String(topSpecialist.id) !== String(newApp.stylist_id) && selectedServicesList.length > 0 && (
                  <div style={{
                    marginTop: '4px',
                    padding: '3px 8px',
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    borderRadius: '4px',
                    fontSize: '0.64rem',
                    color: '#fef08a',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>
                      💡 <strong>Recommended:</strong> {topSpecialist.name} ({topSpecialist.matchBadge})
                      {' '}
                      {(() => {
                        const topAv = getStylistAvailability(topSpecialist.id, newApp.appointment_date, newApp.appointment_time);
                        return <span style={{ color: topAv.color, fontWeight: '700' }}>{topAv.shortTag}</span>;
                      })()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStylistSelectChange(topSpecialist.id, 'add')}
                      style={{
                        background: '#ca8a04',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '0.6rem',
                        fontWeight: '600',
                        padding: '1px 6px',
                        cursor: 'pointer'
                      }}
                    >
                      Assign
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: '600', marginBottom: '3px', display: 'block', color: '#94a3b8' }}>Appointment Date</label>
                  <input
                    type="date"
                    required
                    value={newApp.appointment_date}
                    onChange={(e) => setNewApp({ ...newApp, appointment_date: e.target.value })}
                    style={{ fontSize: '0.72rem', fontWeight: '500', height: '31px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: '600', marginBottom: '3px', display: 'block', color: '#94a3b8' }}>Booking Time Slot</label>
                  <select
                    value={newApp.appointment_time}
                    onChange={(e) => setNewApp({ ...newApp, appointment_time: e.target.value })}
                    style={{ fontSize: '0.72rem', fontWeight: '500', height: '31px' }}
                  >
                    {availableTimeSlots.map(slotItem => {
                      const t = getSlotValue(slotItem);
                      const label = getSlotLabel(slotItem);
                      const isB = checkDoubleBooking(newApp.appointment_date, t, newApp.stylist_id);
                      return (
                        <option key={t} value={t} style={{ fontSize: '0.72rem' }}>
                          {label} {isB ? `🚫 (Already Booked - ${isB.customer_name || 'Client'})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {checkDoubleBooking(newApp.appointment_date, newApp.appointment_time, newApp.stylist_id) && (
                <div style={{
                  padding: '5px 8px',
                  background: newApp.stylist_override_confirmed ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: newApp.stylist_override_confirmed ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '6px',
                  color: newApp.stylist_override_confirmed ? '#f59e0b' : '#ef4444',
                  fontSize: '0.68rem',
                  fontWeight: '600',
                  marginTop: '2px',
                  marginBottom: '6px'
                }}>
                  {newApp.stylist_override_confirmed
                    ? '⚠️ Staff member is already booked at this slot, but Admin Override has been CONFIRMED.'
                    : `⚠️ Staff member is ALREADY BOOKED for ${newApp.appointment_date} at ${newApp.appointment_time}. Please select an open time slot or another staff member.`
                  }
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', marginBottom: '3px', display: 'block', color: '#94a3b8' }}>Booking Source</label>
                <select
                  value={newApp.source}
                  onChange={(e) => setNewApp({ ...newApp, source: e.target.value })}
                  style={{ fontSize: '0.72rem', fontWeight: '500', height: '31px' }}
                >
                  <option value="Online Self-Booking" style={{ fontSize: '0.72rem' }}>Online Self-Booking Portal</option>
                  <option value="Walk-in Desk" style={{ fontSize: '0.72rem' }}>Walk-in Reception Desk</option>
                  <option value="Phone Booking" style={{ fontSize: '0.72rem' }}>Phone Call Booking</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', marginBottom: '3px', display: 'block', color: '#94a3b8' }}>Booking Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Requested VIP room or pre-wash"
                  value={newApp.notes}
                  onChange={(e) => setNewApp({ ...newApp, notes: e.target.value })}
                  style={{ fontSize: '0.72rem', fontWeight: '500', height: '31px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="glass-card"
                  style={{ padding: '4px 12px', fontSize: '0.70rem', height: '28px', cursor: 'pointer', color: 'var(--text-sub)', borderRadius: '6px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={Boolean(checkDoubleBooking(newApp.appointment_date, newApp.appointment_time, newApp.stylist_id) && !newApp.stylist_override_confirmed)}
                  style={{
                    padding: '4px 14px',
                    fontSize: '0.70rem',
                    height: '28px',
                    borderRadius: '6px',
                    opacity: (checkDoubleBooking(newApp.appointment_date, newApp.appointment_time, newApp.stylist_id) && !newApp.stylist_override_confirmed) ? 0.5 : 1,
                    cursor: (checkDoubleBooking(newApp.appointment_date, newApp.appointment_time, newApp.stylist_id) && !newApp.stylist_override_confirmed) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: EDIT APPOINTMENT ─── */}
      {editingApp && (
        <div className="modal-overlay" style={{ overflowY: 'auto', padding: '16px 10px' }}>
          <div className="glass-panel modal-content appointment-modal-compact" style={{ maxWidth: '450px', width: '92%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', padding: '14px 16px', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', letterSpacing: '0.01em' }}>
                <Edit3 size={15} style={{ color: 'var(--primary-indigo)' }} /> Edit Booking #APT-{editingApp.id}
              </h3>
              <button onClick={() => setEditingApp(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: '600', marginBottom: '3px', display: 'block', color: '#94a3b8' }}>Select Service</label>
                  <select
                    value={editData.service_id}
                    onChange={(e) => setEditData({ ...editData, service_id: e.target.value })}
                    style={{ fontSize: '0.72rem', fontWeight: '500', height: '31px' }}
                  >
                    {services.map(s => <option key={s.id} value={s.id} style={{ fontSize: '0.72rem' }}>{s.name} (₹{s.price})</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: '600', marginBottom: '3px', display: 'block', color: '#94a3b8' }}>Assign Stylist</label>
                  {(() => {
                    const editAvail = getStylistAvailability(editData.stylist_id, editData.appointment_date, editData.appointment_time, editingApp?.id);
                    const availStylists = stylists.filter(st => getStylistAvailability(st.id, editData.appointment_date, editData.appointment_time, editingApp?.id).isAvailable);
                    const unavailStylists = stylists.filter(st => !getStylistAvailability(st.id, editData.appointment_date, editData.appointment_time, editingApp?.id).isAvailable);

                    return (
                      <>
                        <select
                          value={editData.stylist_id}
                          onChange={(e) => handleStylistSelectChange(e.target.value, 'edit')}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: '600',
                            height: '31px',
                            border: editAvail.isAvailable ? '1px solid #334155' : '1.5px solid rgba(239, 68, 68, 0.6)',
                            background: editAvail.isAvailable ? '#1e293b' : 'rgba(30, 41, 59, 0.95)',
                            color: '#f8fafc'
                          }}
                        >
                          {availStylists.length > 0 && (
                            <optgroup label="🟢 Available Staff">
                              {availStylists.map(st => {
                                const av = getStylistAvailability(st.id, editData.appointment_date, editData.appointment_time, editingApp?.id);
                                return (
                                  <option key={st.id} value={st.id} style={{ fontSize: '0.72rem', color: '#4ade80' }}>
                                    {st.name} ({st.specialization}) {av.tag}
                                  </option>
                                );
                              })}
                            </optgroup>
                          )}
                          {unavailStylists.length > 0 && (
                            <optgroup label="🔴 Unavailable Staff (Warning on Selection)">
                              {unavailStylists.map(st => {
                                const av = getStylistAvailability(st.id, editData.appointment_date, editData.appointment_time, editingApp?.id);
                                return (
                                  <option key={st.id} value={st.id} style={{ fontSize: '0.72rem', color: '#f87171' }}>
                                    ⚠️ {st.name} ({st.specialization}) {av.tag}
                                  </option>
                                );
                              })}
                            </optgroup>
                          )}
                        </select>
                        <div style={{
                          marginTop: '3px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.64rem',
                          background: editAvail.isAvailable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.12)',
                          color: editAvail.isAvailable ? '#4ade80' : '#f87171',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>{editAvail.badge}: {editAvail.reason}</span>
                          {editData.stylist_override_confirmed && !editAvail.isAvailable && (
                            <span style={{ color: '#f59e0b', fontWeight: '700' }}>(Override Confirmed)</span>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: '600', marginBottom: '3px', display: 'block', color: '#94a3b8' }}>Appointment Date</label>
                  <input
                    type="date"
                    required
                    value={editData.appointment_date}
                    onChange={(e) => setEditData({ ...editData, appointment_date: e.target.value })}
                    style={{ fontSize: '0.72rem', fontWeight: '500', height: '31px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: '600', marginBottom: '3px', display: 'block', color: '#94a3b8' }}>Booking Time</label>
                  <select
                    value={editData.appointment_time}
                    onChange={(e) => setEditData({ ...editData, appointment_time: e.target.value })}
                    style={{ fontSize: '0.72rem', fontWeight: '500', height: '31px' }}
                  >
                    {availableTimeSlots.map(slotItem => {
                      const t = getSlotValue(slotItem);
                      return <option key={t} value={t} style={{ fontSize: '0.72rem' }}>{getSlotLabel(slotItem)}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', marginBottom: '3px', display: 'block', color: '#94a3b8' }}>Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  style={{ fontSize: '0.72rem', fontWeight: '500', height: '31px' }}
                >
                  <option value="Scheduled" style={{ fontSize: '0.72rem' }}>Scheduled</option>
                  <option value="In-Progress" style={{ fontSize: '0.72rem' }}>In-Progress</option>
                  <option value="Completed" style={{ fontSize: '0.72rem' }}>Completed</option>
                  <option value="Cancelled" style={{ fontSize: '0.72rem' }}>Cancelled</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', marginBottom: '3px', display: 'block', color: '#94a3b8' }}>Notes</label>
                <input
                  type="text"
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  style={{ fontSize: '0.72rem', fontWeight: '500', height: '31px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="glass-card"
                  style={{ padding: '4px 12px', fontSize: '0.70rem', height: '28px', cursor: 'pointer', color: 'var(--text-sub)', borderRadius: '6px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '4px 14px', fontSize: '0.70rem', height: '28px', borderRadius: '6px' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: 1-CLICK RESCHEDULE MODAL ─── */}
      {reschedulingApp && (
        <div className="modal-overlay" style={{ overflowY: 'auto', padding: '16px 10px' }}>
          <div className="glass-panel modal-content appointment-modal-compact" style={{ maxWidth: '440px', width: '92%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', padding: '14px 16px', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', letterSpacing: '0.01em' }}>
                <RefreshCw size={15} style={{ color: 'var(--accent-gold)' }} /> 1-Click Reschedule Slot
              </h3>
              <button onClick={() => setReschedulingApp(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', marginBottom: '12px', fontSize: '0.72rem' }}>
              <div>Rescheduling booking for <strong style={{ color: 'var(--text-main)' }}>{reschedulingApp.customer_name}</strong></div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: '2px' }}>Current: {formatDateKey(reschedulingApp.appointment_date)} at {reschedulingApp.appointment_time}</div>
            </div>

            <form onSubmit={handleRescheduleSubmit}>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', marginBottom: '3px', display: 'block', color: '#94a3b8' }}>New Appointment Date</label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  style={{ fontSize: '0.72rem', fontWeight: '500', height: '31px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', marginBottom: '3px', display: 'block', color: '#94a3b8' }}>New Time Slot</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  style={{ fontSize: '0.72rem', fontWeight: '500', height: '31px' }}
                >
                  {availableTimeSlots.map(slotItem => {
                    const t = getSlotValue(slotItem);
                    return <option key={t} value={t} style={{ fontSize: '0.72rem' }}>{getSlotLabel(slotItem)}</option>;
                  })}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', marginBottom: '3px', display: 'block', color: '#94a3b8' }}>Re-assign Stylist (Optional)</label>
                {(() => {
                  const targetSId = rescheduleStylist || reschedulingApp.stylist_id;
                  const reschedAvail = getStylistAvailability(targetSId, rescheduleDate, rescheduleTime, reschedulingApp?.id);
                  const availStylists = stylists.filter(st => getStylistAvailability(st.id, rescheduleDate, rescheduleTime, reschedulingApp?.id).isAvailable);
                  const unavailStylists = stylists.filter(st => !getStylistAvailability(st.id, rescheduleDate, rescheduleTime, reschedulingApp?.id).isAvailable);

                  return (
                    <>
                      <select
                        value={targetSId}
                        onChange={(e) => handleStylistSelectChange(e.target.value, 'reschedule')}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          height: '31px',
                          border: reschedAvail.isAvailable ? '1px solid #334155' : '1.5px solid rgba(239, 68, 68, 0.6)',
                          background: reschedAvail.isAvailable ? '#1e293b' : 'rgba(30, 41, 59, 0.95)',
                          color: '#f8fafc'
                        }}
                      >
                        {availStylists.length > 0 && (
                          <optgroup label="🟢 Available Staff">
                            {availStylists.map(st => {
                              const av = getStylistAvailability(st.id, rescheduleDate, rescheduleTime, reschedulingApp?.id);
                              return (
                                <option key={st.id} value={st.id} style={{ fontSize: '0.72rem', color: '#4ade80' }}>
                                  {st.name} ({st.specialization}) {av.tag}
                                </option>
                              );
                            })}
                          </optgroup>
                        )}
                        {unavailStylists.length > 0 && (
                          <optgroup label="🔴 Unavailable Staff (Warning on Selection)">
                            {unavailStylists.map(st => {
                              const av = getStylistAvailability(st.id, rescheduleDate, rescheduleTime, reschedulingApp?.id);
                              return (
                                <option key={st.id} value={st.id} style={{ fontSize: '0.72rem', color: '#f87171' }}>
                                  ⚠️ {st.name} ({st.specialization}) {av.tag}
                                </option>
                              );
                            })}
                          </optgroup>
                        )}
                      </select>
                      <div style={{
                        marginTop: '3px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.64rem',
                        background: reschedAvail.isAvailable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.12)',
                        color: reschedAvail.isAvailable ? '#4ade80' : '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>{reschedAvail.badge}: {reschedAvail.reason}</span>
                        {rescheduleOverrideConfirmed && !reschedAvail.isAvailable && (
                          <span style={{ color: '#f59e0b', fontWeight: '700' }}>(Override Confirmed)</span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setReschedulingApp(null)}
                  className="glass-card"
                  style={{ padding: '4px 12px', fontSize: '0.70rem', height: '28px', cursor: 'pointer', color: 'var(--text-sub)', borderRadius: '6px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '4px 14px', fontSize: '0.70rem', height: '28px', borderRadius: '6px' }}
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: AUTO APPOINTMENT REMINDER (SMS / WHATSAPP INTEGRATION PREVIEW) ─── */}
      {reminderApp && (
        <div className="modal-overlay" style={{ overflowY: 'auto', padding: '16px 10px' }}>
          <div className="glass-panel modal-content appointment-modal-compact" style={{ maxWidth: '460px', width: '92%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', padding: '14px 16px', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', letterSpacing: '0.01em' }}>
                <Send size={15} style={{ color: '#34d399' }} /> Auto Appointment Reminders
              </h3>
              <button onClick={() => setReminderApp(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ fontSize: '0.74rem', color: 'var(--text-sub)', marginBottom: '10px' }}>
              Recipient: <strong style={{ color: 'var(--text-main)' }}>{reminderApp.customer_name}</strong> ({reminderApp.customer_phone || '9876543210'})
            </div>

            {/* Live Message Template Preview Box */}
            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.64rem', color: 'var(--accent-gold)', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                💬 Live Reminder Payload Preview
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-main)', margin: 0, lineHeight: '1.45', fontFamily: 'sans-serif' }}>
                "Hi <strong>{reminderApp.customer_name}</strong>! Your salon appointment for <strong>{reminderApp.service_name}</strong> with <strong>{reminderApp.stylist_name}</strong> is confirmed for <strong>{formatDateKey(reminderApp.appointment_date)}</strong> at <strong>{reminderApp.appointment_time}</strong>. Please arrive 5 minutes early. Reply 1 to Confirm, 2 to Reschedule. — SalonPulse ERP"
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleSendReminder('sms')}
                style={{ flex: 1, padding: '6px 12px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid var(--primary-indigo)', color: 'var(--primary-indigo)', borderRadius: '6px', fontWeight: '600', fontSize: '0.70rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
              >
                <MessageSquare size={13} /> Send SMS Gateway
              </button>

              <button
                type="button"
                onClick={() => handleSendReminder('whatsapp')}
                style={{ flex: 1, padding: '6px 12px', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid #34d399', color: '#059669', borderRadius: '6px', fontWeight: '600', fontSize: '0.70rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
              >
                <Send size={13} /> WhatsApp Business API
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: DELETE / CANCEL CONFIRMATION ─── */}
      {deletingApp && (
        <div className="modal-overlay" style={{ overflowY: 'auto', padding: '16px 10px' }}>
          <div className="glass-panel modal-content appointment-modal-compact" style={{ maxWidth: '380px', width: '92%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', padding: '16px 18px', textAlign: 'center', margin: 'auto' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', color: '#ef4444'
            }}>
              <Trash2 size={20} />
            </div>

            <h3 style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>Cancel Booking #APT-{deletingApp.id}?</h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-sub)', marginBottom: '16px', lineHeight: '1.45' }}>
              Are you sure you want to cancel the booking for <strong>{deletingApp.customer_name}</strong>?
            </p>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeletingApp(null)}
                className="glass-card"
                style={{ padding: '5px 14px', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: '600', fontSize: '0.70rem', borderRadius: '6px' }}
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '5px 16px', background: '#ef4444', color: '#fff',
                  border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.70rem', cursor: 'pointer'
                }}
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: UNAVAILABLE STAFF WARNING & OVERRIDE CONFIRMATION MODAL ─── */}
      {unavailableWarningModal.isOpen && unavailableWarningModal.stylist && (
        <div className="modal-overlay" style={{ overflowY: 'auto', padding: '16px 10px', zIndex: 1200 }}>
          <div
            className="glass-panel modal-content"
            style={{
              maxWidth: '460px',
              width: '92%',
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
              padding: '18px 20px',
              margin: 'auto',
              borderRadius: '16px',
              border: '1.5px solid rgba(239, 68, 68, 0.45)',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 27, 75, 0.97))',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(239, 68, 68, 0.25)'
            }}
          >
            {/* Header Icon & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0
              }}>
                <AlertTriangle size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '0.98rem', fontWeight: '800', margin: 0, color: '#f8fafc', letterSpacing: '0.01em' }}>
                  Staff Availability Warning
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Staff member is currently marked as <strong style={{ color: unavailableWarningModal.availability?.color || '#ef4444' }}>Unavailable</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelUnavailableAssignment}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Staff Card & Reason Details */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(51, 65, 85, 0.8)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.25)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: '#818cf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '0.85rem'
                  }}>
                    {unavailableWarningModal.stylist.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#f1f5f9' }}>
                      {unavailableWarningModal.stylist.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      {unavailableWarningModal.stylist.specialization || 'Salon Stylist'}
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: unavailableWarningModal.availability?.color || '#f87171'
                }}>
                  {unavailableWarningModal.availability?.badge || '🔴 Unavailable'}
                </span>
              </div>

              {/* Slot Target */}
              <div style={{
                fontSize: '0.70rem',
                color: '#cbd5e1',
                padding: '6px 10px',
                background: 'rgba(30, 41, 59, 0.65)',
                borderRadius: '6px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>📅 Date: <strong>{unavailableWarningModal.targetDate}</strong></span>
                <span>⏰ Time: <strong>{unavailableWarningModal.targetTime}</strong></span>
              </div>

              {/* Reason Explanation */}
              <div style={{
                fontSize: '0.72rem',
                color: '#fca5a5',
                lineHeight: '1.45',
                padding: '8px 10px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '3px solid #ef4444',
                borderRadius: '4px'
              }}>
                <div style={{ fontWeight: '700', marginBottom: '2px', color: '#f87171' }}>
                  {unavailableWarningModal.availability?.title || 'Staff Not Available'}
                </div>
                <div>{unavailableWarningModal.availability?.reason || 'Staff member is not on floor or booked for this slot.'}</div>
              </div>
            </div>

            {/* Warning advisory message */}
            <p style={{
              fontSize: '0.72rem',
              color: '#94a3b8',
              lineHeight: '1.45',
              marginBottom: '16px'
            }}>
              Assigning an unavailable or off-duty staff member may result in booking delays or client dissatisfaction. Are you sure you want to <strong>override and assign anyway</strong>?
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancelUnavailableAssignment}
                className="glass-card"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#e2e8f0',
                  borderRadius: '8px',
                  background: 'rgba(51, 65, 85, 0.4)',
                  border: '1px solid rgba(148, 163, 184, 0.25)'
                }}
              >
                ✕ Cancel (Keep Available Staff)
              </button>

              <button
                type="button"
                onClick={handleConfirmUnavailableAssignment}
                style={{
                  padding: '6px 16px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  color: '#ffffff',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <AlertTriangle size={13} /> Confirm & Assign Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentsCalendarView;
