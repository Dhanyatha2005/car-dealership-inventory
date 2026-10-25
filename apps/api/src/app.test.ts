import { Router } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import type { ApiModule } from './http/api-module';

function pingModule(): ApiModule {
  const router = Router();
  router.get('/ping', (_req, res) => {
    res.json({ pong: true });
  });
  router.post('/echo', (req, res) => {
    res.json(req.body);
  });
  return { name: 'ping', router, registerOpenApi: () => undefined };
}

const app = () => createApp([pingModule()], { corsOrigins: ['http://localhost:5173'] });

describe('createApp', () => {
  it('serves GET /api/health', async () => {
    const res = await request(app()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('mounts module routers under /api and parses JSON', async () => {
    expect((await request(app()).get('/api/ping')).body).toEqual({ pong: true });
    expect((await request(app()).post('/api/echo').send({ a: 1 })).body).toEqual({ a: 1 });
  });

  it('returns 404 ROUTE_NOT_FOUND for unknown routes', async () => {
    const res = await request(app()).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('returns 400 INVALID_JSON for malformed bodies', async () => {
    const res = await request(app())
      .post('/api/echo')
      .set('Content-Type', 'application/json')
      .send('{oops');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('rejects bodies over 100kb with 413', async () => {
    const res = await request(app())
      .post('/api/echo')
      .send({ big: 'x'.repeat(101 * 1024) });
    expect(res.status).toBe(413);
  });

  it('sets security headers and allows configured CORS origins only', async () => {
    const ok = await request(app()).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['x-content-type-options']).toBe('nosniff');
    expect(ok.headers['x-powered-by']).toBeUndefined();
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const other = await request(app()).get('/api/health').set('Origin', 'http://evil.test');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });
});
