const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const { createAutoNotice } = require('../utils/noticeHelper');

const getFacultyNotes = async (req, res) => {
  try {
    const { sa_id } = req.params;
    const { rows } = await db.query(`
      SELECT n.*, f.name as uploaded_by
      FROM notes n
      JOIN subject_assignments sa ON n.sa_id = sa.sa_id
      LEFT JOIN faculty f ON sa.faculty_id = f.faculty_id
      WHERE n.sa_id = $1
      ORDER BY n.unit_no, n.uploaded_at DESC
    `, [sa_id]);
    
    const grouped = {};
    for (let i = 1; i <= 6; i++) grouped[i] = [];
    rows.forEach(r => grouped[r.unit_no]?.push(r));

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const uploadNote = async (req, res) => {
  try {
    const { sa_id, unit_no, title } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: 'No valid file provided' });

    const file_url = `/uploads/${file.filename}`;
    const file_type = path.extname(file.originalname).replace('.', '').toLowerCase();
    const file_size = file.size; 

    const { rows } = await db.query(`
      INSERT INTO notes (sa_id, unit_no, title, file_url, file_type, file_size)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [sa_id, unit_no, title, file_url, file_type, file_size]);

    const new_note = rows[0];

    const saInfo = await db.query(`
      SELECT sa.faculty_id, sa.session_id, sa.subject_id, s.subject_name 
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.subject_id
      WHERE sa.sa_id = $1
    `, [sa_id]);

    if (saInfo.rows.length > 0) {
      const sa = saInfo.rows[0];
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await createAutoNotice({
        faculty_id: sa.faculty_id,
        session_id: sa.session_id,
        subject_id: sa.subject_id,
        target_type: 'subject',
        title: `New Notes — ${sa.subject_name} Unit ${unit_no}`,
        content: `New study material has been uploaded for ${sa.subject_name} Unit ${unit_no}. Title: ${title}. Check the Notes section to view and download.`,
        ref_type: 'note',
        ref_id: new_note.note_id,
        expires_at: expiresAt,
        pool: db
      });
    }

    res.json({ note: new_note, message: 'Notes uploaded' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateNoteTitle = async (req, res) => {
  try {
    const { note_id } = req.params;
    const { title } = req.body;
    
    const { rows } = await db.query(`
      UPDATE notes SET title = $1
      WHERE note_id = $2
      RETURNING *
    `, [title, note_id]);

    if(rows.length === 0) return res.status(404).json({ message: 'Note not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { note_id } = req.params;
    const noteRes = await db.query(`SELECT file_url FROM notes WHERE note_id = $1`, [note_id]);
    if (noteRes.rows.length === 0) return res.status(404).json({ message: 'Note not found' });
    
    const file_url = noteRes.rows[0].file_url;
    const filename = file_url.split('/uploads/')[1];
    const filepath = path.join(__dirname, '..', 'uploads', filename);

    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    await db.query(`DELETE FROM notes WHERE note_id = $1`, [note_id]);

    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStudentNotes = async (req, res) => {
  try {
    const studentInfo = await db.query(`SELECT session_id, current_semester FROM students WHERE student_id = $1`, [req.user.user_id]);
    if (studentInfo.rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    
    const stu = studentInfo.rows[0];
    const { rows } = await db.query(`
      SELECT n.*, s.subject_name, s.subject_code, sa.sa_id
      FROM notes n
      JOIN subject_assignments sa ON n.sa_id = sa.sa_id
      JOIN subjects s ON sa.subject_id = s.subject_id
      WHERE sa.session_id = $1 AND s.semester = $2
      ORDER BY s.subject_name, n.unit_no, n.uploaded_at DESC
    `, [stu.session_id, stu.current_semester]);

    const formatted = {};
    rows.forEach(note => {
      const subKey = JSON.stringify({ name: note.subject_name, code: note.subject_code, sa_id: note.sa_id });
      if (!formatted[subKey]) formatted[subKey] = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
      formatted[subKey][note.unit_no]?.push(note);
    });

    const finalResponse = Object.keys(formatted).map(key => ({ subject: JSON.parse(key), units: formatted[key] }));
    res.json(finalResponse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const downloadNote = async (req, res) => {
  try {
    const { note_id } = req.params;
    const noteRes = await db.query(`SELECT file_url, title, file_type FROM notes WHERE note_id = $1`, [note_id]);
    if (noteRes.rows.length === 0) return res.status(404).json({ message: 'Note not found' });
    
    const note = noteRes.rows[0];
    const filename = note.file_url.split('/uploads/')[1];
    const filepath = path.join(__dirname, '..', 'uploads', filename);

    if (!fs.existsSync(filepath)) return res.status(404).json({ message: 'File not found' });

    const originalName = `${note.title.replace(/[^a-zA-Z0-9 -]/g, '')}.${note.file_type}`;
    res.download(filepath, originalName);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getFacultyNotes, uploadNote, updateNoteTitle, deleteNote, getStudentNotes, downloadNote };
