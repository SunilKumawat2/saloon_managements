import { UserModel } from '../models/User.js';
import { RoleModel } from '../models/Role.js';

export const getUsers = async (req, res) => {
  try {
    const users = await UserModel.findAll();
    return res.json({ status: 'success', data: users });
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
    const newUser = await UserModel.create({ name, email, phone, role_id, branch_id, password });
    return res.status(201).json({ status: 'success', message: 'User created successfully', data: newUser });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, phone, role_id, branch_id } = req.body;
    const updated = await UserModel.update(id, { name, email, phone, role_id, branch_id });
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

