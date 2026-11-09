import { StaffAttendanceModel } from '../models/StaffAttendance.js';

export const getDailyAttendance = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const date = req.query.date || req.query.attendance_date || todayStr;
    const branch_id = req.query.branch_id || req.query.branchId || null;
    const admin_id = req.user?.admin_id || req.user?.id || null;
    const page = parseInt(req.query.page) || 1;
    const limit = (req.query.limit === 'all' || req.query.limit === '0') ? 0 : (parseInt(req.query.limit) || 0);
    const search = req.query.search || '';
    const status = req.query.status || 'ALL';

    const result = await StaffAttendanceModel.getByDate({
      date,
      branch_id,
      admin_id,
      page,
      limit,
      search,
      status
    });

    const records = Array.isArray(result) ? result : (result.records || []);
    const pagination = result.pagination || {
      total: records.length,
      page,
      limit,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    };

    return res.json({
      status: 'success',
      date,
      count: records.length,
      pagination,
      data: records
    });
  } catch (error) {
    console.error('getDailyAttendance error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const recordAttendance = async (req, res) => {
  try {
    const {
      staff_id,
      staff_name,
      role,
      branch_id,
      attendance_date,
      status,
      check_in_time,
      check_out_time,
      working_hours,
      overtime_hours,
      notes
    } = req.body;

    if (!staff_id) {
      return res.status(400).json({ status: 'error', message: 'staff_id is required' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = attendance_date || todayStr;
    const admin_id = req.user?.admin_id || req.user?.id || null;
    const marked_by = req.user?.id || null;

    // Ensure empty strings or null checkout times are treated as null (NOT hardcoded 18:30)
    const formattedIn = (check_in_time !== undefined && check_in_time !== null && String(check_in_time).trim() !== '')
      ? String(check_in_time).trim()
      : null;
    const formattedOut = (check_out_time !== undefined && check_out_time !== null && String(check_out_time).trim() !== '')
      ? String(check_out_time).trim()
      : null;

    const record = await StaffAttendanceModel.mark({
      staff_id,
      staff_name,
      role,
      branch_id,
      admin_id,
      attendance_date: targetDate,
      status: status || 'Present',
      check_in_time: formattedIn,
      check_out_time: formattedOut,
      working_hours: formattedOut ? working_hours : 0.0,
      overtime_hours: formattedOut ? overtime_hours : 0.0,
      notes,
      marked_by
    });

    return res.status(200).json({
      status: 'success',
      message: `Attendance marked as ${status || 'Present'} for ${staff_name || 'staff'}`,
      data: record
    });
  } catch (error) {
    console.error('recordAttendance error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const recordBulkAttendance = async (req, res) => {
  try {
    const {
      staffList,
      attendance_date,
      status = 'Present',
      check_in_time = '09:30',
      check_out_time = '18:30',
      branch_id
    } = req.body;

    if (!Array.isArray(staffList) || staffList.length === 0) {
      return res.status(400).json({ status: 'error', message: 'staffList array is required' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = attendance_date || todayStr;
    const admin_id = req.user?.admin_id || req.user?.id || null;
    const marked_by = req.user?.id || null;

    const results = await StaffAttendanceModel.bulkMark({
      staffList,
      attendance_date: targetDate,
      status,
      check_in_time,
      check_out_time,
      branch_id,
      admin_id,
      marked_by
    });

    return res.status(200).json({
      status: 'success',
      message: `Successfully marked ${results.length} staff members as ${status}`,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('recordBulkAttendance error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getMonthlyReport = async (req, res) => {
  try {
    const now = new Date();
    const month = req.query.month || (now.getMonth() + 1);
    const year = req.query.year || now.getFullYear();
    const branch_id = req.query.branch_id || req.query.branchId || null;
    const admin_id = req.user?.admin_id || req.user?.id || null;

    const data = await StaffAttendanceModel.getMonthlySummary({
      month: parseInt(month),
      year: parseInt(year),
      branch_id,
      admin_id
    });

    return res.json({
      status: 'success',
      month: parseInt(month),
      year: parseInt(year),
      count: data.length,
      data
    });
  } catch (error) {
    console.error('getMonthlyReport error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteAttendanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await StaffAttendanceModel.delete(id);
    return res.json({
      status: 'success',
      message: 'Attendance record deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('deleteAttendanceRecord error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
