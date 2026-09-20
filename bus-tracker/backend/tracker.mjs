import { timingSafeEqual } from 'node:crypto';
import { Server } from 'socket.io';
import { busStatus, FRESH_FIX_MS } from '../lib/status.js';

const VIEWERS = 'dashboard-viewers';
const PASSENGERS = 'public-passengers';
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const inRange = (value, low, high) => finite(value) && value >= low && value <= high;

function sameKey(received, expected) {
  if (typeof received !== 'string' || typeof expected !== 'string' || received.length > 256) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function validatePosition(input, now = Date.now()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'Invalid location packet.';
  if (!inRange(input.latitude, -90, 90) || !inRange(input.longitude, -180, 180)) return 'Invalid coordinates.';
  if (!inRange(input.accuracy, 0, 100_000)) return 'Invalid GPS accuracy.';
  if (input.speed != null && !inRange(input.speed, 0, 150)) return 'Invalid speed.';
  if (input.heading != null && !(inRange(input.heading, 0, 360) && input.heading < 360)) return 'Invalid heading.';
  if (!finite(input.timestamp) || input.timestamp <= 0) return 'Invalid GPS timestamp.';
  if (input.timestamp > now + 10_000) return 'Phone clock is ahead. Enable automatic date and time.';
  if (now - input.timestamp > FRESH_FIX_MS) return 'GPS reading is too old. Waiting for a fresh reading.';
  return null;
}

export function createTracker(httpServer, {
  dashboardKey,
  driverKeys,
  now = Date.now,
  sweepMs = 1000,
  minUpdateGapMs = 250,
} = {}) {
  const keys = new Map(Object.entries(driverKeys || {}));
  if (typeof dashboardKey !== 'string' || dashboardKey.length < 16) throw new Error('Set a dashboard key of at least 16 characters.');
  if (keys.size < 1 || keys.size > 1000 || [...keys].some(([id, key]) =>
    !/^[A-Z0-9-]{1,24}$/.test(id) || typeof key !== 'string' || key.length < 16)) {
    throw new Error('DRIVER_KEYS_JSON needs bus IDs such as BUS-001 and keys of at least 16 characters.');
  }

  // Only one last location per configured bus is kept, in this process's RAM.
  const fleet = new Map([...keys.keys()].map((busId) => [busId, {
    busId, connected: false, position: null, lastReceivedAt: null,
    socketId: null, sessionId: null, lastAttemptAt: null,
  }]));
  const io = new Server(httpServer, {
    serveClient: true,
    maxHttpBufferSize: 8192,
    pingInterval: 10_000,
    pingTimeout: 10_000,
    // Single origin: no wildcard CORS is needed. Both roles must authenticate.
  });

  function publicBus(record) {
    return {
      busId: record.busId,
      connected: record.connected,
      position: record.position,
      lastReceivedAt: record.lastReceivedAt,
      status: busStatus(record, now()),
    };
  }
  const snapshot = () => ({ buses: [...fleet.values()].map(publicBus), serverTime: now() });
  const statuses = new Map();
  function publish(record) {
    const bus = publicBus(record);
    statuses.set(bus.busId, bus.status);
    io.to(VIEWERS).to(PASSENGERS).emit('bus:update', { bus, serverTime: now() });
  }

  io.use((socket, next) => {
    const { role, busId, key, sessionId } = socket.handshake.auth || {};
    const fail = (message) => next(new Error(message));
    if (role === 'passenger') {
      // Public read-only role; never send privileged credentials.
    } else if (role === 'viewer') {
      if (!sameKey(key, dashboardKey)) return fail('Dashboard key is incorrect.');
    } else if (role === 'driver') {
      if (!keys.has(busId) || !sameKey(key, keys.get(busId))) return fail('Bus ID or driver key is incorrect.');
      if (typeof sessionId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(sessionId)) return fail('Invalid driver session. Reload the driver page.');
      const active = fleet.get(busId);
      if (active.connected && active.sessionId !== sessionId) return fail('This bus is already sharing from another phone or tab. Stop it first.');
    } else {
      return fail('Choose a driver or dashboard connection.');
    }
    socket.data = { role, busId, sessionId };
    next();
  });

  io.on('connection', (socket) => {
    if (socket.data.role === 'viewer' || socket.data.role === 'passenger') {
      socket.join(socket.data.role === 'viewer' ? VIEWERS : PASSENGERS);
      socket.emit('fleet:snapshot', snapshot());
      // A late dashboard gets current locations immediately, even before a new ping.
      socket.on('fleet:request', (ack) => {
        if (typeof ack === 'function') ack(snapshot());
      });
      socket.on('location:update', (_packet, ack) => {
        if (typeof ack === 'function') ack({ ok: false, error: 'Drivers only.' });
      });
      return;
    }

    const record = fleet.get(socket.data.busId);
    // Recheck ownership here in case two handshakes overlapped.
    if (record.connected && record.sessionId !== socket.data.sessionId) {
      socket.emit('driver:error', 'This bus is already sharing from another phone or tab.');
      socket.disconnect(true);
      return;
    }
    const previousSocket = io.sockets.sockets.get(record.socketId);
    record.socketId = socket.id;
    record.sessionId = socket.data.sessionId;
    record.connected = true;
    record.lastAttemptAt = null;
    if (previousSocket && previousSocket.id !== socket.id) previousSocket.disconnect(true);
    publish(record);

    socket.on('location:update', (packet, ack) => {
      const reply = (message) => { if (typeof ack === 'function') ack(message); };
      if (record.socketId !== socket.id) return reply({ ok: false, error: 'Driver session ended.' });
      const time = now();
      if (record.lastAttemptAt !== null && time - record.lastAttemptAt < minUpdateGapMs) {
        return reply({ ok: false, error: 'Sending too fast. Send at most once per second.' });
      }
      record.lastAttemptAt = time;
      const error = validatePosition(packet, time);
      if (error) return reply({ ok: false, error });
      if (record.position && packet.timestamp < record.position.timestamp) {
        return reply({ ok: false, error: 'Out-of-order GPS reading ignored.' });
      }
      record.position = {
        latitude: packet.latitude, longitude: packet.longitude,
        accuracy: packet.accuracy, speed: packet.speed ?? null,
        heading: packet.heading ?? null, timestamp: packet.timestamp,
      };
      record.lastReceivedAt = time;
      publish(record);
      reply({ ok: true, serverTime: time });
    });

    socket.on('driver:stop', (ack) => {
      if (record.socketId === socket.id) {
        record.connected = false;
        record.socketId = null;
        record.sessionId = null;
        publish(record);
      }
      if (typeof ack === 'function') ack({ ok: true });
      socket.disconnect(true);
    });

    socket.on('disconnect', () => {
      if (record.socketId !== socket.id) return;
      record.connected = false;
      record.socketId = null;
      record.sessionId = null;
      publish(record);
    });
  });

  // Silence must change a marker's status even when no new packets arrive.
  const sweep = () => {
    for (const record of fleet.values()) {
      if (statuses.get(record.busId) !== busStatus(record, now())) publish(record);
    }
  };
  const timer = setInterval(sweep, sweepMs);
  timer.unref();
  return {
    io, snapshot, sweep,
    close: () => new Promise((resolve) => { clearInterval(timer); io.close(resolve); }),
  };
}
