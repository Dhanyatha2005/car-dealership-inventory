import { afterEach, describe, expect, it, vi } from 'vitest';
import { tokenStorage } from '@/lib/auth/token-storage';
import { ApiError } from './api-error';
import { http } from './http-client';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('http client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  it('sends the stored token as a Bearer header', async () => {
    tokenStorage.save('abc123', { id: '1', email: 'a@b.c', name: 'A', role: 'USER' });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, { ok: 1 }));

    await http.get('/api/vehicles/search', { q: 'civic', page: 2, category: '' });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/vehicles/search?q=civic&page=2');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer abc123');
  });

  it('parses {error:{code,message}} into an ApiError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(409, { error: { code: 'OUT_OF_STOCK', message: 'No stock left' } }),
    );

    const error = await http.post('/api/vehicles/x/purchase').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: 'OUT_OF_STOCK', message: 'No stock left' });
  });
});
