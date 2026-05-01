import { jest } from '@jest/globals';
import request from 'supertest';

// Mock the database module before app.js is imported so neon() is never
// called — these routes don't touch the DB and tests should not require one.
jest.unstable_mockModule('#config/database.js', () => ({
  db: {},
  sql: jest.fn(),
}));

const { default: app } = await import('../src/app.js');

describe('GET /health', () => {
  it('returns 200 with status OK, timestamp, and uptime', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
  });
});

describe('GET /api', () => {
  it('returns 200 with the API running message', async () => {
    const res = await request(app).get('/api');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Acquisition API is running!');
  });
});
