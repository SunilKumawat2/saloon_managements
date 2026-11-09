import { pool } from '../config/db.js';

// 1. Get All Subscription Plans (Public & Admin)
export const getSubscriptionPlans = async (req, res) => {
  try {
    const isSuper = req.user?.is_super_admin === true || req.user?.email === 'admin@saloon.com';
    const query = isSuper
      ? `SELECT * FROM subscription_plans ORDER BY price_monthly ASC`
      : `SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY price_monthly ASC`;

    const { rows } = await pool.query(query);
    return res.json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('getSubscriptionPlans error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// 2. Get Single Plan by ID
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM subscription_plans WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Subscription plan not found' });
    }
    return res.json({ status: 'success', data: rows[0] });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// 3. Get Current Salon Tenant's Plan & Resource Usage Quota
export const getCurrentTenantPlanUsage = async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenant_id || 1;

    // Fetch tenant details
    const tenantRes = await pool.query(`
      SELECT t.id, t.name, t.slug, t.owner_name, t.owner_email, t.owner_phone,
             t.status, t.plan_id, t.trial_ends_at, t.subscription_ends_at, t.created_at,
             p.name as plan_name, p.code as plan_code, p.price_monthly, p.price_yearly,
             p.max_branches, p.max_staff, p.features, p.description as plan_description
      FROM tenants t
      LEFT JOIN subscription_plans p ON t.plan_id = p.id
      WHERE t.id = $1
    `, [tenantId]);

    if (tenantRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Tenant record not found' });
    }

    const tenant = tenantRes.rows[0];

    // Count live resource usage for this tenant
    const [branchCountRes, staffCountRes, customersCountRes, billsCountRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM branches WHERE tenant_id = $1 AND is_active = TRUE', [tenantId]),
      pool.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND is_active = TRUE', [tenantId]),
      pool.query('SELECT COUNT(*) FROM customers WHERE tenant_id = $1', [tenantId]),
      pool.query('SELECT COUNT(*) FROM bills WHERE tenant_id = $1', [tenantId])
    ]);

    const branchesUsed = parseInt(branchCountRes.rows[0].count) || 0;
    const staffUsed = parseInt(staffCountRes.rows[0].count) || 0;
    const customersCount = parseInt(customersCountRes.rows[0].count) || 0;
    const billsCount = parseInt(billsCountRes.rows[0].count) || 0;

    // Calculate days remaining
    let daysRemaining = null;
    const now = new Date();
    if (tenant.status === 'Trial' && tenant.trial_ends_at) {
      const diffMs = new Date(tenant.trial_ends_at) - now;
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } else if (tenant.subscription_ends_at) {
      const diffMs = new Date(tenant.subscription_ends_at) - now;
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    return res.json({
      status: 'success',
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          owner_name: tenant.owner_name,
          owner_email: tenant.owner_email,
          status: tenant.status,
          trial_ends_at: tenant.trial_ends_at,
          subscription_ends_at: tenant.subscription_ends_at,
          days_remaining: daysRemaining
        },
        plan: {
          id: tenant.plan_id,
          name: tenant.plan_name || 'Starter',
          code: tenant.plan_code || 'STARTER',
          price_monthly: parseFloat(tenant.price_monthly) || 999,
          price_yearly: parseFloat(tenant.price_yearly) || 9999,
          max_branches: tenant.max_branches ?? 1,
          max_staff: tenant.max_staff ?? 4,
          features: Array.isArray(tenant.features) ? tenant.features : [],
          description: tenant.plan_description
        },
        usage: {
          branches_used: branchesUsed,
          branches_limit: tenant.max_branches ?? 1,
          branches_percent: tenant.max_branches > 0 ? Math.min(100, Math.round((branchesUsed / tenant.max_branches) * 100)) : 0,
          staff_used: staffUsed,
          staff_limit: tenant.max_staff ?? 4,
          staff_percent: tenant.max_staff > 0 ? Math.min(100, Math.round((staffUsed / tenant.max_staff) * 100)) : 0,
          customers_count: customersCount,
          bills_count: billsCount
        }
      }
    });
  } catch (error) {
    console.error('getCurrentTenantPlanUsage error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// 4. Change / Upgrade Current Salon's Plan
export const changeTenantPlan = async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenant_id || 1;
    const { plan_id, billing_cycle = 'monthly' } = req.body;

    if (!plan_id) {
      return res.status(400).json({ status: 'error', message: 'plan_id is required' });
    }

    // Verify plan exists
    const planRes = await pool.query('SELECT * FROM subscription_plans WHERE id = $1 AND is_active = TRUE', [plan_id]);
    if (planRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Selected plan not found or inactive' });
    }

    const plan = planRes.rows[0];
    const durationInterval = billing_cycle === 'yearly' ? '1 year' : '1 month';

    // Update tenant plan and extend subscription date
    await pool.query(`
      UPDATE tenants
      SET plan_id = $1,
          status = 'Active',
          subscription_ends_at = NOW() + INTERVAL '${durationInterval}'
      WHERE id = $2
    `, [plan_id, tenantId]);

    return res.json({
      status: 'success',
      message: `Successfully switched to ${plan.name} Plan (${billing_cycle})!`,
      data: { plan_id: plan.id, plan_name: plan.name, billing_cycle }
    });
  } catch (error) {
    console.error('changeTenantPlan error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// 5. Create Subscription Plan (Super Admin)
export const createSubscriptionPlan = async (req, res) => {
  try {
    const isSuper = req.user?.is_super_admin === true || req.user?.email === 'admin@saloon.com';
    if (!isSuper) {
      return res.status(403).json({ status: 'error', message: 'Super Admin access required to create plans' });
    }

    const { name, code, price_monthly, price_yearly, max_branches, max_staff, features, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ status: 'error', message: 'Plan name and code are required' });
    }

    const { rows } = await pool.query(`
      INSERT INTO subscription_plans (name, code, price_monthly, price_yearly, max_branches, max_staff, features, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      name,
      code.toUpperCase().trim(),
      parseFloat(price_monthly) || 0,
      parseFloat(price_yearly) || 0,
      parseInt(max_branches) ?? 1,
      parseInt(max_staff) ?? 4,
      JSON.stringify(Array.isArray(features) ? features : []),
      description || ''
    ]);

    return res.status(201).json({
      status: 'success',
      message: `Plan "${name}" created successfully`,
      data: rows[0]
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// 6. Update Subscription Plan (Super Admin)
export const updateSubscriptionPlan = async (req, res) => {
  try {
    const isSuper = req.user?.is_super_admin === true || req.user?.email === 'admin@saloon.com';
    if (!isSuper) {
      return res.status(403).json({ status: 'error', message: 'Super Admin access required to update plans' });
    }

    const { id } = req.params;
    const { name, price_monthly, price_yearly, max_branches, max_staff, features, description, is_active } = req.body;

    const { rows } = await pool.query(`
      UPDATE subscription_plans
      SET name = COALESCE($1, name),
          price_monthly = COALESCE($2, price_monthly),
          price_yearly = COALESCE($3, price_yearly),
          max_branches = COALESCE($4, max_branches),
          max_staff = COALESCE($5, max_staff),
          features = COALESCE($6, features),
          description = COALESCE($7, description),
          is_active = COALESCE($8, is_active)
      WHERE id = $9
      RETURNING *
    `, [
      name,
      price_monthly !== undefined ? parseFloat(price_monthly) : null,
      price_yearly !== undefined ? parseFloat(price_yearly) : null,
      max_branches !== undefined ? parseInt(max_branches) : null,
      max_staff !== undefined ? parseInt(max_staff) : null,
      features !== undefined ? JSON.stringify(features) : null,
      description,
      is_active,
      id
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Subscription plan not found' });
    }

    return res.json({
      status: 'success',
      message: `Plan "${rows[0].name}" updated successfully`,
      data: rows[0]
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// 7. Toggle Plan Active Status (Super Admin)
export const togglePlanStatus = async (req, res) => {
  try {
    const isSuper = req.user?.is_super_admin === true || req.user?.email === 'admin@saloon.com';
    if (!isSuper) {
      return res.status(403).json({ status: 'error', message: 'Super Admin access required' });
    }

    const { id } = req.params;
    const { rows } = await pool.query(`
      UPDATE subscription_plans
      SET is_active = NOT is_active
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Subscription plan not found' });
    }

    return res.json({
      status: 'success',
      message: `Plan is now ${rows[0].is_active ? 'Active' : 'Inactive'}`,
      data: rows[0]
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
