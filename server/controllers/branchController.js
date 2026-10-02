import { BranchModel } from '../models/Branch.js';

export const getBranches = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limitQuery = req.query.limit || req.query.per_page;
    const limit = limitQuery === 'all' ? null : parseInt(limitQuery || '0');
    const search = req.query.search || '';

    const result = await BranchModel.findAll({ page, limit, search, currentUser: req.user });
    if (result && result.pagination) {
      return res.json({ status: 'success', data: result.data, pagination: result.pagination });
    }
    return res.json({ status: 'success', data: result });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createBranch = async (req, res) => {
  try {
    const user = req.user;
    if (user && (user.is_super_admin || user.email === 'admin@saloon.com' || user.id === 1 || String(user.role || user.role_name).toLowerCase().includes('super'))) {
      return res.status(400).json({
        status: 'error',
        message: 'Super Admin cannot create branches directly. Branches must be created by Salon Admins.'
      });
    }

    const { name, code, city, address, phone } = req.body;
    if (!name || !code) {
      return res.status(400).json({ status: 'error', message: 'Branch name and unique code are required' });
    }

    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    if (cleanPhone && cleanPhone.length !== 10) {
      return res.status(400).json({ status: 'error', message: 'Contact phone number must be exactly 10 digits' });
    }

    const adminId = user?.id || null;
    const createdByUserId = user?.id || null;

    const newBranch = await BranchModel.create({
      name,
      code,
      city,
      address,
      phone: cleanPhone,
      admin_id: adminId,
      created_by_user_id: createdByUserId
    });
    return res.status(201).json({ status: 'success', message: 'Branch added successfully', data: newBranch });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, city, address, phone } = req.body;
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    if (phone && cleanPhone.length !== 10) {
      return res.status(400).json({ status: 'error', message: 'Contact phone number must be exactly 10 digits' });
    }
    const updated = await BranchModel.update(parseInt(id), { name, code, city, address, phone: cleanPhone || phone });
    return res.json({ status: 'success', message: 'Branch updated successfully', data: updated });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const toggleBranchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await BranchModel.toggleStatus(parseInt(id));
    return res.json({ status: 'success', message: 'Branch status updated', data: updated });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    await BranchModel.delete(parseInt(id));
    return res.json({ status: 'success', message: 'Branch deleted successfully' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
