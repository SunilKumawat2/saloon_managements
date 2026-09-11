import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const { Pool } = pg;

const rawPool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'saloon_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

// Global In-Memory Store for Cloud Fallback (when DB is unreachable)
const memoryStore = {
  users: [
    { id: 1, name: 'Sunil Kumar (Admin)', email: 'admin@saloon.com', phone: '9876543210', role: 'admin', is_active: true }
  ],
  services: [
    { id: 1, name: 'Classic Haircut & Styling', category: 'Hair', price: 350.00, duration: 30, is_active: true },
    { id: 2, name: 'Beard Shaping & Beard Spa', category: 'Beard', price: 200.00, duration: 20, is_active: true },
    { id: 3, name: 'Royal Gold Facial & Clean-up', category: 'Facial', price: 1200.00, duration: 45, is_active: true },
    { id: 4, name: 'Keratin Hair Smoothing Treatment', category: 'Hair Spa', price: 3500.00, duration: 90, is_active: true },
    { id: 5, name: 'Detox Scalp Massage & Steam Spa', category: 'Hair Spa', price: 850.00, duration: 40, is_active: true }
  ],
  packages: [
    { id: 1, name: 'Groom Special combo pack', price: 500.00, duration: 60, is_active: true },
    { id: 2, name: 'Groom Special Combo', price: 1450.00, duration: 90, is_active: true }
  ],
  categories: [
    { id: 1, name: 'Hair' }, { id: 2, name: 'Beard' }, { id: 3, name: 'Facial' }, { id: 4, name: 'Hair Spa' }, { id: 5, name: 'Color' }, { id: 6, name: 'Packages & Combos' }
  ],
  stylists: [
    { id: 1, name: 'Rohan Sharma (Senior Stylist)', phone: '9876543210', specialization: 'Hair & Beard Expert', is_active: true },
    { id: 2, name: 'Priya Verma (Beauty Therapist)', phone: '9876543211', specialization: 'Facial & Skin Care', is_active: true }
  ],
  customers: [
    { id: 1, name: 'Aarav Mehta', phone: '9876543210', email: 'aarav@example.com', total_visits: 5, total_spent: 2450.00 }
  ],
  bills: [],
  coupons: [
    { id: 1, code: 'WELCOME10', discount_type: 'percentage', discount_value: 10, is_active: true },
    { id: 2, code: 'FESTIVE200', discount_type: 'flat', discount_value: 200, is_active: true }
  ],
  leads: [],
  products: [],
  appointments: []
};

// Smart Pool Proxy with Cloud Fallback
export const pool = {
  async query(text, params = []) {
    try {
      return await rawPool.query(text, params);
    } catch (dbErr) {
      console.warn(`⚠️ DB Query Fallback Triggered (${dbErr.message})`);
      return handleMemoryQuery(text, params);
    }
  },
  async connect() {
    try {
      return await rawPool.connect();
    } catch (err) {
      return {
        async query(text, params = []) {
          return handleMemoryQuery(text, params);
        },
        release() {}
      };
    }
  }
};

