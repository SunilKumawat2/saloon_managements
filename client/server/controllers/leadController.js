import { LeadModel } from '../models/Lead.js';
import { pool } from '../config/db.js';

export const getLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limitQuery = req.query.limit || req.query.per_page;
    const limit = limitQuery === 'all' ? null : parseInt(limitQuery || '0');
    const search = req.query.search || '';
    const status = req.query.status || '';
    const branch_id = req.query.branch_id || '';

    const result = await LeadModel.findAll({ page, limit, search, status, branch_id, currentUser: req.user });
    if (result && result.pagination) {
      return res.json({ status: 'success', data: result.data, pagination: result.pagination });
    }
    return res.json({ status: 'success', data: result });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createLead = async (req, res) => {
  try {
    let { branch_id, name, phone, email, source, notes, followup_date } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ status: 'error', message: 'Lead name and phone number are required' });
    }

    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ status: 'error', message: 'Phone number must be exactly 10 digits' });
    }

    // Auto-resolve branch_id if missing or unassigned
    let resolvedBranchId = branch_id ? parseInt(branch_id) : null;
    if (!resolvedBranchId && req.user) {
      if (req.user.branch_id) {
        resolvedBranchId = req.user.branch_id;
      } else {
        const { rows } = await pool.query('SELECT id FROM branches WHERE admin_id = $1 OR created_by_user_id = $1 ORDER BY id ASC LIMIT 1', [req.user.id]);
        if (rows.length > 0) resolvedBranchId = rows[0].id;
      }
    }

    const newLead = await LeadModel.create({
      branch_id: resolvedBranchId,
      name,
      phone: cleanPhone,
      email,
      source,
      notes,
      followup_date
    });
    return res.status(201).json({ status: 'success', message: 'Lead created successfully', data: newLead });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ status: 'error', message: 'Status is required' });
    const updatedLead = await LeadModel.updateStatus(id, status);
    return res.json({ status: 'success', message: 'Lead status updated', data: updatedLead });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, source, notes, followup_date, status } = req.body;
    const updated = await LeadModel.update(parseInt(id), { name, phone, email, source, notes, followup_date, status });
    return res.json({ status: 'success', message: 'Lead updated successfully', data: updated });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    await LeadModel.delete(parseInt(id));
    return res.json({ status: 'success', message: 'Lead deleted successfully' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

