import { body, param, query } from 'express-validator';

export const createSessionValidator = [
  body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Invalid date'),
  body('startTime')
    .notEmpty().withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long'),
];

export const updateSessionValidator = [
  param('id').isMongoId().withMessage('Invalid session ID'),
  body('date').optional().isISO8601().withMessage('Invalid date'),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('notes').optional().trim().isLength({ max: 500 }),
];

export const sessionQueryValidator = [
  query('date').optional().isISO8601().withMessage('Invalid date'),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2000, max: 2100 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
