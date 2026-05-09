import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOADS_DIR  = path.join(process.cwd(), "public", "uploads");
const REPORTS_FILE = path.join(UPLOADS_DIR, "reports.json");

async function read(): Promise<Record<string, unknown>[]> {
  try { return JSON.parse(await readFile(REPORTS_FILE, "utf-8")); }
  catch { return []; }
}

async function save(data: unknown) {
  if (!existsSync(UPLOADS_DIR)) await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(REPORTS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/** GET /api/admin/reports — returns ALL reports including hidden ones (admin only) */
export async function GET() {
  return NextResponse.json({ ok: true, reports: await read() });
}

/** POST /api/admin/reports — admin creates a report directly (JSON body) */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const id        = `RPT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const timestamp = new Date().toISOString();
  const report = {
    id,
    timestamp,
    name:        body.name        ?? "Admin",
    phone:       body.phone       ?? "",
    type:        body.type        ?? "",
    description: body.description ?? "",
    location:    body.location    ?? "",
    lat:         Number(body.lat) || null,
    lng:         Number(body.lng) || null,
    severity:    body.severity    ?? "medium",
    status:      body.status      ?? "active",
    hidden:      false,
    imageUrl:    null,
    videoUrl:    null,
  };
  const reports = await read();
  reports.push(report);
  await save(reports);
  return NextResponse.json({ ok: true, id, report });
}

/** DELETE /api/admin/reports  body: { id } */
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const reports = await read();
  await save(reports.filter((r) => r.id !== id));
  return NextResponse.json({ ok: true });
}

/** PATCH /api/admin/reports  body: { id, action, payload? } */
export async function PATCH(req: NextRequest) {
  const { id, action, payload } = await req.json();
  const reports = await read();
  const idx = reports.findIndex((r) => r.id === id);
  if (idx === -1) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const r = { ...reports[idx] } as Record<string, unknown>;
  const now = new Date().toISOString();
  const history = (r.statusHistory as unknown[]) ?? [];

  switch (action) {
    case "verify":
      r.status = "active";
      history.push({ status: "active", note: "Laporan diverifikasi oleh admin.", timestamp: now });
      r.statusHistory = history;
      break;
    case "changeStatus":
      r.status = payload.status;
      history.push({ status: payload.status, note: payload.note ?? "", timestamp: now });
      r.statusHistory = history;
      break;
    case "addNote":
      r.notes = [...((r.notes as string[]) ?? []), payload.note];
      break;
    case "complete":
      r.status = "resolved";
      history.push({ status: "resolved", note: payload.note ?? "Laporan diselesaikan.", timestamp: now });
      r.statusHistory = history;
      break;
    case "sendResponse":
      r.response = payload.response;
      break;
    case "hide":
      r.hidden = true;
      break;
    case "unhide":
      r.hidden = false;
      break;
    default:
      return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }

  reports[idx] = r;
  await save(reports);
  return NextResponse.json({ ok: true, report: r });
}
