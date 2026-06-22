"use client";
import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Phone, MapPin, User, Hash, ChevronDown,
  Camera, Video, Loader2, CheckCircle2, Clock, ShieldAlert,
  RotateCcw, Navigation, FileText, Zap, X, ImageIcon,
} from "lucide-react";
import { useReport, IncidentType, ReportSeverity } from "@/hooks/useReport";

const LocationPicker = dynamic(() => import("@/components/forms/LocationPicker"), { ssr: false });

// ── Constants ──────────────────────────────────────────────────────────────
const INCIDENT_TYPES: { value: IncidentType; label: string; emoji: string }[] = [
  { value: "Kecelakaan",        label: "Kecelakaan",        emoji: "🚨" },
  { value: "Jalan Rusak",       label: "Jalan Rusak",       emoji: "⚠️" },
  { value: "Pemadaman",         label: "Pemadaman Lampu",   emoji: "💡" },
  { value: "Hambatan Jalan",    label: "Hambatan Jalan",    emoji: "🚧" },
  { value: "Kondisi Berbahaya", label: "Kondisi Berbahaya", emoji: "☢️" },
];

const SEVERITY_OPTIONS: { value: ReportSeverity; label: string; active: string; dot: string }[] = [
  { value: "low",      label: "Rendah", active: "border-green-500 text-green-400 bg-green-500/10",   dot: "bg-green-500"  },
  { value: "medium",   label: "Sedang", active: "border-yellow-500 text-yellow-400 bg-yellow-500/10", dot: "bg-yellow-400" },
  { value: "high",     label: "Tinggi", active: "border-orange-500 text-orange-400 bg-orange-500/10", dot: "bg-orange-500" },
  { value: "critical", label: "Kritis", active: "border-red-500 text-red-400 bg-red-500/10",          dot: "bg-red-500"    },
];

const TRACKING_STEPS = [
  { key: "received",  label: "Laporan Diterima",    icon: CheckCircle2, color: "text-blue-400"   },
  { key: "verifying", label: "Sedang Diverifikasi", icon: Clock,        color: "text-yellow-400" },
  { key: "handling",  label: "Sedang Ditangani",    icon: ShieldAlert,  color: "text-orange-400" },
  { key: "completed", label: "Selesai",             icon: CheckCircle2, color: "text-green-400"  },
] as const;

const TRACKING_ORDER = ["received", "verifying", "handling", "completed"];

