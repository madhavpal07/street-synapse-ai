# StreetSynapse / Sawaari — integrated live bus tracker

Start with **START-HERE.md** for Windows, phone GPS and Cloudflared instructions.

## Pages
- `/`: Sawaari public passenger interface, no key. Original passenger visual language (mobile layout, stop planner, map, cards and bottom navigation) adapted to real data.
- `/dashboard`: private fleet dashboard, requires dashboard key to receive data.
- `/driver/`: plain HTML driver emitter, requires the matching bus key and user-approved location sharing.

## Architecture
Node 24+, Express and Socket.IO serve Next.js 16 / React 19 and the driver page on one port. Passenger components use TypeScript, Tailwind 4 and Leaflet. The original Next 15 standalone setup was merged into the existing custom server and Webpack build. No native app, NavIC hardware or third-party API key is needed.

`backend/tracker.mjs` validates packets, tracks one current position per bus, and broadcasts snapshots and updates. `driver/driver.js` collects browser geolocation. `app/page.tsx` subscribes as a public passenger. `components/Dashboard.js` subscribes as an authenticated viewer. `lib/routes.js` defines demo routes and bus assignments. Passenger data contains only busId, connected, position, lastReceivedAt and status; no credentials or driver session IDs.

## Commands
```
npm ci
npm run setup
npm run build
npm start
```
Development: `npm run dev`. Checks: `npm test`, `npm run test:app` (build first). `npm run test:app -- --dev` checks development startup.

## Data contract
Driver auth: `{role:'driver',busId,key,sessionId}`. Dashboard auth: `{role:'viewer',key}`. Public auth: `{role:'passenger'}`.
Driver emits `location:update` with latitude, longitude, accuracy (metres), speed (metres/sec or null), heading (degrees or null), timestamp (epoch ms). Only a driver may publish. Both readers receive `fleet:snapshot` and `bus:update`; `fleet:request` requests a fresh snapshot.

The UI converts speed to km/h. Connected-but-no-GPS is waiting; fixes older than 15 seconds are stale; stopped/disconnected buses are offline. Repeated transmission never resets the GPS fix timestamp. A disconnected passenger retains last positions clearly labelled offline. Server restart clears memory.

## Route and information limitations
BUS-001/BUS-002 are assigned to sample route 104. Stop filtering checks sequence/direction. Unknown, reversed and identical stops produce no match. Coordinates and dotted stop-to-stop lines are illustrative, not authoritative road geometry. Real phone fixes are never snapped to the fake route. Distances are explicitly straight-line. ETA, fares, timetables, amenities and road-quality scores are not fabricated. Operator-verified data and arrival logic remain future work.

## Deployment
Run on a persistent Node server with HTTPS, or keep this laptop and its Cloudflared tunnel running for the demo. The public feed intentionally makes bus positions viewable without a key. Do not embed driver/dashboard keys in frontend code or URLs. Keep `.env` private. This is a prototype, with no DB/history, production account management or large-fleet load testing.
