const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const prisma = require('./config/database');

const app = express();

// VULNERABILITY: Overly permissive JSON body size limit
app.use(express.json({ limit: '50mb' }));

// VULNERABILITY: Wildcard CORS — allows any origin
app.use(cors({
  origin: '*',
  credentials: true
}));

// VULNERABILITY: Server information disclosure via headers
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Express 4.18.2');
  res.setHeader('Server', 'TaskFlow/2.1.0 (Ubuntu 22.04, Node 18.17.0)');
  next();
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

// VULNERABILITY: Debug endpoint leaks server internals
app.get('/api/debug', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const taskCount = await prisma.task.count();

    res.json({
      status: 'debug',
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        pid: process.pid,
        cwd: process.cwd(),
        env: {
          NODE_ENV: process.env.NODE_ENV || 'development',
          DATABASE_URL: process.env.DATABASE_URL,
          JWT_SECRET: process.env.JWT_SECRET,
          JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
          CLIENT_URL: process.env.CLIENT_URL,
          PORT: process.env.PORT
        }
      },
      database: {
        users: userCount,
        tasks: taskCount,
        provider: 'PostgreSQL 16'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// VULNERABILITY: Config endpoint leaks application config
app.get('/api/config', (req, res) => {
  res.json({
    app: 'TaskFlow',
    version: '2.1.0',
    database: {
      host: 'postgres',
      port: 5432,
      name: 'taskflow',
      user: 'postgres'
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN
    },
    features: {
      registration: true,
      passwordReset: false,
      twoFactor: false
    }
  });
});

// VULNERABILITY: Backup endpoint exposes all users
app.get('/api/backup/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { tasks: true }
    });
    res.json({
      backup: true,
      exportDate: new Date().toISOString(),
      data: users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY: Raw SQL query endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ results: [] });

    // VULNERABILITY: SQL Injection via $queryRawUnsafe
    const results = await prisma.$queryRawUnsafe(
      `SELECT id, title, description, status, priority, "createdAt" FROM "Task" WHERE title ILIKE '%${q}%' OR description ILIKE '%${q}%' LIMIT 20`
    );
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message, query: req.query.q });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// VULNERABILITY: Verbose error in 404 handler
app.all('*', (req, res, next) => {
  const err = new Error(`Route ${req.method} ${req.originalUrl} not found on this server`);
  err.statusCode = 404;
  err.details = {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    ip: req.ip,
    timestamp: new Date().toISOString()
  };
  next(err);
});

// VULNERABILITY: Verbose error handler leaks stack traces
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: 'error',
    message: err.message,
    errors: err.errors || undefined,
    details: err.details || undefined,
    // VULNERABILITY: Always expose stack trace
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
