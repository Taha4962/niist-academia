const db = require('../config/db');
const { createAutoNotice } = require('../utils/noticeHelper');

// GET /api/attendance/:sa_id/:date
const getAttendanceForMarking = async (req, res) => {
  try {
    const { sa_id, date } = req.params;

    // Check if holiday
    const hCheck = await db.query(`
      SELECT title FROM holidays 
      WHERE date = $1 AND (session_id = (SELECT session_id FROM subject_assignments WHERE sa_id = $2) OR session_id IS NULL)
    `, [date, sa_id]);

    if (hCheck.rows.length > 0) {
      return res.json({ is_holiday: true, holiday_name: hCheck.rows[0].title, students: [] });
    }

    // Get all students for this sa_id's session
    const { rows } = await db.query(`
      SELECT s.student_id, s.name, s.enrollment_no, a.attendance_id, a.status
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.student_id 
        AND a.subject_id = (SELECT subject_id FROM subject_assignments WHERE sa_id = $1)
        AND a.date = $2
      WHERE s.session_id = (SELECT session_id FROM subject_assignments WHERE sa_id = $1)
      ORDER BY s.enrollment_no
    `, [sa_id, date]);

    const already_marked = rows.some(r => r.attendance_id !== null);

    res.json({ is_holiday: false, already_marked, students: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/attendance/mark
const markBulkAttendance = async (req, res) => {
  try {
    const { sa_id, date, attendance } = req.body;
    
    // Check future date
    if (new Date(date) > new Date()) return res.status(400).json({ message: 'Cannot mark future attendance' });

    // Check holiday
    const hCheck = await db.query(`
      SELECT title FROM holidays 
      WHERE date = $1 AND (session_id = (SELECT session_id FROM subject_assignments WHERE sa_id = $2) OR session_id IS NULL)
    `, [date, sa_id]);
    if (hCheck.rows.length > 0) return res.status(400).json({ message: 'Cannot mark attendance on a holiday' });

    // Ensure we have active assignment
    const saInfo = await db.query('SELECT subject_id, session_id FROM subject_assignments WHERE sa_id = $1', [sa_id]);
    if(saInfo.rows.length === 0) return res.status(404).json({message: 'Assignment not found'});
    const { subject_id, session_id } = saInfo.rows[0];

    // Check if already marked for today (to prevent double insert bugs)
    const existingCheck = await db.query('SELECT attendance_id FROM attendance WHERE subject_id = $1 AND date = $2 LIMIT 1', [subject_id, date]);
    
    // Begin Transaction
    await db.query('BEGIN');
    
    let markedCount = 0;
    
    if (existingCheck.rows.length > 0) {
       // We allow updates if it's the exact same day for faculty (handled in UI via PUT or here via upsert)
       for (const rec of attendance) {
         await db.query(`
           UPDATE attendance SET status = $1 
           WHERE student_id = $2 AND subject_id = $3 AND date = $4
         `, [rec.status, rec.student_id, subject_id, date]);
         markedCount++;
       }
    } else {
       // Insert new
       for (const rec of attendance) {
         await db.query(`
           INSERT INTO attendance (student_id, subject_id, session_id, date, status)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING
         `, [rec.student_id, subject_id, session_id, date, rec.status]);
         markedCount++;
       }
    }

    // Auto calculate & generate notices for <75%
    let alertsCount = 0;
    const { rows: stats } = await db.query(`
      SELECT student_id,
      ROUND(COUNT(*) FILTER (WHERE status='present') * 100.0 / NULLIF(COUNT(*), 0), 2) as percentage,
      COUNT(*) as total_classes,
      COUNT(*) FILTER (WHERE status='present') as present_count
      FROM attendance
      WHERE subject_id = $1
      GROUP BY student_id
    `, [subject_id]);

    const subjNameRes = await db.query('SELECT subject_name FROM subjects WHERE subject_id = $1', [subject_id]);
    const subjectName = subjNameRes.rows[0]?.subject_name || 'Subject';

    for (const st of stats) {
      if (st.percentage < 75) {
         const canMiss = Math.floor(parseInt(st.total_classes) * 0.25);
         const needed = Math.ceil((0.75 * parseInt(st.total_classes) - parseInt(st.present_count)) / 0.25);
         const requiredMore = needed > 0 ? needed : 1;
         
         // Insert notice for this student
         await createAutoNotice({
           faculty_id: req.user.user_id,
           session_id: session_id,
           subject_id: subject_id,
           target_type: 'session',
           title: `⚠️ Low Attendance Alert — ${subjectName}`,
           content: `Your attendance in ${subjectName} has dropped to ${st.percentage}%. Minimum required is 75%. You need ${requiredMore} more consecutive present classes to reach the safe zone.`,
           ref_type: 'attendance',
           ref_id: st.student_id,
           expires_at: null,
           pool: db
         });
         alertsCount++;
      }
    }

    await db.query('COMMIT');
    res.json({ marked: markedCount, alerts: alertsCount });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/attendance/:attendance_id
const editAttendance = async (req, res) => {
  try {
    const { attendance_id } = req.params;
    const { status } = req.body;
    
    const attRes = await db.query('SELECT date FROM attendance WHERE attendance_id = $1', [attendance_id]);
    if (attRes.rows.length === 0) return res.status(404).json({ message: 'Record not found' });
    
    const attDate = new Date(attRes.rows[0].date).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    // If faculty and date != today, block
    if (!req.user.is_hod && attDate !== today) {
      return res.status(403).json({ message: 'Faculty cannot edit past attendance. Contact HOD.' });
    }

    const { rows } = await db.query('UPDATE attendance SET status = $1 WHERE attendance_id = $2 RETURNING *', [status, attendance_id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/attendance/summary/:student_id
const getStudentAttendanceSummary = async (req, res) => {
  try {
    const { student_id } = req.params;
    const sessionRes = await db.query('SELECT session_id FROM students WHERE student_id = $1', [student_id]);
    if(sessionRes.rows.length === 0) return res.status(404).json({ message: 'Student not found'});

    const { rows } = await db.query(`
      SELECT s.subject_id, s.subject_name, s.subject_code,
      COUNT(*) as total_classes,
      COUNT(*) FILTER (WHERE a.status='present') as present_count,
      COUNT(*) FILTER (WHERE a.status='absent') as absent_count,
      COUNT(*) FILTER (WHERE a.status='late') as late_count,
      ROUND(COUNT(*) FILTER (WHERE a.status='present') * 100.0 / NULLIF(COUNT(*), 0), 2) as percentage
      FROM attendance a
      JOIN subjects s ON a.subject_id = s.subject_id
      WHERE a.student_id = $1 AND a.session_id = $2
      GROUP BY s.subject_id, s.subject_name, s.subject_code
    `, [student_id, sessionRes.rows[0].session_id]);
    
    res.json(rows);
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/attendance/calendar/:student_id/:subject_id/:month/:year
const getAttendanceCalendar = async (req, res) => {
  try {
    const { student_id, subject_id, month, year } = req.params;
    
    const { rows: attendance } = await db.query(`
      SELECT date, status FROM attendance
      WHERE student_id = $1 AND subject_id = $2
      AND EXTRACT(MONTH FROM date) = $3 AND EXTRACT(YEAR FROM date) = $4
    `, [student_id, subject_id, month, year]);

    const { rows: holidays } = await db.query(`
      SELECT date, title FROM holidays
      WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
    `, [month, year]);

    res.json({ attendance, holidays });
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/attendance/hod/overview
const getHodOverview = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT ses.session_name, ses.session_id,
      COUNT(DISTINCT s.student_id) as total_students,
      ROUND(AVG(subquery.percentage), 2) as avg_attendance,
      COUNT(DISTINCT s.student_id) FILTER (WHERE subquery.percentage < 75) as below_75_count,
      COUNT(DISTINCT s.student_id) FILTER (WHERE subquery.percentage < 60) as critical_count
      FROM sessions ses
      JOIN students s ON s.session_id = ses.session_id
      LEFT JOIN (
        SELECT student_id, ROUND(COUNT(*) FILTER (WHERE status='present') * 100.0 / NULLIF(COUNT(*),0), 2) as percentage
        FROM attendance
        GROUP BY student_id
      ) subquery ON subquery.student_id = s.student_id
      GROUP BY ses.session_id, ses.session_name
    `);
    res.json(rows);
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAttendanceForMarking,
  markBulkAttendance,
  editAttendance,
  getStudentAttendanceSummary,
  getAttendanceCalendar,
  getHodOverview
};
