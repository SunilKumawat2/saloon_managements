import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Building,
  BarChart3,
  CheckCircle2,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Crown,
  Building2,
  User,
  Phone,
  MapPin,
  Check
} from 'lucide-react';
import { Admin_Login, Get_Public_Auth_Settings, Register_Public_Salon } from '../services/apiService';
import { useBranding } from '../context/BrandingContext';

function LoginView({ users = [], onLoginSuccess, theme = 'dark', onToggleTheme }) {
  const { brandSettings } = useBranding();
  
  // Auth Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState(() => {
    return window.location.search.includes('mode=register') ? 'register' : 'login';
  });

  const [allowPublicSignup, setAllowPublicSignup] = useState(true);
  const [availablePlans, setAvailablePlans] = useState([]);

  // Login Form State
  const [email, setEmail] = useState('admin@saloon.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Register Form State (14-Day Free Trial)
  const [regForm, setRegForm] = useState({
    salon_name: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    city: 'New Delhi',
    password: '',
    plan_id: 2 // Default Growth Plan trial
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regErrorMsg, setRegErrorMsg] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Fetch public settings on mount
  useEffect(() => {
    Get_Public_Auth_Settings()
      .then(res => {
        if (res?.data?.data) {
          setAllowPublicSignup(res.data.data.allow_public_signup ?? true);
          if (Array.isArray(res.data.data.available_plans) && res.data.data.available_plans.length > 0) {
            setAvailablePlans(res.data.data.available_plans);
          }
        }
      })
      .catch(() => {
        // Fallback default
        setAllowPublicSignup(true);
      });
  }, []);

  const executeLogin = async (userEmail, userPassword) => {
    setLoading(true);
    setErrorMsg('');

    try {
      // Call Global Admin_Login API Function
      const res = await Admin_Login({
        email: userEmail,
        password: userPassword || 'admin123'
      }).catch(() => null);

      if (res?.data?.data?.token) {
        onLoginSuccess({
          token: res.data.data.token,
          user: res.data.data.user
        });
      } else {
        const cleanEmail = String(userEmail || '').toLowerCase().trim();

        // Master super admin account fallback
        if (cleanEmail === 'admin@saloon.com') {
          onLoginSuccess({
            token: `demo_jwt_token_1_${Date.now()}`,
            user: {
              id: 1,
              name: 'Sunil Kumar (Super Admin)',
              email: 'admin@saloon.com',
              role: 'Super Admin',
              is_super_admin: true,
              branch_id: null,
              branch_name: '🌐 Global SaaS System Master'
            }
          });
          return;
        }

        // Check if user exists in active system users list
        const matchedUser = Array.isArray(users) ? users.find(u => u && u.email && String(u.email).toLowerCase().trim() === cleanEmail) : null;

        if (matchedUser && matchedUser.is_active !== false) {
          onLoginSuccess({
            token: `demo_jwt_token_${matchedUser.id}_${Date.now()}`,
            user: {
              ...matchedUser,
              role: matchedUser.role || matchedUser.role_name || 'Staff'
            }
          });
        } else {
          setErrorMsg('❌ Access Denied: User account does not exist or has been deleted by Super Admin.');
        }
      }
    } catch (err) {
      console.error('Login Error:', err);
      setErrorMsg('Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail) => {
    setEmail(roleEmail);
    executeLogin(roleEmail, 'admin123');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeLogin(email, password);
  };

  // Handle Salon Self-Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setRegErrorMsg('');
    setRegSuccessMsg('');

    try {
      const res = await Register_Public_Salon(regForm);
      if (res?.data?.data?.token && res?.data?.data?.user) {
        setRegSuccessMsg(res.data.message || 'Salon registered successfully! Launching dashboard...');
        setTimeout(() => {
          onLoginSuccess({
            token: res.data.data.token,
            user: res.data.data.user
          });
        }, 1200);
      } else {
        setRegErrorMsg('Registration succeeded, but login response was incomplete. Please sign in.');
        setAuthMode('login');
      }
    } catch (err) {
      console.error('Salon Registration Error:', err);
      setRegErrorMsg(err.data?.message || err.message || 'Failed to register salon. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
      {onToggleTheme && (
        <button
          onClick={onToggleTheme}
          className="theme-toggle-btn"
          style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={15} style={{ color: '#fbbf24' }} /> : <Moon size={15} style={{ color: '#6366f1' }} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      )}

      <div
        className="glass-panel"
        style={{
          maxWidth: authMode === 'register' ? '1040px' : '920px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: authMode === 'register' ? '1fr 1.3fr' : '1fr 1.15fr',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          transition: 'all 0.3s ease'
        }}
      >

        {/* Left Column: Premium Branding & Feature Highlights */}
        <div
          style={{
            background: '#0a0a0a',
            padding: '44px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid var(--border)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle Ambient Background Light */}
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', filter: 'blur(50px)', pointerEvents: 'none' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
              <div
                className="brand-icon"
                style={{
                  width: '46px',
                  height: '46px',
                  minWidth: '46px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  background: brandSettings?.logo_url ? 'transparent' : 'var(--accent-gold, #2563eb)',
                  boxShadow: brandSettings?.logo_url ? '0 2px 10px rgba(0,0,0,0.3)' : undefined
                }}
              >
                {brandSettings?.logo_url ? (
                  <img
                    src={brandSettings.logo_url}
                    alt={brandSettings?.salon_name || 'Salon'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      borderRadius: '14px'
                    }}
                  />
                ) : (
                  <Scissors size={26} />
                )}
              </div>
              <div className="brand-title">
                <h2>{brandSettings?.salon_name || 'SalonPulse'}</h2>
                <span>{brandSettings?.salon_tagline || 'ERP & CRM Portal'}</span>
              </div>
            </div>

            {authMode === 'register' ? (
              <>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#4ade80', padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '800', marginBottom: '14px' }}>
                  <Sparkles size={12} /> 14-DAY FULL EVALUATION
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', lineHeight: '1.25', marginBottom: '14px', color: '#fff' }}>
                  Launch Your Salon <br />
                  <span style={{ color: 'var(--accent-gold)' }}>In Under 60 Seconds</span>
                </h1>
                <p style={{ color: 'var(--text-sub)', fontSize: '0.86rem', lineHeight: '1.6', marginBottom: '28px' }}>
                  Get complete cloud access to POS counter billing, customer CRM, staff attendance, and multi-branch management.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: 'var(--text-main)' }}>
                    <CheckCircle2 size={16} style={{ color: '#4ade80' }} />
                    <span>Instant Cloud Provisioning (No Waiting)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: 'var(--text-main)' }}>
                    <CheckCircle2 size={16} style={{ color: '#4ade80' }} />
                    <span>No Credit Card or Payment Required</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: 'var(--text-main)' }}>
                    <CheckCircle2 size={16} style={{ color: '#4ade80' }} />
                    <span>Thermal Receipts & WhatsApp Invoices</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: 'var(--text-main)' }}>
                    <CheckCircle2 size={16} style={{ color: '#4ade80' }} />
                    <span>Full 14-Day Evaluation Access</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', lineHeight: '1.25', marginBottom: '14px', color: '#fff' }}>
                  Next-Level Salon <br />
                  <span style={{ color: 'var(--accent-gold)' }}>Management Suite</span>
                </h1>

                <p style={{ color: 'var(--text-sub)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '32px' }}>
                  Streamline multi-branch salon operations, appointment scheduling, POS billing, and customer loyalty programs.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                    <CheckCircle2 size={18} style={{ color: 'var(--accent-gold)' }} />
                    <span>Role-Based Access Control (RBAC)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                    <CheckCircle2 size={18} style={{ color: 'var(--accent-gold)' }} />
                    <span>Multi-Branch Salon Operations</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                    <CheckCircle2 size={18} style={{ color: 'var(--accent-gold)' }} />
                    <span>Real-Time POS Billing & Reports</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                    <CheckCircle2 size={18} style={{ color: 'var(--accent-gold)' }} />
                    <span>Automated SMS & WhatsApp CRM</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: '36px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
            <span>Encrypted Multi-Tenant Cloud Session</span>
          </div>
        </div>

        {/* Right Column: Dynamic Form (Sign In OR 14-Day Free Trial Register) */}
        <div style={{ padding: '36px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          {authMode === 'login' ? (
            /* ==================== SIGN IN VIEW ==================== */
            <>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-gold)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', marginBottom: '10px' }}>
                  <Sparkles size={12} /> EXECUTIVE LOGIN
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Welcome Back</h2>
                <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginTop: '4px' }}>Sign in to your salon administrative account</p>
              </div>

              {/* Demo Quick Role Switcher */}
              <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '800', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  ⚡ Quick Demo Role Switcher:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button type="button" onClick={() => handleQuickLogin('admin@saloon.com')} className="role-tag admin" style={{ cursor: 'pointer', padding: '5px 10px' }}>Super Admin</button>
                  <button type="button" onClick={() => handleQuickLogin('rahul@looks.com')} className="role-tag admin" style={{ cursor: 'pointer', padding: '5px 10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>Looks Salon (Tenant #2)</button>
                  <button type="button" onClick={() => handleQuickLogin('rohan.manager@saloon.com')} className="role-tag manager" style={{ cursor: 'pointer', padding: '5px 10px' }}>Manager</button>
                  <button type="button" onClick={() => handleQuickLogin('priya.reception@saloon.com')} className="role-tag receptionist" style={{ cursor: 'pointer', padding: '5px 10px' }}>Receptionist</button>
                </div>
              </div>

              {errorMsg && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', marginBottom: '18px', textAlign: 'center' }}>
                  {errorMsg}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label><Mail size={14} style={{ display: 'inline', marginRight: '6px' }} /> Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@saloon.com"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label><Lock size={14} style={{ display: 'inline', marginRight: '6px' }} /> Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{ width: '100%', paddingRight: '42px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-sub)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px'
                      }}
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.92rem' }}
                >
                  {loading ? 'Authenticating...' : 'Sign In to Portal'} <ArrowRight size={18} />
                </button>
              </form>

              {/* Optional Public Salon Registration Link */}
              {allowPublicSignup && (
                <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <p style={{ fontSize: '0.80rem', color: '#94a3b8', margin: '0 0 10px 0' }}>
                    Are you a new salon owner looking for software?
                  </p>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setErrorMsg(''); setRegErrorMsg(''); }}
                    style={{
                      background: 'rgba(217, 119, 6, 0.12)',
                      border: '1px solid rgba(217, 119, 6, 0.35)',
                      color: 'var(--accent-gold)',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Crown size={14} /> Start 14-Day Free Evaluation (Register Salon)
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ==================== 14-DAY FREE TRIAL REGISTRATION VIEW ==================== */
            <>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '800', marginBottom: '8px' }}>
                  <Crown size={12} /> NEW SALON ONBOARDING
                </div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: '800', letterSpacing: '-0.5px', margin: '0 0 4px 0' }}>Register Your Salon</h2>
                <p style={{ color: 'var(--text-sub)', fontSize: '0.82rem', margin: 0 }}>Start your 14-day free trial — instant setup</p>
              </div>

              {regSuccessMsg && (
                <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#4ade80', padding: '10px 14px', borderRadius: '8px', fontSize: '0.80rem', marginBottom: '14px', textAlign: 'center', fontWeight: '600' }}>
                  {regSuccessMsg}
                </div>
              )}

              {regErrorMsg && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.80rem', marginBottom: '14px', textAlign: 'center' }}>
                  {regErrorMsg}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '3px' }}>
                    Salon / Business Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bella Unisex Salon & Wellness"
                    value={regForm.salon_name}
                    onChange={(e) => setRegForm({ ...regForm, salon_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: '#fff', fontSize: '0.80rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '3px' }}>
                      Owner Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ankit Verma"
                      value={regForm.owner_name}
                      onChange={(e) => setRegForm({ ...regForm, owner_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: '#fff', fontSize: '0.80rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '3px' }}>
                      City / Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={regForm.city}
                      onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: '#fff', fontSize: '0.80rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '3px' }}>
                      Work Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. owner@bellasalon.com"
                      value={regForm.owner_email}
                      onChange={(e) => setRegForm({ ...regForm, owner_email: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: '#fff', fontSize: '0.80rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '3px' }}>
                      Mobile Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={regForm.owner_phone}
                      onChange={(e) => setRegForm({ ...regForm, owner_phone: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: '#fff', fontSize: '0.80rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '3px' }}>
                    Account Login Password * (min 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Create your secure password"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: '#fff', fontSize: '0.80rem' }}
                  />
                </div>

                {/* Plan Selection for Trial */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '5px' }}>
                    Select Evaluation Plan (14 Days Free):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {(availablePlans.length > 0 ? availablePlans : [
                      { id: 1, name: 'Starter', price_monthly: '999', max_branches: 1 },
                      { id: 2, name: 'Growth', price_monthly: '2499', max_branches: 3 },
                      { id: 3, name: 'Enterprise', price_monthly: '4999', max_branches: -1 }
                    ]).slice(0, 3).map(p => {
                      const isSelected = regForm.plan_id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setRegForm({ ...regForm, plan_id: p.id })}
                          style={{
                            padding: '8px 6px',
                            borderRadius: '8px',
                            background: isSelected ? 'rgba(217, 119, 6, 0.15)' : '#0f172a',
                            border: isSelected ? '1px solid var(--accent-gold)' : '1px solid #334155',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', fontWeight: '700', color: isSelected ? 'var(--accent-gold)' : '#fff' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                            ₹{Number(p.price_monthly).toLocaleString()}/mo
                          </div>
                          <div style={{ fontSize: '0.58rem', color: '#4ade80', fontWeight: '700', marginTop: '2px' }}>
                            14d Free Trial
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: '8px',
                    padding: '12px',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    boxShadow: '0 4px 15px var(--accent-gold-glow)'
                  }}
                >
                  {regLoading ? 'Provisioning Your Salon...' : '🚀 Start 14-Day Free Evaluation'}
                </button>
              </form>

              <div style={{ marginTop: '14px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setRegErrorMsg(''); setRegSuccessMsg(''); }}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Already have an account? Sign In to Portal
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}

export default LoginView;
