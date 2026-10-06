import { pool } from '../config/db.js';

async function migrateSalonAssets() {
  try {
    console.log('🚀 Running salon_assets schema migration...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS salon_assets (
        id SERIAL PRIMARY KEY,
        asset_name VARCHAR(255) NOT NULL,
        asset_code VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(100) DEFAULT 'General Equipment',
        branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
        assigned_to_admin_id INT REFERENCES users(id) ON DELETE SET NULL,
        assigned_person_name VARCHAR(150),
        purchase_date VARCHAR(50),
        purchase_cost NUMERIC(12, 2) DEFAULT 0.00,
        warranty_expiry VARCHAR(50),
        condition_status VARCHAR(50) DEFAULT 'Operational',
        location_room VARCHAR(150) DEFAULT 'Main Salon Floor',
        notes TEXT,
        admin_id INT,
        created_by_admin_id INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ salon_assets table created or already exists.');

    // Fetch active branches
    const bRes = await pool.query('SELECT id, name FROM branches').catch(() => ({ rows: [] }));
    const branchList = bRes.rows || [];
    const firstB = branchList[0]?.id || null;
    const secondB = branchList[1]?.id || firstB;

    // Check count
    const { rows } = await pool.query('SELECT COUNT(*) FROM salon_assets');
    if (parseInt(rows[0].count) === 0) {
      console.log('📦 Seeding initial salon assets...');
      
      const seedAssets = [
        {
          asset_name: 'Dyson Supersonic Professional Hair Dryer',
          asset_code: 'AST-DYSON-001',
          category: 'Styling Equipment',
          branch_id: firstB,
          assigned_person_name: 'Lead Stylist Rahul',
          purchase_date: '2025-06-15',
          purchase_cost: 34990.00,
          warranty_expiry: '2027-06-15',
          condition_status: 'Operational',
          location_room: 'Styling Station 1'
        },
        {
          asset_name: 'Takara Belmont Hydraulic Styling Chair',
          asset_code: 'AST-CHAIR-002',
          category: 'Salon Furniture',
          branch_id: firstB,
          assigned_person_name: 'Second Admin',
          purchase_date: '2025-01-10',
          purchase_cost: 48000.00,
          warranty_expiry: '2028-01-10',
          condition_status: 'Operational',
          location_room: 'Station A'
        },
        {
          asset_name: 'L-Oreal Steamer & Hair Treatment Appliance',
          asset_code: 'AST-STMR-003',
          category: 'Electrical Appliances',
          branch_id: secondB,
          assigned_person_name: 'Branch Manager Priya',
          purchase_date: '2025-03-20',
          purchase_cost: 22500.00,
          warranty_expiry: '2026-03-20',
          condition_status: 'Needs Maintenance',
          location_room: 'Spa & Treatment Room'
        },
        {
          asset_name: 'Epson POS Thermal Receipt Printer & Cash Drawer',
          asset_code: 'AST-POS-004',
          category: 'IT & Electronics',
          branch_id: firstB,
          assigned_person_name: 'Front Desk Receptionist',
          purchase_date: '2025-04-05',
          purchase_cost: 18500.00,
          warranty_expiry: '2027-04-05',
          condition_status: 'Operational',
          location_room: 'Reception Counter'
        },
        {
          asset_name: 'Daikin 2.0 Ton Inverter AC Unit',
          asset_code: 'AST-AC-005',
          category: 'Electrical Appliances',
          branch_id: secondB,
          assigned_person_name: 'Branch Manager Priya',
          purchase_date: '2024-11-12',
          purchase_cost: 55000.00,
          warranty_expiry: '2029-11-12',
          condition_status: 'Operational',
          location_room: 'Main Salon Floor'
        }
      ];

      for (const item of seedAssets) {
        await pool.query(`
          INSERT INTO salon_assets 
          (asset_name, asset_code, category, branch_id, assigned_person_name, purchase_date, purchase_cost, warranty_expiry, condition_status, location_room)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (asset_code) DO NOTHING
        `, [
          item.asset_name, item.asset_code, item.category, item.branch_id,
          item.assigned_person_name, item.purchase_date, item.purchase_cost,
          item.warranty_expiry, item.condition_status, item.location_room
        ]).catch((e) => console.error('Seed error:', e.message));
      }
      console.log('✅ Seeded initial demo salon assets!');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
    process.exit(1);
  }
}

migrateSalonAssets();
