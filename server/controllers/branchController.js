import { BranchModel } from '../models/Branch.js';

export const getBranches = async (req, res) => {
  try {
    const branches = await BranchModel.findAll();
    return res.json({ status: 'success', data: branches });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createBranch = async (req, res) => {
  try {
    const { name, code, city, address, phone } = req.body;
    if (!name || !code) {
      return res.status(400).json({ status: 'error', message: 'Branch name and unique code are required' });
    }

    const newBranch = await BranchModel.create({ name, code, city, address, phone });
    return res.status(201).json({ status: 'success', message: 'Branch added successfully', data: newBranch });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
