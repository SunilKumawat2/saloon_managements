import React, { useState, useEffect } from 'react';
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
  BarChart3
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
import AdminSecuritySettingsView from './views/AdminSecuritySettingsView';

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
  Admin_Delete_Consumption,
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

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('saloon_theme') || 'dark');
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('saloon_jwt_token') || null);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('saloon_active_tab') || 'dashboard');
  const [authLoading, setAuthLoading] = useState(!!localStorage.getItem('saloon_jwt_token'));

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

  // Merge API items and LocalStorage custom items without duplicates
  const mergeLists = (apiItems = [], localItems = []) => {
    const listA = Array.isArray(apiItems) ? apiItems : [];
    const listB = Array.isArray(localItems) ? localItems : [];
    const map = new Map();
    // Add local items first, then overlay API items (or keep unique IDs)
    listB.forEach(item => { if (item && item.id != null) map.set(String(item.id), item); });
    listA.forEach(item => { if (item && item.id != null) map.set(String(item.id), item); });
    return Array.from(map.values());
  };

  // Data States — initialized from localStorage for guaranteed refresh persistence
  const [users, setUsers] = useState(MOCK_USERS);
  const [branches, setBranches] = useState(MOCK_BRANCHES);
  const [roles, setRoles] = useState(MOCK_ROLES);
  const [customers, setCustomers] = useState(() => getStoredData('saloon_customers_custom', MOCK_CUSTOMERS));
  const [leads, setLeads] = useState(() => getStoredData('saloon_leads_custom', MOCK_LEADS));
  const [categories, setCategories] = useState(() => getStoredData('saloon_categories_custom', MOCK_CATEGORIES));
  const [services, setServices] = useState(() => getStoredData('saloon_services_custom', MOCK_SERVICES));
  const [packages, setPackages] = useState(() => getStoredData('saloon_packages_custom', MOCK_PACKAGES));
  const [stylists, setStylists] = useState(MOCK_STYLISTS);
  const [appointments, setAppointments] = useState(() => getStoredData('saloon_appointments_custom', MOCK_APPOINTMENTS));
  const [bills, setBills] = useState(() => getStoredData('saloon_bills_custom', MOCK_BILLS));
  const [products, setProducts] = useState(() => getStoredData('saloon_products_custom', []));
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [dbStatus, setDbStatus] = useState({ connected: false, checking: true });

  // Sync states to localStorage whenever lists update
  useEffect(() => {
    try { localStorage.setItem('saloon_services_custom', JSON.stringify(services)); } catch (e) {}
  }, [services]);

  useEffect(() => {
    try { localStorage.setItem('saloon_packages_custom', JSON.stringify(packages)); } catch (e) {}
  }, [packages]);

  useEffect(() => {
    try { localStorage.setItem('saloon_customers_custom', JSON.stringify(customers)); } catch (e) {}
  }, [customers]);

  useEffect(() => {
    try { localStorage.setItem('saloon_leads_custom', JSON.stringify(leads)); } catch (e) {}
  }, [leads]);

  useEffect(() => {
    try { localStorage.setItem('saloon_appointments_custom', JSON.stringify(appointments)); } catch (e) {}
  }, [appointments]);

  useEffect(() => {
    try { localStorage.setItem('saloon_bills_custom', JSON.stringify(bills)); } catch (e) {}
  }, [bills]);

  useEffect(() => {
    try { localStorage.setItem('saloon_categories_custom', JSON.stringify(categories)); } catch (e) {}
  }, [categories]);

  useEffect(() => {
    try { localStorage.setItem('saloon_products_custom', JSON.stringify(products)); } catch (e) {}
  }, [products]);

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

      // 3. Fetch Module 2 CRM & Lead Data (Merged with localStorage)
      const custRes = await Admin_Get_Customers().catch(() => null);
      if (custRes?.data?.data && Array.isArray(custRes.data.data)) {
        setCustomers(prev => mergeLists(custRes.data.data, prev));
      }

      const leadsRes = await Admin_Get_Leads().catch(() => null);
      if (leadsRes?.data?.data && Array.isArray(leadsRes.data.data)) {
        setLeads(prev => mergeLists(leadsRes.data.data, prev));
      }

      // 4. Fetch Module 4 Services, Packages & Categories Data (Merged with localStorage)
      const catRes = await Admin_Get_Categories().catch(() => null);
      if (catRes?.data?.data && Array.isArray(catRes.data.data)) {
        setCategories(prev => mergeLists(catRes.data.data, prev));
      }

      const servRes = await Admin_Get_Services().catch(() => null);
      if (servRes?.data?.data && Array.isArray(servRes.data.data)) {
        setServices(prev => mergeLists(servRes.data.data, prev));
      }

      const pkgRes = await Admin_Get_Packages().catch(() => null);
      if (pkgRes?.data?.data && Array.isArray(pkgRes.data.data)) {
        setPackages(prev => mergeLists(pkgRes.data.data, prev));
      }

      const stRes = await Admin_Get_Stylists().catch(() => null);
      if (stRes?.data?.data && stRes.data.data.length > 0) setStylists(stRes.data.data);

      const appRes = await Admin_Get_Appointments().catch(() => null);
      if (appRes?.data?.data && Array.isArray(appRes.data.data)) {
        setAppointments(prev => mergeLists(appRes.data.data, prev));
      }

      const billsRes = await Admin_Get_Bills().catch(() => null);
      if (billsRes?.data?.data && Array.isArray(billsRes.data.data)) {
        setBills(prev => mergeLists(billsRes.data.data, prev));
      }

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
    if (savedToken && !currentUser) {
      setAuthLoading(true);

      // STEP 1: Decode JWT locally — immediate, no network needed
      const tokenPayload = decodeJWT(savedToken);

      // STEP 2: Check token expiry
      const now = Math.floor(Date.now() / 1000);
      if (tokenPayload && tokenPayload.exp && tokenPayload.exp < now) {
        // Token genuinely expired — clear and logout
        localStorage.removeItem('saloon_jwt_token');
        localStorage.removeItem('saloon_user_cache');
        setAuthToken(null);
        setAuthLoading(false);
        return;
      }

      // STEP 3: Use localStorage cached user data as immediate fallback
      // This ensures the user NEVER gets a blank screen on refresh
      const cachedUser = (() => {
        try { return JSON.parse(localStorage.getItem('saloon_user_cache') || 'null'); }
        catch { return null; }
      })();

      if (cachedUser) {
        // Instantly restore session from cache — no network wait
        setCurrentUser(cachedUser);
      } else if (tokenPayload) {
        setCurrentUser(tokenPayload);
      }

      // STEP 4: Then try fetching fresh user from server in background
      // (gets latest permissions from DB — updates silently without logout)
      Get_Admin_Profile()
        .then(res => {
          if (res?.data?.data) {
            // Fresh data from DB — update state + cache
            const freshUser = res.data.data;
            setCurrentUser(freshUser);
            localStorage.setItem('saloon_user_cache', JSON.stringify(freshUser));
          }
          // If API returns nothing, keep whatever was set from cache/token above
        })
        .catch(() => {
          // Network/API error — DO NOT logout. User already restored from cache above.
          console.warn('API unavailable on refresh — using cached session');
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentUser) fetchModuleData();
  }, [authToken, currentUser]);

  const handleLoginSuccess = (loginData) => {
    setCurrentUser(loginData.user);
    setAuthToken(loginData.token);
    localStorage.setItem('saloon_jwt_token', loginData.token);
    // Cache user data for instant session restore on refresh
    localStorage.setItem('saloon_user_cache', JSON.stringify(loginData.user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('saloon_jwt_token');
    localStorage.removeItem('saloon_user_cache');
  };

  // Handlers for Module 1
  const handleAddUser = async (newUser) => {
    try {
      const res = await Admin_Create_User(newUser).catch(() => null);
      if (res?.data?.data) {
        setUsers(prev => [res.data.data, ...prev]);
      }
    } catch (e) { console.error(e); }
  };

  const handleAddBranch = async (newBranch) => {
    try {
      const res = await Admin_Create_Branch(newBranch).catch(() => null);
      if (res?.data?.data) {
        setBranches(prev => [...prev, res.data.data]);
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateBranch = async (id, branchData) => {
    try {
      const res = await Admin_Update_Branch(id, branchData).catch(() => null);
      if (res?.data?.data) {
        setBranches(prev => prev.map(b => b.id === id ? res.data.data : b));
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

  // Handlers for Module 2 CRM & Leads
  const handleAddCustomer = async (newCust, avatarFile) => {
    try {
      const res = await Admin_Create_Customer(newCust).catch(() => null);
      let customer = res?.data?.data || res?.data || { id: Date.now(), ...newCust };
      if (avatarFile && customer.id) {
        const avatarRes = await Admin_Upload_Customer_Avatar(customer.id, avatarFile).catch(() => null);
        if (avatarRes?.data?.data) customer = avatarRes.data.data;
      }
      setCustomers(prev => [customer, ...prev]);
      return customer;
    } catch (e) {
      console.error(e);
      const fallback = { id: Date.now(), ...newCust };
      setCustomers(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  const handleUpdateCustomer = async (id, custData, avatarFile) => {
    try {
      const res = await Admin_Update_Customer(id, custData).catch(() => null);
      let customer = res?.data?.data || res?.data || { id, ...custData };
      if (avatarFile && id) {
        const avatarRes = await Admin_Upload_Customer_Avatar(id, avatarFile).catch(() => null);
        if (avatarRes?.data?.data) customer = avatarRes.data.data;
      }
      setCustomers(prev => prev.map(c => Number(c.id) === Number(id) ? { ...c, ...customer } : c));
    } catch (e) {
      console.error(e);
      setCustomers(prev => prev.map(c => Number(c.id) === Number(id) ? { ...c, ...custData } : c));
    }
  };

  const handleDeleteCustomer = async (id) => {
    try {
      await Admin_Delete_Customer(id).catch(() => null);
    } catch (e) { console.error(e); }
    setCustomers(prev => prev.filter(c => Number(c.id) !== Number(id)));
  };

  const handleAddLead = async (leadData, avatarFile) => {
    try {
      const res = await Admin_Create_Lead(leadData).catch(() => null);
      let created = res?.data?.data || res?.data || { id: Date.now(), ...leadData, status: leadData.status || 'New' };
      if (avatarFile && created.id) {
        const upRes = await Admin_Upload_Lead_Avatar(created.id, avatarFile).catch(() => null);
        if (upRes?.data?.avatarUrl) {
          created = { ...created, avatar_url: upRes.data.avatarUrl };
        }
      }
      setLeads(prev => [created, ...prev]);
      return created;
    } catch (e) {
      console.error("Create Lead Error:", e);
      const fallback = { id: Date.now(), ...leadData, status: leadData.status || 'New' };
      setLeads(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  const handleUpdateLeadStatus = async (id, status) => {
    try {
      await Admin_Update_Lead_Status(id, status).catch(() => null);
    } catch (e) { console.error("Update Status Error:", e); }
    setLeads(prev => prev.map(l => Number(l.id) === Number(id) ? { ...l, status } : l));
  };

  const handleUpdateLead = async (id, leadData, avatarFile) => {
    try {
      const res = await Admin_Update_Lead(id, leadData).catch(() => null);
      let updated = res?.data?.data || res?.data || { id, ...leadData };
      if (avatarFile) {
        const upRes = await Admin_Upload_Lead_Avatar(id, avatarFile).catch(() => null);
        if (upRes?.data?.avatarUrl) {
          updated = { ...updated, avatar_url: upRes.data.avatarUrl };
        }
      }
      setLeads(prev => prev.map(l => Number(l.id) === Number(id) ? { ...l, ...updated } : l));
    } catch (e) {
      console.error("Update Lead Error:", e);
      setLeads(prev => prev.map(l => Number(l.id) === Number(id) ? { ...l, ...leadData } : l));
    }
  };

  const handleDeleteLead = async (id) => {
    try {
      await Admin_Delete_Lead(id).catch(() => null);
    } catch (e) { console.error("Delete Lead Error:", e); }
    setLeads(prev => prev.filter(l => Number(l.id) !== Number(id)));
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
      localStorage.setItem('saloon_services_custom', JSON.stringify(updated));
      return updated;
    });
    return newItem;
  };

  const handleUpdateService = async (id, serviceData) => {
    try {
      const res = await Admin_Update_Service(id, serviceData).catch(() => null);
      const updatedItem = res?.data?.data || res?.data || serviceData;
      setServices(prev => {
        const updated = prev.map(s => Number(s.id) === Number(id) ? { ...s, ...updatedItem } : s);
        localStorage.setItem('saloon_services_custom', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error("Update Service Error:", e);
      setServices(prev => {
        const updated = prev.map(s => Number(s.id) === Number(id) ? { ...s, ...serviceData } : s);
        localStorage.setItem('saloon_services_custom', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleDeleteService = async (id) => {
    try {
      await Admin_Delete_Service(id).catch(() => null);
    } catch (e) {
      console.error("Delete Service Error:", e);
    }
    setServices(prev => {
      const updated = prev.filter(s => Number(s.id) !== Number(id));
      localStorage.setItem('saloon_services_custom', JSON.stringify(updated));
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
      localStorage.setItem('saloon_packages_custom', JSON.stringify(updated));
      return updated;
    });
    return newItem;
  };

  const handleUpdatePackage = async (id, packageData) => {
    try {
      const res = await Admin_Update_Package(id, packageData).catch(() => null);
      const updatedItem = res?.data?.data || res?.data || packageData;
      setPackages(prev => {
        const updated = prev.map(p => Number(p.id) === Number(id) ? { ...p, ...updatedItem } : p);
        localStorage.setItem('saloon_packages_custom', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error("Update Package Error:", e);
      setPackages(prev => {
        const updated = prev.map(p => Number(p.id) === Number(id) ? { ...p, ...packageData } : p);
        localStorage.setItem('saloon_packages_custom', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleDeletePackage = async (id) => {
    try {
      await Admin_Delete_Package(id).catch(() => null);
    } catch (e) {
      console.error("Delete Package Error:", e);
    }
    setPackages(prev => {
      const updated = prev.filter(p => Number(p.id) !== Number(id));
      localStorage.setItem('saloon_packages_custom', JSON.stringify(updated));
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
      setCategories(prev => prev.map(c => Number(c.id) === Number(id) ? { ...c, ...updatedItem } : c));
    } catch (e) {
      console.error("Update Category Error:", e);
      setCategories(prev => prev.map(c => Number(c.id) === Number(id) ? { ...c, ...categoryData } : c));
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await Admin_Delete_Category(id).catch(() => null);
    } catch (e) {
      console.error("Delete Category Error:", e);
    }
    setCategories(prev => prev.filter(c => Number(c.id) !== Number(id)));
  };

  // Handlers for Module 3 Booking & Receptionist Queue
  const handleAddAppointment = async (newApp) => {
    let newItem = null;
    try {
      const res = await Admin_Create_Appointment(newApp).catch(() => null);
      newItem = res?.data?.data || res?.data || { id: Date.now(), ...newApp, status: newApp.status || 'Confirmed' };
    } catch (e) {
      console.error(e);
      newItem = { id: Date.now(), ...newApp, status: newApp.status || 'Confirmed' };
    }
    setAppointments(prev => [newItem, ...prev]);
    return newItem;
  };

  const handleUpdateAppointment = async (id, appData) => {
    try {
      const res = await Admin_Update_Appointment(id, appData).catch(() => null);
      const updatedItem = res?.data?.data || res?.data || appData;
      setAppointments(prev => prev.map(a => Number(a.id) === Number(id) ? { ...a, ...updatedItem } : a));
    } catch (e) {
      console.error(e);
      setAppointments(prev => prev.map(a => Number(a.id) === Number(id) ? { ...a, ...appData } : a));
    }
  };

  const handleDeleteAppointment = async (id) => {
    try {
      await Admin_Delete_Appointment(id).catch(() => null);
    } catch (e) { console.error(e); }
    setAppointments(prev => prev.filter(a => Number(a.id) !== Number(id)));
  };

  // Handlers for Receptionist POS Billing
  const handleCheckIn = (customer, stylistId) => {
    setPosCustomer(customer);
    setPosStylistId(stylistId);
    setActiveTab('pos_billing');
  };

  const handleCreateBill = async (billData) => {
    let createdBill = null;
    try {
      const res = await Admin_Create_Bill(billData).catch(() => null);
      createdBill = res?.data?.data || res?.data || {
        id: Date.now(),
        invoice_number: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        created_at: new Date().toISOString(),
        ...billData
      };
    } catch (e) {
      console.error(e);
      createdBill = {
        id: Date.now(),
        invoice_number: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        created_at: new Date().toISOString(),
        ...billData
      };
    }
    setBills(prev => [createdBill, ...prev]);
    // Refresh customers to update loyalty points
    Admin_Get_Customers().then(custRes => {
      if (custRes?.data?.data) setCustomers(custRes.data.data);
    }).catch(() => null);
    return createdBill;
  };

  const handlePOSBack = () => {
    setPosCustomer(null);
    setPosStylistId(null);
    setActiveTab('reception_checkin');
  };

  const handleUpdateAppointmentStatus = async (id, status) => {
    try {
      await Admin_Update_Appointment_Status(id, status).catch(() => null);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (e) { console.error(e); }
  };

  // Handlers for Module 6 Inventory & Stock Management
  const handleAddProduct = async (productData) => {
    try {
      const res = await Admin_Create_Product(productData);
      if (res?.data?.data) {
        setProducts(prev => [res.data.data, ...prev]);
      }
    } catch (e) { console.error('Add Product Error:', e); }
  };

  const handleUpdateProduct = async (id, productData) => {
    try {
      const res = await Admin_Update_Product(id, productData);
      if (res?.data?.data) {
        setProducts(prev => prev.map(p => p.id === id ? res.data.data : p));
      }
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
    } catch (e) { console.error('Add Supplier Error:', e); }
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

  const handleCreatePO = async (poData) => {
    try {
      const res = await Admin_Create_Purchase_Order(poData);
      if (res?.data?.data) {
        setPurchaseOrders(prev => [res.data.data, ...prev]);
      }
    } catch (e) { console.error('Create PO Error:', e); }
  };

  const handleUpdatePOStatus = async (id, status) => {
    try {
      const res = await Admin_Update_Purchase_Order_Status(id, status);
      if (res?.data?.data) {
        setPurchaseOrders(prev => prev.map(po => po.id === id ? res.data.data : po));
        const prodRes = await Admin_Get_Products().catch(() => null);
        if (prodRes?.data?.data) setProducts(prodRes.data.data);
      }
    } catch (e) { console.error('Update PO Status Error:', e); }
  };

  const handleAddConsumption = async (data) => {
    try {
      const res = await Admin_Create_Consumption(data);
      if (res?.data?.data) {
        const fullConsRes = await Admin_Get_Consumptions().catch(() => null);
        if (fullConsRes?.data?.data) setConsumptions(fullConsRes.data.data);
      }
    } catch (e) { console.error('Add Consumption Error:', e); }
  };

  const handleDeleteConsumption = async (id) => {
    try {
      await Admin_Delete_Consumption(id);
      setConsumptions(prev => prev.filter(c => c.id !== id));
    } catch (e) { console.error('Delete Consumption Error:', e); }
  };

  // Session restore ho raha hai — loading spinner dikhao
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark)',
        gap: '20px'
      }}>
        <div style={{
          width: '52px', height: '52px',
          border: '4px solid rgba(255,255,255,0.1)',
          borderTop: '4px solid var(--accent-gold)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '600' }}>
          Restoring your session...
        </div>
      </div>
    );
  }

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} theme={theme} onToggleTheme={toggleTheme} />;
  }

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

            {/* Dropdown 3: Service & Package Catalog (Module 4) */}
            {canAccess('manage_services') && (
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
                  className={`nav-dropdown-toggle ${isAnalyticsOpen ? 'open' : ''} ${['analytics'].includes(activeTab) ? 'active' : ''}`}
                  onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BarChart3 size={17} style={{ color: ['analytics'].includes(activeTab) ? 'var(--accent-gold)' : 'var(--text-sub)' }} />
                    <span>Reports & Analytics</span>
                  </div>
                  {isAnalyticsOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                {isAnalyticsOpen && (
                  <div className="nav-dropdown-menu">
                    <button className={`sub-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                      <BarChart3 size={14} /> Executive Reports Console
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dropdown 10: Admin Panel & Security Settings (Module 10) */}
            {canAccess(['manage_permissions', 'all']) && (
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
          <div className="sidebar-user-card" style={{ marginBottom: '12px' }}>
            {/* Show avatar photo if exists, else initials */}
            {currentUser.avatar_url ? (
              <img
                src={`${BACKEND_URL}${currentUser.avatar_url}`}
                alt={currentUser.name}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)', flexShrink: 0 }}
              />
            ) : (
              <div className="user-avatar">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="user-info" style={{ flex: 1 }}>
              <h4>{currentUser.name}</h4>
              <span className={`role-tag ${currentUser.role?.toLowerCase() || 'staff'}`}>
                {currentUser.role}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              title="Logout"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
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
              {activeTab === 'settings' && 'Admin Panel & Security Settings'}
            </h1>
            <p>Welcome back, <strong>{currentUser.name}</strong>! Multi-tenant salon ERP system.</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={15} style={{ color: '#fbbf24' }} /> : <Moon size={15} style={{ color: '#6366f1' }} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button 
              onClick={fetchModuleData} 

              className="glass-card" 
              style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-sub)' }}
            >
              <RefreshCw size={14} className={dbStatus.checking ? 'spin' : ''} /> Sync API
            </button>

            <div className={`db-badge ${dbStatus.connected ? 'connected' : 'disconnected'}`}>
              <div className="pulse-dot"></div>
              <Database size={15} />
              {dbStatus.connected ? 'PostgreSQL Live Connected' : 'API Offline'}
            </div>
          </div>
        </header>

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="stats-grid">
              <div className="glass-card stat-box">
                <div className="stat-icon">
                  <Users size={26} />
                </div>
                <div className="stat-info">
                  <h3>{customers.length}</h3>
                  <p>CRM Customer Profiles</p>
                </div>
              </div>

              <div className="glass-card stat-box">
                <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-indigo)' }}>
                  <Calendar size={26} />
                </div>
                <div className="stat-info">
                  <h3>{appointments.length}</h3>
                  <p>Booked Appointments</p>
                </div>
              </div>

              <div className="glass-card stat-box">
                <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                  <Target size={26} />
                </div>
                <div className="stat-info">
                  <h3>{leads.length}</h3>
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
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '14px' }}>🚀 Modules 1, 2 & 3 Integrated</h3>
                <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  User Roles & RBAC, Customer CRM, Lead Pipeline, aur Appointment Booking Calendar sabhi live PostgreSQL <code>saloon_db</code> se integrated hain.
                </p>
                
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                  <button onClick={() => setActiveTab('appointments')} className="btn-primary">
                    Book Appointment <Calendar size={16} />
                  </button>
                  <button onClick={() => setActiveTab('customers')} className="glass-card" style={{ padding: '10px 18px', cursor: 'pointer', color: '#fff', fontWeight: '700' }}>
                    View CRM Directory <Users size={16} />
                  </button>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '14px' }}>🔑 Active Profile</h3>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700' }}>{currentUser.name}</span>
                    <span className={`role-tag ${currentUser.role?.toLowerCase() || 'staff'}`}>{currentUser.role}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Branch: {currentUser.branch_name}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Module 1 Views */}
        {activeTab === 'users' && (
          canAccess('manage_users') ? (
            <UsersManagementView users={users} branches={branches} roles={roles} onAddUser={handleAddUser} />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {activeTab === 'branches' && (
          canAccess('manage_branches') ? (
            <BranchesManagementView 
              branches={branches} 
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
              customers={customers}
              onAddCustomer={handleAddCustomer}
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
              leads={leads}
              onAddLead={handleAddLead}
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
              services={services}
              packages={packages}
              categories={categories}
              onAddService={handleAddService}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
              onAddPackage={handleAddPackage}
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
              appointments={appointments} 
              customers={customers} 
              stylists={stylists} 
              services={services} 
              onAddAppointment={handleAddAppointment} 
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
              customers={customers}
              stylists={stylists}
              services={services}
              appointments={appointments}
              onCheckIn={handleCheckIn}
              onAddAppointment={handleAddAppointment}
              onUpdateAppointment={handleUpdateAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onAddCustomer={handleAddCustomer}
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
              stylists={stylists}
              services={services}
              packages={packages}
              categories={categories}
              customers={customers}
              bills={bills}
              onCreateBill={handleCreateBill}
              onBack={handlePOSBack}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {activeTab === 'billing_history' && (
          canAccess(['manage_billing', 'view_reports', 'manage_finances']) ? (
            <BillingHistoryView
              bills={bills}
              customers={customers}
              stylists={stylists}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {activeTab === 'inventory' && (
          canAccess(['manage_inventory', 'all']) ? (
            <InventoryStockManagementView
              products={products}
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              consumptions={consumptions}
              services={services}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onAdjustStock={handleAdjustStock}
              onDeleteProduct={handleDeleteProduct}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              onCreatePO={handleCreatePO}
              onUpdatePOStatus={handleUpdatePOStatus}
              onAddConsumption={handleAddConsumption}
              onDeleteConsumption={handleDeleteConsumption}
            />
          ) : (
            <AccessDeniedView role={currentUser?.role} onGoHome={() => setActiveTab('dashboard')} />
          )
        )}

        {activeTab === 'loyalty' && (
          canAccess(['view_customers', 'all']) ? (
            <LoyaltyMembershipView />
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
            <ReportsAnalyticsView />
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

      </main>
    </div>
  );
}

export default App;
