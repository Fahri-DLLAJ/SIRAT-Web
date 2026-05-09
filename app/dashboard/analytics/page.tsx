"use client";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, MapPin, Clock, AlertTriangle, Cpu,
  CheckCircle2, RefreshCw, ShieldAlert, Zap,
} from "lucide-react";
import { useDevices } from "@/hooks/useDevices";
import { Report } from "@/store/appStore";

// ── Palette ────────────────────────────────────────────────────────
const C = {
  blue:   "#3b82f6",
  cyan:   "#06b6d4",
  green:  "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red:    "#ef4444",
  purple: "#a855f7",
  gray:   "#6b7280",
};

const SEV_COLOR: Record<string, string> = {
  critical: C.red, high: C.orange, medium: C.yellow, low: C.green,
};

const TYPE_COLOR: Record<string, string> = {
  "Kecelakaan":        C.red,
  "Jalan Rusak":       C.orange,
  "Banjir":            C.cyan,
  "Kondisi Berbahaya": C.purple,
  "Pemadaman":         C.yellow,
  "Hambatan Jalan":    C.blue,
};

// ── Tooltip style ──────────────────────────────────────────────────
const TT_STYLE = {
  contentStyle: { background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 },
  labelStyle:   { color: "#94a3b8" },
  itemStyle:    { color: "#f1f5f9" },
};

