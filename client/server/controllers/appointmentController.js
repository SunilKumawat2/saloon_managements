import { AppointmentModel } from '../models/Appointment.js';

export const getAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limitQuery = req.query.limit || req.query.per_page;
    const limit = limitQuery === 'all' ? null : parseInt(limitQuery || '0');
    const search = req.query.search || '';
    const status = req.query.status || 'All';
    const branch_id = req.query.branch_id || '';

    const result = await AppointmentModel.findAll({ page, limit, search, status, branch_id, currentUser: req.user });
    if (result && result.pagination) {
      return res.json({ status: 'success', data: result.data, pagination: result.pagination });
    }
    return res.json({ status: 'success', data: result });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    let { branch_id, customer_id, customer_name, stylist_id, service_id, appointment_date, appointment_time, status, total_amount, notes, service_ids, service_name } = req.body;

    if (!branch_id && req.user?.branch_id) {
      branch_id = req.user.branch_id;
    }

    let parsedServiceIds = [];
    if (Array.isArray(service_ids)) {
      parsedServiceIds = service_ids.map(Number).filter(n => !isNaN(n));
    } else if (typeof service_ids === 'string') {
      try {
        const p = JSON.parse(service_ids);
        if (Array.isArray(p)) parsedServiceIds = p.map(Number).filter(n => !isNaN(n));
      } catch (e) {}
    }

    const newAppointment = await AppointmentModel.create({
      branch_id,
      customer_id,
      customer_name,
      stylist_id,
      service_id,
      appointment_date: appointment_date || new Date().toISOString().split('T')[0],
      appointment_time: appointment_time || '10:00',
      status: status || 'Scheduled',
      total_amount,
      notes,
      service_ids: parsedServiceIds,
      service_name: service_name || ''
    });
    return res.status(201).json({ status: 'success', message: 'Appointment / Check-in created successfully', data: newAppointment });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ status: 'error', message: 'Status is required' });
    }

    const updated = await AppointmentModel.updateStatus(id, status);
    return res.json({ status: 'success', message: 'Appointment status updated', data: updated });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { stylist_id, service_id, status, appointment_date, appointment_time, notes, total_amount } = req.body;
    const updated = await AppointmentModel.update(parseInt(id), { stylist_id, service_id, status, appointment_date, appointment_time, notes, total_amount });
    return res.json({ status: 'success', message: 'Appointment updated successfully', data: updated });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    await AppointmentModel.delete(parseInt(id));
    return res.json({ status: 'success', message: 'Appointment deleted successfully' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
