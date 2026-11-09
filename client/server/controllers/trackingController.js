import { TrackingModel } from '../models/TrackingModel.js';

// GET /api/tracking/staff?timeframe=day|week|month|all
export const getStaffTracking = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'month';
    const startDate = req.query.startDate || req.query.start_date || null;
    const endDate = req.query.endDate || req.query.end_date || null;
    const branchId = req.query.branch_id || null;

    const data = await TrackingModel.getStaffMetrics({ timeframe, startDate, endDate, branchId });
    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('getStaffTracking error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// GET /api/tracking/customer?search=name_or_phone
export const getCustomerTracking = async (req, res) => {
  try {
    const search = req.query.search || req.query.query || '';
    const data = await TrackingModel.getCustomerTracking(search);
    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('getCustomerTracking error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
