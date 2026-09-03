from fastapi.testclient import TestClient

from app.main import INCIDENTS, VEHICLES, app

client = TestClient(app)


def setup_function() -> None:
    INCIDENTS.clear()
    VEHICLES.clear()


def sample_event(latitude: float = 29.8649, longitude: float = 77.8954) -> dict:
    return {
        "vehicle_id": "BUS-01",
        "event_type": "pothole",
        "confidence": 0.91,
        "latitude": latitude,
        "longitude": longitude,
        "timestamp": "2026-09-03T18:30:00+05:30",
        "speed_kmph": 28.0,
        "heading": 145.0,
        "model_version": "road-ai-0.1.0",
        "evidence_url": None,
    }


def test_health() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_nearby_event_is_merged() -> None:
    first = client.post("/api/v1/events", json=sample_event())
    second = client.post(
        "/api/v1/events",
        json=sample_event(latitude=29.86491, longitude=77.89541),
    )

    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] == second.json()["id"]
    assert second.json()["sighting_count"] == 2
    assert len(client.get("/api/v1/incidents").json()) == 1


def test_latest_vehicle_position_is_returned() -> None:
    payload = {
        "vehicle_id": "BUS-01",
        "route_id": "ROUTE-01",
        "trip_id": "TRIP-001",
        "latitude": 29.8649,
        "longitude": 77.8954,
        "speed_kmph": 28.0,
        "heading": 145.0,
        "timestamp": "2026-09-03T18:30:00+05:30",
    }

    response = client.post("/api/v1/locations", json=payload)

    assert response.status_code == 202
    vehicles = client.get("/api/v1/vehicles").json()
    assert len(vehicles) == 1
    assert vehicles[0]["vehicle_id"] == "BUS-01"


def test_incident_status_can_change() -> None:
    created = client.post("/api/v1/events", json=sample_event()).json()

    response = client.patch(
        f"/api/v1/incidents/{created['id']}/status",
        json={"status": "verified"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "verified"

