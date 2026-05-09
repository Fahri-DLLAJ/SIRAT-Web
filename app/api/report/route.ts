import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const REPORTS_FILE = path.join(UPLOADS_DIR, "reports.json");

async function ensureDir() {
  if (!existsSync(UPLOADS_DIR)) await mkdir(UPLOADS_DIR, { recursive: true });
}

async function readReports(): Promise<Record<string, unknown>[]> {
  try { return JSON.parse(await readFile(REPORTS_FILE, "utf-8")); }
  catch { return []; }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDir();
    const formData = await req.formData();

    const id        = `RPT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const report: Record<string, unknown> = {
      id,
      timestamp,
      name:        formData.get("name")        ?? "",
      phone:       formData.get("phone")       ?? "",
      type:        formData.get("type")        ?? "",
      description: formData.get("description") ?? "",
      location:    formData.get("location")    ?? "",
      lat:         Number(formData.get("lat"))  || null,
      lng:         Number(formData.get("lng"))  || null,
      severity:    formData.get("severity")    ?? "medium",
      status:      "pending",
      hidden:      false,
      imageUrl:    null,
      videoUrl:    null,
    };

    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const ext      = imageFile.name.split(".").pop() ?? "jpg";
      const filename = `${id}-image.${ext}`;
      await writeFile(path.join(UPLOADS_DIR, filename), Buffer.from(await imageFile.arrayBuffer()));
      report.imageUrl = `/uploads/${filename}`;
    }

    const videoFile = formData.get("video") as File | null;
    if (videoFile && videoFile.size > 0) {
      const ext      = videoFile.name.split(".").pop() ?? "mp4";
      const filename = `${id}-video.${ext}`;
      await writeFile(path.join(UPLOADS_DIR, filename), Buffer.from(await videoFile.arrayBuffer()));
      report.videoUrl = `/uploads/${filename}`;
    }

    const reports = await readReports();
    reports.push(report);
    await writeFile(REPORTS_FILE, JSON.stringify(reports, null, 2), "utf-8");

    return NextResponse.json({ ok: true, id, report });
  } catch (err) {
    console.error("[/api/report]", err);
    return NextResponse.json({ ok: false, error: "Gagal menyimpan laporan" }, { status: 500 });
  }
}

/** Public GET — hidden reports are excluded (map, status page, home page) */
export async function GET() {
  try {
    await ensureDir();
    const reports = await readReports();
    const visible = reports.filter((r) => !r.hidden);
    return NextResponse.json({ ok: true, reports: visible });
  } catch {
    return NextResponse.json({ ok: false, reports: [] });
  }
}
