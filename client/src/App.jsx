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
  Moon
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
  Admin_Get_Leads,
  Admin_Create_Lead,
  Admin_Update_Lead_Status,
  Admin_Get_Services,
  Admin_Get_Stylists,
  Admin_Get_Appointments,
  Admin_Create_Appointment,
  Admin_Update_Appointment_Status,
  Admin_Get_Bills,
  Admin_Create_Bill,
  Get_Admin_Profile
} from './services/apiService';
import { BACKEND_URL } from './config/Config';


function App() {
  const [theme, setTheme] = useState(localStorage.getItem('saloon_theme') || 'dark');
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('saloon_jwt_token') || null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authLoading, setAuthLoading] = useState(!!localStorage.getItem('saloon_jwt_token'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('saloon_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };


  // Accordion Dropdown States
  const [isRbacOpen, setIsRbacOpen] = useState(true);
  const [isCrmOpen, setIsCrmOpen] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(true);
  const [isReceptionOpen, setIsReceptionOpen] = useState(true);

  // Receptionist POS state — which customer is being billed
  const [posCustomer, setPosCustomer] = useState(null);
  const [posStylistId, setPosStylistId] = useState(null);

  // Data States
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [bills, setBills] = useState([]);
  const [dbStatus, setDbStatus] = useState({ connected: false, checking: true });

  const fetchModuleData = async () => {
    setDbStatus(prev => ({ ...prev, checking: true }));
    try {
      // 1. Health check
      const healthRes = await Admin_Get_Health().catch(() => null);
      if (healthRes && healthRes.data) {
        setDbStatus({ connected: true, checking: false });
      } else {
        setDbStatus({ connected: false, checking: false });
      }

      // 2. Fetch Module 1 Data
      const usersRes = await Admin_Get_Users().catch(() => null);
      if (usersRes?.data?.data) setUsers(usersRes.data.data);

      const branchesRes = await Admin_Get_Branches().catch(() => null);
      if (branchesRes?.data?.data) setBranches(branchesRes.data.data);

      const rolesRes = await Admin_Get_Roles().catch(() => null);
      if (rolesRes?.data?.data) setRoles(rolesRes.data.data);

      // 3. Fetch Module 2 CRM & Lead Data
      const custRes = await Admin_Get_Customers().catch(() => null);
      if (custRes?.data?.data) setCustomers(custRes.data.data);

      const leadsRes = await Admin_Get_Leads().catch(() => null);
      if (leadsRes?.data?.data) setLeads(leadsRes.data.data);

      // 4. Fetch Module 3 Booking & Services Data
      const servRes = await Admin_Get_Services().catch(() => null);
      if (servRes?.data?.data) setServices(servRes.data.data);

      const stRes = await Admin_Get_Stylists().catch(() => null);
      if (stRes?.data?.data) setStylists(stRes.data.data);

      const appRes = await Admin_Get_Appointments().catch(() => null);
      if (appRes?.data?.data) setAppointments(appRes.data.data);

      const billsRes = await Admin_Get_Bills().catch(() => null);
      if (billsRes?.data?.data) setBills(billsRes.data.data);

    } catch (err) {
      console.error('API Fetch Error:', err);
      setDbStatus({ connected: false, checking: false });
    }
  };

  // ─── Restore user session on page refresh ───
  useEffect(() => {
    const savedToken = localStorage.getItem('saloon_jwt_token');
    if (savedToken && !currentUser) {
      setAuthLoading(true);
      Get_Admin_Profile()
        .then(res => {
          if (res?.data?.data) {
            setCurrentUser(res.data.data);
          } else {
            // Token invalid/expired — clear it
            localStorage.removeItem('saloon_jwt_token');
            setAuthToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('saloon_jwt_token');
          setAuthToken(null);
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
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('saloon_jwt_token');
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
  const handleAddCustomer = async (newCust) => {
    try {
      const res = await Admin_Create_Customer(newCust).catch(() => null);
      if (res?.data?.data) {
        setCustomers(prev => [res.data.data, ...prev]);
      }
    } catch (e) { console.error(e); }
  };

  const handleAddLead = async (newLead) => {
    try {
      const res = await Admin_Create_Lead(newLead).catch(() => null);
      if (res?.data?.data) {
        setLeads(prev => [res.data.data, ...prev]);
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateLeadStatus = async (id, status) => {
    try {
      await Admin_Update_Lead_Status(id, status).catch(() => null);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    } catch (e) { console.error(e); }
  };

  // Handlers for Module 3 Booking
  const handleAddAppointment = async (newApp) => {
    try {
      const res = await Admin_Create_Appointment(newApp).catch(() => null);
      if (res?.data?.data) {
        setAppointments(prev => [res.data.data, ...prev]);
      }
    } catch (e) { console.error(e); }
  };

  // Handlers for Receptionist POS Billing
  const handleCheckIn = (customer, stylistId) => {
    setPosCustomer(customer);
    setPosStylistId(stylistId);
    setActiveTab('pos_billing');
  };

  const handleCreateBill = async (billData) => {
    try {
      const res = await Admin_Create_Bill(billData).catch(() => null);
      if (res?.data?.data) {
        setBills(prev => [res.data.data, ...prev]);
        // Refresh customers to update loyalty points
        const custRes = await Admin_Get_Customers().catch(() => null);
        if (custRes?.data?.data) setCustomers(custRes.data.data);
        return res.data.data;
      }
    } catch (e) { console.error(e); }
    return null;
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
                  <button className={`sub-nav-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                    <Users size={14} /> User & Staff RBAC ({users.length})
                  </button>
                  <button className={`sub-nav-btn ${activeTab === 'branches' ? 'active' : ''}`} onClick={() => setActiveTab('branches')}>
                    <Building size={14} /> Multi-Branch Control ({branches.length})
                  </button>
                  <button className={`sub-nav-btn ${activeTab === 'matrix' ? 'active' : ''}`} onClick={() => setActiveTab('matrix')}>
                    <ShieldCheck size={14} /> Permission Matrix
                  </button>
                </div>
              )}
            </div>

            {/* Dropdown 2: CRM & Lead System (Module 2) */}
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

            {/* Dropdown 3: Appointments & Booking (Module 3) */}
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

            {/* Dropdown 4: Receptionist Console */}
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
                  <button className={`sub-nav-btn ${activeTab === 'reception_checkin' || activeTab === 'pos_billing' ? 'active' : ''}`} onClick={() => { setPosCustomer(null); setPosStylistId(null); setActiveTab('reception_checkin'); }}>
                    <UserCheck size={14} /> Walk-in Check-in
                  </button>
                  <button className={`sub-nav-btn ${activeTab === 'billing_history' ? 'active' : ''}`} onClick={() => setActiveTab('billing_history')}>
                    <Receipt size={14} /> Billing History ({bills.length})
                  </button>
                </div>
              )}
            </div>
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
            Modules 1, 2, 3 & Receptionist Active
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
              {activeTab === 'appointments' && 'Appointment & Calendar Booking'}
              {activeTab === 'reception_checkin' && 'Receptionist — Walk-in Check-in Counter'}
              {activeTab === 'pos_billing' && `POS Billing — ${posCustomer?.name || 'Customer'}`}
              {activeTab === 'billing_history' && 'POS Billing History & Invoices'}
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
        {activeTab === 'users' && <UsersManagementView users={users} branches={branches} roles={roles} onAddUser={handleAddUser} />}
        {activeTab === 'branches' && (
          <BranchesManagementView 
            branches={branches} 
            onAddBranch={handleAddBranch} 
            onUpdateBranch={handleUpdateBranch}
            onToggleBranchStatus={handleToggleBranchStatus}
            onDeleteBranch={handleDeleteBranch}
          />
        )}
        {activeTab === 'matrix' && (
          <PermissionsMatrixView 
            roles={roles} 
            onUpdateRoles={(updatedRole) => setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r))}
          />
        )}

        {/* Module 2 Views */}
        {activeTab === 'customers' && <CustomersCRMView customers={customers} onAddCustomer={handleAddCustomer} />}
        {activeTab === 'leads' && <LeadsManagementView leads={leads} onAddLead={handleAddLead} onUpdateLeadStatus={handleUpdateLeadStatus} />}

        {/* Module 3 Views */}
        {activeTab === 'appointments' && (
          <AppointmentsCalendarView 
            appointments={appointments} 
            customers={customers} 
            stylists={stylists} 
            services={services} 
            onAddAppointment={handleAddAppointment} 
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus} 
          />
        )}

        {/* Receptionist Module Views */}
        {activeTab === 'reception_checkin' && (
          <ReceptionistView
            customers={customers}
            stylists={stylists}
            services={services}
            onCheckIn={handleCheckIn}
          />
        )}
        {activeTab === 'pos_billing' && posCustomer && (
          <POSBillingView
            customer={posCustomer}
            stylistId={posStylistId}
            stylists={stylists}
            services={services}
            bills={bills}
            onCreateBill={handleCreateBill}
            onBack={handlePOSBack}
          />
        )}
        {activeTab === 'billing_history' && (
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Stylist</th>
                  <th>Subtotal</th>
                  <th>GST</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No bills generated yet.</td></tr>
                ) : bills.map(b => (
                  <tr key={b.id}>
                    <td><span style={{ fontWeight: '800', color: 'var(--accent-gold)' }}>#{b.id}</span></td>
                    <td>{b.customer_name || 'Walk-in Guest'}</td>
                    <td>{b.stylist_name || '—'}</td>
                    <td>₹{parseFloat(b.subtotal).toFixed(2)}</td>
                    <td>₹{parseFloat(b.tax_amount).toFixed(2)}</td>
                    <td style={{ fontWeight: '800', color: 'var(--accent-gold)' }}>₹{parseFloat(b.total).toFixed(2)}</td>
                    <td><span style={{ background: b.payment_mode === 'Cash' ? 'rgba(52,211,153,0.15)' : b.payment_mode === 'UPI' ? 'rgba(245,158,11,0.15)' : 'rgba(129,140,248,0.15)', color: b.payment_mode === 'Cash' ? '#34d399' : b.payment_mode === 'UPI' ? 'var(--accent-gold)' : '#818cf8', padding: '3px 10px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '800' }}>{b.payment_mode}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(b.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
