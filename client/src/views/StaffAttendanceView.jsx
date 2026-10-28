import React, { useState, useMemo, useEffect } from 'react';
import {
  ClipboardCheck, Calendar, Clock, CheckCircle2, AlertCircle,
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, UserCheck, Filter,
  Building2, Sparkles, Download, RefreshCw, X, Plus, Edit2,
  CalendarDays, FileText, Check, ArrowRight, User, ShieldAlert,
  LogIn, LogOut, Timer, BarChart3, TrendingUp, Award
} from 'lucide-react';
import {
  Admin_Get_Staff_Attendance,
  Admin_Record_Staff_Attendance,
  Admin_Bulk_Record_Staff_Attendance,
  Admin_Get_Monthly_Attendance
} from '../services/apiService';

const STATUS_CONFIG = {
  Present: {
    label: 'Present',
    icon: '🟢',
    bg: 'rgba(34, 197, 94, 0.15)',
    border: 'rgba(34, 197, 94, 0.4)',
    color: '#4ade80',
    short: 'P'
  },
  Late: {
    label: 'Late',
    icon: '🟡',
    bg: 'rgba(234, 179, 8, 0.15)',
    border: 'rgba(234, 179, 8, 0.4)',
    color: '#facc15',
    short: 'L'
  },
  'Half Day': {
    label: 'Half Day',
    icon: '🟠',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.4)',
    color: '#fb923c',
    short: 'HD'
  },
  Absent: {
    label: 'Absent',
    icon: '🔴',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
    color: '#f87171',
    short: 'A'
  },
  'On Leave': {
    label: 'On Leave',
    icon: '🟣',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.4)',
    color: '#c084fc',
    short: 'LV'
  },
  'Short Leave': {
    label: 'Short Leave',
    icon: '⏱️',
    bg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.4)',
    color: '#22d3ee',
    short: 'SL'
  }
};

