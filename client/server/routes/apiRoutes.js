import express from 'express';

// Middleware Import
import { authenticateToken, requirePermission } from '../middleware/authMiddleware.js';

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
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../controllers/categoryController.js';
import { getStylists, createStylist } from '../controllers/stylistController.js';
import { getCoupons, validateCoupon } from '../controllers/couponController.js';
import {
  getMembershipTiers, createMembershipTier, updateMembershipTier,
  getEnrolledMembers, enrollCustomer, getCustomerLoyaltyProfile,
  getLoyaltyLedger, getReferralList, applyReferralCode
} from '../controllers/loyaltyController.js';
import {
  getTemplates, createTemplate, updateTemplate,
  getCampaigns, createCampaign, sendCampaign,
  getTriggers, toggleTrigger, getTodayOccasions, getDeliveryLogs
} from '../controllers/marketingController.js';
import {
  getRevenueAnalytics, getStaffPerformance, getInventoryMargins,
  getCustomerRetention, getPopularityAndPeakHours
} from '../controllers/analyticsController.js';
import {
  getSystemSettings, updateSystemSettings, getAuditLogs,
  getDatabaseBackups, createDatabaseBackup
} from '../controllers/settingsController.js';
import {
  getGatewaySettings, updateGatewaySettings, createOrder, verifyPayment
} from '../controllers/paymentController.js';

import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { getLeads, createLead, updateLeadStatus, updateLead, deleteLead } from '../controllers/leadController.js';
import { getAppointments, createAppointment, updateAppointmentStatus, updateAppointment, deleteAppointment } from '../controllers/appointmentController.js';
import { getBills, getBillById, createBill } from '../controllers/billingController.js';
import {
  getProducts, createProduct, updateProduct, adjustStock, deleteProduct,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getPurchaseOrders, createPurchaseOrder, updatePurchaseOrderStatus,
  getConsumptions, createConsumption, deleteConsumption
} from '../controllers/inventoryController.js';
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
router.post('/users/create', authenticateToken, requirePermission('manage_users'), createUser);
router.get('/users/roles', authenticateToken, getRoles);
router.put('/users/:id', authenticateToken, requirePermission('manage_users'), updateUser);
router.patch('/users/:id/status', authenticateToken, requirePermission('manage_users'), toggleUserStatus);
router.delete('/users/:id', authenticateToken, requirePermission('manage_users'), deleteUser);

// -------------------- Role & Permissions Routes (RBAC Matrix) --------------------
router.put('/roles/:id/permissions', authenticateToken, requirePermission('manage_permissions'), updateRolePermissions);

// -------------------- Branch Routes (Module 1) --------------------
router.get('/branches', authenticateToken, getBranches);
router.post('/branches/create', authenticateToken, requirePermission('manage_branches'), createBranch);
router.put('/branches/:id', authenticateToken, requirePermission('manage_branches'), updateBranch);
router.patch('/branches/:id/status', authenticateToken, requirePermission('manage_branches'), toggleBranchStatus);
router.delete('/branches/:id', authenticateToken, requirePermission('manage_branches'), deleteBranch);

// -------------------- Dynamic Category Routes (Module 4) --------------------
router.get('/categories', authenticateToken, getCategories);
router.post('/categories/create', authenticateToken, requirePermission('manage_services'), createCategory);
router.put('/categories/:id', authenticateToken, requirePermission('manage_services'), updateCategory);
router.delete('/categories/:id', authenticateToken, requirePermission('manage_services'), deleteCategory);

// -------------------- Salon Service Catalog Routes (Module 4) --------------------
router.get('/services', authenticateToken, getServices);
router.post('/services/create', authenticateToken, requirePermission('manage_services'), createService);
router.put('/services/:id', authenticateToken, requirePermission('manage_services'), updateService);
router.delete('/services/:id', authenticateToken, requirePermission('manage_services'), deleteService);

// -------------------- Bundled Combo Packages Routes (Module 4) --------------------
router.get('/packages', authenticateToken, getPackages);
router.post('/packages/create', authenticateToken, requirePermission('manage_services'), createPackage);
router.put('/packages/:id', authenticateToken, requirePermission('manage_services'), updatePackage);
router.delete('/packages/:id', authenticateToken, requirePermission('manage_services'), deletePackage);

// -------------------- Stylist / Staff Routes --------------------
router.get('/stylists', authenticateToken, getStylists);
router.post('/stylists/create', authenticateToken, requirePermission('manage_users'), createStylist);

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
router.post('/appointments/create', authenticateToken, requirePermission('manage_appointments'), createAppointment);
router.put('/appointments/:id/status', authenticateToken, requirePermission('manage_appointments'), updateAppointmentStatus);
router.put('/appointments/:id', authenticateToken, requirePermission('manage_appointments'), updateAppointment);
router.delete('/appointments/:id', authenticateToken, requirePermission('manage_appointments'), deleteAppointment);

// -------------------- POS Billing Routes (Receptionist Module) --------------------
router.get('/billing', authenticateToken, getBills);
router.get('/billing/:id', authenticateToken, getBillById);
router.post('/billing/create', authenticateToken, requirePermission('manage_billing'), createBill);

