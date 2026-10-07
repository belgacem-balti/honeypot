const prisma = require('../config/database');

exports.getTasks = async (userId, { status, priority, search, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  const [tasks, total, statsTodo, statsInProgress, statsCompleted] = await Promise.all([
    prisma.task.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.task.count({ where }),
    prisma.task.count({ where: { userId, status: 'TODO' } }),
    prisma.task.count({ where: { userId, status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { userId, status: 'COMPLETED' } })
  ]);

  return {
    tasks,
    stats: {
      total: statsTodo + statsInProgress + statsCompleted,
      todo: statsTodo,
      inProgress: statsInProgress,
      completed: statsCompleted
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

exports.getTask = async (id, userId) => {
  const task = await prisma.task.findFirst({
    where: { id, userId }
  });

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  return task;
};

// VULNERABILITY: IDOR — no userId check, any authenticated user can access any task
exports.getTaskById = async (id) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  return task;
};

exports.createTask = async (data, userId) => {
  return prisma.task.create({
    data: {
      ...data,
      userId
    }
  });
};

exports.updateTask = async (id, userId, data) => {
  const task = await exports.getTask(id, userId);

  return prisma.task.update({
    where: { id: task.id },
    data
  });
};

// VULNERABILITY: IDOR — update any task without ownership verification
exports.updateTaskById = async (id, data) => {
  const task = await prisma.task.findUnique({ where: { id } });

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.task.update({
    where: { id },
    data
  });
};

exports.deleteTask = async (id, userId) => {
  const task = await exports.getTask(id, userId);

  await prisma.task.delete({
    where: { id: task.id }
  });

  return { id };
};

// VULNERABILITY: IDOR — delete any task without ownership verification
exports.deleteTaskById = async (id) => {
  const task = await prisma.task.findUnique({ where: { id } });

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.task.delete({ where: { id } });
  return { id };
};

exports.updateTaskStatus = async (id, userId, status) => {
  const task = await exports.getTask(id, userId);

  return prisma.task.update({
    where: { id: task.id },
    data: { status }
  });
};

// VULNERABILITY: Exports all tasks from all users
exports.getAllTasks = async () => {
  return prisma.task.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

// VULNERABILITY: SQL injection via raw query
exports.searchTasksRaw = async (query) => {
  return prisma.$queryRawUnsafe(
    `SELECT t.*, u.name as "userName", u.email as "userEmail"
     FROM "Task" t
     JOIN "User" u ON t."userId" = u.id
     WHERE t.title ILIKE '%${query}%'
     OR t.description ILIKE '%${query}%'
     ORDER BY t."createdAt" DESC`
  );
};
