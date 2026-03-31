const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkFaculty, checkHOD } = require('../middleware/roleMiddleware');
const attendanceController = require('../controllers/attendanceController');

router.use(authMiddleware);

// Faculty & HOD Marking Routes
router.get('/:sa_id/:date', checkFaculty, attendanceController.getAttendanceForMarking);
router.post('/mark', checkFaculty, attendanceController.markBulkAttendance);
router.put('/:attendance_id', checkFaculty, attendanceController.editAttendance);

// Reporting & Calendar Routes
router.get('/summary/:student_id', attendanceController.getStudentAttendanceSummary);
router.get('/calendar/:student_id/:subject_id/:month/:year', attendanceController.getAttendanceCalendar);
router.get('/hod/overview', checkHOD, attendanceController.getHodOverview);

module.exports = router;
