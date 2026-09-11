import Membership from '../models/Membership.js';
import Loyalty from '../models/Loyalty.js';
import { pool } from '../config/db.js';

export const getMembershipTiers = async (req, res) => {
  try {
    const tiers = await Membership.getAllTiers();
    res.json({ success: true, tiers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createMembershipTier = async (req, res) => {
  try {
    const tier = await Membership.createTier(req.body);
    res.json({ success: true, tier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateMembershipTier = async (req, res) => {
  try {
    const { id } = req.params;
    const tier = await Membership.updateTier(id, req.body);
    res.json({ success: true, tier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEnrolledMembers = async (req, res) => {
  try {
    const members = await Membership.getEnrolledMembers();
    res.json({ success: true, members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const enrollCustomer = async (req, res) => {
  try {
    const enrollment = await Membership.enrollCustomer(req.body);
    res.json({ success: true, enrollment, message: 'Customer enrolled in membership plan successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCustomerLoyaltyProfile = async (req, res) => {
  try {
    const { customerId } = req.params;
    const activeMembership = await Membership.getCustomerActiveMembership(customerId);
    const transactions = await Loyalty.getTransactions(customerId);
    const custRes = await pool.query(`SELECT id, name, phone, loyalty_points, referral_code FROM customers WHERE id = $1`, [customerId]);

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
    const ledger = await Loyalty.getTransactions();
    res.json({ success: true, ledger });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getReferralList = async (req, res) => {
  try {
    const referrals = await Loyalty.getReferrals();
    res.json({ success: true, referrals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const applyReferralCode = async (req, res) => {
  try {
    const { referral_code, referred_customer_id } = req.body;
    const referral = await Loyalty.applyReferralCode({ referral_code, referred_customer_id });
    res.json({ success: true, referral, message: 'Referral code applied successfully! Bonus points credited.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
