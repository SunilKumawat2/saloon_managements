import Marketing from '../models/Marketing.js';

export const getTemplates = async (req, res) => {
  try {
    const templates = await Marketing.getTemplates();
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const template = await Marketing.createTemplate(req.body);
    res.json({ success: true, template, message: 'Template created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Marketing.updateTemplate(id, req.body);
    res.json({ success: true, template, message: 'Template updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Marketing.getCampaigns();
    res.json({ success: true, campaigns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCampaign = async (req, res) => {
  try {
    const campaign = await Marketing.createCampaign(req.body);
    res.json({ success: true, campaign, message: 'Campaign created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const sendCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Marketing.sendCampaign(id);
    res.json({ success: true, campaign, message: `Campaign "${campaign.title}" dispatched to ${campaign.sent_count} clients!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getTriggers = async (req, res) => {
  try {
    const triggers = await Marketing.getTriggers();
    res.json({ success: true, triggers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleTrigger = async (req, res) => {
  try {
    const { id } = req.params;
    const trigger = await Marketing.toggleTrigger(id);
    res.json({ success: true, trigger, message: `Trigger status toggled` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getTodayOccasions = async (req, res) => {
  try {
    const occasions = await Marketing.getTodayOccasions();
    res.json({ success: true, occasions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDeliveryLogs = async (req, res) => {
  try {
    const logs = await Marketing.getLogs();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
