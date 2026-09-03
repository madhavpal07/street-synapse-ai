# StreetSynapse AI

> The city senses through every journey.

StreetSynapse AI is an edge-AI urban intelligence and real-time transit platform for Smart India Hackathon 2026 problem statement SIH26124. Public transport vehicles act as mobile sensing units: they detect road hazards, attach trustworthy location evidence, suppress duplicate reports, and support both municipal action and passenger-facing bus information.

## First working milestone

The team is building one complete path before adding more features:

1. Detect a pothole or waterlogged road segment.
2. Attach vehicle ID, GPS position, heading, confidence, and timestamp.
3. Send the event to the central API.
4. Merge repeated observations of the same incident.
5. Display the incident on the authority dashboard.
6. Stream the same vehicle's location to the passenger view.

Garbage overflow, streetlight monitoring, advanced ANPR, and city-scale prediction remain later modules until this flow is reliable.

## Repository map

| Path | Owner | Purpose |
|---|---|---|
| `ml/` | Members 1–2 | Dataset, training, evaluation, and model export |
| `edge-android/` | Member 3 | Camera, GPS, edge inference, and offline sync |
| `backend/` | Member 4 | API, deduplication, database, tickets, and live updates |
| `web-dashboard/` | Member 5 | Authority dashboard and passenger map |
| `transit-data/` | Member 6 | Routes, stops, ETA logic, integration testing |
| `docs/` | Everyone | Shared architecture, API contract, and workflow |

## Run the starter backend

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate
```

Install and run:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` to test the API visually.

Run tests:

```bash
pytest
```

## Shared rules

- Read [`docs/api-contract.md`](docs/api-contract.md) before building a module.
- Work on a feature branch; never develop directly on `main`.
- Keep datasets, raw video, model weights, secrets, and local environments out of Git.
- Use small pull requests and integrate every day.
- Record real measurements; never present an untested accuracy claim.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the exact Git workflow.

