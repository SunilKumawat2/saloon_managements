import { pool } from '../config/db.js';

class ServiceModel {
  // ─── STANDALONE SERVICES ───
  static async findAllServices(options = {}) {
    try {
      const page = Math.max(1, parseInt(options.page || '1'));
      const limit = options.limit && options.limit !== 'all' ? parseInt(options.limit) : null;
      const search = options.search ? String(options.search).trim() : '';
      const category = options.category ? String(options.category).trim() : '';
      const branchId = options.branch_id;
      const currentUser = options.currentUser || null;

      let baseSql = 'FROM services s LEFT JOIN branches b ON s.branch_id = b.id';
      const whereConditions = [];
      const queryParams = [];

      // Multi-tenant Scoping for Services
      if (currentUser) {
        const roleStr = String(currentUser.role || currentUser.role_name || '').trim().toLowerCase();
        const isSuper = currentUser.is_super_admin === true || currentUser.email === 'admin@saloon.com' || roleStr === 'super admin' || roleStr === 'superadmin';
        const isOwner = !isSuper && (roleStr === 'admin' || roleStr === 'owner' || roleStr === 'salon admin' || currentUser.role_id === 1);

        if (isOwner) {
          queryParams.push(currentUser.id);
          const uidParam = `$${queryParams.length}`;
          whereConditions.push(`(b.admin_id = ${uidParam} OR b.created_by_user_id = ${uidParam} OR s.branch_id IN (SELECT id FROM branches WHERE admin_id = ${uidParam} OR created_by_user_id = ${uidParam}))`);
        } else if (!isSuper) {
          if (currentUser.branch_id) {
            queryParams.push(currentUser.branch_id);
            whereConditions.push(`s.branch_id = $${queryParams.length}`);
          } else {
            whereConditions.push(`1 = 0`);
          }
        }
      }

      if (search) {
        queryParams.push(`%${search}%`);
        whereConditions.push(`(s.name ILIKE $${queryParams.length} OR s.category ILIKE $${queryParams.length} OR s.description ILIKE $${queryParams.length})`);
      }

      if (category && category !== 'All' && category !== 'Packages & Combos') {
        queryParams.push(category);
        whereConditions.push(`s.category ILIKE $${queryParams.length}`);
      }

      if (branchId && branchId !== 'all') {
        queryParams.push(parseInt(branchId));
        whereConditions.push(`s.branch_id = $${queryParams.length}`);
      }

      if (whereConditions.length > 0) {
        baseSql += ' WHERE ' + whereConditions.join(' AND ');
      }

      const countRes = await pool.query(`SELECT COUNT(DISTINCT s.id) ${baseSql}`, queryParams);
      const total = parseInt(countRes.rows[0]?.count || '0');

      let selectSql = `SELECT s.*, b.name AS branch_name ${baseSql} ORDER BY s.id ASC`;

      if (limit && limit > 0) {
        const offset = (page - 1) * limit;
        const pageParams = [...queryParams, limit, offset];
        selectSql += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        const dataRes = await pool.query(selectSql, pageParams);
        let rows = (dataRes.rows && dataRes.rows.length > 0) ? dataRes.rows : [];

        return {
          data: rows,
          pagination: {
            total: total || rows.length,
            page,
            limit,
            totalPages: Math.ceil((total || rows.length) / limit) || 1
          }
        };
      }

      const dataRes = await pool.query(selectSql, queryParams);
      return dataRes.rows;
    } catch (err) {
      return [];
    }
  }

  static async findServiceById(id) {
    const query = `SELECT * FROM services WHERE id = $1;`;
    const res = await pool.query(query, [id]);
    return res.rows[0];
  }

