const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkStudent } = require('../middleware/roleMiddleware');
const studentController = require('../controllers/studentController');

router.use(authMiddleware);
router.use(checkStudent);

router.get('/subjects', studentController.getStudentSubjects);
router.get('/profile', studentController.getStudentProfile);
router.put('/profile', studentController.updateStudentProfile);
router.put('/profile/password', studentController.changeStudentPassword);

module.exports = router;

