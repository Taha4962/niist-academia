const db = require('../config/db');

// Ensure subject_marks_config table exists on load
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS subject_marks_config (
        config_id SERIAL PRIMARY KEY,
        subject_id INT REFERENCES subjects(subject_id),
        session_id INT REFERENCES sessions(session_id),
        mst1_max NUMERIC(5,2) DEFAULT 30,
        mst2_max NUMERIC(5,2) DEFAULT 30,
        internal_max NUMERIC(5,2) DEFAULT 20,
        has_practical BOOLEAN DEFAULT false,
        practical_max NUMERIC(5,2),
        UNIQUE(subject_id, session_id)
      )
    `);
    console.log('subject_marks_config table verified');
  } catch (err) {
    console.error('Error creating subject_marks_config table', err);
  }
})();

// GET /api/marks/setup/:sa_id
const getMarksSetup = async (req, res) => {
  try {
    const { sa_id } = req.params;
    const { rows } = await db.query(`
      SELECT * FROM subject_marks_config
      WHERE subject_id = (SELECT subject_id FROM subject_assignments WHERE sa_id = $1)
      AND session_id = (SELECT session_id FROM subject_assignments WHERE sa_id = $1)
      LIMIT 1
    `, [sa_id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/marks/setup
const saveMarksSetup = async (req, res) => {
  try {
    const { sa_id, mst1_max, mst2_max, internal_max, has_practical, practical_max } = req.body;
    
    const saInfo = await db.query('SELECT subject_id, session_id FROM subject_assignments WHERE sa_id = $1', [sa_id]);
    if(saInfo.rows.length === 0) return res.status(404).json({ message: 'Assignment not found' });
    const { subject_id, session_id } = saInfo.rows[0];

    const { rows } = await db.query(`
      INSERT INTO subject_marks_config 
      (subject_id, session_id, mst1_max, mst2_max, internal_max, has_practical, practical_max)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (subject_id, session_id) DO UPDATE SET
      mst1_max = EXCLUDED.mst1_max,
      mst2_max = EXCLUDED.mst2_max,
      internal_max = EXCLUDED.internal_max,
      has_practical = EXCLUDED.has_practical,
      practical_max = EXCLUDED.practical_max
      RETURNING *
    `, [subject_id, session_id, mst1_max, mst2_max, internal_max, has_practical, practical_max]);
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/marks/:sa_id
const getMarksForEntry = async (req, res) => {
  try {
    const { sa_id } = req.params;
    const { rows } = await db.query(`
      SELECT s.student_id, s.name, s.enrollment_no, m.* 
      FROM students s
      LEFT JOIN marks m 
        ON m.student_id = s.student_id 
        AND m.subject_id = (SELECT subject_id FROM subject_assignments WHERE sa_id = $1)
        AND m.session_id = (SELECT session_id FROM subject_assignments WHERE sa_id = $1)
      WHERE s.session_id = (SELECT session_id FROM subject_assignments WHERE sa_id = $1)
      ORDER BY s.enrollment_no
    `, [sa_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/marks/enter
const saveMarksBulk = async (req, res) => {
  try {
    const { sa_id, marks_data } = req.body;
    
    const saInfo = await db.query('SELECT subject_id, session_id FROM subject_assignments WHERE sa_id = $1', [sa_id]);
    if(saInfo.rows.length === 0) return res.status(404).json({ message: 'Assignment not found' });
    const { subject_id, session_id } = saInfo.rows[0];

    await db.query('BEGIN');
    let updatedCount = 0;

    for (const record of marks_data) {
      await db.query(`
        INSERT INTO marks 
        (student_id, subject_id, session_id, mst1_marks, mst1_absent, mst2_marks, mst2_absent, internal_marks, internal_absent, practical_marks, practical_absent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (student_id, subject_id, session_id) DO UPDATE SET
        mst1_marks = EXCLUDED.mst1_marks,
        mst1_absent = EXCLUDED.mst1_absent,
        mst2_marks = EXCLUDED.mst2_marks,
        mst2_absent = EXCLUDED.mst2_absent,
        internal_marks = EXCLUDED.internal_marks,
        internal_absent = EXCLUDED.internal_absent,
        practical_marks = EXCLUDED.practical_marks,
        practical_absent = EXCLUDED.practical_absent
      `, [
        record.student_id, subject_id, session_id,
        record.mst1_marks || null, record.mst1_absent || false,
        record.mst2_marks || null, record.mst2_absent || false,
        record.internal_marks || null, record.internal_absent || false,
        record.practical_marks || null, record.practical_absent || false
      ]);
      updatedCount++;
    }

    await db.query('COMMIT');
    res.json({ updated: updatedCount });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  }
};

// GET /api/marks/student/:student_id
const getStudentMarks = async (req, res) => {
  try {
    const { student_id } = req.params;
    const sessionRes = await db.query('SELECT session_id FROM students WHERE student_id = $1', [student_id]);
    if(sessionRes.rows.length === 0) return res.status(404).json({ message: 'Student not found' });

    const { rows } = await db.query(`
      SELECT s.subject_name, s.subject_code, m.*, 
      config.mst1_max, config.mst2_max, config.internal_max, config.practical_max, config.has_practical
      FROM marks m
      JOIN subjects s ON m.subject_id = s.subject_id
      LEFT JOIN subject_marks_config config 
        ON config.subject_id = m.subject_id AND config.session_id = m.session_id
      WHERE m.student_id = $1 AND m.session_id = $2
    `, [student_id, sessionRes.rows[0].session_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/marks/rank/:sa_id
const getRankings = async (req, res) => {
  try {
    const { sa_id } = req.params;
    
    // Using Postgres window function to calculate rank dynamically
    const { rows } = await db.query(`
      WITH student_totals AS (
        SELECT m.student_id, s.name, s.enrollment_no,
        COALESCE(m.mst1_marks, 0) + COALESCE(m.mst2_marks, 0) + COALESCE(m.internal_marks, 0) + COALESCE(m.practical_marks, 0) as total_marks,
        RANK() OVER (ORDER BY (COALESCE(m.mst1_marks, 0) + COALESCE(m.mst2_marks, 0) + COALESCE(m.internal_marks, 0) + COALESCE(m.practical_marks, 0)) DESC) as rank
        FROM marks m
        JOIN students s ON m.student_id = s.student_id
        WHERE m.subject_id = (SELECT subject_id FROM subject_assignments WHERE sa_id = $1)
        AND m.session_id = (SELECT session_id FROM subject_assignments WHERE sa_id = $1)
      )
      SELECT * FROM student_totals ORDER BY rank
    `, [sa_id]);
    
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/marks/distribution/:sa_id
const getMarksDistribution = async (req, res) => {
  try {
    const { sa_id } = req.params;
    const configRes = await db.query(`
      SELECT * FROM subject_marks_config 
      WHERE subject_id = (SELECT subject_id FROM subject_assignments WHERE sa_id = $1)
      LIMIT 1
    `, [sa_id]);

    const { rows } = await db.query(`
      SELECT * FROM marks 
      WHERE subject_id = (SELECT subject_id FROM subject_assignments WHERE sa_id = $1)
      AND session_id = (SELECT session_id FROM subject_assignments WHERE sa_id = $1)
    `, [sa_id]);

    const cfg = configRes.rows[0];
    
    // Grouping helper
    const initRanges = () => ({
      '90-100%': 0, '75-89%': 0, '60-74%': 0, '40-59%': 0, '<40%': 0, 'Absent': 0
    });
    
    const distribution = {
      mst1: initRanges(),
      mst2: initRanges(),
      internal: initRanges(),
      practical: initRanges()
    };

    if (cfg && rows.length > 0) {
      rows.forEach(m => {
        const process = (name, marks, absent, max) => {
          if (absent) distribution[name]['Absent']++;
          else if (marks !== null && max) {
            const p = (marks / max) * 100;
            if (p >= 90) distribution[name]['90-100%']++;
            else if (p >= 75) distribution[name]['75-89%']++;
            else if (p >= 60) distribution[name]['60-74%']++;
            else if (p >= 40) distribution[name]['40-59%']++;
            else distribution[name]['<40%']++;
          }
        };

        process('mst1', m.mst1_marks, m.mst1_absent, cfg.mst1_max);
        process('mst2', m.mst2_marks, m.mst2_absent, cfg.mst2_max);
        process('internal', m.internal_marks, m.internal_absent, cfg.internal_max);
        if (cfg.has_practical) {
           process('practical', m.practical_marks, m.practical_absent, cfg.practical_max);
        }
      });
    }

    // Format for recharts -> Array of objects
    const rechartData = Object.keys(distribution.mst1).map(range => {
      const point = { name: range, mst1: distribution.mst1[range], mst2: distribution.mst2[range], internal: distribution.internal[range] };
      if (cfg?.has_practical) point.practical = distribution.practical[range];
      return point;
    });

    res.json(rechartData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/marks/hod/overview
const getHodOverview = async (req, res) => {
  try {
    // Session averages
    const { rows: averages } = await db.query(`
      SELECT ses.session_name, ses.session_id, sub.subject_name,
      ROUND(AVG(COALESCE(m.mst1_marks,0) + COALESCE(m.mst2_marks,0) + COALESCE(m.internal_marks,0) + COALESCE(m.practical_marks,0)), 2) as avg_marks,
      (cfg.mst1_max + cfg.mst2_max + cfg.internal_max + COALESCE(cfg.practical_max, 0)) as total_max
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.subject_id
      JOIN sessions ses ON m.session_id = ses.session_id
      JOIN subject_marks_config cfg ON cfg.subject_id = m.subject_id AND cfg.session_id = m.session_id
      GROUP BY ses.session_id, ses.session_name, sub.subject_name, cfg.mst1_max, cfg.mst2_max, cfg.internal_max, cfg.practical_max
    `);

    // Top 5 rankers per session
    const { rows: rankers } = await db.query(`
      WITH ranked_students AS (
        SELECT m.session_id, s.name, s.enrollment_no,
        SUM(COALESCE(m.mst1_marks,0) + COALESCE(m.mst2_marks,0) + COALESCE(m.internal_marks,0) + COALESCE(m.practical_marks,0)) as total_marks,
        RANK() OVER (PARTITION BY m.session_id ORDER BY SUM(COALESCE(m.mst1_marks,0) + COALESCE(m.mst2_marks,0) + COALESCE(m.internal_marks,0) + COALESCE(m.practical_marks,0)) DESC) as rnk
        FROM marks m
        JOIN students s ON m.student_id = s.student_id
        GROUP BY m.session_id, s.name, s.enrollment_no
      )
      SELECT r.session_id, ses.session_name, r.name, r.enrollment_no, r.total_marks, r.rnk
      FROM ranked_students r
      JOIN sessions ses ON ses.session_id = r.session_id
      WHERE r.rnk <= 5
      ORDER BY r.session_id, r.rnk
    `);

    res.json({ averages, rankers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getMarksSetup,
  saveMarksSetup,
  getMarksForEntry,
  saveMarksBulk,
  getStudentMarks,
  getRankings,
  getMarksDistribution,
  getHodOverview
};
