import { pool } from '../config/db.js';

const Marketing = {
  // Offer Templates
  getTemplates: async () => {
    const res = await pool.query(`SELECT * FROM offer_templates ORDER BY created_at DESC`);
    return res.rows;
  },

  createTemplate: async ({ name, channel = 'WhatsApp', subject, body, coupon_code }) => {
    const res = await pool.query(`
      INSERT INTO offer_templates (name, channel, subject, body, coupon_code)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, channel, subject || '', body, coupon_code || '']);
    return res.rows[0];
  },

  updateTemplate: async (id, { name, channel, subject, body, coupon_code, is_active }) => {
    const res = await pool.query(`
      UPDATE offer_templates
      SET name = COALESCE($1, name),
          channel = COALESCE($2, channel),
          subject = COALESCE($3, subject),
          body = COALESCE($4, body),
          coupon_code = COALESCE($5, coupon_code),
          is_active = COALESCE($6, is_active)
      WHERE id = $7
      RETURNING *
    `, [name, channel, subject, body, coupon_code, is_active, id]);
    return res.rows[0];
  },

  // Campaigns
  getCampaigns: async () => {
    const res = await pool.query(`
      SELECT c.*, t.name as template_name, t.body as template_body
      FROM campaigns c
      LEFT JOIN offer_templates t ON c.template_id = t.id
      ORDER BY c.created_at DESC
    `);
    return res.rows;
  },

  createCampaign: async ({ title, channel = 'WhatsApp', target_segment = 'All Clients', template_id }) => {
    const res = await pool.query(`
      INSERT INTO campaigns (title, channel, target_segment, template_id, status)
      VALUES ($1, $2, $3, $4, 'Draft')
      RETURNING *
    `, [title, channel, target_segment, template_id]);
    return res.rows[0];
  },

  sendCampaign: async (campaignId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch campaign & template
      const campRes = await client.query(`
        SELECT c.*, t.body as template_body, t.coupon_code
        FROM campaigns c
        LEFT JOIN offer_templates t ON c.template_id = t.id
        WHERE c.id = $1
      `, [campaignId]);

      if (campRes.rows.length === 0) throw new Error('Campaign not found');
      const campaign = campRes.rows[0];

      // Fetch target customers based on target_segment
      let custQuery = `SELECT id, name, phone, email FROM customers`;
      if (campaign.target_segment === 'VIP Members') {
        custQuery += ` WHERE id IN (SELECT customer_id FROM customer_memberships WHERE status = 'Active')`;
      } else if (campaign.target_segment === 'Inactive 30+ Days') {
        custQuery += ` WHERE id NOT IN (SELECT DISTINCT customer_id FROM bills WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')`;
      }

      const custs = await client.query(custQuery);
      const targetCustomers = custs.rows;

      let sentCount = 0;
      for (const cust of targetCustomers) {
        let msgBody = (campaign.template_body || 'Special Salon Offer!')
          .replace(/\{customer_name\}/g, cust.name || 'Valued Client')
          .replace(/\{discount_code\}/g, campaign.coupon_code || 'SPECIAL10')
          .replace(/\{salon_name\}/g, 'Connaught Place Salon');

        await client.query(`
          INSERT INTO campaign_delivery_logs (campaign_id, customer_id, customer_name, customer_phone, channel, message_body, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'Delivered')
        `, [campaign.id, cust.id, cust.name, cust.phone, campaign.channel, msgBody]);

        sentCount++;
      }

      // Update campaign status
      const updatedRes = await client.query(`
        UPDATE campaigns
        SET status = 'Completed',
            sent_count = $1,
            delivered_count = $1
        WHERE id = $2
        RETURNING *
      `, [sentCount, campaign.id]);

      await client.query('COMMIT');
      return updatedRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Automated Triggers
  getTriggers: async () => {
    const res = await pool.query(`
      SELECT at.*, t.name as template_name, t.body as template_body
      FROM automated_triggers at
      LEFT JOIN offer_templates t ON at.template_id = t.id
      ORDER BY at.id ASC
    `);
    return res.rows;
  },

  toggleTrigger: async (id) => {
    const res = await pool.query(`
      UPDATE automated_triggers
      SET is_active = NOT is_active
      WHERE id = $1
      RETURNING *
    `, [id]);
    return res.rows[0];
  },

  // Today's Birthdays & Anniversaries & Inactive Clients
  getTodayOccasions: async () => {
    // Birthdays today (matching month and day)
    const bdayRes = await pool.query(`
      SELECT id, name, phone, email, dob, loyalty_points, referral_code
      FROM customers
      WHERE dob IS NOT NULL
        AND EXTRACT(MONTH FROM dob) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(DAY FROM dob) = EXTRACT(DAY FROM CURRENT_DATE)
    `);

    // Anniversaries today (matching month and day)
    const annivRes = await pool.query(`
      SELECT id, name, phone, email, anniversary, loyalty_points, referral_code
      FROM customers
      WHERE anniversary IS NOT NULL
        AND EXTRACT(MONTH FROM anniversary) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(DAY FROM anniversary) = EXTRACT(DAY FROM CURRENT_DATE)
    `);

    // Inactive customers (> 30 days without a bill)
    const inactiveRes = await pool.query(`
      SELECT c.id, c.name, c.phone, c.email, MAX(b.created_at) as last_visit
      FROM customers c
      LEFT JOIN bills b ON c.id = b.customer_id
      GROUP BY c.id
      HAVING MAX(b.created_at) IS NULL OR MAX(b.created_at) < CURRENT_DATE - INTERVAL '30 days'
      LIMIT 20
    `);

    return {
      birthdays: bdayRes.rows,
      anniversaries: annivRes.rows,
      inactive: inactiveRes.rows
    };
  },

  // Delivery Audit Logs
  getLogs: async () => {
    const res = await pool.query(`
      SELECT cdl.*, c.title as campaign_title
      FROM campaign_delivery_logs cdl
      LEFT JOIN campaigns c ON cdl.campaign_id = c.id
      ORDER BY cdl.sent_at DESC
      LIMIT 100
    `);
    return res.rows;
  }
};

export default Marketing;
