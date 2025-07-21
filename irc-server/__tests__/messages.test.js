const request = require('supertest');
const express = require('express');

jest.mock('../models/Message');
const Message = require('../models/Message');

const messageRoutes = require('../routes/messages');

const app = express();
app.use(express.json());
app.use('/api/messages', messageRoutes);

describe('Messages API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/messages', () => {
    it('should return 200 and messages list', async () => {
      Message.find.mockReturnValueOnce({ sort: jest.fn().mockResolvedValueOnce([{ text: 'Hello' }]) });
      const res = await request(app).get('/api/messages');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 500 on error', async () => {
      Message.find.mockImplementationOnce(() => { throw new Error('fail'); });
      const res = await request(app).get('/api/messages');
      expect(res.statusCode).toBe(500);
    });
  });

  describe('POST /api/messages', () => {
    it('should return 400 if missing fields', async () => {
      const res = await request(app).post('/api/messages').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Tous les champs sont requis/);
    });

    it('should return 201 and new message', async () => {
      const fakeMessage = { userId: '1', username: 'user', text: 'Hello' };
      // Mock le constructeur pour retourner fakeMessage
      Message.mockImplementation(() => fakeMessage);
      // Mock save pour retourner fakeMessage
      Message.prototype.save = jest.fn().mockResolvedValueOnce(fakeMessage);

      const res = await request(app).post('/api/messages').send(fakeMessage);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('userId', '1');
      expect(res.body).toHaveProperty('username', 'user');
      expect(res.body).toHaveProperty('text', 'Hello');
    });
  });
}); 