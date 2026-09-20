// Smoke-check the real server. Uses synthetic coordinates and test-only keys.
// Run npm run build first, or pass --dev to test development mode.
// No phone, browser, public tunnel or saved .env is needed.
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { io } from 'socket.io-client';

const root = fileURLToPath(new URL('../', import.meta.url));
const dev = process.argv.includes('--dev');
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const base = `http://127.0.0.1:${port}`;
const dashboardKey = 'app-test-dashboard-key-123456';
const driverKey = 'app-test-driver-key-123456';
const child = spawn(process.execPath, ['backend/server.mjs', ...(dev ? ['--dev'] : [])], {
  cwd: root,
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), DASHBOARD_KEY: dashboardKey, DRIVER_KEYS_JSON: JSON.stringify({ 'BUS-001': driverKey }) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
const clients = [];
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`App startup timed out. ${logs}`)), dev ? 60_000 : 30_000);
    child.stdout.on('data', (chunk) => { logs += chunk; if (logs.includes('Dashboard:')) { clearTimeout(timer); resolve(); } });
    child.stderr.on('data', (chunk) => { logs += chunk; });
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`App exited with ${code}. ${logs}`)); });
  });
  for (const [path, contentType, text] of [
    ['/health', 'application/json', 'streetsynapse-bus-tracker'],
    ['/', 'text/html', 'Sawaari'],
    ['/dashboard', 'text/html', 'Live bus tracker'],
    ['/driver/', 'text/html', 'Start sharing'],
    ['/driver/driver.js', 'javascript', 'watchPosition'],
    ['/driver/driver.css', 'text/css', '.card'],
    ['/socket.io/socket.io.js', 'javascript', 'Socket.IO'],
    ['/favicon.svg', 'image/svg+xml', '<svg'],
  ]) {
    const response = await fetch(base + path, { signal: AbortSignal.timeout(dev ? 60_000 : 5000) });
    assert.equal(response.status, 200, path);
    assert.ok(response.headers.get('content-type')?.includes(contentType), path);
    assert.ok((await response.text()).includes(text), path);
  }
  console.log('PASS: Next.js dashboard, driver page, assets, Socket.IO client and health route.');
  if (dev) console.log('PASS: Development server startup and route compilation using Webpack.');

  async function connect(auth) {
    const socket = io(base, { auth, autoConnect: false, forceNew: true, reconnection: false, transports: ['websocket'] });
    clients.push(socket);
    const result = new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
    socket.connect();
    await result;
    return socket;
  }
  const passenger = await connect({ role: 'passenger' });
  const viewer = await connect({ role: 'viewer', key: dashboardKey });
  const driver = await connect({ role: 'driver', busId: 'BUS-001', key: driverKey, sessionId: 'production-smoke-session-1' });
  const publicReceived = new Promise(resolve => passenger.on('bus:update', msg => { if(msg.bus.position) resolve(msg); }));
  const received = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Dashboard did not receive the location.')), 3000);
    viewer.on('bus:update', (message) => { if (message.bus.position) { clearTimeout(timer); resolve(message); } });
  });
  const packet = { latitude: 29.8543, longitude: 77.888, accuracy: 7, speed: 0, heading: null, timestamp: Date.now() };
  const ack = await new Promise((resolve, reject) => driver.timeout(3000).emit('location:update', packet, (error, reply) => error ? reject(error) : resolve(reply)));
  assert.equal(ack.ok, true);
  assert.deepEqual((await received).bus.position, packet);
  assert.deepEqual((await publicReceived).bus.position, packet);
  console.log('PASS: Synthetic GPS travels over WebSocket through the real Express + Next.js server.');
} finally {
  clients.forEach((socket) => socket.disconnect());
  if (child.exitCode === null) {
    const exited = once(child, 'exit');
    child.kill('SIGTERM');
    const timer = setTimeout(() => child.kill('SIGKILL'), 6000);
    await exited;
    clearTimeout(timer);
  }
}
