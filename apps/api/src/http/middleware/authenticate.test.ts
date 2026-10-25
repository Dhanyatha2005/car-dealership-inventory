import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { UnauthorizedError } from '../../core/errors';
import type { TokenClaims, TokenService } from '../../modules/auth/auth.ports';
import { errorHandler } from '../error-handler';
import { createAuthenticate } from './authenticate';

const tokens: TokenService = {
  sign: () => Promise.resolve('unused'),
  verify: (token) =>
    token === 'good'
      ? Promise.resolve<TokenClaims>({ sub: 'u1', role: 'ADMIN' })
      : Promise.reject(new UnauthorizedError('UNAUTHENTICATED', 'Invalid token')),
};

function app() {
  const a = express();
  a.get('/me', createAuthenticate(tokens), (req, res) => {
    res.json(req.auth);
  });
  a.use(errorHandler);
  return a;
}

describe('createAuthenticate', () => {
  it('sets req.auth from a valid bearer token', async () => {
    const res = await request(app()).get('/me').set('Authorization', 'Bearer good');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: 'u1', role: 'ADMIN' });
  });

  it.each([undefined, 'Basic abc', 'Bearer ', 'Bearer bad'])(
    'rejects header %s with 401 UNAUTHENTICATED',
    async (header) => {
      const req = request(app()).get('/me');
      const res = await (header === undefined ? req : req.set('Authorization', header));
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    },
  );
});
