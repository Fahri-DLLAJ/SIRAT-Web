import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const DIR  = path.join(process.cwd(), "public", "uploads");
const FILE = path.join(DIR, "devices.json");

const SEED = [
  { id: "d1", name: "Kamera Simpang Pedan",     type: "camera",        lat: -7.7059, lng: 110.6010, status: "active",  ip: "192.168.1.101", lastSeen: new Date().toISOString(), description: "" },
  { id: "d2", name: "Lampu Jalan Jl. Pemuda",   type: "lamp",          lat: -7.7080, lng: 110.5980, status: "active",  ip: "192.168.1.102", lastSeen: new Date().toISOString(), description: "" },
  { id: "d3", name: "ZoSS SDN Klaten Tengah",   type: "sensor",        lat: -7.7120, lng: 110.6050, status: "offline", lastSeen: new Date(Date.now() - 86400000).toISOString(), description: "" },
  { id: "d4", name: "Traffic Light Alun-Alun",  type: "traffic-light", lat: -7.7065, lng: 110.6025, status: "active",  ip: "192.168.1.104", lastSeen: new Date().toISOString(), description: "" },
  { id: "d5", name: "Kamera Simpang Prambanan", type: "camera",        lat: -7.7520, lng: 110.4910, status: "active",  ip: "192.168.1.105", lastSeen: new Date().toISOString(), description: "" },
  { id: "d6", name: "Traffic Light Jl. Solo",   type: "traffic-light", lat: -7.7200, lng: 110.5900, status: "active",  ip: "192.168.1.106", lastSeen: new Date().toISOString(), description: "" },
  { id: "d7", name: "ZoSS SDN Ceper",           type: "sensor",        lat: -7.6850, lng: 110.6200, status: "active",  ip: "192.168.1.107", lastSeen: new Date().toISOString(), description: "" },
  { id: "d8", name: "Lampu Jalan Jl. Merbabu",  type: "lamp",          lat: -7.7010, lng: 110.6080, status: "offline", lastSeen: new Date(Date.now() - 3600000).toISOString(), description: "" },
];

async function read(): Promise<Record<string, unknown>[]> {
  try { return JSON.parse(await readFile(FILE, "utf-8")); }
  catch { return SEED; }
}

async function save(data: unknown) {
  if (!existsSync(DIR)) await mkdir(DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  return NextResponse.json({ ok: true, devices: await read() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = `DEV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const device = { ...body, id, lastSeen: new Date().toISOString() };
  const devices = await read();
  devices.push(device);
  await save(devices);
  return NextResponse.json({ ok: true, device });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  const devices = await read();
  const idx = devices.findIndex((d) => d.id === id);
  if (idx === -1) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  devices[idx] = { ...devices[idx], ...updates };
  await save(devices);
  return NextResponse.json({ ok: true, device: devices[idx] });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const devices = await read();
  const filtered = devices.filter((d) => d.id !== id);
  await save(filtered);
  return NextResponse.json({ ok: true });
}
