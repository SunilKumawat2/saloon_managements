import ServiceModel from '../models/ServiceModel.js';
import { pool } from '../config/db.js';

// ─── SERVICES CRUD ───
export const getServices = async (req, res) => {
  try {
    const { page, limit, search, category, branch_id } = req.query;
    const result = await ServiceModel.findAllServices({ page, limit, search, category, branch_id, currentUser: req.user });
    if (result && typeof result === 'object' && !Array.isArray(result) && result.data && result.pagination) {
      return res.json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    }
    return res.json({
      status: 'success',
      data: result
    });
  } catch (err) {
    console.error('Error fetching services:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch services' });
  }
};

export const createService = async (req, res) => {
  try {
    let { name, category, description, price, duration_minutes, buffer_time_minutes, commission_rate, is_active, branch_id } = req.body;
    if (!name || !price) {
      return res.status(400).json({ status: 'error', message: 'Service name and price are required' });
    }

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

    const newService = await ServiceModel.createService({
      name,
      category,
      description,
      price: parseFloat(price),
      duration_minutes: parseInt(duration_minutes || 30),
      buffer_time_minutes: parseInt(buffer_time_minutes || 15),
      commission_rate: parseFloat(commission_rate || 10.00),
      is_active,
      branch_id: resolvedBranchId
    });

    return res.status(201).json({
      status: 'success',
      message: 'Service created successfully',
      data: newService
    });
  } catch (err) {
    console.error('Error creating service:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to create service' });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedService = await ServiceModel.updateService(id, req.body);
    if (!updatedService) {
      return res.status(404).json({ status: 'error', message: 'Service not found' });
    }
    return res.json({
      status: 'success',
      message: 'Service updated successfully',
      data: updatedService
    });
  } catch (err) {
    console.error('Error updating service:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to update service' });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedService = await ServiceModel.deleteService(id);
    if (!deletedService) {
      return res.status(404).json({ status: 'error', message: 'Service not found' });
    }
    return res.json({
      status: 'success',
      message: 'Service deleted successfully',
      data: deletedService
    });
  } catch (err) {
    console.error('Error deleting service:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to delete service' });
  }
};

// ─── PACKAGES CRUD ───
export const getPackages = async (req, res) => {
  try {
    const { page, limit, search, branch_id } = req.query;
    const result = await ServiceModel.findAllPackages({ page, limit, search, branch_id, currentUser: req.user });
    if (result && typeof result === 'object' && !Array.isArray(result) && result.data && result.pagination) {
      return res.json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    }
    return res.json({
      status: 'success',
      data: result
    });
  } catch (err) {
    console.error('Error fetching packages:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch packages' });
  }
};

export const createPackage = async (req, res) => {
  try {
    let { name, category, description, package_price, standalone_price, discount_percentage, validity_days, is_active, service_ids, branch_id } = req.body;
    if (!name || !package_price) {
      return res.status(400).json({ status: 'error', message: 'Package name and price are required' });
    }

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

    const newPackage = await ServiceModel.createPackage({
      name,
      category,
      description,
      package_price: parseFloat(package_price),
      standalone_price: parseFloat(standalone_price || package_price),
      discount_percentage: parseFloat(discount_percentage || 0),
      validity_days: parseInt(validity_days || 30),
      is_active,
      service_ids,
      branch_id: resolvedBranchId
    });

    return res.status(201).json({
      status: 'success',
      message: 'Package created successfully',
      data: newPackage
    });
  } catch (err) {
    console.error('Error creating package:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to create package' });
  }
};

export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPackage = await ServiceModel.updatePackage(id, req.body);
    if (!updatedPackage) {
      return res.status(404).json({ status: 'error', message: 'Package not found' });
    }
    return res.json({
      status: 'success',
      message: 'Package updated successfully',
      data: updatedPackage
    });
  } catch (err) {
    console.error('Error updating package:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to update package' });
  }
};

export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPackage = await ServiceModel.deletePackage(id);
    if (!deletedPackage) {
      return res.status(404).json({ status: 'error', message: 'Package not found' });
    }
    return res.json({
      status: 'success',
      message: 'Package deleted successfully',
      data: deletedPackage
    });
  } catch (err) {
    console.error('Error deleting package:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to delete package' });
  }
};
