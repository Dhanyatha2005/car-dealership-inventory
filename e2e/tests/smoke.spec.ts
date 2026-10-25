import { expect, test } from '@playwright/test';

// Scaffold check: proves the Playwright runner and config load. It uses no
// browser fixture, so it runs without installed browsers or running servers.
// Phase 5 replaces it with real flows (auth, shopping, admin).
test('playwright runner is wired', () => {
  expect(test.info().project.name).toBe('chromium');
});
