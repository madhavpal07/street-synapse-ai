import express from 'express';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createTracker } from './tracker.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const envFile = resolve(root, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);
const dev = process.argv.includes('--dev');
process.env.NODE_ENV = dev ? 'development' : 'production';

if (!process.env.DASHBOARD_KEY || !process.env.DRIVER_KEYS_JSON) {
  console.error('Missing keys. Run npm run setup, then start the project again.');
  process.exit(1);
}
let driverKeys;
try {
  driverKeys = JSON.parse(process.env.DRIVER_KEYS_JSON);
} catch {
  console.error('DRIVER_KEYS_JSON in .env must be valid JSON. See .env.example.');
  process.exit(1);
}

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
const { default: next } = await import('next');
// Webpack supports SWC's WASM fallback when native binaries cannot load.
// Next.js 16 otherwise selects Turbopack, which requires native bindings.
const nextApp = next({ dev, dir: root, hostname: host, port, webpack: true });
const app = express();
app.disable('x-powered-by');
app.use((_req, res, nextMiddleware) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), screen-wake-lock=(self)');
  nextMiddleware();
});
app.get('/health', (_req, res) => res.json({ ok: true, service: 'streetsynapse-bus-tracker' }));
const server = createServer(app);
const tracker = createTracker(server, { dashboardKey: process.env.DASHBOARD_KEY, driverKeys });

await nextApp.prepare();
// A plain HTML + JavaScript emitter, served at /driver/.
app.use('/driver', express.static(resolve(root, 'driver'), { maxAge: 0 }));
// All other pages and assets are rendered/served by Next.js.
app.use((req, res, nextMiddleware) => {
  Promise.resolve(nextApp.getRequestHandler()(req, res)).catch(nextMiddleware);
});
app.use((error, _req, res, _next) => {
  console.error('Request failed:', error.message);
  if (!res.headersSent) res.status(500).send('Server error. Please retry.');
});
server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is busy. Stop the other server or change PORT in .env.` : error.message);
  process.exit(1);
});
server.listen(port, host, () => {
  console.log(`Dashboard: http://localhost:${port}/dashboard`);
  console.log(`Passenger: http://localhost:${port}/`);
  console.log(`Driver:    http://localhost:${port}/driver/`);
  console.log('Phone GPS needs an HTTPS link. See START-HERE.md, step 5.');
});
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => process.exit(1), 5000);
  timeout.unref();
  await tracker.close();
  await nextApp.close();
  clearTimeout(timeout);
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
