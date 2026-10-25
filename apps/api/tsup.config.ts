import { defineConfig } from 'tsup';

/**
 * Production bundle: src/server.ts → dist/server.js.
 * @kata/shared ships TypeScript source, so it is bundled in (noExternal);
 * npm dependencies stay external and are installed on the host.
 */
export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: [/^@kata\//],
});
