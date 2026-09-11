import React, { useState, useEffect } from 'react';
import {
  Award, Crown, Gift, Users, Share2, Plus, Edit2, CheckCircle, RefreshCw,
  Search, TrendingUp, AlertCircle, ArrowUpRight, DollarSign, Calendar, Copy,
  Check, Sparkles, Filter, ChevronRight, UserCheck
} from 'lucide-react';
import {
  Admin_Get_Membership_Tiers,
  Admin_Create_Membership_Tier,
  Admin_Update_Membership_Tier,
  Admin_Get_Enrolled_Members,
  Admin_Enroll_Customer,
  Admin_Get_Customers,
  Admin_Get_Loyalty_Ledger,
  Admin_Get_Referrals,
  Admin_Apply_Referral_Code
} from '../services/apiService';

const LoyaltyMembershipView = () => {
  const [activeTab, setActiveTab] = useState('tiers'); // 'tiers', 'members', 'referrals', 'ledger'
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState([]);
  const [members, setMembers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Modals state
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [tierForm, setTierForm] = useState({
    name: '', price: '', discount_percent: '', validity_days: '365', points_multiplier: '1.0', benefits: '', badge_color: '#00E676'
  });

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    customer_id: '', membership_id: '', amount_paid: '', notes: ''
  });

  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [referralForm, setReferralForm] = useState({
    referral_code: '', referred_customer_id: ''
  });

  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tiersRes, membersRes, custRes, ledgerRes, refRes] = await Promise.all([
        Admin_Get_Membership_Tiers(),
        Admin_Get_Enrolled_Members(),
        Admin_Get_Customers(),
        Admin_Get_Loyalty_Ledger(),
        Admin_Get_Referrals()
      ]);

      if (tiersRes.data?.success) setTiers(tiersRes.data.tiers);
      if (membersRes.data?.success) setMembers(membersRes.data.members);
      if (custRes.data?.success) setCustomers(custRes.data.customers);
      if (ledgerRes.data?.success) setLedger(ledgerRes.data.ledger);
      if (refRes.data?.success) setReferrals(refRes.data.referrals);
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
      showFeedback('error', 'Failed to load loyalty & membership data.');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 4000);
  };

  // Tier form handlers
  const handleOpenTierModal = (tier = null) => {
    if (tier) {
      setEditingTier(tier);
      setTierForm({
        name: tier.name,
        price: tier.price,
        discount_percent: tier.discount_percent,
        validity_days: tier.validity_days,
        points_multiplier: tier.points_multiplier,
        benefits: tier.benefits || '',
        badge_color: tier.badge_color || '#00E676'
      });
    } else {
      setEditingTier(null);
      setTierForm({
        name: '', price: '', discount_percent: '10', validity_days: '365', points_multiplier: '1.5', benefits: '', badge_color: '#00E676'
      });
    }
    setIsTierModalOpen(true);
  };

  const handleSaveTier = async (e) => {
    e.preventDefault();
    try {
      if (editingTier) {
        await Admin_Update_Membership_Tier(editingTier.id, tierForm);
        showFeedback('success', `Tier "${tierForm.name}" updated successfully!`);
      } else {
        await Admin_Create_Membership_Tier(tierForm);
        showFeedback('success', `New tier "${tierForm.name}" created successfully!`);
      }
      setIsTierModalOpen(false);
      fetchData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to save tier');
    }
  };

  // Enroll customer handlers
  const handleEnrollCustomer = async (e) => {
    e.preventDefault();
    if (!enrollForm.customer_id || !enrollForm.membership_id) {
      showFeedback('error', 'Please select both customer and membership plan');
      return;
    }
    try {
      await Admin_Enroll_Customer(enrollForm);
      showFeedback('success', 'Customer enrolled into membership plan successfully!');
      setIsEnrollModalOpen(false);
      setEnrollForm({ customer_id: '', membership_id: '', amount_paid: '', notes: '' });
      fetchData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to enroll customer');
    }
  };

  // Apply Referral Code handler
  const handleApplyReferral = async (e) => {
    e.preventDefault();
    if (!referralForm.referral_code || !referralForm.referred_customer_id) {
      showFeedback('error', 'Please enter referral code and select referred customer');
      return;
    }
    try {
      const res = await Admin_Apply_Referral_Code(referralForm);
      showFeedback('success', res.data?.message || 'Referral applied & bonus points credited!');
      setIsReferralModalOpen(false);
      setReferralForm({ referral_code: '', referred_customer_id: '' });
      fetchData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to apply referral code');
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Summary Metrics
  const activeMembersCount = members.filter(m => m.status === 'Active').length;
  const totalPointsIssued = ledger.reduce((sum, l) => l.points > 0 ? sum + l.points : sum, 0);
  const totalMemberRevenue = members.reduce((sum, m) => sum + parseFloat(m.amount_paid || 0), 0);

  return (
    <div style={{ padding: '24px', color: '#fff', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Title Banner */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Award size={28} color="#00E676" /> Loyalty & Membership Program
          </h1>
          <p style={{ color: '#90A4AE', fontSize: '14px', marginTop: '4px', margin: 0 }}>
            Tier plans (Silver, Gold, Platinum), referral tracking, automated discount rules & POS rewards.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            style={{
              padding: '10px 18px', background: 'linear-gradient(135deg, #00E676 0%, #00B0FF 100%)',
              color: '#0A0F1D', border: 'none', borderRadius: '8px', fontWeight: '700',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 15px rgba(0, 230, 118, 0.3)'
            }}
          >
            <Crown size={18} /> Enroll Member
          </button>
          <button
            onClick={() => setIsReferralModalOpen(true)}
            style={{
              padding: '10px 18px', background: '#1E293B', color: '#00E676',
              border: '1px solid #00E676', borderRadius: '8px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Share2 size={18} /> Apply Referral
          </button>
          <button
            onClick={fetchData}
            style={{
              padding: '10px', background: '#1E293B', color: '#90A4AE',
              border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer'
            }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback.msg && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
          background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 230, 118, 0.15)',
          border: `1px solid ${feedback.type === 'error' ? '#EF4444' : '#00E676'}`,
          color: feedback.type === 'error' ? '#EF4444' : '#00E676',
          display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500'
        }}>
          {feedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {feedback.msg}
        </div>
      )}

      {/* Metrics Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px', marginBottom: '28px'
      }}>
        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#90A4AE', fontSize: '13px', fontWeight: '600' }}>
            <span>ACTIVE MEMBERS</span>
            <Crown size={20} color="#FFD700" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginTop: '8px' }}>
            {activeMembersCount}
          </div>
          <div style={{ fontSize: '12px', color: '#00E676', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} /> {members.length} Total Subscriptions
          </div>
        </div>

        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#90A4AE', fontSize: '13px', fontWeight: '600' }}>
            <span>POINTS ISSUED</span>
            <Gift size={20} color="#00E676" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginTop: '8px' }}>
            {totalPointsIssued.toLocaleString()} pts
          </div>
          <div style={{ fontSize: '12px', color: '#90A4AE', marginTop: '4px' }}>
            1 Point = ₹1 Billing Discount
          </div>
        </div>

        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#90A4AE', fontSize: '13px', fontWeight: '600' }}>
            <span>REFERRAL CONVERSIONS</span>
            <Share2 size={20} color="#00B0FF" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginTop: '8px' }}>
            {referrals.length}
          </div>
          <div style={{ fontSize: '12px', color: '#00B0FF', marginTop: '4px' }}>
            100 Bonus Points / Referral
          </div>
        </div>

        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#90A4AE', fontSize: '13px', fontWeight: '600' }}>
            <span>MEMBERSHIP REVENUE</span>
            <DollarSign size={20} color="#E040FB" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginTop: '8px' }}>
            ₹{totalMemberRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#E040FB', marginTop: '4px' }}>
            Annual Plan Subscriptions
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{
        display: 'flex', gap: '8px', borderBottom: '1px solid #334155',
        marginBottom: '24px', overflowX: 'auto'
      }}>
        {[
          { id: 'tiers', label: 'Membership Tiers & Rules', icon: Crown },
          { id: 'members', label: 'Enrolled Members', icon: Users },
          { id: 'referrals', label: 'Referral Engine', icon: Share2 },
          { id: 'ledger', label: 'Points Audit Ledger', icon: Gift }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px', background: 'transparent', border: 'none',
                borderBottom: isActive ? '3px solid #00E676' : '3px solid transparent',
                color: isActive ? '#00E676' : '#90A4AE', fontWeight: isActive ? '700' : '500',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '14px', whiteSpace: 'nowrap', transition: 'all 0.2s'
              }}
            >
              <Icon size={18} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MEMBERSHIP TIERS */}
      {activeTab === 'tiers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>
              Available Membership Plans & Discounts
            </h3>
            <button
              onClick={() => handleOpenTierModal()}
              style={{
                padding: '8px 16px', background: '#1E293B', color: '#00E676',
                border: '1px solid #00E676', borderRadius: '8px', fontWeight: '600',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Plus size={16} /> Add Custom Tier Plan
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {tiers.map(tier => (
              <div
                key={tier.id}
                style={{
                  background: '#1E293B', border: `1px solid ${tier.badge_color || '#334155'}`,
                  borderRadius: '16px', padding: '24px', position: 'relative',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  boxShadow: `0 8px 24px rgba(0,0,0,0.4)`
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                      background: `${tier.badge_color}22`, color: tier.badge_color, border: `1px solid ${tier.badge_color}`
                    }}>
                      {tier.name}
                    </span>
                    <button
                      onClick={() => handleOpenTierModal(tier)}
                      style={{ background: 'none', border: 'none', color: '#90A4AE', cursor: 'pointer' }}
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>₹{parseFloat(tier.price).toLocaleString()}</span>
                    <span style={{ color: '#90A4AE', fontSize: '13px' }}>/ {tier.validity_days} days</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#E2E8F0' }}>
                      <CheckCircle size={16} color="#00E676" />
                      <span><strong>{tier.discount_percent}% Auto Discount</strong> on POS Billing</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#E2E8F0' }}>
                      <Sparkles size={16} color="#FFD700" />
                      <span><strong>{tier.points_multiplier}x Reward Points</strong> Multiplier</span>
                    </div>
                    {tier.benefits && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#94A3B8' }}>
                        <Crown size={16} color="#00B0FF" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{tier.benefits}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEnrollForm(prev => ({ ...prev, membership_id: tier.id, amount_paid: tier.price }));
                    setIsEnrollModalOpen(true);
                  }}
                  style={{
                    width: '100%', padding: '12px', background: `${tier.badge_color}25`,
                    color: tier.badge_color, border: `1px solid ${tier.badge_color}`, borderRadius: '8px',
                    fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                  }}
                >
                  Enroll Customer in {tier.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ENROLLED MEMBERS */}
      {activeTab === 'members' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
              <input
                type="text"
                placeholder="Search member name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 40px', background: '#1E293B',
                  border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155', color: '#90A4AE', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 16px' }}>Customer</th>
                  <th style={{ padding: '14px 16px' }}>Membership Tier</th>
                  <th style={{ padding: '14px 16px' }}>Discount %</th>
                  <th style={{ padding: '14px 16px' }}>Start / Expiry Date</th>
                  <th style={{ padding: '14px 16px' }}>Paid Amount</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {members
                  .filter(m => m.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.customer_phone?.includes(searchTerm))
                  .map(member => (
                    <tr key={member.id} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#fff' }}>{member.customer_name}</div>
                        <div style={{ fontSize: '12px', color: '#90A4AE' }}>{member.customer_phone}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
                          background: `${member.badge_color || '#00E676'}22`, color: member.badge_color || '#00E676',
                          border: `1px solid ${member.badge_color || '#00E676'}`
                        }}>
                          {member.membership_name}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: '700', color: '#00E676' }}>
                        {member.discount_percent}% Off
                      </td>
                      <td style={{ padding: '14px 16px', color: '#CBD5E1', fontSize: '13px' }}>
                        <div>Start: {new Date(member.start_date).toLocaleDateString()}</div>
                        <div style={{ color: '#94A3B8', fontSize: '12px' }}>Ends: {new Date(member.end_date).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                        ₹{parseFloat(member.amount_paid).toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                          background: member.status === 'Active' ? 'rgba(0,230,118,0.15)' : 'rgba(239,68,68,0.15)',
                          color: member.status === 'Active' ? '#00E676' : '#EF4444'
                        }}>
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#90A4AE' }}>
                      No active membership subscriptions found. Click "Enroll Member" to assign a plan!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REFERRAL ENGINE */}
      {activeTab === 'referrals' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Customer Referral Code Quick Lookup */}
            <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} color="#00E676" /> Customer Referral Codes & Links
              </h4>
              <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '16px' }}>
                Every customer gets a unique referral code. When a referred friend completes a service, both receive bonus reward points!
              </p>

              <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {customers.slice(0, 5).map(cust => (
                  <div key={cust.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: '#0F172A', borderRadius: '8px', border: '1px solid #334155'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{cust.name}</div>
                      <div style={{ fontSize: '11px', color: '#90A4AE' }}>Code: <strong style={{ color: '#00E676' }}>{cust.referral_code}</strong></div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(cust.referral_code, cust.id)}
                      style={{
                        padding: '6px 12px', background: '#1E293B', border: '1px solid #00E676',
                        color: '#00E676', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      {copiedCode === cust.id ? <Check size={14} /> : <Copy size={14} />}
                      {copiedCode === cust.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Apply Referral Reward Banner */}
            <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', border: '1px solid #00E676', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#00E676', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} /> Apply Referral Code & Credit Rewards
              </h4>
              <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '16px' }}>
                Enter the referral code used by a customer during sign-up to automatically trigger <strong>100 Points for Referrer</strong> + <strong>50 Welcome Points for Referred Client</strong>.
              </p>

              <button
                onClick={() => setIsReferralModalOpen(true)}
                style={{
                  padding: '12px 20px', background: '#00E676', color: '#0A0F1D',
                  border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <UserCheck size={18} /> Apply Referral Trigger
              </button>
            </div>
          </div>

          {/* Referral Conversions Audit Table */}
          <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', fontWeight: '600', color: '#fff' }}>
              Referral Log & Bonus Points Awarded
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155', color: '#90A4AE', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 16px' }}>Referrer Customer</th>
                  <th style={{ padding: '14px 16px' }}>Referral Code</th>
                  <th style={{ padding: '14px 16px' }}>Referred Client</th>
                  <th style={{ padding: '14px 16px' }}>Reward Credited</th>
                  <th style={{ padding: '14px 16px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map(ref => (
                  <tr key={ref.id} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>{ref.referrer_name}</td>
                    <td style={{ padding: '14px 16px' }}><code style={{ color: '#00E676', background: '#0F172A', padding: '2px 6px', borderRadius: '4px' }}>{ref.referral_code}</code></td>
                    <td style={{ padding: '14px 16px', color: '#CBD5E1' }}>{ref.referred_name || 'New Customer'}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#00E676' }}>+{ref.reward_points} pts</td>
                    <td style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '13px' }}>{new Date(ref.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {referrals.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#90A4AE' }}>
                      No referral logs recorded yet. Use referral codes to reward clients!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: POINTS AUDIT LEDGER */}
      {activeTab === 'ledger' && (
        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', fontWeight: '600', color: '#fff' }}>
            System Loyalty Points Audit Ledger (Earned & Redeemed)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0F172A', borderBottom: '1px solid #334155', color: '#90A4AE', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 16px' }}>Date</th>
                <th style={{ padding: '14px 16px' }}>Customer</th>
                <th style={{ padding: '14px 16px' }}>Type</th>
                <th style={{ padding: '14px 16px' }}>Points</th>
                <th style={{ padding: '14px 16px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map(item => {
                const isPositive = item.points > 0;
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                    <td style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '13px' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{item.customer_name}</div>
                      <div style={{ fontSize: '12px', color: '#90A4AE' }}>{item.customer_phone}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                        background: item.transaction_type === 'earned' ? 'rgba(0,230,118,0.15)' :
                                    item.transaction_type === 'redeemed' ? 'rgba(239,68,68,0.15)' : 'rgba(0,176,255,0.15)',
                        color: item.transaction_type === 'earned' ? '#00E676' :
                               item.transaction_type === 'redeemed' ? '#EF4444' : '#00B0FF'
                      }}>
                        {item.transaction_type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: isPositive ? '#00E676' : '#EF4444' }}>
                      {isPositive ? `+${item.points}` : item.points} pts
                    </td>
                    <td style={{ padding: '14px 16px', color: '#CBD5E1', fontSize: '13px' }}>
                      {item.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT TIER */}
      {isTierModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: '#1E293B', border: '1px solid #334155', borderRadius: '16px',
            width: '100%', maxWidth: '500px', padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
              {editingTier ? 'Edit Membership Plan' : 'Create New Membership Plan'}
            </h3>
            <form onSubmit={handleSaveTier} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Tier Name</label>
                <input
                  type="text" required placeholder="e.g. Gold VIP Member"
                  value={tierForm.name} onChange={e => setTierForm({ ...tierForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Fee (₹)</label>
                  <input
                    type="number" required placeholder="2499"
                    value={tierForm.price} onChange={e => setTierForm({ ...tierForm, price: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Auto Discount %</label>
                  <input
                    type="number" required placeholder="10"
                    value={tierForm.discount_percent} onChange={e => setTierForm({ ...tierForm, discount_percent: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Points Multiplier</label>
                  <input
                    type="number" step="0.1" required placeholder="1.5"
                    value={tierForm.points_multiplier} onChange={e => setTierForm({ ...tierForm, points_multiplier: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Badge Color</label>
                  <input
                    type="color" value={tierForm.badge_color} onChange={e => setTierForm({ ...tierForm, badge_color: e.target.value })}
                    style={{ width: '100%', height: '40px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Benefits Summary</label>
                <textarea
                  rows="2" placeholder="e.g. Free welcome beverage + Priority booking slots"
                  value={tierForm.benefits} onChange={e => setTierForm({ ...tierForm, benefits: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: '#00E676', color: '#0A0F1D', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Save Tier Plan
                </button>
                <button
                  type="button" onClick={() => setIsTierModalOpen(false)}
                  style={{ flex: 1, padding: '12px', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ENROLL CUSTOMER */}
      {isEnrollModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: '#1E293B', border: '1px solid #334155', borderRadius: '16px',
            width: '100%', maxWidth: '480px', padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
              Enroll Customer into Membership
            </h3>
            <form onSubmit={handleEnrollCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Select Customer</label>
                <select
                  required value={enrollForm.customer_id}
                  onChange={e => setEnrollForm({ ...enrollForm, customer_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Select Membership Plan</label>
                <select
                  required value={enrollForm.membership_id}
                  onChange={e => {
                    const selected = tiers.find(t => t.id === parseInt(e.target.value));
                    setEnrollForm({
                      ...enrollForm,
                      membership_id: e.target.value,
                      amount_paid: selected ? selected.price : ''
                    });
                  }}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="">-- Choose Plan Tier --</option>
                  {tiers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (₹{t.price} / {t.discount_percent}% Off)</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Amount Collected (₹)</label>
                <input
                  type="number" required
                  value={enrollForm.amount_paid}
                  onChange={e => setEnrollForm({ ...enrollForm, amount_paid: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: '#00E676', color: '#0A0F1D', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Confirm Enrollment
                </button>
                <button
                  type="button" onClick={() => setIsEnrollModalOpen(false)}
                  style={{ flex: 1, padding: '12px', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: APPLY REFERRAL TRIGGER */}
      {isReferralModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: '#1E293B', border: '1px solid #334155', borderRadius: '16px',
            width: '100%', maxWidth: '480px', padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
              Apply Referral Reward Trigger
            </h3>
            <form onSubmit={handleApplyReferral} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Referral Code Used</label>
                <input
                  type="text" required placeholder="e.g. RAHUL001"
                  value={referralForm.referral_code}
                  onChange={e => setReferralForm({ ...referralForm, referral_code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff', textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#90A4AE', display: 'block', marginBottom: '4px' }}>Select Referred New Client</label>
                <select
                  required value={referralForm.referred_customer_id}
                  onChange={e => setReferralForm({ ...referralForm, referred_customer_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="">-- Choose Referred Client --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: '#00E676', color: '#0A0F1D', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Apply & Credit Points
                </button>
                <button
                  type="button" onClick={() => setIsReferralModalOpen(false)}
                  style={{ flex: 1, padding: '12px', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LoyaltyMembershipView;
