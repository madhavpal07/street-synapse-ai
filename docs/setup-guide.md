# Local setup

These commands run the available modules. They do not supply missing trained
weights or silently invent an ML upload bridge.

## 1. Integrated live bus tracker

Install Node.js 24+ and open the repository in VS Code.

```powershell
cd bus-tracker
npm ci
npm run setup
npm run build
npm start
```

Keep this terminal running. Passenger, driver and fleet dashboard share port
3000. Keys are generated locally in bus-tracker/.env; never commit them.
Follow bus-tracker/START-HERE.md for phone GPS and deliberate HTTPS setup.

## 2. Incident API

Use Python 3.12 for the documented test environment. In a new terminal:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 5000
```

Open http://127.0.0.1:5000/docs. GET /api/v1/incidents lists incidents;
POST /api/v1/events submits them. Only submit real authorized location data.
The API is an unauthenticated in-memory development service.

## 3. Pothole authority dashboard

From repository root, in another terminal:

```powershell
python -m http.server 5500 --bind 127.0.0.1 --directory web-dashboard/authority
```

Open http://127.0.0.1:5500/. It reads the incident API on port 5000.
An empty queue is normal before API submissions. Leaflet and map tiles need
internet access. The current API does not upload or serve evidence images.

## 4. Phone-camera detector

Put your trusted trained pothole weights in ml/models/best.pt. Then:

```powershell
cd ml
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe live_phone_detection.py
```

The camera service uses http://localhost:8000 on the laptop.
A real phone requires HTTPS, camera/GPS permission and a protected connection.
This source has no device authentication or upload-size limit. Do not expose it
publicly as a production service. Evidence is saved in ignored
ml/phone_live_outputs/. Restart the Python server for a fresh evidence counter.

## 5. Optional database prototype

```powershell
cd backend
.venv\Scripts\python.exe -m pip install -r requirements-database.txt
.venv\Scripts\python.exe -m app.database
```

This creates a local SQLite database. It does not change the in-memory API.
The existing branch's smart_city.db was intentionally not imported.
Keep DATABASE_URL private.

## Repeat startup on Windows

scripts/run_bus_tracker.bat, run_backend.bat, run_dashboard.bat and run_ml.bat
start their respective components. run_all.bat opens separate command windows
and skips camera startup when weights are absent. Install dependencies first.
These launchers start services only; they do not add missing integrations.

| Port | Module |
| --- | --- |
| 3000 | Integrated bus tracker |
| 5000 | FastAPI incidents |
| 5500 | Authority dashboard |
| 8000 | Phone-camera detector |

On macOS/Linux activate the equivalent virtual environments or use
.venv/bin/python with the same module commands.
