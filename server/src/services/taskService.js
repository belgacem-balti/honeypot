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

exports.deleteTask = async (id, userId) => {
  const task = await exports.getTask(id, userId);
  
  await prisma.task.delete({
    where: { id: task.id }
  });
  
  return { id };
};

exports.updateTaskStatus = async (id, userId, status) => {
  const task = await exports.getTask(id, userId);
  
  return prisma.task.update({
    where: { id: task.id },
    data: { status }
  });
};
