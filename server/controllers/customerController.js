import { CustomerModel } from '../models/Customer.js';
import { pool } from '../config/db.js';

export const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limitQuery = req.query.limit || req.query.per_page;
    const limit = limitQuery === 'all' ? null : parseInt(limitQuery || '0');
    const search = req.query.search || '';
    const branch_id = req.query.branch_id || '';

    const result = await CustomerModel.findAll({ page, limit, search, branch_id, currentUser: req.user });
    if (result && result.pagination) {
      return res.json({ status: 'success', data: result.data, pagination: result.pagination });
    }
    return res.json({ status: 'success', data: result });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createCustomer = async (req, res) => {
  try {
    let { branch_id, name, phone, email, gender, dob, anniversary, notes, loyalty_points } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ status: 'error', message: 'Customer name and phone are required' });
    }

    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';

    // Auto-resolve branch_id if missing
    let resolvedBranchId = branch_id ? parseInt(branch_id) : null;
    if (!resolvedBranchId && req.user) {
      if (req.user.branch_id) {
        resolvedBranchId = req.user.branch_id;
      } else {
        const { rows } = await pool.query('SELECT id FROM branches WHERE admin_id = $1 OR created_by_user_id = $1 ORDER BY id ASC LIMIT 1', [req.user.id]);
        if (rows.length > 0) resolvedBranchId = rows[0].id;
      }
    }

    const newCustomer = await CustomerModel.create({
      branch_id: resolvedBranchId,
      name,
      phone: cleanPhone || phone,
      email,
      gender,
      dob,
      anniversary,
      notes,
      loyalty_points
    });
    return res.status(201).json({ status: 'success', message: 'Customer created successfully', data: newCustomer });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, gender, dob, anniversary, notes, loyalty_points } = req.body;
    const updated = await CustomerModel.update(parseInt(id), { name, phone, email, gender, dob, anniversary, notes, loyalty_points });
    return res.json({ status: 'success', message: 'Customer updated successfully', data: updated });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await CustomerModel.delete(parseInt(id));
    return res.json({ status: 'success', message: 'Customer deleted successfully' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
