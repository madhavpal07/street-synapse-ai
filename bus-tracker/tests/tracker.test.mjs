import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { io as client } from 'socket.io-client';
import { createTracker, validatePosition } from '../backend/tracker.mjs';

const dashboardKey = 'test-dashboard-key-123456';
const driverKeys = { 'BUS-001': 'test-bus-one-key-123456', 'BUS-002': 'test-bus-two-key-123456' };
const driverAuth = (busId = 'BUS-001', sessionId = 'test-driver-session-0001') => ({ role: 'driver', busId, key: driverKeys[busId], sessionId });
const viewerAuth = { role: 'viewer', key: dashboardKey };
const position = (timestamp, extra = {}) => ({ latitude: 29.8543, longitude: 77.888, accuracy: 8, speed: null, heading: null, timestamp, ...extra });

function eventFrom(socket, event, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const handler = (data) => {
      if (!predicate(data)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(data);
    };
    const timer = setTimeout(() => { socket.off(event, handler); reject(new Error(`Timed out waiting for ${event}`)); }, 2500);
    socket.on(event, handler);
  });
}
const emitAck = (socket, event, packet) => new Promise((resolve, reject) => {
  socket.timeout(2500).emit(event, packet, (error, response) => error ? reject(error) : resolve(response));
});

async function harness(t) {
  let clock = Date.now();
  const server = createServer((_req, res) => res.end('Test server'));
  const tracker = createTracker(server, { dashboardKey, driverKeys, now: () => clock, sweepMs: 60_000 });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const clients = [];
  t.after(async () => { clients.forEach((socket) => socket.disconnect()); await tracker.close(); });
  function make(auth) {
    const socket = client(url, { auth, forceNew: true, autoConnect: false, reconnection: false });
    clients.push(socket);
    return socket;
  }
  async function connect(auth) {
    const socket = make(auth);
    const connected = new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
    socket.connect();
    await connected;
    return socket;
  }
  return { tracker, make, connect, now: () => clock, advance: (ms) => { clock += ms; }, bus: (id = 'BUS-001') => tracker.snapshot().buses.find((bus) => bus.busId === id) };
}

test('GPS validation accepts zero values and rejects malformed, stale and future readings', () => {
  const time = Date.now();
  assert.equal(validatePosition(position(time, { latitude: 0, longitude: 0, speed: 0, heading: 0 }), time), null);
  for (const update of [{ latitude: 91 }, { longitude: -181 }, { latitude: '29' }, { accuracy: -1 }, { speed: Infinity }, { heading: 360 }, { timestamp: time - 15_001 }, { timestamp: time + 10_001 }]) {
    assert.ok(validatePosition(position(time, update), time));
  }
  assert.ok(validatePosition(null, time));
});

test('both roles need a valid key, and a dashboard cannot publish coordinates', async (t) => {
  const h = await harness(t);
  for (const auth of [{ role: 'viewer', key: 'wrong' }, { ...driverAuth(), key: 'wrong' }, { ...driverAuth(), busId: 'BUS-999' }]) {
    await assert.rejects(h.connect(auth), /key is incorrect/);
  }
  const viewer = await h.connect(viewerAuth);
  const reply = await emitAck(viewer, 'location:update', position(h.now()));
  assert.equal(reply.ok, false);
  assert.equal(h.bus().position, null);
});

test('a real Socket.IO update reaches the dashboard; a late dashboard receives the latest snapshot', async (t) => {
  const h = await harness(t);
  const viewer = await h.connect(viewerAuth);
  const driver = await h.connect(driverAuth());
  const update = eventFrom(viewer, 'bus:update', ({ bus }) => Boolean(bus.position));
  const sent = position(h.now());
  assert.equal((await emitAck(driver, 'location:update', sent)).ok, true);
  const received = await update;
  assert.deepEqual(received.bus.position, sent);
  assert.equal(received.bus.status, 'live');
  assert.equal('key' in received.bus, false);
  assert.equal('sessionId' in received.bus, false);
  assert.equal('socketId' in received.bus, false);
  const lateViewer = h.make(viewerAuth);
  const snapshot = eventFrom(lateViewer, 'fleet:snapshot');
  lateViewer.connect();
  assert.deepEqual((await snapshot).buses[0].position, sent);
});

test('invalid coordinates and out-of-order samples cannot overwrite the last valid position', async (t) => {
  const h = await harness(t);
  const driver = await h.connect(driverAuth());
  const valid = position(h.now());
  assert.equal((await emitAck(driver, 'location:update', valid)).ok, true);
  h.advance(1000);
  assert.equal((await emitAck(driver, 'location:update', position(h.now(), { longitude: 999 }))).ok, false);
  h.advance(1000);
  const older = await emitAck(driver, 'location:update', position(valid.timestamp - 1));
  assert.match(older.error, /Out-of-order/);
  assert.deepEqual(h.bus().position, valid);
});

