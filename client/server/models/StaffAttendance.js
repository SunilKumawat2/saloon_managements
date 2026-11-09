import { pool } from '../config/db.js';

let DEMO_ATTENDANCE = [];

export const StaffAttendanceModel = {
  // Get all attendance records for a specific date with dynamic database pagination and filtering
  async getByDate({ date, branch_id, admin_id, page = 1, limit = 0, search = '', status = 'ALL' }) {
    try {
      let whereClauses = ['a.attendance_date = $1'];
      const params = [date];
      let paramIndex = 2;

      if (branch_id && branch_id !== 'all' && branch_id !== 'ALL') {
        whereClauses.push(`a.branch_id = $${paramIndex++}`);
        params.push(parseInt(branch_id));
      }

      if (admin_id) {
        whereClauses.push(`(a.admin_id = $${paramIndex++} OR a.admin_id IS NULL)`);
        params.push(admin_id);
      }

      if (search && search.trim() !== '') {
        whereClauses.push(`(a.staff_name ILIKE $${paramIndex} OR a.role ILIKE $${paramIndex})`);
        params.push(`%${search.trim()}%`);
        paramIndex++;
      }

      if (status && status !== 'ALL') {
        if (status === 'AVAILABLE') {
          whereClauses.push(`(a.check_in_time IS NOT NULL AND a.check_out_time IS NULL AND a.status NOT IN ('Absent', 'On Leave', 'Short Leave'))`);
        } else if (status === 'UNAVAILABLE') {
          whereClauses.push(`(a.check_in_time IS NULL OR a.check_out_time IS NOT NULL OR a.status IN ('Absent', 'On Leave', 'Short Leave'))`);
        } else if (status === 'Unmarked') {
          whereClauses.push(`a.status IS NULL`);
        } else {
          whereClauses.push(`a.status = $${paramIndex++}`);
          params.push(status);
        }
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Count query for total matching records
      const countSql = `
        SELECT COUNT(*) as total_count
        FROM staff_attendance a
        ${whereSql}
      `;
      const countRes = await pool.query(countSql, params);
      const totalCount = parseInt(countRes.rows[0]?.total_count || 0);

      // Data query with ordering
      let dataSql = `
        SELECT a.*,
               b.name as branch_name
        FROM staff_attendance a
        LEFT JOIN branches b ON a.branch_id = b.id
        ${whereSql}
        ORDER BY a.staff_name ASC, a.id ASC
      `;

      const numLimit = parseInt(limit) || 0;
      const numPage = Math.max(1, parseInt(page) || 1);

      if (numLimit > 0) {
        const offset = (numPage - 1) * numLimit;
        dataSql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(numLimit, offset);
      }

      const { rows } = await pool.query(dataSql, params);
      const totalPages = numLimit > 0 ? Math.ceil(totalCount / numLimit) : 1;

      return {
        records: rows || [],
        pagination: {
          total: totalCount,
          page: numPage,
          limit: numLimit,
          totalPages,
          hasNext: numLimit > 0 ? numPage < totalPages : false,
          hasPrev: numPage > 1
        }
      };
    } catch (err) {
      console.warn('StaffAttendanceModel.getByDate fallback:', err.message);
      let filtered = DEMO_ATTENDANCE.filter(a => a.attendance_date === date);
      if (branch_id && branch_id !== 'all' && branch_id !== 'ALL') {
        filtered = filtered.filter(a => String(a.branch_id) === String(branch_id));
      }
      return {
        records: filtered,
        pagination: {
          total: filtered.length,
          page: 1,
          limit: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };
    }
  },

  // Mark or update single staff attendance (Upsert)
  async mark({
    staff_id,
    staff_name,
    role = 'Staff Stylist',
    branch_id = null,
    admin_id = null,
    attendance_date,
    status = 'Present',
    check_in_time = null,
    check_out_time = null,
    working_hours = 0.0,
    overtime_hours = 0.0,
    notes = '',
    marked_by = null
  }) {
    try {
      // Calculate working hours automatically if both in and out times exist
      let calculatedHours = working_hours || 0.0;
      const cleanInTime = check_in_time && String(check_in_time).trim() !== '' ? String(check_in_time).trim() : null;
      const cleanOutTime = check_out_time && String(check_out_time).trim() !== '' ? String(check_out_time).trim() : null;

      if (cleanInTime && cleanOutTime && status !== 'Absent' && status !== 'On Leave') {
        try {
          const [inH, inM] = cleanInTime.split(':').map(Number);
          const [outH, outM] = cleanOutTime.split(':').map(Number);
          if (!isNaN(inH) && !isNaN(outH)) {
            let diffMins = (outH * 60 + (outM || 0)) - (inH * 60 + (inM || 0));
            if (diffMins > 0) {
              calculatedHours = parseFloat((diffMins / 60).toFixed(2));
            }
          }
        } catch (e) {}
      } else if (!cleanOutTime) {
        calculatedHours = 0.0;
      }

      const sql = `
        INSERT INTO staff_attendance (
          staff_id, staff_name, role, branch_id, admin_id,
          attendance_date, status, check_in_time, check_out_time,
          working_hours, overtime_hours, notes, marked_by, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        ON CONFLICT (staff_id, attendance_date)
        DO UPDATE SET
          staff_name = EXCLUDED.staff_name,
          role = EXCLUDED.role,
          branch_id = COALESCE(EXCLUDED.branch_id, staff_attendance.branch_id),
          status = EXCLUDED.status,
          check_in_time = EXCLUDED.check_in_time,
          check_out_time = EXCLUDED.check_out_time,
          working_hours = EXCLUDED.working_hours,
          overtime_hours = EXCLUDED.overtime_hours,
          notes = EXCLUDED.notes,
          marked_by = EXCLUDED.marked_by,
          updated_at = NOW()
        RETURNING *;
      `;

      const params = [
        parseInt(staff_id),
        staff_name || 'Staff Member',
        role,
        branch_id ? parseInt(branch_id) : null,
        admin_id || null,
        attendance_date,
        status,
        cleanInTime,
        cleanOutTime,
        calculatedHours,
        overtime_hours || 0.0,
        notes || '',
        marked_by || null
      ];

      const { rows } = await pool.query(sql, params);
      return rows[0];
    } catch (err) {
      console.error('StaffAttendanceModel.mark error:', err.message);
      // Memory fallback
      const existingIdx = DEMO_ATTENDANCE.findIndex(
        a => String(a.staff_id) === String(staff_id) && a.attendance_date === attendance_date
      );
      const rec = {
        id: existingIdx >= 0 ? DEMO_ATTENDANCE[existingIdx].id : Date.now(),
        staff_id: parseInt(staff_id),
        staff_name,
        role,
        branch_id: branch_id ? parseInt(branch_id) : null,
        admin_id,
        attendance_date,
        status,
        check_in_time,
        check_out_time,
        working_hours,
        overtime_hours,
        notes,
        marked_by,
        updated_at: new Date().toISOString()
      };
      if (existingIdx >= 0) {
        DEMO_ATTENDANCE[existingIdx] = rec;
      } else {
        DEMO_ATTENDANCE.push(rec);
      }
      return rec;
    }
  },

  // Bulk mark attendance (e.g. "Mark All Present")
  async bulkMark({
    staffList = [],
    attendance_date,
    status = 'Present',
    check_in_time = '09:30',
    check_out_time = '18:30',
    branch_id = null,
    admin_id = null,
    marked_by = null
  }) {
    const results = [];
    for (const staff of staffList) {
      const saved = await this.mark({
        staff_id: staff.id || staff.staff_id,
        staff_name: staff.name || staff.staff_name,
        role: staff.role || staff.specialization || 'Staff Stylist',
        branch_id: staff.branch_id || branch_id,
        admin_id: staff.admin_id || admin_id,
        attendance_date,
        status,
        check_in_time,
        check_out_time,
        working_hours: 9.0,
        overtime_hours: 0.0,
        notes: staff.notes || 'Bulk marked by manager',
        marked_by
      });
      results.push(saved);
    }
    return results;
  },

  // Get monthly attendance matrix & summary
  async getMonthlySummary({ month, year, branch_id, admin_id }) {
    try {
      let sql = `
        SELECT a.*,
               b.name as branch_name
        FROM staff_attendance a
        LEFT JOIN branches b ON a.branch_id = b.id
        WHERE EXTRACT(MONTH FROM a.attendance_date) = $1
          AND EXTRACT(YEAR FROM a.attendance_date) = $2
      `;
      const params = [parseInt(month), parseInt(year)];
      let paramIndex = 3;

      if (branch_id && branch_id !== 'all' && branch_id !== 'ALL') {
        sql += ` AND a.branch_id = $${paramIndex++}`;
        params.push(parseInt(branch_id));
      }

      if (admin_id) {
        sql += ` AND (a.admin_id = $${paramIndex++} OR a.admin_id IS NULL)`;
        params.push(admin_id);
      }

      sql += ` ORDER BY a.attendance_date ASC, a.staff_name ASC`;

      const { rows } = await pool.query(sql, params);
      return rows || [];
    } catch (err) {
      console.warn('StaffAttendanceModel.getMonthlySummary fallback:', err.message);
      return DEMO_ATTENDANCE.filter(a => {
        if (!a.attendance_date) return false;
        const d = new Date(a.attendance_date);
        return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year);
      });
    }
  },

  // Delete attendance record
  async delete(id) {
    try {
      const sql = 'DELETE FROM staff_attendance WHERE id = $1 RETURNING *';
      const { rows } = await pool.query(sql, [parseInt(id)]);
      return rows[0] || null;
    } catch (err) {
      DEMO_ATTENDANCE = DEMO_ATTENDANCE.filter(a => String(a.id) !== String(id));
      return { id, deleted: true };
    }
  }
};
