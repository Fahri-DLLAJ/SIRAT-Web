import axios from "axios";

/**
 * Returns the MJPEG stream URL for a given ESP32-CAM IP.
 * Use this as the `src` of an <img> tag — browsers handle MJPEG natively.
 */
export function getMjpegStreamUrl(ip: string): string {
  return `http://${ip}:81/stream`;
}

/**
 * Returns the processed (AI/object-detection) stream URL served by the
 * Python backend, which pulls from the ESP32-CAM and overlays detections.
 * The Python server is expected to expose an MJPEG endpoint at /processed.
 */
export function getProcessedStreamUrl(ip: string, port = 5000): string {
  return `http://${ip}:${port}/processed`;
}

/** Fetch a single JPEG snapshot from the ESP32-CAM. */
export function getSnapshotUrl(ip: string): string {
  return `http://${ip}:81/capture`;
}

/** Fetch device status JSON from the ESP32 firmware's /status endpoint. */
export async function fetchDeviceStatus(ip: string) {
  try {
    const res = await axios.get(`http://${ip}/status`, { timeout: 3000 });
    return res.data as {
      uptime: number;
      rssi: number;
      heap: number;
      temp?: number;
    };
  } catch {
    return null;
  }
}

/** Toggle a GPIO pin on the ESP32 (e.g. road lamp on/off). */
export async function toggleDevicePin(ip: string, pin: number, state: boolean) {
  try {
    await axios.get(`http://${ip}/gpio?pin=${pin}&state=${state ? 1 : 0}`, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/** Returns the URL of the ESP32-CAM config portal page. */
export function getConfigPortalUrl(ip: string): string {
  return `http://${ip}/`;
}