// -------------------- Coupon Routes (Module 5) --------------------
router.get('/coupons', authenticateToken, getCoupons);
router.post('/coupons/validate', authenticateToken, validateCoupon);

// -------------------- Inventory & Stock Management Routes (Module 6) --------------------
router.get('/products', authenticateToken, getProducts);
router.post('/products/create', authenticateToken, requirePermission('manage_inventory'), createProduct);
router.put('/products/:id', authenticateToken, requirePermission('manage_inventory'), updateProduct);
router.patch('/products/:id/adjust', authenticateToken, requirePermission('manage_inventory'), adjustStock);
router.delete('/products/:id', authenticateToken, requirePermission('manage_inventory'), deleteProduct);

router.get('/suppliers', authenticateToken, getSuppliers);
router.post('/suppliers/create', authenticateToken, requirePermission('manage_inventory'), createSupplier);
router.put('/suppliers/:id', authenticateToken, requirePermission('manage_inventory'), updateSupplier);
router.delete('/suppliers/:id', authenticateToken, requirePermission('manage_inventory'), deleteSupplier);

router.get('/purchase-orders', authenticateToken, getPurchaseOrders);
router.post('/purchase-orders/create', authenticateToken, requirePermission('manage_inventory'), createPurchaseOrder);
router.patch('/purchase-orders/:id/status', authenticateToken, requirePermission('manage_inventory'), updatePurchaseOrderStatus);

router.get('/consumption', authenticateToken, getConsumptions);
router.post('/consumption/create', authenticateToken, requirePermission('manage_inventory'), createConsumption);
router.delete('/consumption/:id', authenticateToken, requirePermission('manage_inventory'), deleteConsumption);

// -------------------- User Avatar Upload Routes (Multer) --------------------
router.post('/users/:id/avatar', authenticateToken, handleUploadAvatar, uploadUserAvatar);
router.delete('/users/:id/avatar', authenticateToken, removeUserAvatar);

// -------------------- Customer Photo Upload Routes (Multer) --------------------
router.post('/customers/:id/avatar', authenticateToken, handleUploadAvatar, uploadCustomerAvatar);
router.delete('/customers/:id/avatar', authenticateToken, removeCustomerAvatar);

// -------------------- Loyalty & Membership Program Routes (Module 7) --------------------
router.get('/loyalty/memberships', authenticateToken, getMembershipTiers);
router.post('/loyalty/memberships', authenticateToken, createMembershipTier);
router.put('/loyalty/memberships/:id', authenticateToken, updateMembershipTier);

router.get('/loyalty/members', authenticateToken, getEnrolledMembers);
router.post('/loyalty/enroll', authenticateToken, enrollCustomer);
router.get('/loyalty/customer/:customerId', authenticateToken, getCustomerLoyaltyProfile);

router.get('/loyalty/ledger', authenticateToken, getLoyaltyLedger);
router.get('/loyalty/referrals', authenticateToken, getReferralList);
router.post('/loyalty/referrals/apply', authenticateToken, applyReferralCode);

// -------------------- Marketing Automation & Communication Routes (Module 8) --------------------
router.get('/marketing/templates', authenticateToken, getTemplates);
router.post('/marketing/templates', authenticateToken, createTemplate);
router.put('/marketing/templates/:id', authenticateToken, updateTemplate);

router.get('/marketing/campaigns', authenticateToken, getCampaigns);
router.post('/marketing/campaigns', authenticateToken, createCampaign);
router.post('/marketing/campaigns/:id/send', authenticateToken, sendCampaign);

router.get('/marketing/triggers', authenticateToken, getTriggers);
router.put('/marketing/triggers/:id/toggle', authenticateToken, toggleTrigger);
router.get('/marketing/occasions', authenticateToken, getTodayOccasions);
router.get('/marketing/logs', authenticateToken, getDeliveryLogs);

// -------------------- Reports & Executive Analytics Routes (Module 9) --------------------
router.get('/analytics/revenue', authenticateToken, getRevenueAnalytics);
router.get('/analytics/staff', authenticateToken, getStaffPerformance);
router.get('/analytics/inventory', authenticateToken, getInventoryMargins);
router.get('/analytics/retention', authenticateToken, getCustomerRetention);
router.get('/analytics/popularity', authenticateToken, getPopularityAndPeakHours);

// -------------------- Admin Panel & Security Settings Routes (Module 10) --------------------
router.get('/settings', authenticateToken, getSystemSettings);
router.put('/settings', authenticateToken, requirePermission('all'), updateSystemSettings);
router.get('/settings/audit-logs', authenticateToken, requirePermission('all'), getAuditLogs);
router.get('/settings/backups', authenticateToken, requirePermission('all'), getDatabaseBackups);
router.post('/settings/backups/create', authenticateToken, requirePermission('all'), createDatabaseBackup);

// -------------------- Razorpay Payment Gateway Routes --------------------
router.get('/payment/gateway-config', authenticateToken, getGatewaySettings);
router.put('/payment/gateway-config', authenticateToken, requirePermission('all'), updateGatewaySettings);
router.post('/payment/create-order', authenticateToken, createOrder);
router.post('/payment/verify-signature', authenticateToken, verifyPayment);


export default router;
