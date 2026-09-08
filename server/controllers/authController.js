import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserModel } from '../models/User.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'saloon_super_secret_jwt_key_2026';

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email is required' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User account not found' });
    }

    // Generate real JWT token
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name || 'Staff',
      role_id: user.role_id,
      branch_id: user.branch_id,
      branch_name: user.branch_name || 'Main Salon'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        token: token,
        user: payload
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getMe = async (req, res) => {
  return res.json({
    status: 'success',
    data: req.user || {
      id: 1,
      name: 'Sunil Kumar (Admin)',
      email: 'admin@saloon.com',
      role: 'Admin'
    }
  });
};
