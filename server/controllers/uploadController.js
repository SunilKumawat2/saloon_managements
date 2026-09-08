import { pool } from '../config/db.js';

// POST /api/v1/users/:id/avatar
// Upload or replace a user's avatar photo
export const uploadUserAvatar = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    // Build the public URL path (served via /uploads/avatars/)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update avatar_url in users table
    const result = await pool.query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, name, email, avatar_url`,
      [avatarUrl, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Avatar uploaded successfully!',
      avatarUrl,
    });
  } catch (err) {
    console.error('uploadUserAvatar error:', err);
    res.status(500).json({ success: false, message: 'Failed to upload avatar.' });
  }
};

// DELETE /api/v1/users/:id/avatar — Reset avatar to null
export const removeUserAvatar = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    await pool.query(`UPDATE users SET avatar_url = NULL WHERE id = $1`, [userId]);
    res.json({ success: true, message: 'Avatar removed.' });
  } catch (err) {
    console.error('removeUserAvatar error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove avatar.' });
  }
};
