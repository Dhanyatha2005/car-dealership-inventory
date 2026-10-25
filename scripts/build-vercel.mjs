// Produces a Vercel Build Output API bundle in .vercel/output:
//   static/            the React SPA (same-origin API, so VITE_API_URL is empty)
//   functions/api.func the Express API bundled into one ESM file
// Deploy with: npx vercel deploy --prebuilt --prod
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';

const out = '.vercel/output';
rmSync(out, { recursive: true, force: true });

execSync('npm run build -w @kata/web', {
  stdio: 'inherit',
  env: { ...process.env, VITE_API_URL: '' },
});
cpSync('apps/web/dist', `${out}/static`, { recursive: true });

const fn = `${out}/functions/api.func`;
mkdirSync(fn, { recursive: true });
await build({
  entryPoints: ['apps/api/src/vercel.ts'],
  outfile: `${fn}/index.mjs`,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  // CommonJS dependencies (express, pg) call require(); give the ESM bundle one.
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
});
writeFileSync(
  `${fn}/.vc-config.json`,
  JSON.stringify({
    runtime: 'nodejs22.x',
    handler: 'index.mjs',
    launcherType: 'Nodejs',
    shouldAddHelpers: false,
  }),
);
writeFileSync(
  `${out}/config.json`,
  JSON.stringify({
    version: 3,
    routes: [
      { src: '^/api(/.*)?$', dest: '/api' },
      { handle: 'filesystem' },
      { src: '/(.*)', dest: '/index.html' },
    ],
  }),
);
console.log('Vercel build output ready in', out);
