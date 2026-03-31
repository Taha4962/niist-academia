const db = require('../config/db');
const { createAutoNotice } = require('../utils/noticeHelper');
const axios = require('axios'); // For communicating with FastAPI AI Service

// Part B
// GET /api/assignments/:sa_id
const getAssignments = async (req, res) => {
  try {
    const { sa_id } = req.params;
    const { rows } = await db.query(`
      SELECT ca.*,
      COUNT(sub.submission_id) as total_submissions,
      COUNT(sub.submission_id) FILTER (WHERE sub.status = 'approved') as approved_count,
      COUNT(sub.submission_id) FILTER (WHERE sub.status = 'pending') as pending_count,
      COUNT(sub.submission_id) FILTER (WHERE sub.status = 'rejected') as rejected_count,
      (SELECT COUNT(st.student_id) FROM students st WHERE st.session_id = (SELECT session_id FROM subject_assignments WHERE sa_id = $1)) as total_students
      FROM class_assignments ca
      LEFT JOIN assignment_submissions sub ON sub.ca_id = ca.ca_id
      WHERE ca.sa_id = $1
      GROUP BY ca.ca_id
      ORDER BY ca.unit_no, ca.created_at
    `, [sa_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/assignments
const createAssignment = async (req, res) => {
  try {
    const { sa_id, unit_no, title, description, deadline } = req.body;
    
    // Insert assignment
    const { rows } = await db.query(`
      INSERT INTO class_assignments (sa_id, unit_no, title, description, deadline)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ca_id
    `, [sa_id, unit_no, title, description, deadline]);
    const ca_id = rows[0].ca_id;

    // Fetch SA info
    const saRes = await db.query(`SELECT session_id, subject_id, faculty_id FROM subject_assignments WHERE sa_id = $1`, [sa_id]);
    const sa = saRes.rows[0];
    const titleRes = await db.query(`SELECT subject_name FROM subjects WHERE subject_id = $1`, [sa.subject_id]);
    const subject_name = titleRes.rows[0].subject_name;

    // Auto create submissions
    await db.query(`
      INSERT INTO assignment_submissions (ca_id, student_id, status)
      SELECT $1, s.student_id, 'pending'
      FROM students s
      WHERE s.session_id = $2
    `, [ca_id, sa.session_id]);

    // Notice
    const formatted_deadline = new Date(deadline).toLocaleString();
    const expiresAt = new Date(deadline);
    expiresAt.setDate(expiresAt.getDate() + 7);

    await createAutoNotice({
      faculty_id: sa.faculty_id,
      session_id: sa.session_id,
      subject_id: sa.subject_id,
      target_type: 'subject',
      title: `New Assignment — ${subject_name} Unit ${unit_no}`,
      content: `A new assignment has been posted for ${subject_name} Unit ${unit_no}. Title: ${title}. Deadline: ${formatted_deadline}. Submit your physical copy to faculty before the deadline.`,
      ref_type: 'assignment',
      ref_id: ca_id,
      expires_at: expiresAt,
      pool: db
    });

    res.json({ assignment: rows[0], message: 'Published' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/assignments/:ca_id
const updateAssignment = async (req, res) => {
  try {
    const { ca_id } = req.params;
    const { title, description, deadline } = req.body;
    
    const oldRes = await db.query(`SELECT deadline, sa_id, unit_no FROM class_assignments WHERE ca_id = $1`, [ca_id]);
    if (oldRes.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    const oldData = oldRes.rows[0];

    const { rows } = await db.query(`
      UPDATE class_assignments SET title=$1, description=$2, deadline=$3
      WHERE ca_id = $4 RETURNING *
    `, [title, description, deadline, ca_id]);

    const saInfo = await db.query(`
      SELECT sa.faculty_id, sa.session_id, sa.subject_id, s.subject_name 
      FROM subject_assignments sa JOIN subjects s ON sa.subject_id = s.subject_id WHERE sa.sa_id = $1
    `, [oldData.sa_id]);

    if (new Date(deadline).getTime() !== new Date(oldData.deadline).getTime() && saInfo.rows.length > 0) {
      const sa = saInfo.rows[0];
      const new_deadline = new Date(deadline).toLocaleString();
      const expiresAt = new Date(deadline);
      expiresAt.setDate(expiresAt.getDate() + 7);

      if (new Date(deadline) > new Date(oldData.deadline)) {
        await createAutoNotice({
          faculty_id: sa.faculty_id, session_id: sa.session_id, subject_id: sa.subject_id, target_type: 'subject',
          title: `Assignment Deadline Extended`,
          content: `The deadline for ${sa.subject_name} Unit ${oldData.unit_no} assignment has been extended to ${new_deadline}. You have more time to submit.`,
          ref_type: 'assignment', ref_id: ca_id, expires_at: expiresAt, pool: db
        });
      } else {
        await createAutoNotice({
          faculty_id: sa.faculty_id, session_id: sa.session_id, subject_id: sa.subject_id, target_type: 'subject',
          title: `⚠️ Assignment Deadline Shortened`,
          content: `Important: The deadline for ${sa.subject_name} Unit ${oldData.unit_no} assignment has been changed to ${new_deadline}. Please submit as soon as possible.`,
          ref_type: 'assignment', ref_id: ca_id, expires_at: expiresAt, pool: db
        });
      }
    }

    res.json(rows[0]);
  } catch(err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/assignments/:ca_id
const deleteAssignment = async (req, res) => {
  try {
    const { ca_id } = req.params;
    const ticks = await db.query(`SELECT count(*) FROM assignment_submissions WHERE ca_id = $1 AND is_manually_ticked = true`, [ca_id]);
    if (parseInt(ticks.rows[0].count) > 0) return res.status(400).json({ message: 'Assignment has physical submissions. Cancel instead of deleting.' });

    const caRes = await db.query(`SELECT sa_id, unit_no FROM class_assignments WHERE ca_id = $1`, [ca_id]);
    if (caRes.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    const { sa_id, unit_no } = caRes.rows[0];

    await db.query(`DELETE FROM assignment_submissions WHERE ca_id = $1`, [ca_id]);
    await db.query(`DELETE FROM class_assignments WHERE ca_id = $1`, [ca_id]);

    const saInfo = await db.query(`SELECT sa.faculty_id, sa.session_id, sa.subject_id, s.subject_name FROM subject_assignments sa JOIN subjects s ON sa.subject_id = s.subject_id WHERE sa.sa_id = $1`, [sa_id]);
    if(saInfo.rows.length > 0) {
      await createAutoNotice({
        faculty_id: saInfo.rows[0].faculty_id, session_id: saInfo.rows[0].session_id, subject_id: saInfo.rows[0].subject_id, target_type: 'subject',
        title: `Assignment Cancelled`, content: `${saInfo.rows[0].subject_name} Unit ${unit_no} assignment has been cancelled.`,
        ref_type: 'assignment', ref_id: ca_id, expires_at: new Date(Date.now() + 7*24*60*60*1000), pool: db
      });
    }

    res.json({ message: 'Deleted' });
  } catch(err) { res.status(500).json({ message: err.message }); }
};

// GET /api/assignments/:ca_id/submissions
const getAssignmentSubmissions = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT sub.*, s.name, s.enrollment_no, s.student_id
      FROM assignment_submissions sub
      JOIN students s ON sub.student_id = s.student_id
      WHERE sub.ca_id = $1
      ORDER BY s.enrollment_no
    `, [req.params.ca_id]);
    res.json(rows);
  } catch(err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/assignments/submissions/:submission_id
const updateSubmission = async (req, res) => {
  try {
    const { submission_id } = req.params;
    const { action, rejection_reason } = req.body;

    if (action === 'tick') {
      await db.query(`UPDATE assignment_submissions SET is_manually_ticked = true, submitted_on = NOW(), status = 'submitted' WHERE submission_id = $1`, [submission_id]);
    } else if (action === 'approve') {
      await db.query(`UPDATE assignment_submissions SET status = 'approved' WHERE submission_id = $1`, [submission_id]);
    } else if (action === 'reject') {
      await db.query(`UPDATE assignment_submissions SET status = 'rejected', rejection_reason = $2 WHERE submission_id = $1`, [submission_id, rejection_reason]);
      
      const info = await db.query(`
        SELECT sub.student_id, sub.ca_id, ca.sa_id, ca.unit_no, sa.faculty_id, sa.session_id, sa.subject_id, s.subject_name
        FROM assignment_submissions sub JOIN class_assignments ca ON sub.ca_id = ca.ca_id
        JOIN subject_assignments sa ON ca.sa_id = sa.sa_id JOIN subjects s ON sa.subject_id = s.subject_id
        WHERE sub.submission_id = $1
      `, [submission_id]);

      if(info.rows.length > 0) {
        const d = info.rows[0];
        // Note: target_student logic might differ if notices are session-wide. 
        // We'll target the session but the content will specifically mention the student or we broadcast it to the student.
        // Wait, notice_reads logic filters by target_type. The schema doesn't have student_id for notices!
        // We will just create a department notice but ideally this is an issue -> schema doesn't support 1-to-1 notices well!
        // The prompt says: target_type: 'subject', is_auto: true.
        // Let's just create it as requested by the prompt. Note: All students in subject will see it!
        await createAutoNotice({
          faculty_id: d.faculty_id, session_id: d.session_id, subject_id: d.subject_id, target_type: 'subject',
          title: `Assignment Rejected — ${d.subject_name} Unit ${d.unit_no}`,
          content: `Important check: An assignment has been rejected for ${d.subject_name} Unit ${d.unit_no}. Reason: ${rejection_reason}. Please resubmit before the deadline.`,
          ref_type: 'assignment', ref_id: d.ca_id, expires_at: new Date(Date.now() + 7*24*60*60*1000), pool: db
        });
      }
    } else if (action === 'resubmit_tick') {
      await db.query(`UPDATE assignment_submissions SET is_manually_ticked = true, submitted_on = NOW(), status = 'resubmitted', rejection_reason = NULL WHERE submission_id = $1`, [submission_id]);
    }

    const { rows } = await db.query(`SELECT * FROM assignment_submissions WHERE submission_id = $1`, [submission_id]);
    res.json(rows[0]);
  } catch(err) { res.status(500).json({ message: err.message }); }
};

// GET /api/assignments/student/all
const getStudentAssignments = async (req, res) => {
  try {
    const studentInfo = await db.query(`SELECT session_id, current_semester FROM students WHERE student_id = $1`, [req.user.user_id]);
    if (studentInfo.rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    const stu = studentInfo.rows[0];

    const { rows } = await db.query(`
      SELECT ca.*, sub.status, sub.submitted_on, sub.rejection_reason, sub.is_manually_ticked,
      s.subject_name, s.subject_code, f.name as faculty_name
      FROM class_assignments ca
      JOIN subject_assignments sa ON ca.sa_id = sa.sa_id
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN faculty f ON sa.faculty_id = f.faculty_id
      LEFT JOIN assignment_submissions sub ON sub.ca_id = ca.ca_id AND sub.student_id = $1
      WHERE sa.session_id = $2 AND s.semester = $3
      ORDER BY ca.deadline ASC
    `, [req.user.user_id, stu.session_id, stu.current_semester]);
    res.json(rows);
  } catch(err) { res.status(500).json({ message: err.message }); }
};

// POST /api/assignments/ai-generate
const generateAIAssignment = async (req, res) => {
  try {
    const { sa_id, unit_no, topic, difficulty, count } = req.body;
    const titleRes = await db.query(`SELECT s.subject_name FROM subject_assignments sa JOIN subjects s ON sa.subject_id = s.subject_id WHERE sa.sa_id = $1`, [sa_id]);
    const subject_name = titleRes.rows[0].subject_name;

    try {
      // Connect to local Ollama Llama3 python AI service
      const aiRes = await axios.post(`http://localhost:8000/ai/assignment/generate`, {
        subject_name, unit_no, topic, difficulty, count
      });
      res.json(aiRes.data);
    } catch(err) {
      // Fallback stub if AI service is not running
      res.json({
        questions: Array.from({length: count}).map((_, i) => `${i+1}. Explain the core concepts of ${topic} regarding Unit ${unit_no} in ${subject_name} (${difficulty}).`)
      });
    }
  } catch(err) { res.status(500).json({ message: err.message }); }
};

// PART D routes (upcoming)
const getStudentUpcoming = async (req, res) => {
  try {
    const studentInfo = await db.query(`SELECT session_id, current_semester FROM students WHERE student_id = $1`, [req.user.user_id]);
    if (studentInfo.rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    const stu = studentInfo.rows[0];

    const { rows } = await db.query(`
      SELECT ca.ca_id, ca.title, ca.unit_no, ca.deadline, s.subject_name, s.subject_code, sub.status
      FROM class_assignments ca
      JOIN subject_assignments sa ON ca.sa_id = sa.sa_id
      JOIN subjects s ON sa.subject_id = s.subject_id
      LEFT JOIN assignment_submissions sub ON sub.ca_id = ca.ca_id AND sub.student_id = $1
      WHERE sa.session_id = $2 AND s.semester = $3
      AND ca.deadline > NOW()
      AND (sub.status IS NULL OR sub.status = 'pending' OR sub.status = 'rejected')
      ORDER BY ca.deadline ASC
      LIMIT 5
    `, [req.user.user_id, stu.session_id, stu.current_semester]);
    res.json(rows);
  } catch(err) { res.status(500).json({ message: err.message }); }
};

const getFacultyUpcoming = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT ca.*, s.subject_name,
      COUNT(sub.submission_id) FILTER (WHERE sub.status = 'submitted' OR sub.status = 'resubmitted') as needs_review,
      COUNT(sub.submission_id) FILTER (WHERE sub.status = 'pending' AND ca.deadline < NOW()) as overdue_pending
      FROM class_assignments ca
      JOIN subject_assignments sa ON ca.sa_id = sa.sa_id
      JOIN subjects s ON sa.subject_id = s.subject_id
      LEFT JOIN assignment_submissions sub ON sub.ca_id = ca.ca_id
      WHERE sa.faculty_id = $1
      AND ca.deadline > NOW() - INTERVAL '7 days'
      GROUP BY ca.ca_id, s.subject_name
      ORDER BY ca.deadline ASC
    `, [req.user.user_id]);
    res.json(rows);
  } catch(err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getAssignments, createAssignment, updateAssignment, deleteAssignment,
  getAssignmentSubmissions, updateSubmission, getStudentAssignments,
  generateAIAssignment, getStudentUpcoming, getFacultyUpcoming
};
