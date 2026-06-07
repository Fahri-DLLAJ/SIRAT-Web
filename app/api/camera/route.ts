import { NextRequest, NextResponse } from "next/server";

/**
 * Resolve IP & AI port from query params first, then fall back to env vars.
 * This allows each device to have its own IP/port configured by the admin.
 *   GET/POST /api/camera?ip=192.168.1.101&aiPort=5000
 */
function getVisionBase(req: NextRequest) {
  const ip     = req.nextUrl.searchParams.get("ip")     ?? process.env.NEXT_PUBLIC_ESP32_CAM_IP    ?? "192.168.1.101";
  const aiPort = req.nextUrl.searchParams.get("aiPort") ?? process.env.NEXT_PUBLIC_AI_STREAM_PORT  ?? "5000";
  return `http://${ip}:${aiPort}`;
}

/** POST /api/camera?ip=&aiPort=  body: { action: "wake" | "sleep" } */
export async function POST(req: NextRequest) {
  const { action } = await req.json();
  if (action !== "wake" && action !== "sleep") {
    return NextResponse.json({ error: "action must be wake or sleep" }, { status: 400 });
  }

  const visionBase = getVisionBase(req);
  try {
    const res = await fetch(`${visionBase}/${action}`, {
      method: "POST",
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Vision server not running — not a fatal error, just report it
    return NextResponse.json({ error: "vision server unreachable" }, { status: 503 });
  }
}

/** GET /api/camera?ip=&aiPort=  — proxy health check */
export async function GET(req: NextRequest) {
  const visionBase = getVisionBase(req);
  try {
    const res = await fetch(`${visionBase}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ active: false, clients: 0, error: "unreachable" }, { status: 503 });
  }
}
