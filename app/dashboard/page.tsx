"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle, Cpu, WifiOff, CheckCircle2, Activity,
  FileText, Map, ChevronRight,
  TrendingUp, Clock, RefreshCw, Shield, LogOut, BookOpen,
} from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { useDevices } from "@/hooks/useDevices";
import { useAuth } from "@/hooks/useAuth";
import ActivityFeed from "@/components/dashboard/ActivityFeed";

const DashboardMap = dynamic(() => import("@/components/dashboard/DashboardMap"), { ssr: false });

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4 } }),
};

const TYPE_COLORS: Record<string, { color: string; bar: string }> = {
  "Kecelakaan":        { color: "text-red-400",    bar: "bg-red-500"    },
  "Jalan Rusak":       { color: "text-orange-400", bar: "bg-orange-500" },
  "Hambatan Jalan":    { color: "text-yellow-400", bar: "bg-yellow-400" },
  "Kondisi Berbahaya": { color: "text-purple-400", bar: "bg-purple-500" },
  "Pemadaman":         { color: "text-cyan-400",   bar: "bg-cyan-500"   },
};

// ── Quick nav links ────────────────────────────────────────────────
const QUICK_LINKS = [
  { href: "/dashboard/reports",   icon: FileText,  label: "Laporan",   sub: "Kelola semua laporan"   },
  { href: "/dashboard/devices",   icon: Cpu,       label: "Perangkat", sub: "Status & konfigurasi"   },
  { href: "/dashboard/analytics", icon: TrendingUp,label: "Analitik",  sub: "Grafik & statistik"     },
  { href: "/dashboard/history",   icon: Clock,     label: "Riwayat",   sub: "Log aktivitas sistem"   },
  { href: "/dashboard/education", icon: BookOpen,  label: "Edukasi",   sub: "Poster & kuis"          },
];