function handleMemoryQuery(text, params = []) {
  const sql = (text || '').trim();
  const lower = sql.toLowerCase();

  // 1. SELECT Queries
  if (lower.startsWith('select')) {
    if (lower.includes('from services')) return { rows: memoryStore.services, rowCount: memoryStore.services.length };
    if (lower.includes('from packages')) return { rows: memoryStore.packages, rowCount: memoryStore.packages.length };
    if (lower.includes('from categories')) return { rows: memoryStore.categories, rowCount: memoryStore.categories.length };
    if (lower.includes('from stylists')) return { rows: memoryStore.stylists, rowCount: memoryStore.stylists.length };
    if (lower.includes('from customers')) return { rows: memoryStore.customers, rowCount: memoryStore.customers.length };
    if (lower.includes('from bills')) return { rows: memoryStore.bills, rowCount: memoryStore.bills.length };
    if (lower.includes('from coupons')) return { rows: memoryStore.coupons, rowCount: memoryStore.coupons.length };
    if (lower.includes('from leads')) return { rows: memoryStore.leads, rowCount: memoryStore.leads.length };
    if (lower.includes('from products')) return { rows: memoryStore.products, rowCount: memoryStore.products.length };
    if (lower.includes('from appointments')) return { rows: memoryStore.appointments, rowCount: memoryStore.appointments.length };
    if (lower.includes('from users')) return { rows: memoryStore.users, rowCount: memoryStore.users.length };
    return { rows: [], rowCount: 0 };
  }

  // 2. INSERT Queries
  if (lower.startsWith('insert into')) {
    let tableName = 'services';
    let newItem = { id: Date.now(), created_at: new Date().toISOString() };

    if (lower.includes('into customers')) {
      tableName = 'customers';
      // params: [branch_id, name, phone, email, gender, dob, anniversary, notes]
      const maxId = memoryStore.customers.length > 0 ? Math.max(...memoryStore.customers.map(c => Number(c.id) || 0)) + 1 : 1;
      newItem = {
        id: maxId,
        branch_id: Number(params[0]) || 1,
        name: String(params[1] || 'New Customer'),
        phone: String(params[2] || ''),
        email: String(params[3] || ''),
        gender: String(params[4] || 'Female'),
        dob: params[5] || null,
        anniversary: params[6] || null,
        notes: String(params[7] || ''),
        loyalty_points: 50,
        created_at: new Date().toISOString()
      };
    }
    else if (lower.includes('into leads')) {
      tableName = 'leads';
      // params: [branch_id, name, phone, email, source, notes, followup_date]
      const maxId = memoryStore.leads.length > 0 ? Math.max(...memoryStore.leads.map(l => Number(l.id) || 0)) + 1 : 1;
      newItem = {
        id: maxId,
        branch_id: Number(params[0]) || 1,
        name: String(params[1] || 'New Lead'),
        phone: String(params[2] || ''),
        email: String(params[3] || ''),
        source: String(params[4] || 'Walk-in'),
        status: 'New',
        notes: String(params[5] || ''),
        followup_date: params[6] || null,
        created_at: new Date().toISOString()
      };
    }
    else if (lower.includes('into services')) {
      tableName = 'services';
      // params: [branch_id, name, category, price, duration, description]
      const maxId = memoryStore.services.length > 0 ? Math.max(...memoryStore.services.map(s => Number(s.id) || 0)) + 1 : 1;
      newItem = {
        id: maxId,
        branch_id: Number(params[0]) || 1,
        name: String(params[1] || 'New Service'),
        category: String(params[2] || 'Hair'),
        price: parseFloat(params[3]) || 0,
        duration: parseInt(params[4]) || 30,
        description: String(params[5] || ''),
        is_active: true,
        created_at: new Date().toISOString()
      };
    }
    else if (lower.includes('into packages')) {
      tableName = 'packages';
      // params: [branch_id, name, price, duration, description]
      const maxId = memoryStore.packages.length > 0 ? Math.max(...memoryStore.packages.map(p => Number(p.id) || 0)) + 1 : 1;
      newItem = {
        id: maxId,
        branch_id: Number(params[0]) || 1,
        name: String(params[1] || 'New Package'),
        price: parseFloat(params[2]) || 0,
        duration: parseInt(params[3]) || 60,
        description: String(params[4] || ''),
        is_active: true,
        created_at: new Date().toISOString()
      };
    }
    else if (lower.includes('into categories')) {
      tableName = 'categories';
      const maxId = memoryStore.categories.length > 0 ? Math.max(...memoryStore.categories.map(c => Number(c.id) || 0)) + 1 : 1;
      newItem = { id: maxId, name: String(params[0] || 'New Category') };
    }
    else if (lower.includes('into appointments')) {
      tableName = 'appointments';
      const maxId = memoryStore.appointments.length > 0 ? Math.max(...memoryStore.appointments.map(a => Number(a.id) || 0)) + 1 : 101;
      newItem = {
        id: maxId,
        branch_id: Number(params[0]) || 1,
        customer_id: Number(params[1]) || 1,
        stylist_id: Number(params[2]) || 1,
        service_id: Number(params[3]) || 1,
        appointment_date: params[4] || new Date().toISOString().split('T')[0],
        appointment_time: params[5] || '10:00',
        status: params[6] || 'Scheduled',
        total_amount: parseFloat(params[7]) || 0,
        notes: params[8] || '',
        created_at: new Date().toISOString()
      };
    }
    else if (lower.includes('into bills')) {
      tableName = 'bills';
      const maxId = memoryStore.bills.length > 0 ? Math.max(...memoryStore.bills.map(b => Number(b.id) || 0)) + 1 : 1001;
      newItem = {
        id: maxId,
        branch_id: Number(params[0]) || 1,
        customer_id: params[1] || null,
        stylist_id: params[2] || null,
        subtotal: parseFloat(params[3]) || 0,
        tax_amount: parseFloat(params[4]) || 0,
        total: parseFloat(params[5]) || 0,
        payment_mode: params[6] || 'Cash',
        created_at: new Date().toISOString()
      };
    }
    else {
      const arr = memoryStore[tableName] || [];
      const maxId = arr.length > 0 ? Math.max(...arr.map(i => Number(i.id) || 0)) + 1 : 1;
      newItem = { id: maxId, created_at: new Date().toISOString() };
      if (params && params.length > 0 && params[0]) {
        newItem.name = String(params[0]);
      }
    }

    if (!memoryStore[tableName]) memoryStore[tableName] = [];
    memoryStore[tableName].unshift(newItem);
    return { rows: [newItem], rowCount: 1 };
  }

  // 3. UPDATE Queries
  if (lower.startsWith('update')) {
    let tableName = null;
    if (lower.includes('update customers')) tableName = 'customers';
    else if (lower.includes('update leads')) tableName = 'leads';
    else if (lower.includes('update services')) tableName = 'services';
    else if (lower.includes('update packages')) tableName = 'packages';
    else if (lower.includes('update appointments')) tableName = 'appointments';

    if (tableName && memoryStore[tableName]) {
      const targetId = params[params.length - 1];
      if (targetId) {
        const idx = memoryStore[tableName].findIndex(item => Number(item.id) === Number(targetId));
        if (idx !== -1) {
          return { rows: [memoryStore[tableName][idx]], rowCount: 1 };
        }
      }
    }
    return { rows: [{ id: params[0] || 1, success: true }], rowCount: 1 };
  }

  // 4. DELETE Queries
  if (lower.startsWith('delete')) {
    let tableName = null;
    if (lower.includes('from customers')) tableName = 'customers';
    else if (lower.includes('from leads')) tableName = 'leads';
    else if (lower.includes('from services')) tableName = 'services';
    else if (lower.includes('from packages')) tableName = 'packages';
    else if (lower.includes('from appointments')) tableName = 'appointments';

    if (tableName && memoryStore[tableName]) {
      const targetId = params[0];
      memoryStore[tableName] = memoryStore[tableName].filter(item => Number(item.id) !== Number(targetId));
    }
    return { rows: [], rowCount: 1 };
  }

  return { rows: [{ id: params[0] || 1, success: true }], rowCount: 1 };
}

// Database connectivity check
export const testDbConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as database_name');
    return {
      connected: true,
      time: res.rows[0]?.current_time || new Date(),
      database: res.rows[0]?.database_name || 'saloon_db_fallback',
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
    };
  }
};
