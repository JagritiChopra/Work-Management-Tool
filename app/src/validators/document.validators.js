import { body, param, query } from 'express-validator';

export const updateDocumentValidator = [
  param('id').isMongoId().withMessage('Invalid document ID'),
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('tags').optional().isArray({ max: 10 }).withMessage('Max 10 tags allowed'),
  body('tags.*').optional().trim().isLength({ max: 30 }).withMessage('Each tag max 30 chars'),
  body('folder').optional({ nullable: true }).isMongoId().withMessage('Invalid folder ID'),
];

export const moveDocumentValidator = [
  param('id').isMongoId(),
  body('folder').optional({ nullable: true }).isMongoId().withMessage('Invalid folder ID'),
];

export const documentQueryValidator = [
  query('folder').optional({ nullable: true }).isMongoId().withMessage('Invalid folder ID'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim().isLength({ max: 100 }),
];
