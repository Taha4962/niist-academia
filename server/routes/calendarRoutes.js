const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkHOD } = require('../middleware/roleMiddleware');
const calendarController = require('../controllers/calendarController');

router.use(authMiddleware);

router.get('/events', calendarController.getEvents);
router.post('/events', checkHOD, calendarController.addEvent);
router.delete('/events/:source/:id', checkHOD, calendarController.deleteEvent);

module.exports = router;
