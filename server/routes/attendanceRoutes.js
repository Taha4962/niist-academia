const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkFaculty, checkHOD } = require('../middleware/roleMiddleware');
const attendanceController = require('../controllers/attendanceController');

router.use(authMiddleware);

// Static/named routes MUST come before parameterized routes in Express
// Reporting & HOD Routes
router.get('/hod/overview', checkHOD, attendanceController.getHodOverview);
router.get('/summary/:student_id', attendanceController.getStudentAttendanceSummary);
router.get('/calendar/:student_id/:subject_id/:month/:year', attendanceController.getAttendanceCalendar);

// Faculty Marking Routes (parameterized — must be below static routes)
router.post('/mark', checkFaculty, attendanceController.markBulkAttendance);
router.put('/:attendance_id', checkFaculty, attendanceController.editAttendance);
router.get('/:sa_id/:date', checkFaculty, attendanceController.getAttendanceForMarking);

module.exports = router;
