const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.register = async (name, email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword
    }
  });
  
  const { password: _, ...userWithoutPassword } = user;
  const token = exports.generateToken(user.id);
  
  return { user: userWithoutPassword, token };
};

exports.login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }
  
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }
  
  const { password: _, ...userWithoutPassword } = user;
  const token = exports.generateToken(user.id);
  
  return { user: userWithoutPassword, token };
};

exports.getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
