# Backend

The starter FastAPI service defines the shared API and an in-memory demonstration flow. It deliberately avoids database setup so every member can run it immediately.

## Start

```bash
python -m venv .venv
```

Activate the environment, then:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

## Test

```bash
pytest
```

## Next backend milestones

1. PostgreSQL/PostGIS persistence
2. Device authentication
3. Evidence upload storage
4. WebSocket vehicle updates
5. Agency assignment and ticket audit log
6. Route matching and ETA service

