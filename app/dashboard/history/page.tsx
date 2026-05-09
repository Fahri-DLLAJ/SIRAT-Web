"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, RefreshCw, Search, X, Eye, MapPin, FileText,
  AlertTriangle, CheckCircle2, Database, Sheet, HardDrive,
  Filter, ChevronDown, Image as ImageIcon, SlidersHorizontal,
} from "lucide-react";
import { rtdb, ref, onValue, off, signIn } from "@/lib/firebase";
import { fetchFromSheet, SheetRow } from "@/lib/sheets";
import { formatDate } from "@/lib/utils";
import { Report } from "@/store/appStore";

// ── Source tag ─────────────────────────────────────────────────────
type Source = "local" | "firebase" | "sheets";

interface HistoryEntry {
  id: string;
  timestamp: string;
  type: string;
  location: string;
  severity: string;
  status: string;
  description?: string;
  imageUrl?: string;
  name?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  source: Source;
  statusHistory?: { status: string; note: string; timestamp: string }[];
  notes?: string[];
  response?: string;
  [key: string]: unknown;
}

// ── Badge helpers ──────────────────────────────────────────────────
const SEV_CLS: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high:     "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low:      "bg-green-500/15 text-green-400 border-green-500/30",
};
const SEV_LABEL: Record<string, string> = { critical: "Kritis", high: "Tinggi", medium: "Sedang", low: "Rendah" };

const STA_CLS: Record<string, string> = {
  active:   "bg-green-500/15 text-green-400 border-green-500/30",
  pending:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  resolved: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};
const STA_LABEL: Record<string, string> = { active: "Aktif", pending: "Menunggu", resolved: "Selesai" };

const SRC_CFG: Record<Source, { label: string; icon: React.ElementType; cls: string }> = {
  local:    { label: "Lokal",    icon: HardDrive, cls: "bg-gray-500/15 text-gray-400 border-gray-500/30"   },
  firebase: { label: "Firebase", icon: Database,  cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  sheets:   { label: "Sheets",   icon: Sheet,     cls: "bg-green-500/15 text-green-400 border-green-500/30"    },
};

function SevBadge({ s }: { s: string }) {
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SEV_CLS[s] ?? SEV_CLS.low}`}>{SEV_LABEL[s] ?? s}</span>;
}
function StaBadge({ s }: { s: string }) {
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STA_CLS[s] ?? STA_CLS.pending}`}>{STA_LABEL[s] ?? s}</span>;
}
function SrcBadge({ s }: { s: Source }) {
  const cfg = SRC_CFG[s];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <Icon size={9} />{cfg.label}
    </span>
  );
}

// ── Severity filter dropdown ───────────────────────────────────────
type SevFilter = "all" | "low" | "medium" | "high" | "critical";
const SEV_OPTIONS: { value: SevFilter; label: string }[] = [
  { value: "all", label: "Semua Tingkat" },
  { value: "critical", label: "Kritis" },
  { value: "high", label: "Tinggi" },
  { value: "medium", label: "Sedang" },
  { value: "low", label: "Rendah" },
];

