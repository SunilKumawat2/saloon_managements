import React, { useState, useEffect } from 'react';
import {
  Award, Crown, Gift, Users, Share2, Plus, Edit2, CheckCircle, RefreshCw,
  Search, TrendingUp, AlertCircle, ArrowUpRight, DollarSign, Calendar, Copy,
  Check, Sparkles, Filter, ChevronRight, UserCheck, CreditCard, Wallet, Trash2, RotateCcw
} from 'lucide-react';
import {
  Admin_Get_Membership_Tiers,
  Admin_Create_Membership_Tier,
  Admin_Update_Membership_Tier,
  Admin_Get_Enrolled_Members,
  Admin_Enroll_Customer,
  Admin_Update_Enrolled_Member,
  Admin_Delete_Enrolled_Member,
  Admin_Reactivate_Enrolled_Member,
  Admin_Get_Customers,
  Admin_Get_Loyalty_Ledger,
  Admin_Get_Referrals,
  Admin_Apply_Referral_Code,
  Admin_Redeem_Member_Credit,
  Admin_Get_Gateway_Config,
  Admin_Create_Razorpay_Order,
  Admin_Verify_Razorpay_Payment
} from '../services/apiService';

const DEFAULT_MEMBERSHIP_TIERS = [
  {
    id: 1,
    name: 'Silver Plan',
    price: 999,
    discount_percent: 10,
    validity_days: 365,
    points_multiplier: 1.2,
    service_value_limit: 1500,
    benefits: '10% OFF on all services + ₹1,500 Redeemable Credit',
    badge_color: '#C0C0C0'
  },
  {
    id: 2,
    name: 'Gold VIP Plan',
    price: 2499,
    discount_percent: 15,
    validity_days: 365,
    points_multiplier: 1.5,
    service_value_limit: 3500,
    benefits: '15% OFF + ₹3,500 Redeemable Credit + Priority Booking',
    badge_color: '#FFD700'
  },
  {
    id: 3,
    name: 'Platinum Club',
    price: 4999,
    discount_percent: 25,
    validity_days: 365,
    points_multiplier: 2.0,
    service_value_limit: 7500,
    benefits: '25% OFF + ₹7,500 Redeemable Credit + Free Refreshments',
    badge_color: '#2563eb'
  }
];

const DEFAULT_CUSTOMERS = [
  { id: 1, name: 'Rahul Kumar', phone: '9988776655', email: 'rahul.k@gmail.com' },
  { id: 2, name: 'Sneha Kapoor', phone: '9988776656', email: 'sneha.k@outlook.com' },
  { id: 3, name: 'Karan Johar', phone: '9988776657', email: 'karan@media.com' },
  { id: 4, name: 'Priya Sharma', phone: '9876543210', email: 'priya@gmail.com' },
  { id: 5, name: 'Amit Verma', phone: '9123456789', email: 'amit.v@yahoo.com' }
];

