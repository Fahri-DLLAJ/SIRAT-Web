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
  report:   { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-400/10" },
  offline:  { icon: WifiOff,       color: "text-red-400",    bg: "bg-red-400/10"    },
  outage:   { icon: Zap,           color: "text-yellow-400", bg: "bg-yellow-400/10" },
  resolved: { icon: CheckCircle2,  color: "text-green-400",  bg: "bg-green-400/10"  },
  camera:   { icon: Camera,        color: "text-blue-400",   bg: "bg-blue-400/10"   },
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
      <div className="flex items-center justify-center flex-1 text-gray-600 text-xs py-6">
        Belum ada aktivitas
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const cfg = ICON_MAP[item.type];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl px-3 py-2.5 transition-colors"
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${cfg.bg}`}>
                <Icon size={13} className={cfg.color} />
              </div>
              <p className="flex-1 text-xs text-gray-200 leading-snug">{item.message}</p>
              <span className="text-[10px] text-gray-500 flex-shrink-0 whitespace-nowrap">{item.time}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
