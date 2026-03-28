import { Router } from 'express';
import * as documentCtrl from '../controllers/document.controller.js';
import { protect } from '../middleware/auth.js';
import { handleDocumentUpload } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import validate from '../middleware/validate.js';
import {
  updateDocumentValidator,
  moveDocumentValidator,
  documentQueryValidator,
} from '../validators/document.validators.js';
import { param } from 'express-validator';

const router = Router();
router.use(protect);

router.route('/')
  .get(documentQueryValidator, validate, documentCtrl.getDocuments)
  .post(uploadLimiter, handleDocumentUpload, documentCtrl.uploadDocument);

router.route('/:id')
  .get([param('id').isMongoId()], validate, documentCtrl.getDocument)
  .patch(updateDocumentValidator, validate, documentCtrl.updateDocument)
  .delete([param('id').isMongoId()], validate, documentCtrl.deleteDocument);

router.put('/:id/file', uploadLimiter, [param('id').isMongoId()], validate, handleDocumentUpload, documentCtrl.replaceDocument);
router.patch('/:id/move', moveDocumentValidator, validate, documentCtrl.moveDocument);

export default router;
