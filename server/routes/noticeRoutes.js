const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkFaculty, checkStudent, checkHOD } = require('../middleware/roleMiddleware');
const noticeController = require('../controllers/noticeController');

router.use(authMiddleware);

router.get('/unread-count', checkStudent, noticeController.getUnreadCount);
router.get('/', noticeController.getNotices);
router.post('/', checkFaculty, noticeController.createNotice);
router.put('/:notice_id/pin', checkFaculty, noticeController.togglePin);
router.get('/:notice_id/stats', checkFaculty, noticeController.getNoticeStats);
router.post('/:notice_id/read', checkStudent, noticeController.markRead);
router.put('/:notice_id',
  authMiddleware,
  checkFaculty,
  noticeController.updateNotice);
router.delete('/:notice_id',
  authMiddleware,
  checkFaculty,
  noticeController.deleteNotice);

module.exports = router;
