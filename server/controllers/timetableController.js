const db = require('../config/db');
const { createAutoNotice } = require('../utils/noticeHelper');

// GET /api/timetable/slots
const getSlots = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT ts.*, 
      (SELECT COUNT(timetable_id) FROM timetable WHERE slot_id = ts.slot_id) as in_use_count
      FROM time_slots ts ORDER BY start_time
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addSlot = async (req, res) => {
  try {
    const { start_time, end_time, label } = req.body;
    
    // Check overlap
    const overlap = await db.query(`
      SELECT slot_id FROM time_slots 
      WHERE (start_time < $2 AND end_time > $1)
    `, [start_time, end_time]);
    
    if (overlap.rows.length > 0) {
      return res.status(400).json({ message: 'Time slots cannot overlap' });
    }

    const { rows } = await db.query(
      `INSERT INTO time_slots (start_time, end_time, label) VALUES ($1, $2, $3) RETURNING *`,
      [start_time, end_time, label]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, label } = req.body;
    
    // Check overlap excluding current
    const overlap = await db.query(`
      SELECT slot_id FROM time_slots 
      WHERE (start_time < $2 AND end_time > $1) AND slot_id != $3
    `, [start_time, end_time, id]);
    
    if (overlap.rows.length > 0) {
      return res.status(400).json({ message: 'Time slots cannot overlap' });
    }

    const { rows } = await db.query(
      `UPDATE time_slots SET start_time=$1, end_time=$2, label=$3 WHERE slot_id=$4 RETURNING *`,
      [start_time, end_time, label, id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Slot not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT timetable_id FROM timetable WHERE slot_id = $1 LIMIT 1', [id]);
    if (check.rows.length > 0) return res.status(400).json({ message: 'Cannot delete slot. It is currently in use in the timetable.' });
    
    await db.query('DELETE FROM time_slots WHERE slot_id=$1', [id]);
    res.json({ message: 'Success' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------
// TIMETABLE
// ---------------------------------------------

const getTimetable = async (req, res) => {
  try {
    const { session_id, semester } = req.params;
    const { rows } = await db.query(`
      SELECT t.*, s.subject_name, s.subject_code,
      f.name as faculty_name, ts.start_time, ts.end_time, ts.label
      FROM timetable t
      JOIN subject_assignments sa ON t.sa_id = sa.sa_id
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN faculty f ON sa.faculty_id = f.faculty_id
      JOIN time_slots ts ON t.slot_id = ts.slot_id
      WHERE t.session_id = $1 AND t.semester = $2
    `, [session_id, semester]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addTimetableEntry = async (req, res) => {
  try {
    const { sa_id, slot_id, day, room_no, session_id, semester } = req.body;

    // CONFLICT CHECK
    const conflictQuery = `
      SELECT t.*, s.subject_name, ses.session_name, ts.start_time, f.name as faculty_name
      FROM timetable t
      JOIN subject_assignments sa ON t.sa_id = sa.sa_id
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN sessions ses ON t.session_id = ses.session_id
      JOIN time_slots ts ON t.slot_id = ts.slot_id
      JOIN faculty f ON sa.faculty_id = f.faculty_id
      WHERE sa.faculty_id = (SELECT faculty_id FROM subject_assignments WHERE sa_id = $1)
      AND t.slot_id = $2 AND t.day = $3
    `;
    const conflictCheck = await db.query(conflictQuery, [sa_id, slot_id, day]);

    if (conflictCheck.rows.length > 0) {
      const conflict = conflictCheck.rows[0];
      return res.status(400).json({ 
        error: 'Conflict detected', 
        conflict: {
          faculty_name: conflict.faculty_name,
          subject_name: conflict.subject_name,
          session_name: conflict.session_name,
          day: conflict.day,
          time: conflict.start_time
        }
      });
    }

    const { rows } = await db.query(
      `INSERT INTO timetable (sa_id, slot_id, day, room_no, session_id, semester, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, false) RETURNING *`,
      [sa_id, slot_id, day, room_no, session_id, semester]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteTimetableEntry = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM timetable WHERE timetable_id = $1', [id]);
    res.json({ message: 'Success' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const publishTimetable = async (req, res) => {
  try {
    const { session_id, semester } = req.body;
    
    await db.query(
      'UPDATE timetable SET is_published = true WHERE session_id = $1 AND semester = $2',
      [session_id, semester]
    );

    // Auto-notice using the helper
    const faculty_id = req.user.faculty_id;
    await createAutoNotice({
      faculty_id,
      session_id,
      subject_id: null,
      target_type: 'session',
      title: '📅 Timetable Published',
      content: `Timetable for Semester ${semester} has been published. Check the Timetable section.`,
      ref_type: 'timetable',
      ref_id: null,
      expires_at: null,
      pool: db
    });

    res.json({ message: 'Timetable published' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFacultyTimetable = async (req, res) => {
  try {
    if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Faculty access required' });
    
    const { rows } = await db.query(`
      SELECT t.*, s.subject_name, s.subject_code,
      ts.start_time, ts.end_time, ts.label, ses.session_name
      FROM timetable t
      JOIN subject_assignments sa ON t.sa_id = sa.sa_id
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN time_slots ts ON t.slot_id = ts.slot_id
      JOIN sessions ses ON t.session_id = ses.session_id
      WHERE sa.faculty_id = (SELECT faculty_id FROM faculty WHERE user_id = $1)
    `, [req.user.user_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStudentTimetable = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Student access required' });
    
    const { rows } = await db.query(`
      SELECT t.*, s.subject_name, s.subject_code, f.name as faculty_name,
      ts.start_time, ts.end_time, ts.label
      FROM timetable t
      JOIN subject_assignments sa ON t.sa_id = sa.sa_id
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN faculty f ON sa.faculty_id = f.faculty_id
      JOIN time_slots ts ON t.slot_id = ts.slot_id
      WHERE t.session_id = $1 AND t.semester = $2 AND t.is_published = true
    `, [req.user.session_id, req.user.current_semester]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getSlots,
  addSlot,
  updateSlot,
  deleteSlot,
  getTimetable,
  addTimetableEntry,
  deleteTimetableEntry,
  publishTimetable,
  getFacultyTimetable,
  getStudentTimetable
};
