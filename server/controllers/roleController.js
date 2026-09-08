import { RoleModel } from '../models/Role.js';

export const getRoles = async (req, res) => {
  try {
    const roles = await RoleModel.findAll();
    return res.json({ status: 'success', data: roles });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ status: 'error', message: 'permissions must be an array of strings' });
    }

    const updated = await RoleModel.updatePermissions(parseInt(id), permissions);
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Role not found' });
    }

    return res.json({ status: 'success', message: 'Permissions updated successfully', data: updated });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
