const db = require('../config/db');

// GET /api/calendar/events
// Fetch both academic calendar events and holidays for a session
const getEvents = async (req, res) => {
  try {
    const { session_id } = req.query;
    
    let queryParams = [];
    let sessionFilterAc = '';
    let sessionFilterHol = '';
    
    if (session_id && session_id !== 'all') {
      queryParams.push(session_id);
      sessionFilterAc = `WHERE session_id = $1 OR session_id IS NULL`;
      sessionFilterHol = `WHERE session_id = $1 OR session_id IS NULL`;
    }

    const acQuery = `
      SELECT calendar_id as id, title, start_date, end_date, event_type as type, 'event' as source 
      FROM academic_calendar ${sessionFilterAc}
    `;
    
    const holQuery = `
      SELECT holiday_id as id, title, date as start_date, date as end_date, 'holiday' as type, 'holiday' as source 
      FROM holidays ${sessionFilterHol}
    `;

    const acRes = await db.query(acQuery, queryParams);
    const holRes = await db.query(holQuery, queryParams);

    const allEvents = [...acRes.rows, ...holRes.rows];
    
    // Sort by start_date ASC
    allEvents.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    
    res.json(allEvents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/calendar/events
const addEvent = async (req, res) => {
  try {
    const { title, start_date, end_date, event_type, session_id } = req.body;
    
    if (event_type === 'holiday_standalone') {
      const { rows } = await db.query(
        `INSERT INTO holidays (title, date, session_id, created_by) 
         VALUES ($1, $2, $3, $4) RETURNING holiday_id as id, title, date as start_date, date as end_date, 'holiday' as type, 'holiday' as source`,
        [title, start_date, session_id || null, req.user.user_id]
      );
      return res.json(rows[0]);
    } else {
      const { rows } = await db.query(
        `INSERT INTO academic_calendar (title, start_date, end_date, event_type, session_id, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING calendar_id as id, title, start_date, end_date, event_type as type, 'event' as source`,
        [title, start_date, end_date || start_date, event_type, session_id || null, req.user.user_id]
      );
      return res.json(rows[0]);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/calendar/events/:source/:id
const deleteEvent = async (req, res) => {
  try {
    const { source, id } = req.params;
    
    if (source === 'holiday') {
      await db.query('DELETE FROM holidays WHERE holiday_id = $1', [id]);
    } else {
      await db.query('DELETE FROM academic_calendar WHERE calendar_id = $1', [id]);
    }
    
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getEvents,
  addEvent,
  deleteEvent
};
