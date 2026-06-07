import { NextRequest } from "next/server";

/**
 * GET /api/camera/snapshot?ip=192.168.1.200
 * Proxies a single JPEG capture from ESP32-CAM port 81 /capture
 */
export async function GET(req: NextRequest) {
  const ip   = req.nextUrl.searchParams.get("ip")   ?? "192.168.1.200";
  const port = req.nextUrl.searchParams.get("port") ?? "81";

  let res: Response;
  try {
    res = await fetch(`http://${ip}:${port}/capture`, {
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return new Response("ESP32-CAM unreachable", { status: 503 });
  }

  if (!res.ok || !res.body) {
    return new Response("No snapshot from device", { status: 502 });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
