const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkFaculty } = require('../middleware/roleMiddleware');
const facultyController = require('../controllers/facultyController');

const uploadMiddleware = require('../middleware/uploadMiddleware');

router.use(authMiddleware);
router.use(checkFaculty); // Ensure only faculty/HOD can access

router.get('/subjects', facultyController.getFacultySubjects);
router.get('/subjects/:sa_id/topics', facultyController.getSyllabusTopics);
router.post('/subjects/:sa_id/topics', facultyController.addSyllabusTopic);
router.put('/topics/:topic_id/complete', facultyController.toggleTopicComplete);
router.delete('/topics/:topic_id', facultyController.deleteTopic);

// Profile Routes
router.get('/profile/me', facultyController.getMyProfile);
router.put('/profile/me', facultyController.updateMyProfile);
// The checkFaculty middleware is active globally here, so we only need to additionally checkHOD
const { checkHOD } = require('../middleware/roleMiddleware');
router.put('/profile/hod', checkHOD, facultyController.updateHodProfile);
router.post('/profile/photo', uploadMiddleware.single('file'), facultyController.uploadProfilePhoto);
router.put('/profile/password', facultyController.changeOwnPassword);

// Get students for a subject
router.get('/students/:sa_id', facultyController.getSubjectStudents);

// Get one student detail
router.get('/students/detail/:student_id', facultyController.getStudentDetailForFaculty);

module.exports = router;
