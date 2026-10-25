import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ConflictError } from '../core/errors';
import { errorHandler } from './error-handler';

function appThrowing(error: unknown) {
  const app = express();
  app.use(express.json({ limit: '10b' }));
  app.post('/json', (_req, res) => {
    res.json({ ok: true });
  });
  app.get('/boom', () => {
    throw error;
  });
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('maps an AppError to its status and envelope', async () => {
    const res = await request(
      appThrowing(new ConflictError('INSUFFICIENT_STOCK', 'Not enough', { available: 1 })),
    ).get('/boom');
    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: { code: 'INSUFFICIENT_STOCK', message: 'Not enough', details: { available: 1 } },
    });
  });

  it('maps a ZodError to 400 VALIDATION_ERROR with issues', async () => {
    const result = z.object({ name: z.string() }).safeParse({});
    const res = await request(appThrowing(result.error)).get('/boom');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].path).toEqual(['name']);
  });

  it('maps malformed JSON to 400 INVALID_JSON', async () => {
    const res = await request(appThrowing(null))
      .post('/json')
      .set('Content-Type', 'application/json')
      .send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('maps an oversized body to 413 PAYLOAD_TOO_LARGE', async () => {
    const res = await request(appThrowing(null))
      .post('/json')
      .send({ text: 'much too long for the limit' });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('maps anything else to 500 INTERNAL_ERROR without leaking the message', async () => {
    const res = await request(appThrowing(new Error('secret db detail'))).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  });
});
