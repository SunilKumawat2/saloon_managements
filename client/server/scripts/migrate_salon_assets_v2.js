import { pool } from '../config/db.js';

async function migrateSalonAssetsV2() {
  try {
    console.log('🚀 Running salon_assets V2 schema migration for complete rental, loan & expiry tracking...');

    await pool.query(`
      ALTER TABLE salon_assets
      ADD COLUMN IF NOT EXISTS asset_type VARCHAR(50) DEFAULT 'Owned',
      ADD COLUMN IF NOT EXISTS rental_mode VARCHAR(50) DEFAULT 'Free',
      ADD COLUMN IF NOT EXISTS daily_rent_rate NUMERIC(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS issue_date VARCHAR(50),
      ADD COLUMN IF NOT EXISTS return_due_date VARCHAR(50),
      ADD COLUMN IF NOT EXISTS vendor_party_name VARCHAR(255);
    `);

    console.log('✅ Added asset_type, rental_mode, daily_rent_rate, issue_date, return_due_date, vendor_party_name columns.');

    // Fetch branches for updating sample data
    const bRes = await pool.query('SELECT id FROM branches').catch(() => ({ rows: [] }));
    const bIds = (bRes.rows || []).map(b => b.id);
    const b1 = bIds[0] || null;
    const b2 = bIds[1] || b1;

    // Update existing assets with realistic demo rental / lease / warranty data
    await pool.query(`
      UPDATE salon_assets 
      SET 
        asset_type = 'Owned',
        rental_mode = 'Free',
        daily_rent_rate = 0,
        issue_date = '2025-01-01',
        return_due_date = warranty_expiry
      WHERE asset_type IS NULL OR asset_type = 'Owned';
    `);

    // Insert rich demo tracking records if few records exist
    const countRes = await pool.query('SELECT COUNT(*) FROM salon_assets');
    if (parseInt(countRes.rows[0].count) < 6) {
      console.log('📦 Seeding sample Rented, Expiring Soon, and Loaned Assets...');
      await pool.query(`
        INSERT INTO salon_assets (
          asset_name, asset_code, category, branch_id, assigned_person_name,
          purchase_date, purchase_cost, warranty_expiry, condition_status, location_room,
          asset_type, rental_mode, daily_rent_rate, issue_date, return_due_date, vendor_party_name, notes
        ) VALUES 
        (
          'Laser Hair Removal Pro Machine (Leased In)', 'AST-LSR-006', 'Beauty & Spa Tools', $1, 'Dr. Ananya Spa Tech',
          '2026-01-15', 120000.00, '2026-10-30', 'Operational', 'Laser Room B',
          'Rented In', 'Daily Rent', 350.00, '2026-09-01', '2026-10-30', 'MediEquip Suppliers Pvt Ltd', 'Rented daily for peak season IPL laser treatments.'
        ),
        (
          'Portable Ring Light & Vlogging Rig (Lent Out)', 'AST-RING-007', 'IT & Electronics', $2, 'Influencer Agency Co',
          '2025-08-10', 8500.00, '2026-10-15', 'Operational', 'On Location Shoot',
          'Rented Out', 'Daily Rent', 150.00, '2026-10-01', '2026-10-15', 'Glamour Events Media', 'Lent out on daily rent for outdoor bridal shoot.'
        ),
        (
          'HydraFacial Skin Rejuvenation System (Free Loan)', 'AST-FACIAL-008', 'Beauty & Spa Tools', $1, 'Salon Manager Priya',
          '2025-05-20', 85000.00, '2026-10-25', 'Operational', 'Facial Suite 1',
          'Free Loan In', 'Free', 0.00, '2026-09-15', '2026-10-25', 'L-Oreal Demo Partner', 'Provided free demo appliance for 40 days trial period.'
        )
      `, [b1, b2]);
    }

    console.log('🎉 Salon Assets V2 Migration successfully completed!');
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    await pool.end();
  }
}

migrateSalonAssetsV2();
