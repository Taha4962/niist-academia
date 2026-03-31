const db = require('../config/db');
const { createAutoNotice } = require('../utils/noticeHelper');

// GET for student via special endpoint
const getStudentProject = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, pt.team_name, pt.team_id, gf.name as guide_name,
      ses.session_name
      FROM projects p
      JOIN project_teams pt ON pt.project_id = p.project_id
      JOIN project_team_members ptm ON ptm.team_id = pt.team_id
      LEFT JOIN faculty gf ON gf.faculty_id = pt.guide_faculty_id
      LEFT JOIN sessions ses ON ses.session_id = p.session_id
      WHERE ptm.student_id = $1 AND p.is_enabled = true
      LIMIT 1
    `, [req.user.user_id]);
    res.json(rows[0] || null);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getStudentProject };
