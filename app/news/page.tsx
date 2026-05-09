"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper, AlertTriangle, CloudRain, Construction,
  Car, ChevronRight, Clock, X, Bell, Archive,
  RefreshCw, MapPin, Filter,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────
type Category = "all" | "closure" | "weather" | "repair" | "traffic";
type Priority = "critical" | "high" | "medium" | "low";

interface NewsItem {
  id: string;
  category: Category;
  priority: Priority;
  title: string;
  desc: string;
  location: string;
  time: string;
  timestamp: number;
  isAlert?: boolean;
}

// ── Static data ───────────────────────────────────────────────────
const FEED: NewsItem[] = [
  {
    id: "n1",
    category: "closure",
    priority: "critical",
    title: "Penutupan Jl. Solo–Yogya KM 14",
    desc: "Jalan ditutup total akibat longsor. Kendaraan dialihkan melalui Jl. Prambanan–Piyungan.",
    location: "Prambanan, Klaten",
    time: "10 menit lalu",
    timestamp: Date.now() - 600_000,
    isAlert: true,
  },
  {
    id: "n2",
    category: "weather",
    priority: "high",
    title: "Kabut Tebal di Kawasan Bayat",
    desc: "Jarak pandang turun hingga 30 meter. Pengemudi diminta menyalakan lampu kabut dan mengurangi kecepatan.",
    location: "Bayat, Klaten",
    time: "25 menit lalu",
    timestamp: Date.now() - 1_500_000,
    isAlert: true,
  },
  {
    id: "n3",
    category: "weather",
    priority: "high",
    title: "Genangan Air Jl. Pemuda",
    desc: "Ketinggian air mencapai 25 cm akibat hujan deras. Kendaraan rendah diminta memutar.",
    location: "Klaten Tengah",
    time: "1 jam lalu",
    timestamp: Date.now() - 3_600_000,
  },
  {
    id: "n4",
    category: "repair",
    priority: "medium",
    title: "Perbaikan Aspal Jl. Merbabu",
    desc: "Pengerjaan berlangsung 07.00–17.00. Satu lajur ditutup, harap berhati-hati.",
    location: "Klaten Utara",
    time: "2 jam lalu",
    timestamp: Date.now() - 7_200_000,
  },
  {
    id: "n5",
    category: "traffic",
    priority: "medium",
    title: "Kemacetan Simpang Pedan",
    desc: "Antrian kendaraan mencapai 500 meter akibat perbaikan traffic light. Estimasi normal pukul 15.00.",
    location: "Pedan, Klaten",
    time: "3 jam lalu",
    timestamp: Date.now() - 10_800_000,
  },
  {
    id: "n6",
    category: "closure",
    priority: "medium",
    title: "Penutupan Sementara Jl. Ceper",
    desc: "Ditutup untuk kegiatan karnaval desa 08.00–12.00. Gunakan jalur alternatif Jl. Delanggu.",
    location: "Ceper, Klaten",
    time: "4 jam lalu",
    timestamp: Date.now() - 14_400_000,
  },
  {
    id: "n7",
    category: "repair",
    priority: "low",
    title: "Perbaikan Jl. Gatot Subroto Selesai",
    desc: "Pengerjaan aspal selesai lebih cepat dari jadwal. Lalu lintas kembali normal dua arah.",
    location: "Klaten Selatan",
    time: "1 hari lalu",
    timestamp: Date.now() - 86_400_000,
  },
  {
    id: "n8",
    category: "traffic",
    priority: "low",
    title: "Arus Mudik Tol Klaten Lancar",
    desc: "Volume kendaraan terpantau normal. Tidak ada hambatan berarti di ruas tol.",
    location: "Tol Klaten",
    time: "1 hari lalu",
    timestamp: Date.now() - 90_000_000,
  },
  // ── History (older) ──────────────────────────────────────────────
  {
    id: "h1",
    category: "repair",
    priority: "low",
    title: "Penggantian Marka Jalan Jl. Pemuda",
    desc: "Pengecatan ulang marka jalan selesai dilaksanakan.",
    location: "Klaten Tengah",
    time: "3 hari lalu",
    timestamp: Date.now() - 259_200_000,
  },
  {
    id: "h2",
    category: "weather",
    priority: "medium",
    title: "Banjir Jl. Raya Klaten–Solo Surut",
    desc: "Genangan air sudah surut sepenuhnya. Jalan kembali dapat dilalui normal.",
    location: "Klaten Utara",
    time: "4 hari lalu",
    timestamp: Date.now() - 345_600_000,
  },
  {
    id: "h3",
    category: "closure",
    priority: "low",
    title: "Penutupan Jl. Alun-Alun Selesai",
    desc: "Kegiatan upacara selesai. Jalan kembali dibuka untuk umum.",
    location: "Klaten Kota",
    time: "5 hari lalu",
    timestamp: Date.now() - 432_000_000,
  },
  {
    id: "h4",
    category: "traffic",
    priority: "low",
    title: "Rekayasa Lalu Lintas Pasar Klaten Berakhir",
    desc: "Rekayasa arus satu arah di sekitar pasar telah dicabut.",
    location: "Klaten Kota",
    time: "6 hari lalu",
    timestamp: Date.now() - 518_400_000,
  },
];

