const db = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/faculty/subjects
const getFacultySubjects = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT sa.sa_id, s.subject_id, s.subject_name, s.subject_code,
      s.semester, ses.session_name, ses.session_id,
      COUNT(DISTINCT st.student_id) as student_count,
      COUNT(DISTINCT st2.topic_id) as total_topics,
      COUNT(DISTINCT st2.topic_id) FILTER (WHERE st2.is_completed = true) as completed_topics
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN sessions ses ON sa.session_id = ses.session_id
      JOIN faculty f ON sa.faculty_id = f.faculty_id
      JOIN users u ON f.user_id = u.user_id
      LEFT JOIN students st ON st.session_id = ses.session_id
      LEFT JOIN syllabus_topics st2 ON st2.subject_id = s.subject_id
      WHERE f.user_id = $1 AND u.is_active = true
      GROUP BY sa.sa_id, s.subject_id, s.subject_name, s.subject_code, s.semester, ses.session_name, ses.session_id
      ORDER BY s.semester, s.subject_name
    `, [req.user.user_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/faculty/subjects/:sa_id/topics
const getSyllabusTopics = async (req, res) => {
  try {
    const { sa_id } = req.params;
    const { rows } = await db.query(`
      SELECT * FROM syllabus_topics
      WHERE subject_id = (SELECT subject_id FROM subject_assignments WHERE sa_id = $1)
      ORDER BY unit_no, topic_id
    `, [sa_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/faculty/subjects/:sa_id/topics
const addSyllabusTopic = async (req, res) => {
  try {
    const { sa_id } = req.params;
    const { topic_name, unit_no } = req.body;
    
    const { rows } = await db.query(`
      INSERT INTO syllabus_topics (subject_id, topic_name, unit_no, is_completed, completed_at)
      VALUES ((SELECT subject_id FROM subject_assignments WHERE sa_id = $1), $2, $3, false, null)
      RETURNING *
    `, [sa_id, topic_name, unit_no]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/faculty/topics/:topic_id/complete
const toggleTopicComplete = async (req, res) => {
  try {
    const { topic_id } = req.params;
    const { is_completed } = req.body;

    let rows;
    if (is_completed) {
      const result = await db.query(`
        UPDATE syllabus_topics SET is_completed = true, completed_at = NOW() 
        WHERE topic_id = $1 RETURNING *
      `, [topic_id]);
      rows = result.rows;
    } else {
      const result = await db.query(`
        UPDATE syllabus_topics SET is_completed = false, completed_at = NULL 
        WHERE topic_id = $1 RETURNING *
      `, [topic_id]);
      rows = result.rows;
    }

    if (rows.length === 0) return res.status(404).json({ message: 'Topic not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/faculty/topics/:topic_id
const deleteTopic = async (req, res) => {
  try {
    const { topic_id } = req.params;
    const check = await db.query('SELECT is_completed FROM syllabus_topics WHERE topic_id = $1', [topic_id]);
    if (check.rows.length === 0) return res.status(404).json({ message: 'Topic not found' });
    if (check.rows[0].is_completed) return res.status(400).json({ message: 'Cannot delete a completed topic' });

    await db.query('DELETE FROM syllabus_topics WHERE topic_id = $1', [topic_id]);
    res.json({ message: 'Success' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const faculty_id = req.user.faculty_id

    const result = await db.query(`
      SELECT
        f.faculty_id,
        f.employee_id,
        f.name,
        f.phone,
        f.designation,
        f.is_hod,
        f.profile_photo,
        f.created_at,
        u.email,
        u.is_active,
        COUNT(DISTINCT sa.sa_id)
          as subjects_assigned,
        COUNT(DISTINCT n.note_id)
          as notes_uploaded,
        COUNT(DISTINCT ca.ca_id)
          as assignments_created,
        COUNT(DISTINCT no2.notice_id)
          as notices_posted
      FROM faculty f
      JOIN users u
        ON f.user_id = u.user_id
      LEFT JOIN subject_assignments sa
        ON sa.faculty_id = f.faculty_id
      LEFT JOIN notes n
        ON n.sa_id = sa.sa_id
      LEFT JOIN class_assignments ca
        ON ca.sa_id = sa.sa_id
      LEFT JOIN notices no2
        ON no2.faculty_id = f.faculty_id
      WHERE f.faculty_id = $1
      GROUP BY f.faculty_id, u.email,
      u.is_active
    `, [faculty_id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Profile not found'
      })
    }

    res.json({ profile: result.rows[0] })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}

const updateMyProfile = async (req, res) => {
  try {
    const faculty_id = req.user.faculty_id
    const user_id = req.user.user_id
    const { phone, email } = req.body

    if (!phone && !email) {
      return res.status(400).json({
        error: 'Provide phone or email to update'
      })
    }

    if (email) {
      const emailCheck = await db.query(`
        SELECT user_id FROM users
        WHERE email = $1
        AND user_id != $2
      `, [email, user_id])

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          error: 'Email already in use by another account'
        })
      }
    }

    if (phone) {
      await db.query(`
        UPDATE faculty
        SET phone = $1
        WHERE faculty_id = $2
      `, [phone, faculty_id])
    }

    if (email) {
      await db.query(`
        UPDATE users
        SET email = $1
        WHERE user_id = $2
      `, [email, user_id])
    }

    const updated = await db.query(`
      SELECT f.faculty_id, f.employee_id,
      f.name, f.phone, f.designation,
      f.is_hod, f.profile_photo, u.email
      FROM faculty f
      JOIN users u ON f.user_id = u.user_id
      WHERE f.faculty_id = $1
    `, [faculty_id])

    res.json({
      message: 'Profile updated successfully',
      profile: updated.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}

const updateHodProfile = async (req, res) => {
  try {
    const faculty_id = req.user.faculty_id
    const user_id = req.user.user_id
    const { name, designation, phone, email } = req.body

    if (!name && !designation && !phone && !email) {
      return res.status(400).json({
        error: 'Provide at least one field to update'
      })
    }

    if (email) {
      const emailCheck = await db.query(`
        SELECT user_id FROM users
        WHERE email = $1
        AND user_id != $2
      `, [email, user_id])

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          error: 'Email already in use by another account'
        })
      }
    }

    const facultyUpdates = []
    const facultyValues = []
    let facultyIndex = 1

    if (name) {
      facultyUpdates.push(`name = $${facultyIndex}`)
      facultyValues.push(name)
      facultyIndex++
    }
    if (designation) {
      facultyUpdates.push(`designation = $${facultyIndex}`)
      facultyValues.push(designation)
      facultyIndex++
    }
    if (phone) {
      facultyUpdates.push(`phone = $${facultyIndex}`)
      facultyValues.push(phone)
      facultyIndex++
    }

    if (facultyUpdates.length > 0) {
      facultyValues.push(faculty_id)
      await db.query(`
        UPDATE faculty SET
        ${facultyUpdates.join(', ')}
        WHERE faculty_id = $${facultyIndex}
      `, facultyValues)
    }

    if (email) {
      await db.query(`
        UPDATE users SET email = $1
        WHERE user_id = $2
      `, [email, user_id])
    }

    const updated = await db.query(`
      SELECT f.faculty_id, f.employee_id,
      f.name, f.phone, f.designation,
      f.is_hod, f.profile_photo, u.email, f.created_at
      FROM faculty f
      JOIN users u ON f.user_id = u.user_id
      WHERE f.faculty_id = $1
    `, [faculty_id])

    res.json({
      message: 'Profile updated successfully',
      profile: updated.rows[0]
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}

const uploadProfilePhoto = async (req, res) => {
  try {
    const faculty_id = req.user.faculty_id

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      })
    }

    const photoUrl = `/uploads/${req.file.filename}`

    await db.query(`
      UPDATE faculty
      SET profile_photo = $1
      WHERE faculty_id = $2
    `, [photoUrl, faculty_id])

    res.json({
      message: 'Profile photo updated',
      photo_url: photoUrl
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}

const changeOwnPassword = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Both current and new password are required' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const userResult = await db.query('SELECT password_hash FROM users WHERE user_id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    if (current_password === new_password) {
      return res.status(400).json({ error: 'New password must be different from current' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [hashedPassword, user_id]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSubjectStudents = async (req, res) => {
  try {
    const { sa_id } = req.params;
    const faculty_id = req.user.faculty_id;

    const saCheck = await db.query(`
      SELECT sa.*, s.subject_name,
      s.subject_code, ses.session_name,
      s.semester
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN sessions ses ON sa.session_id = ses.session_id
      WHERE sa.sa_id = $1 AND sa.faculty_id = $2
    `, [sa_id, faculty_id]);

    if (saCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not assigned to this subject' });
    }

    const sa = saCheck.rows[0];

    const students = await db.query(`
      SELECT
        s.student_id, s.enrollment_no, s.name, s.phone,
        s.email, s.blood_group, s.profile_photo,
        s.current_semester, s.cgpa,
        ROUND(
          COUNT(a.attendance_id) FILTER (WHERE a.status = 'present') * 100.0 /
          NULLIF(COUNT(a.attendance_id), 0)
        , 2) as attendance_percentage,
        COUNT(a.attendance_id) as total_classes,
        COUNT(a.attendance_id) FILTER (WHERE a.status = 'present') as present_count,
        COUNT(a.attendance_id) FILTER (WHERE a.status = 'absent') as absent_count
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.student_id
        AND a.subject_id = $1 AND a.session_id = $2
      WHERE s.session_id = $2
      GROUP BY s.student_id
      ORDER BY s.enrollment_no
    `, [sa.subject_id, sa.session_id]);

    res.json({ subject: sa, students: students.rows, total: students.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStudentDetailForFaculty = async (req, res) => {
  try {
    const { student_id } = req.params;
    const faculty_id = req.user.faculty_id;

    const studentResult = await db.query(`
      SELECT s.*, b.branch_name, ses.session_name
      FROM students s
      JOIN branches b ON s.branch_id = b.branch_id
      JOIN sessions ses ON s.session_id = ses.session_id
      WHERE s.student_id = $1
    `, [student_id]);

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = studentResult.rows[0];

    const parents = await db.query(`SELECT * FROM student_parents WHERE student_id = $1 ORDER BY relation`, [student_id]);

    const attendance = await db.query(`
      SELECT sub.subject_name, sub.subject_code,
        COUNT(a.attendance_id) as total_classes,
        COUNT(a.attendance_id) FILTER (WHERE a.status='present') as present_count,
        COUNT(a.attendance_id) FILTER (WHERE a.status='absent') as absent_count,
        COUNT(a.attendance_id) FILTER (WHERE a.status='late') as late_count,
        ROUND(COUNT(a.attendance_id) FILTER (WHERE a.status='present') * 100.0 / NULLIF(COUNT(a.attendance_id),0), 2) as percentage
      FROM subject_assignments sa
      JOIN subjects sub ON sa.subject_id = sub.subject_id
      LEFT JOIN attendance a ON a.student_id = $1 AND a.subject_id = sa.subject_id AND a.session_id = sa.session_id
      WHERE sa.faculty_id = $2 AND sa.session_id = $3
      GROUP BY sub.subject_id, sub.subject_name, sub.subject_code
    `, [student_id, faculty_id, student.session_id]);

    const marks = await db.query(`
      SELECT sub.subject_name, sub.subject_code,
        m.mst1_marks, m.mst1_max, m.mst1_absent,
        m.mst2_marks, m.mst2_max, m.mst2_absent,
        m.internal_marks, m.internal_max, m.internal_absent,
        m.practical_marks, m.practical_max, m.practical_absent
      FROM subject_assignments sa
      JOIN subjects sub ON sa.subject_id = sub.subject_id
      LEFT JOIN marks m ON m.student_id = $1 AND m.subject_id = sa.subject_id AND m.session_id = sa.session_id
      WHERE sa.faculty_id = $2 AND sa.session_id = $3
    `, [student_id, faculty_id, student.session_id]);

    res.json({ student, parents: parents.rows, attendance: attendance.rows, marks: marks.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getFacultySubjects,
  getSyllabusTopics,
  addSyllabusTopic,
  toggleTopicComplete,
  deleteTopic,
  getMyProfile,
  updateMyProfile,
  updateHodProfile,
  uploadProfilePhoto,
  changeOwnPassword,
  getSubjectStudents,
  getStudentDetailForFaculty
};
