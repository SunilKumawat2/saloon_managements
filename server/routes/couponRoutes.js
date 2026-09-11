import express from 'express';
import { getCoupons, validateCoupon } from '../controllers/couponController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getCoupons);
router.post('/validate', verifyToken, validateCoupon);

export default router;
