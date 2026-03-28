import { body, param, query } from 'express-validator';

export const createCalendarTaskValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Invalid date format'),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid color hex'),
  body('allDay').optional().isBoolean(),
];

export const updateCalendarTaskValidator = [
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  body('isCompleted').optional().isBoolean(),
  body('allDay').optional().isBoolean(),
];

export const calendarRangeQuery = [
  query('start').optional().isISO8601().withMessage('Invalid start date'),
  query('end').optional().isISO8601().withMessage('Invalid end date'),
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
];
