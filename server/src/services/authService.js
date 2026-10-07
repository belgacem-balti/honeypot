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

  // VULNERABILITY: User enumeration — different messages for "no user" vs "wrong password"
  if (!user) {
    const error = new Error('No account found with this email address');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error('Incorrect password');
    error.statusCode = 401;
    throw error;
  }

  const { password: _, ...userWithoutPassword } = user;
  const token = exports.generateToken(user.id);

  // VULNERABILITY: Include password hash in debug mode
  return {
    user: userWithoutPassword,
    token,
    // VULNERABILITY: Leaking internal info
    _debug: {
      tokenExpiresIn: process.env.JWT_EXPIRES_IN,
      hashRounds: 10,
      algorithm: 'HS256'
    }
  };
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

// VULNERABILITY: Password reset without email verification or token
exports.resetPassword = async (email, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });

  return { message: 'Password updated', email };
};
