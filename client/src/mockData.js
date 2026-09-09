// Mock seed data for offline / Vercel cloud deployment fallback

const todayStr = (() => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
})();

export const MOCK_USERS = [
  { id: 1, branch_id: 1, role_id: 1, name: 'Sunil Kumar (Admin)', email: 'admin@saloon.com', phone: '9876543210', role: 'Admin', branch_name: 'Connaught Place Main Salon' },
  { id: 2, branch_id: 1, role_id: 2, name: 'Rohan Verma (Manager)', email: 'rohan.manager@saloon.com', phone: '9876543211', role: 'Manager', branch_name: 'Connaught Place Main Salon' },
  { id: 3, branch_id: 1, role_id: 3, name: 'Priya Sharma (Receptionist)', email: 'priya.reception@saloon.com', phone: '9876543212', role: 'Receptionist', branch_name: 'Connaught Place Main Salon' },
  { id: 4, branch_id: 2, role_id: 4, name: 'Amit Singh (Senior Stylist)', email: 'amit.stylist@saloon.com', phone: '9876543213', role: 'Staff', branch_name: 'Cyber Hub Luxury Branch' }
];

export const MOCK_BRANCHES = [
  { id: 1, name: 'Connaught Place Main Salon', code: 'CP-001', city: 'New Delhi', address: 'Block A, Inner Circle, Connaught Place', phone: '011-23456789', is_active: true },
  { id: 2, name: 'Cyber Hub Luxury Branch', code: 'CH-002', city: 'Gurugram', address: 'Building 10, DLF Cyber City', phone: '0124-9876543', is_active: true }
];

export const MOCK_ROLES = [
  { id: 1, name: 'Admin', description: 'Super Administrator with full system control', permissions: ["all", "manage_users", "manage_branches", "manage_finances", "manage_services", "manage_inventory"] },
  { id: 2, name: 'Manager', description: 'Branch Operational Manager', permissions: ["manage_branch_users", "manage_appointments", "manage_services", "manage_inventory", "view_reports"] },
  { id: 3, name: 'Receptionist', description: 'Front Desk & Billing Handler', permissions: ["manage_appointments", "manage_billing", "view_customers"] },
  { id: 4, name: 'Staff', description: 'Stylist / Hair Artist', permissions: ["view_assigned_appointments", "view_schedule"] },
  { id: 5, name: 'Customer', description: 'Client Portal User', permissions: ["book_appointments", "view_history"] }
];

export const MOCK_CATEGORIES = [
  { id: 1, name: 'Hair', description: 'Haircuts, styling, and hair treatments' },
  { id: 2, name: 'Beard', description: 'Beard shaping, trimming, and grooming' },
  { id: 3, name: 'Facial', description: 'Skin care, facials, and clean-up treatments' },
  { id: 4, name: 'Hair Spa', description: 'Deep conditioning hair spa and treatments' },
  { id: 5, name: 'Color', description: 'Hair coloring, highlights, and touch-ups' },
  { id: 6, name: 'Packages & Combos', description: 'Bundled special discount combos' }
];

export const MOCK_SERVICES = [
  { id: 1, name: 'Classic Haircut & Styling', category: 'Hair', description: 'Professional haircut, wash & blow dry styling', price: 350.00, duration_minutes: 30, buffer_time_minutes: 15, commission_rate: 12.00, is_active: true },
  { id: 2, name: 'Beard Shaping & Hot Towel Spa', category: 'Beard', description: 'Precision beard shaping and hot towel steam treatment', price: 200.00, duration_minutes: 20, buffer_time_minutes: 10, commission_rate: 10.00, is_active: true },
  { id: 3, name: 'Royal Gold Facial & Clean-up', category: 'Facial', description: 'Deep skin cleansing, herbal scrub, and gold mask treatment', price: 1200.00, duration_minutes: 45, buffer_time_minutes: 15, commission_rate: 15.00, is_active: true },
  { id: 4, name: 'Keratin Hair Smoothing Treatment', category: 'Hair Spa', description: 'Premium hair keratin smoothing & scalp massage', price: 3500.00, duration_minutes: 90, buffer_time_minutes: 20, commission_rate: 20.00, is_active: true },
  { id: 5, name: 'Organic Hair Coloring & Glossing', category: 'Color', description: 'Ammonia-free hair color application & deep gloss shine', price: 1800.00, duration_minutes: 60, buffer_time_minutes: 15, commission_rate: 15.00, is_active: true },
  { id: 6, name: 'Detox Scalp Spa & Massage', category: 'Hair Spa', description: 'Deep anti-dandruff oil massage & steam relaxation', price: 850.00, duration_minutes: 40, buffer_time_minutes: 10, commission_rate: 10.00, is_active: true }
];

