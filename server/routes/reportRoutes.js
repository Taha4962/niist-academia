const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkHOD } = require('../middleware/roleMiddleware');
const { getStudentAttendancePDF, getStudentMarksPDF, getSessionAttendancePDF, getSessionMarksPDF } = require('../controllers/reportController');

router.use(authMiddleware);

// Student-level reports (student can download own, HOD can download any)
router.get('/attendance/session/:session_id', checkHOD, getSessionAttendancePDF);
router.get('/marks/session/:session_id', checkHOD, getSessionMarksPDF);
router.get('/attendance/:student_id', getStudentAttendancePDF);
router.get('/marks/:student_id', getStudentMarksPDF);

module.exports = router;
