const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../models/User');
const User = require('../models/User');

const authRoutes = require('../routes/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Mock JWT secret
process.env.JWT_SECRET = 'testsecret';

describe('Auth API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should return 400 if missing fields', async () => {
      const res = await request(app).post('/api/auth/signup').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/fournir un nom d'utilisateur/);
    });

    it('should return 400 if email already used', async () => {
      User.findOne.mockResolvedValueOnce({ email: 'test@test.com' });
      const res = await request(app).post('/api/auth/signup').send({ username: 'user', email: 'test@test.com', password: 'pass' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/déjà utilisé/);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if missing fields', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/fournir un email et un mot de passe/);
    });

    it('should return 404 if user not found', async () => {
      User.findOne.mockResolvedValueOnce(null);
      const res = await request(app).post('/api/auth/login').send({ email: 'notfound@test.com', password: 'pass' });
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/Utilisateur non trouvé/);
    });
  });

  describe('GET /api/auth/userinfo', () => {
    it('should return 401 if token is missing', async () => {
      const res = await request(app).get('/api/auth/userinfo');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/Token manquant/);
    });

    it('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/userinfo')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/Token invalide/);
    });
  });
}); 