import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saloon_db',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

async function migrateModule8() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Module 8 (Marketing Automation & Communication) Database Migration...');
    await client.query('BEGIN');

    // 1. Table: offer_templates (SMS & WhatsApp Message Templates)
    await client.query(`
      CREATE TABLE IF NOT EXISTS offer_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        channel VARCHAR(20) NOT NULL DEFAULT 'WhatsApp', -- 'WhatsApp', 'SMS', 'Both'
        subject VARCHAR(150),
        body TEXT NOT NULL,
        coupon_code VARCHAR(50),
        variables JSONB DEFAULT '["{customer_name}", "{discount_code}", "{salon_name}"]'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Table: campaigns (Promotional Bulk Campaigns)
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        channel VARCHAR(20) NOT NULL DEFAULT 'WhatsApp', -- 'WhatsApp', 'SMS'
        target_segment VARCHAR(50) NOT NULL DEFAULT 'All Clients', -- 'All Clients', 'VIP Members', 'Inactive 30+ Days', 'Birthday Today'
        template_id INT REFERENCES offer_templates(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'Draft', -- 'Draft', 'Scheduled', 'Sending', 'Completed'
        sent_count INT DEFAULT 0,
        delivered_count INT DEFAULT 0,
        failed_count INT DEFAULT 0,
        scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Table: automated_triggers (Birthday, Anniversary & Inactive Client Triggers)
    await client.query(`
      CREATE TABLE IF NOT EXISTS automated_triggers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        event_type VARCHAR(50) UNIQUE NOT NULL, -- 'Birthday', 'Anniversary', 'Inactive_30_Days', 'First_Visit_Followup'
        channel VARCHAR(20) DEFAULT 'WhatsApp',
        template_id INT REFERENCES offer_templates(id) ON DELETE SET NULL,
        delay_days INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        offer_discount VARCHAR(50) DEFAULT '15% OFF',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Table: campaign_delivery_logs (Real-time Delivery Logs)
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaign_delivery_logs (
        id SERIAL PRIMARY KEY,
        campaign_id INT REFERENCES campaigns(id) ON DELETE CASCADE,
        customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
        customer_name VARCHAR(100),
        customer_phone VARCHAR(20),
        channel VARCHAR(20) DEFAULT 'WhatsApp',
        message_body TEXT,
        status VARCHAR(20) DEFAULT 'Delivered', -- 'Sent', 'Delivered', 'Failed'
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed Default Offer Templates
    await client.query(`
      INSERT INTO offer_templates (id, name, channel, subject, body, coupon_code) VALUES
      (1, 'Birthday Special Gift Wish', 'WhatsApp', 'Happy Birthday from SalonPulse!', 'Dear {customer_name}, Happy Birthday! 🎉 Enjoy a complimentary facial & 20% OFF on your next visit with code {discount_code}. Valid for 7 days!', 'BDAY20'),
      (2, 'Wedding Anniversary Luxury Spa', 'WhatsApp', 'Happy Wedding Anniversary!', 'Dear {customer_name}, Happy Anniversary! ❤️ Rejuvenate with our Couple Hair & Spa Package at flat 25% OFF using code {discount_code}.', 'ANNIV25'),
      (3, 'We Miss You! 15% Re-engagement', 'SMS', 'Special Discount Offer', 'Hi {customer_name}, we miss seeing you at SalonPulse! Book any service this week & get 15% OFF with code {discount_code}.', 'MISSED15'),
      (4, 'Festive Super Glow Blast', 'WhatsApp', 'Festive Offer Alert', 'Hello {customer_name}! Get ready for the festive season! Book Royal Gold Facial & Hair Styling combo at just ₹999. Use code {discount_code}!', 'FESTIVE999')
      ON CONFLICT (id) DO UPDATE SET 
        body = EXCLUDED.body,
        coupon_code = EXCLUDED.coupon_code;
    `);

    // Reset sequence
    await client.query(`SELECT setval(pg_get_serial_sequence('offer_templates', 'id'), COALESCE((SELECT MAX(id) FROM offer_templates), 1));`);

    // Seed Default Automated Triggers
    await client.query(`
      INSERT INTO automated_triggers (id, name, event_type, channel, template_id, is_active, offer_discount) VALUES
      (1, 'Automated Birthday Offer Trigger', 'Birthday', 'WhatsApp', 1, TRUE, '20% OFF Birthday Discount'),
      (2, 'Automated Anniversary Spa Trigger', 'Anniversary', 'WhatsApp', 2, TRUE, '25% OFF Couple Spa'),
      (3, '30+ Days Inactive Client Re-engagement', 'Inactive_30_Days', 'SMS', 3, TRUE, '15% Re-engagement Discount')
      ON CONFLICT (id) DO UPDATE SET 
        template_id = EXCLUDED.template_id,
        is_active = EXCLUDED.is_active;
    `);

    await client.query(`SELECT setval(pg_get_serial_sequence('automated_triggers', 'id'), COALESCE((SELECT MAX(id) FROM automated_triggers), 1));`);

    // Seed Sample Campaigns
    await client.query(`
      INSERT INTO campaigns (id, title, channel, target_segment, template_id, status, sent_count, delivered_count) VALUES
      (1, 'Festive Season Grand Sale Blast', 'WhatsApp', 'All Clients', 4, 'Completed', 142, 138),
      (2, 'VIP Client Luxury Keratin Promotion', 'WhatsApp', 'VIP Members', 4, 'Completed', 45, 45)
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query(`SELECT setval(pg_get_serial_sequence('campaigns', 'id'), COALESCE((SELECT MAX(id) FROM campaigns), 1));`);

    // Seed Sample Delivery Logs for first customer
    const custRes = await client.query(`SELECT id, name, phone FROM customers LIMIT 2`);
    if (custRes.rows.length > 0) {
      for (const cust of custRes.rows) {
        await client.query(`
          INSERT INTO campaign_delivery_logs (campaign_id, customer_id, customer_name, customer_phone, channel, message_body, status)
          VALUES (1, $1, $2, $3, 'WhatsApp', $4, 'Delivered')
          ON CONFLICT DO NOTHING;
        `, [cust.id, cust.name, cust.phone, `Hello ${cust.name}! Get ready for the festive season! Book Royal Gold Facial & Hair Styling combo at just ₹999.`]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Module 8 (Marketing Automation) Migration Completed Successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration Failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

migrateModule8();
