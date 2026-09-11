import { pool } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMasterCloudMigration() {
  console.log('🚀 Starting Master Cloud Database Migration & Seeding...\n');

  try {
    // 1. Base Schema Setup
    const schemaPath = path.join(__dirname, '../config/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      console.log('📦 Executing Base Schema & Default Seeds (Users, Services, Packages, Stylists)...');
      await pool.query(sql);
      console.log('✅ Base Schema Executed Successfully!\n');
    }

    // 2. Additional Modules Migration Scripts
    const migrations = [
      { name: 'Module 5 (Marketing & CRM)', file: 'migrate_m5.js' },
      { name: 'Module 6 (Inventory & Stock)', file: 'migrate_m6.js' },
      { name: 'Module 7 (Loyalty & Membership)', file: 'migrate_m7.js' },
      { name: 'Module 8 (Booking & Calendar)', file: 'migrate_m8.js' },
      { name: 'Module 10 (System Settings & RBAC)', file: 'migrate_m10.js' },
      { name: 'Razorpay Gateway Integration', file: 'migrate_razorpay.js' }
    ];

    for (const item of migrations) {
      const filePath = path.join(__dirname, item.file);
      if (fs.existsSync(filePath)) {
        console.log(`📦 Running ${item.name} (${item.file})...`);
        const content = fs.readFileSync(filePath, 'utf8');
        // If file contains raw query execution or module code, run via import
        await import(`file://${filePath}`);
        console.log(`✅ ${item.name} Migrated!`);
      }
    }

    console.log('\n🎉 ALL MASTER TABLES & SEED DATA MIGRATED TO CLOUD DATABASE SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Cloud Migration Error:', err);
    process.exit(1);
  }
}

runMasterCloudMigration();
