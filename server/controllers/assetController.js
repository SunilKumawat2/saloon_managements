import { AssetModel } from '../models/Asset.js';

// GET /api/assets
export const getAssets = async (req, res) => {
  try {
    const branch_id = req.query.branch_id || null;
    const category = req.query.category || null;
    const condition_status = req.query.condition_status || null;

    const userRole = (req.user?.role || '').toLowerCase();
    const isSuperAdmin = req.user?.is_super_admin || userRole === 'super_admin' || req.user?.email === 'admin@saloon.com';

    let admin_id = req.query.admin_id || null;
    if (!admin_id && !isSuperAdmin && req.user) {
      admin_id = req.user.admin_id || req.user.id;
    }

    const assets = await AssetModel.findAll({ branch_id, category, condition_status, admin_id });
    return res.json({ status: 'success', data: assets });
  } catch (err) {
    return res.json({ status: 'success', data: [] });
  }
};

// GET /api/assets/:id
export const getAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await AssetModel.findById(id);
    if (!asset) {
      return res.status(404).json({ status: 'error', message: 'Asset not found' });
    }
    return res.json({ status: 'success', data: asset });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// POST /api/assets/create
export const createAsset = async (req, res) => {
  try {
    const {
      asset_name,
      asset_code,
      category,
      branch_id,
      assigned_to_admin_id,
      assigned_person_name,
      purchase_date,
      purchase_cost,
      warranty_expiry,
      condition_status,
      location_room,
      notes
    } = req.body;

    if (!asset_name || !asset_name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Asset Name is required' });
    }

    const curAdminId = req.user ? String(req.user.admin_id || req.user.id) : null;

    const created = await AssetModel.create({
      asset_name,
      asset_code,
      category,
      branch_id,
      assigned_to_admin_id,
      assigned_person_name,
      purchase_date,
      purchase_cost,
      warranty_expiry,
      condition_status,
      location_room,
      notes,
      admin_id: curAdminId,
      created_by_admin_id: req.user?.id
    });

    return res.status(201).json({ status: 'success', message: 'Salon Asset created successfully', data: created });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to create salon asset' });
  }
};

// PUT /api/assets/:id
export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await AssetModel.update(id, req.body);
    return res.json({ status: 'success', message: 'Salon Asset updated successfully', data: updated });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to update salon asset' });
  }
};

// DELETE /api/assets/:id
export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    await AssetModel.delete(id);
    return res.json({ status: 'success', message: 'Salon Asset deleted successfully' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to delete salon asset' });
  }
};

// PATCH /api/assets/:id/transfer
export const transferAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_id, assigned_to_admin_id, assigned_person_name, location_room } = req.body;

    const updated = await AssetModel.update(id, {
      branch_id,
      assigned_to_admin_id,
      assigned_person_name,
      location_room
    });

    return res.json({ status: 'success', message: 'Asset transferred successfully', data: updated });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to transfer asset' });
  }
};
