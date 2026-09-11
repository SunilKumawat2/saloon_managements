import { pool } from '../config/db.js';

async function migrateModule6() {
  try {
    console.log('Running Module 6: Inventory & Product Stock Management database migrations...');

    // 1. Suppliers Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        company_name VARCHAR(120),
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100),
        gstin VARCHAR(30),
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Products Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
        sku VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(120) NOT NULL,
        category VARCHAR(60) NOT NULL DEFAULT 'Hair Care',
        type VARCHAR(30) NOT NULL DEFAULT 'Both',
        unit VARCHAR(20) DEFAULT 'pcs',
        quantity INT NOT NULL DEFAULT 0,
        min_threshold INT NOT NULL DEFAULT 10,
        cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        retail_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Purchase Orders Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        po_number VARCHAR(50) UNIQUE NOT NULL,
        supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
        branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
        status VARCHAR(30) DEFAULT 'Ordered',
        total_amount DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        order_date DATE DEFAULT CURRENT_DATE,
        received_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Purchase Order Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id SERIAL PRIMARY KEY,
        po_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id) ON DELETE RESTRICT,
        unit_cost DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        total_price DECIMAL(10,2) NOT NULL
      );
    `);

    // 5. Service Product Consumption Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_product_consumption (
        id SERIAL PRIMARY KEY,
        service_id INT REFERENCES services(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        quantity_consumed DECIMAL(10,2) NOT NULL DEFAULT 1,
        unit VARCHAR(20) DEFAULT 'ml',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Stock Adjustment Logs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_adjustment_logs (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        change_qty INT NOT NULL,
        reason VARCHAR(50) NOT NULL,
        performed_by VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed Suppliers
    await pool.query(`
      INSERT INTO suppliers (id, name, company_name, phone, email, gstin, address) VALUES
      (1, 'Rajesh Malhotra', 'L''Oreal India Professional', '9811002233', 'orders@lorealpro.in', '07AAAAL0000A1Z1', 'Plot 45, Okhla Phase 3, New Delhi'),
      (2, 'Sanjay Gupta', 'Schwarzkopf Professional Supplies', '9822334455', 'sales@schwarzkopf.in', '07AAACS1111B2Z2', 'Industrial Area, Gurugram'),
      (3, 'Anita Roy', 'Lotus Herbals Beauty Care', '9833445566', 'anita@lotusherbals.com', '07AAACL2222C3Z3', 'Mayapuri Phase 2, New Delhi')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `);

    // Seed Products
    await pool.query(`
      INSERT INTO products (id, sku, name, category, type, unit, quantity, min_threshold, cost_price, retail_price, supplier_id, description) VALUES
      (1, 'SKU-HC-001', 'L''Oreal Serie Expert Shampoo 500ml', 'Hair Care', 'Retail', 'bottles', 25, 10, 650.00, 950.00, 1, 'Color protect hair shampoo for salon clients'),
      (2, 'SKU-HC-002', 'L''Oreal Keratin Smoothing Cream 1000ml', 'Hair Spa', 'Internal Usage', 'ml', 4, 10, 2200.00, 0.00, 1, 'Professional hair keratin treatment cream'),
      (3, 'SKU-SC-001', 'Lotus Gold Facial Kit 500g', 'Facial & Skin', 'Internal Usage', 'boxes', 3, 5, 1100.00, 0.00, 3, '24K Gold luxury facial massage tub'),
      (4, 'SKU-HC-003', 'Schwarzkopf Argan Hair Serum 100ml', 'Hair Care', 'Both', 'bottles', 18, 8, 450.00, 750.00, 2, 'Nourishing shine argan oil serum'),
      (5, 'SKU-BD-001', 'Beardo Godfather Beard Wash 200ml', 'Beard & Grooming', 'Retail', 'bottles', 6, 12, 210.00, 350.00, 2, 'Premium beard grooming cleanser')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `);

    // Seed Purchase Orders
    await pool.query(`
      INSERT INTO purchase_orders (id, po_number, supplier_id, status, total_amount, notes, order_date, received_date) VALUES
      (1, 'PO-2026-001', 1, 'Received', 14500.00, 'Monthly L''Oreal professional stock delivery', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '2 days'),
      (2, 'PO-2026-002', 2, 'Ordered', 8900.00, 'Schwarzkopf hair serums & beard washes', CURRENT_DATE - INTERVAL '1 day', NULL)
      ON CONFLICT (id) DO UPDATE SET po_number = EXCLUDED.po_number;
    `);

    // Seed PO Items
    await pool.query(`
      INSERT INTO purchase_order_items (po_id, product_id, unit_cost, quantity, total_price) VALUES
      (1, 1, 650.00, 15, 9750.00),
      (1, 2, 2200.00, 2, 4400.00),
      (2, 4, 450.00, 10, 4500.00),
      (2, 5, 210.00, 20, 4200.00)
      ON CONFLICT DO NOTHING;
    `);

    // Seed Service Consumption Mapping
    await pool.query(`
      INSERT INTO service_product_consumption (service_id, product_id, quantity_consumed, unit, notes) VALUES
      (4, 2, 50.00, 'ml', '50ml Keratin Cream per treatment'),
      (3, 3, 30.00, 'grams', '30g Gold Facial Gel per facial session'),
      (1, 4, 5.00, 'ml', '5ml Argan Serum after haircut styling')
      ON CONFLICT DO NOTHING;
    `);

    // Reset sequences
    await pool.query(`SELECT setval(pg_get_serial_sequence('suppliers', 'id'), COALESCE((SELECT MAX(id) FROM suppliers), 1));`);
    await pool.query(`SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1));`);
    await pool.query(`SELECT setval(pg_get_serial_sequence('purchase_orders', 'id'), COALESCE((SELECT MAX(id) FROM purchase_orders), 1));`);

    console.log('Module 6 DB migrations completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Module 6 DB migration error:', err);
    process.exit(1);
  }
}

migrateModule6();
