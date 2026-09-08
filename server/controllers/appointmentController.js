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
    const { branch_id, customer_id, customer_name, stylist_id, service_id, appointment_date, appointment_time, total_amount, notes } = req.body;
    if (!appointment_date || !appointment_time) {
      return res.status(400).json({ status: 'error', message: 'Appointment date and time are required' });
    }

    const newAppointment = await AppointmentModel.create({ branch_id, customer_id, customer_name, stylist_id, service_id, appointment_date, appointment_time, total_amount, notes });
    return res.status(201).json({ status: 'success', message: 'Appointment booked successfully', data: newAppointment });
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
