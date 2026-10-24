import { pool } from '../config/db.js';
import { GatewayFactory } from '../services/paymentGateways/GatewayFactory.js';

export const PaymentModel = {
  // Get active gateway settings (Masked for frontend security)
  async getGatewaySettings({ adminId, branchId, gatewayName = 'razorpay' }) {
    const creds = await this.getFullCredentials({ adminId, branchId, gatewayName });
    if (!creds) {
      return {
        admin_id: adminId || null,
        branch_id: branchId || null,
        gateway_name: gatewayName,
        key_id: '',
        key_secret: '',
        mode: 'test',
        is_enabled: false,
        has_keys: false,
        is_branch_specific: false,
        updated_at: null
      };
    }

    return {
      id: creds.id,
      admin_id: creds.admin_id,
      branch_id: creds.branch_id,
      gateway_name: creds.gateway_name,
      key_id: creds.key_id,
      key_secret: creds.key_secret ? '••••••••••••••••' : '',
      mode: creds.mode || 'test',
      is_enabled: creds.is_enabled ?? true,
      has_keys: Boolean(creds.key_id && creds.key_id.trim().length > 0),
      is_branch_specific: Boolean(creds.branch_id),
      currency: creds.currency || 'INR',
      updated_at: creds.updated_at
    };
  },

  // Get full credentials including unmasked secret for backend execution
  async getFullCredentials({ adminId, branchId, gatewayName = 'razorpay' }) {
    const numAdminId = adminId ? parseInt(adminId) : null;
    const numBranchId = branchId && branchId !== 'all' ? parseInt(branchId) : null;

    // 1. If branchId is provided, check branch-specific configuration first
    if (numBranchId && numAdminId) {
      const { rows: branchRows } = await pool.query(
        `SELECT * FROM payment_gateway_settings 
         WHERE admin_id = $1 AND branch_id = $2 AND gateway_name = $3`,
        [numAdminId, numBranchId, gatewayName]
      );
      if (branchRows.length > 0 && branchRows[0].key_id) {
        return branchRows[0];
      }
    }

    // 2. Fallback to Admin's Default configuration (branch_id IS NULL)
    if (numAdminId) {
      const { rows: adminRows } = await pool.query(
        `SELECT * FROM payment_gateway_settings 
         WHERE admin_id = $1 AND branch_id IS NULL AND gateway_name = $2`,
        [numAdminId, gatewayName]
      );
      if (adminRows.length > 0 && adminRows[0].key_id) {
        return adminRows[0];
      }
    }

    // 3. Fallback: only if no adminId was specified at all (anonymous or global fallback)
    if (!numAdminId) {
      const { rows: superRows } = await pool.query(
        `SELECT * FROM payment_gateway_settings 
         WHERE admin_id = 1 AND branch_id IS NULL AND gateway_name = $1`,
        [gatewayName]
      );
      if (superRows.length > 0 && superRows[0].key_id) {
        return superRows[0];
      }
    }

    return null;
  },

  // Get all gateway configurations for an Admin (all branches)
  async getAdminGatewayList(adminId) {
    const numAdminId = adminId ? parseInt(adminId) : 1;
    const { rows } = await pool.query(
      `SELECT p.id, p.admin_id, p.branch_id, p.gateway_name, p.key_id, p.mode, p.is_enabled, p.updated_at,
              b.name as branch_name
       FROM payment_gateway_settings p
       LEFT JOIN branches b ON p.branch_id = b.id
       WHERE p.admin_id = $1
       ORDER BY p.branch_id ASC NULLS FIRST`,
      [numAdminId]
    );
    return rows;
  },

  // Upsert Gateway Settings for specific Admin and Branch
  async updateGatewaySettings({ adminId, branchId, gateway_name = 'razorpay', key_id, key_secret, mode = 'test', is_enabled = true, currency = 'INR', additional_config = {} }) {
    const numAdminId = adminId ? parseInt(adminId) : 1;
    const numBranchId = branchId && branchId !== 'all' ? parseInt(branchId) : null;

    // Check if secret key was left blank (keep existing)
    let secretToUse = key_secret;
    if (!secretToUse || secretToUse.includes('•••')) {
      const existing = await this.getFullCredentials({ adminId: numAdminId, branchId: numBranchId, gatewayName: gateway_name });
      secretToUse = existing?.key_secret || 'secret_salonpulse_test_key';
    }

    const query = `
      INSERT INTO payment_gateway_settings (
        admin_id, branch_id, gateway_name, key_id, key_secret, mode, is_enabled, currency, additional_config, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (admin_id, COALESCE(branch_id, -1), gateway_name)
      DO UPDATE SET 
        key_id = EXCLUDED.key_id,
        key_secret = EXCLUDED.key_secret,
        mode = EXCLUDED.mode,
        is_enabled = EXCLUDED.is_enabled,
        currency = EXCLUDED.currency,
        additional_config = EXCLUDED.additional_config,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, admin_id, branch_id, gateway_name, key_id, mode, is_enabled, currency, updated_at
    `;

    const { rows } = await pool.query(query, [
      numAdminId,
      numBranchId,
      gateway_name,
      key_id,
      secretToUse,
      mode,
      is_enabled,
      currency,
      JSON.stringify(additional_config)
    ]);

    return rows[0];
  },

  // Create Gateway Order (Razorpay, Stripe, etc.)
  async createOrder({ adminId, branchId, gatewayName = 'razorpay', amount, receipt, notes }) {
    const creds = await this.getFullCredentials({ adminId, branchId, gatewayName });

    if (!creds || !creds.is_enabled || !creds.key_id) {
      throw new Error(`Payment Gateway (${gatewayName}) is not configured or disabled for this salon branch.`);
    }

    const adapter = GatewayFactory.getAdapter(gatewayName);
    return await adapter.createOrder({
      amount,
      currency: creds.currency || 'INR',
      receipt,
      notes,
      config: creds
    });
  },

  // Verify Signature
  async verifySignature({ adminId, branchId, gatewayName = 'razorpay', payload }) {
    const creds = await this.getFullCredentials({ adminId, branchId, gatewayName });
    const adapter = GatewayFactory.getAdapter(gatewayName);
    return await adapter.verifyPayment({
      ...payload,
      config: creds
    });
  }
};
