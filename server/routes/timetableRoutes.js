const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkHOD } = require('../middleware/roleMiddleware');
const timetableController = require('../controllers/timetableController');

router.use(authMiddleware);

// Slots API
router.get('/slots', timetableController.getSlots);
router.post('/slots', checkHOD, timetableController.addSlot);
router.put('/slots/:id', checkHOD, timetableController.updateSlot);
router.delete('/slots/:id', checkHOD, timetableController.deleteSlot);

// Timetable API
router.get('/faculty/mine', timetableController.getFacultyTimetable);
router.get('/student/mine', timetableController.getStudentTimetable);
router.get('/:session_id/:semester', timetableController.getTimetable);
router.post('/', checkHOD, timetableController.addTimetableEntry);
router.delete('/:id', checkHOD, timetableController.deleteTimetableEntry);
router.post('/publish', checkHOD, timetableController.publishTimetable);

module.exports = router;
