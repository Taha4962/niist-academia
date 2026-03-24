const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { enrollment_no, email, password } = req.body;

    // Student login flow
    if (enrollment_no) {
      const studentResult = await db.query(
        'SELECT * FROM students WHERE enrollment_no = $1',
        [enrollment_no]
      );
      if (studentResult.rows.length === 0) {
        await logLogin(null, req.ip, 'failed');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const student = studentResult.rows[0];

      const userResult = await db.query(
        'SELECT * FROM users WHERE user_id = $1',
        [student.user_id]
      );
      if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
        await logLogin(student.user_id, req.ip, 'failed');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const user = userResult.rows[0];

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        await logLogin(user.user_id, req.ip, 'failed');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        {
          user_id: user.user_id,
          role: 'student',
          is_hod: false,
          is_first_login: user.is_first_login,
          student_id: student.student_id,
          name: student.name,
          enrollment_no: student.enrollment_no,
          session_id: student.session_id,
          current_semester: student.current_semester,
          branch_id: student.branch_id,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      await logLogin(user.user_id, req.ip, 'success');

      return res.json({
        token,
        user: {
          user_id: user.user_id,
          role: 'student',
          is_hod: false,
          is_first_login: user.is_first_login,
          student_id: student.student_id,
          name: student.name,
          enrollment_no: student.enrollment_no,
          session_id: student.session_id,
          current_semester: student.current_semester,
          branch_id: student.branch_id,
        },
      });
    }

    // Faculty login flow
    if (email) {
      const userResult = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
        await logLogin(null, req.ip, 'failed');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const user = userResult.rows[0];

      const facultyResult = await db.query(
        'SELECT * FROM faculty WHERE user_id = $1',
        [user.user_id]
      );
      if (facultyResult.rows.length === 0) {
        await logLogin(user.user_id, req.ip, 'failed');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const faculty = facultyResult.rows[0];

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        await logLogin(user.user_id, req.ip, 'failed');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        {
          user_id: user.user_id,
          role: 'faculty',
          is_hod: faculty.is_hod,
          is_first_login: user.is_first_login,
          faculty_id: faculty.faculty_id,
          name: faculty.name,
          employee_id: faculty.employee_id,
          designation: faculty.designation,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      await logLogin(user.user_id, req.ip, 'success');

      return res.json({
        token,
        user: {
          user_id: user.user_id,
          role: 'faculty',
          is_hod: faculty.is_hod,
          is_first_login: user.is_first_login,
          faculty_id: faculty.faculty_id,
          name: faculty.name,
          employee_id: faculty.employee_id,
          designation: faculty.designation,
        },
      });
    }

    return res.status(400).json({ message: 'Email or enrollment number is required' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.user_id;

    const userResult = await db.query('SELECT * FROM users WHERE user_id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await db.query(
      'UPDATE users SET password_hash = $1, is_first_login = false WHERE user_id = $2',
      [hashedPassword, userId]
    );

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error during password change' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    return res.json({ user: req.user });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Helper: log login attempt
const logLogin = async (userId, ipAddress, status) => {
  try {
    await db.query(
      'INSERT INTO login_logs (user_id, ip_address, status) VALUES ($1, $2, $3)',
      [userId, ipAddress, status]
    );
  } catch (error) {
    console.error('Login log error:', error);
  }
};

module.exports = { login, changePassword, getMe };
