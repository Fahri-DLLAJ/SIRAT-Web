import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const DIR  = path.join(process.cwd(), "public", "uploads");
const FILE = path.join(DIR, "education.json");

const DEFAULT = {
  posters: [
    { id: "p1", title: "Zona Selamat Sekolah",  tag: "ZoSS",      color: "from-blue-600 to-blue-800",     icon: "🏫", imageUrl: null },
    { id: "p2", title: "Bahaya Microsleep",      tag: "Kelelahan", color: "from-purple-600 to-purple-800", icon: "😴", imageUrl: null },
    { id: "p3", title: "Jarak Aman 3 Detik",    tag: "Jarak",     color: "from-green-600 to-green-800",   icon: "🚗", imageUrl: null },
    { id: "p4", title: "Aquaplaning",            tag: "Hujan",     color: "from-cyan-600 to-cyan-800",     icon: "💧", imageUrl: null },
    { id: "p5", title: "Blind Spot Truk",        tag: "Titik Buta",color: "from-orange-600 to-orange-800", icon: "🚛", imageUrl: null },
    { id: "p6", title: "Helm SNI Wajib",         tag: "Helm",      color: "from-yellow-600 to-yellow-800", icon: "⛑️", imageUrl: null },
  ],
  quizzes: [
    {
      id: "q1",
      q: "Apa fungsi ZoSS (Zona Selamat Sekolah)?",
      options: [
        "Area parkir khusus pelajar",
        "Zona kecepatan rendah di sekitar sekolah untuk melindungi pelajar",
        "Jalur bus sekolah",
        "Area bermain anak di pinggir jalan",
      ],
      answer: 1,
      explanation: "ZoSS adalah kawasan di sekitar sekolah dengan batas kecepatan 25 km/jam, dilengkapi rambu dan marka khusus untuk melindungi keselamatan pelajar.",
    },
    {
      id: "q2",
      q: "Berapa jarak aman minimum yang disarankan saat berkendara di belakang kendaraan lain?",
      options: ["1 detik", "2 detik", "3 detik", "5 detik"],
      answer: 2,
      explanation: "Aturan 3 detik memberikan waktu reaksi yang cukup untuk berhenti jika kendaraan di depan tiba-tiba mengerem. Tambahkan 1 detik lagi saat hujan.",
    },
    {
      id: "q3",
      q: "Apa yang dimaksud dengan aquaplaning?",
      options: [
        "Berkendara di atas jembatan",
        "Kehilangan traksi ban akibat lapisan air di permukaan jalan",
        "Teknik mengemudi di jalan berlumpur",
        "Sistem pengereman otomatis",
      ],
      answer: 1,
      explanation: "Aquaplaning terjadi saat ban tidak mampu membuang air cukup cepat, sehingga kendaraan 'mengapung' di atas air dan kehilangan kendali.",
    },
    {
      id: "q4",
      q: "Nomor darurat Polisi di Indonesia adalah?",
      options: ["112", "118", "110", "113"],
      answer: 2,
      explanation: "110 adalah nomor darurat Polisi. 118 untuk Ambulans, 113 untuk Pemadam Kebakaran, dan 112 adalah nomor darurat umum.",
    },
    {
      id: "q5",
      q: "Kapan helm harus diganti meskipun tidak ada kerusakan terlihat?",
      options: ["Setiap 1 tahun", "Setiap 3–5 tahun", "Setiap 10 tahun", "Tidak perlu diganti"],
      answer: 1,
      explanation: "Material helm mengalami degradasi seiring waktu akibat panas, keringat, dan UV. Produsen merekomendasikan penggantian setiap 3–5 tahun.",
    },
  ],
};

async function ensureDir() {
  if (!existsSync(DIR)) await mkdir(DIR, { recursive: true });
}

async function read() {
  try { return JSON.parse(await readFile(FILE, "utf-8")); }
  catch { return DEFAULT; }
}

async function save(data: unknown) {
  await ensureDir();
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf-8");
}

/** Save an uploaded image file and return its public URL, or null if none. */
async function saveImage(file: File | null, id: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  await ensureDir();
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `poster-${id}.${ext}`;
  await writeFile(path.join(DIR, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${filename}`;
}

/** Delete an old poster image from disk if it exists. */
async function deleteImage(imageUrl: string | null) {
  if (!imageUrl) return;
  const filepath = path.join(process.cwd(), "public", imageUrl);
  try { await unlink(filepath); } catch { /* already gone */ }
}

export async function GET() {
  return NextResponse.json(await read());
}

/** POST — create poster (multipart) or quiz (JSON) */
export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") ?? "";

  if (ct.includes("multipart/form-data")) {
    const fd   = await req.formData();
    const id   = `p${Date.now()}`;
    const imageUrl = await saveImage(fd.get("image") as File | null, id);
    const item = {
      id,
      title:    fd.get("title")    as string,
      tag:      fd.get("tag")      as string,
      icon:     fd.get("icon")     as string,
      color:    fd.get("color")    as string,
      imageUrl,
    };
    const data = await read();
    data.posters.push(item);
    await save(data);
    return NextResponse.json({ ok: true, id, item });
  }

  // JSON path (quizzes)
  const { type, item } = await req.json();
  const id = `${type[0]}${Date.now()}`;
  const data = await read();
  data[type].push({ ...item, id });
  await save(data);
  return NextResponse.json({ ok: true, id });
}

/** PATCH — update poster (multipart) or quiz (JSON) */
export async function PATCH(req: NextRequest) {
  const ct = req.headers.get("content-type") ?? "";

  if (ct.includes("multipart/form-data")) {
    const fd  = await req.formData();
    const id  = fd.get("id") as string;
    const removeImage = fd.get("removeImage") === "true";
    const data = await read();
    const existing = data.posters.find((x: { id: string }) => x.id === id);

    let imageUrl: string | null = existing?.imageUrl ?? null;

    if (removeImage) {
      await deleteImage(imageUrl);
      imageUrl = null;
    } else {
      const newImage = await saveImage(fd.get("image") as File | null, id);
      if (newImage) {
        await deleteImage(imageUrl); // remove old file
        imageUrl = newImage;
      }
    }

    const updated = {
      ...existing,
      id,
      title:    fd.get("title")    as string,
      tag:      fd.get("tag")      as string,
      icon:     fd.get("icon")     as string,
      color:    fd.get("color")    as string,
      imageUrl,
    };
    data.posters = data.posters.map((x: { id: string }) => x.id === id ? updated : x);
    await save(data);
    return NextResponse.json({ ok: true, item: updated });
  }

  // JSON path (quizzes)
  const { type, item } = await req.json();
  const data = await read();
  data[type] = data[type].map((x: { id: string }) => x.id === item.id ? item : x);
  await save(data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { type, id } = await req.json();
  const data = await read();
  if (type === "posters") {
    const poster = data.posters.find((x: { id: string }) => x.id === id);
    await deleteImage(poster?.imageUrl ?? null);
  }
  data[type] = data[type].filter((x: { id: string }) => x.id !== id);
  await save(data);
  return NextResponse.json({ ok: true });
}
