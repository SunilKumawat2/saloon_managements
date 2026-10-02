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

    const isSuperAdmin = user.id === 1 || user.email === 'admin@saloon.com' || String(user.role_name || '').toLowerCase().includes('super');

    // Generate real JWT token
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: isSuperAdmin ? 'Super Admin' : (user.role_name || 'Staff'),
      role_id: user.role_id,
      is_super_admin: isSuperAdmin,
      branch_id: isSuperAdmin ? null : user.branch_id,
      branch_name: isSuperAdmin ? '🌐 Global SaaS System Master' : (user.branch_name || 'Main Salon'),
      permissions: isSuperAdmin ? ['all', 'manage_permissions', 'manage_users', 'manage_branches', 'manage_services', 'manage_appointments', 'manage_billing'] : permissions
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
    const isSuperAdmin = freshUser.id === 1 || freshUser.email === 'admin@saloon.com' || String(freshUser.role || '').toLowerCase().includes('super');
    return res.json({
      status: 'success',
      data: {
        id: freshUser.id,
        name: freshUser.name,
        email: freshUser.email,
        phone: freshUser.phone,
        avatar_url: freshUser.avatar_url,
        is_active: freshUser.is_active,
        role: isSuperAdmin ? 'Super Admin' : freshUser.role,
        role_id: freshUser.role_id,
        is_super_admin: isSuperAdmin,
        branch_id: isSuperAdmin ? null : freshUser.branch_id,
        branch_name: isSuperAdmin ? '🌐 Global SaaS System Master' : (freshUser.branch_name || 'Main Salon'),
        permissions: isSuperAdmin ? ['all', 'manage_permissions', 'manage_users', 'manage_branches', 'manage_services', 'manage_appointments', 'manage_billing'] : (Array.isArray(freshUser.permissions) ? freshUser.permissions : [])
      }
    });
  } catch (error) {
    // DB error — fallback to JWT payload so user is NOT logged out
    console.error('getMe DB error (using JWT fallback):', error.message);
    return res.json({ status: 'success', data: req.user });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    const { name, email, phone, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ status: 'error', message: 'Name and email are required' });
    }
    const updated = await UserModel.updateProfile(userId, { name, email, phone, password });
    return res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

