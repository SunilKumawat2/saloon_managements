import { StylistModel } from '../models/Stylist.js';

// GET /api/stylists
export const getStylists = async (req, res) => {
  try {
    const branch_id = req.query.branch_id || null;
    const stylists = await StylistModel.findAll({ branch_id });
    return res.json({ status: 'success', data: stylists });
  } catch (err) {
    return res.json({ status: 'success', data: [] });
  }
};

// POST /api/stylists/create
export const createStylist = async (req, res) => {
  try {
    const { name, phone, email, specialization, branch_id, rating } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Stylist name is required' });
    }
    const created = await StylistModel.create({ name: name.trim(), phone, email, specialization, branch_id, rating });
    return res.status(201).json({ status: 'success', message: 'Stylist added successfully', data: created });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to create stylist' });
  }
};

// PUT /api/stylists/:id
export const updateStylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, specialization, branch_id, is_active, rating } = req.body;
    const updated = await StylistModel.update(id, { name, phone, email, specialization, branch_id, is_active, rating });
    return res.json({ status: 'success', message: 'Stylist updated successfully', data: updated });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to update stylist' });
  }
};

// DELETE /api/stylists/:id
export const deleteStylist = async (req, res) => {
  try {
    const { id } = req.params;
    await StylistModel.delete(id);
    return res.json({ status: 'success', message: 'Stylist deleted successfully' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to delete stylist' });
  }
};

// PATCH /api/stylists/:id/toggle
export const toggleStylistActive = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await StylistModel.toggleActive(id);
    return res.json({ status: 'success', message: 'Stylist status toggled', data: result });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
