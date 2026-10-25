/**
 * End-to-end HTTP behaviour of the assembled API against real PostgreSQL:
 * auth, the vehicle permission matrix, search, purchase and restock.
 */
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { createAuthenticate } from '../../src/http/middleware/authenticate';
import { BcryptPasswordHasher } from '../../src/infra/bcrypt-password-hasher';
import { JoseTokenService } from '../../src/infra/jose-token-service';
import { buildModules } from '../../src/modules/index';
import { testPrisma } from '../support/db';

const tokens = new JoseTokenService('x'.repeat(32), '1h');
const app = createApp(
  buildModules({
    prisma: testPrisma,
    tokens,
    hasher: new BcryptPasswordHasher(4),
    authenticate: createAuthenticate(tokens),
  }),
  { corsOrigins: [] },
);

const car = {
  make: 'Toyota',
  model: 'Corolla',
  category: 'SEDAN',
  priceCents: 2_150_000,
  quantity: 1,
  year: 2024,
};

async function tokenFor(role: 'USER' | 'ADMIN'): Promise<string> {
  const email = `${role.toLowerCase()}-${Math.random()}@test.io`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: role, email, password: 'password123' })
    .expect(201);
  if (role === 'ADMIN') await testPrisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
  return role === 'ADMIN' ? tokens.sign({ sub: res.body.user.id, role: 'ADMIN' }) : res.body.token;
}

describe('HTTP API', () => {
  let user: string;
  let admin: string;
  beforeEach(async () => {
    user = await tokenFor('USER');
    admin = await tokenFor('ADMIN');
  });

  it('logs in a registered user and rejects a wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'a@test.io', password: 'password123' });
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'A@test.io', password: 'password123' })
      .expect(200);
    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@test.io', password: 'wrong-pass' })
      .expect(401);
    expect(bad.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('requires a token for vehicles and admin role for writes', async () => {
    await request(app).get('/api/vehicles').expect(401);
    await request(app)
      .post('/api/vehicles')
      .set('authorization', `Bearer ${user}`)
      .send(car)
      .expect(403);
    await request(app)
      .post('/api/vehicles')
      .set('authorization', `Bearer ${admin}`)
      .send(car)
      .expect(201);
  });

  it('creates, searches, updates and soft-deletes a vehicle', async () => {
    const auth = { authorization: `Bearer ${admin}` };
    const { body: v } = await request(app).post('/api/vehicles').set(auth).send(car).expect(201);
    const found = await request(app)
      .get('/api/vehicles/search?q=toyo&category=SEDAN&maxPrice=2150000')
      .set(auth)
      .expect(200);
    expect(found.body.items.map((x: { id: string }) => x.id)).toEqual([v.id]);
    const upd = await request(app)
      .put(`/api/vehicles/${v.id}`)
      .set(auth)
      .send({ priceCents: 2_000_000 })
      .expect(200);
    expect(upd.body.priceCents).toBe(2_000_000);
    await request(app)
      .delete(`/api/vehicles/${v.id}`)
      .set({ authorization: `Bearer ${user}` })
      .expect(403);
    await request(app).delete(`/api/vehicles/${v.id}`).set(auth).expect(204);
    await request(app).get(`/api/vehicles/${v.id}`).set(auth).expect(404);
  });

  it('purchases until out of stock, then restocks as admin', async () => {
    const { body: v } = await request(app)
      .post('/api/vehicles')
      .set({ authorization: `Bearer ${admin}` })
      .send(car);
    const buy = () =>
      request(app)
        .post(`/api/vehicles/${v.id}/purchase`)
        .set({ authorization: `Bearer ${user}` });
    const ok = await buy().expect(201);
    expect(ok.body.vehicle.quantity).toBe(0);
    expect(ok.body.purchase.unitPriceCents).toBe(car.priceCents);
    expect((await buy().expect(409)).body.error.code).toBe('INSUFFICIENT_STOCK');
    await request(app)
      .post(`/api/vehicles/${v.id}/restock`)
      .set({ authorization: `Bearer ${user}` })
      .send({ quantity: 5 })
      .expect(403);
    const restocked = await request(app)
      .post(`/api/vehicles/${v.id}/restock`)
      .set({ authorization: `Bearer ${admin}` })
      .send({ quantity: 5 })
      .expect(200);
    expect(restocked.body.quantity).toBe(5);
    const mine = await request(app)
      .get('/api/purchases/me')
      .set({ authorization: `Bearer ${user}` })
      .expect(200);
    expect(mine.body.total).toBe(1);
  });
});
