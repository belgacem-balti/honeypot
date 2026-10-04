const { listNotifications, markRead, markAllRead, unreadCount } = require('../services/notificationService');
const { successResponse } = require('../utils/apiResponse');

exports.list = async (req, res, next) => {
  try {
    const items = await listNotifications(req.user.id);
    return successResponse(res, items, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.unreadCount = async (req, res, next) => {
  try {
    const count = await unreadCount(req.user.id);
    return successResponse(res, { count }, 'Unread count retrieved');
  } catch (error) {
    next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const item = await markRead(req.user.id, req.params.id);
    if (!item) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }
    return successResponse(res, item, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const items = await markAllRead(req.user.id);
    return successResponse(res, items, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};
