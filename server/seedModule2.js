require('dotenv').config();
const db = require('./config/db');

async function seedM2() {
  try {
    console.log('Starting Module 2 Data Seeding...');

    // 1. Get DBMS (CS-501) assignment
    const saRes = await db.query(`
      SELECT sa.sa_id, sa.subject_id, sa.session_id 
      FROM subject_assignments sa
      JOIN subjects s ON s.subject_id = sa.subject_id
      WHERE s.subject_code = 'CS301' LIMIT 1
    `);

    if (saRes.rows.length === 0) {
      console.log('DBMS Assignment not found. Skipping Module 2 Seed.');
      process.exit(0);
    }

    const { subject_id, session_id } = saRes.rows[0];

    // 2. Syllabus Topics
    console.log('Seeding Syllabus Topics...');
    const topics = [
      { unit: 1, name: 'Introduction to DBMS Architecture', done: true },
      { unit: 1, name: 'Entity Relationship (ER) Model', done: true },
      { unit: 2, name: 'Relational Algebra & Calculus', done: false },
      { unit: 2, name: 'SQL Queries Fundamentals', done: false },
      { unit: 3, name: 'Normalization (1NF, 2NF, 3NF, BCNF)', done: false },
      { unit: 4, name: 'Transaction Management (ACID properties)', done: false },
      { unit: 5, name: 'Concurrency Control (Locking Protocols)', done: false },
    ];

    for (const t of topics) {
      await db.query(`
        INSERT INTO syllabus_topics (subject_id, unit_no, topic_name, is_completed, completed_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [subject_id, t.unit, t.name, t.done, t.done ? new Date() : null]);
    }

    // 3. Get Enrolled Students for this session
    const studentRes = await db.query(`SELECT student_id FROM students WHERE session_id = $1`, [session_id]);
    const students = studentRes.rows;

    if (students.length > 0) {
      // 4. Seeding Attendance for the last 5 days
      console.log(`Seeding Attendance for ${students.length} students...`);
      for (let i = 0; i < 5; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // Exclude weekends roughly
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        
        const dateStr = d.toISOString().split('T')[0];

        for (const st of students) {
          // Randomize status slightly (80% present)
          const rand = Math.random();
          const status = rand > 0.85 ? 'absent' : (rand > 0.8 ? 'late' : 'present');

          await db.query(`
            INSERT INTO attendance (student_id, subject_id, session_id, date, status)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING
          `, [st.student_id, subject_id, session_id, dateStr, status]);
        }
      }

      // 5. Marks Config
      console.log('Seeding Marks Config...');
      await db.query(`
        INSERT INTO subject_marks_config (subject_id, session_id, mst1_max, mst2_max, internal_max, has_practical, practical_max)
        VALUES ($1, $2, 30, 30, 20, true, 25)
        ON CONFLICT (subject_id, session_id) DO UPDATE SET 
        mst1_max = 30, mst2_max = 30, internal_max = 20, has_practical = true, practical_max = 25
      `, [subject_id, session_id]);

      // 6. Marks Data
      console.log('Seeding Student Marks...');
      for (const st of students) {
         // Random marks
         const mst1 = Math.floor(15 + Math.random() * 15);
         const mst2 = Math.floor(15 + Math.random() * 15);
         const int = Math.floor(10 + Math.random() * 10);
         const prac = Math.floor(15 + Math.random() * 10);

         await db.query(`
           INSERT INTO marks (student_id, subject_id, session_id, mst1_marks, mst2_marks, internal_marks, practical_marks)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (student_id, subject_id, session_id) DO UPDATE SET
           mst1_marks = EXCLUDED.mst1_marks,
           mst2_marks = EXCLUDED.mst2_marks,
           internal_marks = EXCLUDED.internal_marks,
           practical_marks = EXCLUDED.practical_marks
         `, [st.student_id, subject_id, session_id, mst1, mst2, int, prac]);
      }
    }

    console.log('✅ Module 2 Background Data Successfully Seeded.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
}

seedM2();
