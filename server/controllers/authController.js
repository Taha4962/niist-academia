const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Helper: log login attempt
const logLogin = async (userId, ipAddress, status) => {
  try {
    const validUserId = userId ? userId : null;
    await db.query(
      'INSERT INTO login_logs (user_id, ip_address, status) VALUES ($1, $2, $3)',
      [validUserId, ipAddress, status]
    );
  } catch (error) {
    console.error('Login log error:', error);
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { enrollment_no, email, password } = req.body;

    // MODE 1 — Student Login
    if (enrollment_no) {
      const result = await db.query(
        `SELECT s.*, u.password_hash, u.is_active, u.user_id 
         FROM students s
         JOIN users u ON s.user_id = u.user_id
         WHERE s.enrollment_no = $1`,
        [enrollment_no]
      );

      if (result.rows.length === 0) {
        await logLogin(null, req.ip, 'failed');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const student = result.rows[0];

      if (student.is_active === false) {
        await logLogin(student.user_id, req.ip, 'failed');
        return res.status(401).json({ message: 'Account deactivated' });
      }

      const isMatch = await bcrypt.compare(password, student.password_hash);
      if (!isMatch) {
        await logLogin(student.user_id, req.ip, 'failed');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      await logLogin(student.user_id, req.ip, 'success');

      const token = jwt.sign(
        {
          user_id: student.user_id,
          role: 'student',
          is_hod: false,
          student_id: student.student_id,
          name: student.name,
          enrollment_no: student.enrollment_no,
          session_id: student.session_id,
          current_semester: student.current_semester,
          branch_id: student.branch_id
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({ token, user: jwt.decode(token) });
    }

    // MODE 2 — Faculty Login
    if (email) {
      const result = await db.query(
        `SELECT f.*, u.password_hash, u.is_active, u.user_id 
         FROM faculty f
         JOIN users u ON f.user_id = u.user_id
         WHERE u.email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        await logLogin(null, req.ip, 'failed');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const faculty = result.rows[0];

      if (faculty.is_active === false) {
        await logLogin(faculty.user_id, req.ip, 'failed');
        return res.status(401).json({ message: 'Account deactivated' });
      }

      const isMatch = await bcrypt.compare(password, faculty.password_hash);
      if (!isMatch) {
        await logLogin(faculty.user_id, req.ip, 'failed');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      await logLogin(faculty.user_id, req.ip, 'success');

      const token = jwt.sign(
        {
          user_id: faculty.user_id,
          role: 'faculty',
          is_hod: faculty.is_hod,
          faculty_id: faculty.faculty_id,
          name: faculty.name,
          employee_id: faculty.employee_id,
          designation: faculty.designation
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({ token, user: jwt.decode(token) });
    }

    return res.status(400).json({ message: 'Missing email or enrollment_no' });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const { user_id, role } = req.user;

    if (role === 'student') {
      const { rows } = await db.query(
        `SELECT s.*, b.branch_name, b.branch_code, ses.session_name, ses.start_year, ses.end_year, u.email as user_email, u.is_active, u.created_at
         FROM students s
         JOIN users u ON s.user_id = u.user_id
         JOIN branches b ON s.branch_id = b.branch_id
         JOIN sessions ses ON s.session_id = ses.session_id
         WHERE s.user_id = $1`,
        [user_id]
      );
      if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
      return res.json(rows[0]);
    } else if (role === 'faculty') {
      const { rows } = await db.query(
        `SELECT f.*, u.email as user_email, u.is_active, u.created_at
         FROM faculty f
         JOIN users u ON f.user_id = u.user_id
         WHERE f.user_id = $1`,
        [user_id]
      );
      if (rows.length === 0) return res.status(404).json({ message: 'Faculty not found' });
      return res.json(rows[0]);
    }

    return res.status(400).json({ message: 'Invalid role' });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  login,
  getMe
};
