require('dotenv').config();
const db = require('./config/db');

async function seedM3() {
  try {
    console.log('Starting Module 3 Data Seeding...');

    // Get DBMS subject assignment
    const saRes = await db.query(`
      SELECT sa.sa_id, sa.session_id, sa.subject_id, sa.faculty_id, s.subject_name
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.subject_id
      WHERE s.subject_code = 'CS301' LIMIT 1
    `);

    if (saRes.rows.length === 0) {
      console.log('DBMS not found. Exiting.'); process.exit(0);
    }

    const { sa_id, session_id, subject_id, faculty_id, subject_name } = saRes.rows[0];

    // Get students in that session
    const stuRes = await db.query(`SELECT student_id, name FROM students WHERE session_id = $1 LIMIT 5`, [session_id]);
    const students = stuRes.rows;

    // -=- ASSIGNMENTS -=-
    console.log('Seeding Assignments...');

    const d7 = new Date(); d7.setDate(d7.getDate() + 7);
    const d14 = new Date(); d14.setDate(d14.getDate() + 14);

    const unit1ARes = await db.query(`
      INSERT INTO class_assignments (sa_id, unit_no, title, description, deadline)
      VALUES ($1, 1, 'Relational Model Assignment', $2, $3)
      ON CONFLICT DO NOTHING RETURNING ca_id
    `, [sa_id,
      `1. Define relational model and explain its properties.\n2. What is difference between primary key and foreign key?\n3. Explain normalization with example.\n4. What are integrity constraints?\n5. Explain ER to relational mapping.`,
      d7]);

    const unit2ARes = await db.query(`
      INSERT INTO class_assignments (sa_id, unit_no, title, description, deadline)
      VALUES ($1, 2, 'SQL Assignment', $2, $3)
      ON CONFLICT DO NOTHING RETURNING ca_id
    `, [sa_id,
      `1. Write SQL to create a student table.\n2. Explain DDL vs DML commands.\n3. Write a query using JOIN to fetch student data.\n4. What is a subquery? Give an example.\n5. Explain GROUP BY with HAVING clause.`,
      d14]);

    // Create pending submissions for all students for both assignments
    for (const res of [unit1ARes, unit2ARes]) {
      if (res.rows.length > 0) {
        const ca_id = res.rows[0].ca_id;
        for (const st of students) {
          await db.query(`
            INSERT INTO assignment_submissions (ca_id, student_id, status)
            VALUES ($1, $2, 'pending')
            ON CONFLICT DO NOTHING
          `, [ca_id, st.student_id]);
        }
        
        // Seed some submission states for Unit 1
        if (unit1ARes.rows.length > 0 && ca_id === unit1ARes.rows[0].ca_id && students.length >= 4) {
          const submissionRes = await db.query(`SELECT submission_id, student_id FROM assignment_submissions WHERE ca_id = $1`, [ca_id]);
          const subs = submissionRes.rows;
          
          if (subs.length > 0) await db.query(`UPDATE assignment_submissions SET status = 'approved', is_manually_ticked = true, submitted_on = NOW() WHERE submission_id = $1`, [subs[0].submission_id]);
          if (subs.length > 1) await db.query(`UPDATE assignment_submissions SET status = 'submitted', is_manually_ticked = true, submitted_on = NOW() WHERE submission_id = $1`, [subs[1].submission_id]);
          if (subs.length > 3) await db.query(`UPDATE assignment_submissions SET status = 'rejected', rejection_reason = 'Incomplete answers. Please redo Q3 and Q5.' WHERE submission_id = $1`, [subs[3].submission_id]);
        }
      }
    }

    // -=- NOTICES -=-
    console.log('Seeding Notices...');

    await db.query(`
      INSERT INTO notices (faculty_id, session_id, subject_id, target_type, title, content, is_pinned, is_auto, expires_at)
      VALUES (
        $1, NULL, NULL, 'department',
        'MST 2 Examination Schedule', 
        'MST 2 will be held from 25th March to 30th March. Please carry your ID cards and admit cards. No student will be allowed without valid documents. Wish you all the best!',
        true, false, NULL
      ) ON CONFLICT DO NOTHING
    `, [faculty_id]);

    await db.query(`
      INSERT INTO notices (faculty_id, session_id, subject_id, target_type, title, content, is_pinned, is_auto, expires_at)
      VALUES (
        $1, $2, $3, 'subject',
        'DBMS Assignment Reminder',
        'Unit 1 Relational Model assignment deadline is approaching. Please ensure you submit your physically written answers on time. Late submissions will not be accepted.',
        false, false, NULL
      ) ON CONFLICT DO NOTHING
    `, [faculty_id, session_id, subject_id]);

    await db.query(`
      INSERT INTO notices (faculty_id, session_id, subject_id, target_type, title, content, is_pinned, is_auto, ref_type, expires_at)
      VALUES (
        $1, $2, $3, 'subject',
        'New Notes — DBMS Unit 2',
        'SQL Complete Notes have been uploaded for DBMS Unit 2. Please access them from the Notes section for exam preparation.',
        false, true, 'note', NULL
      ) ON CONFLICT DO NOTHING
    `, [faculty_id, session_id, subject_id]);

    console.log('✅ Module 3 seed data successfully inserted.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
}

seedM3();
