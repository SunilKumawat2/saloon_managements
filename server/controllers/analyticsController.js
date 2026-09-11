import Analytics from '../models/Analytics.js';

export const getRevenueAnalytics = async (req, res) => {
  try {
    const data = await Analytics.getRevenueAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getStaffPerformance = async (req, res) => {
  try {
    const data = await Analytics.getStaffPerformance();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getInventoryMargins = async (req, res) => {
  try {
    const data = await Analytics.getInventoryMargin();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCustomerRetention = async (req, res) => {
  try {
    const data = await Analytics.getCustomerRetention();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPopularityAndPeakHours = async (req, res) => {
  try {
    const data = await Analytics.getPopularityAndPeakHours();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
