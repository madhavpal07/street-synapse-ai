from __future__ import annotations

from datetime import datetime, timedelta
from enum import Enum
from math import atan2, cos, radians, sin, sqrt
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

APP_VERSION = "0.1.0"
DEDUPLICATION_RADIUS_METRES = 15.0
DEDUPLICATION_WINDOW = timedelta(days=7)


class EventType(str, Enum):
    POTHOLE = "pothole"
    WATERLOGGING = "waterlogging"
    DAMAGED_ROAD = "damaged_road"


class IncidentStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class TimestampedPayload(BaseModel):
    timestamp: datetime

    @field_validator("timestamp")
    @classmethod
    def timestamp_must_have_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("timestamp must include a timezone offset")
        return value


class DetectionEventIn(TimestampedPayload):
    vehicle_id: str = Field(min_length=1, max_length=64)
    event_type: EventType
    confidence: float = Field(ge=0.0, le=1.0)
    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)
    speed_kmph: float = Field(default=0.0, ge=0.0)
    heading: float = Field(default=0.0, ge=0.0, lt=360.0)
    model_version: str = Field(default="unknown", min_length=1, max_length=64)
    evidence_url: str | None = None


class Incident(DetectionEventIn):
    id: str
    status: IncidentStatus
    sighting_count: int = Field(ge=1)
    first_seen_at: datetime
    last_seen_at: datetime


class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus


class LocationPing(TimestampedPayload):
    vehicle_id: str = Field(min_length=1, max_length=64)
    route_id: str = Field(min_length=1, max_length=64)
    trip_id: str | None = Field(default=None, max_length=64)
    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)
    speed_kmph: float = Field(default=0.0, ge=0.0)
    heading: float = Field(default=0.0, ge=0.0, lt=360.0)


app = FastAPI(
    title="StreetSynapse API",
    version=APP_VERSION,
    description="Shared urban-event and live-transit API for the SIH 2026 prototype.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

INCIDENTS: list[Incident] = []
VEHICLES: dict[str, LocationPing] = {}


def distance_metres(
    latitude_a: float,
    longitude_a: float,
    latitude_b: float,
    longitude_b: float,
) -> float:
    """Return great-circle distance between two WGS84 points."""

    earth_radius_metres = 6_371_000.0
    latitude_1 = radians(latitude_a)
    latitude_2 = radians(latitude_b)
    latitude_delta = radians(latitude_b - latitude_a)
    longitude_delta = radians(longitude_b - longitude_a)

    haversine_value = (
        sin(latitude_delta / 2) ** 2
        + cos(latitude_1) * cos(latitude_2) * sin(longitude_delta / 2) ** 2
    )
    central_angle = 2 * atan2(sqrt(haversine_value), sqrt(1 - haversine_value))
    return earth_radius_metres * central_angle


def find_duplicate(event: DetectionEventIn) -> Incident | None:
    for incident in INCIDENTS:
        if incident.event_type != event.event_type:
            continue
        if incident.status == IncidentStatus.RESOLVED:
            continue
        time_difference = abs(event.timestamp - incident.last_seen_at)
        if time_difference > DEDUPLICATION_WINDOW:
            continue
        if (
            distance_metres(
                event.latitude,
                event.longitude,
                incident.latitude,
                incident.longitude,
            )
            <= DEDUPLICATION_RADIUS_METRES
        ):
            return incident
    return None


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "street-synapse-api",
        "version": APP_VERSION,
    }


@app.post(
    "/api/v1/events",
    response_model=Incident,
    status_code=status.HTTP_201_CREATED,
)
def submit_event(event: DetectionEventIn) -> Incident:
    duplicate = find_duplicate(event)
    if duplicate is not None:
        duplicate.sighting_count += 1
        duplicate.last_seen_at = max(duplicate.last_seen_at, event.timestamp)
        duplicate.confidence = max(duplicate.confidence, event.confidence)
        duplicate.evidence_url = event.evidence_url or duplicate.evidence_url
        return duplicate

    incident = Incident(
        **event.model_dump(),
        id=str(uuid4()),
        status=IncidentStatus.PENDING,
        sighting_count=1,
        first_seen_at=event.timestamp,
        last_seen_at=event.timestamp,
    )
    INCIDENTS.append(incident)
    return incident


@app.get("/api/v1/incidents", response_model=list[Incident])
def list_incidents(
    event_type: EventType | None = Query(default=None),
    incident_status: IncidentStatus | None = Query(default=None, alias="status"),
) -> list[Incident]:
    results = INCIDENTS
    if event_type is not None:
        results = [item for item in results if item.event_type == event_type]
    if incident_status is not None:
        results = [item for item in results if item.status == incident_status]
    return results


@app.patch("/api/v1/incidents/{incident_id}/status", response_model=Incident)
def change_incident_status(
    incident_id: str,
    update: IncidentStatusUpdate,
) -> Incident:
    for incident in INCIDENTS:
        if incident.id == incident_id:
            incident.status = update.status
            return incident
    raise HTTPException(status_code=404, detail="incident not found")


@app.post(
    "/api/v1/locations",
    response_model=LocationPing,
    status_code=status.HTTP_202_ACCEPTED,
)
def submit_location(location: LocationPing) -> LocationPing:
    current = VEHICLES.get(location.vehicle_id)
    if current is None or location.timestamp >= current.timestamp:
        VEHICLES[location.vehicle_id] = location
    return VEHICLES[location.vehicle_id]


@app.get("/api/v1/vehicles", response_model=list[LocationPing])
def list_vehicles() -> list[LocationPing]:
    return sorted(VEHICLES.values(), key=lambda item: item.vehicle_id)

