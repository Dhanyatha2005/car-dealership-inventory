import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('api scaffold', () => {
  it('builds an Express app that supertest can drive', async () => {
    const response = await request(createApp()).get('/does-not-exist');

    expect(response.status).toBe(404);
  });
});
