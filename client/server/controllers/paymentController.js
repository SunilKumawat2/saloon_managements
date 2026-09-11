import { PaymentModel } from '../models/Payment.js';

export const getGatewaySettings = async (req, res) => {
  try {
    const settings = await PaymentModel.getGatewaySettings('razorpay');
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateGatewaySettings = async (req, res) => {
  try {
    const { key_id, key_secret, mode, is_enabled } = req.body;
    if (!key_id || !key_secret) {
      return res.status(400).json({ success: false, message: 'Razorpay Key ID and Secret Key are required.' });
    }
    const updated = await PaymentModel.updateGatewaySettings({ key_id, key_secret, mode, is_enabled });
    res.json({ success: true, message: 'Razorpay Payment Gateway Settings Updated!', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { amount, receipt } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid bill amount is required.' });
    }
    const order = await PaymentModel.createRazorpayOrder(amount, receipt);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const result = await PaymentModel.verifySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (result.verified) {
      res.json({ success: true, message: 'Razorpay Payment Signature Verified!', data: result });
    } else {
      res.status(400).json({ success: false, message: result.reason || 'Payment verification failed.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
