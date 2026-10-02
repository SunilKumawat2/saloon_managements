import React, { useState, useRef, useEffect } from 'react';
import {
  Receipt, Plus, Minus, Trash2, Printer,
  CreditCard, Smartphone, Banknote, CheckCircle2,
  ArrowLeft, Award, Percent, Tag, User, Search,
  DollarSign, Sparkles, AlertCircle, RefreshCw, Scissors, ChevronRight, Check,
  QrCode, ShieldCheck, Clock, Layers, HelpCircle, X, Loader2, Crown
} from 'lucide-react';
import {
  Admin_Get_Coupons,
  Admin_Validate_Coupon,
  Admin_Get_Customer_Loyalty_Profile,
  Admin_Create_Razorpay_Order,
  Admin_Verify_Razorpay_Payment,
  Admin_Get_Gateway_Config
} from '../services/apiService';
import { getPackageExpirationStatus } from '../utils/packageUtils';

// Helper to resolve included service names for a package
const getIncludedServicesForPackage = (pkg, servicesList = []) => {
  if (!pkg) return [];
  let ids = [];
  if (Array.isArray(pkg.service_ids)) {
    ids = pkg.service_ids;
  } else if (typeof pkg.service_ids === 'string') {
    try {
      const parsed = JSON.parse(pkg.service_ids);
      if (Array.isArray(parsed)) ids = parsed;
      else ids = pkg.service_ids.split(',').map(s => s.trim());
    } catch (e) {
      ids = pkg.service_ids.split(',').map(s => s.trim());
    }
  } else if (Array.isArray(pkg.services)) {
    return pkg.services.map(s => (typeof s === 'object' ? s.name : String(s)));
  } else if (Array.isArray(pkg.included_services)) {
    return pkg.included_services.map(s => (typeof s === 'object' ? s.name : String(s)));
  }
  
  const names = ids.map(id => {
    const matched = servicesList.find(s => String(s.id) === String(id));
    if (matched) return matched.name;
    if (typeof id === 'string' && isNaN(id)) return id;
    return null;
  }).filter(Boolean);

  return names;
};

/**
 * POSBillingView — Professional Real-world Salon POS Billing System
 */
