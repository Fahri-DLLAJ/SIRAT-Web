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
    { icon: AlertTriangle, label: "Laporan Hari Ini",    value: todayCount,    sub: "insiden tercatat",    color: "text-orange-400", bg: "bg-gradient-to-br from-orange-500/10 to-orange-500/5", border: "border-orange-500/20" },
    { icon: FileText,      label: "Belum Diverifikasi",  value: unverified,    sub: "menunggu tindakan",   color: "text-amber-400", bg: "bg-gradient-to-br from-amber-500/10 to-amber-500/5", border: "border-amber-500/20" },
    { icon: Cpu,           label: "Perangkat Online",    value: activeCount,   sub: "kamera & sensor aktif",color: "text-emerald-400",  bg: "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5",  border: "border-emerald-500/20"  },
    { icon: WifiOff,       label: "Perangkat Offline",   value: offlineCount,  sub: "perlu perhatian",     color: "text-rose-400",    bg: "bg-gradient-to-br from-rose-500/10 to-rose-500/5",    border: "border-rose-500/20"    },
    { icon: CheckCircle2,  label: "Diselesaikan",        value: resolvedCount, sub: "total tertangani",    color: "text-sky-400",   bg: "bg-gradient-to-br from-sky-500/10 to-sky-500/5",   border: "border-sky-500/20"   },
    { icon: Activity,      label: "Kesehatan Sistem",
      value: `${Math.round((activeCount / Math.max(devices.length, 1)) * 100)}%`,
      sub: "uptime perangkat", color: "text-cyan-400", bg: "bg-gradient-to-br from-cyan-500/10 to-cyan-500/5", border: "border-cyan-500/20" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Sticky header ── */}
      <div className="border-b border-white/5 bg-slate-950/90 backdrop-blur-xl sticky top-14 z-20 shadow-sm shadow-black/5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-1">
              <Shield size={14} strokeWidth={2} /> Admin Dashboard
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">Pusat Kendali S-Rotem</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <RefreshCw size={12} className="animate-spin" style={{ animationDuration: "4s" }} />
            </div>
            {user && (
              <span className="hidden sm:inline text-xs text-slate-400 truncate max-w-[140px]">{user.email}</span>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 border border-white/10 px-3 py-1.5 rounded-lg transition-all duration-200"
            >
              <LogOut size={13} strokeWidth={2} /> <span className="hidden sm:inline">Keluar</span>
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
              className={`group relative border rounded-2xl p-4 flex flex-col gap-2.5 ${w.bg} ${w.border} hover:border-white/20 hover:shadow-lg hover:shadow-black/10 transition-all duration-300 overflow-hidden`}
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-transparent transition-all duration-500 rounded-2xl" />
              
              <div className={`relative p-2.5 rounded-xl bg-gradient-to-br from-white/10 to-white/5 w-fit ${w.color} group-hover:scale-110 transition-transform duration-300`}>
                <w.icon size={18} strokeWidth={2} />
              </div>
              <p className={`relative text-2xl font-bold ${w.color} tracking-tight`}>{w.value}</p>
              <div className="relative">
                <p className="text-xs font-semibold text-white leading-tight">{w.label}</p>
                <p className="text-[10px] text-slate-500 mt-1">{w.sub}</p>
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
            className="xl:col-span-2 bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden flex flex-col xl:self-stretch shadow-lg shadow-black/5"
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 flex-shrink-0 bg-white/[0.02]">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Map size={15} className="text-emerald-400" strokeWidth={2} />
                Peta Semua Titik
              </div>
              <Link href="/map" className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                Buka Penuh <ChevronRight size={13} />
              </Link>
            </div>
            <div className="h-72 sm:h-96 xl:flex-1 xl:min-h-0">
              <DashboardMap reports={reports} devices={devices} />
            </div>
            {/* Map legend strip */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 border-t border-white/5 text-[10px] text-slate-400 bg-white/[0.02]">
              {[["🚦","Traffic Light"],["💡","Lampu"],["🏫","ZoSS"],["📷","Kamera"],["🚨","Kecelakaan"],["⚠️","Laporan"]].map(([e,l]) => (
                <span key={l} className="flex items-center gap-1.5">{e} {l}</span>
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
              className="flex-1 min-h-0 bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 overflow-hidden shadow-lg shadow-black/5"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Activity size={15} className="text-emerald-400" strokeWidth={2} />
                Aktivitas Real-Time
              </div>
              <ActivityFeed />
            </motion.div>

            {/* Top Events This Week */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg shadow-black/5"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp size={15} className="text-purple-400" strokeWidth={2} />
                Top Kejadian Minggu Ini
              </div>
              <div className="space-y-3">
                {TOP_EVENTS.map((e) => (
                  <div key={e.type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-medium ${e.color}`}>{e.type}</span>
                      <span className="text-xs font-bold text-white">{e.count}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
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
              className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg shadow-black/5"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Cpu size={15} className="text-cyan-400" strokeWidth={2} />
                Status Subsistem
              </div>
              <div className="space-y-2.5">
                {systemStatus.map((s) => {
                  const pct = s.total === 0 ? 0 : Math.round((s.online / s.total) * 100);
                  const bar = pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";
                  const dot = pct === 100 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-rose-500";
                  return (
                    <div key={s.type} className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot} shadow-sm`} />
                      <span className="text-xs text-slate-300 flex-1 truncate">{s.label}</span>
                      <div className="w-16 h-2 bg-white/5 rounded-full overflow-hidden flex-shrink-0">
                        <motion.div
                          className={`h-full rounded-full ${bar}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, ease: "easeOut", delay: 0.55 }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 w-8 text-right flex-shrink-0">{pct}%</span>
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
                className="flex items-center gap-3 bg-gradient-to-br from-white/[0.07] to-white/[0.02] hover:from-white/[0.10] hover:to-white/[0.04] border border-white/10 hover:border-white/20 rounded-2xl px-4 py-3.5 transition-all duration-200 group shadow-sm hover:shadow-lg hover:shadow-black/10"
              >
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <l.icon size={16} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{l.label}</p>
                  <p className="text-[10px] text-slate-500 truncate">{l.sub}</p>
                </div>
                <ChevronRight size={15} className="text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 ml-auto flex-shrink-0 transition-all duration-200" strokeWidth={2} />
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
          className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-lg shadow-black/5"
        >
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText size={15} className="text-orange-400" strokeWidth={2} />
              Laporan Terbaru
            </div>
            <Link href="/dashboard/reports" className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Lihat Semua <ChevronRight size={13} />
            </Link>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-[11px] uppercase tracking-wide bg-white/[0.02]">
                  <th className="text-left px-5 py-3 font-medium">ID</th>
                  <th className="text-left px-5 py-3 font-medium">Jenis</th>
                  <th className="text-left px-5 py-3 font-medium">Lokasi</th>
                  <th className="text-left px-5 py-3 font-medium">Tingkat</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.slice(0, 6).map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="px-5 py-4 font-mono text-slate-500 text-[10px]">{r.id.slice(0, 10)}…</td>
                    <td className="px-5 py-4 font-medium text-white">{r.type}</td>
                    <td className="px-5 py-4 text-slate-400 max-w-[180px] truncate">{r.location}</td>
                    <td className="px-5 py-4"><SevBadge sev={r.severity} /></td>
                    <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-4 text-slate-500">{new Date(r.timestamp).toLocaleDateString("id-ID", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-white/5">
            {reports.slice(0, 5).map((r) => (
              <div key={r.id} className="px-4 py-3.5 flex items-start gap-3 hover:bg-white/[0.04] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-semibold text-white truncate">{r.type}</p>
                    <SevBadge sev={r.severity} />
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{r.location}</p>
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
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  high:     "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium:   "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};
const SEV_LABEL = { critical: "Kritis", high: "Tinggi", medium: "Sedang", low: "Rendah" };

function SevBadge({ sev }: { sev: keyof typeof SEV_MAP }) {
  return (
    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${SEV_MAP[sev]}`}>
      {SEV_LABEL[sev]}
    </span>
  );
}

const STATUS_MAP = {
  active:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pending:  "bg-amber-500/15 text-amber-400 border-amber-500/30",
  resolved: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};
const STATUS_LABEL = { active: "Aktif", pending: "Menunggu", resolved: "Selesai" };

function StatusBadge({ status }: { status: keyof typeof STATUS_MAP }) {
  return (
    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_MAP[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
