const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const taskController = require('../controllers/taskController');

// VULNERABILITY: No authentication middleware on admin routes

// List all users with password hashes
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      status: 'success',
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Get single user by ID — includes password hash
router.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { tasks: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete any user
router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    res.json({ status: 'success', message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export all tasks
router.get('/tasks', taskController.exportAllTasks);

// VULNERABILITY: SQL injection via raw query on admin search
router.get('/search', async (req, res) => {
  try {
    const { table, q } = req.query;
    const allowedTables = ['User', 'Task'];
    const targetTable = allowedTables.includes(table) ? table : 'Task';

    // VULNERABILITY: SQL injection — q parameter is injected directly
    const results = await prisma.$queryRawUnsafe(
      `SELECT * FROM "${targetTable}" WHERE CAST(id AS TEXT) LIKE '%${q}%' OR CAST("createdAt" AS TEXT) LIKE '%${q}%' LIMIT 50`
    );

    res.json({ status: 'success', data: results, table: targetTable });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      query: req.query,
      hint: 'Use table=User or table=Task and q=search_term'
    });
  }
});

// Server stats
router.get('/stats', async (req, res) => {
  try {
    const [userCount, taskCount, tasksByStatus, tasksByPriority] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.task.groupBy({ by: ['status'], _count: true }),
      prisma.task.groupBy({ by: ['priority'], _count: true })
    ]);

    res.json({
      status: 'success',
      data: {
        users: userCount,
        tasks: taskCount,
        byStatus: tasksByStatus,
        byPriority: tasksByPriority,
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
