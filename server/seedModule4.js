require('dotenv').config();
const db = require('./config/db');

async function seedM4() {
  try {
    console.log('Starting Module 4 Seed...');

    const sesRes = await db.query(`SELECT session_id, session_name FROM sessions WHERE start_year <= 2023 ORDER BY start_year DESC LIMIT 1`);
    if (sesRes.rows.length === 0) { console.log('No eligible session found.'); process.exit(0); }
    const { session_id, session_name } = sesRes.rows[0];

    // Find faculty
    const facRes = await db.query(`SELECT faculty_id FROM faculty LIMIT 1`);
    const faculty_id = facRes.rows[0].faculty_id;

    // Create project
    const projRes = await db.query(`
      INSERT INTO projects (faculty_id, session_id, title, description, semester, is_enabled)
      VALUES ($1, $2, 'Smart Campus Management System',
        'A web application to automate campus operations using modern web technologies and AI',
        7, true)
      ON CONFLICT DO NOTHING RETURNING project_id
    `, [faculty_id, session_id]);

    let project_id;
    if (projRes.rows.length > 0) {
      project_id = projRes.rows[0].project_id;
      console.log('Project created: project_id =', project_id);
    } else {
      const ex = await db.query(`SELECT project_id FROM projects WHERE session_id=$1 LIMIT 1`, [session_id]);
      project_id = ex.rows[0]?.project_id;
    }

    if (!project_id) { console.log('No project.'); process.exit(0); }

    // Get students
    const stuRes = await db.query(`SELECT student_id, name FROM students WHERE session_id=$1 ORDER BY student_id LIMIT 5`, [session_id]);
    const students = stuRes.rows;

    // Insert guide faculty
    const facRes2 = await db.query(`SELECT faculty_id FROM faculty ORDER BY faculty_id LIMIT 2`);

    if (students.length >= 2) {
      // Team 1
      const t1 = await db.query(`INSERT INTO project_teams (project_id, team_name, guide_faculty_id) VALUES ($1,'Alpha Team',$2) ON CONFLICT DO NOTHING RETURNING team_id`, [project_id, facRes2.rows[0]?.faculty_id]);
      if (t1.rows.length > 0) {
        for (const sid of students.slice(0, 2).map(s => s.student_id)) {
          await db.query(`INSERT INTO project_team_members (team_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [t1.rows[0].team_id, sid]);
        }
      }
    }

    if (students.length >= 5) {
      // Team 2
      const t2 = await db.query(`INSERT INTO project_teams (project_id, team_name, guide_faculty_id) VALUES ($1,'Beta Team',$2) ON CONFLICT DO NOTHING RETURNING team_id`, [project_id, facRes2.rows[1]?.faculty_id || facRes2.rows[0]?.faculty_id]);
      if (t2.rows.length > 0) {
        for (const sid of students.slice(2, 5).map(s => s.student_id)) {
          await db.query(`INSERT INTO project_team_members (team_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [t2.rows[0].team_id, sid]);
        }
      }
    }

    // Milestones
    const milestones = [
      { title: 'Synopsis Submission', days: 5 },
      { title: 'Literature Review', days: 15 },
      { title: 'System Design', days: 30 },
      { title: 'Prototype Demo', days: 45 },
      { title: 'Final Submission', days: 60 },
    ];

    for (const m of milestones) {
      const dl = new Date(); dl.setDate(dl.getDate() + m.days);
      await db.query(`
        INSERT INTO project_milestones (project_id, title, deadline, status)
        VALUES ($1,$2,$3,'pending') ON CONFLICT DO NOTHING
      `, [project_id, m.title, dl]);
    }

    console.log('✅ Module 4 seed complete:', session_name);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seedM4();
