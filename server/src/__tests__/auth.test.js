process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'ci_test_jwt_secret_not_for_production';
process.env.JWT_EXPIRES_IN = '7d';

jest.mock('../config/database', () => ({
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn()
  },
  task: {
    count: jest.fn()
  },
  $queryRawUnsafe: jest.fn(),
  $disconnect: jest.fn()
}));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const app = require('../app');

describe('Auth API', () => {
  const testUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: bcrypt.hashSync('password123', 10)
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      prisma.user.create.mockResolvedValue({
        ...testUser,
        name: 'Test User',
        email: 'test@example.com'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.data.user).toHaveProperty('name', 'Test User');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject duplicate email registration', async () => {
      const duplicateError = new Error('Unique constraint failed');
      duplicateError.code = 'P2002';
      prisma.user.create.mockRejectedValue(duplicateError);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User Duplicate',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(testUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged in successfully');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
    });

    it('should reject invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(testUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.status === 'error' || response.body.success === false).toBe(true);
    });
  });
});
