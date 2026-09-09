import express from 'express';

// Middleware Import
import { authenticateToken } from '../middleware/authMiddleware.js';

// Controllers Import
import { loginUser, getMe } from '../controllers/authController.js';
import { getUsers, getRoles, createUser, updateUser, deleteUser, toggleUserStatus } from '../controllers/userController.js';
import { updateRolePermissions } from '../controllers/roleController.js';
import { getBranches, createBranch, updateBranch, toggleBranchStatus, deleteBranch } from '../controllers/branchController.js';
import { 
  getServices, 
  createService, 
  updateService, 
  deleteService, 
  getPackages, 
  createPackage, 
  updatePackage, 
  deletePackage 
} from '../controllers/serviceController.js';

// -------------------- Salon Service Catalog Routes (Module 4) --------------------
router.get('/services', authenticateToken, getServices);
router.post('/services/create', authenticateToken, createService);
router.put('/services/:id', authenticateToken, updateService);
router.delete('/services/:id', authenticateToken, deleteService);

// -------------------- Bundled Combo Package Routes (Module 4) --------------------
router.get('/packages', authenticateToken, getPackages);
router.post('/packages/create', authenticateToken, createPackage);
router.put('/packages/:id', authenticateToken, updatePackage);
router.delete('/packages/:id', authenticateToken, deletePackage);
import { getStylists, createStylist } from '../controllers/stylistController.js';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { getLeads, createLead, updateLeadStatus, updateLead, deleteLead } from '../controllers/leadController.js';
import { getAppointments, createAppointment, updateAppointmentStatus, updateAppointment, deleteAppointment } from '../controllers/appointmentController.js';
import { getBills, getBillById, createBill } from '../controllers/billingController.js';
import { uploadUserAvatar, removeUserAvatar, uploadCustomerAvatar, removeCustomerAvatar, uploadLeadAvatar, removeLeadAvatar } from '../controllers/uploadController.js';
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
router.put('/customers/:id', authenticateToken, updateCustomer);
router.delete('/customers/:id', authenticateToken, deleteCustomer);

// -------------------- Lead Management Routes (Module 2) --------------------
router.get('/leads', authenticateToken, getLeads);
router.post('/leads/create', authenticateToken, createLead);
router.put('/leads/:id/status', authenticateToken, updateLeadStatus);
router.put('/leads/:id', authenticateToken, updateLead);
router.delete('/leads/:id', authenticateToken, deleteLead);

// -------------------- Appointment & Booking Routes (Module 3) --------------------
router.get('/appointments', authenticateToken, getAppointments);
router.post('/appointments/create', authenticateToken, createAppointment);
router.put('/appointments/:id/status', authenticateToken, updateAppointmentStatus);
router.put('/appointments/:id', authenticateToken, updateAppointment);
router.delete('/appointments/:id', authenticateToken, deleteAppointment);

// -------------------- POS Billing Routes (Receptionist Module) --------------------
router.get('/billing', authenticateToken, getBills);
router.get('/billing/:id', authenticateToken, getBillById);
router.post('/billing/create', authenticateToken, createBill);

// -------------------- User Avatar Upload Routes (Multer) --------------------
router.post('/users/:id/avatar', authenticateToken, handleUploadAvatar, uploadUserAvatar);
router.delete('/users/:id/avatar', authenticateToken, removeUserAvatar);

// -------------------- Customer Photo Upload Routes (Multer) --------------------
router.post('/customers/:id/avatar', authenticateToken, handleUploadAvatar, uploadCustomerAvatar);
router.delete('/customers/:id/avatar', authenticateToken, removeCustomerAvatar);

// -------------------- Lead Photo Upload Routes (Multer) --------------------
router.post('/leads/:id/avatar', authenticateToken, handleUploadAvatar, uploadLeadAvatar);
router.delete('/leads/:id/avatar', authenticateToken, removeLeadAvatar);


export default router;
