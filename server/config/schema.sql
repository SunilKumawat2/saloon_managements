-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: branches
CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(50),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: roles (RBAC)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    role_id INT REFERENCES roles(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: services
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Hair',
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    buffer_time_minutes INT DEFAULT 15,
    commission_rate DECIMAL(5, 2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT TRUE,
    is_package BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_time_minutes INT DEFAULT 15;
ALTER TABLE services ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 10.00;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_package BOOLEAN DEFAULT FALSE;

-- Table: packages (Module 4 Bundled Combo Packages)
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'Combo Package',
    description TEXT,
    package_price DECIMAL(10, 2) NOT NULL,
    standalone_price DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    validity_days INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    service_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: stylists
CREATE TABLE IF NOT EXISTS stylists (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    specialization VARCHAR(100),
    is_available BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: customers (Module 2 CRM)
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    gender VARCHAR(20) DEFAULT 'Unspecified',
    dob DATE,
    anniversary DATE,
    loyalty_points INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'Unspecified';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS anniversary DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points INT DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;

-- Table: leads (Module 2 Lead Management)
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    source VARCHAR(50) DEFAULT 'Walk-in',
    status VARCHAR(30) DEFAULT 'New',
    notes TEXT,
    followup_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: appointments (Module 3 Calendar & Booking)
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
    stylist_id INT REFERENCES stylists(id) ON DELETE SET NULL,
    service_id INT REFERENCES services(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'Scheduled',
    total_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id) ON DELETE SET NULL;

-- Table: bills (Receptionist POS Billing)
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
    stylist_id INT REFERENCES stylists(id) ON DELETE SET NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_mode VARCHAR(20) DEFAULT 'Cash',
    status VARCHAR(20) DEFAULT 'Paid',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: bill_items (Line items per bill)
CREATE TABLE IF NOT EXISTS bill_items (
    id SERIAL PRIMARY KEY,
    bill_id INT REFERENCES bills(id) ON DELETE CASCADE,
    service_id INT REFERENCES services(id) ON DELETE SET NULL,
    service_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    qty INT NOT NULL DEFAULT 1
);

-- Seed Data: Roles
INSERT INTO roles (id, name, description, permissions) VALUES
(1, 'Admin', 'Super Administrator with full system control', '["all", "manage_users", "manage_branches", "manage_finances", "manage_services", "manage_inventory"]'),
(2, 'Manager', 'Branch Operational Manager', '["manage_branch_users", "manage_appointments", "manage_services", "manage_inventory", "view_reports"]'),
(3, 'Receptionist', 'Front Desk & Billing Handler', '["manage_appointments", "manage_billing", "view_customers"]'),
(4, 'Staff', 'Stylist / Hair Artist', '["view_assigned_appointments", "view_schedule"]'),
(5, 'Customer', 'Client Portal User', '["book_appointments", "view_history"]')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Seed Data: Branches
INSERT INTO branches (id, name, code, city, address, phone) VALUES
(1, 'Connaught Place Main Salon', 'CP-001', 'New Delhi', 'Block A, Inner Circle, Connaught Place', '011-23456789'),
(2, 'Cyber Hub Luxury Branch', 'CH-002', 'Gurugram', 'Building 10, DLF Cyber City', '0124-9876543')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Seed Data: Users
INSERT INTO users (id, branch_id, role_id, name, email, phone, password) VALUES
(1, 1, 1, 'Sunil Kumar (Admin)', 'admin@saloon.com', '9876543210', 'admin123'),
(2, 1, 2, 'Rohan Verma (Manager)', 'rohan.manager@saloon.com', '9876543211', 'manager123'),
(3, 1, 3, 'Priya Sharma (Receptionist)', 'priya.reception@saloon.com', '9876543212', 'recep123'),
(4, 2, 4, 'Amit Singh (Senior Stylist)', 'amit.stylist@saloon.com', '9876543213', 'staff123')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Seed Data: Services
INSERT INTO services (id, name, category, description, price, duration_minutes) VALUES
(1, 'Classic Haircut & Styling', 'Hair', 'Professional hair haircut, wash & blow dry', 350.00, 30),
(2, 'Beard Shaping & Beard Spa', 'Beard', 'Precision beard shaping and hot towel service', 200.00, 20),
(3, 'Royal Gold Facial & Clean-up', 'Facial', 'Deep skin cleansing and herbal treatment', 1200.00, 45),
(4, 'Keratin Hair Smoothing Treatment', 'Hair Spa', 'Premium hair coloring & moisturizing massage', 3500.00, 90)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Seed Data: Stylists
INSERT INTO stylists (id, branch_id, name, phone, specialization, rating) VALUES
(1, 1, 'Rohan Sharma', '9876543210', 'Senior Stylist & Hair Specialist', 4.90),
(2, 1, 'Amit Verma', '9876543211', 'Beard & Facial Expert', 4.80),
(3, 2, 'Priya Singh', '9876543212', 'Hair Color & Beauty Consultant', 5.00)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Seed Data: Customers (CRM)
INSERT INTO customers (id, branch_id, name, phone, email, gender, dob, loyalty_points, notes) VALUES
(1, 1, 'Rahul Kumar', '9988776655', 'rahul.k@gmail.com', 'Male', '1995-08-15', 120, 'Prefers Rohan Sharma for haircut'),
(2, 1, 'Sneha Kapoor', '9988776656', 'sneha.k@outlook.com', 'Female', '1998-11-22', 250, 'Regular facial client, sensitive skin'),
(3, 2, 'Karan Johar', '9988776657', 'karan@media.com', 'Male', '1990-03-10', 80, 'Prefers weekend morning slots')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Seed Data: Leads (with followup_date for Receptionist Reminder System)
INSERT INTO leads (id, branch_id, name, phone, email, source, status, notes, followup_date) VALUES
(1, 1, 'Ananya Panday', '9811223344', 'ananya@gmail.com', 'Instagram Ads', 'New', 'Inquired about Keratin Hair Treatment', CURRENT_DATE),
(2, 1, 'Varun Dhawan', '9811223345', 'varun@gmail.com', 'Walk-in', 'Contacted', 'Scheduled call back for bridal package', CURRENT_DATE - INTERVAL '1 day'),
(3, 2, 'Kiara Advani', '9811223346', 'kiara@gmail.com', 'Website Portal', 'Converted', 'Booked Gold Facial appointment', CURRENT_DATE + INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, followup_date = EXCLUDED.followup_date;

-- Seed Data: Appointments
INSERT INTO appointments (id, branch_id, customer_id, stylist_id, service_id, appointment_date, appointment_time, status, total_amount, notes) VALUES
(101, 1, 1, 1, 1, '2026-09-07', '14:30', 'Scheduled', 350.00, 'Classic Haircut slot'),
(102, 1, 2, 2, 3, '2026-09-07', '16:00', 'In-Progress', 1200.00, 'Royal Gold Facial'),
(103, 2, 3, 3, 4, '2026-09-08', '11:00', 'Completed', 3500.00, 'Keratin Hair Smoothing')
ON CONFLICT (id) DO UPDATE SET notes = EXCLUDED.notes;

-- Table: service_categories (Dynamic Categories)
CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data: Service Categories
INSERT INTO service_categories (id, name, description) VALUES
(1, 'Hair', 'Haircuts, styling, and hair treatments'),
(2, 'Beard', 'Beard shaping, trimming, and grooming'),
(3, 'Facial', 'Skin care, facials, and clean-up treatments'),
(4, 'Hair Spa', 'Deep conditioning hair spa and treatments'),
(5, 'Color', 'Hair coloring, highlights, and touch-ups'),
(6, 'Packages & Combos', 'Bundled special discount combos')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Reset PostgreSQL auto-increment sequences after seed insert
SELECT setval(pg_get_serial_sequence('branches', 'id'), COALESCE((SELECT MAX(id) FROM branches), 1));
SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE((SELECT MAX(id) FROM roles), 1));
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('service_categories', 'id'), COALESCE((SELECT MAX(id) FROM service_categories), 1));
SELECT setval(pg_get_serial_sequence('services', 'id'), COALESCE((SELECT MAX(id) FROM services), 1));
SELECT setval(pg_get_serial_sequence('packages', 'id'), COALESCE((SELECT MAX(id) FROM packages), 1));
SELECT setval(pg_get_serial_sequence('stylists', 'id'), COALESCE((SELECT MAX(id) FROM stylists), 1));
SELECT setval(pg_get_serial_sequence('customers', 'id'), COALESCE((SELECT MAX(id) FROM customers), 1));
SELECT setval(pg_get_serial_sequence('leads', 'id'), COALESCE((SELECT MAX(id) FROM leads), 1));
SELECT setval(pg_get_serial_sequence('appointments', 'id'), COALESCE((SELECT MAX(id) FROM appointments), 1));
SELECT setval(pg_get_serial_sequence('bills', 'id'), COALESCE((SELECT MAX(id) FROM bills), 1));

