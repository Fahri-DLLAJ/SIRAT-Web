"""
SIRAT Vision Server
-------------------
Pulls the MJPEG stream from an ESP32-CAM, runs OpenCV-based object/vehicle
detection, and re-serves the annotated frames as a new MJPEG stream.

Endpoints
  GET /processed   — annotated MJPEG stream (used by the web page)
  GET /snapshot    — single annotated JPEG frame
  GET /health      — JSON health check  { "active": bool, "clients": int }
  POST /wake       — tell the server the map page is open  (increments clients)
  POST /sleep      — tell the server the map page closed   (decrements clients)

The capture loop automatically pauses when client_count == 0 to save CPU/RAM.

Usage
  python vision_server.py --ip 192.168.1.101 --port 5000

Dependencies
  pip install flask flask-cors opencv-python-headless numpy requests
"""

import argparse
import threading
import time
import io
import logging

import cv2
import numpy as np
import requests
from flask import Flask, Response, jsonify
from flask_cors import CORS

# ── Config ────────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument("--ip",   default="192.168.1.101", help="ESP32-CAM IP address")
parser.add_argument("--port", default=5000, type=int,  help="Port to serve on")
parser.add_argument("--ai-port", default=5000, type=int, help="(unused, kept for compat)")
args = parser.parse_args()

ESP32_STREAM_URL = f"http://{args.ip}/stream"
SERVE_PORT       = args.port
IDLE_TIMEOUT     = 30          # seconds of zero clients before capture pauses
RECONNECT_DELAY  = 3           # seconds between reconnect attempts
JPEG_QUALITY     = 80

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
log = logging.getLogger("vision")

# ── Shared state ──────────────────────────────────────────────────────────────
lock          = threading.Lock()
latest_frame  = None           # bytes — latest annotated JPEG
client_count  = 0              # how many browser tabs have the map open
last_active   = time.time()    # timestamp of last client activity

# ── Detection helpers ─────────────────────────────────────────────────────────
# We use a lightweight HOG person detector + simple contour-based vehicle
# detection so there are no heavy model downloads required.
hog = cv2.HOGDescriptor()
hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

VEHICLE_LOWER = np.array([0,   0,  50])   # HSV range for dark objects (vehicles)
VEHICLE_UPPER = np.array([180, 50, 200])

LABEL_COLORS = {
    "Orang":     (0,  255, 100),
    "Kendaraan": (0,  180, 255),
}


