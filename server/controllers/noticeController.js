const db = require('../config/db');

// GET /api/notices
const getNotices = async (req, res) => {
  try {
    const user = req.user;
    let rows;

    if (user.role === 'student') {
      const stuRes = await db.query(`SELECT session_id, current_semester FROM students WHERE student_id = $1`, [user.user_id]);
      if (stuRes.rows.length === 0) return res.status(404).json({ message: 'Student not found' });
      const stu = stuRes.rows[0];

      const subRes = await db.query(`
        SELECT s.subject_id FROM subject_assignments sa JOIN subjects s ON sa.subject_id = s.subject_id
        WHERE sa.session_id = $1 AND s.semester = $2
      `, [stu.session_id, stu.current_semester]);
      const subjectIds = subRes.rows.map(r => r.subject_id);

      const result = await db.query(`
        SELECT n.*, f.name as faculty_name,
        CASE WHEN nr.read_id IS NOT NULL THEN true ELSE false END as is_read
        FROM notices n
        LEFT JOIN faculty f ON n.faculty_id = f.faculty_id
        LEFT JOIN notice_reads nr ON nr.notice_id = n.notice_id AND nr.student_id = $1
        WHERE (n.expires_at IS NULL OR n.expires_at > NOW())
        AND (
          n.target_type = 'department'
          OR (n.target_type = 'session' AND n.session_id = $2)
          OR (n.target_type = 'subject' AND n.subject_id = ANY($3))
        )
        ORDER BY n.is_pinned DESC, n.created_at DESC
      `, [user.user_id, stu.session_id, subjectIds]);

      rows = result.rows;
    } else if (user.role === 'faculty') {
      const result = await db.query(`
        SELECT n.*, f.name as faculty_name,
        COUNT(nr.read_id) as read_count
        FROM notices n
        LEFT JOIN faculty f ON n.faculty_id = f.faculty_id
        LEFT JOIN notice_reads nr ON nr.notice_id = n.notice_id
        WHERE n.faculty_id = $1 OR n.faculty_id IS NULL
        GROUP BY n.notice_id, f.name
        ORDER BY n.is_pinned DESC, n.created_at DESC
      `, [user.user_id]);
      rows = result.rows;
    } else {
      // HOD
      const result = await db.query(`
        SELECT n.*, f.name as faculty_name,
        COUNT(nr.read_id) as read_count
        FROM notices n
        LEFT JOIN faculty f ON n.faculty_id = f.faculty_id
        LEFT JOIN notice_reads nr ON nr.notice_id = n.notice_id
        GROUP BY n.notice_id, f.name
        ORDER BY n.is_pinned DESC, n.created_at DESC
      `);
      rows = result.rows;
    }

    const pinned = rows.filter(r => r.is_pinned);
    const recent = rows.filter(r => !r.is_pinned);
    const unread_count = rows.filter(r => !r.is_read).length;

    res.json({ pinned, recent, unread_count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/notices
const createNotice = async (req, res) => {
  try {
    const { title, content, target_type, session_id, subject_id, is_pinned, expires_at } = req.body;
    const faculty_id = req.user.user_id;

    if (is_pinned) {
      const pinCount = await db.query(`SELECT COUNT(*) FROM notices WHERE is_pinned = true AND (expires_at IS NULL OR expires_at > NOW())`);
      if (parseInt(pinCount.rows[0].count) >= 3) {
        const pinnedList = await db.query(`SELECT notice_id, title FROM notices WHERE is_pinned = true AND (expires_at IS NULL OR expires_at > NOW())`);
        return res.status(400).json({ error: 'Maximum 3 pinned notices', pinned: pinnedList.rows });
      }
    }

    const { rows } = await db.query(`
      INSERT INTO notices (faculty_id, session_id, subject_id, target_type, title, content, is_pinned, is_auto, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8)
      RETURNING *
    `, [faculty_id, session_id || null, subject_id || null, target_type, title, content, is_pinned || false, expires_at || null]);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notices/:notice_id
const updateNotice = async (req, res) => {
  try {
    const { notice_id } = req.params;
    const { title, content, is_pinned, expires_at } = req.body;

    if (is_pinned) {
      const pinCount = await db.query(`SELECT COUNT(*) FROM notices WHERE is_pinned = true AND notice_id != $1 AND (expires_at IS NULL OR expires_at > NOW())`, [notice_id]);
      if (parseInt(pinCount.rows[0].count) >= 3) {
        const pinnedList = await db.query(`SELECT notice_id, title FROM notices WHERE is_pinned = true AND notice_id != $1 AND (expires_at IS NULL OR expires_at > NOW())`, [notice_id]);
        return res.status(400).json({ error: 'Maximum 3 pinned notices', pinned: pinnedList.rows });
      }
    }

    const { rows } = await db.query(`
      UPDATE notices SET title=$1, content=$2, is_pinned=$3, expires_at=$4
      WHERE notice_id = $5 RETURNING *
    `, [title, content, is_pinned, expires_at || null, notice_id]);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/notices/:notice_id
const deleteNotice = async (req, res) => {
  try {
    const { notice_id } = req.params;
    await db.query(`DELETE FROM notice_reads WHERE notice_id = $1`, [notice_id]);
    await db.query(`DELETE FROM notices WHERE notice_id = $1`, [notice_id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/notices/:notice_id/read
const markRead = async (req, res) => {
  try {
    const { notice_id } = req.params;
    await db.query(`
      INSERT INTO notice_reads (notice_id, student_id, read_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (notice_id, student_id) DO NOTHING
    `, [notice_id, req.user.user_id]);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notices/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const stuRes = await db.query(`SELECT session_id, current_semester FROM students WHERE student_id = $1`, [req.user.user_id]);
    if (stuRes.rows.length === 0) return res.json({ count: 0 });
    const stu = stuRes.rows[0];

    const subRes = await db.query(`
      SELECT s.subject_id FROM subject_assignments sa JOIN subjects s ON sa.subject_id = s.subject_id
      WHERE sa.session_id = $1 AND s.semester = $2
    `, [stu.session_id, stu.current_semester]);
    const subjectIds = subRes.rows.map(r => r.subject_id);

    const { rows } = await db.query(`
      SELECT COUNT(*) FROM notices n
      LEFT JOIN notice_reads nr ON nr.notice_id = n.notice_id AND nr.student_id = $1
      WHERE nr.read_id IS NULL
      AND (n.expires_at IS NULL OR n.expires_at > NOW())
      AND (
        n.target_type = 'department'
        OR (n.target_type = 'session' AND n.session_id = $2)
        OR (n.target_type = 'subject' AND n.subject_id = ANY($3))
      )
    `, [req.user.user_id, stu.session_id, subjectIds]);

    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notices/:notice_id/pin
const togglePin = async (req, res) => {
  try {
    const { notice_id } = req.params;
    const { is_pinned } = req.body;

    if (is_pinned) {
      const pinCount = await db.query(`SELECT COUNT(*) FROM notices WHERE is_pinned = true AND notice_id != $1 AND (expires_at IS NULL OR expires_at > NOW())`, [notice_id]);
      if (parseInt(pinCount.rows[0].count) >= 3) {
        const pinnedList = await db.query(`SELECT notice_id, title FROM notices WHERE is_pinned = true AND notice_id != $1 AND (expires_at IS NULL OR expires_at > NOW())`, [notice_id]);
        return res.status(400).json({ error: 'Maximum 3 pinned notices', pinned: pinnedList.rows });
      }
    }

    const { rows } = await db.query(`UPDATE notices SET is_pinned = $1 WHERE notice_id = $2 RETURNING *`, [is_pinned, notice_id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notices/:notice_id/stats
const getNoticeStats = async (req, res) => {
  try {
    const { notice_id } = req.params;
    const noticeRes = await db.query(`SELECT target_type, session_id, subject_id FROM notices WHERE notice_id = $1`, [notice_id]);
    if (noticeRes.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    const n = noticeRes.rows[0];

    const { rows: readRows } = await db.query(`SELECT COUNT(DISTINCT student_id) as read_count FROM notice_reads WHERE notice_id = $1`, [notice_id]);
    const read_count = parseInt(readRows[0].read_count);

    let totalQuery;
    if (n.target_type === 'department') totalQuery = `SELECT COUNT(*) FROM students`;
    else if (n.target_type === 'session') totalQuery = `SELECT COUNT(*) FROM students WHERE session_id = ${n.session_id}`;
    else totalQuery = `SELECT COUNT(*) FROM students WHERE session_id = (SELECT session_id FROM subject_assignments WHERE subject_id = ${n.subject_id} LIMIT 1)`;

    const totRes = await db.query(totalQuery);
    const total_count = parseInt(totRes.rows[0].count);

    res.json({
      read_count, total_count,
      unread_count: total_count - read_count,
      percentage: total_count > 0 ? Math.round((read_count / total_count) * 100) : 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getNotices, createNotice, updateNotice, deleteNotice,
  markRead, getUnreadCount, togglePin, getNoticeStats
};
