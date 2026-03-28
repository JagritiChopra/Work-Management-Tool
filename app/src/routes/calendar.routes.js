import { Router } from 'express';
import * as calendarCtrl from '../controllers/calendar.controller.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  createCalendarTaskValidator,
  updateCalendarTaskValidator,
  calendarRangeQuery,
} from '../validators/calendar.validators.js';
import { param } from 'express-validator';

const router = Router();
router.use(protect);

router.get('/date/:date', [param('date').isISO8601()], validate, calendarCtrl.getTasksByDate);

router.route('/')
  .get(calendarRangeQuery, validate, calendarCtrl.getCalendarTasks)
  .post(createCalendarTaskValidator, validate, calendarCtrl.createCalendarTask);

router.route('/:id')
  .get([param('id').isMongoId()], validate, calendarCtrl.getCalendarTask)
  .patch(updateCalendarTaskValidator, validate, calendarCtrl.updateCalendarTask)
  .delete([param('id').isMongoId()], validate, calendarCtrl.deleteCalendarTask);

export default router;
