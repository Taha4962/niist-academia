const db = require('../config/db');

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

module.exports = {
  getStudentSubjects
};
