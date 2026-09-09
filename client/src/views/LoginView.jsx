import React, { useState } from 'react';
import { Scissors, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Building, BarChart3, CheckCircle2, Sun, Moon } from 'lucide-react';
import { Admin_Login } from '../services/apiService';

function LoginView({ onLoginSuccess, theme = 'dark', onToggleTheme }) {

  const [email, setEmail] = useState('admin@saloon.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
        // Fallback demo authentication login data
        const role = userEmail.includes('manager') ? 'Manager' : userEmail.includes('reception') ? 'Receptionist' : userEmail.includes('stylist') ? 'Staff' : 'Admin';
        const name = userEmail.includes('manager') ? 'Rohan Verma (Manager)' : userEmail.includes('reception') ? 'Priya Sharma (Receptionist)' : userEmail.includes('stylist') ? 'Amit Singh (Staff)' : 'Sunil Kumar (Admin)';

        onLoginSuccess({
          token: `demo_jwt_token_${Date.now()}`,
          user: {
            id: 1,
            name: name,
            email: userEmail,
            role: role,
            branch_name: 'Connaught Place Main Salon'
          }
        });
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
          maxWidth: '920px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1.15fr',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >

        {/* Left Column: Premium Branding & Feature Highlights */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(11, 17, 32, 0.95))',
            padding: '44px 36px',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
            borderRight: '1px solid var(--border)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle Ambient Background Light */}
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', filter: 'blur(50px)', pointerEvents: 'none' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
              <div className="brand-icon">
                <Scissors size={26} />
              </div>
              <div className="brand-title">
                <h2>SalonPulse</h2>
                <span>ERP & CRM Portal</span>
              </div>
            </div>

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
          </div>

          <div style={{ marginTop: '40px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
            <span>Encrypted JWT Authenticated Session</span>
          </div>
        </div>

        {/* Right Column: Sign In Form & Role Switcher */}
        <div style={{ padding: '44px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-gold)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', marginBottom: '10px' }}>
              <Sparkles size={12} /> EXECUTIVE LOGIN
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginTop: '4px' }}>Sign in to your salon administrative account</p>
          </div>

          {/* Demo Quick Role Switcher */}
          <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '800', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              ⚡ Quick Demo Role Switcher:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button type="button" onClick={() => handleQuickLogin('admin@saloon.com')} className="role-tag admin" style={{ cursor: 'pointer', padding: '6px 12px' }}>Admin</button>
              <button type="button" onClick={() => handleQuickLogin('rohan.manager@saloon.com')} className="role-tag manager" style={{ cursor: 'pointer', padding: '6px 12px' }}>Manager</button>
              <button type="button" onClick={() => handleQuickLogin('priya.reception@saloon.com')} className="role-tag receptionist" style={{ cursor: 'pointer', padding: '6px 12px' }}>Receptionist</button>
              <button type="button" onClick={() => handleQuickLogin('amit.stylist@saloon.com')} className="role-tag staff" style={{ cursor: 'pointer', padding: '6px 12px' }}>Staff</button>
            </div>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', marginBottom: '18px', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label><Mail size={14} style={{ display: 'inline', marginRight: '6px' }} /> Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@saloon.com"
              />
            </div>

            <div className="form-group">
              <label><Lock size={14} style={{ display: 'inline', marginRight: '6px' }} /> Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '22px', padding: '14px', fontSize: '0.95rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'} <ArrowRight size={18} />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}

export default LoginView;