function SevDropdown({ value, onChange }: { value: SevFilter; onChange: (v: SevFilter) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors"
      >
        <Filter size={13} className="text-gray-400" />
        <span className="hidden sm:inline text-xs">{SEV_OPTIONS.find((o) => o.value === value)?.label}</span>
        <ChevronDown size={12} className="hidden sm:block text-gray-500" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.ul
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 mt-1 z-20 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[140px]"
            >
              {SEV_OPTIONS.map((o) => (
                <li key={o.value}>
                  <button
                    onClick={() => { onChange(o.value); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${value === o.value ? "bg-blue-600/20 text-blue-400" : "text-gray-300 hover:bg-white/8"}`}
                  >
                    {o.label}
                  </button>
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── IoT detail renderer ────────────────────────────────────────────
function IoTDetail({ entry }: { entry: HistoryEntry }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = entry as any;
  const sections: { label: string; color: string; rows: [string, string][] }[] = [];

  if (raw["road-lamp"]) {
    const rl = raw["road-lamp"];
    sections.push({ label: "Road Lamp", color: "text-yellow-400", rows: [
      ["Cahaya",    rl.light_status ?? "—"],
      ["Kecepatan", `${rl.speed_mph?.toFixed(2) ?? 0} mph`],
      ["Ngebut",    rl.speeding ? "Ya" : "Tidak"],
      ["LED",       rl.led_status || "—"],
      ["Buzzer",    rl.buzzer_status || "—"],
    ]});
  }
  if (raw["traffic-light"]) {
    const tl = raw["traffic-light"];
    sections.push({ label: "Traffic Light", color: "text-green-400", rows: [
      ["Lampu",     tl.light_status ?? "—"],
      ["Kecepatan", `${tl.speed_kpj ?? 0} km/h`],
      ["Ngebut",    tl.speeding ? "Ya" : "Tidak"],
      ["Tombol",    String(tl.button_status ?? "—")],
    ]});
  }
  if (raw.zoss) {
    const z = raw.zoss;
    sections.push({ label: "ZoSS", color: "text-blue-400", rows: [
      ["Tombol",    z.button_status ?? "—"],
      ["LED",       z.led_color ?? "—"],
      ["Kecepatan", `${z.speed_kpj ?? 0} km/h`],
      ["Ngebut",    z.ngebut ? "Ya" : "Tidak"],
      ["Buzzer",    String(z.buzzer_status ?? "—")],
    ]});
  }

  if (sections.length === 0) {
    return <p className="text-xs text-gray-400 bg-white/5 rounded-xl p-3">{entry.description || "—"}</p>;
  }

  return (
    <div className="space-y-3">
      {sections.map((sec) => (
        <div key={sec.label} className="bg-white/5 rounded-xl p-3">
          <p className={`text-[11px] font-bold mb-2 ${sec.color}`}>{sec.label}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {sec.rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-200 font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────
function DetailModal({ entry, onClose }: { entry: HistoryEntry; onClose: () => void }) {
  const iot = entry.type === "Data Sensor IoT";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText size={15} className="text-orange-400" />
            <span className="font-semibold text-sm">{entry.type}</span>
            {!iot && <SevBadge s={entry.severity} />}
            {!iot && <StaBadge s={entry.status} />}
            <SrcBadge s={entry.source} />
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors ml-2"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><p className="text-gray-500 mb-0.5">ID</p><p className="font-mono text-gray-300 break-all text-[10px]">{entry.id}</p></div>
            <div><p className="text-gray-500 mb-0.5">Waktu</p><p className="text-gray-300">{formatDate(entry.timestamp)}</p></div>
            {!iot && (
              <div className="col-span-2">
                <p className="text-gray-500 mb-0.5">Lokasi</p>
                <p className="text-gray-300 flex items-center gap-1"><MapPin size={10} />{entry.location}</p>
              </div>
            )}
            {entry.name && <div><p className="text-gray-500 mb-0.5">Pelapor</p><p className="text-gray-300">{entry.name}</p></div>}
            {entry.phone && <div><p className="text-gray-500 mb-0.5">Telepon</p><p className="text-gray-300">{entry.phone}</p></div>}
            {!iot && entry.description && (
              <div className="col-span-2"><p className="text-gray-500 mb-0.5">Deskripsi</p><p className="text-gray-300">{entry.description}</p></div>
            )}
          </div>

          {iot && <IoTDetail entry={entry} />}

          {!iot && entry.imageUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><ImageIcon size={11} /> Bukti Foto</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.imageUrl} alt="Bukti" className="w-full rounded-xl object-cover max-h-52 border border-white/10" />
            </div>
          )}

          {!iot && entry.statusHistory && entry.statusHistory.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Riwayat Status</p>
              <div className="space-y-1.5">
                {entry.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <StaBadge s={h.status} />
                    <span className="text-gray-400 flex-1">{h.note}</span>
                    <span className="text-gray-600 shrink-0">{formatDate(h.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── IoT normaliser helpers ────────────────────────────────────────
interface FirebaseSnapshot {
  "road-lamp"?:    { button_status?: string; buzzer_status?: string; led_status?: string; light_status?: string; speeding?: boolean; speed_mph?: number };
  "traffic-light"?:{ button_status?: boolean; light_status?: string; speeding?: boolean; speed_kpj?: number };
  zoss?:           { button_status?: string; buzzer_status?: boolean; led_color?: string; ngebut?: boolean; speed_kpj?: number };
}

function normaliseFirebaseSnapshot(val: FirebaseSnapshot, key: string): HistoryEntry {
  const snap = val as FirebaseSnapshot;
  const rl  = snap["road-lamp"];
  const tl  = snap["traffic-light"];
  const zoss = snap.zoss;
  const parts: string[] = [];
  if (rl)   parts.push(`RL: ${rl.light_status ?? "—"}, ${rl.speed_mph?.toFixed(1) ?? 0} mph`);
  if (tl)   parts.push(`TL: ${tl.light_status ?? "—"}, ${tl.speed_kpj ?? 0} km/h`);
  if (zoss) parts.push(`ZoSS: ${zoss.button_status ?? "—"}, LED ${zoss.led_color ?? "—"}`);
  return {
    id:          `fb-${key}`,
    timestamp:   new Date().toISOString(),
    type:        "Data Sensor IoT",
    location:    "—",
    severity:    "low",
    status:      "resolved",
    description: parts.join(" | ") || "—",
    source:      "firebase",
    // keep raw sub-objects for detail modal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(val as any),
  };
}

// ── Merge helper ───────────────────────────────────────────────────
function mergeEntries(
  local: HistoryEntry[],
  firebase: HistoryEntry[],
  sheets: HistoryEntry[],
): HistoryEntry[] {
  const map = new Map<string, HistoryEntry>();
  // Priority: local > firebase > sheets (local has most detail)
  [...sheets, ...firebase, ...local].forEach((e) => {
    if (e.id) map.set(e.id, e);
  });
  return [...map.values()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// ── Mobile filter bottom sheet ───────────────────────────────────
function MobileFilterButton({
  staFilter, sevFilter, onChangeSta, onChangeSev,
}: {
  staFilter: string;
  sevFilter: SevFilter;
  onChangeSta: (v: "all" | "pending" | "active" | "resolved") => void;
  onChangeSev: (v: SevFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeCount = (staFilter !== "all" ? 1 : 0) + (sevFilter !== "all" ? 1 : 0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden relative flex items-center gap-1.5 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white flex-shrink-0 transition-colors hover:bg-white/10"
      >
        <SlidersHorizontal size={14} className="text-gray-400" />
        <span className="text-xs">Filter</span>
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full text-[9px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="sm:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-white/10 rounded-t-2xl p-5"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-sm">Filter</p>
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                  <X size={16} className="text-gray-400" />
                </button>
              </div>

              {/* Status */}
              <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-2">Status</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {(["all", "pending", "active", "resolved"] as const).map((s) => {
                  const icons = { all: FileText, pending: Clock, active: AlertTriangle, resolved: CheckCircle2 };
                  const Icon = icons[s];
                  const label = s === "all" ? "Semua" : STA_LABEL[s];
                  return (
                    <button
                      key={s}
                      onClick={() => onChangeSta(s)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        staFilter === s
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-white/5 border-white/10 text-gray-300"
                      }`}
                    >
                      <Icon size={13} />{label}
                      {staFilter === s && <span className="ml-auto text-[10px] opacity-70">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Severity */}
              <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-2">Tingkat Keparahan</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {SEV_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => onChangeSev(o.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      sevFilter === o.value
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-white/5 border-white/10 text-gray-300"
                    }`}
                  >
                    {o.label}
                    {sevFilter === o.value && <span className="ml-auto text-[10px] opacity-70">✓</span>}
                  </button>
                ))}
              </div>

              <button
                onClick={() => { onChangeSta("all"); onChangeSev("all"); setOpen(false); }}
                className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Reset Filter
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function DashboardHistoryPage() {
  const [entries, setEntries]       = useState<HistoryEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [errors, setErrors]         = useState<string[]>([]);
  const [search, setSearch]         = useState("");
  const [srcFilter, setSrcFilter]   = useState<Source | "all">("all");
  const [staFilter, setStaFilter]   = useState<"all" | "pending" | "active" | "resolved">("all");
  const [sevFilter, setSevFilter]   = useState<SevFilter>("all");
  const [selected, setSelected]     = useState<HistoryEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const errs: string[] = [];

    // ── 1. Local reports.json ──────────────────────────────────────
    let localEntries: HistoryEntry[] = [];
    try {
      const res = await fetch("/api/report");
      const data = await res.json();
      if (data.ok) {
        localEntries = (data.reports as unknown[]).map((r) => ({
          ...(r as HistoryEntry),
          source: "local" as Source,
        }));
      }
    } catch {
      errs.push("Gagal memuat data lokal.");
    }

    // ── 2. Google Sheets ───────────────────────────────────────────
    let sheetEntries: HistoryEntry[] = [];
    try {
      const rows: SheetRow[] = await fetchFromSheet();
      // fetchFromSheet already normalises IoT rows via normaliseSheetRow
      sheetEntries = rows.map((r) => ({
        ...(r as unknown as HistoryEntry),
        source: "sheets" as Source,
      }));
    } catch {
      errs.push("Gagal memuat data Google Sheets.");
    }

    setErrors(errs);
    // Firebase is subscribed separately (real-time), merge what we have now
    setEntries((prev) => {
      const fbEntries = prev.filter((e) => e.source === "firebase");
      return mergeEntries(localEntries, fbEntries, sheetEntries);
    });
    setLoading(false);
  }, []);

  // ── Firebase real-time subscription (sign in first) ──────────────
  useEffect(() => {
    const email    = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMAIL    ?? "";
    const password = process.env.NEXT_PUBLIC_FIREBASE_AUTH_PASSWORD ?? "";

    let dbRef: ReturnType<typeof ref> | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let unsub: any = null;

    const subscribe = () => {
      dbRef = ref(rtdb, "/");
      unsub = onValue(dbRef, (snapshot) => {
        const val = snapshot.val();
        if (!val) return;

        const fbEntries: HistoryEntry[] = [];

        // IoT device snapshot at root: { "road-lamp": {...}, "traffic-light": {...}, zoss: {...} }
        const isIoTSnapshot = val["road-lamp"] || val["traffic-light"] || val["zoss"];
        if (isIoTSnapshot) {
          fbEntries.push(normaliseFirebaseSnapshot(val as FirebaseSnapshot, Date.now().toString()));
        }

        // Legacy: flat map of report objects under /reports
        if (val.reports && typeof val.reports === "object") {
          Object.entries(val.reports as Record<string, unknown>).forEach(([key, v]) => {
            const r = v as HistoryEntry;
            fbEntries.push({ ...r, id: r.id ?? key, source: "firebase" });
          });
        }

        // Fallback: root is a flat map of report objects
        if (!isIoTSnapshot && !val.reports) {
          Object.entries(val as Record<string, unknown>).forEach(([key, v]) => {
            const r = v as HistoryEntry;
            if (r && typeof r === "object") {
              fbEntries.push({ ...r, id: r.id ?? key, source: "firebase" });
            }
          });
        }

        setEntries((prev) => {
          const others = prev.filter((e) => e.source !== "firebase");
          const local  = others.filter((e) => e.source === "local");
          const sheets = others.filter((e) => e.source === "sheets");
          return mergeEntries(local, fbEntries, sheets);
        });
      }, () => {
        setErrors((e) => [...e, "Gagal memuat data Firebase."]);
      });
    };

    if (email && password) {
      signIn(email, password)
        .then(subscribe)
        .catch(() => {
          setErrors((e) => [...e, "Gagal autentikasi Firebase."]);
        });
    } else {
      subscribe();
    }

    return () => {
      if (dbRef && unsub) off(dbRef, "value", unsub);
    };
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtered list ──────────────────────────────────────────────
  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      e.type.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      (e.name ?? "").toLowerCase().includes(q);
    const matchSrc = srcFilter === "all" || e.source === srcFilter;
    const matchSta = staFilter === "all" || e.status === staFilter;
    const matchSev = sevFilter === "all" || e.severity === sevFilter;
    return matchSearch && matchSrc && matchSta && matchSev;
  });

  const counts = {
    local:    entries.filter((e) => e.source === "local").length,
    firebase: entries.filter((e) => e.source === "firebase").length,
    sheets:   entries.filter((e) => e.source === "sheets").length,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Sticky header ── */}
      <div className="border-b border-white/10 bg-gray-950/80 backdrop-blur-sm sticky top-16 z-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-medium mb-0.5">
              <Clock size={13} /> Riwayat Data
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold">Log Aktivitas Sistem</h1>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Error banners ── */}
        {errors.map((err, i) => (
          <div key={i} className="flex items-center gap-2 bg-red-950/40 border border-red-800/40 rounded-xl px-4 py-2.5 text-xs text-red-400">
            <AlertTriangle size={13} /> {err}
          </div>
        ))}

        {/* ── Source summary cards ── */}
        <div className="grid grid-cols-3 gap-3">
          {(["local", "firebase", "sheets"] as Source[]).map((src) => {
            const cfg = SRC_CFG[src];
            const Icon = cfg.icon;
            const active = srcFilter === src;
            return (
              <button
                key={src}
                onClick={() => setSrcFilter(active ? "all" : src)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-colors ${
                  active ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 hover:bg-white/8"
                }`}
              >
                <Icon size={16} className={active ? "text-white" : "text-gray-400"} />
                <span className="text-xl font-extrabold text-white">{counts[src]}</span>
                <span className="text-[10px] text-gray-500">{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Search & filters ── */}
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID, jenis, lokasi, atau pelapor..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Desktop: status segmented + severity dropdown */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <div className="grid grid-cols-4 gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              {(["all", "pending", "active", "resolved"] as const).map((s) => {
                const icons = { all: FileText, pending: Clock, active: AlertTriangle, resolved: CheckCircle2 };
                const Icon = icons[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStaFilter(s)}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors ${
                      staFilter === s ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Icon size={11} />
                    {s === "all" ? "Semua" : STA_LABEL[s]}
                  </button>
                );
              })}
            </div>
            <SevDropdown value={sevFilter} onChange={setSevFilter} />
          </div>

          {/* Mobile: single filter button */}
          <MobileFilterButton
            staFilter={staFilter}
            sevFilter={sevFilter}
            onChangeSta={setStaFilter}
            onChangeSev={setSevFilter}
          />
        </div>

        {/* ── Table ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500 text-sm gap-2">
              <RefreshCw size={14} className="animate-spin" /> Memuat data dari semua sumber…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
              <Clock size={28} className="opacity-30" />
              <p className="text-sm">Tidak ada riwayat ditemukan</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/8 text-gray-500 text-[11px] uppercase tracking-wide">
                      <th className="text-left px-5 py-3 font-medium">Waktu</th>
                      <th className="text-left px-5 py-3 font-medium">Jenis</th>
                      <th className="text-left px-5 py-3 font-medium">Lokasi</th>
                      <th className="text-left px-5 py-3 font-medium">Tingkat</th>
                      <th className="text-left px-5 py-3 font-medium">Status</th>
                      <th className="text-left px-5 py-3 font-medium">Sumber</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((e, i) => (
                      <motion.tr
                        key={`${e.source}-${e.id}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => setSelected(e)}
                      >
                        <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{formatDate(e.timestamp)}</td>
                        <td className="px-5 py-3 font-medium text-white">{e.type}</td>
                        <td className="px-5 py-3 text-gray-400 max-w-[160px] truncate">{e.location}</td>
                        <td className="px-5 py-3"><SevBadge s={e.severity} /></td>
                        <td className="px-5 py-3"><StaBadge s={e.status} /></td>
                        <td className="px-5 py-3"><SrcBadge s={e.source} /></td>
                        <td className="px-5 py-3">
                          <button className="text-gray-600 hover:text-blue-400 transition-colors"><Eye size={13} /></button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="sm:hidden divide-y divide-white/5">
                {filtered.map((e) => (
                  <div
                    key={`${e.source}-${e.id}`}
                    className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setSelected(e)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-xs font-semibold text-white truncate">{e.type}</p>
                        <SevBadge s={e.severity} />
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">{e.location}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-gray-600">{formatDate(e.timestamp)}</p>
                        <SrcBadge s={e.source} />
                      </div>
                    </div>
                    <StaBadge s={e.status} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-[11px] text-gray-600 text-center">
            Menampilkan {filtered.length} dari {entries.length} entri
          </p>
        )}
      </div>

      {/* ── Detail modal ── */}
      <AnimatePresence>
        {selected && <DetailModal entry={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
