"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity, Wifi, WifiOff, AlertTriangle, CheckCircle2,
  Clock, Camera, Lightbulb, TrafficCone, Radio,
  RefreshCw, ExternalLink, Circle,
} from "lucide-react";
import { useDevices } from "@/hooks/useDevices";
import { useReports } from "@/hooks/useReports";
import { Device } from "@/store/appStore";

// ── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)   return `${s} detik lalu`;
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
}

const STATUS_CFG = {
  active:  { dot: "bg-green-400",  text: "text-green-400",  badge: "bg-green-400/10 border-green-400/30",  label: "Online"    },
  offline: { dot: "bg-gray-500",   text: "text-gray-400",   badge: "bg-gray-500/10 border-gray-500/30",    label: "Offline"   },
  pending: { dot: "bg-yellow-400", text: "text-yellow-400", badge: "bg-yellow-400/10 border-yellow-400/30", label: "Menunggu"  },
} satisfies Record<Device["status"], { dot: string; text: string; badge: string; label: string }>;

const SYSTEM_CFG = {
  online:  { color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/20",  label: "Semua Online"  },
  warning: { color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", label: "Sebagian Offline" },
  offline: { color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/20",    label: "Semua Offline" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

// ── Sub-components ─────────────────────────────────────────────────────────
function SectionHeader({ icon, title, count, total, sysStatus }: {
  icon: React.ReactNode;
  title: string;
  count: number;
  total: number;
  sysStatus: "online" | "warning" | "offline";
}) {
  const cfg = SYSTEM_CFG[sysStatus];
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
        <div className="p-2 rounded-xl bg-white/8 text-emerald-400 flex-shrink-0">{icon}</div>
        <div className="min-w-0">
          <h2 className="font-bold text-sm text-white truncate">{title}</h2>
          <p className="text-[11px] text-gray-500">{count}/{total} aktif</p>
        </div>
      </div>
      {/* Mobile: dot only — Desktop: full pill */}
      <span className={`sm:hidden w-3 h-3 rounded-full flex-shrink-0 ${
        sysStatus === "online" ? "bg-green-400" : sysStatus === "warning" ? "bg-yellow-400" : "bg-red-500"
      }`} />
      <span className={`hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
        {cfg.label}
      </span>
    </div>
  );
}

function DeviceRow({ device: d, extra }: { device: Device; extra?: React.ReactNode }) {
  const cfg = STATUS_CFG[d.status];
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${d.status === "active" ? "animate-pulse" : ""}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{d.name}</p>
        <p className="text-[10px] text-gray-500">{timeAgo(d.lastSeen)}</p>
      </div>
      {extra}
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${cfg.badge} ${cfg.text}`}>
        {cfg.label}
      </span>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

// ── Traffic light specific ─────────────────────────────────────────────────
function TrafficLightIndicator({ status }: { status: Device["status"] }) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <span className={`w-3 h-3 rounded-full ${status === "active" ? "bg-green-400" : "bg-gray-700"}`} />
      <span className={`w-3 h-3 rounded-full ${status === "pending" ? "bg-yellow-400" : "bg-gray-700"}`} />
      <span className={`w-3 h-3 rounded-full ${status === "offline" ? "bg-red-500" : "bg-gray-700"}`} />
    </div>
  );
}

// ── ZoSS specific ──────────────────────────────────────────────────────────
function ZoSSBadges({ status }: { status: Device["status"] }) {
  const active = status === "active";
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${active ? "bg-green-500/20 text-green-400" : "bg-gray-700/50 text-gray-600"}`}>
        ZONA
      </span>
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${active ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-700/50 text-gray-600"}`}>
        SENSOR
      </span>
    </div>
  );
}

// ── Camera specific ────────────────────────────────────────────────────────
function CameraStatus({ device: d }: { device: Device }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_CFG[d.status].dot} ${d.status === "active" ? "animate-pulse" : ""}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{d.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {d.ip && <span className="text-[10px] text-gray-600 font-mono">{d.ip}</span>}
          <span className="text-[10px] text-gray-500">{timeAgo(d.lastSeen)}</span>
        </div>
      </div>
      {d.status === "active" && d.ip && (
        <a
          href={`http://${d.ip}/capture`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0"
        >
          <Camera size={11} /> Snapshot
        </a>
      )}
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_CFG[d.status].badge} ${STATUS_CFG[d.status].text}`}>
        {STATUS_CFG[d.status].label}
      </span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function StatusPage() {
  const { devices, systemStatus, byType } = useDevices();
  const { reports } = useReports();

  const trafficLights = byType("traffic-light");
  const lamps         = byType("lamp");
  const sensors       = byType("sensor");
  const cameras       = byType("camera");

  // Active issues = offline devices + active/pending reports
  const offlineDevices = devices.filter((d) => d.status !== "active");
  const activeReports  = reports.filter((r) => r.status !== "resolved");
  const hasIssues      = offlineDevices.length > 0 || activeReports.length > 0;

  // Summary counts
  const totalOnline  = devices.filter((d) => d.status === "active").length;
  const totalOffline = devices.filter((d) => d.status === "offline").length;
  const totalPending = devices.filter((d) => d.status === "pending").length;

  const getSysStatus = (type: Device["type"]) =>
    systemStatus.find((s) => s.type === type)?.status ?? "offline";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <title>Kondisi & Status Jaringan CCTV Real-Time — SIRAT</title>
      <meta name="description" content="Pantau status operasional kamera pemantau lalu lintas, sensor IoT, serta jaringan CCTV keselamatan jalan Kabupaten Klaten di platform SIRAT." />

      {/* ── Sticky header ── */}
      <div className="border-b border-white/10 bg-gray-950/80 backdrop-blur-sm sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-0.5">
              <Activity size={13} /> Kondisi Jalan
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold">Status Jalan Real-Time</h1>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">

        {/* ══════════════════════════════════════════════════════════════
            SUMMARY STRIP
        ══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: "Total Perangkat", value: devices.length,  icon: <Circle size={16} />,       color: "text-emerald-400"   },
            { label: "Online",          value: totalOnline,      icon: <Wifi size={16} />,          color: "text-green-400"  },
            { label: "Offline",         value: totalOffline,     icon: <WifiOff size={16} />,       color: "text-red-400"    },
            { label: "Laporan Aktif",   value: activeReports.length, icon: <AlertTriangle size={16} />, color: "text-yellow-400" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              custom={i}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3"
            >
              <span className={item.color}>{item.icon}</span>
              <div>
                <p className="text-xl font-bold text-white">{item.value}</p>
                <p className="text-[11px] text-gray-400">{item.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            ACTIVE ISSUES BANNER
        ══════════════════════════════════════════════════════════════ */}
        {hasIssues && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-red-950/40 border border-red-800/40 rounded-2xl p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm mb-3">
              <AlertTriangle size={16} className="animate-pulse" />
              {offlineDevices.length + activeReports.length} Masalah Aktif
            </div>
            <div className="space-y-2">
              {offlineDevices.map((d) => (
                <div key={d.id} className="flex items-start gap-2.5">
                  <WifiOff size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-300">
                    <span className="font-semibold">{d.name}</span>
                    {" "}tidak dapat dijangkau — terakhir aktif {timeAgo(d.lastSeen)}
                  </p>
                </div>
              ))}
              {activeReports.map((r) => (
                <div key={r.id} className="flex items-start gap-2.5">
                  <AlertTriangle size={13} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-300">
                    <span className="font-semibold">{r.type}</span>
                    {" "}di {r.location} — {r.status === "active" ? "sedang ditangani" : "menunggu respons"}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MAIN GRID — 2 cols desktop, 1 col mobile
        ══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── Traffic Lights ── */}
          <motion.div custom={0} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <Card>
              <SectionHeader
                icon={<TrafficCone size={16} />}
                title="Traffic Light"
                count={trafficLights.filter((d) => d.status === "active").length}
                total={trafficLights.length}
                sysStatus={getSysStatus("traffic-light")}
              />
              {trafficLights.length === 0 ? (
                <EmptyState text="Tidak ada data traffic light" />
              ) : (
                <div>
                  {trafficLights.map((d) => (
                    <DeviceRow
                      key={d.id}
                      device={d}
                      extra={<TrafficLightIndicator status={d.status} />}
                    />
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Normal",   value: trafficLights.filter((d) => d.status === "active").length,  color: "text-green-400"  },
                  { label: "Gangguan", value: trafficLights.filter((d) => d.status === "pending").length, color: "text-yellow-400" },
                  { label: "Offline",  value: trafficLights.filter((d) => d.status === "offline").length, color: "text-red-400"    },
                ].map((s) => (
                  <div key={s.label} className="bg-white/5 rounded-xl py-2">
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* ── Street Lamps ── */}
          <motion.div custom={1} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <Card>
              <SectionHeader
                icon={<Lightbulb size={16} />}
                title="Lampu Jalan"
                count={lamps.filter((d) => d.status === "active").length}
                total={lamps.length}
                sysStatus={getSysStatus("lamp")}
              />
              {lamps.length === 0 ? (
                <EmptyState text="Tidak ada data lampu jalan" />
              ) : (
                <div>
                  {lamps.map((d) => (
                    <DeviceRow
                      key={d.id}
                      device={d}
                      extra={
                        <span className={`text-lg flex-shrink-0 ${d.status !== "active" ? "grayscale opacity-40" : ""}`}>
                          💡
                        </span>
                      }
                    />
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Aktif",    value: lamps.filter((d) => d.status === "active").length,  color: "text-green-400"  },
                  { label: "Mati",     value: lamps.filter((d) => d.status === "offline").length, color: "text-red-400"    },
                  { label: "Gangguan", value: lamps.filter((d) => d.status === "pending").length, color: "text-yellow-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/5 rounded-xl py-2">
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* ── ZoSS ── */}
          <motion.div custom={2} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <Card>
              <SectionHeader
                icon={<Radio size={16} />}
                title="ZoSS (Zona Selamat Sekolah)"
                count={sensors.filter((d) => d.status === "active").length}
                total={sensors.length}
                sysStatus={getSysStatus("sensor")}
              />
              {sensors.length === 0 ? (
                <EmptyState text="Tidak ada data ZoSS" />
              ) : (
                <div>
                  {sensors.map((d) => (
                    <DeviceRow
                      key={d.id}
                      device={d}
                      extra={<ZoSSBadges status={d.status} />}
                    />
                  ))}
                </div>
              )}
              {/* ZoSS info strip */}
              <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                {[
                  { label: "Zona Aktif",    value: sensors.filter((d) => d.status === "active").length,  color: "bg-green-500/10 text-green-400 border-green-500/20"  },
                  { label: "Sensor Aktif",  value: sensors.filter((d) => d.status === "active").length,  color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"     },
                  { label: "Peringatan",    value: sensors.filter((d) => d.status === "pending").length, color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
                ].map((s) => (
                  <div key={s.label} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border ${s.color}`}>
                    <span className="text-base font-bold">{s.value}</span>
                    {s.label}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* ── Cameras ── */}
          <motion.div custom={3} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <Card>
              <SectionHeader
                icon={<Camera size={16} />}
                title="Kamera CCTV / ESP32-CAM"
                count={cameras.filter((d) => d.status === "active").length}
                total={cameras.length}
                sysStatus={getSysStatus("camera")}
              />
              {cameras.length === 0 ? (
                <EmptyState text="Tidak ada data kamera" />
              ) : (
                <div>
                  {cameras.map((d) => (
                    <CameraStatus key={d.id} device={d} />
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-green-400">
                    <CheckCircle2 size={12} /> {cameras.filter((d) => d.status === "active").length} Online
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <WifiOff size={12} /> {cameras.filter((d) => d.status === "offline").length} Offline
                  </span>
                </div>
                <Link
                  href="/map"
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Lihat di Peta <ExternalLink size={11} />
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SYSTEM HEALTH BAR — full width
        ══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <Activity size={15} className="text-emerald-400" />
                Kesehatan Sistem Keseluruhan
              </h2>
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <Clock size={11} /> Diperbarui baru saja
              </span>
            </div>

            <div className="space-y-3">
              {systemStatus.map((s) => {
                const pct = s.total === 0 ? 0 : Math.round((s.online / s.total) * 100);
                const barColor = pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
                const iconMap: Record<Device["type"], React.ReactNode> = {
                  "traffic-light": <TrafficCone size={13} />,
                  lamp:            <Lightbulb size={13} />,
                  sensor:          <Radio size={13} />,
                  camera:          <Camera size={13} />,
                };
                return (
                  <div key={s.type}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="text-gray-500">{iconMap[s.type]}</span>
                        {s.label}
                      </div>
                      <span className="text-xs font-semibold text-white">{s.online}/{s.total} <span className="text-gray-500 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${barColor}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall health score */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-gray-400">Skor Kesehatan Sistem</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 bg-white/8 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      totalOnline / Math.max(devices.length, 1) >= 0.8
                        ? "bg-green-500"
                        : totalOnline / Math.max(devices.length, 1) >= 0.5
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.round((totalOnline / Math.max(devices.length, 1)) * 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <span className="text-sm font-bold text-white">
                  {Math.round((totalOnline / Math.max(devices.length, 1)) * 100)}%
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            QUICK ACTIONS
        ══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <Link
            href="/report"
            className="flex items-center gap-3 bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 rounded-2xl px-5 py-4 transition-colors group"
          >
            <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm text-white">Laporkan Masalah</p>
              <p className="text-[11px] text-gray-400">Kirim laporan insiden baru</p>
            </div>
            <ExternalLink size={14} className="text-gray-600 group-hover:text-gray-400 ml-auto transition-colors" />
          </Link>
          <Link
            href="/map"
            className="flex items-center gap-3 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 rounded-2xl px-5 py-4 transition-colors group"
          >
            <Activity size={20} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm text-white">Lihat Peta Monitoring</p>
              <p className="text-[11px] text-gray-400">Tampilkan semua perangkat di peta</p>
            </div>
            <ExternalLink size={14} className="text-gray-600 group-hover:text-gray-400 ml-auto transition-colors" />
          </Link>
        </motion.div>

      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-gray-600">
      <WifiOff size={18} />
      <p className="text-xs">{text}</p>
    </div>
  );
}
