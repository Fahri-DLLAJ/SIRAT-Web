"use client";
import { useState } from "react";
import { Device, Report } from "@/store/appStore";
import { AlertTriangle, Cpu, WifiOff, Bell, ChevronRight, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  reports: Report[];
  devices: Device[];
  onSelectReport: (r: Report) => void;
  onSelectDevice: (d: Device) => void;
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)   return `${s}d`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}j`;
}

const SEV_DOT: Record<Report["severity"], string> = {
  critical: "bg-red-500",
  high:     "bg-orange-500",
  medium:   "bg-yellow-400",
  low:      "bg-green-500",
};

const SEV_LABEL: Record<Report["severity"], string> = {
  critical: "Kritis", high: "Tinggi", medium: "Sedang", low: "Rendah",
};

const DEVICE_ICON: Record<Device["type"], string> = {
  "traffic-light": "🚦", lamp: "💡", sensor: "🏫", camera: "📷",
};

type Tab = "reports" | "devices";

export default function MapSidePanel({ reports, devices, onSelectReport, onSelectDevice }: Props) {
  const [tab, setTab] = useState<Tab>("reports");

  const alerts        = reports.filter((r) => r.severity === "critical" || r.severity === "high");
  const activeReports = reports.filter((r) => r.status !== "resolved");
  const onlineDevices = devices.filter((d) => d.status === "active");
  const offlineDevices= devices.filter((d) => d.status !== "active");

  return (
    <div className="flex flex-col min-h-0">

      {/* ── Alerts banner ── */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-3 mt-3 bg-red-950/60 border border-red-800/50 rounded-xl p-3 flex-shrink-0"
          >
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold mb-2">
              <Bell size={12} className="animate-pulse" />
              {alerts.length} PERINGATAN AKTIF
            </div>
            <div className="space-y-1.5">
              {alerts.slice(0, 2).map((r) => (
                <button
                  key={r.id}
                  onClick={() => onSelectReport(r)}
                  className="w-full text-left flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SEV_DOT[r.severity]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{r.type}</p>
                    <p className="text-[10px] text-gray-400 truncate">{r.location}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 flex-shrink-0">{timeAgo(r.timestamp)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tabs ── */}
      <div className="flex mx-3 mt-3 bg-white/5 rounded-xl p-1 flex-shrink-0">
        <TabBtn active={tab === "reports"} onClick={() => setTab("reports")} icon={<AlertTriangle size={12} />} label="Laporan" count={activeReports.length} />
        <TabBtn active={tab === "devices"} onClick={() => setTab("devices")} icon={<Radio size={12} />}         label="Perangkat" count={onlineDevices.length} />
      </div>

      {/* ── Tab content ── */}
      <div
        className="px-3 pb-4 mt-3 space-y-1.5"
        style={{ touchAction: "pan-y" }}
      >
        {tab === "reports" && (
          <>
            {activeReports.length === 0 ? (
              <EmptyState icon={<AlertTriangle size={20} />} text="Tidak ada laporan aktif" />
            ) : (
              activeReports.map((r, i) => (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => onSelectReport(r)}
                  className="w-full text-left flex items-start gap-3 bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl px-3 py-2.5 transition-colors group"
                >
                  <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${SEV_DOT[r.severity]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-semibold text-white truncate">{r.type}</p>
                      <span className="text-[10px] text-gray-500 flex-shrink-0">{timeAgo(r.timestamp)}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">{r.location}</p>
                    <span className="inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white/10 text-gray-300">
                      {SEV_LABEL[r.severity]}
                    </span>
                  </div>
                  <ChevronRight size={12} className="text-gray-600 group-hover:text-gray-300 mt-1 flex-shrink-0 transition-colors" />
                </motion.button>
              ))
            )}
          </>
        )}

        {tab === "devices" && (
          <>
            {/* Online */}
            {onlineDevices.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1.5">
                  <Cpu size={10} /> Online ({onlineDevices.length})
                </p>
                <div className="space-y-1.5">
                  {onlineDevices.map((d, i) => (
                    <motion.button
                      key={d.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => onSelectDevice(d)}
                      className="w-full text-left flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl px-3 py-2.5 transition-colors group"
                    >
                      <span className="text-base flex-shrink-0">{DEVICE_ICON[d.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{d.name}</p>
                        <p className="text-[10px] text-gray-500">{timeAgo(d.lastSeen)} lalu</p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Offline */}
            {offlineDevices.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1.5">
                  <WifiOff size={10} /> Offline ({offlineDevices.length})
                </p>
                <div className="space-y-1.5">
                  {offlineDevices.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl px-3 py-2.5 opacity-60"
                    >
                      <span className="text-base flex-shrink-0 grayscale">{DEVICE_ICON[d.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 truncate">{d.name}</p>
                        <p className="text-[10px] text-gray-600">{timeAgo(d.lastSeen)} lalu</p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-gray-600 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {devices.length === 0 && (
              <EmptyState icon={<Cpu size={20} />} text="Tidak ada perangkat terdaftar" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label, count }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        active ? "bg-emerald-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
      }`}
    >
      {icon}{label}
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
        active ? "bg-white/20 text-white" : "bg-white/10 text-gray-500"
      }`}>{count}</span>
    </button>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-gray-600">
      {icon}
      <p className="text-xs">{text}</p>
    </div>
  );
}
