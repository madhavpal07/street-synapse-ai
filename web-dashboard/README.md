# Web interfaces

- **Pothole authority dashboard:** [authority/index.html](authority/index.html).
  Run scripts/run_dashboard.bat from Windows or follow docs/setup-guide.md.
- **Live passenger UI:** ../bus-tracker/app/page.tsx
- **Private fleet dashboard:** ../bus-tracker/app/dashboard/ and ../bus-tracker/components/Dashboard.js
- **Browser driver page:** ../bus-tracker/driver/

The authority dashboard now reads GET /api/v1/incidents?event_type=pothole
from http://127.0.0.1:5000 and normalizes vehicle_id/timestamp/evidence_url.
Only explicit severity is displayed; confidence is not converted into hazard severity.
Serve it on localhost:5500 or 127.0.0.1:5500, not file://.

A deployment may set window.SAWAARI_API = {base: 'https://your-api.example',
path: '/api/potholes'} before the main inline script when an alternative API
returns the expected array. Configure a narrowly scoped CORS origin on that API.
Do not put API secrets in this public JavaScript configuration.

The current backend does not serve /uploads/ evidence files. Images require that
missing evidence-storage integration. Vehicle totals intentionally remain N/A
because this page is not connected to the Socket.IO fleet feed.

