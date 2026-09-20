/* Plain browser JavaScript. No app installation and no automatic location sharing. */
(() => {
  'use strict';
  const el = (id) => document.getElementById(id);
  const FRESH_FIX_MS = 15_000;
  let running = false;
  let socket = null;
  let watchId = null;
  let timer = null;
  let latestFix = null;
  let gpsError = '';
  let lastAckAt = null;
  let confirmed = 0;
  let pending = false;
  let wakeLock = null;
  let generation = 0;

  function status(text, error = false) {
    el('status').textContent = text;
    el('status').className = error ? 'status error' : 'status';
  }
  function connection(text, active = false) {
    el('connection').textContent = text;
    el('connection').className = active ? 'badge active' : 'badge';
  }
  function setControls() {
    el('start').disabled = running;
    el('stop').disabled = !running;
    el('bus-id').disabled = running;
    el('driver-key').disabled = running;
  }
  const numericOrNull = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
  const age = (time) => time ? `${Math.max(0, Math.floor((Date.now() - time) / 1000))}s ago` : 'None';

  function renderReading() {
    const fresh = running && latestFix && Date.now() - latestFix.timestamp <= FRESH_FIX_MS && !gpsError;
    el('gps-state').textContent = !running ? 'Stopped' : gpsError ? 'GPS issue' : latestFix ? (fresh ? 'GPS available' : 'GPS stale') : 'Waiting';
    el('gps-state').className = fresh ? 'badge active' : 'badge';
    el('coordinates').textContent = latestFix ? `${latestFix.latitude.toFixed(6)}, ${latestFix.longitude.toFixed(6)}` : '—';
    el('accuracy').textContent = latestFix ? `±${Math.round(latestFix.accuracy)} m` : '—';
    el('speed').textContent = latestFix?.speed != null ? `${(latestFix.speed * 3.6).toFixed(1)} km/h` : '—';
    el('gps-age').textContent = latestFix ? age(latestFix.timestamp) : '—';
    el('sent-count').textContent = String(confirmed);
    el('last-confirmed').textContent = age(lastAckAt);
  }

  async function requestWakeLock() {
    if (!running || document.hidden || wakeLock) return;
    if (!('wakeLock' in navigator)) {
      el('wake-status').textContent = 'Wake lock is unavailable. Keep the phone screen on manually.';
      return;
    }
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (!running) { await lock.release(); return; }
      wakeLock = lock;
      el('wake-status').textContent = 'Screen wake lock is active. Keep this page visible.';
      lock.addEventListener('release', () => {
        if (wakeLock === lock) wakeLock = null;
        el('wake-status').textContent = 'Screen wake lock released. Keep the phone screen on.';
      });
    } catch {
      el('wake-status').textContent = 'Wake lock could not be enabled. Keep the screen on manually.';
    }
  }

  function stopSharing(message = 'Sharing stopped. The dashboard will show the last known location as offline.', error = false) {
    running = false;
    generation += 1;
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    clearInterval(timer);
    timer = null;
    if (socket) {
      // The server also marks a bus offline on disconnect if this stop event is lost.
      if (socket.connected) socket.emit('driver:stop');
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    if (wakeLock) { void wakeLock.release().catch(() => {}); wakeLock = null; }
    pending = false;
    setControls();
    connection('Not connected');
    status(message, error);
    renderReading();
  }

  function watchGPS(thisGeneration) {
    if (watchId !== null) return;
    watchId = navigator.geolocation.watchPosition((position) => {
      if (!running || generation !== thisGeneration) return;
      const c = position.coords;
      latestFix = {
        latitude: c.latitude, longitude: c.longitude, accuracy: c.accuracy,
        speed: numericOrNull(c.speed),
        heading: numericOrNull(c.heading) !== null && c.heading < 360 ? c.heading : null,
        // Keep the actual GPS sample time, even when resending this fix.
        timestamp: position.timestamp,
      };
      gpsError = '';
      renderReading();
    }, (error) => {
      if (!running || generation !== thisGeneration) return;
      if (error.code === 1) {
        stopSharing('Location permission denied. Allow precise location for this site in browser settings, then tap Start sharing.', true);
      } else {
        gpsError = error.code === 2 ? 'Location is unavailable. Turn on phone location and move near an open area.' : 'GPS timed out. Keep this page open while we wait for another reading.';
        status(gpsError, true);
        renderReading();
      }
    }, { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 });
  }

  function sendLatest() {
    renderReading();
    if (!running || !socket?.connected || pending) return;
    if (gpsError) { status(gpsError, true); return; }
    if (!latestFix) { status('Connected. Waiting for your phone to provide a GPS reading…'); return; }
    if (Date.now() - latestFix.timestamp > FRESH_FIX_MS) {
      status('GPS reading is old. Waiting for a fresh reading; old coordinates are not being sent.', true);
      return;
    }
    const currentGeneration = generation;
    pending = true;
    // Volatile + connected check prevents an old location queue after reconnect.
    socket.volatile.timeout(4000).emit('location:update', latestFix, (error, reply) => {
      if (!running || generation !== currentGeneration) return;
      pending = false;
      if (error) {
        status('Server has not confirmed this update. Retrying with the latest available reading.', true);
      } else if (!reply?.ok) {
        status(reply?.error || 'Location update was rejected.', true);
      } else {
        confirmed += 1;
        lastAckAt = Date.now();
        status(latestFix.accuracy > 100 ? 'Sharing with low GPS accuracy. Move to an open area for a better fix.' : 'Sharing location. Your dashboard is receiving updates.');
        renderReading();
      }
    });
  }

  el('driver-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (running) return;
    if (!window.isSecureContext) {
      status('Phone GPS needs HTTPS. Open the HTTPS driver link from your team. An HTTP laptop IP address will not work.', true);
      return;
    }
    if (!navigator.geolocation) { status('This browser does not provide geolocation. Try an up-to-date mobile browser.', true); return; }
    if (typeof window.io !== 'function') { status('Tracking script did not load. Check your connection and reload this page.', true); return; }
    const busId = el('bus-id').value.trim().toUpperCase();
    const key = el('driver-key').value.trim();
    if (!/^[A-Z0-9-]{1,24}$/.test(busId) || !key) { status('Enter a valid bus ID and its driver key.', true); return; }
    el('bus-id').value = busId;
    running = true;
    generation += 1;
    const currentGeneration = generation;
    latestFix = null;
    gpsError = '';
    lastAckAt = null;
    confirmed = 0;
    pending = false;
    setControls();
    renderReading();
    connection('Connecting…');
    status('Connecting to your tracking server…');
    const thisSocket = window.io({
      autoConnect: false,
      auth: { role: 'driver', busId, key, sessionId: crypto.randomUUID() },
    });
    socket = thisSocket;
    thisSocket.on('connect', () => {
      if (!running || generation !== currentGeneration) return;
      connection('Connected', true);
      pending = false;
      status('Connected. Allow location access when your phone asks.');
      watchGPS(currentGeneration);
    });
    thisSocket.on('connect_error', (error) => {
      if (!running || generation !== currentGeneration) return;
      if (!thisSocket.active) stopSharing(error.message, true);
      else { connection('Reconnecting…'); status('Cannot reach the server. Check internet access; reconnecting automatically…', true); }
    });
    thisSocket.on('disconnect', (reason) => {
      if (!running || generation !== currentGeneration) return;
      pending = false;
      if (reason === 'io server disconnect') stopSharing('The server ended this driver session. Check that this bus is not already sharing elsewhere.', true);
      else { connection('Reconnecting…'); status('Connection lost. Reconnecting; old location packets will not be queued.', true); }
    });
    thisSocket.on('driver:error', (message) => stopSharing(message, true));
    timer = setInterval(sendLatest, 1000);
    thisSocket.connect();
    void requestWakeLock();
  });
  el('stop').addEventListener('click', () => stopSharing());
  window.addEventListener('pagehide', () => { if (running) stopSharing(); });
  document.addEventListener('visibilitychange', () => {
    el('visibility-warning').hidden = !document.hidden;
    if (!document.hidden && running) { void requestWakeLock(); renderReading(); }
  });
})();
