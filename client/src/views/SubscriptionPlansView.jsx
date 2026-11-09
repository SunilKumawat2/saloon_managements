import React, { useState, useEffect } from 'react';
import {
  Check,
  Zap,
  Crown,
  Sparkles,
  Building2,
  Users,
  ShieldCheck,
  CreditCard,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Clock,
  HelpCircle,
  RefreshCw,
  X
} from 'lucide-react';
import {
  Get_Subscription_Plans,
  Get_My_Plan_Usage,
  Change_Tenant_Plan,
  Super_Admin_Update_Plan,
  Super_Admin_Toggle_Plan_Status
} from '../services/apiService';

const SubscriptionPlansView = ({ currentUser }) => {
  const [plans, setPlans] = useState([]);
  const [myUsage, setMyUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // Plan Switch / Upgrade Modal
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Super Admin Plan Edit Modal
  const [editingPlan, setEditingPlan] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    price_monthly: '',
    price_yearly: '',
    max_branches: '',
    max_staff: '',
    description: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const isSuperAdmin = Boolean(
    currentUser?.is_super_admin === true ||
    currentUser?.email === 'admin@saloon.com' ||
    String(currentUser?.role || currentUser?.role_name || '').toLowerCase().includes('super')
  );

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, usageRes] = await Promise.all([
        Get_Subscription_Plans(),
        Get_My_Plan_Usage().catch(() => ({ data: { data: null } }))
      ]);

      if (plansRes.data?.data) {
        setPlans(plansRes.data.data);
      }
      if (usageRes.data?.data) {
        setMyUsage(usageRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      showFeedback('error', err.data?.message || err.message || 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenUpgradeModal = (plan) => {
    setSelectedPlanForUpgrade(plan);
  };

  const handleConfirmPlanChange = async () => {
    if (!selectedPlanForUpgrade) return;
    setIsUpgrading(true);
    try {
      const res = await Change_Tenant_Plan({
        plan_id: selectedPlanForUpgrade.id,
        billing_cycle: billingCycle
      });
      showFeedback('success', res.data?.message || `Upgraded to ${selectedPlanForUpgrade.name} Plan!`);
      setSelectedPlanForUpgrade(null);
      await loadData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to change subscription plan');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleOpenEditModal = (plan, e) => {
    e.stopPropagation();
    setEditingPlan(plan);
    setEditFormData({
      name: plan.name,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_branches: plan.max_branches,
      max_staff: plan.max_staff,
      description: plan.description || ''
    });
  };

  const handleSavePlanEdit = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    setIsSavingEdit(true);
    try {
      const res = await Super_Admin_Update_Plan(editingPlan.id, editFormData);
      showFeedback('success', res.data?.message || 'Plan settings updated successfully!');
      setEditingPlan(null);
      await loadData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to update plan');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleTogglePlanStatus = async (planId, e) => {
    e.stopPropagation();
    try {
      const res = await Super_Admin_Toggle_Plan_Status(planId);
      showFeedback('success', res.data?.message || 'Plan status toggled');
      await loadData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to update plan status');
    }
  };

  // Helper for feature bullets
  const getFeatureListForPlan = (planCode) => {
    switch (planCode) {
      case 'STARTER':
        return [
          { text: 'Single Salon Branch Outlet', highlight: true },
          { text: 'Up to 4 Stylists & Staff Members', highlight: true },
          { text: 'Fast POS Counter Billing & Thermal Receipts', highlight: false },
          { text: 'Appointments Calendar & Slot Booking', highlight: false },
          { text: 'Customer CRM & Member Registry', highlight: false },
          { text: 'Daily Sales & Cash Summary', highlight: false }
        ];
      case 'GROWTH':
        return [
          { text: 'Up to 3 Active Branch Locations', highlight: true },
          { text: 'Up to 15 Stylists & Staff Members', highlight: true },
          { text: 'Everything in Starter, plus:', highlight: false },
          { text: 'Multi-Branch Inventory & Stock Management', highlight: true },
          { text: 'Daily Staff Attendance & Overtime Tracker', highlight: true },
          { text: 'White Label & Custom Brand Palette Themes', highlight: true },
          { text: 'Bundled Combo Packages & Coupons', highlight: false }
        ];
      case 'ENTERPRISE':
        return [
          { text: 'Unlimited Branch Outlets & Franchises', highlight: true },
          { text: 'Unlimited Stylists & Staff Accounts', highlight: true },
          { text: 'Everything in Growth, plus:', highlight: false },
          { text: 'WhatsApp & SMS Marketing Automation Engine', highlight: true },
          { text: 'Salon Assets & Rental Equipment Hub', highlight: true },
          { text: 'Multi-Tenant Razorpay Payment Gateways', highlight: true },
          { text: 'PostgreSQL Audit Logs & DB Backups', highlight: true },
          { text: 'Priority 24/7 Dedicated SaaS Support', highlight: false }
        ];
      default:
        return [
          { text: 'Full Platform Access', highlight: true }
        ];
    }
  };

  const currentPlanId = myUsage?.plan?.id;

  return (
    <div style={{ padding: '20px 24px', color: '#e2e8f0', minHeight: '100vh', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: 'var(--active-bg)', border: '1px solid var(--border-gold)', color: 'var(--accent-gold)', fontSize: '0.72rem', fontWeight: '700', marginBottom: '8px' }}>
            <Sparkles size={13} />
            SalonPulse B2B SaaS Ecosystem
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Crown style={{ color: 'var(--accent-gold)' }} size={24} />
            Subscription Plans & Quota Manager
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '4px', marginBottom: 0 }}>
            Choose the optimal tier for your salon, track multi-branch quotas, or modify global SaaS subscription plans.
          </p>
        </div>

        {/* Billing Cycle Switcher */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '30px',
          padding: '4px',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '6px 16px',
              borderRadius: '24px',
              border: 'none',
              background: billingCycle === 'monthly' ? 'var(--accent-gold)' : 'transparent',
              color: billingCycle === 'monthly' ? '#ffffff' : '#94a3b8',
              fontWeight: '700',
              fontSize: '0.76rem',
              cursor: 'pointer',
              boxShadow: billingCycle === 'monthly' ? '0 2px 8px var(--accent-gold-glow)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            style={{
              padding: '6px 16px',
              borderRadius: '24px',
              border: 'none',
              background: billingCycle === 'yearly' ? 'var(--accent-gold)' : 'transparent',
              color: billingCycle === 'yearly' ? '#ffffff' : '#94a3b8',
              fontWeight: '700',
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: billingCycle === 'yearly' ? '0 2px 8px var(--accent-gold-glow)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Yearly Billing
            <span style={{
              background: '#22c55e',
              color: '#064e3b',
              fontSize: '0.62rem',
              fontWeight: '900',
              padding: '1px 6px',
              borderRadius: '12px'
            }}>
              SAVE 17%
            </span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.msg && (
        <div style={{
          background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
          border: `1px solid ${feedback.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
          color: feedback.type === 'error' ? '#f87171' : '#4ade80',
          padding: '10px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.82rem',
          fontWeight: '600'
        }}>
          {feedback.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {feedback.msg}
        </div>
      )}

      {/* Active Salon Plan & Live Resource Quotas Bar */}
      {myUsage && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid var(--border-gold)',
          borderRadius: '14px',
          padding: '18px 24px',
          marginBottom: '28px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '14px'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Subscribed Salon Organization
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#ffffff', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {myUsage.tenant?.name || 'Main Salon Group'}
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: myUsage.tenant?.status === 'Active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                  color: myUsage.tenant?.status === 'Active' ? '#4ade80' : '#facc15',
                  border: `1px solid ${myUsage.tenant?.status === 'Active' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`
                }}>
                  ● {myUsage.tenant?.status || 'Active'}
                </span>
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>Current Subscribed Tier</div>
                <div style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--accent-gold)' }}>
                  👑 {myUsage.plan?.name || 'Enterprise'} Plan
                </div>
              </div>
              {myUsage.tenant?.days_remaining !== null && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>Validity Remaining</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#ffffff' }}>
                    {myUsage.tenant.days_remaining > 365 ? 'Lifetime Access' : `${myUsage.tenant.days_remaining} Days`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quota Meters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px'
          }}>
            {/* Meter 1: Branches */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={13} style={{ color: 'var(--accent-gold)' }} /> Branch Outlets
                </span>
                <span style={{ fontWeight: '700', color: '#ffffff' }}>
                  {myUsage.usage?.branches_used} / {myUsage.plan?.max_branches === -1 ? 'Unlimited' : myUsage.plan?.max_branches}
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: myUsage.plan?.max_branches === -1 ? '100%' : `${Math.min(100, (myUsage.usage?.branches_used / (myUsage.plan?.max_branches || 1)) * 100)}%`,
                  background: 'var(--accent-gold)'
                }} />
              </div>
            </div>

            {/* Meter 2: Staff */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={13} style={{ color: 'var(--accent-gold)' }} /> Stylists & Staff
                </span>
                <span style={{ fontWeight: '700', color: '#ffffff' }}>
                  {myUsage.usage?.staff_used} / {myUsage.plan?.max_staff === -1 ? 'Unlimited' : myUsage.plan?.max_staff}
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: myUsage.plan?.max_staff === -1 ? '100%' : `${Math.min(100, (myUsage.usage?.staff_used / (myUsage.plan?.max_staff || 1)) * 100)}%`,
                  background: 'var(--accent-gold)'
                }} />
              </div>
            </div>

            {/* Meter 3: Registered Clients */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>CRM Customers</span>
                <span style={{ fontWeight: '700', color: '#4ade80' }}>
                  {myUsage.usage?.customers_count} Registered
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                Unlimited customer database storage
              </div>
            </div>

            {/* Meter 4: Invoices Generated */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>POS Invoices</span>
                <span style={{ fontWeight: '700', color: '#38bdf8' }}>
                  {myUsage.usage?.bills_count} Invoices
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                Encrypted thermal bills & ledger history
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3 Core Pricing Tier Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'stretch'
      }}>
        {plans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          const isGrowth = plan.code === 'GROWTH';
          const isEnterprise = plan.code === 'ENTERPRISE';
          const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
          const cycleLabel = billingCycle === 'yearly' ? '/ year' : '/ month';
          const features = getFeatureListForPlan(plan.code);

          return (
            <div
              key={plan.id}
              style={{
                background: isGrowth
                  ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
                  : 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(16px)',
                border: isCurrent
                  ? '2px solid var(--accent-gold)'
                  : isGrowth
                  ? '2px solid rgba(56, 189, 248, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: isCurrent
                  ? '0 8px 30px var(--accent-gold-glow)'
                  : isGrowth
                  ? '0 8px 24px rgba(56, 189, 248, 0.15)'
                  : 'none',
                transform: isGrowth ? 'scale(1.02)' : 'none',
                transition: 'all 0.25s ease'
              }}
            >
              {/* Popular Ribbon on Growth */}
              {isGrowth && !isCurrent && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '24px',
                  background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: '900',
                  padding: '3px 12px',
                  borderRadius: '20px',
                  letterSpacing: '0.04em',
                  boxShadow: '0 2px 10px rgba(56, 189, 248, 0.4)'
                }}>
                  ⭐ MOST POPULAR
                </div>
              )}

              {/* Current Active Plan Ribbon */}
              {isCurrent && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '24px',
                  background: 'var(--accent-gold)',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: '900',
                  padding: '3px 12px',
                  borderRadius: '20px',
                  letterSpacing: '0.04em',
                  boxShadow: '0 2px 10px var(--accent-gold-glow)'
                }}>
                  ✓ YOUR ACTIVE PLAN
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                      {plan.name} Plan
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '4px', marginBottom: '14px', minHeight: '36px' }}>
                      {plan.description}
                    </p>
                  </div>

                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditModal(plan, e)}
                      title="Super Admin: Edit Plan Pricing & Limits"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#cbd5e1',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.68rem',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                  )}
                </div>

                {/* Price Display */}
                <div style={{ margin: '14px 0 20px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '2.1rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>
                    ₹{Number(price).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.80rem', color: '#94a3b8', fontWeight: '500' }}>
                    {cycleLabel}
                  </span>
                  {billingCycle === 'yearly' && (
                    <span style={{ fontSize: '0.72rem', color: '#22c55e', marginLeft: '6px' }}>
                      (₹{Math.round(price / 12)}/mo billed annually)
                    </span>
                  )}
                </div>

                {/* Core Quotas Strip */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={16} style={{ color: 'var(--accent-gold)' }} />
                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>BRANCHES</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#ffffff' }}>
                        {plan.max_branches === -1 ? 'Unlimited' : `${plan.max_branches} Outlets`}
                      </div>
                    </div>
                  </div>
                  <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.1)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} style={{ color: 'var(--accent-gold)' }} />
                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>STAFF TEAM</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#ffffff' }}>
                        {plan.max_staff === -1 ? 'Unlimited' : `Up to ${plan.max_staff}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
                  <div style={{ fontSize: '0.70rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    Features & Platform Capabilities:
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {features.map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.78rem' }}>
                        <div style={{
                          background: feat.highlight ? 'var(--active-bg)' : 'rgba(34, 197, 94, 0.15)',
                          color: feat.highlight ? 'var(--accent-gold)' : '#4ade80',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          <Check size={11} />
                        </div>
                        <span style={{
                          color: feat.highlight ? '#ffffff' : '#cbd5e1',
                          fontWeight: feat.highlight ? '600' : '400'
                        }}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ marginTop: '28px' }}>
                {isCurrent ? (
                  <button
                    disabled
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#94a3b8',
                      fontWeight: '700',
                      fontSize: '0.80rem',
                      cursor: 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle2 size={16} /> Currently Active Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenUpgradeModal(plan)}
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '8px',
                      background: isGrowth ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'var(--accent-gold)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: isGrowth ? '0 4px 14px rgba(56, 189, 248, 0.35)' : '0 4px 14px var(--accent-gold-glow)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    Switch to {plan.name} Tier <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: Confirm Plan Upgrade / Switch */}
      {selectedPlanForUpgrade && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid var(--border-gold)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={20} style={{ color: 'var(--accent-gold)' }} />
                Confirm Plan Switch
              </h3>
              <button onClick={() => setSelectedPlanForUpgrade(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: '1.5' }}>
              You are about to switch your salon subscription to the <strong>{selectedPlanForUpgrade.name} Plan</strong> on a <strong>{billingCycle}</strong> cycle.
            </p>

            <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px', padding: '14px', margin: '16px 0', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.80rem' }}>
                <span style={{ color: '#94a3b8' }}>Target Tier:</span>
                <strong style={{ color: '#ffffff' }}>{selectedPlanForUpgrade.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.80rem' }}>
                <span style={{ color: '#94a3b8' }}>Subscription Cost:</span>
                <strong style={{ color: 'var(--accent-gold)', fontSize: '0.95rem' }}>
                  ₹{Number(billingCycle === 'yearly' ? selectedPlanForUpgrade.price_yearly : selectedPlanForUpgrade.price_monthly).toLocaleString()} {billingCycle === 'yearly' ? '/ year' : '/ month'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                <span style={{ color: '#94a3b8' }}>Branch & Staff Quota:</span>
                <strong style={{ color: '#ffffff' }}>
                  {selectedPlanForUpgrade.max_branches === -1 ? 'Unlimited' : `${selectedPlanForUpgrade.max_branches} Branches`} • {selectedPlanForUpgrade.max_staff === -1 ? 'Unlimited' : `${selectedPlanForUpgrade.max_staff} Staff`}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedPlanForUpgrade(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  fontWeight: '600',
                  fontSize: '0.80rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpgrading}
                onClick={handleConfirmPlanChange}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'var(--accent-gold)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.80rem',
                  cursor: isUpgrading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px var(--accent-gold-glow)'
                }}
              >
                {isUpgrading ? 'Updating Plan...' : 'Activate Plan Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Super Admin Edit Pricing & Limits */}
      {editingPlan && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid var(--border-gold)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} style={{ color: 'var(--accent-gold)' }} />
                Super Admin: Edit {editingPlan.name} Plan
              </h3>
              <button onClick={() => setEditingPlan(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlanEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Plan Display Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Monthly Price (₹)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={editFormData.price_monthly}
                    onChange={(e) => setEditFormData({ ...editFormData, price_monthly: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Yearly Price (₹)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={editFormData.price_yearly}
                    onChange={(e) => setEditFormData({ ...editFormData, price_yearly: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Max Branches (-1 for Unlimited)</label>
                  <input
                    type="number"
                    required
                    value={editFormData.max_branches}
                    onChange={(e) => setEditFormData({ ...editFormData, max_branches: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Max Staff (-1 for Unlimited)</label>
                  <input
                    type="number"
                    required
                    value={editFormData.max_staff}
                    onChange={(e) => setEditFormData({ ...editFormData, max_staff: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>Short Description</label>
                <textarea
                  rows="2"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    fontSize: '0.80rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--accent-gold)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.80rem',
                    cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 10px var(--accent-gold-glow)'
                  }}
                >
                  {isSavingEdit ? 'Saving...' : 'Save Plan Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlansView;
