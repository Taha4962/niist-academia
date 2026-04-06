const db = require('../config/db');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// ---------------------------------------------
// FACULTY MANAGEMENT
// ---------------------------------------------

const getFaculty = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT f.*, u.email, u.is_active,
      COUNT(sa.sa_id) as subject_count
      FROM faculty f
      JOIN users u ON f.user_id = u.user_id
      LEFT JOIN subject_assignments sa ON f.faculty_id = sa.faculty_id
      GROUP BY f.faculty_id, u.email, u.is_active
      ORDER BY f.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addFaculty = async (req, res) => {
  try {
    const { name, employee_id, phone, email, designation, is_hod } = req.body;

    const emailCheck = await db.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) return res.status(400).json({ message: 'Email already exists' });

    const empCheck = await db.query('SELECT faculty_id FROM faculty WHERE employee_id = $1', [employee_id]);
    if (empCheck.rows.length > 0) return res.status(400).json({ message: 'Employee ID already exists' });

    const rawPassword = `NIIST@${employee_id}`;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    await db.query('BEGIN');
    
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, role, is_active)
       VALUES ($1, $2, 'faculty', true) RETURNING user_id`,
      [email, hash]
    );
    const userId = userResult.rows[0].user_id;

    const facResult = await db.query(
      `INSERT INTO faculty (user_id, employee_id, name, phone, designation, is_hod)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, employee_id, name, phone, designation, is_hod || false]
    );

    await db.query('COMMIT');
    res.json({ message: 'Faculty added successfully', faculty: facResult.rows[0] });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, designation, is_hod } = req.body;
    const { rows } = await db.query(
      `UPDATE faculty SET name=$1, designation=$2, is_hod=$3 WHERE faculty_id=$4 RETURNING *`,
      [name, designation, is_hod, id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Faculty not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deactivateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows: targetRows } = await db.query('SELECT user_id FROM faculty WHERE faculty_id = $1', [id]);
    if (targetRows.length === 0) return res.status(404).json({ message: 'Faculty not found' });
    if (targetRows[0].user_id === req.user.user_id) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    await db.query(
      `UPDATE users SET is_active = false WHERE user_id = $1`,
      [targetRows[0].user_id]
    );
    res.json({ message: 'Faculty deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const activateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: targetRows } = await db.query('SELECT user_id FROM faculty WHERE faculty_id = $1', [id]);
    if (targetRows.length === 0) return res.status(404).json({ message: 'Faculty not found' });
    
    await db.query(
      `UPDATE users SET is_active = true WHERE user_id = $1`,
      [targetRows[0].user_id]
    );
    res.json({ message: 'Faculty activated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFacultyLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT * FROM login_logs 
       WHERE user_id = (SELECT user_id FROM faculty WHERE faculty_id = $1)
       ORDER BY logged_at DESC LIMIT 50`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------
// STUDENT MANAGEMENT
// ---------------------------------------------

const getStudents = async (req, res) => {
  try {
    const { session_id } = req.query;
    let query = `
      SELECT s.*, b.branch_name, ses.session_name,
      u.is_active, u.is_first_login
      FROM students s
      JOIN branches b ON s.branch_id = b.branch_id
      JOIN sessions ses ON s.session_id = ses.session_id
      JOIN users u ON s.user_id = u.user_id
    `;
    const params = [];
    if (session_id) {
      query += ` WHERE s.session_id = $1`;
      params.push(session_id);
    }
    query += ` ORDER BY s.enrollment_no`;
    
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT s.*, b.branch_name, ses.session_name, u.is_active
       FROM students s
       JOIN branches b ON s.branch_id = b.branch_id
       JOIN sessions ses ON s.session_id = ses.session_id
       JOIN users u ON s.user_id = u.user_id
       WHERE s.student_id = $1`, [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    
    const parentRes = await db.query('SELECT * FROM student_parents WHERE student_id = $1', [id]);
    const student = rows[0];
    student.parents = parentRes.rows[0] || null;
    
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const bulkUploadStudents = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path), req.file.originalname);
    
    form.append('session_id', req.body.session_id || "1");
    form.append('branch_id', req.body.branch_id || "1");

    const aiRes = await axios.post(`${aiUrl}/ai/bulk/upload`, form, {
      headers: form.getHeaders(),
    });

    const students = aiRes.data.students || [];
    let successCount = 0;
    let failedCount = 0;
    let errors = [];

    for (const st of students) {
      try {
        await db.query('BEGIN');
        const enrollCheck = await db.query('SELECT student_id FROM students WHERE enrollment_no = $1', [st.enrollment_no]);
        if (enrollCheck.rows.length > 0) {
          throw new Error(`Enrollment ${st.enrollment_no} already exists`);
        }

        const passSuffix = st.enrollment_no.slice(-4);
        const rawPassword = `NIIST@${passSuffix}`;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(rawPassword, salt);

        const email = st.email || `${st.enrollment_no.toLowerCase()}@student.niist.ac.in`;

        const userRes = await db.query(
          `INSERT INTO users (email, password_hash, role, is_active, is_first_login)
           VALUES ($1, $2, 'student', true, true) RETURNING user_id`,
          [email, hash]
        );
        const userId = userRes.rows[0].user_id;

        const stuRes = await db.query(
          `INSERT INTO students (user_id, enrollment_no, name, phone, session_id, branch_id, current_semester, gender)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING student_id`,
          [userId, st.enrollment_no, st.name, st.phone, st.session_id || req.body.session_id || 1, st.branch_id || 1, st.semester || 1, st.gender || 'Unknown']
        );

        if (st.father_name || st.mother_name) {
          await db.query(`INSERT INTO student_parents (student_id, father_name, father_phone, mother_name, mother_phone)
                          VALUES ($1, $2, $3, $4, $5)`, 
            [stuRes.rows[0].student_id, st.father_name, st.father_phone, st.mother_name, st.mother_phone]);
        }
        await db.query('COMMIT');
        successCount++;
      } catch (e) {
        await db.query('ROLLBACK');
        failedCount++;
        errors.push({ enrollment: st.enrollment_no, reason: e.message });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ success: successCount, failed: failedCount, errors });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Bulk upload failed: ' + err.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, enrollment_no, phone, email, dob, gender, cgpa, address, 
      blood_group, admission_year, current_semester, session_id, branch_id, is_active 
    } = req.body;
    
    await db.query('BEGIN');
    
    // Update student fields
    await db.query(
      `UPDATE students SET 
         name=COALESCE($1, name), 
         enrollment_no=COALESCE($2, enrollment_no), 
         phone=COALESCE($3, phone),
         email=COALESCE($4, email),
         dob=COALESCE($5, dob),
         gender=COALESCE($6, gender),
         cgpa=COALESCE($7, cgpa), 
         address=COALESCE($8, address), 
         blood_group=COALESCE($9, blood_group), 
         admission_year=COALESCE($10, admission_year),
         current_semester=COALESCE($11, current_semester),
         session_id=COALESCE($12, session_id),
         branch_id=COALESCE($13, branch_id)
       WHERE student_id=$14`,
      [name, enrollment_no, phone, email, dob, gender, cgpa, address, blood_group, admission_year, current_semester, session_id, branch_id, id]
    );
    
    // Update linked user table (email, is_active)
    if (email !== undefined || is_active !== undefined) {
      const studentRes = await db.query('SELECT user_id FROM students WHERE student_id = $1', [id]);
      if (studentRes.rows.length > 0) {
        const userId = studentRes.rows[0].user_id;
        
        let userQuery = 'UPDATE users SET ';
        let userParams = [];
        let pIndex = 1;
        
        if (email !== undefined) {
          userQuery += `email = $${pIndex}, `;
          userParams.push(email);
          pIndex++;
        }
        if (is_active !== undefined) {
          userQuery += `is_active = $${pIndex}, `;
          userParams.push(is_active);
          pIndex++;
        }
        
        // Remove trailing comma and space
        userQuery = userQuery.slice(0, -2);
        userQuery += ` WHERE user_id = $${pIndex}`;
        userParams.push(userId);
        
        await db.query(userQuery, userParams);
      }
    }
    
    await db.query('COMMIT');
    
    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------
// SUBJECTS & ASSIGNMENTS
// ---------------------------------------------

const getSubjects = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.*, 
       (SELECT COUNT(sa_id) FROM subject_assignments WHERE subject_id = s.subject_id) as assigned_count
       FROM subjects s WHERE branch_id = 1 ORDER BY semester, subject_name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addSubject = async (req, res) => {
  try {
    const { subject_name, subject_code, semester } = req.body;
    const { rows } = await db.query(
      `INSERT INTO subjects (branch_id, subject_name, subject_code, semester)
       VALUES (1, $1, $2, $3) RETURNING *`,
      [subject_name, subject_code, semester]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Subject code already exists' });
    res.status(500).json({ message: err.message });
  }
};

const getSubjectAssignments = async (req, res) => {
  try {
    const { session_id, semester } = req.query;
    let query = `
      SELECT sa.*, s.subject_name, s.subject_code, s.semester,
      f.name as faculty_name, f.employee_id, ses.session_name
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN faculty f ON sa.faculty_id = f.faculty_id
      JOIN sessions ses ON sa.session_id = ses.session_id
      WHERE sa.session_id = $1
    `;
    const params = [session_id || 1];
    if (semester && semester !== 'all') {
      query += ` AND s.semester = $2`;
      params.push(semester);
    }
    
    query += ` ORDER BY s.semester, s.subject_name`;
    
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const assignSubject = async (req, res) => {
  try {
    const { subject_id, faculty_id, session_id } = req.body;
    
    const check = await db.query(
      'SELECT sa_id FROM subject_assignments WHERE subject_id=$1 AND session_id=$2',
      [subject_id, session_id]
    );
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Subject is already assigned to a faculty for this session' });
    }

    const { rows } = await db.query(
      `INSERT INTO subject_assignments (subject_id, faculty_id, session_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [subject_id, faculty_id, session_id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removeSubjectAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM subject_assignments WHERE sa_id = $1', [id]);
    res.json({ message: 'Assignment removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/hod/students/search
const searchStudents = async (req, res) => {
  try {
    const { q, session_id } = req.query;
    const { rows } = await db.query(`
      SELECT s.student_id, s.name, s.enrollment_no, s.email, s.phone, s.current_semester,
      ses.session_name, b.branch_name
      FROM students s
      JOIN sessions ses ON s.session_id = ses.session_id
      JOIN branches b ON s.branch_id = b.branch_id
      WHERE (
        LOWER(s.name) LIKE LOWER('%' || $1 || '%')
        OR s.enrollment_no LIKE '%' || $1 || '%'
        OR LOWER(s.email) LIKE LOWER('%' || $1 || '%')
      )
      AND ($2::int IS NULL OR s.session_id = $2)
      ORDER BY s.enrollment_no
      LIMIT 20
    `, [q || '', session_id ? parseInt(session_id) : null]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/hod/login-logs
const getLoginLogs = async (req, res) => {
  try {
    const { role, status, from_date, to_date, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows } = await db.query(`
      SELECT ll.*, u.email, u.role,
      CASE WHEN u.role = 'faculty' THEN f.name ELSE s.name END as user_name
      FROM login_logs ll
      JOIN users u ON ll.user_id = u.user_id
      LEFT JOIN faculty f ON f.user_id = u.user_id
      LEFT JOIN students s ON s.user_id = u.user_id
      WHERE ($1::text IS NULL OR u.role = $1)
      AND ($2::text IS NULL OR ll.status = $2)
      AND ($3::date IS NULL OR ll.logged_at >= $3::date)
      AND ($4::date IS NULL OR ll.logged_at <= ($4::date + INTERVAL '1 day'))
      AND ($5::text IS NULL OR LOWER(u.email) LIKE LOWER('%' || $5 || '%'))
      ORDER BY ll.logged_at DESC
      LIMIT $6 OFFSET $7
    `, [role || null, status || null, from_date || null, to_date || null, search || null, limit, offset]);

    const countRes = await db.query(`
      SELECT COUNT(*) FROM login_logs ll JOIN users u ON ll.user_id = u.user_id
      WHERE ($1::text IS NULL OR u.role = $1) AND ($2::text IS NULL OR ll.status = $2)
    `, [role || null, status || null]);

    res.json({ logs: rows, total: parseInt(countRes.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/hod/stats
const getDashboardStats = async (req, res) => {
  try {
    const [studRes, facRes, belowRes, pendRes, projRes, missRes] = await Promise.all([
      db.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE u.is_active) as active FROM students s JOIN users u ON s.user_id = u.user_id`),
      db.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE u.is_active) as active FROM faculty f JOIN users u ON f.user_id = u.user_id`),
      db.query(`
        SELECT COUNT(DISTINCT a.student_id) FROM attendance a
        GROUP BY a.student_id, a.subject_id, a.session_id
        HAVING (COUNT(*) FILTER (WHERE a.status = 'present')::float / COUNT(*)) * 100 < 75
      `),
      db.query(`SELECT COUNT(*) FROM assignment_submissions WHERE status IN ('submitted','resubmitted')`),
      db.query(`SELECT COUNT(DISTINCT pt.team_id) as teams, COUNT(DISTINCT p.project_id) as projects FROM projects p LEFT JOIN project_teams pt ON pt.project_id = p.project_id WHERE p.is_enabled = true`),
      db.query(`SELECT COUNT(*) FROM project_milestones WHERE status = 'pending' AND deadline < NOW()`),
    ]);

    res.json({
      students: { total: parseInt(studRes.rows[0].total), active: parseInt(studRes.rows[0].active) },
      faculty: { total: parseInt(facRes.rows[0].total), active: parseInt(facRes.rows[0].active) },
      below_attendance: belowRes.rows.length,
      pending_submissions: parseInt(pendRes.rows[0].count),
      projects: { teams: parseInt(projRes.rows[0].teams), projects: parseInt(projRes.rows[0].projects) },
      missed_milestones: parseInt(missRes.rows[0].count),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/hod/attendance-distribution
const getAttendanceDistribution = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        COUNT(CASE WHEN pct >= 75 THEN 1 END) as good,
        COUNT(CASE WHEN pct >= 65 AND pct < 75 THEN 1 END) as warning,
        COUNT(CASE WHEN pct < 65 THEN 1 END) as critical
      FROM (
        SELECT student_id, 
        ROUND((COUNT(*) FILTER (WHERE status = 'present')::numeric / NULLIF(COUNT(*),0)) * 100, 1) as pct
        FROM attendance GROUP BY student_id
      ) sub
    `);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/hod/marks-distribution
const getMarksDistribution = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT ses.session_name,
      ROUND(AVG(COALESCE(m.mst1_marks,0)), 1) as avg_mst1,
      ROUND(AVG(COALESCE(m.mst2_marks,0)), 1) as avg_mst2,
      ROUND(AVG(COALESCE(m.internal_marks,0)), 1) as avg_internal
      FROM marks m
      JOIN sessions ses ON m.session_id = ses.session_id
      GROUP BY ses.session_id, ses.session_name
      ORDER BY ses.start_year DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/hod/session-comparison
const getSessionComparison = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT ses.session_id, ses.session_name, ses.start_year,
      COUNT(DISTINCT s.student_id) as student_count,
      ROUND(AVG(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100, 1) as avg_attendance,
      ROUND(AVG((COALESCE(m.mst1_marks,0) + COALESCE(m.mst2_marks,0)) / 2.0), 1) as avg_marks,
      COUNT(DISTINCT CASE WHEN sub.status = 'approved' THEN sub.submission_id END) as approved_subs,
      COUNT(DISTINCT sub.submission_id) as total_subs
      FROM sessions ses
      LEFT JOIN students s ON s.session_id = ses.session_id
      LEFT JOIN attendance a ON a.student_id = s.student_id
      LEFT JOIN marks m ON m.student_id = s.student_id
      LEFT JOIN assignment_submissions sub ON sub.student_id = s.student_id
      GROUP BY ses.session_id
      ORDER BY ses.start_year DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getFaculty,
  addFaculty,
  updateFaculty,
  deactivateFaculty,
  activateFaculty,
  getFacultyLogs,
  getStudents,
  getStudentById,
  bulkUploadStudents,
  updateStudent,
  getSubjects,
  addSubject,
  getSubjectAssignments,
  assignSubject,
  removeSubjectAssignment,
  searchStudents,
  getLoginLogs,
  getDashboardStats,
  getAttendanceDistribution,
  getMarksDistribution,
  getSessionComparison,
};
