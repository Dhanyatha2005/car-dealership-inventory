import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from './error-handler';
import { notFound } from './not-found';

describe('notFound', () => {
  it('returns 404 ROUTE_NOT_FOUND', async () => {
    const app = express();
    app.use(notFound);
    app.use(errorHandler);
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
