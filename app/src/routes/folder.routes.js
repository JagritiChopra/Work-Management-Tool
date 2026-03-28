import { Router } from 'express';
import * as folderCtrl from '../controllers/folder.controller.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  createFolderValidator,
  updateFolderValidator,
  moveFolderValidator,
} from '../validators/folder.validators.js';
import { param } from 'express-validator';

const router = Router();
router.use(protect);

router.get('/tree', folderCtrl.getFolderTree);

router.route('/')
  .get(folderCtrl.getFolders)
  .post(createFolderValidator, validate, folderCtrl.createFolder);

router.route('/:id')
  .patch(updateFolderValidator, validate, folderCtrl.updateFolder)
  .delete([param('id').isMongoId()], validate, folderCtrl.deleteFolder);

router.patch('/:id/move', moveFolderValidator, validate, folderCtrl.moveFolder);

export default router;