def detect_and_annotate(frame: np.ndarray) -> np.ndarray:
    """Run detection on a BGR frame and return annotated copy."""
    out = frame.copy()
    h, w = out.shape[:2]

    # ── Person detection (HOG) ────────────────────────────────────────────────
    small = cv2.resize(frame, (w // 2, h // 2))
    rects, _ = hog.detectMultiScale(
        small,
        winStride=(8, 8),
        padding=(4, 4),
        scale=1.05,
    )
    for (x, y, bw, bh) in rects:
        x, y, bw, bh = x * 2, y * 2, bw * 2, bh * 2
        cv2.rectangle(out, (x, y), (x + bw, y + bh), LABEL_COLORS["Orang"], 2)
        _label(out, "Orang", x, y)

    # ── Simple vehicle detection (contour on grayscale diff) ──────────────────
    gray   = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur   = cv2.GaussianBlur(gray, (21, 21), 0)
    _, thr = cv2.threshold(blur, 127, 255, cv2.THRESH_BINARY_INV)
    cnts, _ = cv2.findContours(thr, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for c in cnts:
        area = cv2.contourArea(c)
        if 3000 < area < w * h * 0.4:
            x, y, bw, bh = cv2.boundingRect(c)
            aspect = bw / max(bh, 1)
            if 0.8 < aspect < 4.0:          # rough vehicle aspect ratio
                cv2.rectangle(out, (x, y), (x + bw, y + bh), LABEL_COLORS["Kendaraan"], 2)
                _label(out, "Kendaraan", x, y)

    # ── Timestamp overlay ─────────────────────────────────────────────────────
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    cv2.putText(out, ts, (8, h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1, cv2.LINE_AA)
    cv2.putText(out, "SIRAT AI", (8, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 220, 255), 1, cv2.LINE_AA)

    return out


def _label(img, text, x, y):
    cv2.rectangle(img, (x, y - 16), (x + len(text) * 8, y), (30, 30, 30), cv2.FILLED)
    cv2.putText(img, text, (x + 2, y - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)


def _encode(frame: np.ndarray) -> bytes:
    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
    return buf.tobytes()


# ── Capture thread ────────────────────────────────────────────────────────────
def capture_loop():
    global latest_frame, last_active
    log.info(f"Capture thread started — source: {ESP32_STREAM_URL}")

    while True:
        # ── Sleep when no clients ─────────────────────────────────────────────
        with lock:
            idle = client_count == 0 and (time.time() - last_active) > IDLE_TIMEOUT
        if idle:
            log.info("No active clients — capture paused. Sleeping 5s …")
            time.sleep(5)
            continue

        # ── Connect to ESP32-CAM MJPEG stream ─────────────────────────────────
        try:
            resp = requests.get(ESP32_STREAM_URL, stream=True, timeout=10)
            log.info("Connected to ESP32-CAM stream")
            buf = bytes()

            for chunk in resp.iter_content(chunk_size=4096):
                # Check idle again inside the loop
                with lock:
                    idle = client_count == 0 and (time.time() - last_active) > IDLE_TIMEOUT
                if idle:
                    break

                buf += chunk
                # MJPEG boundary: each frame is between 0xFFD8 … 0xFFD9
                start = buf.find(b"\xff\xd8")
                end   = buf.find(b"\xff\xd9")
                if start != -1 and end != -1 and end > start:
                    jpg_bytes = buf[start : end + 2]
                    buf = buf[end + 2:]

                    arr   = np.frombuffer(jpg_bytes, dtype=np.uint8)
                    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                    if frame is None:
                        continue

                    annotated = detect_and_annotate(frame)
                    encoded   = _encode(annotated)

                    with lock:
                        latest_frame = encoded

        except Exception as e:
            log.warning(f"Stream error: {e} — retrying in {RECONNECT_DELAY}s")
            time.sleep(RECONNECT_DELAY)


# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)   # allow Next.js dev server (localhost:3000) to fetch


def _mjpeg_generator():
    """Yield MJPEG frames for the /processed endpoint."""
    while True:
        with lock:
            frame = latest_frame
        if frame:
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
            )
        else:
            time.sleep(0.05)


@app.route("/processed")
def processed():
    return Response(
        _mjpeg_generator(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


@app.route("/snapshot")
def snapshot():
    with lock:
        frame = latest_frame
    if frame is None:
        return Response(status=503)
    return Response(frame, mimetype="image/jpeg")


@app.route("/health")
def health():
    with lock:
        active = latest_frame is not None
        clients = client_count
    return jsonify({"active": active, "clients": clients})


@app.route("/wake", methods=["POST"])
def wake():
    global client_count, last_active
    with lock:
        client_count += 1
        last_active = time.time()
    log.info(f"Wake signal received — clients: {client_count}")
    return jsonify({"clients": client_count})


@app.route("/sleep", methods=["POST"])
def sleep_route():
    global client_count, last_active
    with lock:
        client_count = max(0, client_count - 1)
        last_active = time.time()
    log.info(f"Sleep signal received — clients: {client_count}")
    return jsonify({"clients": client_count})


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    t = threading.Thread(target=capture_loop, daemon=True)
    t.start()
    log.info(f"Vision server running on http://0.0.0.0:{SERVE_PORT}")
    app.run(host="0.0.0.0", port=SERVE_PORT, threaded=True)
