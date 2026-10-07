const { body, validationResult } = require('express-validator');
const taskService = require('../services/taskService');
const { successResponse } = require('../utils/apiResponse');

exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, search, page, limit } = req.query;
    const result = await taskService.getTasks(req.user.id, { status, priority, search, page, limit });
    return successResponse(res, result, 'Tasks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await taskService.getTask(req.params.id, req.user.id);
    return successResponse(res, task, 'Task retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// VULNERABILITY: IDOR — get any task by ID without ownership check
exports.getTaskPublic = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    return successResponse(res, task, 'Task retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.createTask = [
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title must be at most 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be at most 500 characters'),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'COMPLETED']).withMessage('Invalid status'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid priority'),
  body('dueDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid date format'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const err = new Error('Validation error');
        err.statusCode = 400;
        err.errors = errors.array();
        return next(err);
      }

      const task = await taskService.createTask(req.body, req.user.id);
      return successResponse(res, task, 'Task created successfully', 201);
    } catch (error) {
      next(error);
    }
  }
];

exports.updateTask = [
  body('title').optional().isLength({ max: 100 }).withMessage('Title must be at most 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be at most 500 characters'),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'COMPLETED']).withMessage('Invalid status'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid priority'),
  body('dueDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid date format'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const err = new Error('Validation error');
        err.statusCode = 400;
        err.errors = errors.array();
        return next(err);
      }

      const task = await taskService.updateTask(req.params.id, req.user.id, req.body);
      return successResponse(res, task, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  }
];

// VULNERABILITY: IDOR — update any task without ownership check
exports.updateTaskPublic = async (req, res, next) => {
  try {
    const task = await taskService.updateTaskById(req.params.id, req.body);
    return successResponse(res, task, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.params.id, req.user.id);
    return successResponse(res, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

// VULNERABILITY: IDOR — delete any task without ownership check
exports.deleteTaskPublic = async (req, res, next) => {
  try {
    await taskService.deleteTaskById(req.params.id);
    return successResponse(res, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.updateTaskStatus = [
  body('status').notEmpty().withMessage('Status is required').isIn(['TODO', 'IN_PROGRESS', 'COMPLETED']).withMessage('Invalid status'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const err = new Error('Validation error');
        err.statusCode = 400;
        err.errors = errors.array();
        return next(err);
      }

      const task = await taskService.updateTaskStatus(req.params.id, req.user.id, req.body.status);
      return successResponse(res, task, 'Task status updated successfully');
    } catch (error) {
      next(error);
    }
  }
];

// VULNERABILITY: Bulk export all tasks — no auth required via admin route
exports.exportAllTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getAllTasks();
    return successResponse(res, { tasks, count: tasks.length }, 'All tasks exported');
  } catch (error) {
    next(error);
  }
};
