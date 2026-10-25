/**
 * Vitest setup for the web app (jsdom).
 * Phase 1D adds the MSW server lifecycle here (onUnhandledRequest: 'error').
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
