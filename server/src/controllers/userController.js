const { body, validationResult } = require('express-validator');
const userService = require('../services/userService');
const { successResponse } = require('../utils/apiResponse');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
    return successResponse(res, user, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = [
  body('name').optional().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const err = new Error('Validation error');
        err.statusCode = 400;
        err.errors = errors.array();
        return next(err);
      }

      const { name, email } = req.body;
      const data = {};
      if (name) data.name = name;
      if (email) data.email = email;

      const user = await userService.updateProfile(req.user.id, data);
      return successResponse(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
];

exports.updatePassword = [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const err = new Error('Validation error');
        err.statusCode = 400;
        err.errors = errors.array();
        return next(err);
      }

      const { currentPassword, newPassword } = req.body;
      const result = await userService.updatePassword(req.user.id, currentPassword, newPassword);
      return successResponse(res, result, 'Password updated successfully');
    } catch (error) {
      next(error);
    }
  }
];
