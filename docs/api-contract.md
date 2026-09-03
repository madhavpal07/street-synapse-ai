# API contract v1

Base path: `/api/v1`

All timestamps must be ISO 8601 values containing a timezone offset. Confidence values range from `0.0` to `1.0`. Latitude and longitude use WGS84 decimal degrees.

## Health

`GET /health`

```json
{
  "status": "ok",
  "service": "street-synapse-api",
  "version": "0.1.0"
}
```

## Submit an urban event

`POST /events`

```json
{
  "vehicle_id": "BUS-01",
  "event_type": "pothole",
  "confidence": 0.91,
  "latitude": 29.8649,
  "longitude": 77.8954,
  "timestamp": "2026-09-03T18:30:00+05:30",
  "speed_kmph": 28.0,
  "heading": 145.0,
  "model_version": "road-ai-0.1.0",
  "evidence_url": null
}
```

Supported initial event types:

- `pothole`
- `waterlogging`
- `damaged_road`

The response contains the incident ID, workflow status, number of sightings, and latest observation time. A nearby repeated event may return the existing incident with an increased sighting count.

## List incidents

`GET /incidents`

Optional query parameters:

- `event_type`
- `status`

## Change incident status

`PATCH /incidents/{incident_id}/status`

```json
{
  "status": "verified"
}
```

Initial workflow states:

```text
pending -> verified -> assigned -> in_progress -> resolved
```

## Submit vehicle position

`POST /locations`

```json
{
  "vehicle_id": "BUS-01",
  "route_id": "ROUTE-01",
  "trip_id": "TRIP-001",
  "latitude": 29.8649,
  "longitude": 77.8954,
  "speed_kmph": 28.0,
  "heading": 145.0,
  "timestamp": "2026-09-03T18:30:00+05:30"
}
```

## List latest vehicle positions

`GET /vehicles`

The endpoint returns only the latest accepted position for each vehicle.

## Change control

Any incompatible field change requires:

1. Updating this document.
2. Updating backend tests.
3. Informing Android and web owners.
4. Approval from the integration lead before merge.