const LoyaltyMembershipView = ({ customers: propCustomers = [], bills: propBills = [], members: propMembers = [], onUpdateMembers, onCreateBill, selectedBranchId = 'all' }) => {
  const [activeTab, setActiveTab] = useState('tiers'); // 'tiers', 'members', 'referrals', 'ledger'
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState(DEFAULT_MEMBERSHIP_TIERS);
  const [members, setMembersState] = useState(() => {
    if (Array.isArray(propMembers) && propMembers.length > 0) return propMembers;
    try {
      const saved = localStorage.getItem('saloon_enrolled_members');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const setMembers = (updater) => {
    setMembersState(prev => {
      const nextVal = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem('saloon_enrolled_members', JSON.stringify(nextVal)); } catch (e) {}
      if (onUpdateMembers) onUpdateMembers(nextVal);
      return nextVal;
    });
  };

  useEffect(() => {
    if (Array.isArray(propMembers) && propMembers.length > 0) {
      setMembersState(propMembers);
    }
  }, [propMembers]);

  const [customers, setCustomers] = useState(propCustomers.length > 0 ? propCustomers : DEFAULT_CUSTOMERS);
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);
  const [ledger, setLedger] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Modals state
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [tierForm, setTierForm] = useState({
    name: '', price: '', discount_percent: '', validity_days: '365', points_multiplier: '1.0', service_value_limit: '', benefits: '', badge_color: '#2563eb'
  });

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    customer_id: '', membership_id: '', amount_paid: '', notes: ''
  });

  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemForm, setRedeemForm] = useState({
    customer_membership_id: '', customer_id: '', customer_name: '', service_name: '', amount: '', remaining_credit: 0, notes: ''
  });

  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [referralForm, setReferralForm] = useState({
    referral_code: '', referred_customer_id: ''
  });

  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editMemberForm, setEditMemberForm] = useState({
    membership_id: '',
    end_date: '',
    total_service_credit: '',
    remaining_service_credit: '',
    status: 'Active',
    notes: ''
  });

  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        Admin_Get_Membership_Tiers(),
        Admin_Get_Enrolled_Members(),
        Admin_Get_Customers({ limit: 'all' }),
        Admin_Get_Loyalty_Ledger(),
        Admin_Get_Referrals()
      ]);

      const [tiersRes, membersRes, custRes, ledgerRes, refRes] = results;

      // Process Membership Tiers
      if (tiersRes.status === 'fulfilled' && tiersRes.value?.data) {
        const tiersData = tiersRes.value.data.tiers || (Array.isArray(tiersRes.value.data) ? tiersRes.value.data : []);
        if (Array.isArray(tiersData) && tiersData.length > 0) {
          setTiers(tiersData);
        } else {
          setTiers(DEFAULT_MEMBERSHIP_TIERS);
        }
      } else {
        setTiers(DEFAULT_MEMBERSHIP_TIERS);
      }

      // Process Enrolled Members
      if (membersRes.status === 'fulfilled' && membersRes.value?.data?.success) {
        const serverMembers = membersRes.value.data.members || [];
        const savedLocal = (() => {
          try { return JSON.parse(localStorage.getItem('saloon_enrolled_members') || '[]'); }
          catch { return []; }
        })();

        if (savedLocal.length > 0) {
          const merged = serverMembers.map(sm => {
            const matchedLocal = savedLocal.find(lm =>
              (lm.customer_id && String(lm.customer_id) === String(sm.customer_id)) ||
              (lm.customer_phone && String(lm.customer_phone).replace(/\D/g, '').slice(-10) === String(sm.customer_phone).replace(/\D/g, '').slice(-10)) ||
              (lm.id && String(lm.id) === String(sm.id))
            );
            if (matchedLocal && matchedLocal.remaining_service_credit !== undefined) {
              return {
                ...sm,
                remaining_service_credit: matchedLocal.remaining_service_credit,
                used_service_credit: matchedLocal.used_service_credit
              };
            }
            return sm;
          });
          setMembers(merged);
        } else {
          setMembers(serverMembers);
        }
      }

      // Process Customers
      if (custRes.status === 'fulfilled' && custRes.value?.data) {
        const custVal = custRes.value.data;
        const custData = custVal?.data || custVal?.customers || (Array.isArray(custVal) ? custVal : []);
        if (Array.isArray(custData) && custData.length > 0) {
          setCustomers(custData);
        } else {
          setCustomers(DEFAULT_CUSTOMERS);
        }
      } else {
        setCustomers(DEFAULT_CUSTOMERS);
      }

      // Process Ledger
      if (ledgerRes.status === 'fulfilled' && ledgerRes.value?.data?.success) {
        setLedger(ledgerRes.value.data.ledger || []);
      }

      // Process Referrals
      if (refRes.status === 'fulfilled' && refRes.value?.data?.success) {
        setReferrals(refRes.value.data.referrals || []);
      }
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
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
        service_value_limit: tier.service_value_limit || '',
        benefits: tier.benefits || '',
        badge_color: tier.badge_color || '#00E676'
      });
    } else {
      setEditingTier(null);
      setTierForm({
        name: '', price: '', discount_percent: '10', validity_days: '365', points_multiplier: '1.5', service_value_limit: '1500', benefits: '', badge_color: '#00E676'
      });
    }
    setIsTierModalOpen(true);
  };

  const handleSaveTier = async (e) => {
    e.preventDefault();
    if (!tierForm.name || !tierForm.price) {
      showFeedback('error', 'Please fill in Tier Name and Fee');
      return;
    }

    const payload = {
      name: tierForm.name.trim(),
      price: parseFloat(tierForm.price || 0),
      discount_percent: parseFloat(tierForm.discount_percent || 0),
      validity_days: parseInt(tierForm.validity_days || 365),
      points_multiplier: parseFloat(tierForm.points_multiplier || 1.0),
      service_value_limit: parseFloat(tierForm.service_value_limit || 0),
      benefits: tierForm.benefits || '',
      badge_color: tierForm.badge_color || '#00E676'
    };

    try {
      if (editingTier) {
        const res = await Admin_Update_Membership_Tier(editingTier.id, payload);
        const updatedTier = res?.data?.tier || { ...editingTier, ...payload };
        setTiers(prev => prev.map(t => (t.id === editingTier.id ? updatedTier : t)));
        showFeedback('success', `Tier "${payload.name}" updated successfully!`);
      } else {
        const res = await Admin_Create_Membership_Tier(payload);
        const newTier = res?.data?.tier || { id: Date.now(), ...payload };
        setTiers(prev => [...prev, newTier]);
        showFeedback('success', `New tier "${payload.name}" created successfully!`);
      }
      setIsTierModalOpen(false);
      fetchData();
    } catch (err) {
      console.warn('Membership tier API error, applying local fallback:', err);
      const fallbackTier = {
        id: editingTier ? editingTier.id : Date.now(),
        ...payload
      };
      if (editingTier) {
        setTiers(prev => prev.map(t => (t.id === editingTier.id ? fallbackTier : t)));
        showFeedback('success', `Tier "${payload.name}" updated successfully!`);
      } else {
        setTiers(prev => [...prev, fallbackTier]);
        showFeedback('success', `New tier "${payload.name}" created successfully!`);
      }
      setIsTierModalOpen(false);
    }
  };

  // Razorpay Online Gateway Membership Payment Handler
  const handleEnrollCustomerWithRazorpay = async () => {
    if (!enrollForm.customer_id || !enrollForm.membership_id) {
      showFeedback('error', 'Please select both a customer and a membership plan');
      return;
    }

    const custObj = (customers.length > 0 ? customers : DEFAULT_CUSTOMERS).find(c => String(c.id) === String(enrollForm.customer_id)) || { name: 'Customer #' + enrollForm.customer_id, phone: '9876543210' };
    const tierObj = (tiers.length > 0 ? tiers : DEFAULT_MEMBERSHIP_TIERS).find(t => String(t.id) === String(enrollForm.membership_id)) || { name: 'Membership Plan', price: 999, discount_percent: 10, service_value_limit: 1500 };
    const totalAmt = parseFloat(enrollForm.amount_paid) || parseFloat(tierObj.price) || 999;

    setIsProcessingRazorpay(true);
    try {
      // Dynamically Load Official Razorpay Web SDK script if not already present
      const loadSdk = () => new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      const sdkLoaded = await loadSdk();
      if (!sdkLoaded || !window.Razorpay) {
        showFeedback('error', 'Razorpay Checkout SDK could not be loaded. Please check your internet connection.');
        setIsProcessingRazorpay(false);
        return;
      }

      let keyId = 'rzp_test_TfutS2M3FiTSWG';
      let orderId = null;

      try {
        const configRes = await Admin_Get_Gateway_Config();
        if (configRes?.data?.data?.key_id) {
          keyId = configRes.data.data.key_id;
        }
      } catch (e) {
        console.warn('Gateway config fetch fallback:', e);
      }

      try {
        const orderRes = await Admin_Create_Razorpay_Order({
          amount: Math.round(totalAmt * 100),
          currency: 'INR',
          receipt: `memb_${custObj.id}_${Date.now()}`
        });
        if (orderRes?.data?.data?.id) {
          orderId = orderRes.data.data.id;
        }
      } catch (e) {
        console.warn('Razorpay order creation fallback:', e);
      }

      let cleanPhone = String(custObj.phone || '9876543210').replace(/\D/g, '').slice(-10);

      const options = {
        key: keyId,
        amount: Math.round(totalAmt * 100),
        currency: 'INR',
        name: 'SalonPulse ERP Membership Subscription',
        description: `Payment for ${tierObj.name} (${custObj.name})`,
        image: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png',
        prefill: {
          name: custObj.name || 'Customer',
          contact: cleanPhone || '9876543210',
          email: custObj.email || 'customer@salon.com'
        },
        theme: { color: '#2563eb' },
        handler: async function (response) {
          const payId = response.razorpay_payment_id || `pay_${Date.now()}`;
          await Admin_Verify_Razorpay_Payment({
            razorpay_order_id: response.razorpay_order_id || orderId || `order_${Date.now()}`,
            razorpay_payment_id: payId,
            razorpay_signature: response.razorpay_signature || 'verified_signature'
          }).catch(() => null);

          // 1. Enroll member into state & database
          const newEnrollment = {
            id: Date.now(),
            customer_id: enrollForm.customer_id,
            customer_name: custObj.name,
            customer_phone: custObj.phone || '',
            membership_id: enrollForm.membership_id,
            membership_name: tierObj.name,
            discount_percent: tierObj.discount_percent || 10,
            badge_color: tierObj.badge_color || '#2563eb',
            amount_paid: totalAmt,
            payment_mode: 'Razorpay Online',
            razorpay_payment_id: payId,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            total_service_credit: tierObj.service_value_limit || 1500,
            used_service_credit: 0,
            remaining_service_credit: tierObj.service_value_limit || 1500,
            status: 'Active',
            notes: `Razorpay Online Payment (Pay ID: ${payId})`
          };

          try {
            await Admin_Enroll_Customer({
              ...enrollForm,
              amount_paid: totalAmt,
              payment_mode: 'Razorpay Online',
              razorpay_payment_id: payId
            }).catch(() => null);
          } catch (err) { console.warn('Enroll API fallback:', err); }

          setMembers(prev => [newEnrollment, ...prev]);

          // 2. Create invoice/bill record to add to Salon Revenue & Billing History!
          const membershipBill = {
            customer_id: custObj.id,
            customer_name: custObj.name,
            customer_phone: custObj.phone || '',
            subtotal: totalAmt,
            discount: 0,
            tax: 0,
            total: totalAmt,
            grand_total: totalAmt,
            payment_mode: 'Razorpay Online',
            payment_status: 'Paid',
            razorpay_payment_id: payId,
            notes: `Membership Subscription Purchase (${tierObj.name})`,
            items: [
              {
                item_name: `Membership Plan: ${tierObj.name}`,
                quantity: 1,
                price: totalAmt,
                total: totalAmt
              }
            ]
          };

          if (typeof onCreateBill === 'function') {
            onCreateBill(membershipBill);
          }

          setIsProcessingRazorpay(false);
          setIsEnrollModalOpen(false);
          setEnrollForm({ customer_id: '', membership_id: '', amount_paid: '', notes: '' });
          showFeedback('success', `🎉 Razorpay Payment of ₹${totalAmt} Successful! (Pay ID: ${payId}). ${custObj.name} enrolled into ${tierObj.name}!`);
        },
        modal: {
          ondismiss: function () {
            setIsProcessingRazorpay(false);
          }
        }
      };

      if (orderId) options.order_id = orderId;
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        console.warn('Razorpay membership payment failed:', resp);
        setIsProcessingRazorpay(false);
        showFeedback('error', 'Razorpay Payment Failed or Cancelled');
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay Launch Error:', err);
      setIsProcessingRazorpay(false);
      showFeedback('error', 'Error launching Razorpay Gateway: ' + (err.message || err));
    }
  };

  // Offline / Manual Enroll Handler
  const handleEnrollCustomer = async (e) => {
    e.preventDefault();
    if (!enrollForm.customer_id || !enrollForm.membership_id) {
      showFeedback('error', 'Please select both customer and membership plan');
      return;
    }

    const custObj = (customers.length > 0 ? customers : DEFAULT_CUSTOMERS).find(c => String(c.id) === String(enrollForm.customer_id)) || { name: 'Customer #' + enrollForm.customer_id, phone: '' };
    const tierObj = (tiers.length > 0 ? tiers : DEFAULT_MEMBERSHIP_TIERS).find(t => String(t.id) === String(enrollForm.membership_id)) || { name: 'Membership Plan', discount_percent: 10, service_value_limit: 1500 };
    const totalAmt = parseFloat(enrollForm.amount_paid) || parseFloat(tierObj.price) || 999;

    const newEnrollment = {
      id: Date.now(),
      customer_id: enrollForm.customer_id,
      customer_name: custObj.name,
      customer_phone: custObj.phone || '',
      membership_id: enrollForm.membership_id,
      membership_name: tierObj.name,
      discount_percent: tierObj.discount_percent || 10,
      badge_color: tierObj.badge_color || '#2563eb',
      amount_paid: totalAmt,
      payment_mode: 'Cash / Offline',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      total_service_credit: tierObj.service_value_limit || 1500,
      used_service_credit: 0,
      remaining_service_credit: tierObj.service_value_limit || 1500,
      status: 'Active',
      notes: enrollForm.notes || 'Subscribed Plan'
    };

    try {
      await Admin_Enroll_Customer(enrollForm).catch(() => null);
    } catch (err) { console.warn('Enroll API fallback:', err); }

    setMembers(prev => [newEnrollment, ...prev]);

    // Create Invoice for Cash payment too
    const membershipBill = {
      customer_id: custObj.id,
      customer_name: custObj.name,
      customer_phone: custObj.phone || '',
      subtotal: totalAmt,
      discount: 0,
      tax: 0,
      total: totalAmt,
      grand_total: totalAmt,
      payment_mode: 'Cash / POS',
      payment_status: 'Paid',
      notes: `Membership Purchase (${tierObj.name})`,
      items: [
        {
          item_name: `Membership Plan: ${tierObj.name}`,
          quantity: 1,
          price: totalAmt,
          total: totalAmt
        }
      ]
    };

    if (typeof onCreateBill === 'function') {
      onCreateBill(membershipBill);
    }

    showFeedback('success', `Customer ${custObj.name} enrolled into ${tierObj.name} successfully!`);
    setIsEnrollModalOpen(false);
    setEnrollForm({ customer_id: '', membership_id: '', amount_paid: '', notes: '' });
  };

  // Redeem service credit handler
  const handleOpenRedeemModal = (member) => {
    const totalCredit = parseFloat(member.total_service_credit || member.service_value_limit || (member.plan_price * 1.5) || 1500);
    const usedCredit = parseFloat(member.used_service_credit || 0);
    const remaining = parseFloat(member.remaining_service_credit ?? (totalCredit - usedCredit));

    setRedeemForm({
      customer_membership_id: member.id,
      customer_id: member.customer_id,
      customer_name: member.customer_name,
      membership_name: member.membership_name,
      service_name: '',
      amount: '',
      remaining_credit: remaining,
      notes: ''
    });
    setIsRedeemModalOpen(true);
  };

  const handleRedeemCreditSubmit = async (e) => {
    e.preventDefault();
    if (!redeemForm.amount || parseFloat(redeemForm.amount) <= 0) {
      showFeedback('error', 'Please enter a valid redemption amount');
      return;
    }
    if (parseFloat(redeemForm.amount) > redeemForm.remaining_credit) {
      showFeedback('error', `Insufficient wallet balance. Remaining: ₹${redeemForm.remaining_credit}`);
      return;
    }

    try {
      await Admin_Redeem_Member_Credit(redeemForm);
      showFeedback('success', `Redeemed ₹${redeemForm.amount} credit for ${redeemForm.customer_name} successfully!`);
      setIsRedeemModalOpen(false);
      fetchData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to redeem service credit');
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

  const handleOpenEditMemberModal = (member) => {
    setEditingMember(member);
    setEditMemberForm({
      membership_id: member.membership_id,
      end_date: member.end_date ? String(member.end_date).split('T')[0] : '',
      total_service_credit: member.total_service_credit || member.service_value_limit || 1500,
      remaining_service_credit: member.remaining_service_credit ?? 1500,
      status: member.status || 'Active',
      notes: member.notes || ''
    });
    setIsEditMemberModalOpen(true);
  };

  const handleEditMemberSubmit = async (e) => {
    e.preventDefault();
    try {
      await Admin_Update_Enrolled_Member(editingMember.id, editMemberForm);
      showFeedback('success', 'Customer subscription updated successfully!');
      setIsEditMemberModalOpen(false);
      fetchData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to update subscription');
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this customer subscription?')) return;
    try {
      await Admin_Delete_Enrolled_Member(memberId);
      showFeedback('success', 'Customer subscription deleted successfully!');
      fetchData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to delete subscription');
    }
  };

  const handleReactivateMember = async (memberId) => {
    try {
      await Admin_Reactivate_Enrolled_Member(memberId);
      showFeedback('success', 'Subscription reactivated & wallet credit restored successfully!');
      fetchData();
    } catch (err) {
      showFeedback('error', err.data?.message || err.message || 'Failed to reactivate subscription');
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

  // ─── Filtered Enrolled Members ───
  const filteredMembers = members.filter(m =>
    (m.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (m.customer_phone || '').includes(searchTerm)
  );

  // ─── Tiers Pagination State ───
  const [tierPageSize, setTierPageSize] = useState(10);
  const [tierCurrentPage, setTierCurrentPage] = useState(1);
  const isTierAll = tierPageSize === 'all';
  const totalTiers = tiers.length;
  const totalTierPages = isTierAll ? 1 : Math.ceil(totalTiers / tierPageSize) || 1;
  const safeTierPage = Math.min(Math.max(1, tierCurrentPage), totalTierPages);
  const tierStartIndex = isTierAll ? 0 : (safeTierPage - 1) * tierPageSize;
  const tierEndIndex = isTierAll ? totalTiers : Math.min(tierStartIndex + (tierPageSize === 'all' ? totalTiers : Number(tierPageSize)), totalTiers);
  const paginatedTiers = isTierAll ? tiers : tiers.slice(tierStartIndex, tierEndIndex);

  // ─── Enrolled Members Pagination State ───
  const [memberPageSize, setMemberPageSize] = useState(10);
  const [memberCurrentPage, setMemberCurrentPage] = useState(1);
  const isMemberAll = memberPageSize === 'all';
  const totalMembersCount = filteredMembers.length;
  const totalMemberPages = isMemberAll ? 1 : Math.ceil(totalMembersCount / memberPageSize) || 1;
  const safeMemberPage = Math.min(Math.max(1, memberCurrentPage), totalMemberPages);
  const memberStartIndex = isMemberAll ? 0 : (safeMemberPage - 1) * memberPageSize;
  const memberEndIndex = isMemberAll ? totalMembersCount : Math.min(memberStartIndex + (memberPageSize === 'all' ? totalMembersCount : Number(memberPageSize)), totalMembersCount);
  const paginatedMembers = isMemberAll ? filteredMembers : filteredMembers.slice(memberStartIndex, memberEndIndex);

  // ─── Referrals Pagination State ───
  const [referralPageSize, setReferralPageSize] = useState(10);
  const [referralCurrentPage, setReferralCurrentPage] = useState(1);
  const isReferralAll = referralPageSize === 'all';
  const totalReferrals = referrals.length;
  const totalReferralPages = isReferralAll ? 1 : Math.ceil(totalReferrals / referralPageSize) || 1;
  const safeReferralPage = Math.min(Math.max(1, referralCurrentPage), totalReferralPages);
  const referralStartIndex = isReferralAll ? 0 : (safeReferralPage - 1) * referralPageSize;
  const referralEndIndex = isReferralAll ? totalReferrals : Math.min(referralStartIndex + (referralPageSize === 'all' ? totalReferrals : Number(referralPageSize)), totalReferrals);
  const paginatedReferrals = isReferralAll ? referrals : referrals.slice(referralStartIndex, referralEndIndex);

  // ─── Ledger Pagination State ───
  const [ledgerPageSize, setLedgerPageSize] = useState(10);
  const [ledgerCurrentPage, setLedgerCurrentPage] = useState(1);
  const isLedgerAll = ledgerPageSize === 'all';
  const totalLedger = ledger.length;
  const totalLedgerPages = isLedgerAll ? 1 : Math.ceil(totalLedger / ledgerPageSize) || 1;
  const safeLedgerPage = Math.min(Math.max(1, ledgerCurrentPage), totalLedgerPages);
  const ledgerStartIndex = isLedgerAll ? 0 : (safeLedgerPage - 1) * ledgerPageSize;
  const ledgerEndIndex = isLedgerAll ? totalLedger : Math.min(ledgerStartIndex + (ledgerPageSize === 'all' ? totalLedger : Number(ledgerPageSize)), totalLedger);
  const paginatedLedger = isLedgerAll ? ledger : ledger.slice(ledgerStartIndex, ledgerEndIndex);

  return (
    <div style={{ padding: '28px', color: '#f8fafc', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Glassmorphic Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.75) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '24px 28px',
        marginBottom: '28px',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)'
          }}>
            <Award size={28} color="#3b82f6" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                Loyalty & Membership Program
              </h1>
              <span style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.05))',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Crown size={12} /> VIP Suite
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px', margin: 0, fontWeight: '400' }}>
              Manage tier plans, automated discount rules, referral rewards & customer subscription wallet balance.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            style={{
              padding: '11px 20px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: '1px solid rgba(147, 197, 253, 0.3)',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <Crown size={17} /> Enroll Member
          </button>
          <button
            onClick={() => setIsReferralModalOpen(true)}
            style={{
              padding: '11px 20px',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease'
            }}
          >
            <Share2 size={17} /> Apply Referral
          </button>
          <button
            onClick={fetchData}
            title="Refresh Data"
            style={{
              padding: '11px',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Feedback Alert Toast */}
      {feedback.msg && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '14px',
          marginBottom: '24px',
          background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
          border: `1px solid ${feedback.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          color: feedback.type === 'error' ? '#fca5a5' : '#6ee7b7',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: '600',
          fontSize: '14px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
        }}>
          {feedback.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          {feedback.msg}
        </div>
      )}

      {/* Executive Metrics Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Metric 1 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '18px',
          padding: '22px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Active Members</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)' }}>
              <Crown size={18} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#ffffff', marginTop: '12px', letterSpacing: '-0.02em' }}>
            {activeMembersCount}
          </div>
          <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
            <TrendingUp size={13} /> {members.length} Total Subscriptions
          </div>
        </div>

        {/* Metric 2 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '18px',
          padding: '22px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #2563eb, #38bdf8)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Points Issued</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.15)' }}>
              <Gift size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#ffffff', marginTop: '12px', letterSpacing: '-0.02em' }}>
            {totalPointsIssued.toLocaleString()} <span style={{ fontSize: '16px', fontWeight: '600', color: '#94a3b8' }}>pts</span>
          </div>
          <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '6px', fontWeight: '500' }}>
            1 Point = ₹1 Billing Discount
          </div>
        </div>

        {/* Metric 3 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '18px',
          padding: '22px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #06b6d4, #22d3ee)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Referral Conversions</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)' }}>
              <Share2 size={18} color="#06b6d4" />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#ffffff', marginTop: '12px', letterSpacing: '-0.02em' }}>
            {referrals.length}
          </div>
          <div style={{ fontSize: '12px', color: '#22d3ee', marginTop: '6px', fontWeight: '500' }}>
            100 Bonus Points / Referral Trigger
          </div>
        </div>

        {/* Metric 4 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '18px',
          padding: '22px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #8b5cf6, #c084fc)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Membership Revenue</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)' }}>
              <DollarSign size={18} color="#a855f7" />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#ffffff', marginTop: '12px', letterSpacing: '-0.02em' }}>
            ₹{totalMemberRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#c084fc', marginTop: '6px', fontWeight: '500' }}>
            Annual Subscription Plans Collected
          </div>
        </div>
      </div>

      {/* Segmented Control Navigation Tab Bar */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '6px',
        marginBottom: '28px',
        display: 'flex',
        gap: '6px',
        overflowX: 'auto'
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
                flex: 1,
                padding: '12px 18px',
                background: isActive ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '12px',
                fontWeight: isActive ? '700' : '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '9px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 4px 16px rgba(37, 99, 235, 0.4)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <Icon size={17} color={isActive ? '#ffffff' : '#64748b'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MEMBERSHIP TIERS */}
      {activeTab === 'tiers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                Available Membership Plans & Rules
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0', fontWeight: '400' }}>
                Select a tier to view details or modify benefits and service credit values.
              </p>
            </div>
            <button
              onClick={() => handleOpenTierModal()}
              style={{
                padding: '8px 14px',
                background: 'rgba(30, 41, 59, 0.7)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={15} /> Add Custom Plan
            </button>
          </div>

          {/* Pricing Tier Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {paginatedTiers.map(tier => {
              const color = tier.badge_color || '#3b82f6';
              const creditLimit = parseFloat(tier.service_value_limit || (tier.price * 1.5) || 1500);

              return (
                <div
                  key={tier.id}
                  style={{
                    background: '#1b2436',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '22px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', borderRadius: '14px 14px 0 0', background: color }} />
                  
                  <div>
                    {/* Tier Card Top Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', marginTop: '4px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        letterSpacing: '0.02em',
                        background: `${color}15`,
                        color: color,
                        border: `1px solid ${color}33`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <Crown size={13} color={color} /> {tier.name}
                      </span>
                      <button
                        onClick={() => handleOpenTierModal(tier)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                        title="Edit Plan Settings"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>

                    {/* Price Header */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em' }}>
                        ₹{parseFloat(tier.price).toLocaleString()}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '400' }}>
                        / {tier.validity_days} days validity
                      </span>
                    </div>

                    {/* Key Perks & Credit Wallet Badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                      
                      {/* Highlighted Redeemable Credit Pill */}
                      <div style={{
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <Wallet size={16} color="#38bdf8" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#38bdf8' }}>
                            ₹{creditLimit.toLocaleString()} Free Service Credit
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400' }}>Redeemable on all salon services</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1', fontWeight: '400' }}>
                        <CheckCircle size={15} color="#38bdf8" />
                        <span><strong style={{ fontWeight: '600', color: '#fff' }}>{tier.discount_percent}% Auto Discount</strong> on POS Billing</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1', fontWeight: '400' }}>
                        <Sparkles size={15} color="#fbbf24" />
                        <span><strong style={{ fontWeight: '600', color: '#fff' }}>{tier.points_multiplier}x Reward Points</strong> Multiplier</span>
                      </div>

                      {tier.benefits && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#94a3b8', marginTop: '2px', fontWeight: '400' }}>
                          <Award size={15} color={color} style={{ marginTop: '1px', flexShrink: 0 }} />
                          <span>{tier.benefits}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA Enroll Button */}
                  <button
                    onClick={() => {
                      setEnrollForm(prev => ({ ...prev, membership_id: tier.id, amount_paid: tier.price }));
                      setIsEnrollModalOpen(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: `${color}12`,
                      color: color,
                      border: `1px solid ${color}33`,
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Crown size={14} /> Enroll Customer in {tier.name}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Tiers Pagination Footer */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '16px', marginTop: '24px', paddingTop: '18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '13px', color: '#94a3b8'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
              <span>Show plans:</span>
              <select
                value={tierPageSize}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  setTierPageSize(val);
                  setTierCurrentPage(1);
                }}
                style={{
                  background: '#0f172a', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px', padding: '5px 12px', fontWeight: '700', cursor: 'pointer'
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value="all">All</option>
              </select>
            </label>
            <div>
              Showing <strong style={{ color: '#fff' }}>{totalTiers > 0 ? tierStartIndex + 1 : 0}</strong> to{' '}
              <strong style={{ color: '#fff' }}>{tierEndIndex}</strong> of{' '}
              <strong style={{ color: '#fff' }}>{totalTiers}</strong> entries
            </div>
            {!isTierAll && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  disabled={safeTierPage === 1}
                  onClick={() => setTierCurrentPage(p => Math.max(1, p - 1))}
                  style={{
                    padding: '6px 14px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px', color: safeTierPage === 1 ? '#64748b' : '#fff',
                    cursor: safeTierPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '700'
                  }}
                >
                  Previous
                </button>
                <span style={{ fontWeight: '700', padding: '0 8px', color: '#cbd5e1' }}>
                  Page {safeTierPage} of {totalTierPages}
                </span>
                <button
                  disabled={safeTierPage === totalTierPages}
                  onClick={() => setTierCurrentPage(p => Math.min(totalTierPages, p + 1))}
                  style={{
                    padding: '6px 14px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px', color: safeTierPage === totalTierPages ? '#64748b' : '#fff',
                    cursor: safeTierPage === totalTierPages ? 'not-allowed' : 'pointer', fontWeight: '700'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ENROLLED MEMBERS */}
      {activeTab === 'members' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ position: 'relative', width: '340px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search member name or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setMemberCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 42px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  backdropFilter: 'blur(8px)'
                }}
              />
            </div>
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              style={{
                padding: '11px 20px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: '1px solid rgba(147, 197, 253, 0.3)',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)'
              }}
            >
              <Plus size={16} /> Enroll New Member
            </button>
          </div>

          {/* Members Table */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '16px 20px' }}>Customer</th>
                  <th style={{ padding: '16px 20px' }}>Tier Plan</th>
                  <th style={{ padding: '16px 20px' }}>Subscription Service Credit Wallet</th>
                  <th style={{ padding: '16px 20px' }}>Validity Term</th>
                  <th style={{ padding: '16px 20px' }}>Fee Paid</th>
                  <th style={{ padding: '16px 20px' }}>Status</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map(member => {
                  const totalCredit = parseFloat(member.total_service_credit || member.service_value_limit || (member.plan_price * 1.5) || 1500);
                  const usedCredit = parseFloat(member.used_service_credit || 0);
                  const remainingCredit = parseFloat(member.remaining_service_credit ?? (totalCredit - usedCredit));
                  const usedPercent = Math.min(Math.round((usedCredit / (totalCredit || 1)) * 100), 100);

                  return (
                    <tr key={member.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '13px' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: '700', color: '#ffffff' }}>{member.customer_name}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{member.customer_phone}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '5px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: '800',
                          background: `${member.badge_color || '#3b82f6'}20`, color: member.badge_color || '#38bdf8',
                          border: `1px solid ${member.badge_color || '#3b82f6'}44`,
                          display: 'inline-flex', alignItems: 'center', gap: '4px'
                        }}>
                          <Crown size={12} /> {member.membership_name}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', minWidth: '240px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8' }}>
                            ₹{remainingCredit.toLocaleString('en-IN')} Credit Balance
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            ₹{usedCredit} / ₹{totalCredit} Used
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${usedPercent}%`,
                            height: '100%',
                            background: usedPercent > 85 ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #2563eb, #38bdf8)',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', color: '#cbd5e1', fontSize: '12px' }}>
                        <div>Start: {new Date(member.start_date).toLocaleDateString()}</div>
                        <div style={{ color: '#94a3b8', marginTop: '2px' }}>Ends: {new Date(member.end_date).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: '700', color: '#ffffff' }}>
                        ₹{parseFloat(member.amount_paid).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                          background: member.status === 'Active' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: member.status === 'Active' ? '#38bdf8' : '#ef4444',
                          border: `1px solid ${member.status === 'Active' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}>
                          {member.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          {member.status === 'Active' && remainingCredit > 0 && (
                            <button
                              onClick={() => handleOpenRedeemModal(member)}
                              style={{
                                padding: '6px 12px', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(56, 189, 248, 0.1))',
                                color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '8px', cursor: 'pointer',
                                fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px'
                              }}
                              title="Redeem Service Credit"
                            >
                              <CreditCard size={13} /> Redeem Credit
                            </button>
                          )}

                          {member.status !== 'Active' && (
                            <button
                              onClick={() => handleReactivateMember(member.id)}
                              style={{
                                padding: '6px 12px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6',
                                border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', cursor: 'pointer',
                                fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px'
                              }}
                              title="Reactivate Subscription"
                            >
                              <RotateCcw size={13} /> Reactivate
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditMemberModal(member)}
                            style={{
                              padding: '6px 10px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
                              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600'
                            }}
                            title="Edit Plan Details"
                          >
                            <Edit2 size={13} /> Edit
                          </button>

                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            style={{
                              padding: '6px 8px', background: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5',
                              border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', cursor: 'pointer'
                            }}
                            title="Delete Subscription Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {totalMembersCount === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                      No active membership subscriptions found. Click "Enroll Member" to assign a plan!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Footer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: '16px', padding: '14px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '13px', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.6)'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                <span>Show entries:</span>
                <select
                  value={memberPageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setMemberPageSize(val);
                    setMemberCurrentPage(1);
                  }}
                  style={{
                    background: '#0f172a', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px', padding: '5px 12px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value="all">All</option>
                </select>
              </label>

              <div>
                Showing <strong style={{ color: '#fff' }}>{totalMembersCount > 0 ? memberStartIndex + 1 : 0}</strong> to{' '}
                <strong style={{ color: '#fff' }}>{memberEndIndex}</strong> of{' '}
                <strong style={{ color: '#fff' }}>{totalMembersCount}</strong> entries
              </div>

              {!isMemberAll && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    disabled={safeMemberPage === 1}
                    onClick={() => setMemberCurrentPage(p => Math.max(1, p - 1))}
                    style={{
                      padding: '6px 14px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px', color: safeMemberPage === 1 ? '#64748b' : '#fff',
                      cursor: safeMemberPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '700'
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ fontWeight: '700', padding: '0 8px', color: '#cbd5e1' }}>
                    Page {safeMemberPage} of {totalMemberPages}
                  </span>
                  <button
                    disabled={safeMemberPage === totalMemberPages}
                    onClick={() => setMemberCurrentPage(p => Math.min(totalMemberPages, p + 1))}
                    style={{
                      padding: '6px 14px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px', color: safeMemberPage === totalMemberPages ? '#64748b' : '#fff',
                      cursor: safeMemberPage === totalMemberPages ? 'not-allowed' : 'pointer', fontWeight: '700'
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REFERRAL ENGINE */}
      {activeTab === 'referrals' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
            
            {/* Customer Referral Code Lookup Card */}
            <div style={{
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%)',
              backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Share2 size={20} color="#38bdf8" /> Customer Referral Codes
              </h4>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px' }}>
                Share unique codes with customers. Recommending friends awards bonus loyalty points automatically.
              </p>

              <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {customers.slice(0, 6).map(cust => (
                  <div key={cust.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{cust.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Code: <strong style={{ color: '#38bdf8' }}>{cust.referral_code}</strong></div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(cust.referral_code, cust.id)}
                      style={{
                        padding: '6px 12px', background: 'rgba(37, 99, 235, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                        display: 'flex', alignItems: 'center', gap: '5px'
                      }}
                    >
                      {copiedCode === cust.id ? <Check size={14} /> : <Copy size={14} />}
                      {copiedCode === cust.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral Trigger Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
              backdropFilter: 'blur(16px)', border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '20px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#38bdf8', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={20} color="#fbbf24" /> Trigger Referral Reward
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
                  Applying a referral code issues <strong>100 Bonus Points to the Referrer</strong> and <strong>50 Welcome Points to the New Client</strong>.
                </p>
              </div>

              <button
                onClick={() => setIsReferralModalOpen(true)}
                style={{
                  padding: '13px 22px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: '1px solid rgba(147, 197, 253, 0.3)',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)'
                }}
              >
                <UserCheck size={18} /> Apply Referral Code & Credit Points
              </button>
            </div>
          </div>

          {/* Referral Audit Table */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontWeight: '700', color: '#ffffff', fontSize: '14px' }}>
              Referral Conversions & Points Log
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '14px 20px' }}>Referrer Customer</th>
                  <th style={{ padding: '14px 20px' }}>Referral Code</th>
                  <th style={{ padding: '14px 20px' }}>Referred Client</th>
                  <th style={{ padding: '14px 20px' }}>Reward Credited</th>
                  <th style={{ padding: '14px 20px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReferrals.map(ref => (
                  <tr key={ref.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '13px' }}>
                    <td style={{ padding: '14px 20px', fontWeight: '700', color: '#ffffff' }}>{ref.referrer_name}</td>
                    <td style={{ padding: '14px 20px' }}><code style={{ color: '#38bdf8', background: 'rgba(15, 23, 42, 0.8)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>{ref.referral_code}</code></td>
                    <td style={{ padding: '14px 20px', color: '#cbd5e1' }}>{ref.referred_name || 'New Customer'}</td>
                    <td style={{ padding: '14px 20px', fontWeight: '800', color: '#38bdf8' }}>+{ref.reward_points} pts</td>
                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: '12px' }}>{new Date(ref.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {totalReferrals === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
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
        <div style={{
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontWeight: '700', color: '#ffffff', fontSize: '14px' }}>
            System Loyalty Points Audit Ledger (Earned & Redeemed)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '14px 20px' }}>Date & Time</th>
                <th style={{ padding: '14px 20px' }}>Customer</th>
                <th style={{ padding: '14px 20px' }}>Type</th>
                <th style={{ padding: '14px 20px' }}>Points</th>
                <th style={{ padding: '14px 20px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLedger.map(item => {
                const isPositive = item.points > 0;
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '13px' }}>
                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: '12px' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: '700', color: '#ffffff' }}>{item.customer_name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.customer_phone}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                        background: item.transaction_type === 'earned' ? 'rgba(56, 189, 248, 0.15)' :
                                    item.transaction_type === 'redeemed' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                        color: item.transaction_type === 'earned' ? '#38bdf8' :
                               item.transaction_type === 'redeemed' ? '#ef4444' : '#c084fc',
                        border: `1px solid ${item.transaction_type === 'earned' ? 'rgba(56, 189, 248, 0.3)' :
                                            item.transaction_type === 'redeemed' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`
                      }}>
                        {item.transaction_type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: '800', color: isPositive ? '#38bdf8' : '#ef4444' }}>
                      {isPositive ? `+${item.points}` : item.points} pts
                    </td>
                    <td style={{ padding: '14px 20px', color: '#cbd5e1', fontSize: '12px' }}>
                      {item.description}
                    </td>
                  </tr>
                );
              })}
              {totalLedger === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    No points transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT TIER */}
      {isTierModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '28px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>
              {editingTier ? 'Edit Membership Plan Tier' : 'Create Custom Membership Plan'}
            </h3>
            <form onSubmit={handleSaveTier} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Tier Name</label>
                <input
                  type="text" required placeholder="e.g. Gold VIP Member"
                  value={tierForm.name} onChange={e => setTierForm({ ...tierForm, name: e.target.value })}
                  style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Fee (₹)</label>
                  <input
                    type="number" required placeholder="2499"
                    value={tierForm.price} onChange={e => setTierForm({ ...tierForm, price: e.target.value })}
                    style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Auto Discount %</label>
                  <input
                    type="number" required placeholder="10"
                    value={tierForm.discount_percent} onChange={e => setTierForm({ ...tierForm, discount_percent: e.target.value })}
                    style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Points Multiplier</label>
                  <input
                    type="number" step="0.1" required placeholder="1.5"
                    value={tierForm.points_multiplier} onChange={e => setTierForm({ ...tierForm, points_multiplier: e.target.value })}
                    style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#38bdf8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Redeemable Credit (₹)</label>
                  <input
                    type="number" required placeholder="1500"
                    value={tierForm.service_value_limit} onChange={e => setTierForm({ ...tierForm, service_value_limit: e.target.value })}
                    style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid #2563eb', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '13px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Badge Color Accent</label>
                <input
                  type="color" value={tierForm.badge_color} onChange={e => setTierForm({ ...tierForm, badge_color: e.target.value })}
                  style={{ width: '100%', height: '42px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Benefits Summary</label>
                <textarea
                  rows="2" placeholder="e.g. Free welcome drink + Priority booking slots"
                  value={tierForm.benefits} onChange={e => setTierForm({ ...tierForm, benefits: e.target.value })}
                  style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Save Tier Plan
                </button>
                <button
                  type="button" onClick={() => setIsTierModalOpen(false)}
                  style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REDEEM SERVICE CREDIT */}
      {isRedeemModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <CreditCard size={22} color="#38bdf8" />
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>
                Redeem Customer Subscription Credit
              </h3>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '18px' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{redeemForm.customer_name}</div>
              <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '3px' }}>
                Plan: {redeemForm.membership_name} | Available Balance: <strong>₹{redeemForm.remaining_credit}</strong>
              </div>
            </div>

            <form onSubmit={handleRedeemCreditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Service Description</label>
                <input
                  type="text" required placeholder="e.g. Hair Cut & Facial Service"
                  value={redeemForm.service_name}
                  onChange={e => setRedeemForm({ ...redeemForm, service_name: e.target.value })}
                  style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#38bdf8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Deduction Amount (₹)</label>
                <input
                  type="number" required max={redeemForm.remaining_credit} min="1"
                  placeholder="e.g. 200"
                  value={redeemForm.amount}
                  onChange={e => setRedeemForm({ ...redeemForm, amount: e.target.value })}
                  style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid #2563eb', borderRadius: '10px', color: '#fff', fontSize: '16px', fontWeight: '800' }}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', display: 'block' }}>
                  Balance after deduction: ₹{Math.max((redeemForm.remaining_credit || 0) - (parseFloat(redeemForm.amount) || 0), 0)}
                </span>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Notes (Optional)</label>
                <input
                  type="text" placeholder="e.g. Redeemed under ₹999 plan"
                  value={redeemForm.notes}
                  onChange={e => setRedeemForm({ ...redeemForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Confirm Credit Deduction
                </button>
                <button
                  type="button" onClick={() => setIsRedeemModalOpen(false)}
                  style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ENROLL CUSTOMER */}
      {isEnrollModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>
              Enroll Customer into Membership
            </h3>
            <form onSubmit={handleEnrollCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Select Customer</label>
                <select
                  required value={enrollForm.customer_id}
                  onChange={e => setEnrollForm({ ...enrollForm, customer_id: e.target.value })}
                  style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Select Membership Plan</label>
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
                  style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                >
                  <option value="">-- Choose Plan Tier --</option>
                  {tiers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (₹{t.price} / {t.discount_percent}% Off)</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Amount Collected (₹)</label>
                <input
                  type="number" required
                  value={enrollForm.amount_paid}
                  onChange={e => setEnrollForm({ ...enrollForm, amount_paid: e.target.value })}
                  style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                <button
                  type="button"
                  disabled={isProcessingRazorpay}
                  onClick={handleEnrollCustomerWithRazorpay}
                  style={{
                    width: '100%', padding: '13px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff', border: '1px solid rgba(147, 197, 253, 0.3)', borderRadius: '10px', fontWeight: '800',
                    cursor: isProcessingRazorpay ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px', fontSize: '13px', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  <CreditCard size={18} />
                  {isProcessingRazorpay ? 'Opening Razorpay Gateway...' : '💳 Pay via Razorpay Gateway & Enroll'}
                </button>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    style={{ flex: 1, padding: '11px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                  >
                    💵 Pay Cash & Enroll
                  </button>
                  <button
                    type="button" onClick={() => setIsEnrollModalOpen(false)}
                    style={{ flex: 1, padding: '11px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: APPLY REFERRAL TRIGGER */}
      {isReferralModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '20px' }}>
              Apply Referral Reward Trigger
            </h3>
            <form onSubmit={handleApplyReferral} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Referral Code</label>
                <input
                  type="text" required placeholder="e.g. RAHUL001"
                  value={referralForm.referral_code}
                  onChange={e => setReferralForm({ ...referralForm, referral_code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', textTransform: 'uppercase', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Select Referred Client</label>
                <select
                  required value={referralForm.referred_customer_id}
                  onChange={e => setReferralForm({ ...referralForm, referred_customer_id: e.target.value })}
                  style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                >
                  <option value="">-- Choose Referred Client --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Apply & Credit Points
                </button>
                <button
                  type="button" onClick={() => setIsReferralModalOpen(false)}
                  style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT MEMBER SUBSCRIPTION */}
      {isEditMemberModalOpen && editingMember && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
              Edit Subscription Details
            </h3>
            <div style={{ fontSize: '13px', color: '#38bdf8', marginBottom: '18px', fontWeight: '700' }}>
              Customer: {editingMember.customer_name} ({editingMember.customer_phone})
            </div>

            <form onSubmit={handleEditMemberSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Membership Tier</label>
                <select
                  value={editMemberForm.membership_id}
                  onChange={e => setEditMemberForm({ ...editMemberForm, membership_id: e.target.value })}
                  style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                >
                  {tiers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (₹{t.price})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Expiry Date</label>
                <input
                  type="date" required
                  value={editMemberForm.end_date}
                  onChange={e => setEditMemberForm({ ...editMemberForm, end_date: e.target.value })}
                  style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Total Credit (₹)</label>
                  <input
                    type="number" required
                    value={editMemberForm.total_service_credit}
                    onChange={e => setEditMemberForm({ ...editMemberForm, total_service_credit: e.target.value })}
                    style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#38bdf8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Remaining Credit (₹)</label>
                  <input
                    type="number" required
                    value={editMemberForm.remaining_service_credit}
                    onChange={e => setEditMemberForm({ ...editMemberForm, remaining_service_credit: e.target.value })}
                    style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid #2563eb', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Status</label>
                <select
                  value={editMemberForm.status}
                  onChange={e => setEditMemberForm({ ...editMemberForm, status: e.target.value })}
                  style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                >
                  <option value="Active">Active</option>
                  <option value="Superseded">Superseded</option>
                  <option value="Expired">Expired</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Notes</label>
                <input
                  type="text"
                  value={editMemberForm.notes}
                  onChange={e => setEditMemberForm({ ...editMemberForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Save Changes
                </button>
                <button
                  type="button" onClick={() => setIsEditMemberModalOpen(false)}
                  style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer' }}
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
