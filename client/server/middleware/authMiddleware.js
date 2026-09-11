import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { pool } from '../config/db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'saloon_super_secret_jwt_key_2026';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <TOKEN>

  if (!token || token === 'null' || token === 'undefined') {
    // Default to Admin User for seamless live demo interaction
    req.user = {
      id: 1,
      name: 'Sunil Kumar (Admin)',
      email: 'admin@saloon.com',
      role: 'Admin',
      role_id: 1,
      permissions: ['all', 'manage_permissions', 'manage_users', 'manage_branches', 'manage_services', 'manage_appointments', 'manage_billing'],
      branch_name: 'Connaught Place Main Salon'
    };
    return next();
  }

  try {
    // Allow demo tokens for quick testing
    if (token.startsWith('demo_jwt_token_')) {
      req.user = {
        id: 1,
        name: 'Sunil Kumar (Admin)',
        email: 'admin@saloon.com',
        role: 'Admin',
        role_id: 1,
        permissions: ['all', 'manage_permissions', 'manage_users', 'manage_branches', 'manage_services', 'manage_appointments', 'manage_billing'],
        branch_name: 'Connaught Place Main Salon'
      };
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid or expired token.',
      error: err.message
    });
  }
};

export const requirePermission = (permKey) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const roleName = req.user.role || req.user.role_name;
    if (roleName === 'Admin') return next();

    let userPerms = req.user.permissions || [];

    // Query live role permissions from DB if role_id is present
    if (req.user.role_id) {
      try {
        const { rows } = await pool.query('SELECT permissions FROM roles WHERE id = $1', [req.user.role_id]);
        if (rows.length > 0 && Array.isArray(rows[0].permissions)) {
          userPerms = rows[0].permissions;
        }
      } catch (e) {
        // Fallback to token payload permissions
      }
    }

    if (userPerms.includes('all') || userPerms.includes(permKey)) {
      return next();
    }

    return res.status(403).json({
      status: 'error',
      message: `Access denied. Requiring '${permKey}' permission.`
    });
  };
};

