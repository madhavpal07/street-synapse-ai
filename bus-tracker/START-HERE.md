# Start here — integrated passenger + driver + dashboard

## 1. Open the integrated application
After cloning the repository, open its `bus-tracker` folder containing `package.json` in VS Code. Keep any older local project as a backup. Stop its running Node server before starting this one on port 3000.

## 2. First setup (Node 24 or later)
In VS Code PowerShell, inside `bus-tracker`:

```powershell
npm ci
npm run setup
npm run build
npm start
```
`npm run setup` creates private keys in `.env` and does not overwrite an existing file. New setup means NEW driver and dashboard keys. Do not publish or share that file.
First build takes time. Keep the server terminal running. For a repeat demo you only need `npm start` (rebuild after source edits).

## 3. Laptop pages
- Passenger: http://localhost:3000/ — no key
- Dashboard: http://localhost:3000/dashboard — enter DASHBOARD_KEY from `.env`
- Driver: http://localhost:3000/driver/ — for phone use the HTTPS link below

## 4. Phone link: NEW terminal
Use your already downloaded Cloudflared executable:

```powershell
cd C:\Tools\cloudflared
.\cloudflared.exe tunnel --url http://localhost:3000
```
Copy the HTTPS `trycloudflare.com` URL printed in THIS terminal. It can change when Cloudflared restarts.
- Passenger: that exact HTTPS URL
- Driver: append `/driver/`
- Dashboard: append `/dashboard`

Keep both terminals running. Laptop and phone need internet; they need not share Wi-Fi. Do not use localhost on the phone.

## 5. Start real GPS
On phone Chrome open the HTTPS `/driver/` page. Enter BUS-001 and its corresponding value from DRIVER_KEYS_JSON in `.env`. Tap Start sharing and allow precise location. Keep the page foreground and phone screen on.
For BUS-002 use a second phone and its own key. Do not use two phones with the same bus ID simultaneously.
On passenger page select boarding and destination stops in forward order; click Find Live Buses. Select BUS-001 or BUS-002. A marker appears only after a GPS fix. Recenter bus brings its actual position into view, even outside the sample route area.

## 6. Verify the demo
- Confirmed updates increases on driver phone.
- Passenger AND private dashboard show matching bus locations.
- Walk safely with the phone and verify the marker changes.
- Stop sharing: both show offline and retain last location.
- A connected phone with an old GPS fix becomes stale after 15 seconds.
- Passenger refresh receives the current fleet snapshot.
- Passenger controls cannot publish GPS or access private keys.

## 7. What is demo data?
`lib/routes.js` defines sample route 104, stop sequence, illustrative coordinates, and BUS-001/BUS-002 assignments. Replace with operator-verified coordinates/routes for real service. Both buses are assigned to the same forward route. Reverse travel is not configured; reversed/same stops correctly show no route.
Dotted lines connect stops; they are NOT road routing. Distance shown is straight-line from last GPS location to boarding stop. ETA, fare, timetable and amenities are explicitly unavailable; no fake arrival time or road-quality score is displayed. No NavIC integration.

## 8. Development only
Use `npm run dev` for editing. If Next reports blocked cross-origin dev assets, keep the tunnel running, stop ONLY the dev server, then set its exact hostname before restarting:

```powershell
$env:DEV_TUNNEL_HOST="your-current-host.trycloudflare.com"
npm run dev
```
Replace the hostname; omit https:// and /driver/. Update it whenever the tunnel hostname changes. Production `npm start` avoids the dev-only origin issue.
The server and build use Webpack to support Next's WASM fallback when native SWC is blocked by Windows application control. Do not disable Windows security.

## Troubleshooting
- Local page fails: check Node terminal and port 3000 first.
- Tunnel 502: ensure local server is running; test localhost on laptop.
- Old link fails: use the URL from the currently running Cloudflared terminal.
- Map background blank: map tiles require access to CARTO/OpenStreetMap services.
- No GPS: check browser permission, HTTPS, phone location settings, and try outdoors.
- Key rejected: use THIS extracted project's `.env`; dashboard and driver keys differ.
- Server restart clears fleet positions (memory only). Active driver must reconnect/send again.

## Limits
This is a working prototype, not a production fleet service. Public passenger feed intentionally exposes configured bus locations to anyone with the link. Driver/dashboard controls remain authenticated. No location history, database, operator onboarding, traffic-based ETA, high-availability hosting or fleet-scale load test. Do not deploy this custom Socket.IO server as a static Netlify/Vercel site; it needs a persistent Node server.
