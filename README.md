# SAWAARI / StreetSynapse AI

SIH 2026 project source: phone-based live bus tracking and pothole detection.
Only SIH-related work belongs here.

**This is a prototype source repository, not a claim of complete end-to-end deployment.**
The bus-tracking app is integrated. The phone detector currently saves evidence
locally; it does not automatically upload incidents to the FastAPI service.

## Project map

| Folder | Contents |
| --- | --- |
| [bus-tracker/](bus-tracker/) | Integrated Next.js passenger UI, authenticated fleet dashboard, browser driver page and Express/Socket.IO server |
| [ml/](ml/) | Saved phone-camera detector, offline video detection, track-ID filtering and dataset conversion |
| [web-dashboard/authority/](web-dashboard/authority/) | Leaflet pothole dashboard, adapted to the existing FastAPI incident list |
| [backend/](backend/) | Existing in-memory FastAPI API and a separate SQLAlchemy database prototype |
| [designs/citytransit-prototype/](designs/citytransit-prototype/) | Original standalone passenger UI with mock data; design reference only |
| [transit-data/](transit-data/) | Route-data guidance; active sample routes live in bus-tracker/lib/routes.js |
| [docs/](docs/) | Setup, module status, API contract, source inventory and flowchart |
| [scripts/](scripts/) | Windows launchers |
| [tests/](tests/) | Repository-level validation guidance |
| [edge-android/](edge-android/) | Preserved original Android plan, not an implemented app |

## Start the bus-tracking demo

Node.js 24 or newer is required by the imported app.

```sh
cd bus-tracker
npm ci
npm run setup
npm run build
npm start
```

- Passenger page: http://localhost:3000/
- Private fleet dashboard: http://localhost:3000/dashboard
- Driver page: http://localhost:3000/driver/

Setup generates private keys in an ignored .env file and preserves existing keys.
For phone location, use HTTPS and explicitly allow GPS. Read
[bus-tracker/START-HERE.md](bus-tracker/START-HERE.md).

## Pothole modules

See [setup guide](docs/setup-guide.md) for Python setup and ports.
The saved phone detector requires a trusted trained pothole model at
ml/models/best.pt. Model weights and private GPS evidence are not included.

The government dashboard reads the existing incident API. It remains empty
until incidents are submitted. Image upload/storage and the automatic
ML-to-API bridge are not part of the available source.

## Current limits

- Live bus positions are real phone inputs, but route coordinates are illustrative.
  Production routes, traffic-based ETA, fares and timetables are not supplied.
- Bus locations and FastAPI incidents are in memory and reset on server restart.
- The database prototype is not wired into the running API.
- A detection confidence score is not accuracy, physical severity or human verification.
- The historical pitch deck and flowchart include intended features; they do not
  override the [current source status](docs/module-status.md).
- No production authentication, deployment or fleet-scale validation is claimed.

[Source inventory](docs/source-inventory.md) records what was imported and what
is unavailable. [Verification](docs/verification.md) records checks performed.

## Team workflow and privacy

Use a feature branch and pull request, as described in [CONTRIBUTING.md](CONTRIBUTING.md).
Keep real .env files, credentials, databases, datasets, raw videos and location
evidence out of Git. Do not expose the unauthenticated incident API or camera
server to the public internet without adding access control.

No license has been selected for the team's source. Third-party dependencies
retain their respective licenses.
