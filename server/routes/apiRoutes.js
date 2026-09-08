import express from 'express';

// Middleware Import
import { authenticateToken } from '../middleware/authMiddleware.js';

// Controllers Import
import { loginUser, getMe } from '../controllers/authController.js';
import { getUsers, getRoles, createUser, updateUser, deleteUser, toggleUserStatus } from '../controllers/userController.js';
import { updateRolePermissions } from '../controllers/roleController.js';
import { getBranches, createBranch, updateBranch, toggleBranchStatus, deleteBranch } from '../controllers/branchController.js';
import { getServices, createService } from '../controllers/serviceController.js';
import { getStylists, createStylist } from '../controllers/stylistController.js';
import { getCustomers, createCustomer } from '../controllers/customerController.js';
import { getLeads, createLead, updateLeadStatus } from '../controllers/leadController.js';
import { getAppointments, createAppointment, updateAppointmentStatus } from '../controllers/appointmentController.js';
import { getBills, getBillById, createBill } from '../controllers/billingController.js';
import { uploadUserAvatar, removeUserAvatar } from '../controllers/uploadController.js';
import uploadAvatar, { handleUploadAvatar } from '../middleware/uploadMiddleware.js';
import { getHealth, checkDatabaseStatus } from '../controllers/healthController.js';


const router = express.Router();

// ==================== 🔓 PUBLIC ROUTES (No Token Needed) ====================
router.get('/health', getHealth);
router.get('/db-check', checkDatabaseStatus);
router.post('/auth/login', loginUser);

// ==================== 🔒 PROTECTED ROUTES (Requires JWT Token) ====================
router.get('/auth/me', authenticateToken, getMe);

// -------------------- User & Role Routes (Module 1) --------------------
router.get('/users', authenticateToken, getUsers);
router.post('/users/create', authenticateToken, createUser);
router.get('/users/roles', authenticateToken, getRoles);
router.put('/users/:id', authenticateToken, updateUser);
router.patch('/users/:id/status', authenticateToken, toggleUserStatus);
router.delete('/users/:id', authenticateToken, deleteUser);

// -------------------- Role & Permissions Routes (RBAC Matrix) --------------------
router.put('/roles/:id/permissions', authenticateToken, updateRolePermissions);

// -------------------- Branch Routes (Module 1) --------------------
router.get('/branches', authenticateToken, getBranches);
router.post('/branches/create', authenticateToken, createBranch);
router.put('/branches/:id', authenticateToken, updateBranch);
router.patch('/branches/:id/status', authenticateToken, toggleBranchStatus);
router.delete('/branches/:id', authenticateToken, deleteBranch);

// -------------------- Salon Service Catalog Routes --------------------
router.get('/services', authenticateToken, getServices);
router.post('/services/create', authenticateToken, createService);

// -------------------- Stylist / Staff Routes --------------------
router.get('/stylists', authenticateToken, getStylists);
router.post('/stylists/create', authenticateToken, createStylist);

// -------------------- Customer CRM Routes (Module 2) --------------------
router.get('/customers', authenticateToken, getCustomers);
router.post('/customers/create', authenticateToken, createCustomer);

// -------------------- Lead Management Routes (Module 2) --------------------
router.get('/leads', authenticateToken, getLeads);
router.post('/leads/create', authenticateToken, createLead);
router.put('/leads/:id/status', authenticateToken, updateLeadStatus);

// -------------------- Appointment & Booking Routes (Module 3) --------------------
router.get('/appointments', authenticateToken, getAppointments);
router.post('/appointments/create', authenticateToken, createAppointment);
router.put('/appointments/:id/status', authenticateToken, updateAppointmentStatus);

// -------------------- POS Billing Routes (Receptionist Module) --------------------
router.get('/billing', authenticateToken, getBills);
router.get('/billing/:id', authenticateToken, getBillById);
router.post('/billing/create', authenticateToken, createBill);

// -------------------- User Avatar Upload Routes (Multer) --------------------
router.post('/users/:id/avatar', authenticateToken, handleUploadAvatar, uploadUserAvatar);
router.delete('/users/:id/avatar', authenticateToken, removeUserAvatar);


export default router;
