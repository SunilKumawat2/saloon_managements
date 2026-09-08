import { AppointmentModel } from '../models/Appointment.js';

export const getAppointments = async (req, res) => {
  try {
    const appointments = await AppointmentModel.findAll();
    return res.json({ status: 'success', data: appointments });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { branch_id, customer_id, customer_name, stylist_id, service_id, appointment_date, appointment_time, status, total_amount, notes } = req.body;

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
      notes
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
