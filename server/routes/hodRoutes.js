const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkHOD } = require('../middleware/roleMiddleware');
const hodController = require('../controllers/hodController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.use(authMiddleware, checkHOD);

// Faculty Management
router.get('/faculty', hodController.getFaculty);
router.post('/faculty', hodController.addFaculty);
router.put('/faculty/:id', hodController.updateFaculty);
router.put('/faculty/:id/deactivate', hodController.deactivateFaculty);
router.put('/faculty/:id/activate', hodController.activateFaculty);
router.get('/faculty/:id/logs', hodController.getFacultyLogs);

// Student Management
router.get('/students', hodController.getStudents);
router.get('/students/:id', hodController.getStudentById);
router.post('/students/bulk-upload', upload.single('file'), hodController.bulkUploadStudents);
router.put('/students/:id', hodController.updateStudent);

// Subjects & Assignments
router.get('/subjects', hodController.getSubjects);
router.post('/subjects', hodController.addSubject);
router.get('/subject-assignments', hodController.getSubjectAssignments);
router.post('/subject-assignments', hodController.assignSubject);
router.delete('/subject-assignments/:id', hodController.removeSubjectAssignment);

// Dashboard Stats & Analytics
router.get('/stats', hodController.getDashboardStats);
router.get('/attendance-distribution', hodController.getAttendanceDistribution);
router.get('/marks-distribution', hodController.getMarksDistribution);
router.get('/session-comparison', hodController.getSessionComparison);

// Search & Security Logs
router.get('/students/search', hodController.searchStudents);
router.get('/login-logs', hodController.getLoginLogs);

module.exports = router;
