# Source status

| Module | Present | Limitation |
| --- | --- | --- |
| Driver GPS | Browser geolocation and authenticated Socket.IO updates | Requires HTTPS and foreground phone access |
| Passenger UI | Live feed, sample stop selection, map | Routes are illustrative; ETA/fare/timetable unavailable |
| Fleet dashboard | Key-protected viewer, live/stale/offline states | Memory-only bus state |
| Phone pothole detector | JPEG/GPS input, YOLO inference, local evidence | Weights absent; no API posting, device auth, spatial dedup or GPS freshness validation |
| Offline pothole scripts | Video inference, capture gap, track-ID filtering | Existing CUDA device 0 and local dataset paths require setup |
| Incident API | Validated event schema, geographic/time duplicate lookup, status updates | In-memory and unauthenticated |
| Pothole dashboard | Map, queue filters, incident API read adapter | No evidence storage/upload and no fleet metrics integration |
| Database prototype | SQLAlchemy SQLite schema from feature/database | Not connected to API |
| Android | Original plan retained | No native application |
| Training/evaluation | Dataset conversion script | Training source, weights and verified metrics unavailable in supplied files |

## Remaining integration work

1. Supply the latest trusted pothole model and actual training/validation metadata.
2. Supply or implement the authenticated ML-to-API bridge with an evidence upload
   contract, bounded file sizes and safe storage.
3. Connect persistent storage with a schema compatible with the existing API.
4. Validate real phone camera/GPS, duplicate behavior and multi-device isolation.
5. Protect all incident and camera endpoints before external deployment.

The September 14 pitch deck is preserved as a historical source.
It references intended mobile inference, Streamlit, ETA, DBSCAN and offline sync
that the checked-in source does not establish as implemented. Do not use that
deck as proof of working features.