  static async createService(serviceData) {
    const { name, category, description, price, duration_minutes, buffer_time_minutes, commission_rate, is_active, branch_id } = serviceData;
    const query = `
      INSERT INTO services (name, category, description, price, duration_minutes, buffer_time_minutes, commission_rate, is_active, branch_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
      is_active !== undefined ? is_active : true,
      branch_id ? parseInt(branch_id) : null
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async updateService(id, serviceData) {
    const { name, category, description, price, duration_minutes, buffer_time_minutes, commission_rate, is_active, branch_id } = serviceData;
    const query = `
      UPDATE services
      SET name = COALESCE($1, name),
          category = COALESCE($2, category),
          description = COALESCE($3, description),
          price = COALESCE($4, price),
          duration_minutes = COALESCE($5, duration_minutes),
          buffer_time_minutes = COALESCE($6, buffer_time_minutes),
          commission_rate = COALESCE($7, commission_rate),
          is_active = COALESCE($8, is_active),
          branch_id = COALESCE($9, branch_id)
      WHERE id = $10
      RETURNING *;
    `;
    const values = [name, category, description, price, duration_minutes, buffer_time_minutes, commission_rate, is_active, branch_id, id];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async deleteService(id) {
    try {
      const query = `DELETE FROM services WHERE id = $1 RETURNING *;`;
      const res = await pool.query(query, [id]);
      return res.rows[0];
    } catch (err) {
      if (err.code === '23503') {
        // Soft delete: mark as inactive if linked to historical appointments/bills
        const softQuery = `UPDATE services SET is_active = false WHERE id = $1 RETURNING *;`;
        const res = await pool.query(softQuery, [id]);
        return res.rows[0];
      }
      throw err;
    }
  }

  // ─── BUNDLED COMBO PACKAGES ───
  static async findAllPackages(options = {}) {
    try {
      const page = Math.max(1, parseInt(options.page || '1'));
      const limit = options.limit && options.limit !== 'all' ? parseInt(options.limit) : null;
      const search = options.search ? String(options.search).trim() : '';
      const branchId = options.branch_id;
      const currentUser = options.currentUser || null;

      let baseSql = 'FROM packages p LEFT JOIN branches b ON p.branch_id = b.id';
      const whereConditions = [];
      const queryParams = [];

      // Multi-tenant Scoping for Packages
      if (currentUser) {
        const roleStr = String(currentUser.role || currentUser.role_name || '').trim().toLowerCase();
        const isSuper = currentUser.is_super_admin === true || currentUser.email === 'admin@saloon.com' || roleStr === 'super admin' || roleStr === 'superadmin';
        const isOwner = !isSuper && (roleStr === 'admin' || roleStr === 'owner' || roleStr === 'salon admin' || currentUser.role_id === 1);

        if (isOwner) {
          queryParams.push(currentUser.id);
          const uidParam = `$${queryParams.length}`;
          whereConditions.push(`(b.admin_id = ${uidParam} OR b.created_by_user_id = ${uidParam} OR p.branch_id IN (SELECT id FROM branches WHERE admin_id = ${uidParam} OR created_by_user_id = ${uidParam}))`);
        } else if (!isSuper) {
          if (currentUser.branch_id) {
            queryParams.push(currentUser.branch_id);
            whereConditions.push(`p.branch_id = $${queryParams.length}`);
          } else {
            whereConditions.push(`1 = 0`);
          }
        }
      }

      if (search) {
        queryParams.push(`%${search}%`);
        whereConditions.push(`(p.name ILIKE $${queryParams.length} OR p.category ILIKE $${queryParams.length} OR p.description ILIKE $${queryParams.length})`);
      }

      if (branchId && branchId !== 'all') {
        queryParams.push(parseInt(branchId));
        whereConditions.push(`p.branch_id = $${queryParams.length}`);
      }

      if (whereConditions.length > 0) {
        baseSql += ' WHERE ' + whereConditions.join(' AND ');
      }

      const countRes = await pool.query(`SELECT COUNT(DISTINCT p.id) ${baseSql}`, queryParams);
      const total = parseInt(countRes.rows[0]?.count || '0');

      let selectSql = `SELECT p.*, b.name AS branch_name ${baseSql} ORDER BY p.id ASC`;

      if (limit && limit > 0) {
        const offset = (page - 1) * limit;
        const pageParams = [...queryParams, limit, offset];
        selectSql += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        const dataRes = await pool.query(selectSql, pageParams);
        let rows = (dataRes.rows && dataRes.rows.length > 0) ? dataRes.rows : [];

        return {
          data: rows,
          pagination: {
            total: total || rows.length,
            page,
            limit,
            totalPages: Math.ceil((total || rows.length) / limit) || 1
          }
        };
      }

      const dataRes = await pool.query(selectSql, queryParams);
      return dataRes.rows;
    } catch (err) {
      return [];
    }
  }

  static async createPackage(packageData) {
    const { name, category, description, package_price, standalone_price, discount_percentage, validity_days, valid_until, is_active, service_ids, branch_id } = packageData;
    const query = `
      INSERT INTO packages (name, category, description, package_price, standalone_price, discount_percentage, validity_days, valid_until, is_active, service_ids, branch_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
      valid_until || null,
      is_active !== undefined ? is_active : true,
      JSON.stringify(service_ids || []),
      branch_id ? parseInt(branch_id) : null
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async updatePackage(id, packageData) {
    const { name, category, description, package_price, standalone_price, discount_percentage, validity_days, valid_until, is_active, service_ids } = packageData;
    const query = `
      UPDATE packages
      SET name = COALESCE($1, name),
          category = COALESCE($2, category),
          description = COALESCE($3, description),
          package_price = COALESCE($4, package_price),
          standalone_price = COALESCE($5, standalone_price),
          discount_percentage = COALESCE($6, discount_percentage),
          validity_days = COALESCE($7, validity_days),
          valid_until = COALESCE($8, valid_until),
          is_active = COALESCE($9, is_active),
          service_ids = COALESCE($10, service_ids)
      WHERE id = $11
      RETURNING *;
    `;
    const values = [
      name, category, description, package_price, standalone_price,
      discount_percentage, validity_days, valid_until || null, is_active,
      service_ids ? JSON.stringify(service_ids) : null,
      id
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async deletePackage(id) {
    try {
      const query = `DELETE FROM packages WHERE id = $1 RETURNING *;`;
      const res = await pool.query(query, [id]);
      return res.rows[0];
    } catch (err) {
      if (err.code === '23503') {
        const softQuery = `UPDATE packages SET is_active = false WHERE id = $1 RETURNING *;`;
        const res = await pool.query(softQuery, [id]);
        return res.rows[0];
      }
      throw err;
    }
  }
}

export default ServiceModel;
