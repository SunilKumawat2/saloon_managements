import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { pool } from '../config/db.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'saloon_super_secret_jwt_key_2026';

// 1. Get All Salon Tenants (Super Admin lists all, Salon Admin views self)
export const getTenants = async (req, res) => {
  try {
    const isSuper = req.user?.is_super_admin === true || req.user?.email === 'admin@saloon.com';
    const currentTenantId = req.tenantId || req.user?.tenant_id || 1;

    let query = `
      SELECT t.id, t.name, t.slug, t.owner_name, t.owner_email, t.owner_phone,
             t.status, t.plan_id, t.trial_ends_at, t.subscription_ends_at,
             t.branding_settings, t.created_at,
             p.name as plan_name, p.code as plan_code, p.price_monthly, p.max_branches, p.max_staff,
             COALESCE(b_count.count, 0)::int as branch_count,
             COALESCE(u_count.count, 0)::int as staff_count,
             COALESCE(c_count.count, 0)::int as customer_count
      FROM tenants t
      LEFT JOIN subscription_plans p ON t.plan_id = p.id
      LEFT JOIN (
        SELECT tenant_id, COUNT(*) as count 
        FROM branches 
        WHERE is_active = TRUE 
        GROUP BY tenant_id
      ) b_count ON b_count.tenant_id = t.id
      LEFT JOIN (
        SELECT tenant_id, COUNT(*) as count 
        FROM users 
        WHERE is_active = TRUE 
        GROUP BY tenant_id
      ) u_count ON u_count.tenant_id = t.id
      LEFT JOIN (
        SELECT tenant_id, COUNT(*) as count 
        FROM customers 
        GROUP BY tenant_id
      ) c_count ON c_count.tenant_id = t.id
    `;

    const params = [];
    if (!isSuper) {
      query += ` WHERE t.id = $1`;
      params.push(currentTenantId);
    }

    query += ` ORDER BY t.id ASC`;

    const { rows } = await pool.query(query, params);

    // Calculate days remaining in trial or subscription
    const now = new Date();
    const enrichedRows = rows.map(t => {
      let daysRemaining = null;
      if (t.status === 'Trial' && t.trial_ends_at) {
        const diff = new Date(t.trial_ends_at) - now;
        daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      } else if (t.subscription_ends_at) {
        const diff = new Date(t.subscription_ends_at) - now;
        daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }
      return {
        ...t,
        days_remaining: daysRemaining
      };
    });

    return res.json({
      status: 'success',
      data: enrichedRows
    });
  } catch (error) {
    console.error('getTenants error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// 2. Get Single Tenant Details (with its branches & users)
export const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;
    const isSuper = req.user?.is_super_admin === true || req.user?.email === 'admin@saloon.com';
    const currentTenantId = req.tenantId || req.user?.tenant_id || 1;

    if (!isSuper && String(id) !== String(currentTenantId)) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized to view other salon organizations' });
    }

    const { rows } = await pool.query(`
      SELECT t.*, p.name as plan_name, p.code as plan_code, p.max_branches, p.max_staff
      FROM tenants t
      LEFT JOIN subscription_plans p ON t.plan_id = p.id
      WHERE t.id = $1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Tenant not found' });
    }

    const tenant = rows[0];

    // Fetch branches and staff under this tenant
    const [branchesRes, usersRes] = await Promise.all([
      pool.query('SELECT * FROM branches WHERE tenant_id = $1 ORDER BY id ASC', [id]),
      pool.query(`
        SELECT u.id, u.name, u.email, u.phone, u.role_id, r.name as role, u.is_active, u.branch_id, b.name as branch_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN branches b ON u.branch_id = b.id
        WHERE u.tenant_id = $1
        ORDER BY u.id ASC
      `, [id])
    ]);

    return res.json({
      status: 'success',
      data: {
        ...tenant,
        branches: branchesRes.rows,
        users: usersRes.rows
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// 3. Create / Onboard New Salon Tenant
export const createTenant = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      name,
      slug,
      owner_name,
      owner_email,
      owner_phone,
      plan_id = 1,
      status = 'Trial',
      password = 'password123',
      initial_branch_city = 'New Delhi'
    } = req.body;

    if (!name || !owner_name || !owner_email) {
      return res.status(400).json({ status: 'error', message: 'Salon Name, Owner Name, and Email are required' });
    }

    // Generate or clean slug
    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + '-' + Math.floor(100 + Math.random() * 900);

    // Check unique email and slug
    const existing = await client.query('SELECT id FROM tenants WHERE owner_email = $1 OR slug = $2', [owner_email, cleanSlug]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ status: 'error', message: 'A salon organization with this email or slug already exists' });
    }

    await client.query('BEGIN');

    // Step A: Insert Tenant
    const trialDays = 14;
    const tenantRes = await client.query(`
      INSERT INTO tenants (name, slug, owner_name, owner_email, owner_phone, status, plan_id, trial_ends_at, subscription_ends_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '${trialDays} days', NOW() + INTERVAL '${trialDays} days')
      RETURNING *
    `, [name, cleanSlug, owner_name, owner_email, owner_phone || '', status, plan_id]);

    const newTenant = tenantRes.rows[0];

    // Step B: Create Primary Default Branch for this Salon
    const branchCode = `${cleanSlug.substring(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '')}-B1`;
    const branchRes = await client.query(`
      INSERT INTO branches (name, code, address, city, phone, is_active, tenant_id)
      VALUES ($1, $2, $3, $4, $5, TRUE, $6)
      RETURNING id, name
    `, [`${name} (Main Outlet)`, branchCode, 'Main Commercial Complex', initial_branch_city, owner_phone || '', newTenant.id]);

    const primaryBranch = branchRes.rows[0];

    // Step C: Create Salon Owner User (Admin Role = 1)
    const userRes = await client.query(`
      INSERT INTO users (name, email, phone, password, role_id, branch_id, tenant_id, allowed_branch_ids, is_active)
      VALUES ($1, $2, $3, $4, 1, $5, $6, $7, TRUE)
      RETURNING id, name, email
    `, [
      owner_name,
      owner_email,
      owner_phone || '',
      password,
      primaryBranch.id,
      newTenant.id,
      JSON.stringify([primaryBranch.id])
    ]);

    // Step D: Seed Default Service Categories for this Tenant
    const defaultCategories = ['Hair & Styling', 'Beard & Grooming', 'Facial & Skin Care', 'Spa & Body Treatments'];
    for (const catName of defaultCategories) {
      await client.query(`
        INSERT INTO service_categories (name, description, tenant_id)
        VALUES ($1, 'Default category for salon services', $2)
        ON CONFLICT DO NOTHING
      `, [catName, newTenant.id]);
    }

    await client.query('COMMIT');

    return res.status(201).json({
      status: 'success',
      message: `Salon Organization "${name}" successfully registered!`,
      data: {
        tenant: newTenant,
        primary_branch: primaryBranch,
        owner_account: userRes.rows[0]
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('createTenant error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  } finally {
    client.release();
  }
};

// 4. Update Salon Tenant Profile
export const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const isSuper = req.user?.is_super_admin === true || req.user?.email === 'admin@saloon.com';
    const currentTenantId = req.tenantId || req.user?.tenant_id || 1;

    if (!isSuper && String(id) !== String(currentTenantId)) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized to update other salon organizations' });
    }

    const { name, owner_name, owner_email, owner_phone, plan_id, status } = req.body;

    const { rows } = await pool.query(`
      UPDATE tenants
      SET name = COALESCE($1, name),
          owner_name = COALESCE($2, owner_name),
          owner_email = COALESCE($3, owner_email),
          owner_phone = COALESCE($4, owner_phone),
          plan_id = COALESCE($5, plan_id),
          status = COALESCE($6, status)
      WHERE id = $7
      RETURNING *
    `, [name, owner_name, owner_email, owner_phone, plan_id, status, id]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Tenant not found' });
    }

    return res.json({
      status: 'success',
      message: 'Salon organization updated successfully',
      data: rows[0]
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// 5. Toggle Tenant Status (1-Click Suspend / Reactivate)
export const toggleTenantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const isSuper = req.user?.is_super_admin === true || req.user?.email === 'admin@saloon.com';
    if (!isSuper) {
      return res.status(403).json({ status: 'error', message: 'Super Admin access required to suspend or activate salons' });
    }

    const currentRes = await pool.query('SELECT status, name FROM tenants WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Tenant not found' });
    }

    const newStatus = currentRes.rows[0].status === 'Active' ? 'Suspended' : 'Active';

    const { rows } = await pool.query(`
      UPDATE tenants
      SET status = $1
      WHERE id = $2
      RETURNING *
    `, [newStatus, id]);

    return res.json({
      status: 'success',
      message: `Salon "${currentRes.rows[0].name}" is now ${newStatus}`,
      data: rows[0]
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// 6. Extend Free Trial (Super Admin)
export const extendTenantTrial = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 14 } = req.body;
    const isSuper = req.user?.is_super_admin === true || req.user?.email === 'admin@saloon.com';
    if (!isSuper) {
      return res.status(403).json({ status: 'error', message: 'Super Admin access required to extend trials' });
    }

    const { rows } = await pool.query(`
      UPDATE tenants
      SET trial_ends_at = GREATEST(COALESCE(trial_ends_at, NOW()), NOW()) + ($1 || ' days')::interval,
          status = 'Trial'
      WHERE id = $2
      RETURNING *
    `, [parseInt(days), id]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Tenant not found' });
    }

    return res.json({
      status: 'success',
      message: `Trial for "${rows[0].name}" extended by ${days} days!`,
      data: rows[0]
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// 7. Impersonate Tenant (Login as Salon for Support Mode)
export const impersonateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const isSuper = req.user?.is_super_admin === true || req.user?.email === 'admin@saloon.com';
    if (!isSuper) {
      return res.status(403).json({ status: 'error', message: 'Only Super Admin can use Support Impersonation' });
    }

    // Find the Admin user of this tenant
    const userRes = await pool.query(`
      SELECT u.*, t.name as tenant_name, t.slug as tenant_slug, r.name as role_name, r.permissions,
             p.features as plan_features, p.name as plan_name
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      LEFT JOIN subscription_plans p ON t.plan_id = p.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.tenant_id = $1 AND u.role_id = 1
      ORDER BY u.id ASC
      LIMIT 1
    `, [id]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No administrator found for this salon' });
    }

    const targetUser = userRes.rows[0];

    let parsedPlanFeatures = targetUser.plan_features || [];
    if (typeof parsedPlanFeatures === 'string') {
      try { parsedPlanFeatures = JSON.parse(parsedPlanFeatures); } catch (e) { parsedPlanFeatures = []; }
    }

    const payload = {
      id: targetUser.id,
      name: `${targetUser.name} [Support Mode]`,
      email: targetUser.email,
      role: 'Admin',
      role_id: 1,
      is_super_admin: false,
      is_impersonating: true,
      original_super_admin_id: req.user.id,
      tenant_id: targetUser.tenant_id,
      tenant_name: targetUser.tenant_name,
      plan_name: targetUser.plan_name || 'Starter',
      plan_features: parsedPlanFeatures,
      branch_id: targetUser.branch_id,
      permissions: targetUser.permissions || ['all']
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '4h' });

    return res.json({
      status: 'success',
      message: `Now accessing "${targetUser.tenant_name}" in Support Mode`,
      data: {
        token,
        user: payload
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// 8. Public Auth & Signup Settings (No Auth Required)
export const getPublicAuthSettings = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'allow_public_signup'`
    );
    const allowSignup = rows.length > 0 ? (rows[0].setting_value === 'true' || rows[0].setting_value === '1') : true;

    // Fetch active plans available for self-signup
    const plansRes = await pool.query(
      `SELECT id, name, code, price_monthly, price_yearly, max_branches, max_staff, features, description
       FROM subscription_plans
       WHERE is_active = TRUE
       ORDER BY id ASC`
    );

    return res.json({
      status: 'success',
      data: {
        allow_public_signup: allowSignup,
        available_plans: plansRes.rows
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// 9. Self-Serve Public Registration for New Salons (14-Day Free Trial)
export const registerPublicSalon = async (req, res) => {
  const client = await pool.connect();
  try {
    // Check if public registration is enabled in system settings
    const checkSetting = await client.query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'allow_public_signup'`
    );
    const isPublicAllowed = checkSetting.rows.length > 0
      ? (checkSetting.rows[0].setting_value === 'true' || checkSetting.rows[0].setting_value === '1')
      : true;

    // If registration is disabled and no invite code provided
    if (!isPublicAllowed && !req.body.invite_code) {
      return res.status(403).json({
        status: 'error',
        code: 'REGISTRATION_DISABLED',
        message: 'Public salon registration is currently by invitation only. Please contact the platform admin to onboard your salon.'
      });
    }

    const {
      salon_name,
      owner_name,
      owner_email,
      owner_phone,
      password,
      city = 'New Delhi',
      plan_id = 1
    } = req.body;

    if (!salon_name || !owner_name || !owner_email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Salon Name, Owner Name, Email Address, and Password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long'
      });
    }

    const cleanEmail = owner_email.trim().toLowerCase();
    const cleanSlug = salon_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(100 + Math.random() * 900);

    // Check unique email and slug across all tenants and users
    const existingTenant = await client.query(
      'SELECT id FROM tenants WHERE owner_email = $1 OR slug = $2',
      [cleanEmail, cleanSlug]
    );
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [cleanEmail]
    );

    if (existingTenant.rows.length > 0 || existingUser.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'A salon or user account with this email address already exists. Please sign in.'
      });
    }

    await client.query('BEGIN');

    // 1. Create Tenant Record with 14-Day Free Evaluation
    const trialDays = 14;
    const tenantRes = await client.query(`
      INSERT INTO tenants (name, slug, owner_name, owner_email, owner_phone, status, plan_id, trial_ends_at, subscription_ends_at)
      VALUES ($1, $2, $3, $4, $5, 'Trial', $6, NOW() + INTERVAL '${trialDays} days', NOW() + INTERVAL '${trialDays} days')
      RETURNING *
    `, [salon_name.trim(), cleanSlug, owner_name.trim(), cleanEmail, owner_phone || '', parseInt(plan_id) || 1]);

    const newTenant = tenantRes.rows[0];

    // 2. Create Default Primary Branch Outlet
    const branchCode = `${cleanSlug.substring(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '')}-B1`;
    const branchRes = await client.query(`
      INSERT INTO branches (name, code, address, city, phone, is_active, tenant_id)
      VALUES ($1, $2, $3, $4, $5, TRUE, $6)
      RETURNING id, name
    `, [`${salon_name.trim()} (Main Outlet)`, branchCode, 'Primary Location', city || 'New Delhi', owner_phone || '', newTenant.id]);

    const primaryBranch = branchRes.rows[0];

    // 3. Create Salon Owner User (Admin Role = 1)
    const userRes = await client.query(`
      INSERT INTO users (name, email, phone, password, role_id, branch_id, tenant_id, allowed_branch_ids, is_active)
      VALUES ($1, $2, $3, $4, 1, $5, $6, $7, TRUE)
      RETURNING id, name, email, phone, role_id
    `, [
      owner_name.trim(),
      cleanEmail,
      owner_phone || '',
      password,
      primaryBranch.id,
      newTenant.id,
      JSON.stringify([primaryBranch.id])
    ]);

    const ownerUser = userRes.rows[0];

    // 4. Seed Standard Salon Service Categories for Instant POS Readiness
    const defaultCategories = ['Hair & Styling', 'Beard & Grooming', 'Facial & Skin Care', 'Spa & Body Treatments'];
    for (const catName of defaultCategories) {
      await client.query(`
        INSERT INTO service_categories (name, description, tenant_id)
        VALUES ($1, 'Standard service category', $2)
        ON CONFLICT DO NOTHING
      `, [catName, newTenant.id]);
    }

    // 5. Query assigned Plan details for JWT Token
    const planRes = await client.query('SELECT name, features FROM subscription_plans WHERE id = $1', [newTenant.plan_id]);
    let planFeatures = ['pos', 'appointments', 'crm'];
    let planName = 'Starter';
    if (planRes.rows.length > 0) {
      planName = planRes.rows[0].name;
      let rawF = planRes.rows[0].features;
      if (typeof rawF === 'string') {
        try { rawF = JSON.parse(rawF); } catch(e) { rawF = []; }
      }
      if (Array.isArray(rawF)) planFeatures = rawF;
    }

    await client.query('COMMIT');

    // 6. Generate immediate JWT Token for Instant Auto-Login
    const payload = {
      id: ownerUser.id,
      name: ownerUser.name,
      email: ownerUser.email,
      role: 'Admin',
      role_id: 1,
      is_super_admin: false,
      tenant_id: newTenant.id,
      tenant_name: newTenant.name,
      plan_name: planName,
      plan_features: planFeatures,
      branch_id: primaryBranch.id,
      branch_name: primaryBranch.name,
      allowed_branch_ids: [primaryBranch.id],
      permissions: ['all', 'manage_permissions', 'manage_users', 'manage_branches', 'manage_services', 'manage_appointments', 'manage_billing']
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return res.status(201).json({
      status: 'success',
      message: `Congratulations! "${salon_name}" registered successfully with a 14-day free trial.`,
      data: {
        token,
        user: payload,
        tenant: newTenant,
        branch: primaryBranch
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('registerPublicSalon error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  } finally {
    client.release();
  }
};