test('a repeated ping retains the actual GPS timestamp and becomes stale without a new fix', async (t) => {
  const h = await harness(t);
  const viewer = await h.connect(viewerAuth);
  const driver = await h.connect(driverAuth());
  const fix = position(h.now());
  await emitAck(driver, 'location:update', fix);
  h.advance(10_000);
  assert.equal((await emitAck(driver, 'location:update', fix)).ok, true);
  assert.equal(h.bus().position.timestamp, fix.timestamp);
  assert.equal(h.bus().lastReceivedAt, h.now());
  h.advance(5001);
  const staleEvent = eventFrom(viewer, 'bus:update', ({ bus }) => bus.status === 'stale');
  h.tracker.sweep();
  assert.equal((await staleEvent).bus.status, 'stale');
  assert.equal((await emitAck(driver, 'location:update', fix)).ok, false);
  h.advance(40_000);
  h.tracker.sweep();
  assert.equal(h.bus().status, 'offline');
});

test('different buses stay independent and a duplicate driver cannot take over an active bus', async (t) => {
  const h = await harness(t);
  const first = await h.connect(driverAuth());
  await assert.rejects(h.connect(driverAuth('BUS-001', 'second-phone-session-0002')), /already sharing/);
  const second = await h.connect(driverAuth('BUS-002', 'second-bus-session-0002'));
  await emitAck(first, 'location:update', position(h.now()));
  await emitAck(second, 'location:update', position(h.now(), { latitude: 0, longitude: 0 }));
  assert.equal(h.bus().position.latitude, 29.8543);
  assert.equal(h.bus('BUS-002').position.latitude, 0);
});

test('the same browser session can reconnect without an old socket marking the new one offline', async (t) => {
  const h = await harness(t);
  const oldDriver = await h.connect(driverAuth());
  await emitAck(oldDriver, 'location:update', position(h.now()));
  const oldDisconnected = eventFrom(oldDriver, 'disconnect');
  const newDriver = await h.connect(driverAuth());
  await oldDisconnected;
  h.advance(1000);
  const reply = await emitAck(newDriver, 'location:update', position(h.now(), { latitude: 29.855 }));
  assert.equal(reply.ok, true);
  assert.equal(h.bus().connected, true);
  assert.equal(h.bus().status, 'live');
});

test('stopping or disconnecting marks a last location offline and allows a new driver', async (t) => {
  const h = await harness(t);
  const viewer = await h.connect(viewerAuth);
  const driver = await h.connect(driverAuth());
  await emitAck(driver, 'location:update', position(h.now()));
  const stopped = eventFrom(viewer, 'bus:update', ({ bus }) => !bus.connected);
  driver.emit('driver:stop');
  assert.equal((await stopped).bus.status, 'offline');
  assert.ok(h.bus().position);
  const next = await h.connect(driverAuth('BUS-001', 'replacement-session-0002'));
  const disconnected = eventFrom(viewer, 'bus:update', ({ bus }) => !bus.connected);
  next.disconnect();
  await disconnected;
  assert.equal(h.bus().status, 'offline');
});

test('server throttles bursts while permitting normal one-second updates', async (t) => {
  const h = await harness(t);
  const driver = await h.connect(driverAuth());
  assert.equal((await emitAck(driver, 'location:update', position(h.now()))).ok, true);
  assert.match((await emitAck(driver, 'location:update', position(h.now()))).error, /too fast/);
  h.advance(1000);
  assert.equal((await emitAck(driver, 'location:update', position(h.now()))).ok, true);
});

test('public passenger receives live fixes and status changes but cannot publish; snapshot contains no secrets', async(t)=>{
 const h=await harness(t), passenger=await h.connect({role:'passenger'}), driver=await h.connect(driverAuth());
 assert.equal((await emitAck(passenger,'location:update',position(h.now()))).ok,false);
 assert.equal(h.bus().position,null);
 const received=eventFrom(passenger,'bus:update',x=>x.bus.status==='live');
 await emitAck(driver,'location:update',position(h.now()));
 assert.equal((await received).bus.busId,'BUS-001');
 const snap=await new Promise(resolve=>passenger.emit('fleet:request',resolve));
 assert.deepEqual(Object.keys(snap.buses[0]).sort(),['busId','connected','lastReceivedAt','position','status']);
 assert.ok(!JSON.stringify(snap).includes(driverKeys['BUS-001']));
 const stale=eventFrom(passenger,'bus:update',x=>x.bus.status==='stale');h.advance(16000);h.tracker.sweep();await stale;
 const offline=eventFrom(passenger,'bus:update',x=>x.bus.busId==='BUS-001'&&x.bus.status==='offline');driver.disconnect();await offline;
 const late=h.make({role:'passenger'}), initial=eventFrom(late,'fleet:snapshot');late.connect();assert.equal((await initial).buses[0].status,'offline');
});
