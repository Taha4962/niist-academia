const db = require('../config/db');
const { createAutoNotice } = require('../utils/noticeHelper');

// GET /api/projects/:session_id
const getProjects = async (req, res) => {
  try {
    const { session_id } = req.params;
    const user = req.user;

    if (user.role === 'student') {
      const { rows } = await db.query(`
        SELECT p.*, pt.team_name, pt.team_id, gf.name as guide_name
        FROM projects p
        JOIN project_teams pt ON pt.project_id = p.project_id
        JOIN project_team_members ptm ON ptm.team_id = pt.team_id
        LEFT JOIN faculty gf ON gf.faculty_id = pt.guide_faculty_id
        WHERE ptm.student_id = $1 AND p.is_enabled = true
        LIMIT 1
      `, [user.user_id]);
      return res.json(rows[0] || null);
    }

    const { rows } = await db.query(`
      SELECT p.*, f.name as faculty_name,
      COUNT(DISTINCT pt.team_id) as team_count,
      COUNT(DISTINCT ptm.student_id) as member_count,
      COUNT(DISTINCT pm.milestone_id) as total_milestones,
      COUNT(DISTINCT pm.milestone_id) FILTER (WHERE pm.status = 'completed') as completed_milestones
      FROM projects p
      LEFT JOIN faculty f ON p.faculty_id = f.faculty_id
      LEFT JOIN project_teams pt ON pt.project_id = p.project_id
      LEFT JOIN project_team_members ptm ON ptm.team_id = pt.team_id
      LEFT JOIN project_milestones pm ON pm.project_id = p.project_id
      WHERE p.session_id = $1
      GROUP BY p.project_id, f.name
      ORDER BY p.created_at DESC
    `, [session_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/projects
const createProject = async (req, res) => {
  try {
    const { session_id, title, description, semester } = req.body;
    const faculty_id = req.user.user_id;

    if (parseInt(semester) < 5) {
      return res.status(400).json({ message: 'Project module only for 3rd and 4th year students (Semester 5+)' });
    }

    const { rows } = await db.query(`
      INSERT INTO projects (faculty_id, session_id, title, description, semester, is_enabled)
      VALUES ($1, $2, $3, $4, $5, false)
      RETURNING *
    `, [faculty_id, session_id, title, description, semester]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/projects/:project_id
const updateProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    const { rows } = await db.query(`
      UPDATE projects SET title=$1, description=$2 WHERE project_id=$3 RETURNING *
    `, [title, description, req.params.project_id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/projects/:project_id/toggle
const toggleProject = async (req, res) => {
  try {
    const { is_enabled } = req.body;
    const { project_id } = req.params;

    const { rows } = await db.query(`
      UPDATE projects SET is_enabled=$1 WHERE project_id=$2 RETURNING *
    `, [is_enabled, project_id]);

    const project = rows[0];

    if (is_enabled) {
      const facInfo = await db.query(`SELECT faculty_id FROM projects WHERE project_id=$1`, [project_id]);
      await createAutoNotice({
        faculty_id: facInfo.rows[0].faculty_id,
        session_id: project.session_id,
        subject_id: null,
        target_type: 'session',
        title: '🚀 Project Section Enabled',
        content: 'The project section has been enabled for your batch. You can now view your project details, team members and milestones. Check the Projects tab.',
        ref_type: 'project',
        ref_id: project_id,
        expires_at: null,
        pool: db
      });
    }

    res.json({ project, message: is_enabled ? 'Project enabled' : 'Project hidden from students' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/projects/:project_id/teams
const getTeams = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT pt.*, gf.name as guide_name, gf.employee_id as guide_emp_id,
      COALESCE(json_agg(
        json_build_object('student_id', s.student_id, 'name', s.name, 'enrollment_no', s.enrollment_no)
      ) FILTER (WHERE s.student_id IS NOT NULL), '[]') as members
      FROM project_teams pt
      LEFT JOIN faculty gf ON gf.faculty_id = pt.guide_faculty_id
      LEFT JOIN project_team_members ptm ON ptm.team_id = pt.team_id
      LEFT JOIN students s ON s.student_id = ptm.student_id
      WHERE pt.project_id = $1
      GROUP BY pt.team_id, gf.name, gf.employee_id
    `, [req.params.project_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/projects/:project_id/teams
const createTeam = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { team_name, guide_faculty_id, student_ids } = req.body;

    if (student_ids?.length > 0) {
      const conflict = await db.query(`
        SELECT s.name, pt.team_name FROM project_team_members ptm
        JOIN project_teams pt ON ptm.team_id = pt.team_id
        JOIN students s ON s.student_id = ptm.student_id
        WHERE ptm.student_id = ANY($1) AND pt.project_id = $2 LIMIT 1
      `, [student_ids, project_id]);
      if (conflict.rows.length > 0) {
        return res.status(400).json({ message: `${conflict.rows[0].name} is already in team ${conflict.rows[0].team_name}` });
      }
    }

    const { rows } = await db.query(`
      INSERT INTO project_teams (project_id, team_name, guide_faculty_id)
      VALUES ($1, $2, $3) RETURNING *
    `, [project_id, team_name, guide_faculty_id || null]);
    const team = rows[0];

    if (student_ids?.length > 0) {
      for (const sid of student_ids) {
        await db.query(`INSERT INTO project_team_members (team_id, student_id) VALUES ($1,$2)`, [team.team_id, sid]);
      }
    }

    res.json(team);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/projects/teams/:team_id
const updateTeam = async (req, res) => {
  try {
    const { team_name, guide_faculty_id } = req.body;
    const { rows } = await db.query(`
      UPDATE project_teams SET team_name=$1, guide_faculty_id=$2 WHERE team_id=$3 RETURNING *
    `, [team_name, guide_faculty_id || null, req.params.team_id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/projects/teams/:team_id/members
const addMember = async (req, res) => {
  try {
    const { student_id } = req.body;
    const { team_id } = req.params;

    const teamRes = await db.query(`SELECT project_id FROM project_teams WHERE team_id=$1`, [team_id]);
    const project_id = teamRes.rows[0].project_id;

    const conflict = await db.query(`
      SELECT pt.team_name FROM project_team_members ptm
      JOIN project_teams pt ON ptm.team_id = pt.team_id
      WHERE ptm.student_id = $1 AND pt.project_id = $2 LIMIT 1
    `, [student_id, project_id]);

    if (conflict.rows.length > 0) {
      return res.status(400).json({ message: `Student already in team ${conflict.rows[0].team_name}` });
    }

    await db.query(`INSERT INTO project_team_members (team_id, student_id) VALUES ($1,$2)`, [team_id, student_id]);
    res.json({ message: 'Member added' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/projects/teams/:team_id/members/:student_id
const removeMember = async (req, res) => {
  try {
    await db.query(`DELETE FROM project_team_members WHERE team_id=$1 AND student_id=$2`, [req.params.team_id, req.params.student_id]);
    res.json({ message: 'Member removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/projects/:project_id/milestones
const getMilestones = async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM project_milestones WHERE project_id=$1 ORDER BY deadline ASC`, [req.params.project_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/projects/:project_id/milestones
const createMilestones = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { title, deadline, milestones } = req.body;
    const faculty_id = req.user.user_id;

    const projRes = await db.query(`SELECT session_id FROM projects WHERE project_id=$1`, [project_id]);
    const session_id = projRes.rows[0].session_id;

    if (milestones && Array.isArray(milestones)) {
      // Bulk insert
      const created = [];
      for (const m of milestones) {
        const { rows } = await db.query(`
          INSERT INTO project_milestones (project_id, title, deadline, status) VALUES ($1,$2,$3,'pending') RETURNING *
        `, [project_id, m.title, m.deadline]);
        created.push(rows[0]);
      }

      const list = milestones.map(m => `• ${m.title} — ${new Date(m.deadline).toLocaleDateString()}`).join('\n');
      await createAutoNotice({
        faculty_id, session_id, subject_id: null, target_type: 'session',
        title: '📅 Project Schedule Published',
        content: `Your complete project milestone schedule has been published.\n\n${list}\n\nCheck the Projects section for complete details.`,
        ref_type: 'project', ref_id: project_id,
        expires_at: null, pool: db
      });

      return res.json(created);
    }

    // Single milestone
    const { rows } = await db.query(`
      INSERT INTO project_milestones (project_id, title, deadline, status) VALUES ($1,$2,$3,'pending') RETURNING *
    `, [project_id, title, deadline]);

    await createAutoNotice({
      faculty_id, session_id, subject_id: null, target_type: 'session',
      title: 'New Project Milestone Added',
      content: `A new milestone has been added to your project schedule.\nMilestone: ${title}\nDeadline: ${new Date(deadline).toLocaleDateString()}\nCheck the Projects section.`,
      ref_type: 'project', ref_id: project_id,
      expires_at: null, pool: db
    });

    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/projects/milestones/:milestone_id
const updateMilestone = async (req, res) => {
  try {
    const { milestone_id } = req.params;
    const { title, deadline, status } = req.body;
    const faculty_id = req.user.user_id;

    const old = await db.query(`SELECT pm.*, p.session_id FROM project_milestones pm JOIN projects p ON pm.project_id = p.project_id WHERE pm.milestone_id=$1`, [milestone_id]);
    if (old.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    const oldData = old.rows[0];
    const session_id = oldData.session_id;

    const { rows } = await db.query(`
      UPDATE project_milestones SET title=COALESCE($1,title), deadline=COALESCE($2,deadline), status=COALESCE($3,status) WHERE milestone_id=$4 RETURNING *
    `, [title, deadline, status, milestone_id]);

    // Notices
    if (deadline && new Date(deadline).getTime() !== new Date(oldData.deadline).getTime()) {
      await createAutoNotice({
        faculty_id, session_id, subject_id: null, target_type: 'session',
        title: '📅 Milestone Deadline Updated',
        content: `The deadline for milestone "${title || oldData.title}" has been updated to ${new Date(deadline).toLocaleDateString()}.`,
        ref_type: 'project', ref_id: oldData.project_id, expires_at: null, pool: db
      });
    }

    if (status && status !== oldData.status) {
      const noticeMap = {
        completed: { title: '✅ Milestone Completed!', content: `Your team milestone "${title || oldData.title}" has been marked as completed. Well done! 🎉` },
        missed: { title: '⚠️ Milestone Missed', content: `The milestone "${title || oldData.title}" deadline has passed and has been marked as missed. Please contact your faculty guide.` }
      };
      if (noticeMap[status]) {
        await createAutoNotice({
          faculty_id, session_id, subject_id: null, target_type: 'session',
          ...noticeMap[status],
          ref_type: 'project', ref_id: oldData.project_id, expires_at: null, pool: db
        });
      }
    }

    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/projects/milestones/:milestone_id
const deleteMilestone = async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT status FROM project_milestones WHERE milestone_id=$1`, [req.params.milestone_id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
    if (rows[0].status === 'completed') return res.status(400).json({ message: 'Cannot delete completed milestone. Record must be preserved.' });
    await db.query(`DELETE FROM project_milestones WHERE milestone_id=$1`, [req.params.milestone_id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/projects/hod/overview
const getHodOverview = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.project_id, p.title, p.semester, p.is_enabled,
      ses.session_name, f.name as faculty_name,
      COUNT(DISTINCT pt.team_id) as team_count,
      COUNT(DISTINCT ptm.student_id) as student_count,
      COUNT(pm.milestone_id) as total_milestones,
      COUNT(pm.milestone_id) FILTER (WHERE pm.status = 'completed') as completed,
      COUNT(pm.milestone_id) FILTER (WHERE pm.status = 'missed') as missed,
      COUNT(pm.milestone_id) FILTER (WHERE pm.status = 'pending' AND pm.deadline < NOW()) as overdue
      FROM projects p
      JOIN sessions ses ON p.session_id = ses.session_id
      JOIN faculty f ON p.faculty_id = f.faculty_id
      LEFT JOIN project_teams pt ON pt.project_id = p.project_id
      LEFT JOIN project_team_members ptm ON ptm.team_id = pt.team_id
      LEFT JOIN project_milestones pm ON pm.project_id = p.project_id
      GROUP BY p.project_id, ses.session_name, f.name
      ORDER BY ses.start_year DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getProjects, createProject, updateProject, toggleProject,
  getTeams, createTeam, updateTeam, addMember, removeMember,
  getMilestones, createMilestones, updateMilestone, deleteMilestone,
  getHodOverview
};
