import { pool } from '../config/db.js';

function parseTimeToMinutes(tStr) {
  if (!tStr) return 540; // 09:00
  const parts = String(tStr).split(':');
  const h = parseInt(parts[0]) || 9;
  const m = parseInt(parts[1]) || 0;
  return h * 60 + m;
}

function calculateDurationMinutes(startTime, endTime) {
  if (!startTime || !endTime) return 60;
  const sMins = parseTimeToMinutes(startTime);
  const eMins = parseTimeToMinutes(endTime);
  const diff = eMins - sMins;
  return diff > 0 ? diff : 60;
}

function addMinutesToTime(timeStr, mins) {
  const startMins = parseTimeToMinutes(timeStr);
  const endTotal = (startMins + mins) % (24 * 60);
  const endH = Math.floor(endTotal / 60);
  const endM = endTotal % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

function format12Hour(h, m) {
  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

function enrichSlotRecord(r) {
  let start = r.start_time || r.slot_time;
  let end = r.end_time;
  let duration = r.duration_minutes;

  // If start is 00:00 or empty, attempt to extract from slot_name
  if ((!start || start === '00:00') && r.slot_name) {
    const match = r.slot_name.match(/(\d{1,2}:\d{2})\s*(?:AM|PM)?\s*-\s*(\d{1,2}:\d{2})/i);
    if (match) {
      start = match[1];
      end = match[2];
    }
  }

  if (!start || start === '00:00') start = '09:00';

  if (r.slot_name && (!duration || duration === 60)) {
    const dMatch = r.slot_name.match(/(\d+)\s*min/i);
    if (dMatch) duration = parseInt(dMatch[1]);
  }

  if (!duration && start && end) {
    duration = calculateDurationMinutes(start, end);
  }

  duration = duration || 60;

  if (!end || end === '00:00') {
    end = addMinutesToTime(start, duration);
  }

  let formattedDate = null;
  if (r.specific_date) {
    formattedDate = typeof r.specific_date === 'string'
      ? r.specific_date.split('T')[0].split(' ')[0]
      : new Date(r.specific_date).toISOString().split('T')[0];
  }

  return {
    ...r,
    slot_time: start,
    start_time: start,
    end_time: end,
    duration_minutes: duration,
    day_of_week: r.day_of_week || 'ALL',
    specific_date: formattedDate
  };
}

let DEMO_TIME_SLOTS = [
  { id: 1, branch_id: 1, slot_time: '09:00', start_time: '09:00', end_time: '10:00', duration_minutes: 60, slot_name: '09:00 AM - 10:00 AM (60 min)', day_of_week: 'ALL', specific_date: null, is_active: true },
  { id: 2, branch_id: 1, slot_time: '10:00', start_time: '10:00', end_time: '11:00', duration_minutes: 60, slot_name: '10:00 AM - 11:00 AM (60 min)', day_of_week: 'ALL', specific_date: null, is_active: true },
  { id: 3, branch_id: 1, slot_time: '11:00', start_time: '11:00', end_time: '12:00', duration_minutes: 60, slot_name: '11:00 AM - 12:00 PM (60 min)', day_of_week: 'ALL', specific_date: null, is_active: true },
  { id: 4, branch_id: 1, slot_time: '12:00', start_time: '12:00', end_time: '13:00', duration_minutes: 60, slot_name: '12:00 PM - 01:00 PM (60 min)', day_of_week: 'ALL', specific_date: null, is_active: true },
  { id: 5, branch_id: 1, slot_time: '13:00', start_time: '13:00', end_time: '14:00', duration_minutes: 60, slot_name: '01:00 PM - 02:00 PM (60 min)', day_of_week: 'ALL', specific_date: null, is_active: true },
  { id: 6, branch_id: 1, slot_time: '14:00', start_time: '14:00', end_time: '15:00', duration_minutes: 60, slot_name: '02:00 PM - 03:00 PM (60 min)', day_of_week: 'ALL', specific_date: null, is_active: true },
  { id: 7, branch_id: 1, slot_time: '15:00', start_time: '15:00', end_time: '16:00', duration_minutes: 60, slot_name: '03:00 PM - 04:00 PM (60 min)', day_of_week: 'ALL', specific_date: null, is_active: true },
  { id: 8, branch_id: 1, slot_time: '16:00', start_time: '16:00', end_time: '17:00', duration_minutes: 60, slot_name: '04:00 PM - 05:00 PM (60 min)', day_of_week: 'ALL', specific_date: null, is_active: true },
  { id: 9, branch_id: 1, slot_time: '17:00', start_time: '17:00', end_time: '18:00', duration_minutes: 60, slot_name: '05:00 PM - 06:00 PM (60 min)', day_of_week: 'ALL', specific_date: null, is_active: true },
  { id: 10, branch_id: 1, slot_time: '18:00', start_time: '18:00', end_time: '19:00', duration_minutes: 60, slot_name: '06:00 PM - 07:00 PM (60 min)', day_of_week: 'ALL', specific_date: null, is_active: true },
  { id: 11, branch_id: 1, slot_time: '19:00', start_time: '19:00', end_time: '20:00', duration_minutes: 60, slot_name: '07:00 PM - 08:00 PM (60 min)', day_of_week: 'ALL', specific_date: null, is_active: true },
  { id: 12, branch_id: 1, slot_time: '20:00', start_time: '20:00', end_time: '21:00', duration_minutes: 60, slot_name: '08:00 PM - 09:00 PM (60 min)', day_of_week: 'ALL', specific_date: null, is_active: true }
];

export const TimeSlotModel = {
  async findAll(options = {}) {
    try {
      let sql = `
        SELECT ts.*,
               b.name as branch_name
        FROM time_slots ts
        LEFT JOIN branches b ON ts.branch_id = b.id
      `;
      const params = [];
      const conditions = [];

      if (options.branch_id && options.branch_id !== 'all') {
        params.push(parseInt(options.branch_id));
        conditions.push(`(ts.branch_id = $${params.length} OR ts.branch_id IS NULL)`);
      }

      if (options.day_of_week && options.day_of_week !== 'ALL') {
        params.push(options.day_of_week);
        conditions.push(`(ts.day_of_week = $${params.length} OR ts.day_of_week = 'ALL')`);
      }

      if (options.specific_date) {
        params.push(options.specific_date);
        conditions.push(`(ts.specific_date = $${params.length} OR ts.specific_date IS NULL)`);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY ts.start_time ASC, ts.slot_time ASC, ts.id ASC';

      const { rows } = await pool.query(sql, params);
      if (rows && rows.length > 0) {
        return rows.map(r => enrichSlotRecord(r));
      }
      return DEMO_TIME_SLOTS.map(r => enrichSlotRecord(r));
    } catch (err) {
      console.error('TimeSlotModel.findAll error:', err.message);
      return DEMO_TIME_SLOTS.map(r => enrichSlotRecord(r));
    }
  },

  async create({ branch_id, start_time, end_time, duration_minutes, slot_time, slot_name, day_of_week = 'ALL', specific_date = null, is_active = true, admin_id, created_by_admin_id }) {
    try {
      let validBranchId = null;
      if (branch_id) {
        const checkB = await pool.query('SELECT id FROM branches WHERE id = $1', [parseInt(branch_id)]).catch(() => ({ rows: [] }));
        if (checkB.rows && checkB.rows.length > 0) {
          validBranchId = parseInt(branch_id);
        }
      }

      const effectiveStartTime = (start_time || slot_time || '09:00').trim();
      let effectiveEndTime = end_time ? end_time.trim() : null;
      let effectiveDuration = duration_minutes ? parseInt(duration_minutes) : null;

      if (!effectiveEndTime && effectiveDuration) {
        effectiveEndTime = addMinutesToTime(effectiveStartTime, effectiveDuration);
      } else if (!effectiveEndTime) {
        effectiveEndTime = addMinutesToTime(effectiveStartTime, 60);
      }

      if (!effectiveDuration) {
        effectiveDuration = calculateDurationMinutes(effectiveStartTime, effectiveEndTime);
      }

      const effectiveSlotTime = effectiveStartTime;
      const defaultName = `${effectiveStartTime} - ${effectiveEndTime} (${effectiveDuration} min)`;

      const sql = `
        INSERT INTO time_slots (branch_id, slot_time, start_time, end_time, duration_minutes, slot_name, day_of_week, specific_date, is_active, admin_id, created_by_admin_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      const params = [
        validBranchId,
        effectiveSlotTime,
        effectiveStartTime,
        effectiveEndTime,
        effectiveDuration,
        slot_name ? slot_name.trim() : defaultName,
        day_of_week || 'ALL',
        specific_date || null,
        is_active,
        admin_id ? parseInt(admin_id) : null,
        created_by_admin_id ? parseInt(created_by_admin_id) : null
      ];

      const { rows } = await pool.query(sql, params);
      const created = rows[0];

      const enriched = await pool.query(
        `SELECT ts.*, b.name as branch_name FROM time_slots ts LEFT JOIN branches b ON ts.branch_id = b.id WHERE ts.id = $1`,
        [created.id]
      ).catch(() => ({ rows: [created] }));

      return enrichSlotRecord(enriched.rows[0] || created);
    } catch (err) {
      console.error('TimeSlotModel.create error:', err.message);
      const startTime = (start_time || slot_time || '09:00').trim();
      const endTime = end_time ? end_time.trim() : addMinutesToTime(startTime, 60);
      const dur = calculateDurationMinutes(startTime, endTime);
      const newSlot = enrichSlotRecord({
        id: Date.now(),
        branch_id: branch_id ? parseInt(branch_id) : null,
        slot_time: startTime,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: dur,
        slot_name: slot_name || `${startTime} - ${endTime} (${dur} min)`,
        day_of_week: day_of_week || 'ALL',
        specific_date: specific_date || null,
        is_active: is_active !== false,
        created_at: new Date().toISOString()
      });
      DEMO_TIME_SLOTS.push(newSlot);
      return newSlot;
    }
  },

  async update(id, { branch_id, start_time, end_time, duration_minutes, slot_time, slot_name, day_of_week, specific_date, is_active }) {
    const numId = parseInt(id);
    try {
      const startTime = start_time || slot_time;
      let endTime = end_time;
      let dur = duration_minutes;

      if (startTime && endTime && !dur) {
        dur = calculateDurationMinutes(startTime, endTime);
      } else if (startTime && dur && !endTime) {
        endTime = addMinutesToTime(startTime, dur);
      }

      let formattedDate = null;
      if (specific_date) {
        formattedDate = typeof specific_date === 'string'
          ? specific_date.split('T')[0].split(' ')[0]
          : new Date(specific_date).toISOString().split('T')[0];
      }

      await pool.query(
        `UPDATE time_slots
         SET branch_id = COALESCE($1, branch_id),
             slot_time = COALESCE($2, slot_time),
             start_time = COALESCE($2, start_time),
             end_time = COALESCE($3, end_time),
             duration_minutes = COALESCE($4, duration_minutes),
             slot_name = COALESCE($5, slot_name),
             day_of_week = $6,
             specific_date = $7,
             is_active = COALESCE($8, is_active)
         WHERE id = $9`,
        [
          branch_id ? parseInt(branch_id) : null,
          startTime,
          endTime,
          dur ? parseInt(dur) : null,
          slot_name,
          day_of_week || 'ALL',
          formattedDate,
          is_active,
          numId
        ]
      );
      const enriched = await pool.query(
        `SELECT ts.*, b.name as branch_name FROM time_slots ts LEFT JOIN branches b ON ts.branch_id = b.id WHERE ts.id = $1`,
        [numId]
      ).catch(() => ({ rows: [] }));
      return enrichSlotRecord(enriched.rows[0] || { id: numId, start_time: startTime, end_time: endTime, duration_minutes: dur, slot_name, day_of_week, specific_date, is_active });
    } catch (err) {
      console.error('TimeSlotModel.update error:', err.message);
      DEMO_TIME_SLOTS = DEMO_TIME_SLOTS.map(s =>
        s.id === numId ? enrichSlotRecord({
          ...s,
          start_time: start_time || s.start_time,
          end_time: end_time || s.end_time,
          duration_minutes: duration_minutes || s.duration_minutes,
          slot_name: slot_name || s.slot_name,
          day_of_week: day_of_week || s.day_of_week,
          specific_date: specific_date !== undefined ? specific_date : s.specific_date,
          is_active: is_active !== undefined ? is_active : s.is_active
        }) : s
      );
      return DEMO_TIME_SLOTS.find(s => s.id === numId);
    }
  },

  async delete(id) {
    const numId = parseInt(id);
    try {
      await pool.query('DELETE FROM time_slots WHERE id = $1', [numId]);
      DEMO_TIME_SLOTS = DEMO_TIME_SLOTS.filter(s => s.id !== numId);
      return { deleted: true };
    } catch (err) {
      console.error('TimeSlotModel.delete error:', err.message);
      DEMO_TIME_SLOTS = DEMO_TIME_SLOTS.filter(s => s.id !== numId);
      return { deleted: true };
    }
  },

  async toggleActive(id) {
    const numId = parseInt(id);
    try {
      const current = await pool.query('SELECT is_active FROM time_slots WHERE id = $1', [numId]);
      const newVal = !current.rows[0]?.is_active;
      await pool.query('UPDATE time_slots SET is_active = $1 WHERE id = $2', [newVal, numId]);
      return { id: numId, is_active: newVal };
    } catch (err) {
      const s = DEMO_TIME_SLOTS.find(s => s.id === numId);
      if (s) s.is_active = !s.is_active;
      return { id: numId, is_active: s?.is_active };
    }
  },

  async generateRange({ branch_id, start_time = '09:00', end_time = '21:00', interval_minutes = 60, day_of_week = 'ALL', specific_date = null, admin_id, created_by_admin_id }) {
    const startMins = parseTimeToMinutes(start_time);
    const endMins = parseTimeToMinutes(end_time);
    const step = parseInt(interval_minutes) || 60;

    const generated = [];
    for (let current = startMins; current < endMins; current += step) {
      const hh = Math.floor(current / 60);
      const mm = current % 60;
      const slotStartTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      
      const slotEndTotal = current + step;
      const endH = Math.floor(slotEndTotal / 60);
      const endM = slotEndTotal % 60;
      const slotEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      const slotName = `${format12Hour(hh, mm)} - ${format12Hour(endH, endM)} (${step} min)`;

      const created = await this.create({
        branch_id,
        start_time: slotStartTime,
        end_time: slotEndTime,
        duration_minutes: step,
        slot_time: slotStartTime,
        slot_name: slotName,
        day_of_week,
        specific_date,
        is_active: true,
        admin_id,
        created_by_admin_id
      });
      generated.push(created);
    }
    return generated;
  }
};
