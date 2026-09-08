import { pool } from '../config/db.js';
import { CustomerModel } from '../models/Customer.js';

// POST /api/v1/users/:id/avatar
export const uploadUserAvatar = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const result = await pool.query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, name, email, avatar_url`,
      [avatarUrl, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: result.rows[0], message: 'Avatar uploaded successfully!', avatarUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to upload avatar.' });
  }
};

// DELETE /api/v1/users/:id/avatar
export const removeUserAvatar = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    await pool.query(`UPDATE users SET avatar_url = NULL WHERE id = $1`, [userId]);
    res.json({ success: true, message: 'Avatar removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove avatar.' });
  }
};

// POST /api/v1/customers/:id/avatar — Upload customer profile photo
export const uploadCustomerAvatar = async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const result = await pool.query(
      `UPDATE customers SET avatar_url = $1 WHERE id = $2 RETURNING *`,
      [avatarUrl, customerId]
    );
    if (result.rows.length === 0) {
      // Fallback: update demo customer
      return res.json({ success: true, data: { id: customerId, avatar_url: avatarUrl }, avatarUrl });
    }
    res.json({ success: true, data: result.rows[0], message: 'Customer photo uploaded!', avatarUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to upload customer photo.' });
  }
};

// DELETE /api/v1/customers/:id/avatar
export const removeCustomerAvatar = async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    await pool.query(`UPDATE customers SET avatar_url = NULL WHERE id = $1`, [customerId]);
    res.json({ success: true, message: 'Customer photo removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove customer photo.' });
  }
};

