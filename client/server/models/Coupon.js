import { pool } from '../config/db.js';

const Coupon = {
  getAllActive: async () => {
    const res = await pool.query('SELECT * FROM coupons WHERE is_active = TRUE ORDER BY id ASC');
    return res.rows;
  },

  getByCode: async (code) => {
    const res = await pool.query('SELECT * FROM coupons WHERE UPPER(code) = UPPER($1) AND is_active = TRUE', [code]);
    return res.rows[0];
  }
};

export default Coupon;