export const MOCK_PACKAGES = [
  {
    id: 1,
    name: 'Groom Gentleman Combo Package',
    category: 'Combo Package',
    description: 'Complete grooming bundle: Haircut, Beard Spa, and Gold Facial Clean-up.',
    package_price: 1450.00,
    standalone_price: 1750.00,
    discount_percentage: 17.14,
    validity_days: 30,
    is_active: true,
    service_ids: [1, 2, 3]
  },
  {
    id: 2,
    name: 'Bridal Glow & Hair Transformation',
    category: 'Bridal Package',
    description: 'Luxury hair smoothing and herbal gold facial for special occasions.',
    package_price: 4100.00,
    standalone_price: 4700.00,
    discount_percentage: 12.76,
    validity_days: 60,
    is_active: true,
    service_ids: [3, 4]
  },
  {
    id: 3,
    name: 'Weekend Refresh Spa Bundle',
    category: 'Spa Bundle',
    description: 'Relaxing detox scalp spa combined with classic styling.',
    package_price: 999.00,
    standalone_price: 1200.00,
    discount_percentage: 16.75,
    validity_days: 30,
    is_active: true,
    service_ids: [1, 6]
  }
];

export const MOCK_STYLISTS = [
  { id: 1, branch_id: 1, name: 'Rohan Sharma', phone: '9876543210', specialization: 'Senior Stylist & Hair Specialist', rating: 4.90 },
  { id: 2, branch_id: 1, name: 'Amit Verma', phone: '9876543211', specialization: 'Beard & Facial Expert', rating: 4.80 },
  { id: 3, branch_id: 2, name: 'Priya Singh', phone: '9876543212', specialization: 'Hair Color & Beauty Consultant', rating: 5.00 }
];

export const MOCK_CUSTOMERS = [
  { id: 1, branch_id: 1, name: 'Rahul Kumar', phone: '9988776655', email: 'rahul.k@gmail.com', gender: 'Male', dob: '1995-08-14', loyalty_points: 120, notes: 'Prefers Rohan Sharma for haircut' },
  { id: 2, branch_id: 1, name: 'Sneha Kapoor', phone: '9988776656', email: 'sneha.k@outlook.com', gender: 'Female', dob: '1998-11-20', loyalty_points: 250, notes: 'Regular facial client, sensitive skin' },
  { id: 3, branch_id: 2, name: 'Karan Johar', phone: '9988776657', email: 'karan@media.com', gender: 'Male', dob: '1990-03-08', loyalty_points: 80, notes: 'Prefers weekend morning slots' },
  { id: 4, branch_id: 1, name: 'Sunil', phone: '8574857485', email: 'N/A', gender: 'Unspecified', dob: 'N/A', loyalty_points: 50, notes: 'Walk-in Guest' }
];

export const MOCK_LEADS = [
  { id: 1, branch_id: 1, name: 'Ananya Panday', phone: '9811223344', email: 'ananya@gmail.com', source: 'Instagram Ads', status: 'New', notes: 'Inquired about Keratin Hair Treatment', followup_date: todayStr },
  { id: 2, branch_id: 1, name: 'Varun Dhawan', phone: '9811223345', email: 'varun@gmail.com', source: 'Walk-in', status: 'Contacted', notes: 'Scheduled call back for bridal package', followup_date: todayStr },
  { id: 3, branch_id: 2, name: 'Kiara Advani', phone: '9811223346', email: 'kiara@gmail.com', source: 'Website Portal', status: 'Converted', notes: 'Booked Gold Facial appointment', followup_date: todayStr }
];

export const MOCK_APPOINTMENTS = [
  { 
    id: 101, 
    branch_id: 1, 
    customer_id: 1, 
    stylist_id: 1, 
    service_id: 1, 
    appointment_date: todayStr, 
    appointment_time: '14:00', 
    status: 'Scheduled', 
    total_amount: 350.00, 
    notes: 'Classic Haircut slot', 
    customer_name: 'Rahul Kumar', 
    customer_phone: '9988776655', 
    service_name: 'Classic Haircut & Styling', 
    service_duration: 30, 
    stylist_name: 'Rohan Sharma' 
  },
  { 
    id: 102, 
    branch_id: 1, 
    customer_id: 2, 
    stylist_id: 1, 
    service_id: 3, 
    appointment_date: todayStr, 
    appointment_time: '11:00', 
    status: 'In-Progress', 
    total_amount: 1200.00, 
    notes: 'Royal Gold Facial', 
    customer_name: 'Sneha Kapoor', 
    customer_phone: '9988776656', 
    service_name: 'Royal Gold Facial & Clean-up', 
    service_duration: 45, 
    stylist_name: 'Rohan Sharma' 
  },
  { 
    id: 103, 
    branch_id: 1, 
    customer_id: 4, 
    stylist_id: 2, 
    service_id: 1, 
    appointment_date: todayStr, 
    appointment_time: '16:00', 
    status: 'Scheduled', 
    total_amount: 350.00, 
    notes: 'Walk-in haircut appointment', 
    customer_name: 'Sunil', 
    customer_phone: '8574857485', 
    service_name: 'Classic Haircut & Styling', 
    service_duration: 30, 
    stylist_name: 'Amit Verma' 
  }
];

export const MOCK_BILLS = [
  { 
    id: 1001, 
    branch_id: 1, 
    customer_id: 2, 
    stylist_id: 1, 
    customer_name: 'Sneha Kapoor', 
    stylist_name: 'Rohan Sharma', 
    subtotal: 1200.00, 
    tax_amount: 216.00, 
    total: 1416.00, 
    payment_mode: 'UPI', 
    status: 'Paid', 
    created_at: new Date().toISOString(), 
    items: [{ id: 1, service_name: 'Royal Gold Facial & Clean-up', price: 1200.00, qty: 1 }] 
  }
];
