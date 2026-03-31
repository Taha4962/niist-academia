const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkFaculty, checkStudent } = require('../middleware/roleMiddleware');
const notesController = require('../controllers/notesController');
const upload = require('../middleware/uploadMiddleware');

router.use(authMiddleware);

// Student Routes
router.get('/student/subjects', checkStudent, notesController.getStudentNotes);
router.get('/download/:note_id', notesController.downloadNote); // both faculty and student use this

// Faculty Routes
router.get('/:sa_id', checkFaculty, notesController.getFacultyNotes);
router.post('/upload', checkFaculty, upload.single('file'), (err, req, res, next) => {
  if (err) return res.status(400).json({ message: err.message });
  next();
}, notesController.uploadNote);
router.put('/:note_id', checkFaculty, notesController.updateNoteTitle);
router.delete('/:note_id', checkFaculty, notesController.deleteNote);

module.exports = router;
