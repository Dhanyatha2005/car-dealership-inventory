import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { Role } from '../../core/auth';
import { errorHandler } from '../error-handler';
import { requireRole } from './require-role';

function app(role?: Role) {
  const a = express();
  a.use((req, _res, next) => {
    if (role) req.auth = { userId: 'u1', role };
    next();
  });
  a.get('/admin', requireRole('ADMIN'), (_req, res) => {
    res.json({ ok: true });
  });
  a.use(errorHandler);
  return a;
}

describe('requireRole', () => {
  it('allows a permitted role', async () => {
    expect((await request(app('ADMIN')).get('/admin')).status).toBe(200);
  });

  it('returns 403 FORBIDDEN for another role', async () => {
    const res = await request(app('USER')).get('/admin');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 UNAUTHENTICATED without req.auth', async () => {
    const res = await request(app()).get('/admin');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});
