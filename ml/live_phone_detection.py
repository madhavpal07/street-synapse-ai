from __future__ import annotations

import json
import threading
import time
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "best.pt"
OUTPUT_DIR = BASE_DIR / "phone_live_outputs"
MAX_EVIDENCE_IMAGES = 5
MIN_EVENT_GAP_SECONDS = 1.5

model: YOLO | None = None
model_lock = threading.Lock()
state_lock = threading.Lock()
evidence_count = 0
last_detection_time = 0.0
run_folder: Path | None = None


PAGE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>StreetSynapse Live Camera</title>
  <style>
    body{margin:0;background:#0b1220;color:#fff;font-family:Arial,sans-serif;text-align:center}
    main{max-width:640px;margin:auto;padding:20px}
    h1{color:#4ade80;margin-bottom:4px} video{width:100%;border-radius:14px;background:#111}
    button{width:100%;padding:15px;margin-top:14px;border:0;border-radius:10px;background:#16a34a;color:#fff;font-size:18px;font-weight:700}
    #stop{background:#dc2626;display:none}.card{background:#172033;padding:13px;border-radius:10px;margin-top:14px}
  </style>
</head>
<body><main>
  <h1>StreetSynapse AI</h1><p>Live pothole detection</p>
  <video id="camera" autoplay playsinline muted></video><canvas id="canvas" hidden></canvas>
  <button id="start">Start Live Camera</button><button id="stop">Stop Camera</button>
  <div class="card" id="status">Ready</div><div class="card" id="count">Verified evidence: 0 / 5</div>
</main>
<script>
const video=document.querySelector('#camera'), canvas=document.querySelector('#canvas');
const start=document.querySelector('#start'), stop=document.querySelector('#stop');
const statusBox=document.querySelector('#status'), countBox=document.querySelector('#count');
let stream=null,timer=null,busy=false,gps=null,gpsWatch=null;
async function sendFrame(){
  if(busy||!video.videoWidth)return; busy=true;
  canvas.width=video.videoWidth; canvas.height=video.videoHeight;
  canvas.getContext('2d').drawImage(video,0,0);
  canvas.toBlob(async blob=>{
    try{
      const headers={'Content-Type':'image/jpeg','X-Captured-At':new Date().toISOString()};
      if(gps){
        headers['X-Latitude']=String(gps.latitude);
        headers['X-Longitude']=String(gps.longitude);
        headers['X-Accuracy']=String(gps.accuracy);
      }
      const response=await fetch('/api/detect',{method:'POST',headers:headers,body:blob});
      const data=await response.json();
      statusBox.textContent=data.detected?(data.gps_ready?'Pothole detected with GPS ✓':'Pothole found — waiting for GPS'):'Road scanning…';
      statusBox.style.color=data.detected?'#4ade80':'#fff';
      countBox.textContent=`Verified evidence: ${data.evidence_count} / 5`;
    }catch(error){statusBox.textContent='Connection error';}
    finally{busy=false;}
  },'image/jpeg',0.82);
}
start.onclick=async()=>{
  try{
    if('geolocation' in navigator){
      gpsWatch=navigator.geolocation.watchPosition(
        position=>{gps={latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy};},
        error=>{statusBox.textContent='Allow location permission to save evidence';},
        {enableHighAccuracy:true,maximumAge:2000,timeout:15000}
      );
    }
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
    video.srcObject=stream; start.style.display='none'; stop.style.display='block';
    statusBox.textContent='Camera live — scanning road…'; timer=setInterval(sendFrame,700);
  }catch(error){statusBox.textContent='Camera permission denied';}
};
stop.onclick=()=>{
  clearInterval(timer); if(stream)stream.getTracks().forEach(track=>track.stop());
  if(gpsWatch!==null)navigator.geolocation.clearWatch(gpsWatch);
  start.style.display='block';stop.style.display='none';statusBox.textContent='Camera stopped';
};
</script></body></html>"""


def get_model() -> YOLO:
    global model
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")
    if model is None:
        with model_lock:
            if model is None:
                model = YOLO(str(MODEL_PATH))
    return model


def add_verified_badge(
    image: np.ndarray,
    latitude: float,
    longitude: float,
    accuracy: float | None,
    captured_at: str,
) -> np.ndarray:
    result = image.copy()
    cv2.rectangle(result, (20, 20), (330, 85), (0, 160, 0), -1)
    cv2.line(result, (40, 52), (52, 65), (255, 255, 255), 5)
    cv2.line(result, (52, 65), (72, 38), (255, 255, 255), 5)
    cv2.putText(
        result,
        "VERIFIED POTHOLE",
        (85, 62),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.75,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )
    accuracy_text = "unknown" if accuracy is None else f"{accuracy:.1f} m"
    details = [
        f"GPS: {latitude:.6f}, {longitude:.6f}",
        f"Accuracy: {accuracy_text}",
        f"Captured: {captured_at[:19].replace('T', ' ')} UTC",
    ]
    panel_bottom = 105 + (len(details) * 30)
    cv2.rectangle(result, (20, 95), (570, panel_bottom), (0, 0, 0), -1)
    for index, text in enumerate(details):
        cv2.putText(
            result,
            text,
            (35, 125 + index * 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )
    return result


def begin_run() -> None:
    global run_folder
    run_folder = OUTPUT_DIR / datetime.now().strftime("run_%Y%m%d_%H%M%S")
    run_folder.mkdir(parents=True, exist_ok=True)


def detect_frame(
    raw: bytes,
    latitude: float | None,
    longitude: float | None,
    accuracy: float | None,
    captured_at: str,
) -> dict[str, object]:
    global evidence_count, last_detection_time
    image = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Invalid camera frame")

    detector = get_model()
    with model_lock:
        result = detector.predict(image, conf=0.25, verbose=False)[0]
    detected = result.boxes is not None and len(result.boxes) > 0
    confidence = 0.0

    if detected:
        confidence = float(result.boxes.conf.max().item())
        now = time.monotonic()
        with state_lock:
            should_save = (
                evidence_count < MAX_EVIDENCE_IMAGES
                and now - last_detection_time >= MIN_EVENT_GAP_SECONDS
                and latitude is not None
                and longitude is not None
            )
            if should_save:
                evidence_count += 1
                last_detection_time = now
                evidence = add_verified_badge(
                    result.plot(), latitude, longitude, accuracy, captured_at
                )
                name = f"pothole_{evidence_count}_confidence_{confidence:.2f}.jpg"
                cv2.imwrite(str(run_folder / name), evidence)
                metadata = {
                    "evidence": name,
                    "confidence": confidence,
                    "latitude": latitude,
                    "longitude": longitude,
                    "accuracy_metres": accuracy,
                    "captured_at": captured_at,
                    "google_maps_url": f"https://maps.google.com/?q={latitude},{longitude}",
                }
                (run_folder / f"pothole_{evidence_count}.json").write_text(
                    json.dumps(metadata, indent=2), encoding="utf-8"
                )

    return {
        "detected": detected,
        "confidence": round(confidence, 3),
        "evidence_count": evidence_count,
        "maximum": MAX_EVIDENCE_IMAGES,
        "gps_ready": latitude is not None and longitude is not None,
    }


class CameraHandler(BaseHTTPRequestHandler):
    def send_bytes(self, data: bytes, content_type: str, status: int = 200) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        if self.path == "/":
            self.send_bytes(PAGE.encode("utf-8"), "text/html; charset=utf-8")
        else:
            self.send_bytes(b"Not found", "text/plain", 404)

    def do_POST(self) -> None:
        if self.path != "/api/detect":
            self.send_bytes(b'{"error":"Not found"}', "application/json", 404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = self.rfile.read(length)
            latitude_header = self.headers.get("X-Latitude")
            longitude_header = self.headers.get("X-Longitude")
            accuracy_header = self.headers.get("X-Accuracy")
            captured_at = self.headers.get("X-Captured-At") or datetime.now().astimezone().isoformat()
            latitude = float(latitude_header) if latitude_header else None
            longitude = float(longitude_header) if longitude_header else None
            accuracy = float(accuracy_header) if accuracy_header else None
            result = detect_frame(
                payload, latitude, longitude, accuracy, captured_at
            )

            self.send_bytes(json.dumps(result).encode("utf-8"), "application/json")
        except Exception as error:
            data = json.dumps({"error": str(error)}).encode("utf-8")
            self.send_bytes(data, "application/json", 500)

    def log_message(self, format: str, *args: object) -> None:
        return


if __name__ == "__main__":
    begin_run()
    print("StreetSynapse phone camera server: http://localhost:8000")
    ThreadingHTTPServer(("127.0.0.1", 8000), CameraHandler).serve_forever()
