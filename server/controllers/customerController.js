import { CustomerModel } from '../models/Customer.js';

export const getCustomers = async (req, res) => {
  try {
    const customers = await CustomerModel.findAll();
    return res.json({ status: 'success', data: customers });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const { branch_id, name, phone, email, gender, dob, anniversary, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ status: 'error', message: 'Customer name and phone are required' });
    }

    const newCustomer = await CustomerModel.create({ branch_id, name, phone, email, gender, dob, anniversary, notes });
    return res.status(201).json({ status: 'success', message: 'Customer created successfully', data: newCustomer });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
