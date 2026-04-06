const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkFaculty, checkStudent } = require('../middleware/roleMiddleware');
const assignmentController = require('../controllers/assignmentController');

router.use(authMiddleware);

// Student Routes (before /:sa_id to avoid conflict)
router.get('/student/all', checkStudent, assignmentController.getStudentAssignments);
router.get('/upcoming/student', checkStudent, assignmentController.getStudentUpcoming);
router.get('/upcoming/faculty', checkFaculty, assignmentController.getFacultyUpcoming);

// AI Generation
router.post('/ai-generate', checkFaculty, assignmentController.generateAIAssignment);

// Submissions
router.get('/:ca_id/submissions', checkFaculty, assignmentController.getAssignmentSubmissions);
router.put('/submissions/:submission_id', checkFaculty, assignmentController.updateSubmission);

// Faculty Assignment CRUD
router.get('/:sa_id', checkFaculty, assignmentController.getAssignments);
router.post('/', checkFaculty, assignmentController.createAssignment);
router.put('/:ca_id', checkFaculty, assignmentController.updateAssignment);
router.delete('/:ca_id', checkFaculty, assignmentController.deleteAssignment);

module.exports = router;
