import { TimeSlotModel } from '../models/TimeSlot.js';

// GET /api/time-slots
export const getTimeSlots = async (req, res) => {
  try {
    const branch_id = req.query.branch_id || null;
    const day_of_week = req.query.day_of_week || null;
    const specific_date = req.query.specific_date || null;
    const slots = await TimeSlotModel.findAll({ branch_id, day_of_week, specific_date });
    return res.json({ status: 'success', data: slots });
  } catch (err) {
    return res.json({ status: 'success', data: [] });
  }
};

// POST /api/time-slots/create
export const createTimeSlot = async (req, res) => {
  try {
    const { branch_id, start_time, end_time, duration_minutes, slot_time, slot_name, day_of_week, specific_date, is_active } = req.body;
    if ((!slot_time || !slot_time.trim()) && (!start_time || !start_time.trim())) {
      return res.status(400).json({ status: 'error', message: 'Start time (e.g. 09:30) is required' });
    }

    const curAdminId = req.user ? String(req.user.admin_id || req.user.id) : null;
    const created = await TimeSlotModel.create({
      branch_id,
      start_time,
      end_time,
      duration_minutes,
      slot_time: start_time || slot_time,
      slot_name,
      day_of_week: day_of_week || 'ALL',
      specific_date: specific_date || null,
      is_active: is_active !== false,
      admin_id: curAdminId,
      created_by_admin_id: req.user?.id
    });
    return res.status(201).json({ status: 'success', message: 'Time slot created successfully', data: created });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to create time slot' });
  }
};

// PUT /api/time-slots/:id
export const updateTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_id, start_time, end_time, duration_minutes, slot_time, slot_name, day_of_week, specific_date, is_active } = req.body;
    const updated = await TimeSlotModel.update(id, {
      branch_id,
      start_time,
      end_time,
      duration_minutes,
      slot_time: start_time || slot_time,
      slot_name,
      day_of_week,
      specific_date,
      is_active
    });
    return res.json({ status: 'success', message: 'Time slot updated successfully', data: updated });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to update time slot' });
  }
};

// DELETE /api/time-slots/:id
export const deleteTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    await TimeSlotModel.delete(id);
    return res.json({ status: 'success', message: 'Time slot deleted successfully' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to delete time slot' });
  }
};

// PATCH /api/time-slots/:id/toggle
export const toggleTimeSlotActive = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await TimeSlotModel.toggleActive(id);
    return res.json({ status: 'success', message: 'Time slot status toggled', data: result });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// POST /api/time-slots/generate-range
export const generateTimeSlotRange = async (req, res) => {
  try {
    const { branch_id, start_time, end_time, interval_minutes, day_of_week, specific_date } = req.body;
    const curAdminId = req.user ? String(req.user.admin_id || req.user.id) : null;

    const generated = await TimeSlotModel.generateRange({
      branch_id,
      start_time: start_time || '09:00',
      end_time: end_time || '21:00',
      interval_minutes: parseInt(interval_minutes || '60'),
      day_of_week: day_of_week || 'ALL',
      specific_date: specific_date || null,
      admin_id: curAdminId,
      created_by_admin_id: req.user?.id
    });

    return res.json({ status: 'success', message: 'Time slots generated successfully', data: generated });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to generate time slots' });
  }
};
