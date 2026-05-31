"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, WifiOff, Zap, CheckCircle2, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/appStore";

interface FeedItem {
  id: string;
  type: "report" | "offline" | "outage" | "resolved" | "camera";
  message: string;
  time: string;
}

const ICON_MAP = {
  report:   { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10", dot: "bg-orange-400" },
  offline:  { icon: WifiOff,       color: "text-rose-400",    bg: "bg-rose-500/10",    dot: "bg-rose-400"   },
  outage:   { icon: Zap,           color: "text-amber-400",   bg: "bg-amber-500/10",   dot: "bg-amber-400"  },
  resolved: { icon: CheckCircle2,  color: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-400"},
  camera:   { icon: Camera,        color: "text-sky-400",     bg: "bg-sky-500/10",     dot: "bg-sky-400"    },
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)   return `${s} dtk lalu`;
  if (s < 3600) return `${Math.floor(s / 60)} mnt lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
}

export default function ActivityFeed() {
  const { reports, devices } = useAppStore();
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const feed: FeedItem[] = [];

    // Build feed items from real reports (newest first)
    const sorted = [...reports].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    sorted.slice(0, 10).forEach((r) => {
      if (r.status === "resolved") {
        feed.push({
          id: `resolved-${r.id}`,
          type: "resolved",
          message: `Laporan ${r.type} di ${r.location.split(",")[0]} diselesaikan`,
          time: timeAgo(r.statusHistory?.find((h) => h.status === "resolved")?.timestamp ?? r.timestamp),
        });
      } else {
        feed.push({
          id: `report-${r.id}`,
          type: "report",
          message: `Laporan baru: ${r.type} — ${r.location.split(",")[0]}`,
          time: timeAgo(r.timestamp),
        });
      }
    });

    // Offline devices
    devices
      .filter((d) => d.status === "offline")
      .slice(0, 5)
      .forEach((d) => {
        const isOutage = d.type === "lamp";
        feed.push({
          id: `device-${d.id}`,
          type: isOutage ? "outage" : d.type === "camera" ? "camera" : "offline",
          message: isOutage
            ? `Pemadaman terdeteksi: ${d.name}`
            : `${d.name} tidak merespons`,
          time: timeAgo(d.lastSeen),
        });
      });

    // Active cameras
    devices
      .filter((d) => d.type === "camera" && d.status === "active")
      .slice(0, 3)
      .forEach((d) => {
        feed.push({
          id: `cam-${d.id}`,
          type: "camera",
          message: `${d.name} online`,
          time: timeAgo(d.lastSeen),
        });
      });

    // Sort by recency (items with "dtk" first, then "mnt", etc.)
    feed.sort((a, b) => {
      const rank = (t: string) => {
        if (t.includes("dtk")) return 0;
        if (t.includes("mnt")) return 1;
        if (t.includes("jam")) return 2;
        return 3;
      };
      return rank(a.time) - rank(b.time);
    });

    setItems(feed.slice(0, 15));
  }, [reports, devices]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-slate-500 text-xs py-8">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <AlertTriangle size={20} strokeWidth={1.5} className="text-slate-600" />
        </div>
        <p>Belum ada aktivitas</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const cfg = ICON_MAP[item.type];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="group flex items-start gap-3 bg-gradient-to-br from-white/[0.06] to-white/[0.02] hover:from-white/[0.09] hover:to-white/[0.04] border border-white/5 hover:border-white/10 rounded-xl px-3 py-3 transition-all duration-200"
            >
              {/* Status dot + Icon */}
              <div className="relative flex-shrink-0">
                <div className={`p-2 rounded-lg ${cfg.bg}`}>
                  <Icon size={14} className={cfg.color} strokeWidth={2} />
                </div>
                <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${cfg.dot} shadow-sm`} />
              </div>
              
              {/* Message */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[13px] text-slate-200 leading-relaxed">{item.message}</p>
                <span className="text-[11px] text-slate-500 mt-1 inline-block">{item.time}</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
