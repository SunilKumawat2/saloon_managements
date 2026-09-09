import { pool } from '../config/db.js';

class ServiceModel {
  // ─── STANDALONE SERVICES ───
  static async findAllServices() {
    const query = `
      SELECT * FROM services 
      ORDER BY id ASC;
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  static async findServiceById(id) {
    const query = `SELECT * FROM services WHERE id = $1;`;
    const res = await pool.query(query, [id]);
    return res.rows[0];
  }

  static async createService(serviceData) {
    const { name, category, description, price, duration_minutes, buffer_time_minutes, commission_rate, is_active } = serviceData;
    const query = `
      INSERT INTO services (name, category, description, price, duration_minutes, buffer_time_minutes, commission_rate, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      name,
      category || 'Hair',
      description || '',
      price,
      duration_minutes || 30,
      buffer_time_minutes || 15,
      commission_rate || 10.00,
      is_active !== undefined ? is_active : true
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async updateService(id, serviceData) {
    const { name, category, description, price, duration_minutes, buffer_time_minutes, commission_rate, is_active } = serviceData;
    const query = `
      UPDATE services
      SET name = COALESCE($1, name),
          category = COALESCE($2, category),
          description = COALESCE($3, description),
          price = COALESCE($4, price),
          duration_minutes = COALESCE($5, duration_minutes),
          buffer_time_minutes = COALESCE($6, buffer_time_minutes),
          commission_rate = COALESCE($7, commission_rate),
          is_active = COALESCE($8, is_active)
      WHERE id = $9
      RETURNING *;
    `;
    const values = [name, category, description, price, duration_minutes, buffer_time_minutes, commission_rate, is_active, id];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async deleteService(id) {
    const query = `DELETE FROM services WHERE id = $1 RETURNING *;`;
    const res = await pool.query(query, [id]);
    return res.rows[0];
  }

  // ─── BUNDLED COMBO PACKAGES ───
  static async findAllPackages() {
    const query = `
      SELECT * FROM packages 
      ORDER BY id ASC;
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  static async createPackage(packageData) {
    const { name, category, description, package_price, standalone_price, discount_percentage, validity_days, is_active, service_ids } = packageData;
    const query = `
      INSERT INTO packages (name, category, description, package_price, standalone_price, discount_percentage, validity_days, is_active, service_ids)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      name,
      category || 'Combo Package',
      description || '',
      package_price,
      standalone_price || package_price,
      discount_percentage || 0,
      validity_days || 30,
      is_active !== undefined ? is_active : true,
      JSON.stringify(service_ids || [])
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async updatePackage(id, packageData) {
    const { name, category, description, package_price, standalone_price, discount_percentage, validity_days, is_active, service_ids } = packageData;
    const query = `
      UPDATE packages
      SET name = COALESCE($1, name),
          category = COALESCE($2, category),
          description = COALESCE($3, description),
          package_price = COALESCE($4, package_price),
          standalone_price = COALESCE($5, standalone_price),
          discount_percentage = COALESCE($6, discount_percentage),
          validity_days = COALESCE($7, validity_days),
          is_active = COALESCE($8, is_active),
          service_ids = COALESCE($9, service_ids)
      WHERE id = $10
      RETURNING *;
    `;
    const values = [
      name, category, description, package_price, standalone_price,
      discount_percentage, validity_days, is_active,
      service_ids ? JSON.stringify(service_ids) : null,
      id
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async deletePackage(id) {
    const query = `DELETE FROM packages WHERE id = $1 RETURNING *;`;
    const res = await pool.query(query, [id]);
    return res.rows[0];
  }
}

export default ServiceModel;
