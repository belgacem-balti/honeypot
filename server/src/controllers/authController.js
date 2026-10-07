const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const prisma = require('../config/database');

exports.register = [
  body('name').notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const err = new Error('Validation error');
        err.statusCode = 400;
        err.errors = errors.array();
        return next(err);
      }

      const { name, email, password } = req.body;
      const data = await authService.register(name, email, password);
      return successResponse(res, data, 'User registered successfully', 201);
    } catch (error) {
      // VULNERABILITY: User enumeration — different error messages for existing vs non-existing users
      if (error.code === 'P2002') {
        return errorResponse(res, 'A user with this email already exists', 409);
      }
      next(error);
    }
  }
];

exports.login = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const err = new Error('Validation error');
        err.statusCode = 400;
        err.errors = errors.array();
        return next(err);
      }

      const { email, password } = req.body;
      const data = await authService.login(email, password);
      return successResponse(res, data, 'Logged in successfully', 200);
    } catch (error) {
      next(error);
    }
  }
];

exports.getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return successResponse(res, user, 'User profile retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

// VULNERABILITY: User enumeration — check if email is registered
exports.checkEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    if (user) {
      return successResponse(res, { exists: true, user }, 'User found');
    }
    return successResponse(res, { exists: false }, 'User not found');
  } catch (error) {
    next(error);
  }
};

// VULNERABILITY: Password reset without proper token — just takes email and new password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return errorResponse(res, 'Email and new password are required', 400);
    }

    const result = await authService.resetPassword(email, newPassword);
    return successResponse(res, result, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};