export default function DashboardPage() {
  const { reports, todayCount, resolvedCount } = useReports();
  const { devices, activeCount, systemStatus } = useDevices();
  const { user, logout } = useAuth();

  // Compute top incident types from real reports
  const typeCountMap: Record<string, number> = {};
  reports.forEach((r) => { typeCountMap[r.type] = (typeCountMap[r.type] ?? 0) + 1; });
  const TOP_EVENTS = Object.entries(typeCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({
      type, count,
      color: TYPE_COLORS[type]?.color ?? "text-gray-400",
      bar:   TYPE_COLORS[type]?.bar   ?? "bg-gray-500",
    }));
  const MAX_COUNT = TOP_EVENTS[0]?.count ?? 1;

  const unverified  = reports.filter((r) => r.status === "pending").length;
  const offlineCount = devices.filter((d) => d.status === "offline").length;

  const WIDGETS = [
    { icon: AlertTriangle, label: "Laporan Hari Ini",    value: todayCount,    sub: "insiden tercatat",    color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
    { icon: FileText,      label: "Belum Diverifikasi",  value: unverified,    sub: "menunggu tindakan",   color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
    { icon: Cpu,           label: "Perangkat Online",    value: activeCount,   sub: "kamera & sensor aktif",color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/20"  },
    { icon: WifiOff,       label: "Perangkat Offline",   value: offlineCount,  sub: "perlu perhatian",     color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/20"    },
    { icon: CheckCircle2,  label: "Diselesaikan",        value: resolvedCount, sub: "total tertangani",    color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/20"   },
    { icon: Activity,      label: "Kesehatan Sistem",
      value: `${Math.round((activeCount / Math.max(devices.length, 1)) * 100)}%`,
      sub: "uptime perangkat", color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Sticky header ── */}
      <div className="border-b border-white/10 bg-gray-950/80 backdrop-blur-sm sticky top-16 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-medium mb-0.5">
              <Shield size={13} /> Admin Dashboard
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold">Pusat Kendali S-Rotem</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <RefreshCw size={11} className="animate-spin" style={{ animationDuration: "4s" }} />
            </div>
            {user && (
              <span className="hidden sm:inline text-xs text-gray-500 truncate max-w-[140px]">{user.email}</span>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-red-600/20 hover:text-red-400 hover:border-red-500/30 border border-white/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut size={12} /> <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ══════════════════════════════════════════════════════════
            WIDGET GRID — 2 cols mobile / 3 cols md / 6 cols xl
        ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {WIDGETS.map((w, i) => (
            <motion.div
              key={w.label}
              custom={i}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className={`border rounded-2xl p-4 flex flex-col gap-2 ${w.bg} ${w.border}`}
            >
              <div className={`p-2 rounded-xl bg-white/10 w-fit ${w.color}`}>
                <w.icon size={16} />
              </div>
              <p className={`text-2xl font-extrabold ${w.color}`}>{w.value}</p>
              <div>
                <p className="text-xs font-semibold text-white leading-tight">{w.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{w.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            MAIN CONTENT — 3-col desktop layout
            Col 1 (span-2): Map
            Col 2 (span-1): Activity Feed + Top Events
        ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 xl:items-stretch">

          {/* ── Admin Map ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="xl:col-span-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col xl:self-stretch"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Map size={14} className="text-blue-400" />
                Peta Semua Titik
              </div>
              <Link href="/map" className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
                Buka Penuh <ChevronRight size={12} />
              </Link>
            </div>
            <div className="h-72 sm:h-96 xl:flex-1 xl:min-h-0">
              <DashboardMap reports={reports} devices={devices} />
            </div>
            {/* Map legend strip */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2.5 border-t border-white/10 text-[10px] text-gray-400">
              {[["🚦","Traffic Light"],["💡","Lampu"],["🏫","ZoSS"],["📷","Kamera"],["🚨","Kecelakaan"],["⚠️","Laporan"]].map(([e,l]) => (
                <span key={l} className="flex items-center gap-1">{e} {l}</span>
              ))}
            </div>
          </motion.div>

          {/* ── Right column ── */}
          <div className="flex flex-col gap-5">

            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex-1 min-h-0 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 overflow-hidden"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Activity size={14} className="text-green-400" />
                Aktivitas Real-Time
              </div>
              <ActivityFeed />
            </motion.div>

            {/* Top Events This Week */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp size={14} className="text-purple-400" />
                Top Kejadian Minggu Ini
              </div>
              <div className="space-y-2.5">
                {TOP_EVENTS.map((e) => (
                  <div key={e.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${e.color}`}>{e.type}</span>
                      <span className="text-xs font-bold text-white">{e.count}</span>
                    </div>
                    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${e.bar}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(e.count / MAX_COUNT) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* System health mini */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Cpu size={14} className="text-cyan-400" />
                Status Subsistem
              </div>
              <div className="space-y-2">
                {systemStatus.map((s) => {
                  const pct = s.total === 0 ? 0 : Math.round((s.online / s.total) * 100);
                  const bar = pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
                  const dot = pct === 100 ? "bg-green-400" : pct >= 50 ? "bg-yellow-400" : "bg-red-500";
                  return (
                    <div key={s.type} className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                      <span className="text-xs text-gray-300 flex-1 truncate">{s.label}</span>
                      <div className="w-16 h-1.5 bg-white/8 rounded-full overflow-hidden flex-shrink-0">
                        <motion.div
                          className={`h-full rounded-full ${bar}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, ease: "easeOut", delay: 0.55 }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 w-8 text-right flex-shrink-0">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            QUICK NAV
        ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {QUICK_LINKS.map((l, i) => (
            <motion.div
              key={l.href}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <Link
                href={l.href}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 transition-colors group"
              >
                <div className="p-2 rounded-xl bg-white/8 text-blue-400 flex-shrink-0">
                  <l.icon size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{l.label}</p>
                  <p className="text-[10px] text-gray-500 truncate">{l.sub}</p>
                </div>
                <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-300 ml-auto flex-shrink-0 transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            RECENT REPORTS TABLE
        ══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/10">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText size={14} className="text-orange-400" />
              Laporan Terbaru
            </div>
            <Link href="/dashboard/reports" className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
              Lihat Semua <ChevronRight size={12} />
            </Link>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8 text-gray-500 text-[11px] uppercase tracking-wide">
                  <th className="text-left px-5 py-2.5 font-medium">ID</th>
                  <th className="text-left px-5 py-2.5 font-medium">Jenis</th>
                  <th className="text-left px-5 py-2.5 font-medium">Lokasi</th>
                  <th className="text-left px-5 py-2.5 font-medium">Tingkat</th>
                  <th className="text-left px-5 py-2.5 font-medium">Status</th>
                  <th className="text-left px-5 py-2.5 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.slice(0, 6).map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 font-mono text-gray-500 text-[10px]">{r.id.slice(0, 10)}…</td>
                    <td className="px-5 py-3 font-medium text-white">{r.type}</td>
                    <td className="px-5 py-3 text-gray-400 max-w-[180px] truncate">{r.location}</td>
                    <td className="px-5 py-3"><SevBadge sev={r.severity} /></td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-3 text-gray-500">{new Date(r.timestamp).toLocaleDateString("id-ID", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-white/5">
            {reports.slice(0, 5).map((r) => (
              <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-semibold text-white truncate">{r.type}</p>
                    <SevBadge sev={r.severity} />
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{r.location}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// ── Tiny badge helpers ─────────────────────────────────────────────
const SEV_MAP = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high:     "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low:      "bg-green-500/15 text-green-400 border-green-500/30",
};
const SEV_LABEL = { critical: "Kritis", high: "Tinggi", medium: "Sedang", low: "Rendah" };

function SevBadge({ sev }: { sev: keyof typeof SEV_MAP }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SEV_MAP[sev]}`}>
      {SEV_LABEL[sev]}
    </span>
  );
}

const STATUS_MAP = {
  active:   "bg-green-500/15 text-green-400 border-green-500/30",
  pending:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  resolved: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};
const STATUS_LABEL = { active: "Aktif", pending: "Menunggu", resolved: "Selesai" };

function StatusBadge({ status }: { status: keyof typeof STATUS_MAP }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_MAP[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