// ── Config maps ───────────────────────────────────────────────────
const CAT_CFG: Record<Category, { label: string; icon: React.ElementType; color: string; bg: string; border: string; dot: string }> = {
  all:     { label: "Semua",          icon: Newspaper,    color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   dot: "bg-blue-400"   },
  closure: { label: "Penutupan Jalan",icon: X,            color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    dot: "bg-red-400"    },
  weather: { label: "Cuaca Berbahaya",icon: CloudRain,    color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/30",   dot: "bg-cyan-400"   },
  repair:  { label: "Perbaikan Jalan",icon: Construction, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", dot: "bg-yellow-400" },
  traffic: { label: "Info Lalu Lintas",icon: Car,         color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30",  dot: "bg-green-400"  },
};

const PRI_CFG: Record<Priority, { label: string; badge: string }> = {
  critical: { label: "Kritis",  badge: "bg-red-500/15 text-red-400 border-red-500/30"         },
  high:     { label: "Tinggi",  badge: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  medium:   { label: "Sedang",  badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  low:      { label: "Rendah",  badge: "bg-green-500/15 text-green-400 border-green-500/30"    },
};

const HISTORY_CUTOFF = Date.now() - 2 * 86_400_000; // older than 2 days = history

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

// ── Main page ─────────────────────────────────────────────────────
export default function NewsPage() {
  const [activeFilter, setActiveFilter] = useState<Category>("all");
  const [filterOpen, setFilterOpen]     = useState(false);
  const [historyOpen, setHistoryOpen]   = useState(false);
  const [dismissed, setDismissed]       = useState<string[]>([]);

  const activeCfg = CAT_CFG[activeFilter];

  const alerts = FEED.filter((n) => n.isAlert && !dismissed.includes(n.id));

  const feed = useMemo(() => {
    const recent = FEED.filter((n) => n.timestamp > HISTORY_CUTOFF);
    return activeFilter === "all" ? recent : recent.filter((n) => n.category === activeFilter);
  }, [activeFilter]);

  const history = useMemo(() => {
    const old = FEED.filter((n) => n.timestamp <= HISTORY_CUTOFF);
    return activeFilter === "all" ? old : old.filter((n) => n.category === activeFilter);
  }, [activeFilter]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Sticky header ── */}
      <div className="border-b border-white/10 bg-gray-950/80 backdrop-blur-sm sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-yellow-400 text-xs font-medium mb-0.5">
              <Newspaper size={13} /> Berita & Info Lalu Lintas
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold">Update Terkini</h1>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">

        {/* ══════════════════════════════════════════════════════════════
            PRIORITY ALERTS BANNER
        ══════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-red-950/50 border border-red-700/50 rounded-2xl overflow-hidden"
            >
              {/* Banner header */}
              <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-red-700/30 bg-red-900/20">
                <Bell size={14} className="text-red-400 animate-pulse" />
                <span className="text-red-300 text-xs font-bold uppercase tracking-wide">
                  Peringatan
                </span>
              </div>

              {/* Alert rows */}
              <div className="divide-y divide-red-900/30">
                {alerts.map((alert) => {
                  const cat = CAT_CFG[alert.category];
                  const CatIcon = cat.icon;
                  return (
                    <div key={alert.id} className="flex items-start gap-3 px-4 sm:px-5 py-3.5">
                      {/* Icon */}
                      <div className={`p-1.5 rounded-lg ${cat.bg} flex-shrink-0 mt-0.5`}>
                        <CatIcon size={13} className={cat.color} />
                      </div>
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-white">{alert.title}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRI_CFG[alert.priority].badge}`}>
                            {PRI_CFG[alert.priority].label}
                          </span>
                        </div>
                        <p className="text-xs text-red-300/80 leading-relaxed">{alert.desc}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-red-400/60">
                          <span className="flex items-center gap-1"><MapPin size={9} />{alert.location}</span>
                          <span className="flex items-center gap-1"><Clock size={9} />{alert.time}</span>
                        </div>
                      </div>
                      {/* Dismiss */}
                      <button
                        onClick={() => setDismissed((d) => [...d, alert.id])}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                        title="Tutup peringatan"
                      >
                        <X size={13} className="text-red-400/60" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════════
            CATEGORY FILTER PILLS
            Mobile : collapsible toggle + 2-col grid
            Desktop: single scrollable row
        ══════════════════════════════════════════════════════════════ */}
        <div>
          {/* Mobile toggle button */}
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className={`sm:hidden w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-colors ${
              filterOpen
                ? "bg-white/8 border-white/15"
                : "bg-white/5 border-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Filter Kategori</span>
              {activeFilter !== "all" && (
                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  activeCfg.bg} ${activeCfg.border} ${activeCfg.color}`}>
                  <activeCfg.icon size={10} />
                  {activeCfg.label}
                </span>
              )}
            </div>
            <ChevronRight
              size={16}
              className={`text-gray-500 transition-transform duration-200 ${
                filterOpen ? "rotate-90" : ""
              }`}
            />
          </button>

          {/* Mobile collapsible grid */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="sm:hidden overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {(Object.keys(CAT_CFG) as Category[]).map((cat) => {
                    const cfg = CAT_CFG[cat];
                    const CatIcon = cfg.icon;
                    const active = activeFilter === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => { setActiveFilter(cat); setFilterOpen(false); }}
                        className={`flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl border transition-all ${
                          active
                            ? `${cfg.bg} ${cfg.border} ${cfg.color} font-semibold`
                            : "bg-white/5 border-white/10 text-gray-400"
                        }`}
                      >
                        <CatIcon size={13} className="flex-shrink-0" />
                        <span className="truncate">{cfg.label}</span>
                        {active && <span className="ml-auto text-[10px] opacity-60">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop scrollable row */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            <Filter size={13} className="text-gray-500 flex-shrink-0 mr-1" />
            {(Object.keys(CAT_CFG) as Category[]).map((cat) => {
              const cfg = CAT_CFG[cat];
              const CatIcon = cfg.icon;
              const active = activeFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                    active
                      ? `${cfg.bg} ${cfg.border} ${cfg.color} font-semibold`
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <CatIcon size={12} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            INFORMATION FEED
        ══════════════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-4">
            <Newspaper size={15} />
            Informasi Terkini
            <span className="text-xs text-gray-500 font-normal ml-1">{feed.length} item</span>
          </div>

          {feed.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-gray-600">
              <Newspaper size={28} />
              <p className="text-sm">Tidak ada informasi untuk kategori ini.</p>
            </div>
          ) : (
            /* Desktop: 3-col grid | Mobile: single col */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feed.map((item, i) => {
                const cat = CAT_CFG[item.category];
                const CatIcon = cat.icon;
                return (
                  <motion.article
                    key={item.id}
                    custom={i}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 transition-colors group cursor-pointer flex flex-col gap-3"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cat.bg} ${cat.border} ${cat.color}`}>
                        <CatIcon size={11} />
                        {cat.label}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${PRI_CFG[item.priority].badge}`}>
                        {PRI_CFG[item.priority].label}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1.5 group-hover:text-blue-400 transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-white/5">
                      <span className="flex items-center gap-1"><MapPin size={9} />{item.location}</span>
                      <span className="flex items-center gap-1"><Clock size={9} />{item.time}</span>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            INFORMATION HISTORY
        ══════════════════════════════════════════════════════════════ */}
        {history.length > 0 && (
          <div>
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              className="w-full flex items-center justify-between bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl px-5 py-4 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/8 text-gray-400">
                  <Archive size={15} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm text-white">Riwayat Informasi</p>
                  <p className="text-[11px] text-gray-500">{history.length} arsip informasi lalu lintas</p>
                </div>
              </div>
              <ChevronRight
                size={16}
                className={`text-gray-500 group-hover:text-gray-300 transition-all ${historyOpen ? "rotate-90" : ""}`}
              />
            </button>

            <AnimatePresence>
              {historyOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {history.map((item, i) => {
                      const cat = CAT_CFG[item.category];
                      const CatIcon = cat.icon;
                      return (
                        <motion.div
                          key={item.id}
                          custom={i}
                          initial="hidden"
                          animate="show"
                          variants={fadeUp}
                          className="bg-white/3 border border-white/8 rounded-2xl p-4 opacity-70 hover:opacity-100 transition-opacity"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cat.dot}`} />
                            <span className={`text-[10px] font-semibold ${cat.color}`}>{cat.label}</span>
                            <span className="ml-auto text-[10px] text-gray-600 flex items-center gap-1">
                              <Clock size={9} />{item.time}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-gray-300 mb-1 leading-snug">{item.title}</p>
                          <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
                          <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1">
                            <MapPin size={9} />{item.location}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}
