import { LeadModel } from '../models/Lead.js';

export const getLeads = async (req, res) => {
  try {
    const leads = await LeadModel.findAll();
    return res.json({ status: 'success', data: leads });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createLead = async (req, res) => {
  try {
    const { branch_id, name, phone, email, source, notes, followup_date } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ status: 'error', message: 'Lead name and phone number are required' });
    }

    const newLead = await LeadModel.create({ branch_id, name, phone, email, source, notes, followup_date });
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