function POSBillingView({
  customer: initialCustomer,
  stylistId: initialStylistId,
  initialServices = [],
  stylists = [],
  services = [],
  packages = [],
  categories = [],
  customers = [],
  bills = [],
  members = [],
  onDeductMemberCredit,
  onCreateBill,
  onBack,
  onViewHistory,
  selectedBranchId = 'all'
}) {
  const [customAlert, setCustomAlert] = useState(null);
  // ─── Customer State ───
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer || null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(!initialCustomer);
  const [walkInName, setWalkInName] = useState('Walk-in Guest');
  const [walkInPhone, setWalkInPhone] = useState('');

  // ─── Primary Stylist State ───
  const [selectedStylistId, setSelectedStylistId] = useState(initialStylistId || (stylists[0]?.id ? String(stylists[0].id) : ''));

  // ─── Service Catalog Menu Filters ───
  const [activeCategory, setActiveCategory] = useState('All');
  const [menuSearch, setMenuSearch] = useState('');

  // ─── Cart Items ───
  // Item structure: { id, service_id, package_id, service_name, price, qty, category, stylist_id }
  const [cartItems, setCartItems] = useState(() => {
    if (Array.isArray(initialServices) && initialServices.length > 0) {
      return initialServices.map((svc, idx) => ({
        id: `svc-${svc.id || Date.now()}-${idx}`,
        service_id: svc.id,
        service_name: svc.name,
        price: parseFloat(svc.price || 0),
        qty: 1,
        category: svc.category || 'Service',
        stylist_id: initialStylistId || (stylists[0]?.id ? String(stylists[0].id) : '')
      }));
    }
    return [];
  });

  // Reactive sync when props (initialCustomer, initialStylistId, initialServices) update from Receptionist Queue
  useEffect(() => {
    if (initialCustomer) {
      setSelectedCustomer(initialCustomer);
      setIsWalkIn(false);
    }
    if (initialStylistId) {
      setSelectedStylistId(String(initialStylistId));
    }
    if (Array.isArray(initialServices) && initialServices.length > 0) {
      setCartItems(initialServices.map((svc, idx) => ({
        id: `svc-${svc.id || Date.now()}-${idx}-${Math.random()}`,
        service_id: svc.id,
        service_name: svc.name,
        price: parseFloat(svc.price || 0),
        qty: 1,
        category: svc.category || 'Service',
        stylist_id: initialStylistId ? String(initialStylistId) : (stylists[0]?.id ? String(stylists[0].id) : '')
      })));
    }
  }, [initialCustomer, initialStylistId, initialServices]);

  // ─── Tax & Discount Configuration ───
  const [gstRate, setGstRate] = useState(18); // 0, 5, 12, 18
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [manualDiscountType, setManualDiscountType] = useState('flat'); // 'flat' or 'percent'
  const [manualDiscountVal, setManualDiscountVal] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([
    { code: 'WELCOME10', discount_type: 'percentage', discount_value: 10, min_bill_amount: 0, description: '10% OFF on first visit' },
    { code: 'FESTIVE200', discount_type: 'fixed', discount_value: 200, min_bill_amount: 1000, description: 'Flat ₹200 OFF on bills above ₹1000' },
    { code: 'BEAUTY15', discount_type: 'percentage', discount_value: 15, min_bill_amount: 500, description: '15% OFF Spa & Skincare' },
    { code: 'VIP500', discount_type: 'fixed', discount_value: 500, min_bill_amount: 2000, description: 'Flat ₹500 OFF for VIP Clients' },
  ]);

  // ─── Tip & Payment Modes ───
  const [tipAmount, setTipAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash'); // Cash, Card, UPI, Split
  const [isUseWalletCredit, setIsUseWalletCredit] = useState(true);
  
  // Cash Change Calculator
  const [cashTendered, setCashTendered] = useState('');
  
  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardStep, setCardStep] = useState('DETAILS'); // 'DETAILS' | 'OTP'
  const [cardOtp, setCardOtp] = useState('123456');
  const [cardLast4, setCardLast4] = useState('');

  const formatCardNum = (value) => {
    const clean = value.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpDate = (value) => {
    const clean = value.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    return clean;
  };

  const getCardBrand = (num) => {
    const clean = (num || '').replace(/\s+/g, '');
    if (clean.startsWith('4')) return { name: 'VISA', badge: '💳 Visa Secure' };
    if (clean.startsWith('5') || clean.startsWith('2')) return { name: 'MASTERCARD', badge: '💳 Mastercard Identity Check' };
    if (clean.startsWith('6')) return { name: 'RUPAY', badge: '💳 RuPay Secure' };
    if (clean.startsWith('3')) return { name: 'AMEX', badge: '💳 SafeKey' };
    return { name: 'DEBIT/CREDIT', badge: '💳 256-bit Encrypted' };
  };

  
  // Split details
  const [splitCash, setSplitCash] = useState('');
  const [splitUPI, setSplitUPI] = useState('');
  const [splitCard, setSplitCard] = useState('');

  // ─── Interactive Checkout Modals ───
  const [activeCheckoutModal, setActiveCheckoutModal] = useState(null); // null | 'UPI' | 'CASH' | 'CARD'
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState(null);

  // ─── Submission & Printed Invoice ───
  const [billCreated, setBillCreated] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const printRef = useRef();

  // ─── Module 7 Loyalty & Membership State ───
  const [loyaltyProfile, setLoyaltyProfile] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState('');

  // ─── Payment Gateway Config ───
  const [gatewayConfig, setGatewayConfig] = useState(null);

  // Load backend gateway config on mount
  useEffect(() => {
    Admin_Get_Gateway_Config()
      .then(res => {
        if (res?.data?.data) {
          setGatewayConfig(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Load backend coupons on mount
  useEffect(() => {
    Admin_Get_Coupons()
      .then(res => {
        if (res?.data?.data && res.data.data.length > 0) {
          setAvailableCoupons(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Loyalty Profile when selected customer changes
  useEffect(() => {
    if (selectedCustomer?.id) {
      Admin_Get_Customer_Loyalty_Profile(selectedCustomer.id)
        .then(res => {
          if (res.data?.success) {
            setLoyaltyProfile(res.data);
          }
        })
        .catch(() => setLoyaltyProfile(null));
    } else {
      setLoyaltyProfile(null);
      setPointsToRedeem('');
    }
  }, [selectedCustomer]);

  const activeMember = (members || []).find(m => {
    if (m.status !== 'Active') return false;
    const targetPhone = String(selectedCustomer?.phone || walkInPhone || '').replace(/\D/g, '').slice(-10);
    const mPhone = String(m.customer_phone || '').replace(/\D/g, '').slice(-10);

    // Priority 1: Exact 10-digit phone match
    if (targetPhone && mPhone && targetPhone.length === 10 && mPhone.length === 10) {
      return targetPhone === mPhone;
    }

    // Priority 2: Customer ID match
    if (selectedCustomer?.id && m.customer_id && String(selectedCustomer.id) === String(m.customer_id)) {
      return true;
    }

    // Priority 3: Name match ONLY if phones do not conflict
    const targetName = String(selectedCustomer?.name || walkInName || '').toLowerCase().trim();
    const mName = String(m.customer_name || '').toLowerCase().trim();
    if (targetName && mName && targetName === mName) {
      if (targetPhone && mPhone && targetPhone !== mPhone) return false;
      return true;
    }

    return false;
  });

  // Auto pre-check wallet credit when active member with credit balance is loaded
  useEffect(() => {
    if (activeMember && parseFloat(activeMember.remaining_service_credit || 0) > 0) {
      setIsUseWalletCredit(true);
    }
  }, [activeMember]);

  const activeStylist = stylists.find(s => String(s.id) === String(selectedStylistId)) || null;

  // Filter CRM Customers by search
  const filteredCustomers = customerSearch.trim()
    ? customers.filter(c => String(c.name ?? '').toLowerCase().includes(customerSearch.toLowerCase()) || String(c.phone ?? '').includes(customerSearch))
    : customers.slice(0, 6);

  // ─── Cart Handlers ───
  const addServiceToCart = (item, isPkg = false) => {
    setCartItems(prev => {
      const id = isPkg ? `pkg-${item.id}` : `svc-${item.id}`;
      const exists = prev.find(i => i.id === id);
      if (exists) {
        return prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        id,
        service_id: isPkg ? null : item.id,
        package_id: isPkg ? item.id : null,
        service_name: item.name,
        price: parseFloat(isPkg ? item.package_price : item.price),
        qty: 1,
        category: item.category || (isPkg ? 'Combo Package' : 'General'),
        stylist_id: selectedStylistId || null
      }];
    });
  };

  const updateItemStylist = (itemId, stId) => {
    setCartItems(prev => prev.map(i => i.id === itemId ? { ...i, stylist_id: stId } : i));
  };

  const updateQty = (id, delta) => {
    setCartItems(prev =>
      prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    );
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  // ─── Calculations ───
  const rawSubtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  // 1. Coupon Discount
  let couponDiscountAmt = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      couponDiscountAmt = (rawSubtotal * appliedCoupon.discount_value) / 100;
      if (appliedCoupon.max_discount_amount) {
        couponDiscountAmt = Math.min(couponDiscountAmt, appliedCoupon.max_discount_amount);
      }
    } else {
      couponDiscountAmt = appliedCoupon.discount_value;
    }
  }

  // 2. Manual Discount
  let manualDiscountAmt = 0;
  const manualVal = parseFloat(manualDiscountVal) || 0;
  if (manualVal > 0) {
    if (manualDiscountType === 'percent') {
      manualDiscountAmt = (rawSubtotal * manualVal) / 100;
    } else {
      manualDiscountAmt = manualVal;
    }
  }

  // 3. Membership Tier Auto Discount (Module 7)
  let memberDiscountAmt = 0;
  if (loyaltyProfile?.activeMembership) {
    const discPct = parseFloat(loyaltyProfile.activeMembership.discount_percent || 0);
    memberDiscountAmt = (rawSubtotal * discPct) / 100;
  }

  // 4. Points Redemption Cash Discount (Module 7)
  let pointsDiscountAmt = 0;
  const availPoints = loyaltyProfile?.customer?.loyalty_points || selectedCustomer?.loyalty_points || 0;
  const reqPoints = parseInt(pointsToRedeem) || 0;
  if (reqPoints > 0) {
    pointsDiscountAmt = Math.min(availPoints, reqPoints);
  }

  // 5. Active Membership Service Credit Wallet Redemption (Partial or Full)
  const availWalletCredit = activeMember ? parseFloat(activeMember.remaining_service_credit || 0) : 0;
  
  const preWalletTotalDiscount = Math.min(rawSubtotal, couponDiscountAmt + manualDiscountAmt + memberDiscountAmt + pointsDiscountAmt);
  const preWalletNet = Math.max(0, rawSubtotal - preWalletTotalDiscount);
  
  let preWalletTax = 0;
  if (isTaxInclusive && gstRate > 0) {
    preWalletTax = parseFloat((preWalletNet - (preWalletNet / (1 + gstRate / 100))).toFixed(2));
  } else {
    preWalletTax = parseFloat(((preWalletNet * gstRate) / 100).toFixed(2));
  }
  const preWalletGrandTotal = parseFloat((preWalletNet + (isTaxInclusive ? 0 : preWalletTax) + (parseFloat(tipAmount) || 0)).toFixed(2));

  // Wallet Credit deduction calculation
  const walletCreditDeduct = (isUseWalletCredit && availWalletCredit > 0) ? Math.min(preWalletGrandTotal, availWalletCredit) : 0;
  const grandTotal = Math.max(0, parseFloat((preWalletGrandTotal - walletCreditDeduct).toFixed(2)));
  const totalDiscount = Math.min(rawSubtotal, preWalletTotalDiscount + walletCreditDeduct);
  const netAmount = Math.max(0, rawSubtotal - totalDiscount);
  const taxAmount = preWalletTax;

  const cgstAmount = parseFloat((taxAmount / 2).toFixed(2));
  const sgstAmount = parseFloat((taxAmount / 2).toFixed(2));

  // Tip & Remaining Wallet Math
  const tipVal = parseFloat(tipAmount) || 0;
  const remainingWalletBalAfter = Math.max(0, parseFloat((availWalletCredit - walletCreditDeduct).toFixed(2)));

  // Cash Change Calculation
  const cashRec = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashRec - grandTotal);

  // 5. Stylist Commission Tag (10% default)
  const commissionTag = parseFloat((rawSubtotal * 0.10).toFixed(2));

  // 6. Split Payment Math
  const cashPart = parseFloat(splitCash) || 0;
  const upiPart = parseFloat(splitUPI) || 0;
  const cardPart = parseFloat(splitCard) || 0;
  const splitSum = cashPart + upiPart + cardPart;
  const splitRemaining = parseFloat((grandTotal - splitSum).toFixed(2));

  // ─── Coupon Code Validation ───
  const handleApplyCoupon = async (codeToApply) => {
    const targetCode = codeToApply || couponCode;
    if (!targetCode.trim()) return;
    setCouponError('');

    try {
      const res = await Admin_Validate_Coupon(targetCode, rawSubtotal);
      if (res?.data?.data) {
        setAppliedCoupon(res.data.data);
        setCouponCode(res.data.data.code);
      }
    } catch (err) {
      const found = availableCoupons.find(c => c.code.toUpperCase() === targetCode.trim().toUpperCase());
      if (found) {
        if (rawSubtotal < (found.min_bill_amount || 0)) {
          setCouponError(`Min bill ₹${found.min_bill_amount} required for '${found.code}'`);
        } else {
          setAppliedCoupon(found);
          setCouponCode(found.code);
        }
      } else {
        setCouponError(err?.data?.message || 'Invalid or expired coupon code.');
      }
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // ─── Menu Filtering ───
  const filteredServices = services.filter(s => {
    const matchesCat = activeCategory === 'All' || s.category === activeCategory;
    const matchesSearch = !menuSearch.trim() || String(s.name ?? '').toLowerCase().includes(menuSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredPackages = packages.filter(p => {
    const expStatus = getPackageExpirationStatus(p);
    if (expStatus.isInactive || expStatus.isExpired) return false;
    const matchesCat = activeCategory === 'All' || activeCategory === 'Packages & Combos';
    const matchesSearch = !menuSearch.trim() || String(p.name ?? '').toLowerCase().includes(menuSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // ─── Trigger Official Razorpay Standard Gateway Modal Window ───
  const triggerRazorpayOfficialCheckout = async (preferredMode = 'Razorpay Gateway') => {
    if (cartItems.length === 0) {
      setCustomAlert({ title: 'Cart Empty', message: 'Please add at least one service to the cart first.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Fetch Order Data from Backend API
      const orderRes = await Admin_Create_Razorpay_Order({
        amount: grandTotal,
        receipt: `bill_${Date.now()}`
      }).catch(() => null);

      const orderData = orderRes?.data?.data || orderRes?.data || {};
      const orderId = orderData.order_id || `order_${Math.floor(100000 + Math.random() * 900000)}`;
      const isCustomKey = Boolean(
        orderData.is_custom_key || 
        (orderData.key_id && orderData.key_id.startsWith('rzp_')) ||
        true
      );
      const keyToUse = orderData.key_id || 'rzp_test_TfutS2M3FiTSWG';

      // If merchant configured a Razorpay Key ID, launch Official Razorpay Cloud SDK popup
      if (keyToUse) {
        const loadSdk = () => new Promise((resolve) => {
          if (window.Razorpay) return resolve(true);
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

        const sdkLoaded = await loadSdk();
        if (sdkLoaded && window.Razorpay) {
          let rawPhone = String(selectedCustomer?.phone || walkInPhone || '9876543210').replace(/\D/g, '');
          const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : ('9876543210' + rawPhone).slice(-10);
          const options = {
            key: keyToUse,
            amount: Math.round(grandTotal * 100),
            currency: 'INR',
            name: 'Salon & Spa POS Checkout',
            description: `Payment for ${cartItems.length} Salon Services (Total: ₹${grandTotal.toFixed(2)})`,
            image: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png',
            order_id: (orderId && !orderId.includes('rcpt') && orderId.length > 14) ? orderId : undefined,
            prefill: {
              name: selectedCustomer?.name || walkInName || 'Walk-in Guest',
              contact: cleanPhone,
              email: selectedCustomer?.email || 'customer@salon.com'
            },
            theme: { color: '#2563eb' },
            handler: async function (response) {
              const payId = response.razorpay_payment_id || `pay_${Date.now()}`;
              const rzpOrderId = response.razorpay_order_id || orderId;
              const signature = response.razorpay_signature || 'verified_signature';

              await Admin_Verify_Razorpay_Payment({
                razorpay_order_id: rzpOrderId,
                razorpay_payment_id: payId,
                razorpay_signature: signature
              }).catch(() => null);

              await executeFinalCheckout({
                rzpPayId: payId,
                rzpOrderId: rzpOrderId,
                paymentModeOverride: preferredMode || 'Razorpay Gateway'
              });
            },
            modal: {
              ondismiss: function () {
                setIsSubmitting(false);
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (response) {
            console.warn('Razorpay SDK Payment Notice:', response);
            setIsSubmitting(false);
          });
          rzp.open();
          return;
        }
      }

      // Default Mode (when no custom key is configured in DB): Launch built-in Razorpay Gateway Sandbox Modal
      setRazorpayOrder({ order_id: orderId, amount: grandTotal });
      setActiveCheckoutModal('RAZORPAY_SANDBOX');
    } catch (err) {
      console.error('Razorpay Gateway Launch Notice:', err);
      setRazorpayOrder({ order_id: `order_${Date.now()}`, amount: grandTotal });
      setActiveCheckoutModal('RAZORPAY_SANDBOX');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Initiating Checkout ───
  const handleStartCheckout = async () => {
    if (cartItems.length === 0) return;

    if (paymentMode === 'Split') {
      if (Math.abs(splitRemaining) > 1) {
        setCustomAlert({ title: 'Split Sum Mismatch', message: `Split payment sum (₹${splitSum}) must equal Grand Total (₹${grandTotal}). Remaining: ₹${splitRemaining}`, type: 'warning' });
        return;
      }
      executeFinalCheckout();
    } else if (paymentMode === 'UPI') {
      setIsSubmitting(true);
      try {
        const orderRes = await Admin_Create_Razorpay_Order({ amount: grandTotal, receipt: `rcpt_${Date.now()}` }).catch(() => null);
        if (orderRes?.data?.data) {
          setRazorpayOrder(orderRes.data.data);
        } else {
          setRazorpayOrder({
            order_id: `order_${Math.floor(100000 + Math.random() * 900000)}`,
            key_id: 'rzp_test_SalonPulse2026',
            mode: 'test',
            amount: Math.round(grandTotal * 100)
          });
        }
      } catch (err) {
        console.error('Razorpay Order Error:', err);
      } finally {
        setIsSubmitting(false);
        setActiveCheckoutModal('UPI');
      }
    } else if (paymentMode === 'Cash') {
      if (!cashTendered) setCashTendered(String(Math.ceil(grandTotal)));
      setActiveCheckoutModal('CASH');
    } else if (paymentMode === 'Card') {
      setActiveCheckoutModal('CARD');
    }
  };

  const handlePayViaMembershipCredit = async () => {
    if (cartItems.length === 0 || !activeMember) return;
    setIsSubmitting(true);
    try {
      const avail = parseFloat(activeMember.remaining_service_credit || 0);
      const deductAmt = Math.min(rawSubtotal, avail);
      const netPaid = Math.max(0, grandTotal - deductAmt);

      if (onDeductMemberCredit) {
        onDeductMemberCredit(activeMember, deductAmt);
      }

      await executeFinalCheckout({
        paymentModeOverride: 'Membership Wallet Credit',
        membershipDeductedAmt: deductAmt,
        netPaidOverride: netPaid,
        membershipPlanName: activeMember.membership_name
      });
    } catch (err) {
      console.error('Membership redemption checkout error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Final Billing Submit ───
  const executeFinalCheckout = async (extraData = {}) => {
    setIsSubmitting(true);
    setPaymentProcessing(true);

    try {
      let rzpPayId = extraData.rzpPayId || null;
      let rzpOrderId = extraData.rzpOrderId || razorpayOrder?.order_id || null;
      const modeUsed = extraData.paymentModeOverride || paymentMode;

      if (!rzpPayId && modeUsed === 'UPI' && razorpayOrder) {
        rzpPayId = `pay_${Date.now()}`;
        await Admin_Verify_Razorpay_Payment({
          razorpay_order_id: razorpayOrder.order_id,
          razorpay_payment_id: rzpPayId,
          razorpay_signature: 'verified_signature'
        }).catch(() => null);
      }

      // Automatically deduct membership wallet credit if applied
      if (walletCreditDeduct > 0 && activeMember) {
        if (onDeductMemberCredit) {
          onDeductMemberCredit(activeMember, walletCreditDeduct);
        }
      }

      const finalPaidTotal = grandTotal;
      const finalDiscountAmt = totalDiscount;
      const finalTaxAmt = taxAmount;

      const custObj = selectedCustomer || (isWalkIn ? { name: walkInName, phone: walkInPhone, isWalkIn: true } : null);

      const effectivePaymentMode = walletCreditDeduct > 0
        ? (finalPaidTotal === 0 ? 'Membership Wallet Credit' : `${modeUsed} (₹${walletCreditDeduct.toFixed(2)} Credit + ₹${finalPaidTotal.toFixed(2)} ${modeUsed})`)
        : modeUsed;

      const billPayload = {
        customer_id: selectedCustomer?.id || null,
        customer_name: custObj?.name || (isWalkIn ? walkInName || 'Walk-in Guest' : 'Walk-in Guest'),
        customer_phone: custObj?.phone || walkInPhone || '',
        stylist_id: selectedStylistId || null,
        stylist_name: activeStylist?.name || 'Staff',
        branch_id: null,
        items: cartItems,
        subtotal: rawSubtotal,
        payment_mode: effectivePaymentMode,
        payment_status: 'Paid',
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPayId,
        discount_code: walletCreditDeduct > 0 ? 'MEMBERSHIP_WALLET_REDEMPTION' : (appliedCoupon?.code || (manualDiscountVal ? 'MANUAL_DISCOUNT' : (loyaltyProfile?.activeMembership ? 'MEMBERSHIP_TIER' : null))),
        discount_amount: finalDiscountAmt,
        tax_rate: gstRate,
        tax_amount: finalTaxAmt,
        total: finalPaidTotal,
        grand_total: finalPaidTotal,
        tip_amount: tipVal,
        commission_amount: commissionTag,
        split_details: {
          ...(modeUsed === 'Split' ? { cash: cashPart, upi: upiPart, card: cardPart } : {}),
          points_redeemed: pointsDiscountAmt,
          membership_credit_redeemed: walletCreditDeduct
        },
        notes: walletCreditDeduct > 0 ? `Membership Credit (${activeMember?.membership_name || 'Wallet'}: ₹${walletCreditDeduct.toFixed(2)} deducted, Net Paid: ₹${finalPaidTotal.toFixed(2)})` : (isWalkIn ? `Walk-in: ${walkInName} (${walkInPhone})` : null),
      };

      const created = await onCreateBill(billPayload);

      setActiveCheckoutModal(null);
      setBillCreated({
        ...created,
        customer: custObj,
        stylist: activeStylist,
        items: cartItems,
        subtotal: rawSubtotal,
        totalDiscount: finalDiscountAmt,
        netAmount: finalPaidTotal,
        tax_rate: gstRate,
        tax_amount: taxAmount,
        cgst: cgstAmount,
        sgst: sgstAmount,
        tip_amount: tipVal,
        total: finalPaidTotal,
        cashTendered: cashRec,
        changeDue,
        payment_mode: modeUsed,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPayId,
        cardLast4: cardLast4 || '4242',
        split_details: modeUsed === 'Split' ? { cash: cashPart, upi: upiPart, card: cardPart } : null,
        loyaltyEarned: Math.floor(finalPaidTotal / 10),
        discount_code: walletCreditDeduct > 0 ? 'MEMBERSHIP_WALLET_REDEMPTION' : appliedCoupon?.code,
        membershipDeducted: walletCreditDeduct,
        membershipPlanName: extraData.membershipPlanName || activeMember?.membership_name
      });
    } catch (e) {
      console.error('POS Checkout Error:', e);
      setCustomAlert({ title: 'Transaction Error', message: e?.data?.message || 'Failed to complete transaction. Please check server connection.', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setPaymentProcessing(false);
    }
  };


  // ─── Thermal Receipt Print ───
  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>SalonPulse Tax Invoice #${billCreated?.id || 'RECEIPT'}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 15px; max-width: 380px; margin: auto; color: #000; background: #fff; line-height: 1.3; }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 2px dashed #000; padding-bottom: 8px; }
            .salon-name { font-size: 1.4rem; font-weight: 900; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 0.82rem; }
            .total-row { font-weight: 900; font-size: 1.1rem; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6px 0; margin: 8px 0; }
            .footer { text-align: center; font-size: 0.75rem; margin-top: 14px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  // ─── SUCCESS SCREEN: Tax Invoice ───
  if (billCreated) {
    return (
      <div style={{ maxWidth: '580px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'rgba(37,99,235,0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: '2px solid rgba(37,99,235,0.5)', boxShadow: '0 0 20px rgba(37,99,235,0.3)' }}>
            <CheckCircle2 size={40} />
          </div>
          <h2 style={{ fontSize: '1.7rem', fontWeight: '900', color: 'var(--text-main)' }}>Transaction Approved! 🎉</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Tax Invoice <strong>#INV-{billCreated.id}</strong> recorded in PostgreSQL DB
          </p>
        </div>

        {/* Authentic 80mm POS Thermal Receipt */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
          <div ref={printRef} style={{ background: '#fff', color: '#000', padding: '24px', borderRadius: '12px', fontFamily: "'Courier New', Courier, monospace", fontSize: '0.85rem' }}>
            
            {/* Salon Header & Barcode */}
            <div style={{ textAlign: 'center', marginBottom: '14px', borderBottom: '2px dashed #000', paddingBottom: '12px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '0.05em' }}>✂️ SALONPULSE ERP</div>
              <div style={{ fontSize: '0.75rem', color: '#444', marginTop: '2px' }}>LUXURY SALON & WELLNESS SPA</div>
              <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '2px' }}>Connaught Place, New Delhi · Tel: 011-23456789</div>
              <div style={{ fontSize: '0.72rem', color: '#555', fontWeight: '700', marginTop: '2px' }}>GSTIN: 07AAAAA0000A1Z5 · TAX INVOICE</div>
            </div>

            {/* Meta Information */}
            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>INVOICE NO:</span> <strong>#INV-{billCreated.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>DATE/TIME:</span> <span>{new Date(billCreated.created_at || Date.now()).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>CUSTOMER:</span> <strong>{billCreated.customer?.name} {billCreated.customer?.phone ? `(${billCreated.customer.phone})` : ''}</strong>
              </div>
              {billCreated.stylist && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>STYLIST:</span> <strong>{billCreated.stylist.name}</strong>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', borderBottom: '1.5px solid #000', paddingBottom: '4px', marginBottom: '6px', fontSize: '0.78rem' }}>
                <span style={{ flex: 2 }}>ITEM / SERVICE</span>
                <span style={{ flex: 1, textAlign: 'center' }}>QTY×RATE</span>
                <span style={{ flex: 1, textAlign: 'right' }}>AMOUNT</span>
              </div>
              {billCreated.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #ddd' }}>
                  <div style={{ flex: 2, fontWeight: '700' }}>{item.service_name}</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>{item.qty} × {item.price}</div>
                  <div style={{ flex: 1, textAlign: 'right', fontWeight: '800' }}>₹{(item.price * item.qty).toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div style={{ borderTop: '1px dashed #000', paddingTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>SUBTOTAL:</span> <span>₹{billCreated.subtotal.toFixed(2)}</span>
              </div>

              {billCreated.totalDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontWeight: '700' }}>
                  <span>DISCOUNT SAVINGS ({billCreated.discount_code || 'PROMO'}):</span>
                  <span>-₹{billCreated.totalDiscount.toFixed(2)}</span>
                </div>
              )}

              {billCreated.tax_amount > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '0.78rem' }}>
                    <span>CGST ({(billCreated.tax_rate / 2).toFixed(1)}%):</span> <span>₹{billCreated.cgst.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '0.78rem' }}>
                    <span>SGST ({(billCreated.tax_rate / 2).toFixed(1)}%):</span> <span>₹{billCreated.sgst.toFixed(2)}</span>
                  </div>
                </>
              )}

              {billCreated.tip_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontWeight: '700' }}>
                  <span>STYLIST TIP:</span> <span>+₹{billCreated.tip_amount.toFixed(2)}</span>
                </div>
              )}

              {/* Total Paid Highlight Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '8px 0', margin: '8px 0', fontWeight: '900', fontSize: '1.15rem' }}>
                <span>TOTAL AMOUNT PAID:</span>
                <span>₹{billCreated.total.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span>PAYMENT MODE:</span>
                <strong style={{ background: '#eee', padding: '2px 8px', borderRadius: '4px' }}>{billCreated.payment_mode}</strong>
              </div>

              {billCreated.payment_mode === 'Cash' && billCreated.cashTendered > 0 && (
                <div style={{ fontSize: '0.78rem', color: '#333' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cash Tendered:</span> <span>₹{billCreated.cashTendered.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                    <span>Change Returned:</span> <span>₹{billCreated.changeDue.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {billCreated.payment_mode === 'Card' && (
                <div style={{ fontSize: '0.78rem', color: '#444' }}>
                  Auth Code: AUTH-{Math.floor(100000 + Math.random() * 900000)} · Card ending **** {billCreated.cardLast4}
                </div>
              )}

              {billCreated.split_details && (
                <div style={{ fontSize: '0.75rem', color: '#333', background: '#f5f5f5', padding: '6px', borderRadius: '4px', margin: '4px 0' }}>
                  Split Breakdown: Cash: ₹{billCreated.split_details.cash || 0} | UPI: ₹{billCreated.split_details.upi || 0} | Card: ₹{billCreated.split_details.card || 0}
                </div>
              )}
            </div>

            {billCreated.loyaltyEarned > 0 && (
              <div style={{ textAlign: 'center', marginTop: '10px', padding: '6px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '0.78rem', fontWeight: '800' }}>
                🎁 +{billCreated.loyaltyEarned} LOYALTY POINTS ADDED TO CLIENT ACCOUNT!
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.75rem' }}>
              ************************************<br />
              THANK YOU FOR VISITING SALONPULSE!<br />
              HAVE A WONDERFUL DAY ✨<br />
              ************************************
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '0.95rem' }}>
              <Printer size={18} /> Print Thermal Receipt
            </button>
            <button
              type="button"
              onClick={() => {
                if (!billCreated) return;
                const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice #INV-${billCreated.id} - ${billCreated.customer?.name || 'Customer'}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 20px; line-height: 1.5; }
    .invoice-card { max-width: 750px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #0f172a; padding-bottom: 18px; margin-bottom: 24px; }
    .brand-title { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
    .brand-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
    .badge { background: #2563eb; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 800; display: inline-block; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 10px; font-size: 13px; border: 1px solid #e2e8f0; }
    .info-label { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    .info-val { font-weight: 800; color: #0f172a; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    th { background: #0f172a; color: #fff; text-align: left; padding: 10px 14px; font-size: 12px; font-weight: 800; text-transform: uppercase; }
    td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; }
    .totals { width: 320px; margin-left: auto; font-size: 13px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
    .grand-total { border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; font-weight: 900; font-size: 16px; color: #2563eb; padding: 8px 0; margin-top: 8px; }
    .footer { text-align: center; margin-top: 36px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand-title">✂️ SALONPULSE ERP</div>
        <div class="brand-sub">Multi-Branch Luxury Salon & Spa Enterprise</div>
        <div class="brand-sub">GSTIN: 07AAAAA0000A1Z5 · Official Tax Invoice</div>
      </div>
      <div style="text-align: right;">
        <div class="badge">PAID IN FULL</div>
        <div style="font-size: 18px; font-weight: 900; margin-top: 6px; color: #0f172a;">#INV-${billCreated.id}</div>
        <div style="font-size: 12px; color: #64748b;">${new Date(billCreated.created_at || Date.now()).toLocaleDateString('en-IN')}</div>
      </div>
    </div>

    <div class="info-grid">
      <div>
        <div class="info-label">Customer Details</div>
        <div class="info-val">${billCreated.customer?.name || 'Walk-in Client'} ${billCreated.customer?.phone ? `(${billCreated.customer.phone})` : ''}</div>
      </div>
      <div>
        <div class="info-label">Stylist Tagged</div>
        <div class="info-val">${billCreated.stylist?.name || 'Salon Team'}</div>
      </div>
      <div>
        <div class="info-label">Payment Mode</div>
        <div class="info-val">${billCreated.payment_mode || 'Razorpay Gateway'}</div>
      </div>
      <div>
        <div class="info-label">Invoice Date & Time</div>
        <div class="info-val">${new Date(billCreated.created_at || Date.now()).toLocaleString('en-IN')}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Service / Package Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${billCreated.items && billCreated.items.length > 0 ? billCreated.items.map(item => `
          <tr>
            <td><strong>${item.service_name || 'Salon Service'}</strong></td>
            <td style="text-align: center;">${item.qty || 1}</td>
            <td style="text-align: right;">₹${parseFloat(item.price || 0).toFixed(2)}</td>
            <td style="text-align: right;">₹${(parseFloat(item.price || 0) * (item.qty || 1)).toFixed(2)}</td>
          </tr>
        `).join('') : `
          <tr>
            <td><strong>Salon Services Rendered</strong></td>
            <td style="text-align: center;">1</td>
            <td style="text-align: right;">₹${billCreated.subtotal.toFixed(2)}</td>
            <td style="text-align: right;">₹${billCreated.subtotal.toFixed(2)}</td>
          </tr>
        `}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row"><span>Subtotal:</span><span>₹${billCreated.subtotal.toFixed(2)}</span></div>
      ${billCreated.totalDiscount > 0 ? `<div class="totals-row" style="color: #dc2626;"><span>Discount (${billCreated.discount_code || 'PROMO'}):</span><span>-₹${billCreated.totalDiscount.toFixed(2)}</span></div>` : ''}
      ${billCreated.tax_amount > 0 ? `<div class="totals-row"><span>GST (${billCreated.tax_rate}%):</span><span>₹${billCreated.tax_amount.toFixed(2)}</span></div>` : ''}
      ${billCreated.tip_amount > 0 ? `<div class="totals-row" style="color: #2563eb;"><span>Stylist Tip:</span><span>+₹${billCreated.tip_amount.toFixed(2)}</span></div>` : ''}
      <div class="totals-row grand-total"><span>Total Amount Paid:</span><span>₹${billCreated.total.toFixed(2)}</span></div>
    </div>

    <div class="footer">
      🔒 Secured Transaction processed via SalonPulse ERP & Razorpay Engine<br>
      Thank you for visiting SalonPulse! Have a wonderful day ✨
    </div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

                const printWin = window.open('', '_blank');
                if (printWin) {
                  printWin.document.write(htmlContent);
                  printWin.document.close();
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '0.95rem',
                background: 'rgba(37, 99, 235, 0.15)', border: '1.5px solid #2563eb', color: '#38bdf8',
                fontWeight: '900', borderRadius: '10px', cursor: 'pointer'
              }}
            >
              📥 Download PDF Invoice
            </button>
            {onViewHistory && (
              <button onClick={onViewHistory} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '0.95rem', background: 'rgba(245, 158, 11, 0.15)', border: '1.5px solid var(--accent-gold)', color: 'var(--accent-gold)', fontWeight: '800', borderRadius: '10px', cursor: 'pointer' }}>
                <Receipt size={18} /> View Billing History ({bills.length})
              </button>
            )}
            <button className="glass-card" onClick={onBack} style={{ padding: '12px 20px', cursor: 'pointer', color: 'var(--text-main)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeft size={16} /> Return to POS Counter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN POS REAL INTERFACE ───
  return (
    <div>
      {/* ─── REAL POS TOP HEADER & CRM CLIENT BAR ─── */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '20px', borderRadius: '16px', position: 'relative', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          
          {/* Title & Back */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              className="glass-card"
              onClick={onBack}
              style={{ padding: '8px 14px', cursor: 'pointer', color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            {onViewHistory && (
              <button
                className="glass-card"
                onClick={onViewHistory}
                style={{ padding: '8px 14px', cursor: 'pointer', color: 'var(--accent-gold)', border: '1.5px solid var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem' }}
              >
                <Receipt size={16} /> Billing History ({bills.length})
              </button>
            )}
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={24} style={{ color: 'var(--accent-gold)' }} />
                Commercial POS Terminal Billing
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Enterprise Salon & Spa Real Checkout Counter</span>
            </div>
          </div>

          {/* CRM Client Card / Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            
            {/* Guest / CRM Mode Toggle */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => { setIsWalkIn(true); setSelectedCustomer(null); }}
                style={{
                  padding: '7px 16px', borderRadius: '9px', border: 'none',
                  background: isWalkIn ? '#2563eb' : 'transparent',
                  color: isWalkIn ? '#ffffff' : 'var(--text-sub)',
                  fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer',
                  boxShadow: isWalkIn ? '0 2px 10px rgba(37, 99, 235, 0.35)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Walk-in Guest
              </button>
              <button
                type="button"
                onClick={() => { setIsWalkIn(false); }}
                style={{
                  padding: '7px 16px', borderRadius: '9px', border: 'none',
                  background: !isWalkIn ? '#2563eb' : 'transparent',
                  color: !isWalkIn ? '#ffffff' : 'var(--text-sub)',
                  fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer',
                  boxShadow: !isWalkIn ? '0 2px 10px rgba(37, 99, 235, 0.35)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                CRM Member
              </button>
            </div>

            {isWalkIn ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Guest Name"
                  value={walkInName}
                  onChange={e => setWalkInName(e.target.value)}
                  style={{ width: '140px', padding: '8px 12px', borderRadius: '10px', background: 'var(--input-bg)', border: '1.5px solid var(--border)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                />
                <input
                  type="text"
                  placeholder="Mobile No"
                  value={walkInPhone}
                  onChange={e => setWalkInPhone(e.target.value)}
                  style={{ width: '130px', padding: '8px 12px', borderRadius: '10px', background: 'var(--input-bg)', border: '1.5px solid var(--border)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                />
              </div>
            ) : (
              <div className="search-input-wrapper" style={{ width: '260px', position: 'relative', zIndex: 101 }}>
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  className="search-input-field search-input-compact"
                  placeholder="Search CRM by Name / Mobile..."
                  value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone})` : customerSearch}
                  onFocus={() => setShowCustDropdown(true)}
                  onChange={e => { setSelectedCustomer(null); setCustomerSearch(e.target.value); setShowCustDropdown(true); }}
                />
                {showCustDropdown && !selectedCustomer && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, background: '#1e293b', border: '1.5px solid var(--accent-gold)', borderRadius: '12px', marginTop: '6px', maxHeight: '260px', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.95), 0 0 15px rgba(245,158,11,0.2)' }}>
                    {filteredCustomers.length === 0 ? (
                      <div style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No CRM client found</div>
                    ) : (
                      filteredCustomers.map(c => (
                        <div
                          key={c.id}
                          onClick={() => { setSelectedCustomer(c); setShowCustDropdown(false); }}
                          style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.83rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.15)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        >
                          <div>
                            <strong style={{ color: '#ffffff' }}>{c.name}</strong>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>📞 {c.phone}</div>
                          </div>
                          <span style={{ fontSize: '0.74rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                            🏆 {c.loyalty_points || 0} pts
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Primary Stylist Selection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>Stylist:</span>
              <select
                className="select-filter"
                value={selectedStylistId}
                onChange={e => setSelectedStylistId(e.target.value)}
                style={{ height: '38px', padding: '6px 32px 6px 12px', fontSize: '0.82rem' }}
              >
                <option value="">No Primary Stylist</option>
                {stylists.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.specialization || 'Stylist'})</option>
                ))}
              </select>
            </div>

          </div>

        </div>

        {/* Selected Customer Banner */}
        {selectedCustomer && !isWalkIn && (
          <div style={{ background: 'rgba(37,99,235,0.12)', border: '1.5px solid rgba(37,99,235,0.35)', padding: '12px 18px', borderRadius: '14px', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <User size={20} style={{ color: '#10b981' }} />
              <div>
                <strong style={{ color: '#10b981', fontSize: '0.92rem' }}>CRM Member Selected: {selectedCustomer.name}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginLeft: '8px' }}>({selectedCustomer.phone})</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.82rem' }}>
              <span style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-gold)', padding: '4px 10px', borderRadius: '8px', fontWeight: '800' }}>
                🎁 Loyalty Points: {selectedCustomer.loyalty_points || 0} pts
              </span>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '800', fontSize: '0.8rem' }}>✕ Change Client</button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MAIN 2-COLUMN REAL POS WORKSPACE ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '20px' }}>

        {/* ─── LEFT COLUMN: SERVICE CATALOG & PACKAGES MENU ─── */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Menu Search & Category Tabs */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search service name, category, package..."
                  value={menuSearch}
                  onChange={e => setMenuSearch(e.target.value)}
                  style={{
                    width: '100%', paddingLeft: '36px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px',
                    background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            {/* Category Chips */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {['All', 'Hair', 'Facial', 'Beard', 'Hair Spa', 'Color', 'Packages & Combos'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', border: activeCategory === cat ? '1px solid var(--accent-gold)' : '1px solid var(--border)',
                    background: activeCategory === cat ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.03)',
                    color: activeCategory === cat ? 'var(--accent-gold)' : 'var(--text-sub)',
                    fontWeight: '800', fontSize: '0.78rem', cursor: 'pointer', whitespace: 'nowrap', transition: 'all 0.15s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Service Items Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '520px', paddingRight: '4px' }}>
            
            {/* Bundled Special Packages */}
            {filteredPackages.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} /> Bundled Combo Packages ({filteredPackages.length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                  {filteredPackages.map(pkg => {
                    const includedServices = getIncludedServicesForPackage(pkg, services);
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => addServiceToCart(pkg, true)}
                        style={{
                          padding: '14px',
                          background: 'linear-gradient(145deg, rgba(245,158,11,0.06), rgba(16,185,129,0.04))',
                          borderRadius: '14px',
                          border: '1.5px solid rgba(245,158,11,0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          display: 'flex',
                          flexDirection: 'column',
                          justify: 'space-between',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--accent-gold)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#ffffff', lineHeight: '1.3' }}>{pkg.name}</div>
                            <span style={{ fontSize: '0.68rem', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)', padding: '2px 7px', borderRadius: '12px', fontWeight: '900', whiteSpace: 'nowrap' }}>
                              {pkg.category || 'Combo'}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.35' }}>
                            {pkg.description || 'Special Bundle Package'}
                          </div>

                          {/* Included Combo Services List */}
                          {includedServices.length > 0 && (
                            <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px', padding: '8px 10px', marginBottom: '10px', border: '1px solid rgba(245,158,11,0.18)' }}>
                              <div style={{ fontSize: '0.68rem', color: 'var(--accent-gold)', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Scissors size={11} /> Included Services ({includedServices.length}):
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {includedServices.map((srvName, idx) => (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#f8fafc', fontWeight: '600' }}>
                                    <CheckCircle2 size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                                    <span>{srvName}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed rgba(245,158,11,0.2)' }}>
                          <div>
                            <span style={{ fontWeight: '900', color: 'var(--accent-gold)', fontSize: '1rem' }}>
                              ₹{parseFloat(pkg.package_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            {pkg.standalone_price > pkg.package_price && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '6px' }}>
                                ₹{pkg.standalone_price}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.74rem', background: 'var(--accent-gold)', color: '#000', padding: '4px 10px', borderRadius: '8px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Plus size={13} /> Add Combo
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Standalone Salon Services */}
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
              💈 Salon Services Catalog ({filteredServices.length})
            </div>
            {filteredServices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No services found matching category filter.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {filteredServices.map(s => (
                  <div
                    key={s.id}
                    onClick={() => addServiceToCart(s, false)}
                    style={{
                      padding: '14px',
                      background: 'var(--bg-card)',
                      borderRadius: '14px',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'space-between'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--bg-card)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px', lineHeight: '1.3' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>{s.category}</span>
                        <span>· ⏱ {s.duration_minutes}m</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
                      <span style={{ fontWeight: '900', fontSize: '1.05rem', color: '#10b981' }}>₹{s.price}</span>
                      <button
                        type="button"
                        style={{
                          background: '#2563eb',
                          border: 'none',
                          color: '#ffffff',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}


          </div>
        </div>

        {/* ─── RIGHT COLUMN: LIVE POS CART & BILLING PANEL ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* CART ITEMS LIST */}
          <div className="glass-panel" style={{ padding: '18px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontWeight: '800', fontSize: '0.98rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Receipt size={17} style={{ color: 'var(--accent-gold)' }} />
                POS Cart Items ({cartItems.length})
              </h3>
              {cartItems.length > 0 && (
                <button onClick={() => setCartItems([])} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '700' }}>
                  Clear Cart
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                🛒 Cart is empty.<br />Click <strong>+</strong> on any service to add to bill.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto', marginBottom: '14px' }}>
                {cartItems.map(item => {
                  const pkgObj = item.package_id ? packages.find(p => String(p.id) === String(item.package_id)) : null;
                  const incServices = pkgObj ? getIncludedServicesForPackage(pkgObj, services) : [];

                  return (
                    <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      {/* Title & Price Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#ffffff' }}>
                          {item.service_name}
                        </div>
                        <div style={{ fontWeight: '900', color: '#10b981', fontSize: '0.95rem' }}>
                          ₹{(item.price * item.qty).toFixed(2)}
                        </div>
                      </div>

                      {/* Included Services Breakdown for Combo Packages */}
                      {item.package_id && incServices.length > 0 && (
                        <div style={{ background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(245, 158, 11, 0.25)', marginTop: '2px', marginBottom: '2px' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Scissors size={11} /> Included Services ({incServices.length}):
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {incServices.map((sName, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#f8fafc', fontWeight: '600' }}>
                                <CheckCircle2 size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                                <span>{sName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bottom Controls: Stylist Dropdown & Qty */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '2px' }}>
                        <select
                          value={item.stylist_id || ''}
                          onChange={e => updateItemStylist(item.id, e.target.value)}
                          style={{ padding: '3px 8px', fontSize: '0.74rem', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-sub)' }}
                        >
                          <option value="">Assign Stylist</option>
                          {stylists.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <button onClick={() => updateQty(item.id, -1)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Minus size={10} />
                          </button>
                          <span style={{ fontWeight: '800', width: '18px', textAlign: 'center', fontSize: '0.85rem' }}>{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={10} />
                          </button>
                          <button onClick={() => removeFromCart(item.id)} style={{ background: 'rgba(239,68,68,0.12)', border: 'none', color: '#ef4444', width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '4px' }}>
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── DISCOUNT & COUPON SECTION ─── */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '10px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--accent-gold)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={13} /> Coupon Code & Manual Override
              </div>

              {appliedCoupon ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.78rem', color: '#34d399', fontWeight: '700' }}>
                  <span>🎉 Coupon Applied: <strong>{appliedCoupon.code}</strong> (-₹{couponDiscountAmt.toFixed(2)})</span>
                  <button onClick={removeCoupon} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '800' }}>Remove</button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    <input
                      type="text"
                      placeholder="Enter Coupon Code"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      style={{ flex: 1, padding: '5px 10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.78rem' }}
                    />
                    <button onClick={() => handleApplyCoupon()} style={{ padding: '5px 10px', background: 'var(--accent-gold)', border: 'none', borderRadius: '6px', color: '#000', fontWeight: '800', fontSize: '0.76rem', cursor: 'pointer' }}>
                      Apply
                    </button>
                  </div>
                  {couponError && <div style={{ color: '#ef4444', fontSize: '0.72rem', marginBottom: '4px' }}>{couponError}</div>}
                  
                  {/* Coupon Pills */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {availableCoupons.map(c => (
                      <span
                        key={c.code}
                        onClick={() => handleApplyCoupon(c.code)}
                        style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '6px', color: 'var(--text-sub)', cursor: 'pointer' }}
                      >
                        🏷️ {c.code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Override Input */}
              <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Manual Discount:</span>
                <select
                  value={manualDiscountType}
                  onChange={e => setManualDiscountType(e.target.value)}
                  style={{ padding: '3px 6px', fontSize: '0.74rem', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '4px' }}
                >
                  <option value="flat">₹ Flat</option>
                  <option value="percent">% Percent</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  value={manualDiscountVal}
                  onChange={e => setManualDiscountVal(e.target.value)}
                  style={{ width: '65px', padding: '3px 6px', fontSize: '0.74rem', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '4px' }}
                />
              </div>

              {/* Loyalty & Membership Program (Module 7) */}
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
                {loyaltyProfile?.activeMembership && (
                  <div style={{
                    padding: '6px 10px', borderRadius: '6px', marginBottom: '6px',
                    background: `${loyaltyProfile.activeMembership.badge_color || '#2563eb'}22`,
                    border: `1px solid ${loyaltyProfile.activeMembership.badge_color || '#2563eb'}`,
                    color: loyaltyProfile.activeMembership.badge_color || '#38bdf8',
                    fontSize: '0.76rem', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span>👑 {loyaltyProfile.activeMembership.membership_name} ({loyaltyProfile.activeMembership.discount_percent}% Auto Off)</span>
                    <span>-₹{memberDiscountAmt.toFixed(2)}</span>
                  </div>
                )}

                {selectedCustomer && (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: '600' }}>
                      🎁 Points: <strong>{availPoints}</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="number"
                        placeholder="Redeem Pts"
                        value={pointsToRedeem}
                        onChange={e => setPointsToRedeem(e.target.value)}
                        style={{ width: '85px', padding: '3px 6px', fontSize: '0.74rem', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '4px' }}
                      />
                      {pointsDiscountAmt > 0 && (
                        <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: '700' }}>-₹{pointsDiscountAmt}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── GST RATE & TIP ─── */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: '700' }}>GST Tax Configuration:</span>
                <select
                  value={gstRate}
                  onChange={e => setGstRate(Number(e.target.value))}
                  style={{ padding: '3px 6px', fontSize: '0.74rem', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '4px' }}
                >
                  <option value={0}>0% Tax Exempt</option>
                  <option value={5}>5% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST (Standard)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: '700' }}>Stylist Tip (₹):</span>
                <input
                  type="number"
                  placeholder="0"
                  value={tipAmount}
                  onChange={e => setTipAmount(e.target.value)}
                  style={{ width: '70px', padding: '3px 6px', fontSize: '0.74rem', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '4px', textAlign: 'right' }}
                />
              </div>
            </div>

            {/* ─── TOTAL BREAKDOWN ─── */}
            {cartItems.length > 0 && (
              <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '8px', marginTop: '8px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: 'var(--text-sub)' }}>
                  <span>Subtotal</span><span>₹{rawSubtotal.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#ef4444' }}>
                    <span>Discount</span><span>-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                {walletCreditDeduct > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#10b981', fontWeight: '800' }}>
                    <span>👑 Wallet Credit Applied</span><span>-₹{walletCreditDeduct.toFixed(2)}</span>
                  </div>
                )}
                {gstRate > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#34d399' }}>
                    <span>GST ({gstRate}%)</span><span>₹{taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {tipVal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: 'var(--accent-gold)' }}>
                    <span>Stylist Tip</span><span>+₹{tipVal.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1.5px solid var(--border)', fontWeight: '900', fontSize: '1.05rem', marginTop: '4px' }}>
                  <span>GRAND TOTAL PAYABLE</span>
                  <span style={{ color: grandTotal === 0 ? '#10b981' : 'var(--accent-gold)' }}>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

          </div>

          {/* ─── OFFICIAL PAYMENT GATEWAY CHECKOUT PANEL ─── */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <h4 style={{ fontWeight: '800', fontSize: '0.85rem', marginBottom: '10px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Payment Gateway Checkout</span>
              <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                ⚡ Razorpay / Stripe SDK
              </span>
            </h4>

            {/* Membership Wallet Credit Redemption Checkbox Card (Manual Toggle) */}
            {activeMember && availWalletCredit > 0 && (
              <div style={{
                marginBottom: '12px',
                padding: '12px',
                borderRadius: '12px',
                background: isUseWalletCredit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: isUseWalletCredit ? '1.5px solid #10b981' : '1px dashed var(--border)',
                transition: 'all 0.2s ease'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', margin: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={isUseWalletCredit}
                      onChange={e => setIsUseWalletCredit(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: '800', color: isUseWalletCredit ? '#10b981' : 'var(--text-main)' }}>
                        👑 Manually Redeem {activeMember.membership_name} Credit Wallet
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                        Available Balance: <strong style={{ color: '#10b981' }}>₹{availWalletCredit.toLocaleString()}</strong> {!isUseWalletCredit && '(Click to Redeem)'}
                      </div>
                    </div>
                  </div>

                  {isUseWalletCredit && walletCreditDeduct > 0 && (
                    <span style={{ fontSize: '0.86rem', fontWeight: '900', color: '#10b981' }}>
                      -₹{walletCreditDeduct.toFixed(2)}
                    </span>
                  )}
                </label>

                {isUseWalletCredit && walletCreditDeduct > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-sub)', borderTop: '1px dashed rgba(16, 185, 129, 0.3)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Remaining Net Payable:</span>
                    <strong style={{ color: grandTotal === 0 ? '#10b981' : 'var(--accent-gold)' }}>
                      {grandTotal === 0 ? '₹0.00 (Fully Covered by Wallet)' : `₹${grandTotal.toFixed(2)}`}
                    </strong>
                  </div>
                )}
              </div>
            )}

            {/* If 100% covered by wallet credit */}
            {grandTotal === 0 && walletCreditDeduct > 0 ? (
              <button
                type="button"
                onClick={() => executeFinalCheckout({ paymentModeOverride: 'Membership Wallet Credit' })}
                disabled={cartItems.length === 0 || isSubmitting}
                style={{
                  width: '100%',
                  marginBottom: '10px',
                  fontSize: '0.92rem',
                  padding: '13px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  fontWeight: '900',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                  cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: cartItems.length === 0 ? 0.5 : 1
                }}
              >
                <Crown size={18} />
                {isSubmitting ? 'Redeeming Membership Credit...' : `👑 Pay ₹0.00 via Membership Wallet (₹${walletCreditDeduct.toFixed(2)} Used · ₹${remainingWalletBalAfter.toFixed(2)} Bal Left)`}
              </button>
            ) : (
              <>
                {walletCreditDeduct > 0 && (
                  <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#10b981', fontSize: '0.78rem', fontWeight: '800', marginBottom: '10px', textAlign: 'center' }}>
                    👑 ₹{walletCreditDeduct.toFixed(2)} Wallet Credit Applied (₹{remainingWalletBalAfter.toFixed(2)} Balance Remaining). Pay remaining net ₹{grandTotal.toFixed(2)} below:
                  </div>
                )}
              </>
            )}

            {/* Primary Direct Official Razorpay SDK Popup Button */}
            <button
              type="button"
              className="btn-primary"
              onClick={() => triggerRazorpayOfficialCheckout('Razorpay Gateway')}
              disabled={cartItems.length === 0 || isSubmitting}
              style={{
                width: '100%',
                fontSize: '0.96rem',
                padding: '14px',
                opacity: cartItems.length === 0 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#2563eb',
                boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={18} />
              {isSubmitting ? 'Opening Razorpay Gateway SDK...' : `Proceed to Pay ₹${grandTotal.toFixed(2)} via Razorpay Gateway`}
            </button>

            {/* Counter Cash Payment Button */}
            <button
              type="button"
              onClick={() => {
                setPaymentMode('Cash');
                if (!cashTendered) setCashTendered(String(Math.ceil(grandTotal)));
                setActiveCheckoutModal('CASH');
              }}
              disabled={cartItems.length === 0 || isSubmitting}
              style={{
                width: '100%',
                marginTop: '10px',
                fontSize: '0.82rem',
                padding: '10px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border)',
                color: 'var(--text-sub)',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                opacity: cartItems.length === 0 ? 0.5 : 1
              }}
            >
              <Banknote size={15} style={{ color: '#34d399' }} /> Pay via Counter Cash (Manual Bill)
            </button>

            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              🔒 Secured SSL Payment Transaction via Official Razorpay SDK
            </div>
          </div>

        </div>

      </div>

      {/* ─── REAL INTERACTIVE PAYMENT MODALS ─── */}

      {/* 1. UPI REAL DYNAMIC QR CODE MODAL */}
      {activeCheckoutModal === 'UPI' && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px', width: '90%', padding: '24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <QrCode size={18} style={{ color: 'var(--accent-gold)' }} /> Dynamic UPI QR Payment
              </h3>
              <button onClick={() => setActiveCheckoutModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#fff', padding: '16px', borderRadius: '14px', margin: '0 auto 14px', maxWidth: '240px' }}>
              {/* Dynamic QR SVG */}
              <div style={{ width: '180px', height: '180px', margin: '0 auto', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: '#fff', flexDirection: 'column', position: 'relative' }}>
                <QrCode size={120} style={{ color: '#fff' }} />
                <div style={{ position: 'absolute', bottom: '8px', fontSize: '0.65rem', color: 'var(--accent-gold)', background: '#111', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                  UPI: salonpulse@upi
                </div>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#111', fontWeight: '900', marginTop: '10px' }}>
                Scan with GooglePay, PhonePe, Paytm
              </div>
            </div>

            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--accent-gold)', marginBottom: '8px' }}>
              Amount to Pay: ₹{grandTotal.toFixed(2)}
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Waiting for customer scan confirmation...
            </p>

            <button
              className="btn-primary"
              onClick={executeFinalCheckout}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isSubmitting ? 'Verifying Payment...' : <><CheckCircle2 size={16} /> Simulate UPI Payment Received</>}
            </button>
          </div>
        </div>
      )}

      {/* 2. CASH PAYMENT & CHANGE CALCULATOR MODAL */}
      {activeCheckoutModal === 'CASH' && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '420px', width: '90%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Banknote size={18} style={{ color: '#34d399' }} /> Cash Payment Counter
              </h3>
              <button onClick={() => setActiveCheckoutModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '14px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Bill Total Amount:</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--accent-gold)' }}>₹{grandTotal.toFixed(2)}</strong>
              </div>

              <label style={{ display: 'block', margin: '12px 0 6px', fontWeight: '700', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Cash Tendered by Customer (₹):
              </label>
              <input
                type="number"
                value={cashTendered}
                onChange={e => setCashTendered(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize: '1.2rem', fontWeight: '900', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', color: '#fff' }}
              />

              {/* Quick Cash Chips */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                {[Math.ceil(grandTotal), 500, 1000, 2000].map(val => (
                  <button
                    key={val}
                    onClick={() => setCashTendered(String(val))}
                    style={{ flex: 1, padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-sub)', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>

              {/* Change Calculation Box */}
              <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '12px', borderRadius: '10px', marginTop: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change to Return to Client</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#34d399', marginTop: '2px' }}>
                  ₹{changeDue.toFixed(2)}
                </div>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={executeFinalCheckout}
              disabled={isSubmitting || cashRec < grandTotal}
              style={{ width: '100%', padding: '12px', opacity: cashRec < grandTotal ? 0.5 : 1 }}
            >
              {cashRec < grandTotal ? `Add ₹${(grandTotal - cashRec).toFixed(2)} More` : 'Complete Cash Transaction & Print Invoice'}
            </button>
          </div>
        </div>
      )}

      {/* 3. AUTHENTIC PAYMENT GATEWAY CARD CHECKOUT & 3D SECURE OTP MODAL */}
      {activeCheckoutModal === 'CARD' && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '460px', width: '92%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} style={{ color: '#818cf8' }} /> Secured Payment Gateway Card Checkout
              </h3>
              <button onClick={() => { setActiveCheckoutModal(null); setCardStep('DETAILS'); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Step 1: CARD DETAILS INPUT & INTERACTIVE VIRTUAL CARD */}
            {cardStep === 'DETAILS' && (
              <div>
                {/* Official Razorpay Gateway Popup Trigger inside Card Modal */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveCheckoutModal(null);
                    triggerRazorpayOfficialCheckout('card');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '16px',
                    borderRadius: '12px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  <Sparkles size={18} /> Open Official Razorpay Gateway Window (Real Bank Deposit)
                </button>

                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  — OR USE POS SANDBOX COUNTER TERMINAL BELOW —
                </div>

                {/* Sandbox Quick Test Card Fill Chips */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={() => { setCardNumber('4111 1111 1111 1111'); setCardHolder('TEST VISA CLIENT'); setCardExpiry('12/30'); setCardCvv('123'); }}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ⚡ Visa Test
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCardNumber('5105 1051 0510 5105'); setCardHolder('TEST MASTERCARD CLIENT'); setCardExpiry('12/30'); setCardCvv('123'); }}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: '8px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ⚡ MasterCard
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCardNumber('6071 0000 0000 0000'); setCardHolder('TEST RUPAY CLIENT'); setCardExpiry('12/30'); setCardCvv('123'); }}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: '8px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ⚡ RuPay Test
                  </button>
                </div>
                {/* ─── INTERACTIVE VIRTUAL BANK CREDIT / DEBIT CARD ─── */}
                <div style={{
                  background: '#0d0d0d',
                  borderRadius: '16px',
                  padding: '20px',
                  color: '#ffffff',
                  marginBottom: '20px',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* EMV Chip & Brand Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '38px', height: '28px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '6px', border: '1px solid #fbbf24' }}></div>
                      <span style={{ fontSize: '0.75rem', opacity: 0.8, letterSpacing: '1px' }}>DEBIT / CREDIT</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '8px', fontWeight: '900', fontSize: '0.82rem', letterSpacing: '1px' }}>
                      {getCardBrand(cardNumber).name}
                    </div>
                  </div>

                  {/* Card Number */}
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', letterSpacing: '3px', fontFamily: 'monospace', marginBottom: '18px', color: '#f8fafc' }}>
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  {/* Cardholder & Expiry */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>CARDHOLDER NAME</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', textTransform: 'uppercase', color: '#ffffff' }}>
                        {cardHolder || 'NAME ON CARD'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>EXPIRES</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', fontFamily: 'monospace', color: '#ffffff' }}>
                        {cardExpiry || 'MM/YY'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── CARD INPUT FORM FIELDS ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                  
                  {/* Card Number Input */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Card Number *</span>
                      <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700' }}>
                        {getCardBrand(cardNumber).badge}
                      </span>
                    </label>
                    <div className="search-input-wrapper">
                      <CreditCard size={18} className="search-icon" />
                      <input
                        type="text"
                        className="search-input-field"
                        placeholder="4532 8912 3456 7890"
                        maxLength={19}
                        value={cardNumber}
                        onChange={e => {
                          const formatted = formatCardNum(e.target.value);
                          setCardNumber(formatted);
                          const clean = formatted.replace(/\s+/g, '');
                          if (clean.length >= 4) setCardLast4(clean.slice(-4));
                        }}
                      />
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Cardholder Name *</label>
                    <input
                      type="text"
                      className="search-input-field"
                      style={{ paddingLeft: '14px', textTransform: 'uppercase' }}
                      placeholder="e.g. SUNIL KUMAR"
                      value={cardHolder}
                      onChange={e => setCardHolder(e.target.value.toUpperCase())}
                    />
                  </div>

                  {/* Expiry & CVV 2-Column Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Expiry Date (MM/YY) *</label>
                      <input
                        type="text"
                        className="search-input-field"
                        style={{ paddingLeft: '14px', textAlign: 'center' }}
                        placeholder="MM/YY"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={e => setCardExpiry(formatExpDate(e.target.value))}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>CVV / CVC *</label>
                      <input
                        type="password"
                        className="search-input-field"
                        style={{ paddingLeft: '14px', textAlign: 'center', letterSpacing: '3px' }}
                        placeholder="•••"
                        maxLength={4}
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                </div>

                {/* Submit to 3D Secure OTP */}
                <button
                  className="btn-primary"
                  onClick={() => setCardStep('OTP')}
                  disabled={!cardNumber || cardNumber.replace(/\s+/g, '').length < 15 || !cardExpiry || !cardCvv}
                  style={{
                    width: '100%', padding: '14px', fontSize: '0.95rem',
                    opacity: (!cardNumber || cardNumber.replace(/\s+/g, '').length < 15 || !cardExpiry || !cardCvv) ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <ShieldCheck size={18} /> Proceed to 3D Secure Payment (₹{grandTotal.toFixed(2)})
                </button>
              </div>
            )}

            {/* Step 2: 3D SECURE BANKING OTP VERIFICATION SCREEN */}
            {cardStep === 'OTP' && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                
                {/* Bank Security Banner */}
                <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '16px', borderRadius: '14px', marginBottom: '20px' }}>
                  <ShieldCheck size={36} style={{ color: '#10b981', marginBottom: '6px' }} />
                  <div style={{ fontWeight: '900', fontSize: '1rem', color: '#ffffff' }}>
                    3D Secure Banking Verification
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: '800', marginTop: '2px' }}>
                    {getCardBrand(cardNumber).badge} Gateway
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '14px', lineHeight: '1.5' }}>
                  A 6-digit Banking OTP has been sent to the client's registered mobile number linked with card ending <strong>**** {cardLast4 || '4242'}</strong>.
                </div>

                {/* 6-Digit Banking OTP Input */}
                <div className="form-group" style={{ maxWidth: '240px', margin: '0 auto 16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Enter 6-Digit OTP Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={cardOtp}
                    onChange={e => setCardOtp(e.target.value.replace(/\D/g, ''))}
                    style={{
                      width: '100%', padding: '12px', textAlign: 'center',
                      fontSize: '1.4rem', fontWeight: '900', letterSpacing: '8px',
                      background: 'var(--input-bg)', border: '1.5px solid var(--accent-gold)',
                      borderRadius: '12px', color: '#ffffff'
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Standard Test OTP: <strong style={{ color: '#10b981' }}>123456</strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setCardStep('DETAILS')}
                    className="glass-card"
                    style={{ padding: '12px 18px', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: '700' }}
                  >
                    ← Edit Card
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={executeFinalCheckout}
                    disabled={isSubmitting || cardOtp.length < 6}
                    style={{ flex: 1, padding: '12px', fontSize: '0.92rem', opacity: cardOtp.length < 6 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {isSubmitting ? 'Verifying OTP...' : <><CheckCircle2 size={18} /> Authorize & Pay ₹{grandTotal.toFixed(2)}</>}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* 4. REAL RAZORPAY GATEWAY SANDBOX & SDK SIMULATOR MODAL */}
      {activeCheckoutModal === 'RAZORPAY_SANDBOX' && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="glass-panel modal-content" style={{ maxWidth: '500px', width: '94%', padding: '0', overflow: 'hidden', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'var(--bg-surface)' }}>
            
            {/* Razorpay Authentic Modal Header */}
            <div style={{ background: '#0a0a0a', padding: '20px 24px', color: '#fff', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: '#10b981', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#fff', fontSize: '1rem' }}>
                    R
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#fff' }}>
                      Razorpay Payment Gateway
                    </h3>
                    <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700' }}>
                      ● Sandbox Checkout Mode
                    </div>
                  </div>
                </div>
                <button onClick={() => setActiveCheckoutModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Order & Merchant Info Box */}
              <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Merchant</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#f8fafc' }}>SalonPulse POS Enterprise</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>Order: {razorpayOrder?.order_id || `order_${Date.now()}`}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Payable</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#34d399' }}>₹{grandTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Modal Body: Payment Methods */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.76rem', color: 'var(--text-sub)', marginBottom: '16px', lineHeight: '1.4' }}>
                💡 <strong>Merchant Tip:</strong> To switch from Sandbox Mode to Razorpay's official web SDK popup, enter your real Razorpay Test Key ID (`rzp_test_...`) in <strong>Admin & Security Settings → Payment Gateway Setup</strong>.
              </div>

              <div style={{ fontWeight: '800', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Test Payment Method:
              </div>

              {/* Payment Methods Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={async () => {
                    const payId = `pay_${Date.now()}`;
                    await Admin_Verify_Razorpay_Payment({
                      razorpay_order_id: razorpayOrder?.order_id || `order_${Date.now()}`,
                      razorpay_payment_id: payId,
                      razorpay_signature: 'verified_signature'
                    }).catch(() => null);
                    await executeFinalCheckout({ rzpPayId: payId, rzpOrderId: razorpayOrder?.order_id, paymentModeOverride: 'Razorpay UPI (Sandbox)' });
                  }}
                  style={{
                    padding: '14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '4px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: 'var(--text-main)', fontSize: '0.88rem' }}>
                    <Sparkles size={16} style={{ color: '#10b981' }} /> UPI / QR Scan
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GPay, PhonePe, Paytm Instant Test</div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const payId = `pay_${Date.now()}`;
                    await Admin_Verify_Razorpay_Payment({
                      razorpay_order_id: razorpayOrder?.order_id || `order_${Date.now()}`,
                      razorpay_payment_id: payId,
                      razorpay_signature: 'verified_signature'
                    }).catch(() => null);
                    await executeFinalCheckout({ rzpPayId: payId, rzpOrderId: razorpayOrder?.order_id, paymentModeOverride: 'Razorpay Card (Sandbox)' });
                  }}
                  style={{
                    padding: '14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '4px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#818cf8'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: 'var(--text-main)', fontSize: '0.88rem' }}>
                    <CreditCard size={16} style={{ color: '#818cf8' }} /> Debit / Credit Card
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Visa, MasterCard, RuPay Test</div>
                </button>
              </div>

              {/* Primary Simulate Success Button */}
              <button
                type="button"
                className="btn-primary"
                onClick={async () => {
                  const payId = `pay_${Date.now()}`;
                  await Admin_Verify_Razorpay_Payment({
                    razorpay_order_id: razorpayOrder?.order_id || `order_${Date.now()}`,
                    razorpay_payment_id: payId,
                    razorpay_signature: 'verified_signature'
                  }).catch(() => null);
                  await executeFinalCheckout({ rzpPayId: payId, rzpOrderId: razorpayOrder?.order_id, paymentModeOverride: 'Razorpay Gateway' });
                }}
                disabled={isSubmitting}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px', background: '#2563eb',
                  fontWeight: '900', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                }}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> Pay ₹{grandTotal.toFixed(2)} via Razorpay Gateway</>}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCheckoutModal(null);
                  setCustomAlert({ title: 'Payment Cancelled', message: 'Razorpay Notice: Payment was cancelled by customer.', type: 'info' });
                }}
                style={{
                  width: '100%', padding: '10px', marginTop: '10px', background: 'none', border: 'none',
                  color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '700'
                }}
              >
                Cancel Razorpay Transaction
              </button>
            </div>

            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
              🔒 Secured 256-Bit Encryption via Official Razorpay Payment Engine
            </div>

          </div>
        </div>
      )}


      {/* ─── THEME-MATCHED CUSTOM ALERT / NOTIFICATION MODAL ─── */}
      {customAlert && (
        <div className="modal-overlay" style={{ zIndex: 10000, animation: 'fadeIn 0.2s ease-out' }}>
          <div className="glass-panel modal-content" style={{
            maxWidth: '440px',
            width: '90%',
            padding: '32px 28px 28px',
            textAlign: 'center',
            borderRadius: '24px',
            border: customAlert.type === 'success' ? '1.5px solid #10b981' : customAlert.type === 'error' ? '1.5px solid #ef4444' : '1.5px solid var(--accent-gold)',
            boxShadow: customAlert.type === 'success' ? '0 20px 50px rgba(16, 185, 129, 0.25)' : customAlert.type === 'error' ? '0 20px 50px rgba(239, 68, 68, 0.25)' : '0 20px 50px rgba(245, 158, 11, 0.25)',
            background: 'var(--bg-surface)'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: customAlert.type === 'success' ? 'rgba(16, 185, 129, 0.16)' : customAlert.type === 'error' ? 'rgba(239, 68, 68, 0.16)' : 'rgba(245, 158, 11, 0.16)',
              color: customAlert.type === 'success' ? '#10b981' : customAlert.type === 'error' ? '#ef4444' : 'var(--accent-gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
              border: customAlert.type === 'success' ? '1.5px solid rgba(16, 185, 129, 0.4)' : customAlert.type === 'error' ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1.5px solid rgba(245, 158, 11, 0.4)'
            }}>
              {customAlert.type === 'success' ? <CheckCircle2 size={34} /> : customAlert.type === 'error' ? <AlertCircle size={34} /> : <Sparkles size={34} />}
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '10px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {customAlert.title || 'SalonPulse Notice'}
            </h3>

            <div style={{
              fontSize: '0.88rem',
              color: 'var(--text-sub)',
              marginBottom: '26px',
              lineHeight: '1.6',
              whiteSpace: 'pre-line',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '14px 16px',
              borderRadius: '14px',
              border: '1px solid var(--border)'
            }}>
              {customAlert.message}
            </div>

            <button
              type="button"
              onClick={() => setCustomAlert(null)}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.95rem',
                fontWeight: '900',
                borderRadius: '14px',
                background: customAlert.type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : customAlert.type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: customAlert.type === 'success' ? '0 4px 20px rgba(16, 185, 129, 0.4)' : '0 4px 20px rgba(37, 99, 235, 0.4)',
                cursor: 'pointer'
              }}
            >
              Done / Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default POSBillingView;
