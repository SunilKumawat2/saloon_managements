import { PaymentModel } from '../models/Payment.js';
import { GatewayFactory } from '../services/paymentGateways/GatewayFactory.js';
import { pool } from '../config/db.js';

// Resolve Admin ID from user context or branch
const resolveAdminId = async (user, branchId) => {
  // 1. If branchId is specified, check which admin owns this branch
  if (branchId && branchId !== 'all') {
    try {
      const { rows } = await pool.query('SELECT admin_id, created_by_user_id FROM branches WHERE id = $1', [parseInt(branchId)]);
      if (rows.length > 0) {
        const bAdmin = rows[0].admin_id || rows[0].created_by_user_id;
        if (bAdmin) return parseInt(bAdmin);
      }
    } catch (e) {
      console.error('resolveAdminId branch lookup error:', e.message);
    }
  }

  // 2. Otherwise resolve from authenticated user context
  if (user) {
    if (user.admin_id) return parseInt(user.admin_id);
    if (user.id) return parseInt(user.id);
  }

  return 1;
};

export const getGatewaySettings = async (req, res) => {
  try {
    const branchId = req.query.branch_id || req.user?.branch_id || null;
    const adminId = await resolveAdminId(req.user, branchId);
    const gatewayName = req.query.gateway_name || 'razorpay';

    const settings = await PaymentModel.getGatewaySettings({
      adminId,
      branchId,
      gatewayName
    });

    const supportedGateways = GatewayFactory.getSupportedGateways();

    res.json({
      success: true,
      data: settings,
      supported_gateways: supportedGateways
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAdminGatewayList = async (req, res) => {
  try {
    const adminId = await resolveAdminId(req.user);
    const list = await PaymentModel.getAdminGatewayList(adminId);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateGatewaySettings = async (req, res) => {
  try {
    const {
      branch_id,
      gateway_name = 'razorpay',
      key_id,
      key_secret,
      mode = 'test',
      is_enabled = true,
      currency = 'INR',
      additional_config = {}
    } = req.body;

    if (!key_id || String(key_id).trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Merchant Key ID is required.' });
    }

    const adminId = await resolveAdminId(req.user, branch_id);

    const updated = await PaymentModel.updateGatewaySettings({
      adminId,
      branchId: branch_id || null,
      gateway_name,
      key_id: String(key_id).trim(),
      key_secret: key_secret ? String(key_secret).trim() : '',
      mode,
      is_enabled: Boolean(is_enabled),
      currency,
      additional_config
    });

    res.json({
      success: true,
      message: `${gateway_name.toUpperCase()} Payment Gateway configured successfully!`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { amount, receipt, notes, branch_id, gateway_name = 'razorpay' } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid bill amount is required.' });
    }

    const effectiveBranchId = branch_id || req.user?.branch_id || null;
    const adminId = await resolveAdminId(req.user, effectiveBranchId);

    const order = await PaymentModel.createOrder({
      adminId,
      branchId: effectiveBranchId,
      gatewayName: gateway_name,
      amount,
      receipt,
      notes
    });

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { branch_id, gateway_name = 'razorpay', ...payload } = req.body;
    const effectiveBranchId = branch_id || req.user?.branch_id || null;
    const adminId = await resolveAdminId(req.user, effectiveBranchId);

    const result = await PaymentModel.verifySignature({
      adminId,
      branchId: effectiveBranchId,
      gatewayName: gateway_name,
      payload
    });

    if (result.verified) {
      res.json({ success: true, message: 'Payment Signature Verified Successfully!', data: result });
    } else {
      res.status(400).json({ success: false, message: result.reason || 'Payment verification failed.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
