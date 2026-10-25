import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { SHARED_PACKAGE_NAME } from './index';

describe('@kata/shared scaffold', () => {
  it('exposes the package barrel', () => {
    expect(SHARED_PACKAGE_NAME).toBe('@kata/shared');
  });

  it('resolves the pinned zod dependency', () => {
    expect(z.string().safeParse('ok').success).toBe(true);
  });
});
