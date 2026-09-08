import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'saloon_super_secret_jwt_key_2026';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. No authentication token provided. Authorization header required (Bearer <token>).'
    });
  }

  try {
    // Allow demo tokens for quick testing
    if (token.startsWith('demo_jwt_token_')) {
      req.user = {
        id: 1,
        name: 'Sunil Kumar (Admin)',
        email: 'admin@saloon.com',
        role: 'Admin',
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