const StaffAttendanceView = ({
  stylists = [],
  branches = [],
  timeSlots = [],
  currentUser = null,
  activeBranchId = null
}) => {
  // Date State - Default to Today (YYYY-MM-DD)
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(getTodayStr());

  // Views: 'daily' (Register) or 'monthly' (Matrix)
  const [viewTab, setViewTab] = useState('daily');

  // Filters
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination State for Daily Register
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 5, 10, 20, 50, 100, 'all'
  const [backendPagination, setBackendPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });

  // Pagination State for Monthly Sheet
  const [monthlyCurrentPage, setMonthlyCurrentPage] = useState(1);
  const [monthlyPageSize, setMonthlyPageSize] = useState(10); // 5, 10, 20, 50, 'all'

  // Attendance Records State
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Monthly Matrix Date State (Month: 1-12, Year: 2026)
  const now = new Date();
  const [monthlyMonth, setMonthlyMonth] = useState(now.getMonth() + 1);
  const [monthlyYear, setMonthlyYear] = useState(now.getFullYear());

  // Modal State for Individual Punch Edit
  const [editModalStaff, setEditModalStaff] = useState(null);
  const [editFormData, setEditFormData] = useState({
    status: 'Present',
    check_in_time: '',
    check_out_time: '',
    working_hours: 0,
    overtime_hours: 0.0,
    notes: ''
  });

  // Modal State for Bulk Mark Confirmation
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkConfig, setBulkConfig] = useState({
    status: 'Present',
    useBranchSchedule: true,
    custom_check_in: '09:00',
    custom_check_out: '20:00'
  });

  // Modal State for Live Clock In & Clock Out (Logout)
  const [clockActionModal, setClockActionModal] = useState({
    isOpen: false,
    staff: null,
    mode: 'clock_out', // 'clock_in' | 'clock_out'
    time: '',
    checkInTime: '',
    notes: '',
    hoursPreview: 0.0,
    overtimePreview: 0.0
  });

  // Modal State for Approved Short Leave / Permission
  const [shortLeaveModal, setShortLeaveModal] = useState({
    isOpen: false,
    staff: null,
    durationHours: 2.0,
    leaveType: 'Mid-Day Permission',
    reason: 'Personal Work',
    notes: ''
  });

  // Fetch Daily Attendance with dynamic backend & database pagination
  const loadDailyAttendance = async (
    dateToLoad = selectedDate,
    pageToLoad = currentPage,
    limitToLoad = pageSize,
    statusToFilter = statusFilter,
    searchToFilter = searchQuery
  ) => {
    setIsLoading(true);
    try {
      const res = await Admin_Get_Staff_Attendance({
        date: dateToLoad,
        branch_id: selectedBranch !== 'ALL' ? selectedBranch : undefined,
        page: pageToLoad,
        limit: limitToLoad === 'all' || limitToLoad === 0 ? 0 : Number(limitToLoad),
        search: searchToFilter.trim() || undefined,
        status: statusToFilter !== 'ALL' ? statusToFilter : undefined
      });
      if (res && res.data && Array.isArray(res.data.data)) {
        setAttendanceRecords(res.data.data);
        if (res.data.pagination) {
          setBackendPagination(res.data.pagination);
        }
      } else {
        setAttendanceRecords([]);
      }
    } catch (err) {
      console.warn('Could not fetch daily attendance from backend:', err);
      setAttendanceRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Monthly Attendance Matrix
  const loadMonthlyAttendance = async (m = monthlyMonth, y = monthlyYear) => {
    setIsLoading(true);
    try {
      const res = await Admin_Get_Monthly_Attendance({
        month: m,
        year: y,
        branch_id: selectedBranch !== 'ALL' ? selectedBranch : undefined
      });
      if (res && res.data && Array.isArray(res.data.data)) {
        setMonthlyRecords(res.data.data);
      } else {
        setMonthlyRecords([]);
      }
    } catch (err) {
      console.warn('Could not fetch monthly attendance:', err);
      setMonthlyRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset page when filters or date change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, selectedBranch, statusFilter, searchQuery]);

  // Reload when date, branch, view, page, or limit changes
  useEffect(() => {
    if (viewTab === 'daily') {
      loadDailyAttendance(selectedDate, currentPage, pageSize, statusFilter, searchQuery);
    } else {
      loadMonthlyAttendance(monthlyMonth, monthlyYear);
    }
  }, [selectedDate, selectedBranch, viewTab, monthlyMonth, monthlyYear, currentPage, pageSize]);

  // Toast message helper
  const showToast = (type, text) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage({ type: '', text: '' }), 3500);
  };

  // Combine Stylists/Staff List filtered by branch & search
  const visibleStaffList = useMemo(() => {
    let list = stylists || [];
    if (selectedBranch !== 'ALL') {
      list = list.filter(s => String(s.branch_id) === String(selectedBranch));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.phone && String(s.phone).includes(q)) ||
        (s.specialization && s.specialization.toLowerCase().includes(q))
      );
    }
    return list;
  }, [stylists, selectedBranch, searchQuery]);

  // Combined daily attendance map: staff_id -> attendance record
  const dailyAttendanceMap = useMemo(() => {
    const map = new Map();
    attendanceRecords.forEach(r => {
      map.set(String(r.staff_id), r);
    });
    return map;
  }, [attendanceRecords]);

  // Filtered Daily Staff for display
  const displayDailyStaff = useMemo(() => {
    if (statusFilter === 'ALL') return visibleStaffList;
    if (statusFilter === 'AVAILABLE') {
      return visibleStaffList.filter(s => {
        const rec = dailyAttendanceMap.get(String(s.id));
        return Boolean(rec?.check_in_time && !rec?.check_out_time && rec?.status !== 'Absent' && rec?.status !== 'On Leave' && rec?.status !== 'Short Leave');
      });
    }
    if (statusFilter === 'UNAVAILABLE') {
      return visibleStaffList.filter(s => {
        const rec = dailyAttendanceMap.get(String(s.id));
        const isAvail = Boolean(rec?.check_in_time && !rec?.check_out_time && rec?.status !== 'Absent' && rec?.status !== 'On Leave' && rec?.status !== 'Short Leave');
        return !isAvail;
      });
    }
    return visibleStaffList.filter(s => {
      const rec = dailyAttendanceMap.get(String(s.id));
      const currentStatus = rec ? rec.status : 'Unmarked';
      return currentStatus === statusFilter;
    });
  }, [visibleStaffList, dailyAttendanceMap, statusFilter]);

  // Paginated Daily Staff
  const totalDailyStaffCount = displayDailyStaff.length;
  const isAllDaily = pageSize === 'all' || Number(pageSize) === 0;
  const currentDailyLimit = isAllDaily ? (totalDailyStaffCount || 10) : Number(pageSize);
  const totalDailyPages = Math.max(1, isAllDaily ? 1 : Math.ceil(totalDailyStaffCount / currentDailyLimit));

  // Auto-correct page if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalDailyPages && totalDailyPages > 0) {
      setCurrentPage(totalDailyPages);
    }
  }, [totalDailyPages, currentPage]);

  const startDailyIndex = isAllDaily ? 0 : (currentPage - 1) * currentDailyLimit;
  const endDailyIndex = isAllDaily ? totalDailyStaffCount : Math.min(startDailyIndex + currentDailyLimit, totalDailyStaffCount);
  const paginatedDailyStaff = useMemo(() => {
    if (isAllDaily) return displayDailyStaff;
    return displayDailyStaff.slice(startDailyIndex, endDailyIndex);
  }, [displayDailyStaff, isAllDaily, startDailyIndex, endDailyIndex]);

  // KPI Metrics Calculation
  const kpiStats = useMemo(() => {
    const total = visibleStaffList.length;
    let presentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let shortLeaveCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let totalWorkingHours = 0;
    let recordedCount = 0;
    let activeOnDutyCount = 0;
    let completedShiftCount = 0;

    visibleStaffList.forEach(s => {
      const rec = dailyAttendanceMap.get(String(s.id));
      if (rec) {
        recordedCount++;
        if (rec.status === 'Present') presentCount++;
        else if (rec.status === 'Late') lateCount++;
        else if (rec.status === 'Half Day') halfDayCount++;
        else if (rec.status === 'Short Leave') shortLeaveCount++;
        else if (rec.status === 'Absent') absentCount++;
        else if (rec.status === 'On Leave') leaveCount++;

        if (rec.status !== 'Absent' && rec.status !== 'On Leave') {
          totalWorkingHours += Number(rec.working_hours) || 0;
          if (rec.check_in_time && !rec.check_out_time && rec.status !== 'Short Leave') {
            activeOnDutyCount++;
          } else if (rec.check_in_time && rec.check_out_time) {
            completedShiftCount++;
          }
        }
      }
    });

    const activePresent = presentCount + lateCount + halfDayCount + shortLeaveCount;
    const attendancePct = total > 0 ? Math.round((activePresent / total) * 100) : 0;
    const avgHours = activePresent > 0 ? (totalWorkingHours / activePresent).toFixed(1) : '0.0';

    return {
      total,
      presentCount,
      lateCount,
      halfDayCount,
      shortLeaveCount,
      absentCount,
      leaveCount,
      activePresent,
      activeOnDutyCount,
      completedShiftCount,
      unmarkedCount: total - recordedCount,
      attendancePct,
      avgHours
    };
  }, [visibleStaffList, dailyAttendanceMap]);

  // Dynamic Shift Timing Calculation per branch from Time Slots & Schedule
  const getBranchShiftTiming = useMemo(() => {
    return (branchId, dateStr = selectedDate) => {
      const parseMins = (t) => {
        if (!t) return 0;
        const [h, m] = String(t).split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };

      const formatMins = (mins) => {
        const h = Math.floor(mins / 60) % 24;
        const m = mins % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      let dayName = 'ALL';
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          dayName = days[d.getDay()];
        }
      }

      // Filter slots for this branch:
      // 1. First look for branch-specific slots
      let branchSlots = (timeSlots || []).filter(s => {
        if (s.is_active === false) return false;
        return branchId && String(s.branch_id) === String(branchId);
      });

      // 2. If no branch-specific slots, check universal slots (branch_id is null/all)
      if (branchSlots.length === 0) {
        branchSlots = (timeSlots || []).filter(s => {
          if (s.is_active === false) return false;
          return !s.branch_id || s.branch_id === 'all';
        });
      }

      // 3. Fallback to all active time slots across salon if still empty
      if (branchSlots.length === 0) {
        branchSlots = (timeSlots || []).filter(s => s.is_active !== false);
      }

      // Filter by day of week if day-specific slots exist
      const daySpecific = branchSlots.filter(s => s.day_of_week === dayName);
      if (daySpecific.length > 0) {
        branchSlots = daySpecific;
      }

      if (branchSlots.length === 0) {
        return {
          checkIn: '09:00',
          checkOut: '20:00',
          hours: 11.0,
          isConfigured: false,
          label: 'Default 09:00 - 20:00'
        };
      }

      let earliestStart = Infinity;
      let latestEnd = -Infinity;

      branchSlots.forEach(s => {
        const startStr = s.start_time || s.slot_time;
        if (startStr) {
          const startM = parseMins(startStr);
          if (startM < earliestStart) earliestStart = startM;

          let endM = 0;
          if (s.end_time) {
            endM = parseMins(s.end_time);
          } else {
            const dur = Number(s.duration_minutes) || 60;
            endM = startM + dur;
          }
          if (endM > latestEnd) latestEnd = endM;
        }
      });

      // If branch has only 1 isolated slot (< 3 hours span), fallback to salon-wide slots span
      if ((latestEnd - earliestStart) < 180 && (timeSlots || []).length > branchSlots.length) {
        const allSlots = (timeSlots || []).filter(s => s.is_active !== false);
        let allStart = Infinity;
        let allEnd = -Infinity;
        allSlots.forEach(s => {
          const st = s.start_time || s.slot_time;
          if (st) {
            const m1 = parseMins(st);
            const m2 = s.end_time ? parseMins(s.end_time) : (m1 + (Number(s.duration_minutes) || 60));
            if (m1 < allStart) allStart = m1;
            if (m2 > allEnd) allEnd = m2;
          }
        });
        if (allStart !== Infinity && allEnd !== -Infinity && allEnd > allStart) {
          earliestStart = allStart;
          latestEnd = allEnd;
        }
      }

      if (earliestStart === Infinity || latestEnd === -Infinity || latestEnd <= earliestStart) {
        return {
          checkIn: '09:00',
          checkOut: '20:00',
          hours: 11.0,
          isConfigured: false,
          label: '09:00 - 20:00'
        };
      }

      const totalDiffMins = latestEnd - earliestStart;
      const totalHours = parseFloat((totalDiffMins / 60).toFixed(2));
      const inTime = formatMins(earliestStart);
      const outTime = formatMins(latestEnd);

      return {
        checkIn: inTime,
        checkOut: outTime,
        hours: totalHours,
        isConfigured: true,
        label: `${inTime} - ${outTime} (${totalHours}h)`
      };
    };
  }, [timeSlots, selectedDate]);

  // Live Current Time Helper (HH:MM)
  const getNowTimeStr = () => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // Live Elapsed Hours Helper (from inTime to now)
  const getElapsedHours = (inTime) => {
    if (!inTime) return '0.0';
    try {
      const [h, m] = inTime.split(':').map(Number);
      const nowD = new Date();
      const nowMins = nowD.getHours() * 60 + nowD.getMinutes();
      const inMins = h * 60 + (m || 0);
      const diff = Math.max(0, nowMins - inMins);
      return (diff / 60).toFixed(1);
    } catch (e) {
      return '0.0';
    }
  };

  // Difference in hours between two HH:MM strings
  const calculateHoursDiff = (inTime, outTime) => {
    if (!inTime || !outTime) return 0.0;
    try {
      const [h1, m1] = inTime.split(':').map(Number);
      const [h2, m2] = outTime.split(':').map(Number);
      if (isNaN(h1) || isNaN(h2)) return 0.0;
      let diffMins = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0));
      return diffMins > 0 ? parseFloat((diffMins / 60).toFixed(2)) : 0.0;
    } catch (e) {
      return 0.0;
    }
  };

  // Open Clock In or Clock Out (Logout) Modal
  const openClockModal = (staff, mode = 'clock_out') => {
    const rec = dailyAttendanceMap.get(String(staff.id));
    const branchTiming = getBranchShiftTiming(staff.branch_id, selectedDate);
    const nowTime = getNowTimeStr();

    if (mode === 'clock_in') {
      const defaultIn = selectedDate === getTodayStr() ? nowTime : branchTiming.checkIn;
      setClockActionModal({
        isOpen: true,
        staff,
        mode: 'clock_in',
        time: defaultIn,
        checkInTime: '',
        notes: '',
        hoursPreview: 0.0,
        overtimePreview: 0.0
      });
    } else {
      // Clock Out (Logout)
      const inTime = rec?.check_in_time || branchTiming.checkIn;
      const defaultOut = selectedDate === getTodayStr() ? nowTime : branchTiming.checkOut;
      const hours = calculateHoursDiff(inTime, defaultOut);
      const ot = hours > branchTiming.hours ? parseFloat((hours - branchTiming.hours).toFixed(2)) : 0.0;

      setClockActionModal({
        isOpen: true,
        staff,
        mode: 'clock_out',
        time: defaultOut,
        checkInTime: inTime,
        notes: rec?.notes || '',
        hoursPreview: hours,
        overtimePreview: ot
      });
    }
  };

  // Handle Time Change in Clock Modal
  const handleClockModalTimeChange = (newTime) => {
    if (clockActionModal.mode === 'clock_out') {
      const inTime = clockActionModal.checkInTime;
      const branchTiming = getBranchShiftTiming(clockActionModal.staff?.branch_id, selectedDate);
      const hours = calculateHoursDiff(inTime, newTime);
      const ot = hours > branchTiming.hours ? parseFloat((hours - branchTiming.hours).toFixed(2)) : 0.0;
      setClockActionModal(prev => ({
        ...prev,
        time: newTime,
        hoursPreview: hours,
        overtimePreview: ot
      }));
    } else {
      setClockActionModal(prev => ({
        ...prev,
        time: newTime
      }));
    }
  };

  // Confirm Clock In or Clock Out Action
  const handleConfirmClockModal = async () => {
    const { staff, mode, time, notes, checkInTime, hoursPreview, overtimePreview } = clockActionModal;
    if (!staff) return;
    const branchTiming = getBranchShiftTiming(staff.branch_id, selectedDate);
    const rec = dailyAttendanceMap.get(String(staff.id));

    if (mode === 'clock_in') {
      const inTime = time;
      const [bH, bM] = branchTiming.checkIn.split(':').map(Number);
      const [inH, inM] = inTime.split(':').map(Number);
      const isLate = (inH * 60 + inM) > (bH * 60 + bM + 20);
      const status = isLate ? 'Late' : 'Present';

      const optimisticRecord = {
        staff_id: staff.id,
        staff_name: staff.name,
        role: staff.specialization || 'Staff Stylist',
        branch_id: staff.branch_id,
        attendance_date: selectedDate,
        status: status,
        check_in_time: inTime,
        check_out_time: null,
        working_hours: 0.0,
        overtime_hours: 0.0,
        notes: notes || (isLate ? 'Late arrival' : 'On duty'),
        updated_at: new Date().toISOString()
      };

      setAttendanceRecords(prev => {
        const idx = prev.findIndex(r => String(r.staff_id) === String(staff.id));
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...optimisticRecord };
          return copy;
        }
        return [...prev, optimisticRecord];
      });

      try {
        await Admin_Record_Staff_Attendance(optimisticRecord);
        showToast('success', `${staff.name} clocked in at ${inTime}! (Status: On Duty)`);
        setClockActionModal({ isOpen: false, staff: null, mode: 'clock_in', time: '', notes: '' });
        loadDailyAttendance(selectedDate);
      } catch (err) {
        console.error('Error clocking in:', err);
        showToast('error', 'Error recording clock-in');
      }
      return;
    }

    // Clock Out (Logout)
    const inTime = checkInTime || rec?.check_in_time || branchTiming.checkIn;
    const outTime = time;
    const workingHours = hoursPreview;
    const overtimeHours = overtimePreview;

    let status = rec?.status || 'Present';
    if (workingHours > 0 && workingHours <= (branchTiming.hours / 2)) {
      status = 'Half Day';
    }

    const optimisticRecord = {
      ...(rec || {}),
      staff_id: staff.id,
      staff_name: staff.name,
      role: staff.specialization || 'Staff Stylist',
      branch_id: staff.branch_id,
      attendance_date: selectedDate,
      status: status,
      check_in_time: inTime,
      check_out_time: outTime,
      working_hours: workingHours,
      overtime_hours: overtimeHours,
      notes: notes || (overtimeHours > 0 ? `OT: +${overtimeHours}h` : 'Shift Completed'),
      updated_at: new Date().toISOString()
    };

    setAttendanceRecords(prev => {
      const idx = prev.findIndex(r => String(r.staff_id) === String(staff.id));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = optimisticRecord;
        return copy;
      }
      return [...prev, optimisticRecord];
    });

    try {
      await Admin_Record_Staff_Attendance(optimisticRecord);
      showToast('success', `${staff.name} clocked out at ${outTime}! Logged ${workingHours} hrs`);
      setClockActionModal({ isOpen: false, staff: null, mode: 'clock_out', time: '', notes: '' });
      loadDailyAttendance(selectedDate);
    } catch (err) {
      console.error('Error clocking out:', err);
      showToast('error', 'Error recording clock-out');
    }
  };

  // Open Short Leave / Permission Modal
  const openShortLeaveModal = (staff) => {
    const rec = dailyAttendanceMap.get(String(staff.id));
    setShortLeaveModal({
      isOpen: true,
      staff,
      durationHours: 2.0,
      leaveType: 'Mid-Day Permission',
      reason: 'Personal Work',
      notes: rec?.notes || ''
    });
  };

  // Confirm Short Leave Record
  const handleConfirmShortLeave = async () => {
    const { staff, durationHours, leaveType, reason, notes } = shortLeaveModal;
    if (!staff) return;
    const branchTiming = getBranchShiftTiming(staff.branch_id, selectedDate);
    const rec = dailyAttendanceMap.get(String(staff.id));

    const duration = parseFloat(durationHours) || 2.0;
    const calculatedHours = Math.max(0, parseFloat((branchTiming.hours - duration).toFixed(2)));
    const checkIn = rec?.check_in_time || branchTiming.checkIn;
    const [h, m] = checkIn.split(':').map(Number);
    const workedMins = Math.round(calculatedHours * 60);
    const outMins = (h * 60 + (m || 0)) + workedMins;
    const outH = Math.floor(outMins / 60) % 24;
    const outM = outMins % 60;
    const checkOut = `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}`;
    const fullNotes = notes ? `${notes} • ${leaveType}: ${reason} (${duration}h SL)` : `${leaveType}: ${reason} (${duration}h SL)`;

    const optimisticRecord = {
      ...(rec || {}),
      staff_id: staff.id,
      staff_name: staff.name,
      role: staff.specialization || 'Staff Stylist',
      branch_id: staff.branch_id,
      attendance_date: selectedDate,
      status: 'Short Leave',
      check_in_time: checkIn,
      check_out_time: checkOut,
      working_hours: calculatedHours,
      overtime_hours: 0.0,
      notes: fullNotes,
      updated_at: new Date().toISOString()
    };

    setAttendanceRecords(prev => {
      const idx = prev.findIndex(r => String(r.staff_id) === String(staff.id));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = optimisticRecord;
        return copy;
      }
      return [...prev, optimisticRecord];
    });

    try {
      await Admin_Record_Staff_Attendance(optimisticRecord);
      showToast('success', `${staff.name} marked on Short Leave (${duration}h approved • ${calculatedHours}h credited)`);
      setShortLeaveModal({ isOpen: false, staff: null, durationHours: 2.0, leaveType: 'Mid-Day Permission', reason: 'Personal Work', notes: '' });
      loadDailyAttendance(selectedDate);
    } catch (err) {
      console.error('Error recording short leave:', err);
      showToast('error', 'Error recording short leave');
    }
  };

  // Quick 1-Click Mark Full Shift
  const handleMarkFullShift = async (staff) => {
    const branchTiming = getBranchShiftTiming(staff.branch_id, selectedDate);
    const optimisticRecord = {
      staff_id: staff.id,
      staff_name: staff.name,
      role: staff.specialization || 'Staff Stylist',
      branch_id: staff.branch_id,
      attendance_date: selectedDate,
      status: 'Present',
      check_in_time: branchTiming.checkIn,
      check_out_time: branchTiming.checkOut,
      working_hours: branchTiming.hours,
      overtime_hours: 0.0,
      notes: 'Full shift marked',
      updated_at: new Date().toISOString()
    };

    setAttendanceRecords(prev => {
      const idx = prev.findIndex(r => String(r.staff_id) === String(staff.id));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = optimisticRecord;
        return copy;
      }
      return [...prev, optimisticRecord];
    });

    try {
      await Admin_Record_Staff_Attendance(optimisticRecord);
      showToast('success', `${staff.name} marked Full Shift (${branchTiming.checkIn} - ${branchTiming.checkOut})`);
      loadDailyAttendance(selectedDate);
    } catch (err) {
      showToast('error', 'Error recording full shift');
    }
  };

  // Quick Status Toggle Handler with Dynamic Branch Timing
  const handleQuickStatusChange = async (staff, newStatus) => {
    const currentRec = dailyAttendanceMap.get(String(staff.id));
    const branchTiming = getBranchShiftTiming(staff.branch_id, selectedDate);

    let checkIn = currentRec?.check_in_time || branchTiming.checkIn;
    let checkOut = currentRec?.check_out_time || branchTiming.checkOut;
    let hours = branchTiming.hours;

    if (newStatus === 'Present') {
      checkIn = branchTiming.checkIn;
      checkOut = branchTiming.checkOut;
      hours = branchTiming.hours;
    } else if (newStatus === 'Late') {
      // Clock in 30 mins after branch shift start
      const [h, m] = branchTiming.checkIn.split(':').map(Number);
      const lateMins = (h || 9) * 60 + (m || 0) + 30;
      const lateH = Math.floor(lateMins / 60) % 24;
      const lateM = lateMins % 60;
      checkIn = `${String(lateH).padStart(2, '0')}:${String(lateM).padStart(2, '0')}`;
      checkOut = branchTiming.checkOut;
      hours = Math.max(0, parseFloat((branchTiming.hours - 0.5).toFixed(2)));
    } else if (newStatus === 'Half Day') {
      checkIn = branchTiming.checkIn;
      const [h, m] = branchTiming.checkIn.split(':').map(Number);
      const halfMins = (h || 9) * 60 + (m || 0) + Math.round((branchTiming.hours * 60) / 2);
      const halfH = Math.floor(halfMins / 60) % 24;
      const halfM = halfMins % 60;
      checkOut = `${String(halfH).padStart(2, '0')}:${String(halfM).padStart(2, '0')}`;
      hours = parseFloat((branchTiming.hours / 2).toFixed(2));
    } else if (newStatus === 'Short Leave') {
      checkIn = branchTiming.checkIn;
      const [h, m] = branchTiming.checkIn.split(':').map(Number);
      const shortMins = (h || 9) * 60 + (m || 0) + Math.max(120, Math.round((branchTiming.hours - 2) * 60));
      const shortH = Math.floor(shortMins / 60) % 24;
      const shortM = shortMins % 60;
      checkOut = `${String(shortH).padStart(2, '0')}:${String(shortM).padStart(2, '0')}`;
      hours = Math.max(0, parseFloat((branchTiming.hours - 2.0).toFixed(2)));
    } else if (newStatus === 'Absent' || newStatus === 'On Leave') {
      checkIn = '';
      checkOut = '';
      hours = 0.0;
    }

    // Optimistic UI update
    const optimisticRecord = {
      ...(currentRec || {}),
      staff_id: staff.id,
      staff_name: staff.name,
      role: staff.specialization || 'Staff Stylist',
      branch_id: staff.branch_id,
      attendance_date: selectedDate,
      status: newStatus,
      check_in_time: checkIn,
      check_out_time: checkOut,
      working_hours: hours,
      updated_at: new Date().toISOString()
    };

    setAttendanceRecords(prev => {
      const idx = prev.findIndex(r => String(r.staff_id) === String(staff.id));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = optimisticRecord;
        return copy;
      }
      return [...prev, optimisticRecord];
    });

    try {
      await Admin_Record_Staff_Attendance({
        staff_id: staff.id,
        staff_name: staff.name,
        role: staff.specialization || 'Staff Stylist',
        branch_id: staff.branch_id,
        attendance_date: selectedDate,
        status: newStatus,
        check_in_time: checkIn,
        check_out_time: checkOut,
        working_hours: hours,
        notes: currentRec?.notes || ''
      });
      showToast('success', `${staff.name} marked as ${newStatus} (${checkIn || '—'} → ${checkOut || '—'})`);
    } catch (err) {
      console.error('Failed to update attendance:', err);
      showToast('error', `Failed to mark attendance for ${staff.name}`);
      loadDailyAttendance(selectedDate);
    }
  };

  // Open Edit Details Modal with Branch Dynamic Timing
  const openEditModal = (staff) => {
    const rec = dailyAttendanceMap.get(String(staff.id));
    const branchTiming = getBranchShiftTiming(staff.branch_id, selectedDate);
    setEditModalStaff(staff);
    const initialStatus = rec?.status || 'Present';
    let initCheckIn = rec?.check_in_time;
    let initCheckOut = rec?.check_out_time;
    let initHours = rec?.working_hours;

    if (initCheckIn === undefined || initCheckIn === null || initCheckIn === '') {
      if (initialStatus === 'Absent' || initialStatus === 'On Leave') {
        initCheckIn = '';
        initCheckOut = '';
        initHours = 0.0;
      } else {
        initCheckIn = branchTiming.checkIn;
        initCheckOut = branchTiming.checkOut;
        initHours = branchTiming.hours;
      }
    }

    setEditFormData({
      status: initialStatus,
      check_in_time: initCheckIn,
      check_out_time: initCheckOut,
      working_hours: initHours ?? branchTiming.hours,
      overtime_hours: rec?.overtime_hours ?? 0.0,
      notes: rec?.notes || ''
    });
  };

  // Helper to dynamically change status inside Edit Modal based on branch schedule
  const handleEditModalStatusChange = (newStatus) => {
    if (!editModalStaff) return;
    const branchTiming = getBranchShiftTiming(editModalStaff.branch_id, selectedDate);

    let inTime = editFormData.check_in_time;
    let outTime = editFormData.check_out_time;
    let hrs = editFormData.working_hours;

    if (newStatus === 'Present') {
      inTime = branchTiming.checkIn;
      outTime = branchTiming.checkOut;
      hrs = branchTiming.hours;
    } else if (newStatus === 'Late') {
      const [h, m] = branchTiming.checkIn.split(':').map(Number);
      const lateMins = (h || 9) * 60 + (m || 0) + 30;
      const lateH = Math.floor(lateMins / 60) % 24;
      const lateM = lateMins % 60;
      inTime = `${String(lateH).padStart(2, '0')}:${String(lateM).padStart(2, '0')}`;
      outTime = branchTiming.checkOut;
      hrs = Math.max(0, parseFloat((branchTiming.hours - 0.5).toFixed(2)));
    } else if (newStatus === 'Half Day') {
      inTime = branchTiming.checkIn;
      const [h, m] = branchTiming.checkIn.split(':').map(Number);
      const halfMins = (h || 9) * 60 + (m || 0) + Math.round((branchTiming.hours * 60) / 2);
      const halfH = Math.floor(halfMins / 60) % 24;
      const halfM = halfMins % 60;
      outTime = `${String(halfH).padStart(2, '0')}:${String(halfM).padStart(2, '0')}`;
      hrs = parseFloat((branchTiming.hours / 2).toFixed(2));
    } else if (newStatus === 'Short Leave') {
      inTime = branchTiming.checkIn;
      const [h, m] = branchTiming.checkIn.split(':').map(Number);
      const shortMins = (h || 9) * 60 + (m || 0) + Math.max(120, Math.round((branchTiming.hours - 2) * 60));
      const shortH = Math.floor(shortMins / 60) % 24;
      const shortM = shortMins % 60;
      outTime = `${String(shortH).padStart(2, '0')}:${String(shortM).padStart(2, '0')}`;
      hrs = Math.max(0, parseFloat((branchTiming.hours - 2.0).toFixed(2)));
    } else if (newStatus === 'Absent' || newStatus === 'On Leave') {
      inTime = '';
      outTime = '';
      hrs = 0.0;
    }

    setEditFormData({
      ...editFormData,
      status: newStatus,
      check_in_time: inTime,
      check_out_time: outTime,
      working_hours: hrs
    });
  };

  // Auto-calculate working hours when times change in edit modal
  const handleEditTimeChange = (field, value) => {
    setEditFormData(prev => {
      const next = { ...prev, [field]: value };
      if (next.check_in_time && next.check_out_time) {
        const [h1, m1] = next.check_in_time.split(':').map(Number);
        const [h2, m2] = next.check_out_time.split(':').map(Number);
        const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (mins > 0) {
          next.working_hours = parseFloat((mins / 60).toFixed(2));
        }
      }
      return next;
    });
  };

  // Save Edit Details Modal
  const handleSaveEditModal = async (e) => {
    e.preventDefault();
    if (!editModalStaff) return;

    try {
      await Admin_Record_Staff_Attendance({
        staff_id: editModalStaff.id,
        staff_name: editModalStaff.name,
        role: editModalStaff.specialization || 'Staff Stylist',
        branch_id: editModalStaff.branch_id,
        attendance_date: selectedDate,
        status: editFormData.status,
        check_in_time: editFormData.check_in_time,
        check_out_time: editFormData.check_out_time,
        working_hours: parseFloat(editFormData.working_hours) || 0,
        overtime_hours: parseFloat(editFormData.overtime_hours) || 0,
        notes: editFormData.notes
      });
      showToast('success', `Updated attendance record for ${editModalStaff.name}`);
      setEditModalStaff(null);
      loadDailyAttendance(selectedDate);
    } catch (err) {
      console.error('Error saving attendance details:', err);
      showToast('error', 'Error updating attendance details');
    }
  };

  // Bulk Mark All Present using Dynamic Branch Timing for each staff
  const handleExecuteBulkMark = async () => {
    if (visibleStaffList.length === 0) {
      showToast('error', 'No staff available to mark attendance');
      setShowBulkModal(false);
      return;
    }

    try {
      for (const s of visibleStaffList) {
        const branchTiming = getBranchShiftTiming(s.branch_id, selectedDate);
        let inTime = '';
        let outTime = '';
        let hrs = 0.0;

        if (bulkConfig.status === 'Absent' || bulkConfig.status === 'On Leave') {
          inTime = '';
          outTime = '';
          hrs = 0.0;
        } else if (bulkConfig.useBranchSchedule) {
          // Dynamic timing directly from the branch's configured time slots
          if (bulkConfig.status === 'Present') {
            inTime = branchTiming.checkIn;
            outTime = branchTiming.checkOut;
            hrs = branchTiming.hours;
          } else if (bulkConfig.status === 'Late') {
            const [h, m] = branchTiming.checkIn.split(':').map(Number);
            const lateMins = (h || 9) * 60 + (m || 0) + 30;
            const lateH = Math.floor(lateMins / 60) % 24;
            const lateM = lateMins % 60;
            inTime = `${String(lateH).padStart(2, '0')}:${String(lateM).padStart(2, '0')}`;
            outTime = branchTiming.checkOut;
            hrs = Math.max(0, parseFloat((branchTiming.hours - 0.5).toFixed(2)));
          } else if (bulkConfig.status === 'Half Day') {
            inTime = branchTiming.checkIn;
            const [h, m] = branchTiming.checkIn.split(':').map(Number);
            const halfMins = (h || 9) * 60 + (m || 0) + Math.round((branchTiming.hours * 60) / 2);
            const halfH = Math.floor(halfMins / 60) % 24;
            const halfM = halfMins % 60;
            outTime = `${String(halfH).padStart(2, '0')}:${String(halfM).padStart(2, '0')}`;
            hrs = parseFloat((branchTiming.hours / 2).toFixed(2));
          } else if (bulkConfig.status === 'Short Leave') {
            inTime = branchTiming.checkIn;
            const [h, m] = branchTiming.checkIn.split(':').map(Number);
            const shortMins = (h || 9) * 60 + (m || 0) + Math.max(120, Math.round((branchTiming.hours - 2) * 60));
            const shortH = Math.floor(shortMins / 60) % 24;
            const shortM = shortMins % 60;
            outTime = `${String(shortH).padStart(2, '0')}:${String(shortM).padStart(2, '0')}`;
            hrs = Math.max(0, parseFloat((branchTiming.hours - 2.0).toFixed(2)));
          }
        } else {
          // Manual custom override times
          inTime = bulkConfig.custom_check_in || '09:00';
          outTime = bulkConfig.custom_check_out || '20:00';
          const [h1, m1] = inTime.split(':').map(Number);
          const [h2, m2] = outTime.split(':').map(Number);
          const diff = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
          hrs = diff > 0 ? parseFloat(diff.toFixed(2)) : 8.0;
        }

        await Admin_Record_Staff_Attendance({
          staff_id: s.id,
          staff_name: s.name,
          role: s.specialization || 'Staff Stylist',
          branch_id: s.branch_id,
          attendance_date: selectedDate,
          status: bulkConfig.status,
          check_in_time: inTime,
          check_out_time: outTime,
          working_hours: hrs,
          notes: bulkConfig.useBranchSchedule ? 'Dynamic shift applied from branch schedule' : 'Manual bulk override'
        });
      }

      showToast('success', `All ${visibleStaffList.length} staff members marked as ${bulkConfig.status} with dynamic branch schedules!`);
      setShowBulkModal(false);
      loadDailyAttendance(selectedDate);
    } catch (err) {
      console.error('Error in bulk mark attendance:', err);
      showToast('error', 'Error executing bulk attendance');
    }
  };

  // Date Shift Helper (-1 day, +1 day, Today)
  const shiftSelectedDate = (days) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  // Monthly Matrix Helpers
  const daysInMonth = useMemo(() => {
    return new Date(monthlyYear, monthlyMonth, 0).getDate();
  }, [monthlyMonth, monthlyYear]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to shift months in monthly view
  const shiftMonth = (delta) => {
    let newM = monthlyMonth + delta;
    let newY = monthlyYear;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    } else if (newM < 1) {
      newM = 12;
      newY -= 1;
    }
    setMonthlyMonth(newM);
    setMonthlyYear(newY);
  };

  // Group monthly records by staff_id
  const staffMonthlyMatrix = useMemo(() => {
    const map = new Map();

    visibleStaffList.forEach(st => {
      map.set(String(st.id), {
        staff: st,
        days: {},
        present: 0,
        late: 0,
        halfDay: 0,
        shortLeave: 0,
        absent: 0,
        leave: 0,
        totalHours: 0,
        totalOvertime: 0
      });
    });

    monthlyRecords.forEach(rec => {
      const stId = String(rec.staff_id);
      if (map.has(stId)) {
        const item = map.get(stId);
        const dayNum = new Date(rec.attendance_date).getDate();
        item.days[dayNum] = rec;

        if (rec.status === 'Present') item.present++;
        else if (rec.status === 'Late') item.late++;
        else if (rec.status === 'Half Day') item.halfDay++;
        else if (rec.status === 'Short Leave') item.shortLeave++;
        else if (rec.status === 'Absent') item.absent++;
        else if (rec.status === 'On Leave') item.leave++;

        if (rec.status !== 'Absent' && rec.status !== 'On Leave') {
          item.totalHours += Number(rec.working_hours) || 0;
          item.totalOvertime += Number(rec.overtime_hours) || 0;
        }
      }
    });

    return Array.from(map.values());
  }, [visibleStaffList, monthlyRecords]);

  // Monthly Aggregate KPI Stats across all staff for the selected month
  const monthlyKpiStats = useMemo(() => {
    let totalPresent = 0;
    let totalLate = 0;
    let totalHalfDay = 0;
    let totalShortLeave = 0;
    let totalAbsent = 0;
    let totalLeave = 0;
    let totalHours = 0;
    let totalOT = 0;

    staffMonthlyMatrix.forEach(item => {
      totalPresent += item.present;
      totalLate += item.late;
      totalHalfDay += item.halfDay;
      totalShortLeave += item.shortLeave;
      totalAbsent += item.absent;
      totalLeave += item.leave;
      totalHours += item.totalHours;
      totalOT += (item.totalOvertime || 0);
    });

    const totalStaff = visibleStaffList.length;
    const totalWorkingEntries = totalPresent + totalLate + totalHalfDay + totalShortLeave;
    const totalAllEntries = totalWorkingEntries + totalAbsent + totalLeave;
    const effectivePresent = totalPresent + totalLate + (totalHalfDay * 0.5) + (totalShortLeave * 0.85);
    const overallRate = totalAllEntries > 0 ? Math.round((effectivePresent / totalAllEntries) * 100) : 0;
    const avgStaffHours = totalStaff > 0 ? (totalHours / totalStaff).toFixed(1) : '0.0';

    return {
      totalStaff,
      totalPresent,
      totalLate,
      totalHalfDay,
      totalShortLeave,
      totalAbsent,
      totalLeave,
      totalWorkingEntries,
      totalHours: totalHours.toFixed(1),
      totalOT: totalOT.toFixed(1),
      overallRate,
      avgStaffHours
    };
  }, [staffMonthlyMatrix, visibleStaffList]);

  // Modal State for Staff Individual Monthly Punch Breakdown
  const [staffMonthlyDetailModal, setStaffMonthlyDetailModal] = useState({
    isOpen: false,
    staff: null,
    data: null
  });

  // Report Sorting State
  const [reportSortField, setReportSortField] = useState('attRate'); // 'attRate' | 'totalHours' | 'name' | 'payableDays'
  const [reportSortAsc, setReportSortAsc] = useState(false);

  // Sorted and Paginated Monthly Report List
  const sortedMonthlyReportList = useMemo(() => {
    const list = [...staffMonthlyMatrix];
    list.sort((a, b) => {
      const aMarked = a.present + a.late + a.halfDay + a.shortLeave + a.absent + a.leave;
      const bMarked = b.present + b.late + b.halfDay + b.shortLeave + b.absent + b.leave;
      const aEff = a.present + a.late + (a.halfDay * 0.5) + (a.shortLeave * 0.85);
      const bEff = b.present + b.late + (b.halfDay * 0.5) + (b.shortLeave * 0.85);
      const aRate = aMarked > 0 ? (aEff / aMarked) * 100 : 0;
      const bRate = bMarked > 0 ? (bEff / bMarked) * 100 : 0;

      let valA = 0;
      let valB = 0;
      if (reportSortField === 'attRate') {
        valA = aRate; valB = bRate;
      } else if (reportSortField === 'totalHours') {
        valA = a.totalHours; valB = b.totalHours;
      } else if (reportSortField === 'payableDays') {
        valA = aEff; valB = bEff;
      } else if (reportSortField === 'present') {
        valA = a.present + a.late; valB = b.present + b.late;
      } else if (reportSortField === 'name') {
        return reportSortAsc ? (a.staff.name || '').localeCompare(b.staff.name || '') : (b.staff.name || '').localeCompare(a.staff.name || '');
      }

      return reportSortAsc ? (valA - valB) : (valB - valA);
    });
    return list;
  }, [staffMonthlyMatrix, reportSortField, reportSortAsc]);

  // Paginated Monthly Staff Matrix
  const totalMonthlyCount = staffMonthlyMatrix.length;
  const isAllMonthly = monthlyPageSize === 'all' || Number(monthlyPageSize) === 0;
  const currentMonthlyLimit = isAllMonthly ? (totalMonthlyCount || 10) : Number(monthlyPageSize);
  const totalMonthlyPages = Math.max(1, isAllMonthly ? 1 : Math.ceil(totalMonthlyCount / currentMonthlyLimit));

  useEffect(() => {
    if (monthlyCurrentPage > totalMonthlyPages && totalMonthlyPages > 0) {
      setMonthlyCurrentPage(totalMonthlyPages);
    }
  }, [totalMonthlyPages, monthlyCurrentPage]);

  const startMonthlyIndex = isAllMonthly ? 0 : (monthlyCurrentPage - 1) * currentMonthlyLimit;
  const endMonthlyIndex = isAllMonthly ? totalMonthlyCount : Math.min(startMonthlyIndex + currentMonthlyLimit, totalMonthlyCount);
  
  const paginatedMonthlyMatrix = useMemo(() => {
    if (isAllMonthly) return staffMonthlyMatrix;
    return staffMonthlyMatrix.slice(startMonthlyIndex, endMonthlyIndex);
  }, [staffMonthlyMatrix, isAllMonthly, startMonthlyIndex, endMonthlyIndex]);

  const paginatedMonthlyReportList = useMemo(() => {
    if (isAllMonthly) return sortedMonthlyReportList;
    return sortedMonthlyReportList.slice(startMonthlyIndex, endMonthlyIndex);
  }, [sortedMonthlyReportList, isAllMonthly, startMonthlyIndex, endMonthlyIndex]);

  // Export Monthly Attendance Report to CSV Function
  const exportMonthlyReportToCSV = () => {
    const monthName = monthNames[monthlyMonth - 1];
    const headers = [
      'Staff Name',
      'Role / Specialization',
      'Branch',
      'Phone',
      'Present Days (P)',
      'Late Days (L)',
      'Half Days (HD)',
      'Short Leaves (SL)',
      'Absent Days (A)',
      'Leave Days (LV)',
      'Total Shift Hours Logged',
      'Overtime Hours (OT)',
      'Payable Working Days',
      'Attendance Health %'
    ];

    const rows = sortedMonthlyReportList.map(item => {
      const st = item.staff;
      const branchObj = branches.find(b => String(b.id) === String(st.branch_id));
      const totalMarked = item.present + item.late + item.halfDay + item.shortLeave + item.absent + item.leave;
      const effectivePres = item.present + item.late + (item.halfDay * 0.5) + (item.shortLeave * 0.85);
      const attRate = totalMarked > 0 ? Math.round((effectivePres / totalMarked) * 100) : 0;
      const payableDays = (item.present + item.late + (item.halfDay * 0.5) + (item.shortLeave * 0.85)).toFixed(1);

      return [
        `"${st.name || ''}"`,
        `"${st.specialization || 'Staff'}"`,
        `"${branchObj?.name || 'Main Salon'}"`,
        `"${st.phone || ''}"`,
        item.present,
        item.late,
        item.halfDay,
        item.shortLeave,
        item.absent,
        item.leave,
        item.totalHours.toFixed(1),
        (item.totalOvertime || 0).toFixed(1),
        payableDays,
        `${attRate}%`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SalonPulse_Staff_Attendance_Report_${monthName}_${monthlyYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', `Exported Monthly Report for ${monthName} ${monthlyYear} (${sortedMonthlyReportList.length} staff)`);
  };

  return (
    <div className="attendance-view-container" style={{ padding: '20px 24px', maxWidth: '1600px', margin: '0 auto' }}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.002); }
        }
        @keyframes shimmerBar {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .skeleton-pulse {
          animation: skeletonPulse 1.4s ease-in-out infinite;
        }
        .spin-animation {
          animation: spinSlow 1s linear infinite;
        }
        .page-btn {
          padding: 5px 9px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .page-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }
      `}</style>
      {/* Toast Notification Alert */}
      {actionMessage.text && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999,
          padding: '10px 18px',
          background: actionMessage.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.82rem',
          fontWeight: '600',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease'
        }}>
          {actionMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* ─── Top Header & Controls ─── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '1.4rem',
            fontWeight: '700',
            color: 'var(--text-main, #f8fafc)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <ClipboardCheck size={26} style={{ color: 'var(--accent-gold, #f59e0b)' }} />
            Staff Attendance & Daily Punch
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
            Record staff clock-in / clock-out times, track working hours, and review monthly registers.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          {/* View Tab Switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid rgba(51, 65, 85, 0.6)'
          }}>
            <button
              onClick={() => setViewTab('daily')}
              style={{
                padding: '6px 14px',
                fontSize: '0.74rem',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                background: viewTab === 'daily' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'transparent',
                color: viewTab === 'daily' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Clock size={14} /> Daily Punch Register
            </button>
            <button
              onClick={() => setViewTab('monthly')}
              style={{
                padding: '6px 14px',
                fontSize: '0.74rem',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                background: viewTab === 'monthly' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'transparent',
                color: viewTab === 'monthly' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <CalendarDays size={14} /> Monthly Sheet
            </button>
            <button
              onClick={() => setViewTab('monthly_report')}
              style={{
                padding: '6px 14px',
                fontSize: '0.74rem',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                background: viewTab === 'monthly_report' ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'transparent',
                color: viewTab === 'monthly_report' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <BarChart3 size={14} /> Monthly Staff Report
            </button>
          </div>

          {/* Quick "Mark All Present" Button */}
          {viewTab === 'daily' && (
            <button
              onClick={() => setShowBulkModal(true)}
              style={{
                padding: '7px 15px',
                fontSize: '0.76rem',
                fontWeight: '700',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
              <Sparkles size={14} /> Mark All Present
            </button>
          )}

          {/* Export Monthly Attendance Report to CSV */}
          {(viewTab === 'monthly' || viewTab === 'monthly_report') && (
            <button
              onClick={exportMonthlyReportToCSV}
              style={{
                padding: '7px 14px',
                fontSize: '0.75rem',
                fontWeight: '600',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.22)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.65)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.45)';
              }}
              title="Download Monthly Attendance Summary CSV for Payroll"
            >
              <Download size={14} /> Export CSV Report
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => viewTab === 'daily' ? loadDailyAttendance(selectedDate) : loadMonthlyAttendance()}
            disabled={isLoading}
            style={{
              padding: '7px 12px',
              fontSize: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(51, 65, 85, 0.8)',
              background: 'rgba(30, 41, 59, 0.6)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Refresh Attendance"
          >
            <RefreshCw size={14} className={isLoading ? 'spin-animation' : ''} />
          </button>
        </div>
      </div>

      {/* ─── Filter & Navigation Bar ─── */}
      <div className="glass-panel" style={{
        padding: '12px 18px',
        borderRadius: '12px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(51, 65, 85, 0.4)'
      }}>
        {/* Left Side: Date Navigation or Month Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {viewTab === 'daily' ? (
            <>
              <button
                onClick={() => shiftSelectedDate(-1)}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Previous Day"
              >
                <ChevronLeft size={16} />
              </button>

              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #3b82f6',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <button
                onClick={() => shiftSelectedDate(1)}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Next Day"
              >
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => setSelectedDate(getTodayStr())}
                style={{
                  background: selectedDate === getTodayStr() ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                  border: selectedDate === getTodayStr() ? '1px solid #3b82f6' : '1px solid #334155',
                  color: selectedDate === getTodayStr() ? '#60a5fa' : '#94a3b8',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Today
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => shiftMonth(-1)}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>

              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc', padding: '0 6px' }}>
                {monthNames[monthlyMonth - 1]} {monthlyYear}
              </span>

              <button
                onClick={() => shiftMonth(1)}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>

        {/* Right Side: Search, Branch, Status Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          {/* Branch Filter */}
          {branches && branches.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={14} style={{ color: '#94a3b8' }} />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  fontWeight: '500',
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

          {/* Status Filter (Daily only) */}
          {viewTab === 'daily' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} style={{ color: '#94a3b8' }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  fontWeight: '500',
                  outline: 'none'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">🟢 Available Now (On Floor)</option>
                <option value="UNAVAILABLE">⚪ Unavailable (Off Duty / Ended)</option>
                <option value="Present">🟢 Present</option>
                <option value="Late">🟡 Late</option>
                <option value="Half Day">🟠 Half Day</option>
                <option value="Short Leave">⏱️ Short Leave</option>
                <option value="Absent">🔴 Absent</option>
                <option value="On Leave">🟣 On Leave</option>
                <option value="Unmarked">⚪ Unmarked</option>
              </select>
            </div>
          )}

          {/* Search Input */}
          <div style={{ position: 'relative', width: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search staff name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                padding: '5px 10px 5px 28px',
                fontSize: '0.74rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── KPI Stats Dashboard Cards ─── */}
      {viewTab === 'daily' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '22px'
        }}>
          {/* Total Staff */}
          <div className="glass-panel" style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(51, 65, 85, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>Total Staff</span>
              <span style={{ fontSize: '1rem' }}>👥</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc', marginTop: '4px' }}>
              {kpiStats.total}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '2px' }}>
              {kpiStats.unmarkedCount > 0 ? `⚠️ ${kpiStats.unmarkedCount} unmarked` : 'All marked today'}
            </div>
          </div>

          {/* Available Now (On Floor Ready) */}
          <div className="glass-panel" style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: kpiStats.activeOnDutyCount > 0 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(30, 41, 59, 0.4)',
            border: kpiStats.activeOnDutyCount > 0 ? '1px solid rgba(34, 197, 94, 0.45)' : '1px solid rgba(51, 65, 85, 0.5)',
            boxShadow: kpiStats.activeOnDutyCount > 0 ? '0 0 16px rgba(34, 197, 94, 0.15)' : 'none'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: kpiStats.activeOnDutyCount > 0 ? '#22c55e' : '#64748b',
                  boxShadow: kpiStats.activeOnDutyCount > 0 ? '0 0 8px #22c55e' : 'none',
                  display: 'inline-block'
                }}></span>
                Available Now
              </span>
              <span style={{ fontSize: '1rem' }}>⚡</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: kpiStats.activeOnDutyCount > 0 ? '#4ade80' : '#cbd5e1', marginTop: '4px' }}>
              {kpiStats.activeOnDutyCount} <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 'normal' }}>on floor</span>
            </div>
            <div style={{ fontSize: '0.66rem', color: '#86efac', marginTop: '2px' }}>
              {kpiStats.activeOnDutyCount > 0 ? 'Ready for clients' : 'No staff currently on floor'}
            </div>
          </div>

          {/* Present Today (All Attended) */}
          <div className="glass-panel" style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: '600' }}>Present Today</span>
              <span style={{ fontSize: '1rem' }}>🟢</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#60a5fa', marginTop: '4px' }}>
              {kpiStats.activePresent}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#93c5fd', marginTop: '2px' }}>
              {kpiStats.attendancePct}% attendance ({kpiStats.completedShiftCount} completed)
            </div>
          </div>

          {/* Late Today */}
          <div className="glass-panel" style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#facc15', fontWeight: '600' }}>Late Arrivals</span>
              <span style={{ fontSize: '1rem' }}>🟡</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#facc15', marginTop: '4px' }}>
              {kpiStats.lateCount}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#fde047', marginTop: '2px' }}>
              Clocked in after shift start
            </div>
          </div>

          {/* Half Day */}
          <div className="glass-panel" style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#fb923c', fontWeight: '600' }}>Half Day</span>
              <span style={{ fontSize: '1rem' }}>🟠</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fb923c', marginTop: '4px' }}>
              {kpiStats.halfDayCount}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#fdba74', marginTop: '2px' }}>
              Partial shift (4.5 hrs)
            </div>
          </div>

          {/* Absent & On Leave */}
          <div className="glass-panel" style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: '600' }}>Absent / Leave</span>
              <span style={{ fontSize: '1rem' }}>🔴</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f87171', marginTop: '4px' }}>
              {kpiStats.absentCount + kpiStats.leaveCount + kpiStats.shortLeaveCount}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#fca5a5', marginTop: '2px' }}>
              {kpiStats.absentCount} Absent • {kpiStats.leaveCount} Leave {kpiStats.shortLeaveCount > 0 ? `• ${kpiStats.shortLeaveCount} Short Leave` : ''}
            </div>
          </div>

          {/* Average Hours */}
          <div className="glass-panel" style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: '600' }}>Avg Working Hours</span>
              <span style={{ fontSize: '1rem' }}>⏱️</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#60a5fa', marginTop: '4px' }}>
              {kpiStats.avgHours} hrs
            </div>
            <div style={{ fontSize: '0.66rem', color: '#93c5fd', marginTop: '2px' }}>
              Per active staff member
            </div>
          </div>
        </div>
      ) : (
        /* Monthly KPI Dashboard Cards */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '22px'
        }}>
          {/* Total Staff (Monthly) */}
          <div className="glass-panel" style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(51, 65, 85, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>Total Staff</span>
              <span style={{ fontSize: '1rem' }}>👥</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc', marginTop: '4px' }}>
              {monthlyKpiStats.totalStaff}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '2px' }}>
              {monthNames[monthlyMonth - 1]} {monthlyYear} Roster
            </div>
          </div>

          {/* Monthly Attendance Health Rate */}
          <div className="glass-panel" style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: monthlyKpiStats.overallRate >= 85 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
            border: monthlyKpiStats.overallRate >= 85 ? '1px solid rgba(34, 197, 94, 0.45)' : '1px solid rgba(234, 179, 8, 0.45)',
            boxShadow: monthlyKpiStats.overallRate >= 85 ? '0 0 16px rgba(34, 197, 94, 0.12)' : 'none'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: monthlyKpiStats.overallRate >= 85 ? '#4ade80' : '#facc15', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <TrendingUp size={13} />
                Attendance Health
              </span>
              <span style={{ fontSize: '1rem' }}>🎯</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: monthlyKpiStats.overallRate >= 85 ? '#4ade80' : '#facc15', marginTop: '4px' }}>
              {monthlyKpiStats.overallRate}%
            </div>
            <div style={{ fontSize: '0.66rem', color: monthlyKpiStats.overallRate >= 85 ? '#86efac' : '#fde047', marginTop: '2px' }}>
              Overall salon attendance rate
            </div>
          </div>

          {/* Present Shifts (P) */}
          <div className="glass-panel" style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: '600' }}>Present Shifts</span>
              <span style={{ fontSize: '1rem' }}>🟢</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#4ade80', marginTop: '4px' }}>
              {monthlyKpiStats.totalPresent}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#86efac', marginTop: '2px' }}>
              {monthlyKpiStats.totalWorkingEntries} active shifts logged
            </div>
          </div>

          {/* Late Arrivals (L) */}
          <div className="glass-panel" style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#facc15', fontWeight: '600' }}>Late Arrivals</span>
              <span style={{ fontSize: '1rem' }}>🟡</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#facc15', marginTop: '4px' }}>
              {monthlyKpiStats.totalLate}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#fde047', marginTop: '2px' }}>
              Shift delay clock-in entries
            </div>
          </div>

          {/* Half Days (HD) */}
          <div className="glass-panel" style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#fb923c', fontWeight: '600' }}>Half Day (HD)</span>
              <span style={{ fontSize: '1rem' }}>🟠</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fb923c', marginTop: '4px' }}>
              {monthlyKpiStats.totalHalfDay}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#fdba74', marginTop: '2px' }}>
              Partial shifts (4.5 hrs credit)
            </div>
          </div>

          {/* Short Leaves (SL) */}
          <div className="glass-panel" style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#22d3ee', fontWeight: '600' }}>Short Leaves (SL)</span>
              <span style={{ fontSize: '1rem' }}>⏱️</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#22d3ee', marginTop: '4px' }}>
              {monthlyKpiStats.totalShortLeave}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#a5f3fc', marginTop: '2px' }}>
              Approved mid-day departures
            </div>
          </div>

          {/* Absent / Leave */}
          <div className="glass-panel" style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: '600' }}>Absent / Leaves</span>
              <span style={{ fontSize: '1rem' }}>🔴</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f87171', marginTop: '4px' }}>
              {monthlyKpiStats.totalAbsent + monthlyKpiStats.totalLeave}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#fca5a5', marginTop: '2px' }}>
              {monthlyKpiStats.totalAbsent} Absent • {monthlyKpiStats.totalLeave} On Leave
            </div>
          </div>

          {/* Total Shift Hours & Overtime */}
          <div className="glass-panel" style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: '600' }}>Logged Hours & OT</span>
              <span style={{ fontSize: '1rem' }}>⚡</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#60a5fa', marginTop: '4px' }}>
              {monthlyKpiStats.totalHours} <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 'normal' }}>hrs</span>
            </div>
            <div style={{ fontSize: '0.66rem', color: '#93c5fd', marginTop: '2px' }}>
              Avg {monthlyKpiStats.avgStaffHours}h • OT: +{monthlyKpiStats.totalOT}h
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT: Daily Register vs Monthly Matrix ─── */}
      {viewTab === 'daily' ? (
        /* Daily Punch Register Table */
        <div className="glass-panel" style={{
          borderRadius: '12px',
          border: '1px solid rgba(51, 65, 85, 0.5)',
          overflow: 'hidden',
          background: 'rgba(15, 23, 42, 0.6)',
          position: 'relative'
        }}>
          {/* Loading Shimmer Bar */}
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #10b981, #3b82f6)',
              backgroundSize: '200% 100%',
              animation: 'shimmerBar 1.2s infinite linear',
              zIndex: 20
            }} />
          )}

          <div style={{
            padding: '12px 18px',
            borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(30, 41, 59, 0.3)'
          }}>
            <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} style={{ color: '#3b82f6' }} />
              Daily Attendance Register — {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isLoading && (
                <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={11} className="spin-animation" /> Syncing Database...
                </span>
              )}
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Showing <strong style={{ color: '#f8fafc' }}>{totalDailyStaffCount === 0 ? 0 : startDailyIndex + 1}</strong> - <strong style={{ color: '#f8fafc' }}>{endDailyIndex}</strong> of <strong style={{ color: '#f8fafc' }}>{totalDailyStaffCount}</strong> staff
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.76rem' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.5)', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Staff Member</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Branch</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600', minWidth: '320px' }}>Quick Attendance Action</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Punch In / Out</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Hours Logged</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Remarks</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600', textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: Math.min(5, Number(pageSize) || 5) }).map((_, idx) => (
                    <tr key={`skel-${idx}`} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.25)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="skeleton-pulse" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(51, 65, 85, 0.5)' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div className="skeleton-pulse" style={{ width: '110px', height: '13px', borderRadius: '4px', background: 'rgba(51, 65, 85, 0.45)' }} />
                            <div className="skeleton-pulse" style={{ width: '70px', height: '9px', borderRadius: '4px', background: 'rgba(51, 65, 85, 0.3)' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div className="skeleton-pulse" style={{ width: '85px', height: '14px', borderRadius: '4px', background: 'rgba(51, 65, 85, 0.4)' }} />
                          <div className="skeleton-pulse" style={{ width: '100px', height: '9px', borderRadius: '4px', background: 'rgba(51, 65, 85, 0.25)' }} />
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <div className="skeleton-pulse" style={{ width: '90px', height: '24px', borderRadius: '6px', background: 'rgba(51, 65, 85, 0.4)' }} />
                          <div className="skeleton-pulse" style={{ width: '75px', height: '24px', borderRadius: '6px', background: 'rgba(51, 65, 85, 0.3)' }} />
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="skeleton-pulse" style={{ width: '95px', height: '14px', borderRadius: '4px', background: 'rgba(51, 65, 85, 0.35)' }} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="skeleton-pulse" style={{ width: '55px', height: '14px', borderRadius: '4px', background: 'rgba(51, 65, 85, 0.35)' }} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="skeleton-pulse" style={{ width: '65px', height: '11px', borderRadius: '4px', background: 'rgba(51, 65, 85, 0.25)' }} />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div className="skeleton-pulse" style={{ width: '48px', height: '22px', borderRadius: '4px', background: 'rgba(51, 65, 85, 0.35)', margin: '0 auto' }} />
                      </td>
                    </tr>
                  ))
                ) : paginatedDailyStaff.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      <UserCheck size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <div>No staff members found matching criteria for this date.</div>
                    </td>
                  </tr>
                ) : (
                  paginatedDailyStaff.map(staff => {
                    const rec = dailyAttendanceMap.get(String(staff.id));
                    const currentStatus = rec?.status || 'Unmarked';
                    const branchObj = branches.find(b => String(b.id) === String(staff.branch_id));
                    const branchTiming = getBranchShiftTiming(staff.branch_id, selectedDate);
                    const hasIn = Boolean(rec?.check_in_time);
                    const hasOut = Boolean(rec?.check_out_time);
                    const isAbsentOrLeave = currentStatus === 'Absent' || currentStatus === 'On Leave';
                    const isShortLeave = currentStatus === 'Short Leave';
                    const isAvailableNow = Boolean(hasIn && !hasOut && !isAbsentOrLeave && !isShortLeave);

                    return (
                      <tr
                        key={staff.id}
                        style={{
                          borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
                          transition: 'background 0.12s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Staff Profile */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ position: 'relative' }}>
                              <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: isShortLeave
                                  ? 'linear-gradient(135deg, #0891b2, #06b6d4)'
                                  : isAvailableNow
                                    ? 'linear-gradient(135deg, #059669, #10b981)'
                                    : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                color: '#ffffff',
                                flexShrink: 0
                              }}>
                                {(staff.name || 'S').charAt(0).toUpperCase()}
                              </div>
                              {/* Live Presence Indicator Dot on Avatar */}
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: '-1px',
                                  right: '-1px',
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  background: isShortLeave ? '#06b6d4' : (isAvailableNow ? '#22c55e' : '#64748b'),
                                  border: '2px solid #0f172a',
                                  boxShadow: isShortLeave ? '0 0 8px #06b6d4' : (isAvailableNow ? '0 0 8px #22c55e' : 'none')
                                }}
                                title={isShortLeave ? '⏱️ Short Leave: Approved permission' : (isAvailableNow ? '🟢 Available: Currently active on floor' : '⚪ Unavailable: Off duty or shift completed')}
                              />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.82rem' }}>
                                  {staff.name}
                                </span>
                                {/* Live Availability / Status Badge */}
                                {isShortLeave ? (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'rgba(6, 182, 212, 0.16)',
                                    color: '#22d3ee',
                                    border: '1px solid rgba(6, 182, 212, 0.4)',
                                    padding: '2px 7px',
                                    borderRadius: '12px',
                                    fontSize: '0.62rem',
                                    fontWeight: '700'
                                  }}>
                                    <Clock size={10} />
                                    Short Leave
                                  </span>
                                ) : isAvailableNow ? (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'rgba(34, 197, 94, 0.16)',
                                    color: '#4ade80',
                                    border: '1px solid rgba(34, 197, 94, 0.38)',
                                    padding: '2px 7px',
                                    borderRadius: '12px',
                                    fontSize: '0.62rem',
                                    fontWeight: '700',
                                    boxShadow: '0 0 10px rgba(34, 197, 94, 0.18)'
                                  }}>
                                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }}></span>
                                    Available
                                  </span>
                                ) : (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'rgba(100, 116, 139, 0.15)',
                                    color: '#94a3b8',
                                    border: '1px solid rgba(100, 116, 139, 0.3)',
                                    padding: '2px 7px',
                                    borderRadius: '12px',
                                    fontSize: '0.62rem',
                                    fontWeight: '600'
                                  }}>
                                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#64748b' }}></span>
                                    Unavailable
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '2px' }}>
                                {staff.specialization || 'Staff Stylist'} {staff.phone ? `• ${staff.phone}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Branch & Dynamic Schedule Timing */}
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.72rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{
                              background: 'rgba(51, 65, 85, 0.4)',
                              border: '1px solid rgba(71, 85, 105, 0.4)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: '600',
                              color: '#cbd5e1',
                              display: 'inline-block',
                              width: 'fit-content'
                            }}>
                              {branchObj?.name || 'Main Salon'}
                            </span>
                            <span style={{ fontSize: '0.62rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }} title="Branch Shift Hours configured in Time Slots & Schedule">
                              <Clock size={10} /> Shift: {branchTiming.checkIn} - {branchTiming.checkOut} ({branchTiming.hours}h)
                            </span>
                          </div>
                        </td>

                        {/* Quick Attendance / Clock Action */}
                        <td style={{ padding: '12px 16px' }}>
                          {(() => {
                            if (isShortLeave) {
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{
                                    background: 'rgba(6, 182, 212, 0.15)',
                                    border: '1px solid rgba(6, 182, 212, 0.4)',
                                    color: '#22d3ee',
                                    padding: '4px 9px',
                                    borderRadius: '6px',
                                    fontSize: '0.68rem',
                                    fontWeight: '700',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}>
                                    <Clock size={12} style={{ color: '#22d3ee' }} />
                                    <span>Short Leave ({rec?.working_hours || 0}h worked)</span>
                                  </span>
                                  <button
                                    onClick={() => openShortLeaveModal(staff)}
                                    style={{
                                      background: 'rgba(30, 41, 59, 0.7)',
                                      border: '1px solid #475569',
                                      color: '#cbd5e1',
                                      padding: '3px 8px',
                                      borderRadius: '5px',
                                      fontSize: '0.64rem',
                                      cursor: 'pointer'
                                    }}
                                    title="Adjust Short Leave details"
                                  >
                                    Edit SL
                                  </button>
                                </div>
                              );
                            }

                            if (isAbsentOrLeave) {
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    background: currentStatus === 'Absent' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                    border: currentStatus === 'Absent' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(168, 85, 247, 0.4)',
                                    color: currentStatus === 'Absent' ? '#f87171' : '#c084fc',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.68rem',
                                    fontWeight: '700'
                                  }}>
                                    {currentStatus === 'Absent' ? '🔴 Absent' : '🟣 On Leave'}
                                  </span>
                                  <button
                                    onClick={() => openClockModal(staff, 'clock_in')}
                                    style={{
                                      background: 'rgba(30, 41, 59, 0.6)',
                                      border: '1px solid #475569',
                                      color: '#cbd5e1',
                                      padding: '3px 8px',
                                      borderRadius: '5px',
                                      fontSize: '0.64rem',
                                      cursor: 'pointer'
                                    }}
                                    title="Clock in if staff arrived"
                                  >
                                    Clock In
                                  </button>
                                </div>
                              );
                            }

                            if (hasIn && !hasOut) {
                              // Clocked In, NOT Logged out yet (Active Working)
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{
                                    background: 'rgba(34, 197, 94, 0.15)',
                                    border: '1px solid rgba(34, 197, 94, 0.4)',
                                    color: '#4ade80',
                                    padding: '4px 9px',
                                    borderRadius: '6px',
                                    fontSize: '0.68rem',
                                    fontWeight: '700',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}>
                                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', display: 'inline-block' }}></span>
                                    🟢 Available (In: {rec.check_in_time})
                                  </span>

                                  <button
                                    onClick={() => openClockModal(staff, 'clock_out')}
                                    style={{
                                      background: 'linear-gradient(135deg, #f97316, #ea580c)',
                                      border: 'none',
                                      color: '#ffffff',
                                      padding: '5px 12px',
                                      borderRadius: '6px',
                                      fontSize: '0.7rem',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      boxShadow: '0 2px 8px rgba(249, 115, 22, 0.35)'
                                    }}
                                    title={`Clock Out / Logout ${staff.name} to record actual leaving time and hours`}
                                  >
                                    <LogOut size={13} />
                                    <span>Clock Out (Logout)</span>
                                  </button>

                                  <button
                                    onClick={() => openShortLeaveModal(staff)}
                                    style={{
                                      background: 'rgba(6, 182, 212, 0.14)',
                                      border: '1px solid rgba(6, 182, 212, 0.4)',
                                      color: '#22d3ee',
                                      padding: '5px 10px',
                                      borderRadius: '6px',
                                      fontSize: '0.68rem',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title={`Grant Short Leave / Permission to ${staff.name}`}
                                  >
                                    <Clock size={12} />
                                    <span>Short Leave</span>
                                  </button>
                                </div>
                              );
                            }

                            if (hasIn && hasOut) {
                              // Shift Completed for the day - Logged Out
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    border: '1px solid rgba(59, 130, 246, 0.4)',
                                    color: '#60a5fa',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}>
                                    <CheckCircle2 size={13} style={{ color: '#38bdf8' }} />
                                    <span>Shift Completed ({rec.working_hours} hrs)</span>
                                  </span>
                                </div>
                              );
                            }

                            // Not Clocked In Yet
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => openClockModal(staff, 'clock_in')}
                                  style={{
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    border: 'none',
                                    color: '#ffffff',
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                                  }}
                                  title={`Clock In ${staff.name} (Shift start: ${branchTiming.checkIn})`}
                                >
                                  <LogIn size={13} />
                                  <span>Clock In</span>
                                </button>

                                <button
                                  onClick={() => handleMarkFullShift(staff)}
                                  style={{
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    border: '1px solid rgba(59, 130, 246, 0.35)',
                                    color: '#60a5fa',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.66rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                  title={`Mark entire scheduled shift (${branchTiming.checkIn} - ${branchTiming.checkOut})`}
                                >
                                  ⚡ Full Shift
                                </button>

                                <button
                                  onClick={() => handleQuickStatusChange(staff, 'Absent')}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.12)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#f87171',
                                    padding: '4px 7px',
                                    borderRadius: '6px',
                                    fontSize: '0.66rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                  title="Mark Absent"
                                >
                                  🔴 Absent
                                </button>

                                <button
                                  onClick={() => handleQuickStatusChange(staff, 'On Leave')}
                                  style={{
                                    background: 'rgba(168, 85, 247, 0.12)',
                                    border: '1px solid rgba(168, 85, 247, 0.3)',
                                    color: '#c084fc',
                                    padding: '4px 7px',
                                    borderRadius: '6px',
                                    fontSize: '0.66rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                  title="Mark On Leave"
                                >
                                  🟣 Leave
                                </button>

                                <button
                                  onClick={() => openShortLeaveModal(staff)}
                                  style={{
                                    background: 'rgba(6, 182, 212, 0.12)',
                                    border: '1px solid rgba(6, 182, 212, 0.35)',
                                    color: '#22d3ee',
                                    padding: '4px 7px',
                                    borderRadius: '6px',
                                    fontSize: '0.66rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                  title="Record Short Leave / Permission (1-3 hrs)"
                                >
                                  ⏱️ Short Leave
                                </button>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Punch In / Out Times */}
                        <td style={{ padding: '12px 16px' }}>
                          {(() => {
                            const hasIn = Boolean(rec?.check_in_time);
                            const hasOut = Boolean(rec?.check_out_time);
                            const isAbsentOrLeave = currentStatus === 'Absent' || currentStatus === 'On Leave';

                            if (isShortLeave) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <div style={{ fontSize: '0.74rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: '#22d3ee', fontWeight: '700' }}>{rec?.check_in_time || branchTiming.checkIn}</span>
                                    <span style={{ color: '#64748b' }}>→</span>
                                    <span style={{ color: '#22d3ee', fontWeight: '700' }}>{rec?.check_out_time || branchTiming.checkOut}</span>
                                  </div>
                                  <span style={{ color: '#06b6d4', fontSize: '0.62rem' }}>Short Leave (Permission)</span>
                                </div>
                              );
                            }

                            if (isAbsentOrLeave) {
                              return (
                                <span style={{ color: currentStatus === 'Absent' ? '#ef4444' : '#c084fc', fontStyle: 'italic', fontSize: '0.7rem' }}>
                                  — {currentStatus === 'Absent' ? 'Absent' : 'On Leave'} —
                                </span>
                              );
                            }

                            if (!hasIn) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.68rem' }}>— Not Clocked In —</span>
                                  <span style={{ color: '#475569', fontSize: '0.62rem' }}>Shift: {branchTiming.checkIn} → {branchTiming.checkOut}</span>
                                </div>
                              );
                            }

                            if (hasIn && !hasOut) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <div style={{ fontSize: '0.74rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: '#4ade80', fontWeight: '700' }}>📥 {rec.check_in_time}</span>
                                    <span style={{ color: '#64748b' }}>→</span>
                                    <span style={{ color: '#4ade80', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', display: 'inline-block' }}></span>
                                      Available Now
                                    </span>
                                  </div>
                                  <span style={{ color: '#64748b', fontSize: '0.62rem' }}>Scheduled close: {branchTiming.checkOut}</span>
                                </div>
                              );
                            }

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ fontSize: '0.74rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ color: '#4ade80', fontWeight: '700' }}>{rec?.check_in_time}</span>
                                  <span style={{ color: '#64748b' }}>→</span>
                                  <span style={{ color: '#60a5fa', fontWeight: '700' }}>{rec?.check_out_time}</span>
                                </div>
                                <span style={{ color: '#64748b', fontSize: '0.62rem' }}>Logout recorded</span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Hours Logged */}
                        <td style={{ padding: '12px 16px' }}>
                          {(() => {
                            const hasIn = Boolean(rec?.check_in_time);
                            const hasOut = Boolean(rec?.check_out_time);
                            const isAbsentOrLeave = currentStatus === 'Absent' || currentStatus === 'On Leave';

                            if (isAbsentOrLeave) {
                              return <span style={{ color: '#64748b' }}>0.0 hrs</span>;
                            }

                            if (!hasIn) {
                              return <span style={{ color: '#64748b', fontSize: '0.72rem' }}>— ({branchTiming.hours}h shift)</span>;
                            }

                            if (hasIn && !hasOut) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ color: '#38bdf8', fontWeight: '700', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Timer size={12} />
                                    {selectedDate === getTodayStr() ? `~${getElapsedHours(rec.check_in_time)}h so far` : 'In Progress'}
                                  </span>
                                  <span style={{ color: '#64748b', fontSize: '0.62rem' }}>Will finalize on Logout</span>
                                </div>
                              );
                            }

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    fontWeight: '700',
                                    color: Number(rec?.working_hours || 0) >= branchTiming.hours ? '#4ade80' : '#fb923c',
                                    fontSize: '0.76rem'
                                  }}>
                                    {rec?.working_hours || '0.0'} hrs
                                  </span>
                                  {Number(rec?.overtime_hours || 0) > 0 && (
                                    <span style={{
                                      background: 'rgba(234, 179, 8, 0.2)',
                                      color: '#facc15',
                                      border: '1px solid rgba(234, 179, 8, 0.4)',
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      fontSize: '0.6rem',
                                      fontWeight: '700'
                                    }}>
                                      +{rec.overtime_hours}h OT
                                    </span>
                                  )}
                                </div>
                                <span style={{ color: '#64748b', fontSize: '0.62rem' }}>
                                  {Number(rec?.working_hours || 0) < branchTiming.hours
                                    ? `Partial (${rec?.working_hours}h / ${branchTiming.hours}h)`
                                    : (Number(rec?.working_hours || 0) > branchTiming.hours ? `Extended shift` : `Full scheduled shift`)}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Remarks */}
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            onClick={() => openEditModal(staff)}
                            style={{
                              color: rec?.notes ? '#fde047' : '#64748b',
                              fontSize: '0.68rem',
                              cursor: 'pointer',
                              textDecoration: rec?.notes ? 'underline' : 'none'
                            }}
                            title="Click to edit remarks"
                          >
                            {rec?.notes ? (rec.notes.length > 25 ? rec.notes.substring(0, 25) + '...' : rec.notes) : '+ Add note'}
                          </span>
                        </td>

                        {/* Edit Action Button */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => openEditModal(staff)}
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              color: '#60a5fa',
                              padding: '4px 8px',
                              borderRadius: '5px',
                              fontSize: '0.68rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Edit full attendance details"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ─── Pagination Bar for Daily Register ─── */}
          <div style={{
            padding: '12px 18px',
            borderTop: '1px solid rgba(51, 65, 85, 0.4)',
            background: 'rgba(15, 23, 42, 0.8)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* Left: Rows Per Page Selector & Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '500' }}>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                  <option value="all">All ({totalDailyStaffCount})</option>
                </select>
              </div>

              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Showing <strong style={{ color: '#f8fafc' }}>{totalDailyStaffCount === 0 ? 0 : startDailyIndex + 1}</strong> - <strong style={{ color: '#f8fafc' }}>{endDailyIndex}</strong> of <strong style={{ color: '#f8fafc' }}>{totalDailyStaffCount}</strong> staff members
              </span>
            </div>

            {/* Right: Page Navigation Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {/* First Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || isAllDaily || isLoading}
                className="page-btn"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid #334155',
                  color: (currentPage === 1 || isAllDaily) ? '#475569' : '#cbd5e1',
                  cursor: (currentPage === 1 || isAllDaily) ? 'not-allowed' : 'pointer',
                  opacity: (currentPage === 1 || isAllDaily) ? 0.5 : 1
                }}
                title="First Page"
              >
                <ChevronsLeft size={13} />
                <span>First</span>
              </button>

              {/* Previous Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isAllDaily || isLoading}
                className="page-btn"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid #334155',
                  color: (currentPage === 1 || isAllDaily) ? '#475569' : '#cbd5e1',
                  cursor: (currentPage === 1 || isAllDaily) ? 'not-allowed' : 'pointer',
                  opacity: (currentPage === 1 || isAllDaily) ? 0.5 : 1
                }}
                title="Previous Page"
              >
                <ChevronLeft size={13} />
                <span>Prev</span>
              </button>

              {/* Page Number Pills */}
              {!isAllDaily && totalDailyPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 4px' }}>
                  {Array.from({ length: totalDailyPages }, (_, i) => i + 1).map(pageNum => {
                    if (
                      pageNum === 1 ||
                      pageNum === totalDailyPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={isLoading}
                          style={{
                            minWidth: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: isActive ? '1px solid #3b82f6' : '1px solid #334155',
                            background: isActive ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(30, 41, 59, 0.7)',
                            color: isActive ? '#ffffff' : '#cbd5e1',
                            fontSize: '0.72rem',
                            fontWeight: isActive ? '700' : '500',
                            cursor: 'pointer',
                            boxShadow: isActive ? '0 0 10px rgba(59, 130, 246, 0.4)' : 'none'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (
                      (pageNum === 2 && currentPage > 3) ||
                      (pageNum === totalDailyPages - 1 && currentPage < totalDailyPages - 2)
                    ) {
                      return <span key={`ellipsis-${pageNum}`} style={{ color: '#64748b', fontSize: '0.7rem', padding: '0 2px' }}>…</span>;
                    }
                    return null;
                  })}
                </div>
              )}

              {/* Next Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalDailyPages, p + 1))}
                disabled={currentPage >= totalDailyPages || isAllDaily || isLoading}
                className="page-btn"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid #334155',
                  color: (currentPage >= totalDailyPages || isAllDaily) ? '#475569' : '#cbd5e1',
                  cursor: (currentPage >= totalDailyPages || isAllDaily) ? 'not-allowed' : 'pointer',
                  opacity: (currentPage >= totalDailyPages || isAllDaily) ? 0.5 : 1
                }}
                title="Next Page"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>

              {/* Last Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(totalDailyPages)}
                disabled={currentPage >= totalDailyPages || isAllDaily || isLoading}
                className="page-btn"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid #334155',
                  color: (currentPage >= totalDailyPages || isAllDaily) ? '#475569' : '#cbd5e1',
                  cursor: (currentPage >= totalDailyPages || isAllDaily) ? 'not-allowed' : 'pointer',
                  opacity: (currentPage >= totalDailyPages || isAllDaily) ? 0.5 : 1
                }}
                title="Last Page"
              >
                <span>Last</span>
                <ChevronsRight size={13} />
              </button>
            </div>
          </div>
        </div>
      ) : viewTab === 'monthly' ? (
        /* Monthly Attendance Matrix View */
        <div className="glass-panel" style={{
          borderRadius: '12px',
          border: '1px solid rgba(51, 65, 85, 0.5)',
          overflow: 'hidden',
          background: 'rgba(15, 23, 42, 0.6)',
          position: 'relative'
        }}>
          {/* Shimmer Bar when Loading */}
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #10b981, #3b82f6)',
              backgroundSize: '200% 100%',
              animation: 'shimmerBar 1.2s infinite linear',
              zIndex: 20
            }} />
          )}

          <div style={{
            padding: '12px 18px',
            borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(30, 41, 59, 0.3)'
          }}>
            <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={16} style={{ color: '#3b82f6' }} />
              Monthly Attendance Register — {monthNames[monthlyMonth - 1]} {monthlyYear}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.68rem', color: '#94a3b8' }}>
              <span>Legend:</span>
              <span style={{ color: '#4ade80' }}>● P: Present</span>
              <span style={{ color: '#facc15' }}>● L: Late</span>
              <span style={{ color: '#fb923c' }}>● HD: Half Day</span>
              <span style={{ color: '#22d3ee' }}>● SL: Short Leave</span>
              <span style={{ color: '#f87171' }}>● A: Absent</span>
              <span style={{ color: '#c084fc' }}>● LV: Leave</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.72rem' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', minWidth: '180px', position: 'sticky', left: 0, background: '#0f172a', zIndex: 10 }}>Staff Member</th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                    <th key={day} style={{ padding: '8px 4px', minWidth: '28px', borderRight: '1px solid rgba(51, 65, 85, 0.2)' }}>
                      {day}
                    </th>
                  ))}
                  <th style={{ padding: '8px 8px', color: '#4ade80', fontWeight: '700' }}>P</th>
                  <th style={{ padding: '8px 8px', color: '#facc15', fontWeight: '700' }}>L</th>
                  <th style={{ padding: '8px 8px', color: '#fb923c', fontWeight: '700' }}>HD</th>
                  <th style={{ padding: '8px 8px', color: '#22d3ee', fontWeight: '700' }}>SL</th>
                  <th style={{ padding: '8px 8px', color: '#f87171', fontWeight: '700' }}>A</th>
                  <th style={{ padding: '8px 8px', color: '#c084fc', fontWeight: '700' }}>LV</th>
                  <th style={{ padding: '8px 10px', color: '#60a5fa', fontWeight: '700' }}>Total Hrs</th>
                  <th style={{ padding: '8px 10px', color: '#f59e0b', fontWeight: '700' }}>Att %</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={`skel-m-${idx}`} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.2)' }}>
                      <td style={{ padding: '10px 12px', textAlign: 'left', position: 'sticky', left: 0, background: '#0f172a', zIndex: 5 }}>
                        <div className="skeleton-pulse" style={{ width: '110px', height: '14px', borderRadius: '4px', background: 'rgba(51, 65, 85, 0.5)' }} />
                      </td>
                      {Array.from({ length: daysInMonth + 7 }).map((__, dIdx) => (
                        <td key={dIdx} style={{ padding: '6px 2px' }}>
                          <div className="skeleton-pulse" style={{ width: '16px', height: '14px', borderRadius: '3px', background: 'rgba(51, 65, 85, 0.3)', margin: '0 auto' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginatedMonthlyMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={daysInMonth + 9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No staff records found for this month.
                    </td>
                  </tr>
                ) : (
                  paginatedMonthlyMatrix.map(({ staff, days, present, late, halfDay, shortLeave, absent, leave, totalHours }) => {
                    const markedDays = present + late + halfDay + (shortLeave || 0) + absent + leave;
                    const effectivePresent = present + late + (halfDay * 0.5) + ((shortLeave || 0) * 0.85);
                    const attRate = markedDays > 0 ? Math.round((effectivePresent / markedDays) * 100) : 0;

                    return (
                      <tr
                        key={staff.id}
                        style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.25)' }}
                      >
                        {/* Staff Column (Fixed Left) */}
                        <td style={{
                          padding: '8px 12px',
                          textAlign: 'left',
                          position: 'sticky',
                          left: 0,
                          background: '#0f172a',
                          zIndex: 5,
                          borderRight: '1px solid rgba(51, 65, 85, 0.5)'
                        }}>
                          <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.74rem' }}>
                            {staff.name}
                          </div>
                          <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                            {staff.specialization || 'Staff'}
                          </div>
                        </td>

                        {/* Days 1 to 31 */}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                          const record = days[day];
                          const status = record?.status;
                          const cfg = status ? STATUS_CONFIG[status] : null;

                          return (
                            <td
                              key={day}
                              style={{
                                padding: '4px 2px',
                                borderRight: '1px solid rgba(51, 65, 85, 0.15)',
                                background: cfg ? cfg.bg : 'transparent',
                                color: cfg ? cfg.color : '#475569',
                                fontWeight: cfg ? '700' : '400',
                                fontSize: '0.66rem'
                              }}
                              title={record ? `${staff.name} on ${day} ${monthNames[monthlyMonth - 1]}: ${status} (${record.working_hours}h)` : `No record for day ${day}`}
                            >
                              {cfg ? cfg.short : '·'}
                            </td>
                          );
                        })}

                        {/* Summary Columns */}
                        <td style={{ padding: '6px', color: '#4ade80', fontWeight: '700', background: 'rgba(34, 197, 94, 0.05)' }}>{present}</td>
                        <td style={{ padding: '6px', color: '#facc15', fontWeight: '700', background: 'rgba(234, 179, 8, 0.05)' }}>{late}</td>
                        <td style={{ padding: '6px', color: '#fb923c', fontWeight: '700', background: 'rgba(249, 115, 22, 0.05)' }}>{halfDay}</td>
                        <td style={{ padding: '6px', color: '#22d3ee', fontWeight: '700', background: 'rgba(6, 182, 212, 0.05)' }}>{shortLeave || 0}</td>
                        <td style={{ padding: '6px', color: '#f87171', fontWeight: '700', background: 'rgba(239, 68, 68, 0.05)' }}>{absent}</td>
                        <td style={{ padding: '6px', color: '#c084fc', fontWeight: '700', background: 'rgba(168, 85, 247, 0.05)' }}>{leave}</td>
                        <td style={{ padding: '6px', color: '#60a5fa', fontWeight: '700', background: 'rgba(59, 130, 246, 0.05)' }}>{totalHours.toFixed(1)}h</td>
                        <td style={{ padding: '6px', color: attRate >= 85 ? '#4ade80' : (attRate >= 70 ? '#facc15' : '#f87171'), fontWeight: '700' }}>
                          {markedDays > 0 ? `${attRate}%` : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ─── Pagination Bar for Monthly Register ─── */}
          <div style={{
            padding: '12px 18px',
            borderTop: '1px solid rgba(51, 65, 85, 0.4)',
            background: 'rgba(15, 23, 42, 0.8)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* Left: Rows Per Page Selector & Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '500' }}>Staff per page:</span>
                <select
                  value={monthlyPageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setMonthlyPageSize(val);
                    setMonthlyCurrentPage(1);
                  }}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={5}>5 staff</option>
                  <option value={10}>10 staff</option>
                  <option value={20}>20 staff</option>
                  <option value={50}>50 staff</option>
                  <option value="all">All ({totalMonthlyCount})</option>
                </select>
              </div>

              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Showing <strong style={{ color: '#f8fafc' }}>{totalMonthlyCount === 0 ? 0 : startMonthlyIndex + 1}</strong> - <strong style={{ color: '#f8fafc' }}>{endMonthlyIndex}</strong> of <strong style={{ color: '#f8fafc' }}>{totalMonthlyCount}</strong> staff members
              </span>
            </div>

            {/* Right: Page Navigation Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <button
                type="button"
                onClick={() => setMonthlyCurrentPage(1)}
                disabled={monthlyCurrentPage === 1 || isAllMonthly || isLoading}
                className="page-btn"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid #334155',
                  color: (monthlyCurrentPage === 1 || isAllMonthly) ? '#475569' : '#cbd5e1',
                  cursor: (monthlyCurrentPage === 1 || isAllMonthly) ? 'not-allowed' : 'pointer',
                  opacity: (monthlyCurrentPage === 1 || isAllMonthly) ? 0.5 : 1
                }}
                title="First Page"
              >
                <ChevronsLeft size={13} />
                <span>First</span>
              </button>

              <button
                type="button"
                onClick={() => setMonthlyCurrentPage(p => Math.max(1, p - 1))}
                disabled={monthlyCurrentPage === 1 || isAllMonthly || isLoading}
                className="page-btn"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid #334155',
                  color: (monthlyCurrentPage === 1 || isAllMonthly) ? '#475569' : '#cbd5e1',
                  cursor: (monthlyCurrentPage === 1 || isAllMonthly) ? 'not-allowed' : 'pointer',
                  opacity: (monthlyCurrentPage === 1 || isAllMonthly) ? 0.5 : 1
                }}
                title="Previous Page"
              >
                <ChevronLeft size={13} />
                <span>Prev</span>
              </button>

              <button
                type="button"
                onClick={() => setMonthlyCurrentPage(p => Math.min(totalMonthlyPages, p + 1))}
                disabled={monthlyCurrentPage >= totalMonthlyPages || isAllMonthly || isLoading}
                className="page-btn"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid #334155',
                  color: (monthlyCurrentPage >= totalMonthlyPages || isAllMonthly) ? '#475569' : '#cbd5e1',
                  cursor: (monthlyCurrentPage >= totalMonthlyPages || isAllMonthly) ? 'not-allowed' : 'pointer',
                  opacity: (monthlyCurrentPage >= totalMonthlyPages || isAllMonthly) ? 0.5 : 1
                }}
                title="Next Page"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>

              <button
                type="button"
                onClick={() => setMonthlyCurrentPage(totalMonthlyPages)}
                disabled={monthlyCurrentPage >= totalMonthlyPages || isAllMonthly || isLoading}
                className="page-btn"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid #334155',
                  color: (monthlyCurrentPage >= totalMonthlyPages || isAllMonthly) ? '#475569' : '#cbd5e1',
                  cursor: (monthlyCurrentPage >= totalMonthlyPages || isAllMonthly) ? 'not-allowed' : 'pointer',
                  opacity: (monthlyCurrentPage >= totalMonthlyPages || isAllMonthly) ? 0.5 : 1
                }}
                title="Last Page"
              >
                <span>Last</span>
                <ChevronsRight size={13} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Monthly Staff Attendance & Payroll Summary Report View (viewTab === 'monthly_report') ─── */
        <div className="glass-panel" style={{
          borderRadius: '12px',
          border: '1px solid rgba(51, 65, 85, 0.5)',
          overflow: 'hidden',
          background: 'rgba(15, 23, 42, 0.6)',
          position: 'relative'
        }}>
          {/* Shimmer Bar when Loading */}
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #0284c7, #38bdf8, #10b981, #0284c7)',
              backgroundSize: '200% 100%',
              animation: 'shimmerBar 1.2s infinite linear',
              zIndex: 20
            }} />
          )}

          {/* Report Header & Controls */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(30, 41, 59, 0.35)',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} style={{ color: '#38bdf8' }} />
                Monthly Staff Attendance & Payroll Report — {monthNames[monthlyMonth - 1]} {monthlyYear}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.73rem', color: '#94a3b8' }}>
                Staff-wise monthly attendance metrics, total hours logged, payable working days, and attendance health score.
              </p>
            </div>

            {/* Right Controls: Sort & Quick Export */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
              {/* Sort Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#cbd5e1' }}>
                <span style={{ color: '#94a3b8' }}>Sort by:</span>
                <select
                  value={reportSortField}
                  onChange={(e) => setReportSortField(e.target.value)}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    padding: '5px 8px',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                >
                  <option value="attRate">Attendance Health %</option>
                  <option value="totalHours">Shift Hours Logged</option>
                  <option value="payableDays">Payable Days</option>
                  <option value="present">Present Days (P + L)</option>
                  <option value="name">Staff Name</option>
                </select>
                <button
                  type="button"
                  onClick={() => setReportSortAsc(!reportSortAsc)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid #334155',
                    color: '#cbd5e1',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    cursor: 'pointer'
                  }}
                  title="Toggle Ascending / Descending"
                >
                  {reportSortAsc ? '↑ Low to High' : '↓ High to Low'}
                </button>
              </div>

              {/* Export CSV Button */}
              <button
                type="button"
                onClick={exportMonthlyReportToCSV}
                style={{
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '10px 14px', width: '50px', textAlign: 'center' }}>Rank</th>
                  <th style={{ padding: '10px 14px', minWidth: '180px' }}>Staff Member</th>
                  <th style={{ padding: '10px 14px', minWidth: '120px' }}>Branch</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', color: '#4ade80', fontWeight: '700' }} title="Full Present Shifts">P</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', color: '#facc15', fontWeight: '700' }} title="Late Arrival Shifts">L</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', color: '#fb923c', fontWeight: '700' }} title="Half Day Shifts (4.5h credit)">HD</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', color: '#22d3ee', fontWeight: '700' }} title="Approved Short Leaves">SL</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', color: '#f87171', fontWeight: '700' }} title="Absent Days">A</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', color: '#c084fc', fontWeight: '700' }} title="Approved Full Leave Days">LV</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: '700' }}>Shift Hours</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: '#34d399', fontWeight: '700' }}>Payable Days</th>
                  <th style={{ padding: '10px 16px', minWidth: '150px' }}>Attendance Health</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', minWidth: '110px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={`skel-rep-${idx}`} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.2)' }}>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div className="skeleton-pulse" style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(51, 65, 85, 0.5)', margin: '0 auto' }} />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div className="skeleton-pulse" style={{ width: '130px', height: '14px', borderRadius: '4px', background: 'rgba(51, 65, 85, 0.5)' }} />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div className="skeleton-pulse" style={{ width: '90px', height: '14px', borderRadius: '4px', background: 'rgba(51, 65, 85, 0.3)' }} />
                      </td>
                      {Array.from({ length: 8 }).map((__, cIdx) => (
                        <td key={cIdx} style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <div className="skeleton-pulse" style={{ width: '28px', height: '16px', borderRadius: '4px', background: 'rgba(51, 65, 85, 0.3)', margin: '0 auto' }} />
                        </td>
                      ))}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div className="skeleton-pulse" style={{ width: '70px', height: '24px', borderRadius: '6px', background: 'rgba(51, 65, 85, 0.4)', margin: '0 auto' }} />
                      </td>
                    </tr>
                  ))
                ) : paginatedMonthlyReportList.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No staff attendance report data available for this month.
                    </td>
                  </tr>
                ) : (
                  paginatedMonthlyReportList.map((item, index) => {
                    const st = item.staff;
                    const branchObj = branches.find(b => String(b.id) === String(st.branch_id));
                    const totalMarkedDays = item.present + item.late + item.halfDay + item.shortLeave + item.absent + item.leave;
                    const effectivePresent = item.present + item.late + (item.halfDay * 0.5) + (item.shortLeave * 0.85);
                    const attRate = totalMarkedDays > 0 ? Math.round((effectivePresent / totalMarkedDays) * 100) : 0;
                    const payableDays = effectivePresent.toFixed(1);
                    const globalRank = startMonthlyIndex + index + 1;

                    // Health color configuration
                    let rateBadgeBg = 'rgba(239, 68, 68, 0.15)';
                    let rateBorder = 'rgba(239, 68, 68, 0.4)';
                    let rateTextColor = '#f87171';
                    let healthStatus = 'Low';

                    if (attRate >= 90) {
                      rateBadgeBg = 'rgba(34, 197, 94, 0.15)';
                      rateBorder = 'rgba(34, 197, 94, 0.4)';
                      rateTextColor = '#4ade80';
                      healthStatus = 'Excellent';
                    } else if (attRate >= 75) {
                      rateBadgeBg = 'rgba(234, 179, 8, 0.15)';
                      rateBorder = 'rgba(234, 179, 8, 0.4)';
                      rateTextColor = '#facc15';
                      healthStatus = 'Good';
                    }

                    return (
                      <tr
                        key={st.id}
                        style={{
                          borderBottom: '1px solid rgba(51, 65, 85, 0.25)',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Rank */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            background: globalRank === 1 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : globalRank === 2 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : globalRank === 3 ? 'linear-gradient(135deg, #b45309, #78350f)' : 'rgba(30, 41, 59, 0.8)',
                            color: globalRank <= 3 ? '#ffffff' : '#94a3b8',
                            border: globalRank <= 3 ? 'none' : '1px solid #334155'
                          }}>
                            {globalRank <= 3 ? (globalRank === 1 ? '🥇' : globalRank === 2 ? '🥈' : '🥉') : globalRank}
                          </span>
                        </td>

                        {/* Staff Member Info */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #1e293b, #334155)',
                              border: '1px solid rgba(51, 65, 85, 0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              color: '#38bdf8'
                            }}>
                              {(st.name || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.78rem' }}>
                                {st.name}
                              </div>
                              <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '2px' }}>
                                {st.specialization || 'Staff Stylist'} {st.phone ? `• ${st.phone}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Branch */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: '500',
                            background: 'rgba(30, 41, 59, 0.7)',
                            border: '1px solid rgba(51, 65, 85, 0.6)',
                            color: '#cbd5e1'
                          }}>
                            {branchObj?.name || 'Main Salon'}
                          </span>
                        </td>

                        {/* Present (P) */}
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            background: item.present > 0 ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                            color: item.present > 0 ? '#4ade80' : '#475569'
                          }}>
                            {item.present}
                          </span>
                        </td>

                        {/* Late (L) */}
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            background: item.late > 0 ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
                            color: item.late > 0 ? '#facc15' : '#475569'
                          }}>
                            {item.late}
                          </span>
                        </td>

                        {/* Half Day (HD) */}
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            background: item.halfDay > 0 ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                            color: item.halfDay > 0 ? '#fb923c' : '#475569'
                          }}>
                            {item.halfDay}
                          </span>
                        </td>

                        {/* Short Leave (SL) */}
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            background: item.shortLeave > 0 ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                            color: item.shortLeave > 0 ? '#22d3ee' : '#475569'
                          }}>
                            {item.shortLeave}
                          </span>
                        </td>

                        {/* Absent (A) */}
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            background: item.absent > 0 ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                            color: item.absent > 0 ? '#f87171' : '#475569'
                          }}>
                            {item.absent}
                          </span>
                        </td>

                        {/* Leave (LV) */}
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            background: item.leave > 0 ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                            color: item.leave > 0 ? '#c084fc' : '#475569'
                          }}>
                            {item.leave}
                          </span>
                        </td>

                        {/* Total Working Hours & OT */}
                        <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                          <div style={{ fontWeight: '700', color: '#60a5fa', fontSize: '0.78rem' }}>
                            {item.totalHours.toFixed(1)} hrs
                          </div>
                          {(item.totalOvertime || 0) > 0 && (
                            <div style={{ fontSize: '0.64rem', color: '#f59e0b', fontWeight: '600', marginTop: '2px' }}>
                              +{item.totalOvertime.toFixed(1)}h OT
                            </div>
                          )}
                        </td>

                        {/* Payable Days */}
                        <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontWeight: '800',
                            fontSize: '0.82rem',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            color: '#34d399'
                          }}>
                            {payableDays} d
                          </span>
                        </td>

                        {/* Attendance Health % */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '0.64rem',
                              fontWeight: '700',
                              background: rateBadgeBg,
                              border: `1px solid ${rateBorder}`,
                              color: rateTextColor
                            }}>
                              {healthStatus}
                            </span>
                            <span style={{ fontWeight: '800', fontSize: '0.78rem', color: rateTextColor }}>
                              {totalMarkedDays > 0 ? `${attRate}%` : '—'}
                            </span>
                          </div>
                          <div style={{
                            width: '100%',
                            height: '5px',
                            borderRadius: '3px',
                            background: 'rgba(51, 65, 85, 0.5)',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.min(100, attRate)}%`,
                              height: '100%',
                              borderRadius: '3px',
                              background: attRate >= 90 ? 'linear-gradient(90deg, #10b981, #34d399)' : attRate >= 75 ? 'linear-gradient(90deg, #d97706, #facc15)' : 'linear-gradient(90deg, #b91c1c, #f87171)',
                              transition: 'width 0.4s ease'
                            }} />
                          </div>
                        </td>

                        {/* Actions: View Daily Log */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setStaffMonthlyDetailModal({ isOpen: true, staff: st, data: item })}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.4)',
                              color: '#60a5fa',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.7)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                            }}
                            title={`View full daily punch breakdown for ${st.name}`}
                          >
                            <FileText size={12} />
                            <span>Breakdown</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Summary Totals Row */}
              {paginatedMonthlyReportList.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.85)', borderTop: '2px solid #334155', fontWeight: '700', fontSize: '0.75rem' }}>
                    <td colSpan={3} style={{ padding: '12px 16px', color: '#f8fafc' }}>
                      <span style={{ color: '#38bdf8' }}>★ Monthly Totals</span> ({visibleStaffList.length} staff enrolled)
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#4ade80' }}>
                      {monthlyKpiStats.totalPresent}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#facc15' }}>
                      {monthlyKpiStats.totalLate}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#fb923c' }}>
                      {monthlyKpiStats.totalHalfDay}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#22d3ee' }}>
                      {monthlyKpiStats.totalShortLeave}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#f87171' }}>
                      {monthlyKpiStats.totalAbsent}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#c084fc' }}>
                      {monthlyKpiStats.totalLeave}
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'center', color: '#60a5fa' }}>
                      {monthlyKpiStats.totalHours}h
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'center', color: '#34d399' }}>
                      {(monthlyKpiStats.totalPresent + monthlyKpiStats.totalLate + (monthlyKpiStats.totalHalfDay * 0.5) + (monthlyKpiStats.totalShortLeave * 0.85)).toFixed(1)} d
                    </td>
                    <td style={{ padding: '12px 16px', color: '#f59e0b' }}>
                      Avg Health: <strong>{monthlyKpiStats.overallRate}%</strong>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#94a3b8' }}>
                      —
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* ─── Pagination Bar for Monthly Report ─── */}
          <div style={{
            padding: '10px 18px',
            borderTop: '1px solid rgba(51, 65, 85, 0.5)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            background: 'rgba(30, 41, 59, 0.25)'
          }}>
            {/* Left: Page Size Selector & Count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Staff per page:</span>
                <select
                  value={monthlyPageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setMonthlyPageSize(val);
                    setMonthlyCurrentPage(1);
                  }}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={5}>5 staff</option>
                  <option value={10}>10 staff</option>
                  <option value={20}>20 staff</option>
                  <option value={50}>50 staff</option>
                  <option value="all">All ({totalMonthlyCount})</option>
                </select>
              </div>

              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Showing <strong style={{ color: '#f8fafc' }}>{totalMonthlyCount === 0 ? 0 : startMonthlyIndex + 1}</strong> - <strong style={{ color: '#f8fafc' }}>{endMonthlyIndex}</strong> of <strong style={{ color: '#f8fafc' }}>{totalMonthlyCount}</strong> staff members
              </span>
            </div>

            {/* Right: Page Navigation Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <button
                type="button"
                onClick={() => setMonthlyCurrentPage(1)}
                disabled={monthlyCurrentPage === 1 || isAllMonthly || isLoading}
                className="page-btn"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid #334155',
                  color: (monthlyCurrentPage === 1 || isAllMonthly) ? '#475569' : '#cbd5e1',
                  cursor: (monthlyCurrentPage === 1 || isAllMonthly) ? 'not-allowed' : 'pointer',
                  opacity: (monthlyCurrentPage === 1 || isAllMonthly) ? 0.5 : 1
                }}
                title="First Page"
              >
                <ChevronsLeft size={13} />
                <span>First</span>
              </button>

              <button
                type="button"
                onClick={() => setMonthlyCurrentPage(p => Math.max(1, p - 1))}
                disabled={monthlyCurrentPage === 1 || isAllMonthly || isLoading}
                className="page-btn"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid #334155',
                  color: (monthlyCurrentPage === 1 || isAllMonthly) ? '#475569' : '#cbd5e1',
                  cursor: (monthlyCurrentPage === 1 || isAllMonthly) ? 'not-allowed' : 'pointer',
                  opacity: (monthlyCurrentPage === 1 || isAllMonthly) ? 0.5 : 1
                }}
                title="Previous Page"
              >
                <ChevronLeft size={13} />
                <span>Prev</span>
              </button>

              <button
                type="button"
                onClick={() => setMonthlyCurrentPage(p => Math.min(totalMonthlyPages, p + 1))}
                disabled={monthlyCurrentPage >= totalMonthlyPages || isAllMonthly || isLoading}
                className="page-btn"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid #334155',
                  color: (monthlyCurrentPage >= totalMonthlyPages || isAllMonthly) ? '#475569' : '#cbd5e1',
                  cursor: (monthlyCurrentPage >= totalMonthlyPages || isAllMonthly) ? 'not-allowed' : 'pointer',
                  opacity: (monthlyCurrentPage >= totalMonthlyPages || isAllMonthly) ? 0.5 : 1
                }}
                title="Next Page"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>

              <button
                type="button"
                onClick={() => setMonthlyCurrentPage(totalMonthlyPages)}
                disabled={monthlyCurrentPage >= totalMonthlyPages || isAllMonthly || isLoading}
                className="page-btn"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid #334155',
                  color: (monthlyCurrentPage >= totalMonthlyPages || isAllMonthly) ? '#475569' : '#cbd5e1',
                  cursor: (monthlyCurrentPage >= totalMonthlyPages || isAllMonthly) ? 'not-allowed' : 'pointer',
                  opacity: (monthlyCurrentPage >= totalMonthlyPages || isAllMonthly) ? 0.5 : 1
                }}
                title="Last Page"
              >
                <span>Last</span>
                <ChevronsRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: Individual Punch Details & Edit ─── */}
      {editModalStaff && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '480px',
            width: '100%',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: '#3b82f6' }} />
                Edit Attendance: {editModalStaff.name}
              </h3>
              <button
                onClick={() => setEditModalStaff(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '6px', marginBottom: '10px', fontSize: '0.74rem', color: '#94a3b8' }}>
                <Calendar size={14} style={{ color: '#f59e0b' }} />
                <span>Date: <strong style={{ color: '#f8fafc' }}>{selectedDate}</strong></span>
                <span style={{ marginLeft: 'auto' }}>Role: <strong style={{ color: '#f8fafc' }}>{editModalStaff.specialization || 'Staff'}</strong></span>
              </div>

              {/* Branch Shift Info Banner */}
              {(() => {
                const branchObj = branches.find(b => String(b.id) === String(editModalStaff.branch_id));
                const bTiming = getBranchShiftTiming(editModalStaff.branch_id, selectedDate);
                return (
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        Branch: <strong style={{ color: '#f8fafc' }}>{branchObj?.name || 'Main Salon'}</strong>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Clock size={12} /> Shift Schedule: {bTiming.checkIn} - {bTiming.checkOut} ({bTiming.hours} hrs)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditModalStatusChange('Present')}
                      style={{
                        background: 'rgba(59, 130, 246, 0.25)',
                        border: '1px solid #3b82f6',
                        color: '#60a5fa',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.64rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                      title="Sync check-in and check-out to configured branch schedule"
                    >
                      Sync Shift
                    </button>
                  </div>
                );
              })()}

              {/* Status Picker */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Attendance Status
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                  {Object.entries(STATUS_CONFIG).map(([stKey, cfg]) => {
                    const isSel = editFormData.status === stKey;
                    return (
                      <button
                        key={stKey}
                        type="button"
                        onClick={() => handleEditModalStatusChange(stKey)}
                        style={{
                          padding: '7px 4px',
                          borderRadius: '6px',
                          fontSize: '0.66rem',
                          fontWeight: isSel ? '700' : '500',
                          border: isSel ? `1.5px solid ${cfg.color}` : '1px solid #334155',
                          background: isSel ? cfg.bg : 'rgba(30, 41, 59, 0.6)',
                          color: isSel ? cfg.color : '#94a3b8',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <span style={{ fontSize: '0.9rem' }}>{cfg.icon}</span>
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Check-in & Check-out Grid */}
              {editFormData.status !== 'Absent' && editFormData.status !== 'On Leave' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Check-in Time
                    </label>
                    <input
                      type="time"
                      value={editFormData.check_in_time}
                      onChange={(e) => handleEditTimeChange('check_in_time', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '0.76rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Check-out Time
                    </label>
                    <input
                      type="time"
                      value={editFormData.check_out_time}
                      onChange={(e) => handleEditTimeChange('check_out_time', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '0.76rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Working Hours & Overtime */}
              {editFormData.status !== 'Absent' && editFormData.status !== 'On Leave' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Working Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={editFormData.working_hours}
                      onChange={(e) => setEditFormData({ ...editFormData, working_hours: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '0.76rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Overtime Hours (OT)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="12"
                      value={editFormData.overtime_hours}
                      onChange={(e) => setEditFormData({ ...editFormData, overtime_hours: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '0.76rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Remarks / Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Approved leave, late due to weather, extra VIP client shift..."
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '0.74rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditModalStaff(null)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.74rem',
                    borderRadius: '6px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '6px 16px',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    borderRadius: '6px',
                    background: '#3b82f6',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Bulk Mark All Present Confirmation ─── */}
      {showBulkModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '440px',
            width: '100%',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: '#10b981' }} />
                Bulk Attendance Marking
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: '1.4', marginBottom: '14px' }}>
              Are you sure you want to mark attendance for all <strong>{visibleStaffList.length} staff members</strong> for date <strong>{selectedDate}</strong>?
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Attendance Status to Apply
              </label>
              <select
                value={bulkConfig.status}
                onChange={(e) => setBulkConfig({ ...bulkConfig, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '0.76rem',
                  outline: 'none'
                }}
              >
                <option value="Present">🟢 Present</option>
                <option value="Late">🟡 Late (+30m after branch start)</option>
                <option value="Half Day">🟠 Half Day (50% branch shift)</option>
                <option value="Short Leave">⏱️ Short Leave (Branch Shift - 2h)</option>
                <option value="On Leave">🟣 On Leave</option>
                <option value="Absent">🔴 Absent</option>
              </select>
            </div>

            {/* Dynamic Branch Schedule Box */}
            {bulkConfig.status !== 'Absent' && bulkConfig.status !== 'On Leave' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} /> Branch Shift Schedules (Time Slots)
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={bulkConfig.useBranchSchedule}
                        onChange={(e) => setBulkConfig({ ...bulkConfig, useBranchSchedule: e.target.checked })}
                        style={{ cursor: 'pointer' }}
                      />
                      Dynamic Timing
                    </label>
                  </div>

                  {bulkConfig.useBranchSchedule ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.68rem', color: '#94a3b8' }}>
                      {(() => {
                        const uniqueBranchIds = [...new Set(visibleStaffList.map(s => String(s.branch_id || '')))];
                        return uniqueBranchIds.map(bId => {
                          const bObj = branches.find(b => String(b.id) === String(bId));
                          const timing = getBranchShiftTiming(bId, selectedDate);
                          return (
                            <div key={bId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid rgba(51, 65, 85, 0.2)' }}>
                              <span style={{ color: '#f8fafc', fontWeight: '600' }}>{bObj?.name || 'Main Salon'}</span>
                              <span style={{ color: '#f59e0b', fontFamily: 'monospace' }}>
                                {timing.checkIn} - {timing.checkOut} ({timing.hours}h)
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.68rem', color: '#f87171', fontStyle: 'italic', marginTop: '4px' }}>
                      Manual override enabled — will use the custom times specified below instead of branch schedules.
                    </div>
                  )}
                </div>

                {/* Optional Manual Override Inputs */}
                {!bulkConfig.useBranchSchedule && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Manual Punch In
                      </label>
                      <input
                        type="time"
                        value={bulkConfig.custom_check_in}
                        onChange={(e) => setBulkConfig({ ...bulkConfig, custom_check_in: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#f8fafc',
                          fontSize: '0.76rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Manual Punch Out
                      </label>
                      <input
                        type="time"
                        value={bulkConfig.custom_check_out}
                        onChange={(e) => setBulkConfig({ ...bulkConfig, custom_check_out: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#f8fafc',
                          fontSize: '0.76rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.74rem',
                  borderRadius: '6px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkMark}
                style={{
                  padding: '6px 16px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Confirm & Mark All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Dedicated Clock In / Clock Out (Logout) Modal ─── */}
      {clockActionModal.isOpen && clockActionModal.staff && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '440px',
            width: '100%',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '14px',
            padding: '22px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.8)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {clockActionModal.mode === 'clock_out' ? (
                  <>
                    <LogOut size={18} style={{ color: '#f97316' }} />
                    Staff Clock Out / Logout
                  </>
                ) : (
                  <>
                    <LogIn size={18} style={{ color: '#10b981' }} />
                    Staff Clock In
                  </>
                )}
              </h3>
              <button
                onClick={() => setClockActionModal({ isOpen: false, staff: null, mode: 'clock_out', time: '', notes: '' })}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Staff Info Banner */}
            {(() => {
              const staff = clockActionModal.staff;
              const branchObj = branches.find(b => String(b.id) === String(staff.branch_id));
              const bTiming = getBranchShiftTiming(staff.branch_id, selectedDate);
              const liveTime = getNowTimeStr();

              return (
                <div>
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    border: '1px solid rgba(51, 65, 85, 0.4)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: '700', color: '#f8fafc' }}>{staff.name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{staff.specialization || 'Staff'} • {branchObj?.name || 'Main Salon'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.62rem', color: '#f59e0b', fontWeight: '600' }}>Branch Shift</div>
                        <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                          {bTiming.checkIn} - {bTiming.checkOut} ({bTiming.hours}h)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mode-Specific Content */}
                  {clockActionModal.mode === 'clock_out' ? (
                    <div>
                      {/* Punch In Recall Card */}
                      <div style={{
                        background: 'rgba(34, 197, 94, 0.08)',
                        border: '1px solid rgba(34, 197, 94, 0.25)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        marginBottom: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.74rem'
                      }}>
                        <span style={{ color: '#94a3b8' }}>Punch In Time:</span>
                        <span style={{ color: '#4ade80', fontWeight: '700', fontSize: '0.82rem' }}>
                          📥 {clockActionModal.checkInTime || bTiming.checkIn}
                        </span>
                      </div>

                      {/* Logout Time Input */}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                          Logout / Punch Out Time
                        </label>
                        <input
                          type="time"
                          value={clockActionModal.time}
                          onChange={(e) => handleClockModalTimeChange(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: '#1e293b',
                            border: '1px solid #f97316',
                            borderRadius: '6px',
                            color: '#f8fafc',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            outline: 'none'
                          }}
                        />
                        {/* Quick Presets */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleClockModalTimeChange(liveTime)}
                            style={{
                              background: 'rgba(30, 41, 59, 0.8)',
                              border: '1px solid #334155',
                              color: '#60a5fa',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.64rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            ⏱️ Now ({liveTime})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClockModalTimeChange(bTiming.checkOut)}
                            style={{
                              background: 'rgba(30, 41, 59, 0.8)',
                              border: '1px solid #334155',
                              color: '#cbd5e1',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.64rem',
                              cursor: 'pointer'
                            }}
                          >
                            🕒 Shift Close ({bTiming.checkOut})
                          </button>
                        </div>
                      </div>

                      {/* Live Calculated Hours Box */}
                      <div style={{
                        background: 'rgba(249, 115, 22, 0.1)',
                        border: '1px solid rgba(249, 115, 22, 0.35)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        marginBottom: '14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.74rem', color: '#fed7aa', fontWeight: '600' }}>Actual Hours Worked:</span>
                          <span style={{ fontSize: '1.15rem', color: '#fb923c', fontWeight: '800' }}>
                            {clockActionModal.hoursPreview} hrs
                          </span>
                        </div>
                        <div style={{ fontSize: '0.66rem', marginTop: '4px' }}>
                          {clockActionModal.hoursPreview < bTiming.hours ? (
                            <span style={{ color: '#facc15' }}>
                              ⚠️ Left early: {(bTiming.hours - clockActionModal.hoursPreview).toFixed(2)}h less than scheduled {bTiming.hours}h shift
                            </span>
                          ) : clockActionModal.hoursPreview > bTiming.hours ? (
                            <span style={{ color: '#4ade80' }}>
                              🔥 Overtime: +{clockActionModal.overtimePreview}h extra over scheduled {bTiming.hours}h shift
                            </span>
                          ) : (
                            <span style={{ color: '#4ade80' }}>
                              ✅ Exact full scheduled shift completed ({bTiming.hours} hrs)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Notes / Remarks */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          Departure Note / Remarks (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Left early, Completed appointments, Emergency, Overtime VIP..."
                          value={clockActionModal.notes}
                          onChange={(e) => setClockActionModal({ ...clockActionModal, notes: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            color: '#f8fafc',
                            fontSize: '0.74rem',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Clock In Mode */
                    <div>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                          Clock In Time
                        </label>
                        <input
                          type="time"
                          value={clockActionModal.time}
                          onChange={(e) => handleClockModalTimeChange(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: '#1e293b',
                            border: '1px solid #10b981',
                            borderRadius: '6px',
                            color: '#f8fafc',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            outline: 'none'
                          }}
                        />
                        {/* Quick Presets */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleClockModalTimeChange(liveTime)}
                            style={{
                              background: 'rgba(30, 41, 59, 0.8)',
                              border: '1px solid #334155',
                              color: '#60a5fa',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.64rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            ⏱️ Now ({liveTime})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClockModalTimeChange(bTiming.checkIn)}
                            style={{
                              background: 'rgba(30, 41, 59, 0.8)',
                              border: '1px solid #334155',
                              color: '#cbd5e1',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.64rem',
                              cursor: 'pointer'
                            }}
                          >
                            🕒 Shift Start ({bTiming.checkIn})
                          </button>
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        marginBottom: '16px',
                        fontSize: '0.72rem',
                        color: '#94a3b8',
                        lineHeight: '1.4'
                      }}>
                        Staff will be marked as <strong style={{ color: '#4ade80' }}>On Duty</strong>. Total working hours will be calculated when they <strong>Clock Out (Logout)</strong>.
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setClockActionModal({ isOpen: false, staff: null, mode: 'clock_out', time: '', notes: '' })}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.74rem',
                        borderRadius: '6px',
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid #334155',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmClockModal}
                      style={{
                        padding: '7px 18px',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        borderRadius: '6px',
                        background: clockActionModal.mode === 'clock_out'
                          ? 'linear-gradient(135deg, #f97316, #ea580c)'
                          : 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: clockActionModal.mode === 'clock_out'
                          ? '0 4px 12px rgba(249, 115, 22, 0.4)'
                          : '0 4px 12px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      {clockActionModal.mode === 'clock_out' ? (
                        <>
                          <LogOut size={14} />
                          <span>Confirm Logout & Log Hours</span>
                        </>
                      ) : (
                        <>
                          <LogIn size={14} />
                          <span>Confirm Clock In (Start Duty)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {/* ─── MODAL 4: Dedicated Approved Short Leave / Permission Modal ─── */}
      {shortLeaveModal.isOpen && shortLeaveModal.staff && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '460px',
            width: '100%',
            background: '#0f172a',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            borderRadius: '14px',
            padding: '22px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.8), 0 0 20px rgba(6, 182, 212, 0.15)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: '#22d3ee' }} />
                <span>Grant Approved Short Leave / Permission</span>
              </h3>
              <button
                onClick={() => setShortLeaveModal({ isOpen: false, staff: null, durationHours: 2.0, leaveType: 'Mid-Day Permission', reason: 'Personal Work', notes: '' })}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Staff Info Banner */}
            {(() => {
              const staff = shortLeaveModal.staff;
              const branchObj = branches.find(b => String(b.id) === String(staff.branch_id));
              const bTiming = getBranchShiftTiming(staff.branch_id, selectedDate);
              const duration = parseFloat(shortLeaveModal.durationHours) || 2.0;
              const netHours = Math.max(0, parseFloat((bTiming.hours - duration).toFixed(2)));

              const quickReasons = ['Doctor Appointment', 'Family Urgent', 'Bank / Official', 'Emergency Task', 'Commute Issue'];

              return (
                <div>
                  <div style={{
                    background: 'rgba(6, 182, 212, 0.08)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: '#ffffff'
                      }}>
                        {(staff.name || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#f8fafc' }}>{staff.name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                          {staff.specialization || 'Staff'} • {branchObj?.name || 'Main Salon'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.62rem', color: '#f59e0b', fontWeight: '600' }}>Scheduled Shift</div>
                      <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                        {bTiming.checkIn} - {bTiming.checkOut} ({bTiming.hours}h)
                      </div>
                    </div>
                  </div>

                  {/* Duration Picker */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8' }}>
                        Short Leave Duration (Hours)
                      </label>
                      <span style={{ fontSize: '0.72rem', color: '#22d3ee', fontWeight: '700' }}>
                        {duration} Hours
                      </span>
                    </div>

                    {/* Quick Duration Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
                      {[1.0, 1.5, 2.0, 3.0].map(hrs => {
                        const isSel = duration === hrs;
                        return (
                          <button
                            key={hrs}
                            type="button"
                            onClick={() => setShortLeaveModal(prev => ({ ...prev, durationHours: hrs }))}
                            style={{
                              padding: '6px 4px',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: isSel ? '700' : '500',
                              border: isSel ? '1.5px solid #06b6d4' : '1px solid #334155',
                              background: isSel ? 'rgba(6, 182, 212, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                              color: isSel ? '#22d3ee' : '#cbd5e1',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {hrs} {hrs === 1.0 ? 'Hour' : 'Hours'}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.5"
                        value={duration}
                        onChange={(e) => setShortLeaveModal(prev => ({ ...prev, durationHours: parseFloat(e.target.value) }))}
                        style={{ flex: 1, accentColor: '#06b6d4', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', minWidth: '40px', textAlign: 'right' }}>
                        {duration}h
                      </span>
                    </div>
                  </div>

                  {/* Leave Type / Category */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Permission Category / Leave Type
                    </label>
                    <select
                      value={shortLeaveModal.leaveType}
                      onChange={(e) => setShortLeaveModal(prev => ({ ...prev, leaveType: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '0.76rem',
                        outline: 'none'
                      }}
                    >
                      <option value="Mid-Day Permission">Mid-Day Permission (Staff will return to salon)</option>
                      <option value="Early Departure">Early Departure (Leaving early with approval)</option>
                      <option value="Late Arrival Approved">Late Arrival Approved (Approved delayed arrival)</option>
                      <option value="Medical / Doctor Visit">Medical / Doctor Visit</option>
                      <option value="Salon Official Duty">Salon Official / Bank Duty</option>
                      <option value="Personal Emergency">Personal Emergency</option>
                    </select>
                  </div>

                  {/* Reason & Quick Chips */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Reason / Purpose
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Doctor appointment, bank work, family emergency..."
                      value={shortLeaveModal.reason}
                      onChange={(e) => setShortLeaveModal(prev => ({ ...prev, reason: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '0.76rem',
                        outline: 'none',
                        marginBottom: '6px'
                      }}
                    />
                    {/* Quick reason suggestions */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {quickReasons.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setShortLeaveModal(prev => ({ ...prev, reason: r }))}
                          style={{
                            background: shortLeaveModal.reason === r ? 'rgba(6, 182, 212, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                            border: shortLeaveModal.reason === r ? '1px solid #06b6d4' : '1px solid #334155',
                            color: shortLeaveModal.reason === r ? '#22d3ee' : '#94a3b8',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '0.62rem',
                            cursor: 'pointer'
                          }}
                        >
                          + {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes (Optional) */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Additional Remarks / Admin Note (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Approved by Branch Manager, covered afternoon slots..."
                      value={shortLeaveModal.notes}
                      onChange={(e) => setShortLeaveModal(prev => ({ ...prev, notes: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '0.74rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Net Shift Hours Credited Box */}
                  <div style={{
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.35)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.74rem', color: '#a5f3fc', fontWeight: '600' }}>Net Credited Shift Hours:</span>
                      <span style={{ fontSize: '1.15rem', color: '#22d3ee', fontWeight: '800' }}>
                        {netHours} hrs
                      </span>
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '4px' }}>
                      Scheduled: <strong style={{ color: '#f8fafc' }}>{bTiming.hours}h</strong> • Short Leave: <strong style={{ color: '#22d3ee' }}>-{duration}h</strong> • Staff is <span style={{ color: '#4ade80', fontWeight: '600' }}>NOT marked Absent</span>.
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShortLeaveModal({ isOpen: false, staff: null, durationHours: 2.0, leaveType: 'Mid-Day Permission', reason: 'Personal Work', notes: '' })}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.74rem',
                        borderRadius: '6px',
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid #334155',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmShortLeave}
                      style={{
                        padding: '7px 18px',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                        border: 'none',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)'
                      }}
                    >
                      <Clock size={14} />
                      <span>Approve & Grant Short Leave ({netHours}h)</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ─── MODAL 5: Individual Staff Monthly Attendance & Punch Breakdown Modal ─── */}
      {staffMonthlyDetailModal.isOpen && staffMonthlyDetailModal.staff && (() => {
        const staff = staffMonthlyDetailModal.staff;
        const data = staffMonthlyDetailModal.data;
        const branchObj = branches.find(b => String(b.id) === String(staff.branch_id));
        const totalMarkedDays = (data?.present || 0) + (data?.late || 0) + (data?.halfDay || 0) + (data?.shortLeave || 0) + (data?.absent || 0) + (data?.leave || 0);
        const effectivePresent = (data?.present || 0) + (data?.late || 0) + ((data?.halfDay || 0) * 0.5) + ((data?.shortLeave || 0) * 0.85);
        const attRate = totalMarkedDays > 0 ? Math.round((effectivePresent / totalMarkedDays) * 100) : 0;
        const payableDays = effectivePresent.toFixed(1);

        return (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}>
            <div className="glass-panel" style={{
              maxWidth: '880px',
              width: '100%',
              maxHeight: '90vh',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '14px',
              padding: '22px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    color: '#ffffff'
                  }}>
                    {(staff.name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {staff.name}
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                        {monthNames[monthlyMonth - 1]} {monthlyYear}
                      </span>
                    </h3>
                    <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '2px' }}>
                      {staff.specialization || 'Staff Stylist'} • {branchObj?.name || 'Main Salon'} {staff.phone ? `• ${staff.phone}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStaffMonthlyDetailModal({ isOpen: false, staff: null, data: null })}
                  style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Monthly Stats Quick Ribbon */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(85px, 1fr))',
                gap: '8px',
                marginBottom: '16px',
                background: 'rgba(30, 41, 59, 0.4)',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(51, 65, 85, 0.4)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.66rem', color: '#4ade80', fontWeight: '600' }}>Present</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#4ade80' }}>{data?.present || 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.66rem', color: '#facc15', fontWeight: '600' }}>Late</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#facc15' }}>{data?.late || 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.66rem', color: '#fb923c', fontWeight: '600' }}>Half Day</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fb923c' }}>{data?.halfDay || 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.66rem', color: '#22d3ee', fontWeight: '600' }}>Short Leave</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#22d3ee' }}>{data?.shortLeave || 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.66rem', color: '#f87171', fontWeight: '600' }}>Absent</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#f87171' }}>{data?.absent || 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.66rem', color: '#c084fc', fontWeight: '600' }}>Leave</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#c084fc' }}>{data?.leave || 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.66rem', color: '#60a5fa', fontWeight: '600' }}>Total Hours</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#60a5fa' }}>{(data?.totalHours || 0).toFixed(1)}h</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.66rem', color: '#34d399', fontWeight: '600' }}>Payable Days</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#34d399' }}>{payableDays} d</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.66rem', color: attRate >= 90 ? '#4ade80' : attRate >= 75 ? '#facc15' : '#f87171', fontWeight: '600' }}>Health Score</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: attRate >= 90 ? '#4ade80' : attRate >= 75 ? '#facc15' : '#f87171' }}>{attRate}%</div>
                </div>
              </div>

              {/* Day-by-Day Table List */}
              <div style={{ overflowY: 'auto', flex: 1, border: '1px solid rgba(51, 65, 85, 0.4)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.74rem' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                    <tr style={{ background: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                      <th style={{ padding: '9px 12px', width: '130px' }}>Date & Day</th>
                      <th style={{ padding: '9px 12px', width: '110px' }}>Status</th>
                      <th style={{ padding: '9px 12px' }}>Punch In</th>
                      <th style={{ padding: '9px 12px' }}>Punch Out</th>
                      <th style={{ padding: '9px 12px', textAlign: 'center' }}>Logged Hours</th>
                      <th style={{ padding: '9px 12px', textAlign: 'center' }}>Overtime (OT)</th>
                      <th style={{ padding: '9px 12px' }}>Remarks / Leave Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const rec = data?.days ? data.days[day] : null;
                      const dateObj = new Date(monthlyYear, monthlyMonth - 1, day);
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      const isSunday = dayName === 'Sun';
                      const status = rec?.status;
                      const statusCfg = status ? STATUS_CONFIG[status] : null;

                      return (
                        <tr
                          key={day}
                          style={{
                            borderBottom: '1px solid rgba(51, 65, 85, 0.15)',
                            background: isSunday ? 'rgba(30, 41, 59, 0.25)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '8px 12px', fontWeight: '600', color: isSunday ? '#f59e0b' : '#f8fafc' }}>
                            {monthNames[monthlyMonth - 1].slice(0, 3)} {day}, {monthlyYear} <span style={{ fontSize: '0.66rem', color: isSunday ? '#f59e0b' : '#94a3b8', marginLeft: '3px' }}>({dayName})</span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            {statusCfg ? (
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: '700',
                                background: statusCfg.bg,
                                border: `1px solid ${statusCfg.border}`,
                                color: statusCfg.color,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span>{statusCfg.icon}</span>
                                <span>{statusCfg.label}</span>
                              </span>
                            ) : (
                              <span style={{ color: '#475569', fontSize: '0.7rem' }}>— Unmarked</span>
                            )}
                          </td>
                          <td style={{ padding: '8px 12px', color: rec?.check_in_time ? '#f8fafc' : '#475569', fontFamily: rec?.check_in_time ? 'monospace' : 'inherit' }}>
                            {rec?.check_in_time || '—'}
                          </td>
                          <td style={{ padding: '8px 12px', color: rec?.check_out_time ? '#f8fafc' : '#475569', fontFamily: rec?.check_out_time ? 'monospace' : 'inherit' }}>
                            {rec?.check_out_time || '—'}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', color: (Number(rec?.working_hours) || 0) > 0 ? '#60a5fa' : '#475569', fontWeight: '600' }}>
                            {rec?.working_hours ? `${rec.working_hours}h` : '—'}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', color: (Number(rec?.overtime_hours) || 0) > 0 ? '#f59e0b' : '#475569', fontWeight: '600' }}>
                            {(Number(rec?.overtime_hours) || 0) > 0 ? `+${rec.overtime_hours}h` : '—'}
                          </td>
                          <td style={{ padding: '8px 12px', color: rec?.notes ? '#cbd5e1' : '#475569', fontSize: '0.7rem' }}>
                            {rec?.notes || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #334155' }}>
                <button
                  type="button"
                  onClick={() => setStaffMonthlyDetailModal({ isOpen: false, staff: null, data: null })}
                  style={{
                    padding: '7px 20px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default StaffAttendanceView;
