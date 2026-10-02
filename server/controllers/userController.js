import { UserModel } from '../models/User.js';
import { RoleModel } from '../models/Role.js';

export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limitQuery = req.query.limit || req.query.per_page;
    const limit = limitQuery === 'all' ? null : parseInt(limitQuery || '0');
    const search = req.query.search || '';
    const role = req.query.role || '';

    const result = await UserModel.findAll({ page, limit, search, role, currentUser: req.user });
    if (result && result.pagination) {
      return res.json({ status: 'success', data: result.data, pagination: result.pagination });
    }
    return res.json({ status: 'success', data: result });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await RoleModel.findAll();
    return res.json({ status: 'success', data: roles });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, phone, role_id, branch_id, password } = req.body;
    if (!name || !email || !role_id) {
      return res.status(400).json({ status: 'error', message: 'Name, email and role are required' });
    }

    const reqUser = req.user;
    const isMaster = Boolean(reqUser?.is_super_admin === true || reqUser?.email === 'admin@saloon.com' || String(reqUser?.role || reqUser?.role_name || '').toLowerCase() === 'super admin' || String(reqUser?.role || reqUser?.role_name || '').toLowerCase() === 'superadmin');

    if (!isMaster && (parseInt(role_id) === 1 || String(role_id) === '1')) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Only Super Admin can create Admin accounts.' });
    }

    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    if (cleanPhone && cleanPhone.length !== 10) {
      return res.status(400).json({ status: 'error', message: 'Phone number must be exactly 10 digits' });
    }

    const adminId = isMaster ? null : reqUser?.id;
    const createdByUserId = reqUser?.id || null;

    const newUser = await UserModel.create({
      name,
      email,
      phone: cleanPhone,
      role_id,
      branch_id,
      password,
      admin_id: adminId,
      created_by_user_id: createdByUserId
    });
    return res.status(201).json({ status: 'success', message: 'User created successfully', data: newUser });
  } catch (error) {
    if (error.code === '23505' || String(error.message).includes('unique constraint') || String(error.message).includes('users_email_key')) {
      return res.status(400).json({ status: 'error', message: 'A user with this email address already exists in the database.' });
    }
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, phone, role_id, branch_id } = req.body;

    const reqUser = req.user;
    const isMaster = Boolean(reqUser?.is_super_admin === true || reqUser?.email === 'admin@saloon.com' || String(reqUser?.role || reqUser?.role_name || '').toLowerCase() === 'super admin' || String(reqUser?.role || reqUser?.role_name || '').toLowerCase() === 'superadmin');

    if (!isMaster && (parseInt(role_id) === 1 || String(role_id) === '1')) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Only Super Admin can assign Admin accounts.' });
    }

    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    if (phone && cleanPhone.length !== 10) {
      return res.status(400).json({ status: 'error', message: 'Phone number must be exactly 10 digits' });
    }
    const updated = await UserModel.update(id, { name, email, phone: cleanPhone || phone, role_id, branch_id });
    if (!updated) return res.status(404).json({ status: 'error', message: 'User not found' });
    return res.json({ status: 'success', message: 'User updated successfully', data: updated });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await UserModel.toggleStatus(id);
    return res.json({ status: 'success', message: 'User status toggled', data: result });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await UserModel.delete(id);
    return res.json({ status: 'success', message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

