import { Router } from 'express';
import * as taskCtrl from '../controllers/task.controller.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  createTaskValidator,
  updateTaskValidator,
  mongoIdParam,
  taskQueryValidator,
} from '../validators/task.validators.js';

const router = Router();
router.use(protect);

router.get('/kanban', taskCtrl.getKanban);
router.patch('/bulk-status', taskCtrl.bulkUpdateStatus);

router.route('/')
  .get(taskQueryValidator, validate, taskCtrl.getTasks)
  .post(createTaskValidator, validate, taskCtrl.createTask);

router.route('/:id')
  .get(mongoIdParam, validate, taskCtrl.getTask)
  .patch(updateTaskValidator, validate, taskCtrl.updateTask)
  .delete(mongoIdParam, validate, taskCtrl.deleteTask);

export default router;
