import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import connectDB from '../config/db.js';
import mongoose from 'mongoose';

describe('Pharmacy Store Backend Smoke & Auth Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('GET /api/health should return ok with system information', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.system).toContain('Shree Ganesh Medical');
  });

  it('POST /api/auth/login with valid admin credentials returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@ganeshpharmacy.com', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('OWNER_ADMIN');
  });

  it('POST /api/auth/login with invalid password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@ganeshpharmacy.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
