import Bill from '../models/Bill.js';

// GET /api/v1/billing — All bills
export const getBills = async (req, res) => {
  try {
    const bills = await Bill.getAll();
    res.json({ success: true, data: bills });
  } catch (err) {
    console.error('getBills error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch bills.' });
  }
};

// GET /api/v1/billing/:id — Single bill with items
export const getBillById = async (req, res) => {
  try {
    const bill = await Bill.getById(parseInt(req.params.id));
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });
    res.json({ success: true, data: bill });
  } catch (err) {
    console.error('getBillById error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch bill.' });
  }
};

// POST /api/v1/billing/create — Create new bill
export const createBill = async (req, res) => {
  try {
    const {
      branch_id, customer_id, stylist_id, items, payment_mode,
      discount_code, discount_amount, tax_rate, tip_amount,
      commission_amount, split_details, notes
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one service item is required.' });
    }
    const bill = await Bill.create({
      branch_id, customer_id, stylist_id, items, payment_mode,
      discount_code, discount_amount, tax_rate, tip_amount,
      commission_amount, split_details, notes
    });
    res.status(201).json({ success: true, data: bill, message: 'Bill created successfully!' });
  } catch (err) {
    console.error('createBill error:', err);
    res.status(500).json({ success: false, message: 'Failed to create bill.' });
  }
};
