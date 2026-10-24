import Membership from '../models/Membership.js';
import Loyalty from '../models/Loyalty.js';
import { pool } from '../config/db.js';

const getScope = (req) => {
  const queryAdmin = req.query.admin_id || req.body.admin_id;
  const queryBranch = req.query.branch_id || req.body.branch_id;

  let admin_id = queryAdmin && queryAdmin !== 'all' && queryAdmin !== 'ALL' ? parseInt(queryAdmin) : null;
  let branch_id = queryBranch && queryBranch !== 'all' && queryBranch !== 'ALL' ? parseInt(queryBranch) : null;

  if (!admin_id && req.user) {
    const isSuper = req.user.is_super_admin || String(req.user.role || '').toLowerCase().includes('super');
    if (!isSuper) {
      admin_id = req.user.admin_id || req.user.id;
    }
  }

  if (!branch_id && req.user && !req.user.is_super_admin && req.user.branch_id) {
    branch_id = req.user.branch_id;
  }

  return { admin_id, branch_id };
};

export const getMembershipTiers = async (req, res) => {
  try {
    const scope = getScope(req);
    const tiers = await Membership.getAllTiers(scope);
    res.json({ success: true, tiers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createMembershipTier = async (req, res) => {
  try {
    const scope = getScope(req);
    const payload = {
      ...req.body,
      admin_id: scope.admin_id || (req.user ? (req.user.admin_id || req.user.id) : null),
      branch_id: scope.branch_id || req.body.branch_id,
      created_by_admin_id: req.user ? req.user.id : null
    };
    const tier = await Membership.createTier(payload);
    res.json({ success: true, tier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateMembershipTier = async (req, res) => {
  try {
    const { id } = req.params;
    const scope = getScope(req);
    const payload = {
      ...req.body,
      admin_id: scope.admin_id,
      branch_id: scope.branch_id || req.body.branch_id
    };
    const tier = await Membership.updateTier(id, payload);
    res.json({ success: true, tier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteMembershipTier = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Membership.deleteTier(id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEnrolledMembers = async (req, res) => {
  try {
    const scope = getScope(req);
    const members = await Membership.getEnrolledMembers(scope);
    res.json({ success: true, members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const enrollCustomer = async (req, res) => {
  try {
    const scope = getScope(req);
    const payload = {
      ...req.body,
      admin_id: scope.admin_id || (req.user ? (req.user.admin_id || req.user.id) : null),
      branch_id: scope.branch_id || req.body.branch_id
    };
    const enrollment = await Membership.enrollCustomer(payload);
    res.json({ success: true, enrollment, message: 'Customer enrolled in membership plan successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCustomerLoyaltyProfile = async (req, res) => {
  try {
    const { customerId } = req.params;
    const scope = getScope(req);
    const activeMembership = await Membership.getCustomerActiveMembership(customerId);
    const transactions = await Loyalty.getTransactions({ customerId, ...scope });
    const custRes = await pool.query(`SELECT id, name, phone, loyalty_points, referral_code, branch_id FROM customers WHERE id = $1`, [customerId]);

    res.json({
      success: true,
      customer: custRes.rows[0] || null,
      activeMembership,
      transactions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getLoyaltyLedger = async (req, res) => {
  try {
    const scope = getScope(req);
    const ledger = await Loyalty.getTransactions(scope);
    res.json({ success: true, ledger });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getReferralList = async (req, res) => {
  try {
    const scope = getScope(req);
    const referrals = await Loyalty.getReferrals(scope);
    res.json({ success: true, referrals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const applyReferralCode = async (req, res) => {
  try {
    const scope = getScope(req);
    const { referral_code, referred_customer_id } = req.body;
    const referral = await Loyalty.applyReferralCode({
      referral_code,
      referred_customer_id,
      admin_id: scope.admin_id || (req.user ? (req.user.admin_id || req.user.id) : null),
      branch_id: scope.branch_id || req.body.branch_id
    });
    res.json({ success: true, referral, message: 'Referral code applied successfully! Bonus points credited.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const redeemCustomerCredit = async (req, res) => {
  try {
    const scope = getScope(req);
    const payload = {
      ...req.body,
      admin_id: scope.admin_id || (req.user ? (req.user.admin_id || req.user.id) : null),
      branch_id: scope.branch_id || req.body.branch_id
    };
    const updatedEnrollment = await Membership.redeemMemberCredit(payload);
    res.json({
      success: true,
      enrollment: updatedEnrollment,
      message: `Successfully redeemed ₹${req.body.amount} subscription credit!`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateCustomerEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const scope = getScope(req);
    const updated = await Membership.updateEnrollment(id, { ...req.body, admin_id: scope.admin_id, branch_id: scope.branch_id });
    res.json({ success: true, enrollment: updated, message: 'Enrolled subscription updated successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteCustomerEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    await Membership.deleteEnrollment(id);
    res.json({ success: true, message: 'Enrolled subscription deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const reactivateCustomerEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const reactivated = await Membership.reactivateEnrollment(id);
    res.json({ success: true, enrollment: reactivated, message: 'Subscription reactivated & wallet credit restored successfully!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
