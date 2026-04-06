const pool = require('../config/db')

const getHolidays = async (req, res) => {
  try {
    const { session_id } = req.query
    const result = await pool.query(`
      SELECT h.*, f.name as created_by_name
      FROM holidays h
      LEFT JOIN faculty f
        ON h.created_by = f.faculty_id
      WHERE h.session_id = $1
      OR h.session_id IS NULL
      ORDER BY h.date ASC
    `, [session_id || null])
    res.json({ holidays: result.rows })
  } catch (error) {
    res.status(500).json({
      error: error.message })
  }
}

const addHoliday = async (req, res) => {
  try {
    const { title, date, session_id } = req.body
    const faculty_id = req.user.faculty_id

    if (!title || !date) {
      return res.status(400).json({
        error: 'Title and date are required'
      })
    }

    const result = await pool.query(`
      INSERT INTO holidays
      (title, date, session_id, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [title, date,
        session_id || null,
        faculty_id])

    res.status(201).json({
      holiday: result.rows[0],
      message: 'Holiday added successfully'
    })
  } catch (error) {
    res.status(500).json({
      error: error.message })
  }
}

const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query(`
      DELETE FROM holidays
      WHERE holiday_id = $1
    `, [id])
    res.json({
      message: 'Holiday deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      error: error.message })
  }
}

module.exports = {
  getHolidays,
  addHoliday,
  deleteHoliday
}
