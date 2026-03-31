const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  checkHOD,
  checkFaculty,
  checkStudent
} = require('../middleware/roleMiddleware');
const marksController = require('../controllers/marksController');

router.use(authMiddleware);

// Setup Routes
router.get('/setup/:sa_id', checkFaculty, marksController.getMarksSetup);
router.post('/setup', checkFaculty, marksController.saveMarksSetup);

// Faculty Grading Routes
router.get('/:sa_id', checkFaculty, marksController.getMarksForEntry);
router.post('/enter', checkFaculty, marksController.saveMarksBulk);

// Dashboard & Analytics
router.get('/rank/:sa_id', marksController.getRankings); // Both faculty/student can view ranks
router.get('/distribution/:sa_id', checkFaculty, marksController.getMarksDistribution);
router.get('/hod/overview', checkHOD, marksController.getHodOverview);

// Student Routes
router.get('/student/:student_id', marksController.getStudentMarks);

module.exports = router;
