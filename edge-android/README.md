# Edge Android module

> Original future plan only. No Android source was supplied. The current driver
> implementation is `../bus-tracker/driver/`; the phone camera prototype is
> `../ml/live_phone_detection.py`.

## Responsibilities

- CameraX frame capture
- GPS, speed, heading, and timestamp capture
- On-device model inference
- Multi-frame event confirmation
- Evidence crop or short clip
- Offline event queue and safe retry
- Location pings independent of incident uploads

The module must send data exactly as documented in `docs/api-contract.md`. During the first milestone, use a button-generated sample event before integrating the real model.