// ── Helpers ────────────────────────────────────────────────────────
function fadeUp(i: number) {
  return { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.07, duration: 0.4 } };
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ icon: Icon, label, color = "text-blue-400" }: { icon: React.ElementType; label: string; color?: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm font-semibold mb-4 ${color}`}>
      <Icon size={14} />{label}
    </div>
  );
}

// ── Derived analytics ──────────────────────────────────────────────
function useAnalytics(reports: Report[]) {
  return useMemo(() => {
    // 1. Daily reports — last 14 days
    const dailyMap: Record<string, number> = {};
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dailyMap[d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })] = 0;
    }
    reports.forEach((r) => {
      const label = new Date(r.timestamp).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      if (label in dailyMap) dailyMap[label]++;
    });
    const daily = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

    // 2. Reports by region (first segment of location)
    const regionMap: Record<string, number> = {};
    reports.forEach((r) => {
      const region = r.location.split(",")[0].trim() || "Tidak Diketahui";
      regionMap[region] = (regionMap[region] ?? 0) + 1;
    });
    const byRegion = Object.entries(regionMap)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 3. Location ranking — vulnerable (most reports) & safest (fewest, resolved)
    const locMap: Record<string, { total: number; resolved: number; severity: number }> = {};
    reports.forEach((r) => {
      const loc = r.location.split(",").slice(0, 2).join(",").trim();
      if (!locMap[loc]) locMap[loc] = { total: 0, resolved: 0, severity: 0 };
      locMap[loc].total++;
      if (r.status === "resolved") locMap[loc].resolved++;
      const sevScore = { critical: 4, high: 3, medium: 2, low: 1 }[r.severity] ?? 1;
      locMap[loc].severity += sevScore;
    });
    const locList = Object.entries(locMap).map(([loc, v]) => ({ loc, ...v }));
    const vulnerable = [...locList].sort((a, b) => b.severity - a.severity).slice(0, 5);
    const safest     = [...locList]
      .filter((l) => l.total > 0)
      .sort((a, b) => (b.resolved / b.total) - (a.resolved / a.total))
      .slice(0, 5);

    // 4. Peak incident times (hour buckets)
    const hourMap: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourMap[h] = 0;
    reports.forEach((r) => { hourMap[new Date(r.timestamp).getHours()]++; });
    const byHour = Object.entries(hourMap).map(([h, count]) => ({
      hour: `${String(h).padStart(2, "0")}:00`,
      count,
    }));

    // 5. Incident types
    const typeMap: Record<string, number> = {};
    reports.forEach((r) => { typeMap[r.type] = (typeMap[r.type] ?? 0) + 1; });
    const byType = Object.entries(typeMap)
      .map(([type, value]) => ({ type, value }))
      .sort((a, b) => b.value - a.value);

    // 6. Response rate
    const resolved  = reports.filter((r) => r.status === "resolved").length;
    const total     = reports.length;
    const responseRate = total === 0 ? 0 : Math.round((resolved / total) * 100);

    // Avg response time (minutes) from statusHistory
    const times: number[] = [];
    reports.forEach((r) => {
      if (!r.statusHistory) return;
      const resolvedEntry = r.statusHistory.find((h) => h.status === "resolved");
      if (resolvedEntry) {
        const diff = (new Date(resolvedEntry.timestamp).getTime() - new Date(r.timestamp).getTime()) / 60000;
        if (diff > 0) times.push(diff);
      }
    });
    const avgResponseMin = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;

    return { daily, byRegion, vulnerable, safest, byHour, byType, responseRate, avgResponseMin, total, resolved };
  }, [reports]);
}

// ── Main Page ──────────────────────────────────────────────────────
export default function DashboardAnalyticsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { devices } = useDevices();

  useEffect(() => {
    fetch("/api/report")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setReports(d.reports); })
      .finally(() => setLoading(false));
  }, []);

  const a = useAnalytics(reports);

  // Devices with issues (offline)
  const deviceIssues = useMemo(() =>
    devices
      .filter((d) => d.status !== "active")
      .map((d) => ({ name: d.name, type: d.type, status: d.status, lastSeen: d.lastSeen }))
      .slice(0, 6),
  [devices]);

  const offlineCount = devices.filter((d) => d.status !== "active").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500 gap-2">
        <RefreshCw size={16} className="animate-spin" /> Memuat data analitik…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-gray-950/80 backdrop-blur-sm sticky top-16 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-medium mb-0.5">
              <TrendingUp size={13} /> Analitik
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold">Statistik & Evaluasi</h1>
          </div>

        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: AlertTriangle, label: "Total Laporan",    value: a.total,           color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
            { icon: CheckCircle2,  label: "Diselesaikan",     value: a.resolved,         color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/20"  },
            { icon: Zap,           label: "Tingkat Respons",  value: `${a.responseRate}%`, color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/20"   },
            { icon: Cpu,           label: "Perangkat Offline",value: offlineCount,       color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/20"    },
          ].map((w, i) => (
            <motion.div key={w.label} {...fadeUp(i)} className={`border rounded-2xl p-4 flex items-center gap-3 ${w.bg} ${w.border}`}>
              <div className={`p-2 rounded-xl bg-white/10 ${w.color}`}><w.icon size={16} /></div>
              <div>
                <p className={`text-2xl font-extrabold ${w.color}`}>{w.value}</p>
                <p className="text-[11px] text-gray-400">{w.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Row 1: Daily reports + Incident types ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Daily reports line chart */}
          <motion.div {...fadeUp(1)} className="lg:col-span-2">
            <Card>
              <CardTitle icon={TrendingUp} label="Laporan Harian (14 Hari Terakhir)" />
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={a.daily} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip {...TT_STYLE} />
                  <Line type="monotone" dataKey="count" stroke={C.blue} strokeWidth={2} dot={{ r: 3, fill: C.blue }} activeDot={{ r: 5 }} name="Laporan" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Incident types pie */}
          <motion.div {...fadeUp(2)}>
            <Card className="h-full">
              <CardTitle icon={AlertTriangle} label="Jenis Insiden" color="text-orange-400" />
              {a.byType.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-600 text-sm">Belum ada data</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={a.byType} dataKey="value" nameKey="type" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                        {a.byType.map((entry) => (
                          <Cell key={entry.type} fill={TYPE_COLOR[entry.type] ?? C.gray} />
                        ))}
                      </Pie>
                      <Tooltip {...TT_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {a.byType.map((t) => (
                      <div key={t.type} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: TYPE_COLOR[t.type] ?? C.gray }} />
                          <span className="text-gray-300 truncate max-w-[130px]">{t.type}</span>
                        </div>
                        <span className="font-bold text-white">{t.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        </div>

        {/* ── Row 2: By region + Peak hours ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* By region bar */}
          <motion.div {...fadeUp(3)}>
            <Card>
              <CardTitle icon={MapPin} label="Laporan per Wilayah" color="text-cyan-400" />
              {a.byRegion.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-600 text-sm">Belum ada data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={a.byRegion} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="region" tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} width={110} />
                    <Tooltip {...TT_STYLE} />
                    <Bar dataKey="count" fill={C.cyan} radius={[0, 4, 4, 0]} name="Laporan" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>

          {/* Peak hours bar */}
          <motion.div {...fadeUp(4)}>
            <Card>
              <CardTitle icon={Clock} label="Jam Puncak Insiden" color="text-yellow-400" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={a.byHour} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip {...TT_STYLE} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]} name="Insiden">
                    {a.byHour.map((entry) => {
                      const h = parseInt(entry.hour);
                      const hot = h >= 7 && h <= 9 || h >= 16 && h <= 19;
                      return <Cell key={entry.hour} fill={hot ? C.orange : C.blue} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Jam sibuk (07–09, 16–19)
              </p>
            </Card>
          </motion.div>
        </div>

        {/* ── Row 3: Location ranking + Response rate ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Vulnerable locations */}
          <motion.div {...fadeUp(5)}>
            <Card className="h-full">
              <CardTitle icon={ShieldAlert} label="Lokasi Paling Rawan" color="text-red-400" />
              {a.vulnerable.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-600 text-sm">Belum ada data</div>
              ) : (
                <div className="space-y-2.5">
                  {a.vulnerable.map((l, i) => (
                    <div key={l.loc} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 ${
                        i === 0 ? "bg-red-500/20 text-red-400" : "bg-white/8 text-gray-400"
                      }`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{l.loc}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-red-500"
                              style={{ width: `${Math.min((l.severity / (a.vulnerable[0]?.severity || 1)) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 flex-shrink-0">{l.total} laporan</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Safest locations */}
          <motion.div {...fadeUp(6)}>
            <Card className="h-full">
              <CardTitle icon={CheckCircle2} label="Lokasi Paling Aman" color="text-green-400" />
              {a.safest.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-600 text-sm">Belum ada data</div>
              ) : (
                <div className="space-y-2.5">
                  {a.safest.map((l, i) => {
                    const pct = Math.round((l.resolved / l.total) * 100);
                    return (
                      <div key={l.loc} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 ${
                          i === 0 ? "bg-green-500/20 text-green-400" : "bg-white/8 text-gray-400"
                        }`}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{l.loc}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-500 flex-shrink-0">{pct}% selesai</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Response rate */}
          <motion.div {...fadeUp(7)}>
            <Card className="h-full flex flex-col">
              <CardTitle icon={Zap} label="Tingkat Respons Cepat" color="text-blue-400" />

              {/* Big donut */}
              <div className="flex items-center justify-center flex-1">
                <div className="relative">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Selesai", value: a.resolved },
                          { name: "Belum",   value: Math.max(a.total - a.resolved, 0) },
                        ]}
                        cx="50%" cy="50%" innerRadius={52} outerRadius={72}
                        startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}
                      >
                        <Cell fill={C.green} />
                        <Cell fill="rgba(255,255,255,0.06)" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-white">{a.responseRate}%</span>
                    <span className="text-[10px] text-gray-500">diselesaikan</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-green-400">{a.resolved}</p>
                  <p className="text-[10px] text-gray-500">Selesai</p>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-yellow-400">{a.total - a.resolved}</p>
                  <p className="text-[10px] text-gray-500">Belum Selesai</p>
                </div>
              </div>

              {a.avgResponseMin !== null && (
                <p className="text-[11px] text-gray-500 text-center mt-2">
                  Rata-rata waktu respons: <span className="text-white font-semibold">{a.avgResponseMin} menit</span>
                </p>
              )}
            </Card>
          </motion.div>
        </div>

        {/* ── Row 4: Devices with issues ── */}
        <motion.div {...fadeUp(8)}>
          <Card>
            <CardTitle icon={Cpu} label="Perangkat Bermasalah" color="text-red-400" />
            {deviceIssues.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-green-400 text-sm gap-2">
                <CheckCircle2 size={16} /> Semua perangkat online
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {deviceIssues.map((d) => {
                  const typeLabel: Record<string, string> = {
                    camera: "Kamera", lamp: "Lampu Jalan", "traffic-light": "Traffic Light", sensor: "ZoSS / Sensor",
                  };
                  const ago = (() => {
                    const s = Math.floor((Date.now() - new Date(d.lastSeen).getTime()) / 1000);
                    if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
                    if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
                    return `${Math.floor(s / 86400)} hari lalu`;
                  })();
                  return (
                    <div key={d.name} className="flex items-center gap-3 bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{d.name}</p>
                        <p className="text-[10px] text-gray-500">{typeLabel[d.type] ?? d.type} · {ago}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full flex-shrink-0 capitalize">
                        {d.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
