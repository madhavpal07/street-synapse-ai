# Backend

The SIH import preserves this in-memory API. `app/database.py` is a separate
prototype recovered from `feature/database`; it is not wired into this API.
Use `requirements-database.txt` for that optional module. Local databases are ignored.

Use port **5000** for the authority dashboard, leaving port 8000 for the camera.

The starter FastAPI service defines the shared API and an in-memory demonstration flow. It deliberately avoids database setup so every member can run it immediately.

## Start

```bash
python -m venv .venv
```

Activate the environment, then:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 5000
```

Interactive API documentation is available at `http://127.0.0.1:5000/docs`.

## Test

```bash
python -m pytest
```

## Next backend milestones

1. PostgreSQL/PostGIS persistence
2. Device authentication
3. Evidence upload storage
4. WebSocket vehicle updates
5. Agency assignment and ticket audit log
6. Route matching and ETA service
