# Integration verification — 14 September 2026

## Passed in the development workspace
- Production `npm run build`: Next.js 16 / Webpack, TypeScript, prerendered passenger and dashboard pages.
- `npm test`: 12 tests passed. Validation, invalid credentials, unauthorized publishing, real Socket.IO delivery, late snapshots, stale readings, duplicate driver ownership, reconnect ownership, stop/disconnect, throttling, public feed confidentiality, direction filtering and distance calculation.
- Production `npm run test:app`: passenger/dashboard/driver/health/assets return expected content; synthetic GPS delivered through the real custom server to BOTH authenticated dashboard and public passenger.
- Development `npm run test:app -- --dev`: startup, route compilation and Socket.IO integration passed.
- Chromium browser at 390×844: no horizontal overflow or passenger runtime JS errors; map initializes; reverse route correctly rejected; normal selection restored; actual driver web form with browser-simulated geolocation publishes a fix; passenger shows BUS-001 live; private dashboard authenticates and shows matching coordinates; changed browser position appears in driver output; Stop sharing changes passenger to offline. Map zoom/recenter buttons exercised.

## What these checks do NOT prove
Browser geolocation was simulated, not a physical phone GPS receiver. Windows execution, Moto GPS precision, Cloudflared reachability and fleet-scale capacity must still be tested on your devices. Basemap tiles did not load in this hosted test environment; local marker/stop rendering worked. A clear tile-error banner is provided. Check background streets on your own internet connection.

Follow START-HERE.md section 6 for the real-device acceptance check. A server or browser test cannot guarantee zero future glitches.

## Resolved integration conflicts
- Next 15 frontend merged into Next 16 custom server; removed incompatible standalone deployment configuration.
- Tailwind/PostCSS aligned; removed unused date-fns formatter from the uploaded template.
- Public passenger page at `/`, dashboard moved to `/dashboard`, driver remains `/driver/`.
- Dashboard CSS scoped to its own container; passenger styling uses Tailwind.
- Synthetic movement, fixed speed, fixed last-update label, fake fare/timetable and smooth-ride score removed from live UI.
- Public role receives only the existing safe bus projection and cannot publish coordinates; existing driver/viewer authentication retained.
- Webpack retained for Windows SWC WASM fallback. Exact dev tunnel hostname configurable via DEV_TUNNEL_HOST. Demo instructions use a production build and npm start.
