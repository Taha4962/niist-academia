const express = require('express')
const router = express.Router()
const {
  getHolidays,
  addHoliday,
  deleteHoliday
} = require('../controllers/holidayController')
const authMiddleware =
  require('../middleware/authMiddleware')
const { checkHOD } =
  require('../middleware/roleMiddleware')

router.get('/',
  authMiddleware,
  getHolidays)

router.post('/',
  authMiddleware,
  checkHOD,
  addHoliday)

router.delete('/:id',
  authMiddleware,
  checkHOD,
  deleteHoliday)

module.exports = router
