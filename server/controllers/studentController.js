const db = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/student/subjects
const getStudentSubjects = async (req, res) => {
  try {
    // Get student details first
    const studentRes = await db.query('SELECT session_id, current_semester FROM students WHERE user_id = $1', [req.user.user_id]);
    if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
    const student = studentRes.rows[0];

    const { rows } = await db.query(`
      SELECT sa.sa_id, s.subject_name, s.subject_code, s.semester, f.name as faculty_name,
      COUNT(st.topic_id) as total_topics,
      COUNT(st.topic_id) FILTER (WHERE st.is_completed = true) as completed_topics
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN faculty f ON sa.faculty_id = f.faculty_id
      LEFT JOIN syllabus_topics st ON st.subject_id = s.subject_id
      WHERE sa.session_id = $1 AND s.semester = $2
      GROUP BY sa.sa_id, s.subject_name, s.subject_code, s.semester, f.name
    `, [student.session_id, student.current_semester]);
    
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/student/profile
const getStudentProfile = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT s.*, b.branch_name, b.branch_code,
             ses.session_name, ses.start_year, ses.end_year,
             u.email as user_email, u.created_at as account_created,
             (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.student_id AND a.status = 'present') as total_present,
             (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.student_id) as total_classes,
             (SELECT COUNT(*) FROM assignment_submissions asub WHERE asub.student_id = s.student_id AND asub.status = 'approved') as assignments_done
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      JOIN branches b ON s.branch_id = b.branch_id
      JOIN sessions ses ON s.session_id = ses.session_id
      WHERE s.user_id = $1
    `, [req.user.user_id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });

    // Fetch parents too
    const parents = await db.query(
      'SELECT * FROM student_parents WHERE student_id = $1',
      [rows[0].student_id]
    );

    res.json({ profile: rows[0], parents: parents.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/student/profile
const updateStudentProfile = async (req, res) => {
  try {
    const { phone, address, blood_group } = req.body;
    const { rows } = await db.query(`
      UPDATE students SET phone = $1, address = $2, blood_group = $3
      WHERE user_id = $4 RETURNING *
    `, [phone, address, blood_group, req.user.user_id]);
    res.json({ profile: rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/student/profile/password
const changeStudentPassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userRes = await db.query('SELECT password_hash FROM users WHERE user_id = $1', [req.user.user_id]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(current_password, userRes.rows[0].password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [hash, req.user.user_id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getStudentSubjects,
  getStudentProfile,
  updateStudentProfile,
  changeStudentPassword
};
