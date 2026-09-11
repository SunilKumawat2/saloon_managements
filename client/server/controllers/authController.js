import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserModel } from '../models/User.js';
import { RoleModel } from '../models/Role.js';
import { pool } from '../config/db.js';

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

    // Fetch latest role permissions from DB
    let permissions = [];
    try {
      const role = await RoleModel.findById(user.role_id);
      permissions = role?.permissions || [];
    } catch (e) {
      permissions = [];
    }

    // Generate real JWT token
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name || 'Staff',
      role_id: user.role_id,
      branch_id: user.branch_id,
      branch_name: user.branch_name || 'Main Salon',
      permissions
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

// getMe — always fetches FRESH user data + latest role permissions from DB
// This ensures permission changes in the matrix are immediately reflected on next refresh
export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.json({ status: 'success', data: req.user });
    }

    // Fetch fresh user data from DB
    const query = `
      SELECT u.id, u.name, u.email, u.phone, u.avatar_url, u.is_active,
             u.role_id, u.branch_id,
             r.name as role, r.permissions,
             b.name as branch_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.id = $1
    `;
    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      // User not found in DB — return JWT payload as fallback
      return res.json({ status: 'success', data: req.user });
    }

    const freshUser = rows[0];
    return res.json({
      status: 'success',
      data: {
        id: freshUser.id,
        name: freshUser.name,
        email: freshUser.email,
        phone: freshUser.phone,
        avatar_url: freshUser.avatar_url,
        is_active: freshUser.is_active,
        role: freshUser.role,
        role_id: freshUser.role_id,
        branch_id: freshUser.branch_id,
        branch_name: freshUser.branch_name,
        permissions: Array.isArray(freshUser.permissions) ? freshUser.permissions : []
      }
    });
  } catch (error) {
    // DB error — fallback to JWT payload so user is NOT logged out
    console.error('getMe DB error (using JWT fallback):', error.message);
    return res.json({ status: 'success', data: req.user });
  }
};

