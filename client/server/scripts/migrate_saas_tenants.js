import { pool } from '../config/db.js';

async function migrateSaasTenants() {
  console.log('🚀 Starting SaaS Multi-Tenant & Data Isolation Migration...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Table: subscription_plans
    console.log('📦 Step 1: Creating subscription_plans table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        code VARCHAR(30) NOT NULL UNIQUE,
        price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 999.00,
        price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 9999.00,
        max_branches INT NOT NULL DEFAULT 1,
        max_staff INT NOT NULL DEFAULT 4,
        features JSONB DEFAULT '[]'::jsonb,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert Default SaaS Plans
    await client.query(`
      INSERT INTO subscription_plans (id, name, code, price_monthly, price_yearly, max_branches, max_staff, features, description)
      VALUES 
        (1, 'Starter', 'STARTER', 999.00, 9999.00, 1, 4, 
         '["pos", "appointments", "crm", "receipts"]'::jsonb, 
         'Ideal for single salon outlets and boutique parlours.'),
        (2, 'Growth', 'GROWTH', 2499.00, 24999.00, 3, 15, 
         '["pos", "appointments", "crm", "receipts", "inventory", "attendance", "whitelabel", "packages"]'::jsonb, 
         'Best for growing salons and multi-chair studios.'),
        (3, 'Enterprise', 'ENTERPRISE', 4999.00, 49999.00, -1, -1, 
         '["pos", "appointments", "crm", "receipts", "inventory", "attendance", "whitelabel", "packages", "marketing", "assets", "gateways", "audit_logs", "custom_domain"]'::jsonb, 
         'Unlimited branches, complete white labeling, and multi-tenant marketing automation.')
      ON CONFLICT (id) DO UPDATE 
      SET name = EXCLUDED.name,
          code = EXCLUDED.code,
          price_monthly = EXCLUDED.price_monthly,
          price_yearly = EXCLUDED.price_yearly,
          max_branches = EXCLUDED.max_branches,
          max_staff = EXCLUDED.max_staff,
          features = EXCLUDED.features,
          description = EXCLUDED.description;
    `);

    // 2. Table: tenants (Salon Organizations)
    console.log('🏢 Step 2: Creating tenants table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        owner_name VARCHAR(100) NOT NULL,
        owner_email VARCHAR(100) UNIQUE NOT NULL,
        owner_phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'Trial',
        plan_id INT REFERENCES subscription_plans(id) DEFAULT 1,
        trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
        subscription_ends_at TIMESTAMP WITH TIME ZONE,
        branding_settings JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert Default Master Tenant #1 for backward compatibility
    console.log('👑 Step 3: Seeding Default Master Tenant (Tenant #1)...');
    await client.query(`
      INSERT INTO tenants (id, name, slug, owner_name, owner_email, owner_phone, status, plan_id, trial_ends_at, subscription_ends_at)
      VALUES (
        1, 
        'Main Salon & Wellness Spa', 
        'main-salon', 
        'Sunil Kumar', 
        'admin@saloon.com', 
        '011-23456789', 
        'Active', 
        3, 
        NOW() + INTERVAL '100 years', 
        NOW() + INTERVAL '100 years'
      )
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          owner_name = EXCLUDED.owner_name,
          owner_email = EXCLUDED.owner_email,
          status = EXCLUDED.status,
          plan_id = EXCLUDED.plan_id;
    `);

    // Ensure sequences are updated so serial IDs start after 1
    await client.query(`
      SELECT setval('subscription_plans_id_seq', (SELECT GREATEST(MAX(id), 3) FROM subscription_plans));
      SELECT setval('tenants_id_seq', (SELECT GREATEST(MAX(id), 1) FROM tenants));
    `);

    // 3. Attach tenant_id to all business entities
    console.log('🔗 Step 4: Adding tenant_id column & indexes across all business tables...');
    const tablesToScope = [
      'branches',
      'users',
      'services',
      'packages',
      'service_categories',
      'stylists',
      'time_slots',
      'customers',
      'leads',
      'appointments',
      'bills',
      'coupons',
      'memberships',
      'customer_memberships',
      'products',
      'suppliers',
      'purchase_orders',
      'salon_assets',
      'staff_attendance',
      'campaigns',
      'offer_templates',
      'automated_triggers',
      'payment_gateway_settings',
      'system_settings',
      'system_audit_logs',
      'database_backups'
    ];

    for (const table of tablesToScope) {
      // Check if table exists in DB first
      const checkRes = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        );
      `, [table]);

      if (checkRes.rows[0].exists) {
        // Add column if not exists
        await client.query(`
          ALTER TABLE ${table} 
          ADD COLUMN IF NOT EXISTS tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE DEFAULT 1;
        `);

        // Backfill existing records to Tenant #1
        await client.query(`
          UPDATE ${table} 
          SET tenant_id = 1 
          WHERE tenant_id IS NULL;
        `);

        // Add index for fast tenant query lookups
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_${table}_tenant_id ON ${table} (tenant_id);
        `);

        console.log(`  ✓ Scoped table '${table}' to tenant_id = 1`);
      }
    }

    await client.query('COMMIT');
    console.log('✅ SaaS Multi-Tenant & Data Isolation Migration Successfully Finished!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrateSaasTenants();

