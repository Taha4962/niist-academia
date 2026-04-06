const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../config/db');

router.use(authMiddleware);

// GET /api/sessions — Returns all sessions (used in NoticeBoard, forms, etc.)
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT session_id, session_name, start_year, end_year FROM sessions ORDER BY start_year DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sessions/:id — Returns a single session
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT session_id, session_name, start_year, end_year FROM sessions WHERE session_id = $1',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Session not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
