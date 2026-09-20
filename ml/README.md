# Pothole detection

| Source file | Purpose |
| --- | --- |
| live_phone_detection.py | Browser camera and GPS headers; YOLO inference on the laptop; annotated JPEG and JSON evidence saved locally |
| detect_video.py | Existing offline video detector with a time-gap capture filter |
| detect_unique.py | Existing ByteTrack track-ID capture filter |
| prepare_dataset.py | Existing D40 annotation conversion and dataset split script |
| models/README.md | Required model and distribution instructions |

The saved phone script came from Pasted code(1).py. It was imported as source,
not reconstructed from chat summaries. It uses port 8000 on loopback.
Install requirements in a local Python environment and provide models/best.pt.

```sh
python -m pip install -r requirements.txt
python live_phone_detection.py
```

Phone access requires a deliberately configured HTTPS connection and camera/GPS
permission. This server has no authentication; keep it local until protected.
Recorded videos belong in input_videos/road.mp4 for the existing offline scripts.
Those scripts select CUDA device 0. CPU-only machines need that setting changed
to a supported device. Dataset paths in prepare_dataset.py also need local setup.

## Evidence behavior and limits

- Inference runs on the laptop/server, not in the phone browser.
- The phone source limits evidence to five images per server process and enforces
  a 1.5-second capture gap. Stopping/restarting the camera does not reset the
  process counter. Restart the Python process to begin a fresh demo run.
- GPS presence gates saving, but this source does not validate GPS freshness or
  perform spatial duplicate removal.
- The original VERIFIED POTHOLE overlay means the prototype saved model evidence
  with coordinates. It does not mean independent human or government verification.
- ByteTrack IDs and a time gap do not prove distinct physical potholes.
- Evidence stays local. There is no API upload bridge in this saved file.
- No trained weights, validation dataset, performance results or end-to-end
  camera validation are included.

Outputs, weights and datasets are ignored by Git.
The original multi-class/Android plan is retained in docs/archive/original-project-plan.md;
it is not the implemented behavior of these scripts.

