import React, { useState, useEffect, useMemo } from 'react';
import {
  Scissors,
  Users,
  Building,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Database,
  RefreshCw,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Contact,
  Target,
  Calendar,
  Award,
  MonitorSmartphone,
  Receipt,
  Sun,
  Moon,
  Send,
  BarChart3,
  User,
  Lock
} from 'lucide-react';


import LoginView from './views/LoginView';
import UsersManagementView from './views/UsersManagementView';
import BranchesManagementView from './views/BranchesManagementView';
import PermissionsMatrixView from './views/PermissionsMatrixView';
import CustomersCRMView from './views/CustomersCRMView';
import LeadsManagementView from './views/LeadsManagementView';
import AppointmentsCalendarView from './views/AppointmentsCalendarView';
import ReceptionistView from './views/ReceptionistView';
import POSBillingView from './views/POSBillingView';
import BillingHistoryView from './views/BillingHistoryView';
import ServicesPackagesView from './views/ServicesPackagesView';
import InventoryStockManagementView from './views/InventoryStockManagementView';
import LoyaltyMembershipView from './views/LoyaltyMembershipView';
import MarketingAutomationView from './views/MarketingAutomationView';
import ReportsAnalyticsView from './views/ReportsAnalyticsView';
import StaffCustomerTrackingView from './views/StaffCustomerTrackingView';
import AdminSecuritySettingsView from './views/AdminSecuritySettingsView';
import UserProfileModal from './views/UserProfileModal';

import {
  Admin_Get_Users,
  Admin_Create_User,
  Admin_Get_Branches,
  Admin_Create_Branch,
  Admin_Update_Branch,
  Admin_Toggle_Branch_Status,
  Admin_Delete_Branch,
  Admin_Get_Roles,
  Admin_Get_Health,
  Admin_Get_Customers,
  Admin_Create_Customer,
  Admin_Update_Customer,
  Admin_Delete_Customer,
  Admin_Upload_Customer_Avatar,
  Admin_Get_Leads,
  Admin_Create_Lead,
  Admin_Update_Lead_Status,
  Admin_Update_Lead,
  Admin_Delete_Lead,
  Admin_Upload_Lead_Avatar,
  Admin_Get_Services,
  Admin_Create_Service,
  Admin_Update_Service,
  Admin_Delete_Service,
  Admin_Get_Packages,
  Admin_Create_Package,
  Admin_Update_Package,
  Admin_Delete_Package,
  Admin_Get_Categories,
  Admin_Create_Category,
  Admin_Update_Category,
  Admin_Delete_Category,
  Admin_Get_Stylists,
  Admin_Get_Appointments,
  Admin_Create_Appointment,
  Admin_Update_Appointment_Status,
  Admin_Update_Appointment,
  Admin_Delete_Appointment,
  Admin_Get_Bills,
  Admin_Create_Bill,
  Admin_Delete_Bill,
  Admin_Clear_Bills,
  Admin_Get_Products,
  Admin_Create_Product,
  Admin_Update_Product,
  Admin_Adjust_Stock,
  Admin_Delete_Product,
  Admin_Get_Suppliers,
  Admin_Create_Supplier,
  Admin_Update_Supplier,
  Admin_Delete_Supplier,
  Admin_Get_Purchase_Orders,
  Admin_Create_Purchase_Order,
  Admin_Update_Purchase_Order_Status,
  Admin_Get_Consumptions,
  Admin_Create_Consumption,
  Admin_Update_Consumption,
  Admin_Delete_Consumption,
  Admin_Update_Enrolled_Member,
  Get_Admin_Profile
} from './services/apiService';
import { BACKEND_URL } from './config/Config';


import {
  MOCK_USERS,
  MOCK_BRANCHES,
  MOCK_ROLES,
  MOCK_CATEGORIES,
  MOCK_SERVICES,
  MOCK_PACKAGES,
  MOCK_STYLISTS,
  MOCK_CUSTOMERS,
  MOCK_LEADS,
  MOCK_APPOINTMENTS,
  MOCK_BILLS
} from './mockData';

function AccessDeniedView({ role, onGoHome }) {
  return (
    <div className="glass-panel" style={{ padding: '60px 30px', textAlign: 'center', margin: '30px auto', maxWidth: '640px', borderRadius: '20px', border: '1.5px solid rgba(239,68,68,0.25)' }}>
      <div style={{ fontSize: '3.8rem', marginBottom: '16px' }}>🔒</div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ef4444', marginBottom: '12px' }}>
        Access Restricted — Permission Required
      </h2>
      <p style={{ color: 'var(--text-sub)', fontSize: '0.92rem', lineHeight: '1.75', maxWidth: '480px', margin: '0 auto 24px' }}>
        Your assigned role <span className="role-tag staff" style={{ display: 'inline-block', margin: '0 4px', textTransform: 'uppercase' }}>{role || 'User'}</span> does not have permission to access this module. Contact your Salon Admin to request access in the Permission Matrix.
      </p>
      <button onClick={onGoHome} className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem', fontWeight: '800' }}>
        Return to Executive Dashboard
      </button>
    </div>
  );
}

export const isMasterAdmin = (user) => {
  if (!user) return false;
  if (user.is_super_admin === true || user.email === 'admin@saloon.com') return true;
  const role = String(user.role || user.role_name || '').toLowerCase();
  return role === 'super admin' || role === 'superadmin';
};

export const isSalonAdmin = (user) => {
  if (!user) return false;
  if (isMasterAdmin(user)) return true;
  const role = String(user.role || user.role_name || '').toLowerCase();
  return role.includes('admin') || role.includes('owner');
};

export const isBranchScopedUser = (user) => {
  if (!user) return false;
  if (isMasterAdmin(user) || isSalonAdmin(user)) return false;
  return true;
};

