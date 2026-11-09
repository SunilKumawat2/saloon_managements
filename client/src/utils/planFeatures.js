// Centralized SaaS Plan Features and Access Control Helper

export const AVAILABLE_SYSTEM_FEATURES = [
  { id: 'pos', name: 'Fast POS Counter Billing & Thermal Receipts', desc: 'Real-time billing, walk-in checkout, barcode scanning' },
  { id: 'appointments', name: 'Appointments Calendar & Slot Booking', desc: 'Calendar timeline, staff assignment, multi-slot booking' },
  { id: 'crm', name: 'Customer CRM & Member Registry', desc: 'Customer histories, visits, notes, VIP tags' },
  { id: 'packages', name: 'Service Packages & Combos', desc: 'Bundled services, prepaid packages, combo deals' },
  { id: 'inventory', name: 'Inventory & Product Stock Management', desc: 'Stock alerts, supplier orders, consumption tracking' },
  { id: 'attendance', name: 'Staff Attendance & Live Availability', desc: 'Check-in/out, live status, shift scheduling' },
  { id: 'whitelabel', name: 'White Label Branding & Theme Palettes', desc: 'Custom salon logo, brand color accents, receipt notes' },
  { id: 'loyalty', name: 'Loyalty Points & Membership Club', desc: 'Tier cards, wallet cashback, discount points' },
  { id: 'marketing', name: 'Marketing Automation & WhatsApp/SMS', desc: 'Automated festival campaigns, birthday SMS, WhatsApp receipts' },
  { id: 'assets', name: 'Salon Assets & Rental Equipment Hub', desc: 'Equipment tracking, loans, lease calculation' },
  { id: 'gateways', name: 'Online Payment Gateway (Razorpay)', desc: 'Integrated UPI, QR code, card swipe transactions' },
  { id: 'custom_domain', name: 'Custom Domain & VIP Dedicated Support', desc: 'Dedicated URL, 24/7 priority SLA support' }
];

export const isMasterAdmin = (user) => {
  if (!user) return false;
  if (user.is_super_admin === true || user.email === 'admin@saloon.com') return true;
  const role = String(user.role || user.role_name || '').toLowerCase();
  return role === 'super admin' || role === 'superadmin';
};

export const hasPlanFeature = (user, featKey) => {
  if (!user) return false;
  if (isMasterAdmin(user)) return true;
  let feats = user.plan_features;
  if (!feats) return true;
  if (typeof feats === 'string') {
    try { feats = JSON.parse(feats); } catch (e) { feats = []; }
  }
  if (!Array.isArray(feats)) return true;
  return feats.includes('all') || feats.includes(featKey);
};
