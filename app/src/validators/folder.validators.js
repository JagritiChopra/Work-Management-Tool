import { body, param } from 'express-validator';

export const createFolderValidator = [
  body('name').trim().notEmpty().withMessage('Folder name is required').isLength({ max: 100 }),
  body('parent').optional({ nullable: true }).isMongoId().withMessage('Invalid parent folder ID'),
  body('color').optional().matches(/^#([A-Fa-f0-9]{6})$/).withMessage('Invalid color hex'),
];

export const updateFolderValidator = [
  param('id').isMongoId().withMessage('Invalid folder ID'),
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('color').optional().matches(/^#([A-Fa-f0-9]{6})$/),
];

export const moveFolderValidator = [
  param('id').isMongoId(),
  body('parent').optional({ nullable: true }).isMongoId().withMessage('Invalid parent folder ID'),
];