export const mergeLists = (apiList = [], localList = []) => {
  if (!Array.isArray(apiList)) apiList = [];
  if (!Array.isArray(localList)) localList = [];
  const map = new Map();
  localList.forEach(item => { if (item && item.id) map.set(String(item.id), item); });
  apiList.forEach(item => { if (item && item.id) map.set(String(item.id), { ...map.get(String(item.id)), ...item }); });
  return Array.from(map.values());
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    // Only restore user if a JWT token exists — prevents auto-login after logout/cache clear
    const savedToken = localStorage.getItem('saloon_jwt_token');
    if (!savedToken) return null;

    const savedUser = localStorage.getItem('saloon_user_cache') || localStorage.getItem('saloon_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u && u.email !== 'admin@saloon.com' && !String(u.role || u.role_name || '').toLowerCase().includes('super')) {
          u.is_super_admin = false;
        }
        return u;
      } catch(e) {}
    }
    return null;
  });

  const [authToken, setAuthToken] = useState(() => localStorage.getItem('saloon_jwt_token') || null);
  // Start with authLoading=true if token exists so we validate it before rendering anything
  const [authLoading, setAuthLoading] = useState(() => !!localStorage.getItem('saloon_jwt_token'));

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('saloon_active_tab') || 'dashboard';
  });

  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('saloon_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('saloon_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('saloon_active_tab', activeTab);
    }
  }, [activeTab]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };


  // Accordion Dropdown States (Default Closed)
  const [isRbacOpen, setIsRbacOpen] = useState(false);
  const [isCrmOpen, setIsCrmOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isReceptionOpen, setIsReceptionOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);
  const [isMarketingOpen, setIsMarketingOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Receptionist POS state — which customer is being billed
  const [posCustomer, setPosCustomer] = useState(null);
  const [posStylistId, setPosStylistId] = useState(null);

  // Dynamic Permission Checker based on logged-in user and live role permissions
  const canAccess = (permKeys) => {
    if (!currentUser) return false;
    const userRoleName = currentUser.role || currentUser.role_name;
    if (userRoleName === 'Admin') return true;

    // Find live role permissions in roles state so updates apply in real time
    const matchedRole = roles.find(r => r.id === currentUser.role_id || r.name === userRoleName);
    const userPerms = matchedRole?.permissions || currentUser.permissions || [];

    if (userPerms.includes('all')) return true;

    if (Array.isArray(permKeys)) {
      return permKeys.some(k => userPerms.includes(k));
    }
    return userPerms.includes(permKeys);
  };

  // Helper function to restore state from localStorage with fallback
  const getStoredData = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error('LocalStorage Read Error:', e); }
    return fallback;
  };

  // Data States — initialized from localStorage for guaranteed refresh persistence
  const [users, setUsers] = useState(MOCK_USERS);
  const [branches, setBranches] = useState(MOCK_BRANCHES);
  const [roles, setRoles] = useState(MOCK_ROLES);
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [leads, setLeads] = useState(MOCK_LEADS);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [services, setServices] = useState(() => getStoredData('saloon_services_custom', MOCK_SERVICES));
  const [packages, setPackages] = useState(() => getStoredData('saloon_packages_custom', MOCK_PACKAGES));
  const [stylists, setStylists] = useState(MOCK_STYLISTS);
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);
  const [bills, setBills] = useState(MOCK_BILLS);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [members, setMembers] = useState(() => getStoredData('saloon_enrolled_members', []));
  const [dbStatus, setDbStatus] = useState({ connected: false, checking: true });

  const accessibleBranches = useMemo(() => {
    if (!currentUser) return [];
    if (isMasterAdmin(currentUser)) return branches;
    return branches.filter(b => 
      String(b.created_by_admin_id || b.admin_id || b.owner_id || b.created_by) === String(currentUser.id) ||
      String(b.id) === String(currentUser.branch_id)
    );
  }, [branches, currentUser]);

  const combinedStylists = useMemo(() => {
    const staffUsers = (users || []).filter(u => {
      if (!u) return false;
      const rName = String(u.role || u.role_name || '').toLowerCase();
      return rName.includes('staff') || rName.includes('stylist') || u.role_id === 4;
    }).map(u => ({
      id: u.id,
      branch_id: u.branch_id,
      admin_id: u.admin_id || u.created_by_admin_id || u.created_by_user_id,
      created_by_admin_id: u.admin_id || u.created_by_admin_id || u.created_by_user_id,
      name: u.name,
      phone: u.phone,
      specialization: u.specialization || u.designation || 'Staff Stylist',
      rating: u.rating || 5.0,
      is_available: u.is_active !== false
    }));

    const existingIds = new Set(staffUsers.map(s => String(s.id)));
    const existingNames = new Set(staffUsers.map(s => (s.name || '').toLowerCase()));

    const extraStylists = (stylists || []).filter(st => 
      st && !existingIds.has(String(st.id)) && !existingNames.has(String(st.name || '').toLowerCase())
    );

    return [...staffUsers, ...extraStylists];
  }, [users, stylists]);

  useEffect(() => {
    try {
      localStorage.setItem('saloon_enrolled_members', JSON.stringify(members));
    } catch (e) { console.error(e); }
  }, [members]);

  const handleDeductMemberCredit = (targetCustId, targetPhone, deductCount = 1) => {
    let updatedNewRem = null;
    setMembers(prevMembers => {
      const existingMember = prevMembers.find(m => {
        const matchesId = targetCustId && String(m.customer_id || m.id) === String(targetCustId);
        const matchesPhone = targetPhone && m.phone && String(m.phone).replace(/\D/g, '').slice(-10) === String(targetPhone).replace(/\D/g, '').slice(-10);
        return matchesId || matchesPhone;
      });

      if (existingMember) {
        const curRem = Number(existingMember.remaining_service_credit) || 0;
        const curUsed = Number(existingMember.used_service_credit) || 0;
        const newRem = Math.max(0, curRem - deductCount);
        const newUsed = curUsed + deductCount;
        updatedNewRem = newRem;

        const nextMembers = prevMembers.map(m => {
          if (m === existingMember || (targetCustId && String(m.customer_id || m.id) === String(targetCustId))) {
            if (m.id) {
              Admin_Update_Enrolled_Member(m.id, {
                remaining_service_credit: newRem,
                used_service_credit: newUsed
              }).catch(() => null);
            }
            return {
              ...m,
              remaining_service_credit: newRem,
              used_service_credit: newUsed
            };
          }
          return m;
        });

        try { localStorage.setItem('saloon_enrolled_members', JSON.stringify(nextMembers)); } catch (e) {}
        return nextMembers;
      }
      return prevMembers;
    });

    setCustomers(prevCustomers => {
      const nextCusts = prevCustomers.map(c => {
        const matchesId = targetCustId && String(c.id) === String(targetCustId);
        const matchesPhone = targetPhone && c.phone && String(c.phone).replace(/\D/g, '').slice(-10) === String(targetPhone).replace(/\D/g, '').slice(-10);
        if ((matchesId || matchesPhone) && updatedNewRem !== null) {
          return {
            ...c,
            remaining_service_credit: updatedNewRem
          };
        }
        return c;
      });

      try { localStorage.setItem('saloon_customers_custom', JSON.stringify(nextCusts)); } catch (e) {}
      return nextCusts;
    });
  };

  // Sync state to localStorage whenever services or packages change
  useEffect(() => {
    try {
      localStorage.setItem('saloon_services_custom', JSON.stringify(services));
    } catch (e) { console.error(e); }
  }, [services]);

  useEffect(() => {
    try {
      localStorage.setItem('saloon_packages_custom', JSON.stringify(packages));
    } catch (e) { console.error(e); }
  }, [packages]);

  const fetchModuleData = async () => {
    setDbStatus(prev => ({ ...prev, checking: true }));
    try {
      // 1. Check PostgreSQL DB Health
      const healthRes = await Admin_Get_Health().catch(() => null);
      if (healthRes?.data?.status === 'online') {
        setDbStatus({ connected: true, checking: false });
      } else {
        setDbStatus({ connected: false, checking: false });
      }

      // 2. Fetch Module 1 Users, Roles, Branches Data
      const usersRes = await Admin_Get_Users().catch(() => null);
      if (usersRes?.data?.data && usersRes.data.data.length > 0) setUsers(usersRes.data.data);

      const branchesRes = await Admin_Get_Branches().catch(() => null);
      if (branchesRes?.data?.data && branchesRes.data.data.length > 0) setBranches(branchesRes.data.data);

      const rolesRes = await Admin_Get_Roles().catch(() => null);
      if (rolesRes?.data?.data && rolesRes.data.data.length > 0) setRoles(rolesRes.data.data);

      // 3. Fetch Module 2 CRM & Lead Data
      const custRes = await Admin_Get_Customers().catch(() => null);
      if (custRes?.data?.data && custRes.data.data.length > 0) setCustomers(custRes.data.data);

      const leadsRes = await Admin_Get_Leads().catch(() => null);
      if (leadsRes?.data?.data && leadsRes.data.data.length > 0) setLeads(leadsRes.data.data);

      // 4. Fetch Module 4 Services, Packages & Categories Data (Sync with DB if API live)
      const catRes = await Admin_Get_Categories().catch(() => null);
      if (catRes?.data?.data && Array.isArray(catRes.data.data)) {
        setCategories(catRes.data.data);
      }

      const servRes = await Admin_Get_Services().catch(() => null);
      if (servRes?.data?.data && Array.isArray(servRes.data.data)) {
        setServices(servRes.data.data);
      }

      const pkgRes = await Admin_Get_Packages().catch(() => null);
      if (pkgRes?.data?.data && Array.isArray(pkgRes.data.data)) {
        setPackages(pkgRes.data.data);
      }

      const stRes = await Admin_Get_Stylists().catch(() => null);
      if (stRes?.data?.data && stRes.data.data.length > 0) setStylists(stRes.data.data);

      const appRes = await Admin_Get_Appointments().catch(() => null);
      if (appRes?.data?.data && appRes.data.data.length > 0) setAppointments(appRes.data.data);

      const billsRes = await Admin_Get_Bills().catch(() => null);
      if (billsRes?.data?.data && billsRes.data.data.length > 0) setBills(billsRes.data.data);

      // 5. Fetch Module 6 Inventory, Suppliers, POs & Consumption Data
      const prodRes = await Admin_Get_Products().catch(() => null);
      if (prodRes?.data?.data && Array.isArray(prodRes.data.data)) setProducts(prodRes.data.data);

      const suppRes = await Admin_Get_Suppliers().catch(() => null);
      if (suppRes?.data?.data && Array.isArray(suppRes.data.data)) setSuppliers(suppRes.data.data);

      const poRes = await Admin_Get_Purchase_Orders().catch(() => null);
      if (poRes?.data?.data && Array.isArray(poRes.data.data)) setPurchaseOrders(poRes.data.data);

      const consRes = await Admin_Get_Consumptions().catch(() => null);
      if (consRes?.data?.data && Array.isArray(consRes.data.data)) setConsumptions(consRes.data.data);

    } catch (err) {
      console.error('API Fetch Error:', err);
      setDbStatus({ connected: false, checking: false });
    }
  };

  // ─── Helper: safely decode JWT token payload (base64url → JSON) ───
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      // base64url uses - and _ instead of + and /
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      // Pad to multiple of 4
      const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
      return JSON.parse(atob(padded));
    } catch (e) {
      return null;
    }
  };

  // ─── Restore user session on page refresh ───
  useEffect(() => {
    const savedToken = localStorage.getItem('saloon_jwt_token');

    if (!savedToken) {
      // No token at all — user is definitely logged out, show login
      setCurrentUser(null);
      setAuthLoading(false);
      return;
    }

    // STEP 1: Decode JWT locally — immediate, no network needed
    const tokenPayload = decodeJWT(savedToken);

    // STEP 2: Check token expiry
    const now = Math.floor(Date.now() / 1000);
    if (tokenPayload && tokenPayload.exp && tokenPayload.exp < now) {
      // Token genuinely expired — force logout
      localStorage.removeItem('saloon_jwt_token');
      localStorage.removeItem('saloon_user_cache');
      localStorage.removeItem('saloon_user');
      localStorage.removeItem('saloon_active_tab');
      setCurrentUser(null);
      setAuthToken(null);
      setAuthLoading(false);
      return;
    }

    // STEP 3: Token is valid — use cached user data (already set in useState initializer)
    // Now try to refresh from API in background
    Get_Admin_Profile()
      .then(res => {
        if (res?.data?.data) {
          const freshUser = res.data.data;
          setCurrentUser(freshUser);
          localStorage.setItem('saloon_user_cache', JSON.stringify(freshUser));
        }
      })
      .catch(() => {
        // API unavailable — cached session is already set from useState, keep it
        console.warn('API unavailable on refresh — using cached session');
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const filterByBranch = (list) => {
    if (!list || !Array.isArray(list)) return [];
    if (!currentUser) return list;

    const isMaster = isMasterAdmin(currentUser);
    const isScoped = isBranchScopedUser(currentUser);
    const isOwner = isSalonAdmin(currentUser) && !isMaster;

    // 1. Super Admin sees everything
    if (isMaster) {
      if (selectedBranchId !== 'all') {
        return list.filter(item => item && String(item.branch_id) === String(selectedBranchId));
      }
      return list;
    }

    // 2. Branch-Scoped User (Manager, Receptionist, Staff)
    if (isScoped) {
      const userBranchId = String(currentUser.branch_id || '');
      return list.filter(item => {
        if (!item) return false;
        if (selectedBranchId !== 'all' && String(item.branch_id) !== String(selectedBranchId)) {
          return false;
        }
        return String(item.branch_id) === userBranchId;
      });
    }

    // 3. Salon Admin (Salon Owner)
    if (isOwner) {
      const currentAdminId = String(currentUser.id);
      const myBranchIds = new Set(accessibleBranches.map(b => String(b.id)));

      return list.filter(item => {
        if (!item) return false;

        // Hide Super Admin items / accounts
        if (item.is_super_admin || item.email === 'admin@saloon.com') return false;

        // Check explicit admin creator ID
        const itemAdminId = item.created_by_admin_id || item.admin_id || item.created_by_user_id || item.created_by;
        if (itemAdminId) {
          if (String(itemAdminId) !== currentAdminId) {
            return false; // Belongs to another admin!
          }
          if (selectedBranchId !== 'all' && String(item.branch_id) !== String(selectedBranchId)) {
            return false;
          }
          return true;
        }

        // If item has a branch_id, check if it belongs to one of owner's branches
        if (item.branch_id && myBranchIds.has(String(item.branch_id))) {
          if (selectedBranchId !== 'all' && String(item.branch_id) !== String(selectedBranchId)) {
            return false;
          }
          return true;
        }

        // Default mock/unknown items without admin_id or matching branch: hide for regular admin
        return false;
      });
    }

    return list;
  };

  useEffect(() => {
    if (currentUser) {
      if (isBranchScopedUser(currentUser) && currentUser.branch_id) {
        setSelectedBranchId(currentUser.branch_id);
      }
      fetchModuleData();
    }
  }, [authToken, currentUser]);

  const handleLoginSuccess = (loginData) => {
    const user = loginData.user;
    setCurrentUser(user);
    setAuthToken(loginData.token);
    localStorage.setItem('saloon_jwt_token', loginData.token);
    // Cache user data for instant session restore on refresh
    localStorage.setItem('saloon_user_cache', JSON.stringify(user));

    if (isSalonAdmin(user)) {
      setSelectedBranchId('all');
    } else if (user?.branch_id) {
      setSelectedBranchId(user.branch_id);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    // Clear ALL auth-related keys so refresh always goes to login
    localStorage.removeItem('saloon_jwt_token');
    localStorage.removeItem('saloon_user_cache');
    localStorage.removeItem('saloon_user');
    localStorage.removeItem('saloon_active_tab');
  };

  const handleAddUser = async (newUser) => {
    const curAdminId = currentUser ? String(currentUser.admin_id || currentUser.id) : null;
    const userPayload = {
      ...newUser,
      admin_id: newUser.admin_id || curAdminId,
      created_by_admin_id: newUser.created_by_admin_id || curAdminId,
      created_by_user_id: currentUser?.id
    };
    try {
      const res = await Admin_Create_User(userPayload).catch(() => null);
      let createdItem = res?.data?.data || res?.data;
      if (createdItem && createdItem.id) {
        if (!createdItem.admin_id && curAdminId) createdItem.admin_id = curAdminId;
        if (!createdItem.created_by_admin_id && curAdminId) createdItem.created_by_admin_id = curAdminId;
        setUsers(prev => [createdItem, ...prev.filter(u => String(u.id) !== String(createdItem.id))]);
        return createdItem;
      }
      const roleObj = roles.find(r => r.id === userPayload.role_id) || { name: userPayload.role || 'Staff' };
      const fallbackUser = {
        id: Date.now(),
        ...userPayload,
        role: roleObj.name,
        role_name: roleObj.name,
        is_active: true,
        created_at: new Date().toISOString()
      };
      setUsers(prev => [fallbackUser, ...prev]);
      return fallbackUser;
    } catch (e) {
      console.error('Failed to create user:', e);
      const roleObj = roles.find(r => r.id === userPayload.role_id) || { name: userPayload.role || 'Staff' };
      const fallbackUser = {
        id: Date.now(),
        ...userPayload,
        role: roleObj.name,
        role_name: roleObj.name,
        is_active: true,
        created_at: new Date().toISOString()
      };
      setUsers(prev => [fallbackUser, ...prev]);
      return fallbackUser;
    }
  };

  const handleAddBranch = async (newBranch) => {
    try {
      const res = await Admin_Create_Branch(newBranch).catch(() => null);
      if (res?.data?.data) {
        const created = res.data.data;
        setBranches(prev => [created, ...prev]);
        return created;
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateBranch = async (id, branchData) => {
    try {
      const res = await Admin_Update_Branch(id, branchData).catch(() => null);
      if (res?.data?.data) {
        const updated = res.data.data;
        setBranches(prev => prev.map(b => b.id === id ? updated : b));
        return updated;
      }
    } catch (e) { console.error(e); }
  };

  const handleToggleBranchStatus = async (id) => {
    try {
      const res = await Admin_Toggle_Branch_Status(id).catch(() => null);
      if (res?.data?.data) {
        setBranches(prev => prev.map(b => b.id === id ? res.data.data : b));
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteBranch = async (id) => {
    try {
      await Admin_Delete_Branch(id).catch(() => null);
      setBranches(prev => prev.filter(b => b.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleAddCustomer = async (newCust, avatarFile) => {
    const curAdminId = currentUser ? String(currentUser.admin_id || currentUser.id) : null;
    const custPayload = {
      ...newCust,
      admin_id: newCust.admin_id || curAdminId,
      created_by_admin_id: newCust.created_by_admin_id || curAdminId,
      created_by_user_id: currentUser?.id
    };
    const localPreview = avatarFile ? URL.createObjectURL(avatarFile) : null;
    try {
      const res = await Admin_Create_Customer(custPayload).catch(() => null);
      let customer = res?.data?.data || res?.data;
      if (!customer || typeof customer.name === 'number' || customer.name === 1 || customer.name === '1' || !customer.name) {
        customer = { id: Date.now(), ...custPayload, avatar_url: localPreview };
      } else {
        customer = { ...customer, ...custPayload, name: custPayload.name || customer.name, avatar_url: customer.avatar_url || localPreview };
      }
      if (avatarFile && customer.id) {
        const avatarRes = await Admin_Upload_Customer_Avatar(customer.id, avatarFile).catch(() => null);
        const uploadedUrl = avatarRes?.data?.avatarUrl || avatarRes?.data?.data?.avatar_url;
        if (uploadedUrl && typeof uploadedUrl === 'string') {
          customer = { ...customer, avatar_url: uploadedUrl };
        }
      }
      if (!customer.admin_id && curAdminId) customer.admin_id = curAdminId;
      if (!customer.created_by_admin_id && curAdminId) customer.created_by_admin_id = curAdminId;
      setCustomers(prev => [customer, ...prev.filter(c => String(c.id) !== String(customer.id))]);
      return customer;
    } catch (e) {
      console.error(e);
      const fallback = { id: Date.now(), ...custPayload, avatar_url: localPreview };
      setCustomers(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  const handleUpdateCustomer = async (id, custData, avatarFile) => {
    const localPreview = avatarFile ? URL.createObjectURL(avatarFile) : null;
    try {
      const res = await Admin_Update_Customer(id, custData).catch(() => null);
      let customer = res?.data?.data || res?.data || { id, ...custData };
      if (localPreview && !customer.avatar_url) {
        customer.avatar_url = localPreview;
      }
      if (avatarFile && id) {
        const avatarRes = await Admin_Upload_Customer_Avatar(id, avatarFile).catch(() => null);
        const uploadedUrl = avatarRes?.data?.avatarUrl || avatarRes?.data?.data?.avatar_url;
        if (uploadedUrl && typeof uploadedUrl === 'string') {
          customer = { ...customer, avatar_url: uploadedUrl };
        }
      }
      setCustomers(prev => prev.map(c => String(c.id) === String(id) ? { ...c, ...customer } : c));
      return customer;
    } catch (e) {
      console.error(e);
      const updated = { id, ...custData, ...(localPreview ? { avatar_url: localPreview } : {}) };
      setCustomers(prev => prev.map(c => String(c.id) === String(id) ? { ...c, ...updated } : c));
      return updated;
    }
  };

  const handleDeleteCustomer = async (id) => {
    try {
      await Admin_Delete_Customer(id).catch(() => null);
    } catch (e) { console.error(e); }
    setCustomers(prev => prev.filter(c => String(c.id) !== String(id)));
  };

  const handleAddLead = async (leadData, avatarFile) => {
    const localPreview = avatarFile ? URL.createObjectURL(avatarFile) : null;
    try {
      const res = await Admin_Create_Lead(leadData).catch(() => null);
      let created = res?.data?.data || res?.data || { id: Date.now(), ...leadData, status: leadData.status || 'New', avatar_url: localPreview };
      if (!created.avatar_url && localPreview) {
        created.avatar_url = localPreview;
      }
      if (avatarFile && created.id) {
        const upRes = await Admin_Upload_Lead_Avatar(created.id, avatarFile).catch(() => null);
        const uploadedUrl = upRes?.data?.avatarUrl || upRes?.data?.data?.avatar_url;
        if (uploadedUrl) {
          created = { ...created, avatar_url: uploadedUrl };
        }
      }
      setLeads(prev => [created, ...prev.filter(l => String(l.id) !== String(created.id))]);
      return created;
    } catch (e) {
      console.error("Create Lead Error:", e);
      const fallback = { id: Date.now(), ...leadData, status: leadData.status || 'New', avatar_url: localPreview };
      setLeads(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  const handleUpdateLeadStatus = async (id, status) => {
    try {
      await Admin_Update_Lead_Status(id, status).catch(() => null);
    } catch (e) { console.error("Update Status Error:", e); }
    setLeads(prev => prev.map(l => String(l.id) === String(id) ? { ...l, status } : l));
  };

  const handleUpdateLead = async (id, leadData, avatarFile) => {
    const localPreview = avatarFile ? URL.createObjectURL(avatarFile) : null;
    try {
      const res = await Admin_Update_Lead(id, leadData).catch(() => null);
      let updated = res?.data?.data || res?.data || { id, ...leadData };
      if (localPreview && !updated.avatar_url) {
        updated.avatar_url = localPreview;
      }
      if (avatarFile && id) {
        const upRes = await Admin_Upload_Lead_Avatar(id, avatarFile).catch(() => null);
        const uploadedUrl = upRes?.data?.avatarUrl || upRes?.data?.data?.avatar_url;
        if (uploadedUrl) {
          updated = { ...updated, avatar_url: uploadedUrl };
        }
      }
      setLeads(prev => prev.map(l => String(l.id) === String(id) ? { ...l, ...updated } : l));
      return updated;
    } catch (e) {
      console.error("Update Lead Error:", e);
      const updated = { id, ...leadData, ...(localPreview ? { avatar_url: localPreview } : {}) };
      setLeads(prev => prev.map(l => String(l.id) === String(id) ? { ...l, ...updated } : l));
      return updated;
    }
  };

  const handleDeleteLead = async (id) => {
    try {
      await Admin_Delete_Lead(id).catch(() => null);
    } catch (e) { console.error("Delete Lead Error:", e); }
    setLeads(prev => prev.filter(l => String(l.id) !== String(id)));
  };

  // Handlers for Module 4 Service & Package Management
  const handleAddService = async (serviceData) => {
    let newItem = null;
    try {
      const res = await Admin_Create_Service(serviceData).catch(() => null);
      newItem = res?.data?.data || res?.data || { id: Date.now(), ...serviceData, is_active: true };
    } catch (e) {
      console.error("Create Service Error:", e);
      newItem = { id: Date.now(), ...serviceData, is_active: true };
    }
    setServices(prev => {
      const updated = [newItem, ...prev];
      try { localStorage.setItem('saloon_services_custom', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    return newItem;
  };

  const handleUpdateService = async (id, serviceData) => {
    try {
      const res = await Admin_Update_Service(id, serviceData).catch(() => null);
      const updatedItem = res?.data?.data || res?.data || serviceData;
      setServices(prev => {
        const updated = prev.map(s => String(s.id) === String(id) ? { ...s, ...updatedItem } : s);
        try { localStorage.setItem('saloon_services_custom', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    } catch (e) {
      console.error("Update Service Error:", e);
    }
  };

  const handleDeleteService = async (id) => {
    try {
      await Admin_Delete_Service(id).catch(() => null);
    } catch (e) {
      console.error("Delete Service Error:", e);
    }
    setServices(prev => {
      const updated = prev.filter(s => String(s.id) !== String(id));
      try { localStorage.setItem('saloon_services_custom', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const handleAddPackage = async (packageData) => {
    let newItem = null;
    try {
      const res = await Admin_Create_Package(packageData).catch(() => null);
      newItem = res?.data?.data || res?.data || { id: Date.now(), ...packageData, is_active: true };
    } catch (e) {
      console.error("Create Package Error:", e);
      newItem = { id: Date.now(), ...packageData, is_active: true };
    }
    setPackages(prev => {
      const updated = [newItem, ...prev];
      try { localStorage.setItem('saloon_packages_custom', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    return newItem;
  };

  const handleUpdatePackage = async (id, packageData) => {
    try {
      const res = await Admin_Update_Package(id, packageData).catch(() => null);
      const updatedItem = res?.data?.data || res?.data || packageData;
      setPackages(prev => {
        const updated = prev.map(p => String(p.id) === String(id) ? { ...p, ...updatedItem } : p);
        try { localStorage.setItem('saloon_packages_custom', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    } catch (e) {
      console.error("Update Package Error:", e);
    }
  };

  const handleDeletePackage = async (id) => {
    try {
      await Admin_Delete_Package(id).catch(() => null);
    } catch (e) {
      console.error("Delete Package Error:", e);
    }
    setPackages(prev => {
      const updated = prev.filter(p => String(p.id) !== String(id));
      try { localStorage.setItem('saloon_packages_custom', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  // Handlers for Module 4 Dynamic Category Management
  const handleAddCategory = async (categoryData) => {
    let newItem = null;
    try {
      const res = await Admin_Create_Category(categoryData).catch(() => null);
      newItem = res?.data?.data || res?.data || { id: Date.now(), ...categoryData };
    } catch (e) {
      console.error("Create Category Error:", e);
      newItem = { id: Date.now(), ...categoryData };
    }
    setCategories(prev => [...prev, newItem]);
    return newItem;
  };

  const handleUpdateCategory = async (id, categoryData) => {
    try {
      const res = await Admin_Update_Category(id, categoryData).catch(() => null);
      const updatedItem = res?.data?.data || res?.data || categoryData;
      setCategories(prev => prev.map(c => String(c.id) === String(id) ? { ...c, ...updatedItem } : c));
    } catch (e) {
      console.error("Update Category Error:", e);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await Admin_Delete_Category(id).catch(() => null);
    } catch (e) {
      console.error("Delete Category Error:", e);
    }
    setCategories(prev => prev.filter(c => String(c.id) !== String(id)));
  };

  // Handlers for Module 3 Booking & Receptionist Queue
  const handleAddAppointment = async (newApp) => {
    const normalizeDateStr = (d) => {
      if (!d) return '';
      const str = String(d).trim();
      if (str.includes('T')) return str.split('T')[0];
      if (str.includes(' ')) return str.split(' ')[0];
      return str;
    };
    const normalizeHourStr = (t) => {
      if (!t) return '';
      const match = String(t).match(/(\d{1,2})/);
      return match ? match[1].padStart(2, '0') : '';
    };

    const targetDate = normalizeDateStr(newApp.appointment_date || new Date().toISOString().split('T')[0]);
    const targetTimeHour = normalizeHourStr(newApp.appointment_time || '10:00');
    const targetStylistId = newApp.stylist_id;

    // Double-booking prevention check
    const isConflict = appointments.some(a => {
      if (String(a.status || '').toLowerCase() === 'cancelled') return false;
      const aDate = normalizeDateStr(a.appointment_date);
      const aHour = normalizeHourStr(a.appointment_time);
      const isStylistMatch = String(a.stylist_id) === String(targetStylistId) ||
        (a.stylist_name && combinedStylists.some(s => String(s.id) === String(targetStylistId) && String(a.stylist_name).toLowerCase().trim() === String(s.name).toLowerCase().trim())) ||
        (filterByBranch(combinedStylists).length === 1);
      return aDate === targetDate && aHour === targetTimeHour && isStylistMatch;
    });

    if (isConflict) {
      alert(`⚠️ Cannot book appointment: Staff member is ALREADY BOOKED for ${targetDate} at ${newApp.appointment_time}. Double booking is blocked.`);
      return null;
    }

    const curAdminId = currentUser ? String(currentUser.admin_id || currentUser.id) : null;
    const appWithAdmin = {
      ...newApp,
      admin_id: newApp.admin_id || curAdminId,
      created_by_admin_id: newApp.created_by_admin_id || curAdminId,
      created_by_user_id: currentUser?.id
    };
    let newItem = null;
    try {
      const res = await Admin_Create_Appointment(appWithAdmin).catch(() => null);
      if (res?.data?.status === 'error' || res?.status === 400) {
        alert(res?.data?.message || 'Double booking error');
        return null;
      }
      newItem = res?.data?.data || res?.data || { id: Date.now(), ...appWithAdmin, status: appWithAdmin.status || 'Confirmed' };
      if (!newItem.admin_id && curAdminId) newItem.admin_id = curAdminId;
      if (!newItem.created_by_admin_id && curAdminId) newItem.created_by_admin_id = curAdminId;
    } catch (e) {
      console.error(e);
      newItem = { id: Date.now(), ...appWithAdmin, status: appWithAdmin.status || 'Confirmed' };
    }
    setAppointments(prev => [newItem, ...prev]);
    return newItem;
  };

  const handleUpdateAppointment = async (id, appData) => {
    try {
      const res = await Admin_Update_Appointment(id, appData).catch(() => null);
      const updatedItem = res?.data?.data || res?.data || appData;
      setAppointments(prev => prev.map(a => String(a.id) === String(id) ? { ...a, ...updatedItem } : a));
    } catch (e) { console.error(e); }
  };

  const handleUpdateAppointmentStatus = async (id, status) => {
    try {
      await Admin_Update_Appointment_Status(id, status).catch(() => null);
    } catch (e) { console.error(e); }
    setAppointments(prev => prev.map(a => String(a.id) === String(id) ? { ...a, status } : a));
  };

  const handleDeleteAppointment = async (id) => {
    try {
      await Admin_Delete_Appointment(id).catch(() => null);
    } catch (e) { console.error(e); }
    setAppointments(prev => prev.filter(a => String(a.id) !== String(id)));
  };

  // POS & Billing Handlers
  const handleStartPOS = (customer, stylistId) => {
    setPosCustomer(customer);
    setPosStylistId(stylistId || null);
    setActiveTab('pos_billing');
  };

  const handlePOSBack = () => {
    setPosCustomer(null);
    setPosStylistId(null);
    setActiveTab('reception_checkin');
  };

  const handleCreateBill = async (billData) => {
    let createdBill = null;
    try {
      const res = await Admin_Create_Bill(billData).catch(() => null);
      createdBill = res?.data?.data || res?.data || { id: Date.now(), bill_number: `INV-${Date.now()}`, ...billData, created_at: new Date().toISOString() };
    } catch (e) {
      console.error(e);
      createdBill = { id: Date.now(), bill_number: `INV-${Date.now()}`, ...billData, created_at: new Date().toISOString() };
    }

    setBills(prev => {
      const updated = [createdBill, ...prev];
      try { localStorage.setItem('saloon_bills_custom', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    Admin_Get_Appointments().then(appRes => {
      if (appRes?.data?.data) setAppointments(appRes.data.data);
    }).catch(() => null);

    Admin_Get_Customers().then(custRes => {
      if (custRes?.data?.data) setCustomers(custRes.data.data);
    }).catch(() => null);

    return createdBill;
  };

  const handleDeleteBill = async (billId) => {
    try {
      await Admin_Delete_Bill(billId).catch(() => null);
    } catch (e) { console.error(e); }
    setBills(prev => prev.filter(b => String(b.id) !== String(billId)));
  };

  const handleClearBills = async () => {
    try {
      await Admin_Clear_Bills().catch(() => null);
    } catch (e) { console.error(e); }
    setBills([]);
    localStorage.setItem('saloon_bills_cleared', 'true');
    localStorage.removeItem('saloon_bills_custom');
  };

  // Module 6 Inventory Handlers
  const handleAddProduct = async (productData) => {
    try {
      const res = await Admin_Create_Product(productData);
      if (res?.data?.data) setProducts(prev => [res.data.data, ...prev]);
    } catch (e) { console.error('Create Product Error:', e); }
  };

  const handleUpdateProduct = async (id, productData) => {
    try {
      const res = await Admin_Update_Product(id, productData);
      if (res?.data?.data) setProducts(prev => prev.map(p => p.id === id ? res.data.data : p));
    } catch (e) { console.error('Update Product Error:', e); }
  };

  const handleAdjustStock = async (id, changeQty, reason, notes) => {
    try {
      const res = await Admin_Adjust_Stock(id, { change_qty: changeQty, reason, notes });
      if (res?.data?.data) {
        setProducts(prev => prev.map(p => p.id === id ? res.data.data : p));
      }
    } catch (e) { console.error('Adjust Stock Error:', e); }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await Admin_Delete_Product(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) { console.error('Delete Product Error:', e); }
  };

  const handleAddSupplier = async (supplierData) => {
    try {
      const res = await Admin_Create_Supplier(supplierData);
      if (res?.data?.data) setSuppliers(prev => [res.data.data, ...prev]);
    } catch (e) { console.error('Create Supplier Error:', e); }
  };

  const handleUpdateSupplier = async (id, supplierData) => {
    try {
      const res = await Admin_Update_Supplier(id, supplierData);
      if (res?.data?.data) setSuppliers(prev => prev.map(s => s.id === id ? res.data.data : s));
    } catch (e) { console.error('Update Supplier Error:', e); }
  };

  const handleDeleteSupplier = async (id) => {
    try {
      await Admin_Delete_Supplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
    } catch (e) { console.error('Delete Supplier Error:', e); }
  };

  const handleAddPurchaseOrder = async (poData) => {
    try {
      const res = await Admin_Create_Purchase_Order(poData);
      if (res?.data?.data) setPurchaseOrders(prev => [res.data.data, ...prev]);
    } catch (e) { console.error('Create PO Error:', e); }
  };

  const handleUpdatePOStatus = async (id, status) => {
    try {
      const res = await Admin_Update_Purchase_Order_Status(id, { status });
      if (res?.data?.data) setPurchaseOrders(prev => prev.map(po => po.id === id ? res.data.data : po));
    } catch (e) { console.error('Update PO Status Error:', e); }
  };

  const handleAddConsumption = async (consData) => {
    try {
      const res = await Admin_Create_Consumption(consData);
      if (res?.data?.data) setConsumptions(prev => [res.data.data, ...prev]);
    } catch (e) { console.error('Create Consumption Error:', e); }
  };

  const handleUpdateConsumption = async (id, consData) => {
    try {
      const res = await Admin_Update_Consumption(id, consData);
      if (res?.data?.data) setConsumptions(prev => prev.map(c => c.id === id ? res.data.data : c));
    } catch (e) { console.error('Update Consumption Error:', e); }
  };

  const handleDeleteConsumption = async (id) => {
    try {
      await Admin_Delete_Consumption(id);
      setConsumptions(prev => prev.filter(c => c.id !== id));
    } catch (e) { console.error('Delete Consumption Error:', e); }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-main)', fontFamily: 'sans-serif' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
      </div>
    );
  }

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} theme={theme} onToggleTheme={toggleTheme} />;
  }

  const activeBranchId = selectedBranchId !== 'all'
    ? selectedBranchId
    : (currentUser?.branch_id || (accessibleBranches && accessibleBranches[0]?.id) || (branches && branches[0]?.id) || 1);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="brand-header">
            <div className="brand-icon">
              <Scissors size={22} />
            </div>
            <div className="brand-title">
              <h2>SalonPulse</h2>
              <span>ERP & CRM Portal</span>
            </div>
          </div>

          <div className="nav-section-title">Navigation Menu</div>
          <nav className="nav-links">
            <button
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <LayoutDashboard size={18} /> Executive Dashboard
              </div>
            </button>

            {/* Dropdown 1: User Roles & RBAC (Module 1) */}
            {canAccess(['manage_users', 'manage_branches', 'manage_permissions']) && (
              <div style={{ marginTop: '4px' }}>
                <button
                  className={`nav-dropdown-toggle ${isRbacOpen ? 'open' : ''} ${['users', 'branches', 'matrix'].includes(activeTab) ? 'active' : ''}`}
                  onClick={() => setIsRbacOpen(!isRbacOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldCheck size={17} style={{ color: ['users', 'branches', 'matrix'].includes(activeTab) ? 'var(--accent-gold)' : 'var(--text-sub)' }} />
                    <span>User Roles & RBAC</span>
                  </div>
                  {isRbacOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                {isRbacOpen && (
                  <div className="nav-dropdown-menu">
                    {canAccess('manage_users') && (
                      <button className={`sub-nav-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        <Users size={14} /> User & Staff RBAC ({users.length})
                      </button>
                    )}
                    {canAccess('manage_branches') && (
                      <button className={`sub-nav-btn ${activeTab === 'branches' ? 'active' : ''}`} onClick={() => setActiveTab('branches')}>
                        <Building size={14} /> Multi-Branch Control ({branches.length})
                      </button>
                    )}
                    {canAccess('manage_permissions') && (
                      <button className={`sub-nav-btn ${activeTab === 'matrix' ? 'active' : ''}`} onClick={() => setActiveTab('matrix')}>
                        <ShieldCheck size={14} /> Permission Matrix
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dropdown 2: CRM & Lead System (Module 2) */}
            {canAccess('view_customers') && (
              <div style={{ marginTop: '4px' }}>
                <button
                  className={`nav-dropdown-toggle ${isCrmOpen ? 'open' : ''} ${['customers', 'leads'].includes(activeTab) ? 'active' : ''}`}
                  onClick={() => setIsCrmOpen(!isCrmOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Contact size={17} style={{ color: ['customers', 'leads'].includes(activeTab) ? 'var(--accent-gold)' : 'var(--text-sub)' }} />
                    <span>CRM & Lead System</span>
                  </div>
                  {isCrmOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                {isCrmOpen && (
                  <div className="nav-dropdown-menu">
                    <button className={`sub-nav-btn ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
                      <Users size={14} /> Customer Profiles ({customers.length})
                    </button>
                    <button className={`sub-nav-btn ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => setActiveTab('leads')}>
                      <Target size={14} /> Lead Pipeline ({leads.length})
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Dropdown 3: Services & Packages (Module 4) */}
            {canAccess(['manage_services', 'manage_packages']) && (
              <div style={{ marginTop: '4px' }}>
                <button
                  className={`nav-dropdown-toggle ${isServicesOpen ? 'open' : ''} ${['services_packages'].includes(activeTab) ? 'active' : ''}`}
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Scissors size={17} style={{ color: ['services_packages'].includes(activeTab) ? 'var(--accent-gold)' : 'var(--text-sub)' }} />
                    <span>Services & Packages</span>
                  </div>
                  {isServicesOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                {isServicesOpen && (
                  <div className="nav-dropdown-menu">
                    <button className={`sub-nav-btn ${activeTab === 'services_packages' ? 'active' : ''}`} onClick={() => setActiveTab('services_packages')}>
                      <Scissors size={14} /> Catalog & Combos ({services.length + packages.length})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dropdown 4: Appointments & Booking (Module 3) */}
            {canAccess('manage_appointments') && (
              <div style={{ marginTop: '4px' }}>
                <button
                  className={`nav-dropdown-toggle ${isBookingOpen ? 'open' : ''} ${['appointments'].includes(activeTab) ? 'active' : ''}`}
                  onClick={() => setIsBookingOpen(!isBookingOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar size={17} style={{ color: ['appointments'].includes(activeTab) ? 'var(--accent-gold)' : 'var(--text-sub)' }} />
                    <span>Booking & Calendar</span>
                  </div>
                  {isBookingOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                {isBookingOpen && (
                  <div className="nav-dropdown-menu">
                    <button className={`sub-nav-btn ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
                      <Calendar size={14} /> Booking Calendar ({appointments.length})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dropdown 5: Receptionist Console */}
            {canAccess(['manage_appointments', 'manage_billing', 'view_reports', 'manage_finances']) && (
              <div style={{ marginTop: '4px' }}>
                <button
                  className={`nav-dropdown-toggle ${isReceptionOpen ? 'open' : ''} ${['reception_checkin', 'pos_billing', 'billing_history'].includes(activeTab) ? 'active' : ''}`}
                  onClick={() => setIsReceptionOpen(!isReceptionOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MonitorSmartphone size={17} style={{ color: ['reception_checkin', 'pos_billing', 'billing_history'].includes(activeTab) ? 'var(--accent-gold)' : 'var(--text-sub)' }} />
                    <span>Receptionist Console</span>
                  </div>
                  {isReceptionOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                {isReceptionOpen && (
                  <div className="nav-dropdown-menu">
                    {canAccess(['manage_appointments', 'manage_billing']) && (
                      <button className={`sub-nav-btn ${activeTab === 'reception_checkin' ? 'active' : ''}`} onClick={() => { setPosCustomer(null); setPosStylistId(null); setActiveTab('reception_checkin'); }}>
                        <UserCheck size={14} /> Walk-in Check-in
                      </button>
                    )}
                    {canAccess('manage_billing') && (
                      <button className={`sub-nav-btn ${activeTab === 'pos_billing' ? 'active' : ''}`} onClick={() => { setPosCustomer(null); setPosStylistId(null); setActiveTab('pos_billing'); }}>
                        <Receipt size={14} /> POS Terminal Billing
                      </button>
                    )}
                    {canAccess(['manage_billing', 'view_reports', 'manage_finances']) && (
                      <button className={`sub-nav-btn ${activeTab === 'billing_history' ? 'active' : ''}`} onClick={() => setActiveTab('billing_history')}>
                        <Receipt size={14} /> Billing History ({bills.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dropdown 6: Inventory & Product Stock (Module 6) */}
            {canAccess(['manage_inventory', 'all']) && (
              <div style={{ marginTop: '4px' }}>
                <button
                  className={`nav-dropdown-toggle ${isInventoryOpen ? 'open' : ''} ${['inventory'].includes(activeTab) ? 'active' : ''}`}
                  onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Database size={17} style={{ color: ['inventory'].includes(activeTab) ? 'var(--accent-gold)' : 'var(--text-sub)' }} />
                    <span>Inventory & Stock</span>
                  </div>
                  {isInventoryOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                {isInventoryOpen && (
                  <div className="nav-dropdown-menu">
                    <button className={`sub-nav-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
                      <Database size={14} /> Stock & Suppliers ({products.length})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dropdown 7: Loyalty & Membership Program (Module 7) */}
            {canAccess(['view_customers', 'all']) && (
              <div style={{ marginTop: '4px' }}>
                <button
                  className={`nav-dropdown-toggle ${isLoyaltyOpen ? 'open' : ''} ${['loyalty'].includes(activeTab) ? 'active' : ''}`}
                  onClick={() => setIsLoyaltyOpen(!isLoyaltyOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Award size={17} style={{ color: ['loyalty'].includes(activeTab) ? 'var(--accent-gold)' : 'var(--text-sub)' }} />
                    <span>Loyalty & Membership</span>
                  </div>
                  {isLoyaltyOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                {isLoyaltyOpen && (
                  <div className="nav-dropdown-menu">
                    <button className={`sub-nav-btn ${activeTab === 'loyalty' ? 'active' : ''}`} onClick={() => setActiveTab('loyalty')}>
                      <Award size={14} /> Tiers & Points Program
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dropdown 8: Marketing Automation & Communication (Module 8) */}
            {canAccess(['view_customers', 'all']) && (
              <div style={{ marginTop: '4px' }}>
                <button
                  className={`nav-dropdown-toggle ${isMarketingOpen ? 'open' : ''} ${['marketing'].includes(activeTab) ? 'active' : ''}`}
                  onClick={() => setIsMarketingOpen(!isMarketingOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Send size={17} style={{ color: ['marketing'].includes(activeTab) ? 'var(--accent-gold)' : 'var(--text-sub)' }} />
                    <span>Marketing Automation</span>
                  </div>
                  {isMarketingOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                {isMarketingOpen && (
                  <div className="nav-dropdown-menu">
                    <button className={`sub-nav-btn ${activeTab === 'marketing' ? 'active' : ''}`} onClick={() => setActiveTab('marketing')}>
                      <Send size={14} /> Campaigns & SMS/WhatsApp
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dropdown 9: Reports & Executive Analytics (Module 9) */}
            {canAccess(['view_reports', 'manage_finances', 'all']) && (
              <div style={{ marginTop: '4px' }}>
                <button
                  className={`nav-dropdown-toggle ${isAnalyticsOpen ? 'open' : ''} ${['reports', 'tracking_records'].includes(activeTab) ? 'active' : ''}`}
                  onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BarChart3 size={17} style={{ color: ['reports', 'tracking_records'].includes(activeTab) ? 'var(--accent-gold)' : 'var(--text-sub)' }} />
                    <span>Reports & Analytics</span>
                  </div>
                  {isAnalyticsOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                {isAnalyticsOpen && (
                  <div className="nav-dropdown-menu">
                    <button className={`sub-nav-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
                      <BarChart3 size={14} /> Executive Reports Console
                    </button>
                    <button className={`sub-nav-btn ${activeTab === 'tracking_records' ? 'active' : ''}`} onClick={() => setActiveTab('tracking_records')}>
                      <UserCheck size={14} /> Staff & Customer Tracking
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dropdown 10: Admin & Security Settings */}
            {isMasterAdmin(currentUser) && (
              <div style={{ marginTop: '4px' }}>
                <button
                  className={`nav-dropdown-toggle ${isSettingsOpen ? 'open' : ''} ${['settings'].includes(activeTab) ? 'active' : ''}`}
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldCheck size={17} style={{ color: ['settings'].includes(activeTab) ? 'var(--accent-gold)' : 'var(--text-sub)' }} />
                    <span>Admin & Security Settings</span>
                  </div>
                  {isSettingsOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                {isSettingsOpen && (
                  <div className="nav-dropdown-menu">
                    <button className={`sub-nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                      <ShieldCheck size={14} /> System Control & Backups
                    </button>
                  </div>
                )}
              </div>
            )}

          </nav>
        </div>

        {/* User Profile & Logout */}
        <div>
          <div
            className="sidebar-user-card"
            style={{ marginBottom: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setIsProfileModalOpen(true)}
            title="Click to view & edit your Admin Profile"
          >
            {/* Show avatar photo if exists, else initials */}
            {currentUser.avatar_url ? (
              <img
                src={`${BACKEND_URL}${currentUser.avatar_url}`}
                alt={currentUser.name}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)', flexShrink: 0 }}
              />
            ) : (
              <div className="user-avatar">
                {String(currentUser.name || '').charAt(0)}
              </div>
            )}
            <div className="user-info" style={{ flex: 1 }}>
              <h4>{currentUser.name}</h4>
              <span className={`role-tag ${currentUser.role?.toLowerCase() || 'staff'}`}>
                {currentUser.role}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsProfileModalOpen(true);
              }}
              title="Edit Profile"
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', padding: '4px' }}
            >
              <User size={15} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              title="Logout"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              <LogOut size={16} />
            </button>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Modules 1 to 10 Active & Live
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-workspace">
        <header className="top-bar">
          <div className="header-meta">
            <h1>
              {activeTab === 'dashboard' && 'Executive Admin Overview'}
              {activeTab === 'users' && 'User & Staff Roles (RBAC)'}
              {activeTab === 'branches' && 'Multi-Branch Control Center'}
              {activeTab === 'matrix' && 'Role & Permission Matrix'}
              {activeTab === 'customers' && 'Customer CRM Profiles'}
              {activeTab === 'leads' && 'Lead Management Pipeline'}
              {activeTab === 'services_packages' && 'Salon Service & Package Management'}
              {activeTab === 'appointments' && 'Appointment & Calendar Booking'}
              {activeTab === 'reception_checkin' && 'Receptionist — Walk-in Check-in Counter'}
              {activeTab === 'pos_billing' && `POS Billing — ${posCustomer?.name || 'Customer'}`}
              {activeTab === 'billing_history' && 'POS Billing History & Invoices'}
              {activeTab === 'inventory' && 'Inventory & Product Stock Management'}
              {activeTab === 'loyalty' && 'Loyalty & Membership Program'}
              {activeTab === 'marketing' && 'Marketing Automation & Communication'}
              {activeTab === 'analytics' && 'Reports & Executive Analytics'}
              {activeTab === 'tracking_records' && 'Staff & Customer Tracking Records'}
              {activeTab === 'settings' && 'Admin Panel & Security Settings'}
            </h1>
            <p style={{ marginTop: '2px' }}>
              Welcome back, <strong>{currentUser.name}</strong>! | Active Branch Context: <strong style={{ color: 'var(--accent-gold)' }}>{selectedBranchId === 'all' ? '🌐 All Branches (Master)' : (branches.find(b => String(b.id) === String(selectedBranchId))?.name || `Branch #${selectedBranchId}`)}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Global Multi-Branch Access Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px 12px' }}>
              <Building size={16} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isMasterAdmin(currentUser) ? 'SaaS Platform Control' : 'Branch Access'}
                </span>
                {(() => {
                  if (isMasterAdmin(currentUser)) {
                    return (
                      <div style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '5px', padding: '2px 0' }}>
                        👑 Global Super Admin (All Salons)
                      </div>
                    );
                  } else if (isSalonAdmin(currentUser)) {
                    return (
                      <select
                        value={selectedBranchId || 'all'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedBranchId(val === 'all' ? 'all' : (isNaN(Number(val)) ? val : Number(val)));
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          fontSize: '0.84rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          outline: 'none',
                          paddingRight: '4px'
                        }}
                      >
                        <option value="all" style={{ background: '#1a1a1a', color: '#fff' }}>🌐 All My Branches</option>
                        {accessibleBranches.map(b => (
                          <option key={b.id} value={b.id} style={{ background: '#1a1a1a', color: '#fff' }}>
                            🏢 {b.name} ({b.code || `ID:${b.id}`})
                          </option>
                        ))}
                      </select>
                    );
                  } else {
                    const myBranch = branches.find(b => String(b.id) === String(currentUser?.branch_id)) || { name: `Branch #${currentUser?.branch_id || 1}` };
                    return (
                      <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px', padding: '2px 0' }}>
                        <Lock size={12} style={{ color: '#38bdf8' }} /> {myBranch.name}
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="theme-toggle-btn"
              title="Edit Admin Profile & Security Password"
              style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }}
            >
              <User size={15} />
              <span>My Profile</span>
            </button>

            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={15} style={{ color: '#fbbf24' }} /> : <Moon size={15} style={{ color: '#6366f1' }} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Workspace Content */}
        <div className="workspace-body">

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="stats-grid">
              <div className="glass-card stat-box">
                <div className="stat-icon">
                  <Users size={26} />
                </div>
                <div className="stat-info">
                  <h3>{filterByBranch(customers).length}</h3>
                  <p>CRM Customer Profiles</p>
                </div>
              </div>

              <div className="glass-card stat-box">
                <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-indigo)' }}>
                  <Calendar size={26} />
                </div>
                <div className="stat-info">
                  <h3>{filterByBranch(appointments).length}</h3>
                  <p>Booked Appointments</p>
                </div>
              </div>

              <div className="glass-card stat-box">
                <div className="stat-icon" style={{ background: 'rgba(37, 99, 235, 0.15)', color: 'var(--success)' }}>
                  <Target size={26} />
                </div>
                <div className="stat-info">
                  <h3>{filterByBranch(leads).length}</h3>
                  <p>Active Prospects / Leads</p>
                </div>
              </div>

              <div className="glass-card stat-box">
                <div className="stat-info">
                  <h3>{filterByBranch(leads).length}</h3>
                  <p>Active Prospects / Leads</p>
                </div>
              </div>

              <div className="glass-card stat-box">
                <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                  <Building size={26} />
                </div>
                <div className="stat-info">
                  <h3>{branches.length}</h3>
                  <p>Salon Branches</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '14px' }}>🚀 Modules Active</h3>
                <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '16px' }}>
                  Manage your salon staff, branches, customers, bookings, and financial tracking all from one platform.
                </p>
                <button onClick={() => setActiveTab('customers')} className="glass-card" style={{ padding: '10px 18px', cursor: 'pointer', color: '#fff', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  View CRM Directory <Users size={16} />
                </button>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '14px' }}>🔑 Active Profile</h3>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700' }}>{currentUser.name}</span>
                    <span className={`role-tag ${currentUser.role?.toLowerCase() || 'staff'}`}>{currentUser.role}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Active Workspace: {selectedBranchId === 'all' ? 'All Branches' : (branches.find(b => String(b.id) === String(selectedBranchId))?.name || currentUser.branch_name)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Module 1 Views */}
        {activeTab === 'users' && (
          canAccess('manage_users') ? (
            <UsersManagementView
              users={filterByBranch(users)}
              branches={branches}
              roles={roles}
              selectedBranchId={selectedBranchId}
              currentUser={currentUser}
              onAddUser={(u) => handleAddUser({ ...u, branch_id: u.branch_id || activeBranchId })}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {activeTab === 'branches' && (
          canAccess('manage_branches') ? (
            <BranchesManagementView
              branches={isMasterAdmin(currentUser) ? branches : accessibleBranches}
              selectedBranchId={selectedBranchId}
              currentUser={currentUser}
              onSelectBranch={(id) => setSelectedBranchId(id)}
              onAddBranch={handleAddBranch}
              onUpdateBranch={handleUpdateBranch}
              onToggleBranchStatus={handleToggleBranchStatus}
              onDeleteBranch={handleDeleteBranch}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {activeTab === 'matrix' && (
          canAccess('manage_permissions') ? (
            <PermissionsMatrixView
              roles={roles}
              onUpdateRoles={(updatedRole) => {
                // Update roles state immediately
                setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r));
                // If the updated role is the current user's role, update their live permissions too
                if (currentUser && currentUser.role_id === updatedRole.id) {
                  setCurrentUser(prev => ({ ...prev, permissions: updatedRole.permissions || [] }));
                }
              }}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {/* Module 2 Views */}
        {activeTab === 'customers' && (
          canAccess('view_customers') ? (
            <CustomersCRMView
              customers={filterByBranch(customers)}
              selectedBranchId={selectedBranchId}
              currentUser={currentUser}
              onAddCustomer={(c, file) => handleAddCustomer({ ...c, branch_id: c.branch_id || activeBranchId }, file)}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {activeTab === 'leads' && (
          canAccess('view_customers') ? (
            <LeadsManagementView
              leads={filterByBranch(leads)}
              selectedBranchId={selectedBranchId}
              currentUser={currentUser}
              onAddLead={(l, file) => handleAddLead({ ...l, branch_id: l.branch_id || activeBranchId }, file)}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              onUpdateLeadStatus={handleUpdateLeadStatus}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {/* Module 4 Views: Salon Service & Package Catalog */}
        {activeTab === 'services_packages' && (
          canAccess('manage_services') ? (
            <ServicesPackagesView
              services={filterByBranch(services)}
              packages={filterByBranch(packages)}
              categories={categories}
              branches={branches}
              selectedBranchId={selectedBranchId}
              currentUser={currentUser}
              onAddService={(s) => handleAddService({ ...s, branch_id: s.branch_id || (selectedBranchId !== 'all' ? selectedBranchId : (branches && branches[0]?.id ? branches[0].id : null)) })}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
              onAddPackage={(p) => handleAddPackage({ ...p, branch_id: p.branch_id || (selectedBranchId !== 'all' ? selectedBranchId : (branches && branches[0]?.id ? branches[0].id : null)) })}
              onUpdatePackage={handleUpdatePackage}
              onDeletePackage={handleDeletePackage}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {/* Module 3 Views */}
        {activeTab === 'appointments' && (
          canAccess('manage_appointments') ? (
            <AppointmentsCalendarView
              appointments={filterByBranch(appointments)}
              bills={filterByBranch(bills)}
              customers={filterByBranch(customers)}
              stylists={filterByBranch(combinedStylists)}
              services={filterByBranch(services)}
              members={members}
              selectedBranchId={selectedBranchId}
              onDeductMemberCredit={handleDeductMemberCredit}
              onCreateBill={(b) => handleCreateBill({ ...b, branch_id: b.branch_id || activeBranchId })}
              onAddAppointment={(a) => handleAddAppointment({ ...a, branch_id: a.branch_id || activeBranchId })}
              onUpdateAppointment={handleUpdateAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {/* Receptionist Module Views */}
        {activeTab === 'reception_checkin' && (
          canAccess(['manage_appointments', 'manage_billing']) ? (
            <ReceptionistView
              customers={filterByBranch(customers)}
              stylists={filterByBranch(combinedStylists)}
              services={filterByBranch(services)}
              appointments={filterByBranch(appointments)}
              members={members}
              selectedBranchId={selectedBranchId}
              onDeductMemberCredit={handleDeductMemberCredit}
              onCreateBill={(b) => handleCreateBill({ ...b, branch_id: b.branch_id || activeBranchId })}
              onCheckIn={handleCheckIn}
              onAddAppointment={(a) => handleAddAppointment({ ...a, branch_id: a.branch_id || activeBranchId })}
              onUpdateAppointment={handleUpdateAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onAddCustomer={(c, file) => handleAddCustomer({ ...c, branch_id: c.branch_id || activeBranchId }, file)}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {activeTab === 'pos_billing' && (
          canAccess('manage_billing') ? (
            <POSBillingView
              customer={posCustomer}
              stylistId={posStylistId}
              initialServices={posInitialServices}
              stylists={filterByBranch(combinedStylists)}
              services={filterByBranch(services)}
              packages={filterByBranch(packages)}
              categories={categories}
              customers={filterByBranch(customers)}
              bills={filterByBranch(bills)}
              members={members}
              selectedBranchId={selectedBranchId}
              onDeductMemberCredit={handleDeductMemberCredit}
              onCreateBill={(b) => handleCreateBill({ ...b, branch_id: b.branch_id || activeBranchId })}
              onBack={handlePOSBack}
              onViewHistory={() => setActiveTab('billing_history')}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}



        {activeTab === 'billing_history' && (
          canAccess(['manage_billing', 'all']) ? (
            <BillingHistoryView
              bills={filterByBranch(bills)}
              customers={filterByBranch(customers)}
              stylists={filterByBranch(combinedStylists)}
              members={members}
              selectedBranchId={selectedBranchId}
              onDeleteBill={handleDeleteBill}
              onClearAllBills={handleClearAllBills}
              onNavigateToPOS={() => setActiveTab('pos_billing')}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {activeTab === 'inventory' && (
          canAccess(['manage_inventory', 'all']) ? (
            <InventoryStockManagementView
              products={filterByBranch(products)}
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              consumptions={consumptions}
              services={filterByBranch(services)}
              selectedBranchId={selectedBranchId}
              onAddProduct={(p) => handleAddProduct({ ...p, branch_id: p.branch_id || activeBranchId })}
              onUpdateProduct={handleUpdateProduct}
              onAdjustStock={handleAdjustStock}
              onDeleteProduct={handleDeleteProduct}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              onCreatePO={handleCreatePO}
              onUpdatePOStatus={handleUpdatePOStatus}
              onAddConsumption={handleAddConsumption}
              onUpdateConsumption={handleUpdateConsumption}
              onDeleteConsumption={handleDeleteConsumption}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {activeTab === 'loyalty' && (
          canAccess(['manage_customers', 'all']) ? (
            <LoyaltyMembershipView
              customers={filterByBranch(customers)}
              bills={filterByBranch(bills)}
              members={members}
              selectedBranchId={selectedBranchId}
              onUpdateMembers={setMembers}
              onCreateBill={(b) => handleCreateBill({ ...b, branch_id: b.branch_id || activeBranchId })}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {activeTab === 'marketing' && (
          canAccess(['view_customers', 'all']) ? (
            <MarketingAutomationView />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {activeTab === 'analytics' && (
          canAccess(['view_reports', 'manage_finances', 'all']) ? (
            <ReportsAnalyticsView selectedBranchId={selectedBranchId} />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {activeTab === 'tracking_records' && (
          canAccess(['view_reports', 'manage_finances', 'all']) ? (
            <StaffCustomerTrackingView
              stylists={filterByBranch(combinedStylists)}
              customers={filterByBranch(customers)}
              appointments={filterByBranch(appointments)}
              bills={filterByBranch(bills)}
              selectedBranchId={selectedBranchId}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {activeTab === 'settings' && (
          canAccess(['manage_permissions', 'all']) ? (
            <AdminSecuritySettingsView onNavigateToMatrix={() => setActiveTab('matrix')} />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}
        </div>
      </main>

      {/* User Profile Edit Modal */}
      {isProfileModalOpen && (
        <UserProfileModal
          user={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdateUser={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem('saloon_user_cache', JSON.stringify(updatedUser));
          }}
        />
      )}
    </div>
  );
}