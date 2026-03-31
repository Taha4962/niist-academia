const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkStudent } = require('../middleware/roleMiddleware');
const studentController = require('../controllers/studentController');

router.use(authMiddleware);
router.use(checkStudent);

router.get('/subjects', studentController.getStudentSubjects);

module.exports = router;
