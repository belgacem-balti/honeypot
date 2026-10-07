const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Authenticated routes (normal)
router.get('/', protect, taskController.getTasks);
router.post('/', protect, taskController.createTask);
router.get('/:id', protect, taskController.getTask);
router.put('/:id', protect, taskController.updateTask);
router.delete('/:id', protect, taskController.deleteTask);
router.patch('/:id/status', protect, taskController.updateTaskStatus);

// VULNERABILITY: IDOR — these endpoints use auth but don't check ownership
router.get('/public/:id', protect, taskController.getTaskPublic);
router.put('/public/:id', protect, taskController.updateTaskPublic);
router.delete('/public/:id', protect, taskController.deleteTaskPublic);

module.exports = router;
