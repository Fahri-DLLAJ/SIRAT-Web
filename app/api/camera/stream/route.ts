import { NextRequest } from "next/server";

/**
 * GET /api/camera/stream?ip=192.168.1.101
 *
 * Proxies the MJPEG stream from the ESP32-CAM through Next.js so the browser
 * never makes a direct cross-origin request to the device IP (which gets
 * blocked by mixed-content / CORS policies).
 */
export async function GET(req: NextRequest) {
  const ip = req.nextUrl.searchParams.get("ip")
    ?? process.env.NEXT_PUBLIC_ESP32_CAM_IP
    ?? "192.168.1.101";

  const upstream = `http://${ip}:81/stream`;

  let res: Response;
  try {
    res = await fetch(upstream, {
      // No timeout — this is a long-lived streaming response
      signal: req.signal,
    });
  } catch {
    return new Response("ESP32-CAM unreachable", { status: 503 });
  }

  if (!res.ok || !res.body) {
    return new Response("No stream from device", { status: 502 });
  }

  // Forward the multipart stream as-is
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type":  res.headers.get("Content-Type") ?? "multipart/x-mixed-replace; boundary=gc9a",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
