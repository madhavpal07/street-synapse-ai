'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { io } from 'socket.io-client';
import { ageLabel, busStatus } from '../lib/status';

const BusMap = dynamic(() => import('./BusMap'), {
  ssr: false,
  loading: () => <div className="map-loading">Loading street map…</div>,
});
const labels = { live: 'Live', stale: 'GPS stale', offline: 'Offline', waiting: 'Waiting for GPS' };

export default function Dashboard() {
  const [keyInput, setKeyInput] = useState('');
  const [credentials, setCredentials] = useState(null);
  const [connection, setConnection] = useState('disconnected');
  const [message, setMessage] = useState('Enter your dashboard key to view bus locations.');
  const [buses, setBuses] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [follow, setFollow] = useState(true);
  const [focusCount, setFocusCount] = useState(0);
  const [clock, setClock] = useState(0);
  const [serverOffset, setServerOffset] = useState(0);

  useEffect(() => {
    setClock(Date.now());
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!credentials) return;
    const socket = io({
      autoConnect: false,
      auth: { role: 'viewer', key: credentials.key },
    });
    const syncClock = (serverTime) => setServerOffset(serverTime - Date.now());
    socket.on('connect', () => {
      setConnection('connected');
      setMessage('Connected. Waiting for a driver to share a location.');
    });
    socket.on('fleet:snapshot', ({ buses: fleet, serverTime }) => {
      setBuses(fleet);
      syncClock(serverTime);
      setSelectedId((current) => fleet.some((bus) => bus.busId === current) ? current : fleet[0]?.busId || '');
    });
    socket.on('bus:update', ({ bus, serverTime }) => {
      syncClock(serverTime);
      setBuses((current) => current.some((item) => item.busId === bus.busId)
        ? current.map((item) => item.busId === bus.busId ? bus : item)
        : [...current, bus]);
    });
    socket.on('disconnect', () => {
      setConnection('disconnected');
      setMessage('Server connection lost. Reconnecting… Last locations may be out of date.');
    });
    socket.on('connect_error', (error) => {
      setConnection('error');
      setMessage(error.message === 'Dashboard key is incorrect.'
        ? error.message : 'Cannot connect. Check that the server is running and this link is correct.');
    });
    setConnection('connecting');
    setMessage('Connecting to the tracking server…');
    socket.connect();
    return () => { socket.removeAllListeners(); socket.disconnect(); };
  }, [credentials]);

  const now = clock + serverOffset;
  const visibleBuses = buses.map((bus) => ({
    ...bus, status: connection === 'connected' ? busStatus(bus, now) : 'offline',
  }));
  const selected = visibleBuses.find((bus) => bus.busId === selectedId);
  const position = selected?.position;
  const liveCount = visibleBuses.filter((bus) => bus.status === 'live').length;
  const latest = Math.max(0, ...visibleBuses.map((bus) => bus.position?.timestamp || 0));
  const located = visibleBuses.filter((bus) => bus.position).length;

  function connect(event) {
    event.preventDefault();
    if (keyInput.trim()) setCredentials({ key: keyInput.trim(), attempt: Date.now() });
  }
  function disconnect() {
    setCredentials(null);
    setKeyInput('');
    setBuses([]);
    setConnection('disconnected');
    setMessage('Disconnected. Enter your dashboard key to reconnect.');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="/" className="brand"><img src="/favicon.svg" width="34" height="34" alt="" /><span>StreetSynapse<small>TRANSIT</small></span></a>
        <nav aria-label="Main navigation"><span className="current-nav">Live map</span><a href="/driver/" target="_blank" rel="noreferrer">Driver emitter <span aria-hidden="true">↗</span></a></nav>
        <span className={`connection-pill ${connection === 'connected' ? 'online' : ''}`}><span />{connection === 'connected' ? 'Server connected' : 'Server disconnected'}</span>
      </header>

      <main className="workspace">
        <aside className="fleet-panel" aria-label="Fleet controls">
          <div className="panel-heading"><p className="eyebrow">COMMAND CENTER</p><h1>Live bus tracker</h1><p>One view of every connected bus.</p></div>

          {connection !== 'connected' ? <form className="connect-form" onSubmit={connect}>
            <label htmlFor="dashboard-key">Dashboard key</label>
            <input id="dashboard-key" type="password" autoComplete="off" placeholder="Enter your access key" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} required />
            <button className="primary-button" type="submit" disabled={connection === 'connecting'}>{connection === 'connecting' ? 'Connecting…' : 'Connect dashboard'}</button>
            <p className="form-note">Use the dashboard key from your project setup.</p>
          </form> : <div className="connected-control"><span>Dashboard connected</span><button className="text-button" onClick={disconnect}>Disconnect</button></div>}

          <div className={`notice ${connection === 'error' ? 'notice-error' : ''}`} role="status">{connection === 'connected' && located > 0 ? 'Receiving bus locations. Select a bus to inspect its last GPS reading.' : message}</div>

          <div className="fleet-heading"><h2>Your buses</h2><span>{buses.length}</span></div>
          {buses.length === 0 ? <div className="empty-fleet"><span className="empty-number">—</span><p>Your configured buses appear after you connect.</p></div> : <ul className="bus-list">
            {visibleBuses.map((bus) => <li key={bus.busId}><button className={`bus-row ${selectedId === bus.busId ? 'selected' : ''}`} onClick={() => { setSelectedId(bus.busId); setFocusCount((n) => n + 1); }} aria-pressed={selectedId === bus.busId}>
              <span className={`bus-number ${bus.status}`}>{bus.busId.replace('BUS-', '')}</span>
              <span className="bus-copy"><strong>{bus.busId}</strong><small>{bus.position ? `GPS ${ageLabel(bus.position.timestamp, now)}` : 'No location shared yet'}</small></span>
              <span className={`status-tag ${bus.status}`}>{labels[bus.status]}</span>
            </button></li>)}
          </ul>}

          <div className="driver-callout"><h2>Connect a driver</h2><p>Open the driver link on a phone, enter its bus ID and key, then tap Start sharing.</p><a href="/driver/" target="_blank" rel="noreferrer" className="secondary-button">Open driver emitter <span aria-hidden="true">↗</span></a></div>
          <p className="panel-footnote">Last known locations only. No journey history is stored.</p>
        </aside>

        <section className="tracking-panel" aria-label="Live tracking map">
          <div className="metrics-strip">
            <div><span>Live buses</span><strong>{liveCount}<small> / {buses.length}</small></strong></div>
            <div><span>Last GPS reading</span><strong className="metric-text">{ageLabel(latest, now)}</strong></div>
            <div><span>Selected bus</span><strong className="metric-text">{selectedId || 'None'}</strong></div>
          </div>
          <div className="map-frame">
            <BusMap buses={visibleBuses} selectedId={selectedId} onSelect={setSelectedId} follow={follow} focusCount={focusCount} now={now} />
            <div className="map-toolbar"><label><input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} /> Follow selected bus</label><button onClick={() => setFocusCount((n) => n + 1)} disabled={!position}>Recenter</button></div>
            {located === 0 && <div className="map-empty"><span className="map-empty-icon">◎</span><h2>Waiting for a bus location</h2><p>{connection === 'connected' ? 'Start sharing from the driver’s phone. Its first GPS reading will appear here.' : 'Connect your dashboard, then start sharing from a driver’s phone.'}</p><small>Default map view: Roorkee</small></div>}
            <div className="map-legend"><span><i className="legend-dot live" />Live</span><span><i className="legend-dot stale" />GPS stale</span><span><i className="legend-dot offline" />Offline</span></div>
          </div>
          <div className="reading-panel">
            <div className="reading-title"><div><p className="eyebrow">LATEST READING</p><h2>{selectedId || 'Select a bus'}</h2></div>{selected && <span className={`status-tag ${selected.status}`}>{labels[selected.status]}</span>}</div>
            {position ? <>
              <dl className="reading-grid">
                <div><dt>Latitude / longitude</dt><dd className="coordinates">{position.latitude.toFixed(6)}<br />{position.longitude.toFixed(6)}</dd></div>
                <div><dt>GPS accuracy</dt><dd>±{Math.round(position.accuracy)} <small>m</small></dd></div>
                <div><dt>Speed</dt><dd>{position.speed === null ? '—' : (position.speed * 3.6).toFixed(1)} <small>km/h</small></dd></div>
                <div><dt>Heading</dt><dd>{position.heading === null ? '—' : Math.round(position.heading)}{position.heading !== null && <small>°</small>}</dd></div>
              </dl>
              <p className="reading-note">GPS: {ageLabel(position.timestamp, now)} · Server received: {ageLabel(selected.lastReceivedAt, now)}{position.accuracy > 100 ? ' · Low accuracy: position is approximate.' : ''}{selected.status !== 'live' ? ' · This is a last known location.' : ''}</p>
            </> : <p className="no-reading">Coordinates, accuracy and speed will appear after this bus sends a GPS reading.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
