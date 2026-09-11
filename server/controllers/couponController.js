import Coupon from '../models/Coupon.js';

// GET /api/v1/coupons — Get all active discount coupons
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.getAllActive();
    res.json({ success: true, data: coupons });
  } catch (err) {
    console.error('getCoupons error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch coupons.' });
  }
};

// POST /api/v1/coupons/validate — Validate coupon code against subtotal
export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal = 0 } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const coupon = await Coupon.getByCode(code);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    const subtotalNum = parseFloat(subtotal) || 0;
    const minBill = parseFloat(coupon.min_bill_amount) || 0;

    if (subtotalNum < minBill) {
      return res.status(400).json({
        success: false,
        message: `Coupon '${coupon.code}' requires a minimum bill amount of ₹${minBill}.`
      });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (subtotalNum * parseFloat(coupon.discount_value)) / 100;
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, parseFloat(coupon.max_discount_amount));
      }
    } else if (coupon.discount_type === 'fixed') {
      discountAmount = parseFloat(coupon.discount_value);
    }

    discountAmount = Math.min(discountAmount, subtotalNum);

    res.json({
      success: true,
      data: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: parseFloat(coupon.discount_value),
        discount_amount: parseFloat(discountAmount.toFixed(2)),
      },
      message: `Coupon '${coupon.code}' applied successfully!`
    });
  } catch (err) {
    console.error('validateCoupon error:', err);
    res.status(500).json({ success: false, message: 'Failed to validate coupon.' });
  }
};