// ── Tiny helpers ───────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-300 mb-1.5">{children}</p>;
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
    />
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ReportPage() {
  const {
    form, update, tracking, reportId, locLoading, locError,
    uploadProgress, getLocation, submit, submitEmergency, reset,
  } = useReport();

  const [emergencyMode, setEmergencyMode]     = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [mediaPreview, setMediaPreview]       = useState<string | null>(null);
  const [mediaType, setMediaType]             = useState<"image" | "video" | null>(null);
  const mediaRef = useRef<HTMLInputElement>(null);

  function handleMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) { clearMedia(); return; }

    const isVideo = file.type.startsWith("video/");
    setMediaType(isVideo ? "video" : "image");

    if (isVideo) {
      update("imageFile", null);
      update("videoFile", file);
      setMediaPreview(URL.createObjectURL(file));
    } else {
      update("videoFile", null);
      update("imageFile", file);
      setMediaPreview(URL.createObjectURL(file));
    }
  }

  function clearMedia() {
    update("imageFile", null);
    update("videoFile", null);
    setMediaPreview(null);
    setMediaType(null);
    if (mediaRef.current) mediaRef.current.value = "";
  }

  async function handleEmergency() {
    if (!navigator.geolocation) {
      alert("Perangkat Anda tidak mendukung GPS.");
      return;
    }
    setEmergencyLoading(true);
    try {
      // Reuse getLocation — it returns coords + updates form state
      const coords = await getLocation();
      if (!coords) {
        setEmergencyLoading(false);
        alert("Gagal mendapatkan lokasi. Pastikan izin GPS diaktifkan.");
        return;
      }
      await submitEmergency(coords.lat, coords.lng,
        form.locationLabel || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
    } catch {
      // submitEmergency already sets tracking("error"), just reset loading
    } finally {
      setEmergencyLoading(false);
      setEmergencyMode(false);
    }
  }

  // ── Tracking screen ────────────────────────────────────────────────────
  if (tracking !== "idle" && tracking !== "submitting" && tracking !== "error") {
    const currentIdx = TRACKING_ORDER.indexOf(tracking);
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Laporan Terkirim!</h1>
            <p className="text-gray-400 text-sm">
              ID:{" "}
              <span className="text-blue-400 font-mono font-semibold">
                {reportId ?? "—"}
              </span>
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Status Penanganan
            </p>
            <div className="space-y-4">
              {TRACKING_STEPS.map((step, i) => {
                const done   = i <= currentIdx;
                const active = i === currentIdx;
                const Icon   = step.icon;
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center pt-0.5">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        done ? "border-emerald-500 bg-emerald-500/20" : "border-white/10 bg-white/5"
                      }`}>
                        {active
                          ? <Loader2 size={14} className="text-emerald-400 animate-spin" />
                          : done
                            ? <Icon size={14} className={step.color} />
                            : <span className="w-2 h-2 rounded-full bg-white/20" />
                        }
                      </div>
                      {i < TRACKING_STEPS.length - 1 && (
                        <div className={`w-0.5 h-5 mt-1 ${done ? "bg-emerald-500/40" : "bg-white/10"}`} />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className={`text-sm font-medium ${done ? "text-white" : "text-gray-500"}`}>
                        {step.label}
                      </p>
                      {active && <p className="text-[11px] text-gray-500 mt-0.5">Sedang diproses…</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <RotateCcw size={16} /> Buat Laporan Baru
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <title>Laporkan Insiden & Gangguan Jalan — SIRAT</title>
      <meta name="description" content="Kirim laporan insiden lalu lintas, jalan rusak, lampu mati, atau kecelakaan secara real-time disertai koordinat GPS dan foto ke platform SIRAT." />
      {/* ── Page header ── */}
      <div className="border-b border-white/10 bg-gray-950/80 backdrop-blur-sm sticky top-16 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-400 text-xs font-medium mb-0.5">
              <AlertTriangle size={13} /> Laporan Insiden
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold">Laporkan Kejadian</h1>
          </div>
          {/* Emergency pill in header */}
          <button
            onClick={() => setEmergencyMode((o) => !o)}
            className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
          >
            <Zap size={13} />
            <span className="hidden sm:inline">Mode Darurat</span>
            <span className="sm:hidden">Darurat</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ── Emergency panel ── */}
        <AnimatePresence>
          {emergencyMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-red-950/50 border border-red-500/40 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} className="text-red-400" />
                    <p className="font-bold text-red-300">Laporan Darurat Cepat</p>
                  </div>
                  <button onClick={() => setEmergencyMode(false)} className="p-1 hover:bg-white/10 rounded-lg">
                    <X size={15} className="text-gray-400" />
                  </button>
                </div>
                <p className="text-red-400/80 text-xs mb-4 leading-relaxed max-w-lg">
                  Sistem akan otomatis mengirim lokasi GPS Anda saat ini, waktu kejadian, dan kategori darurat ke petugas terdekat tanpa perlu mengisi formulir.
                </p>
                {locError && (
                  <div className="flex items-start gap-2 bg-red-900/40 border border-red-500/30 rounded-xl px-3 py-2.5 mb-3">
                    <AlertTriangle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-300 leading-relaxed">{locError}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleEmergency}
                    disabled={emergencyLoading}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
                  >
                    {emergencyLoading
                      ? <><Loader2 size={15} className="animate-spin" /> Mengirim…</>
                      : <><Phone size={15} /> Kirim Darurat Sekarang</>
                    }
                  </button>
                  <button
                    onClick={() => setEmergencyMode(false)}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════════
            TWO-COLUMN LAYOUT
            Left  (col-span-1): identity + incident type + description
            Right (col-span-1): location map + evidence upload
            On mobile: single column, stacked
        ══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* Identity */}
            <Card icon={<User size={15} />} title="Identitas Pelapor">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Nama Pelapor</Label>
                  <FieldInput
                    placeholder="Nama lengkap (opsional)"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Nomor Telepon</Label>
                  <FieldInput
                    type="tel"
                    placeholder="08xx-xxxx-xxxx"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Incident type */}
            <Card icon={<Hash size={15} />} title="Jenis Insiden">
              <div className="mb-4">
                <Label>Kategori <span className="text-red-400">*</span></Label>
                <div className="relative">
                  <select
                    value={form.type}
                    onChange={(e) => update("type", e.target.value as IncidentType)}
                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors pr-10"
                  >
                    <option value="" disabled className="bg-gray-900">Pilih jenis insiden…</option>
                    {INCIDENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value} className="bg-gray-900">
                        {t.emoji} {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <Label>Tingkat Keparahan</Label>
                <div className="grid grid-cols-4 gap-2">
                  {SEVERITY_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => update("severity", s.value)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                        form.severity === s.value
                          ? s.active
                          : "border-white/10 text-gray-500 bg-white/5 hover:bg-white/8 hover:text-gray-300"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card icon={<FileText size={15} />} title="Detail Kejadian">
              <Label>Deskripsi <span className="text-red-400">*</span></Label>
              <textarea
                rows={5}
                placeholder="Ceritakan urutan kejadian secara singkat dan jelas…"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
              <p className="text-[11px] text-gray-600 mt-1 text-right">{form.description.length} karakter</p>
            </Card>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">

            {/* Location */}
            <Card icon={<MapPin size={15} />} title="Lokasi Kejadian">
              <button
                type="button"
                onClick={getLocation}
                disabled={locLoading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-sm font-medium py-2.5 rounded-xl transition-colors mb-3 disabled:opacity-60"
              >
                {locLoading
                  ? <><Loader2 size={14} className="animate-spin" /> Mendeteksi lokasi…</>
                  : <><Navigation size={14} /> Gunakan Lokasi GPS Saat Ini</>
                }
              </button>

              {/* Permission / error message */}
              {locError && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 mb-3">
                  <AlertTriangle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-300 leading-relaxed">{locError}</p>
                </div>
              )}

              {form.locationLabel && (
                <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5 mb-3">
                  <MapPin size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-300 leading-relaxed">{form.locationLabel}</p>
                </div>
              )}

              <Label>Atau klik titik pada peta <span className="text-red-400">*</span></Label>
              <LocationPicker
                lat={form.lat}
                lng={form.lng}
                onChange={(lat, lng) => {
                  update("lat", lat);
                  update("lng", lng);
                  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
                    .then((r) => r.json())
                    .then((d) => update("locationLabel", d.display_name?.split(",").slice(0, 3).join(", ") ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`))
                    .catch(() => update("locationLabel", `${lat.toFixed(5)}, ${lng.toFixed(5)}`));
                }}
              />
              {form.lat !== null && (
                <p className="text-[11px] text-gray-500 mt-1.5 text-center font-mono">
                  {form.lat.toFixed(6)}, {form.lng!.toFixed(6)}
                </p>
              )}
            </Card>

            {/* Evidence upload */}
            <Card icon={<Camera size={15} />} title="Unggah Bukti">

              {/* Single input — accepts both image and video */}
              <input
                ref={mediaRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleMediaChange}
              />

              {mediaPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 mb-3">
                  {mediaType === "video" ? (
                    <video
                      src={mediaPreview}
                      controls
                      className="w-full max-h-48 object-contain bg-black"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaPreview} alt="Preview" className="w-full h-40 object-cover" />
                  )}
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-900/80">
                    <div className="flex items-center gap-2 min-w-0">
                      {mediaType === "video"
                        ? <Video size={13} className="text-purple-400 flex-shrink-0" />
                        : <ImageIcon size={13} className="text-emerald-400 flex-shrink-0" />
                      }
                      <span className="text-[11px] text-white/80 truncate">
                        {(form.imageFile ?? form.videoFile)?.name}
                      </span>
                      <span className="text-[10px] text-gray-500 flex-shrink-0">
                        {formatBytes((form.imageFile ?? form.videoFile)?.size ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => mediaRef.current?.click()}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        Ganti
                      </button>
                      <button
                        type="button"
                        onClick={clearMedia}
                        className="p-1 hover:bg-red-600/30 rounded-lg transition-colors"
                      >
                        <X size={13} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => mediaRef.current?.click()}
                  className="w-full flex flex-col items-center gap-3 border-2 border-dashed border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 rounded-xl py-8 transition-colors group mb-3"
                >
                  <div className="flex items-center gap-3 text-gray-500 group-hover:text-gray-400 transition-colors">
                    <ImageIcon size={22} />
                    <span className="text-gray-400">+</span>
                    <Video size={22} />
                  </div>
                  <span className="text-sm text-gray-400 font-medium">Pilih foto atau video</span>
                  <span className="text-[11px] text-gray-600 text-center px-4">
                    Foto: JPG, PNG, WEBP (maks 10 MB) · Video: MP4, MOV (maks 100 MB)
                  </span>
                </button>
              )}

              {/* Live camera note */}
              <div className="flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                <Camera size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Kamera live ESP32-CAM tersedia di{" "}
                  <a href="/map" className="text-emerald-400 underline">Peta Monitoring</a>.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SUBMIT — full width below both columns
        ══════════════════════════════════════════════════════════════ */}
        <div className="mt-5">
          {tracking === "error" && (
            <div className="mb-3 bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle size={15} />
              Gagal mengirim laporan. Periksa koneksi internet dan coba lagi.
            </div>
          )}

          {/* Upload progress bar */}
          {tracking === "submitting" && uploadProgress > 0 && (
            <div className="mb-3">
              <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                <span>Mengunggah…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Validation hint */}
          {(!form.type || form.lat === null) && tracking === "idle" && (
            <p className="text-[11px] text-yellow-500/80 mb-2 flex items-center gap-1.5">
              <AlertTriangle size={11} />
              {!form.type && form.lat === null
                ? "Pilih jenis insiden dan tentukan lokasi untuk melanjutkan."
                : !form.type
                ? "Pilih jenis insiden untuk melanjutkan."
                : "Tentukan lokasi kejadian untuk melanjutkan."}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={tracking === "submitting" || !form.type || form.lat === null}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors text-base shadow-lg shadow-emerald-900/30"
          >
            {tracking === "submitting"
              ? <><Loader2 size={18} className="animate-spin" /> Mengirim Laporan…</>
              : <><AlertTriangle size={18} /> Kirim Laporan</>
            }
          </button>

          <p className="text-center text-[11px] text-gray-600 mt-3">
            Dengan mengirim laporan, Anda menyetujui bahwa informasi yang diberikan adalah benar dan dapat dipertanggungjawabkan.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Card wrapper ───────────────────────────────────────────────────────────
function Card({
  icon, title, children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 text-gray-200 text-sm font-semibold mb-4">
        <span className="text-emerald-400">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}
