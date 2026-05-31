"use client";
import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { useReports } from "@/hooks/useReports";
import { useDevices } from "@/hooks/useDevices";
import { Device, Report } from "@/store/appStore";
import { FilterLayer } from "@/components/map/MainMap";
import MapSidePanel from "@/components/map/MapSidePanel";
import CameraWindow from "@/components/map/CameraWindow";
import {
  MapPin, Clock, Wifi, WifiOff, AlertTriangle,
  Camera, ChevronRight, X, PanelRightClose, PanelRightOpen,
  SlidersHorizontal, Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@/lib/utils";

const MainMap = dynamic(() => import("@/components/map/MainMap"), { ssr: false });

const AI_PORT = Number(process.env.NEXT_PUBLIC_AI_STREAM_PORT ?? 5000);

const FILTERS: { id: FilterLayer; label: string; emoji: string; activeColor: string }[] = [
  { id: "all",      label: "Semua",       emoji: "🗺️", activeColor: "bg-blue-600 text-white border-blue-500"    },
  { id: "reports",  label: "Laporan",     emoji: "⚠️", activeColor: "bg-orange-600 text-white border-orange-500" },
  { id: "devices",  label: "Perangkat",   emoji: "📡", activeColor: "bg-violet-600 text-white border-violet-500" },
  { id: "cameras",  label: "Kamera",      emoji: "📷", activeColor: "bg-sky-600 text-white border-sky-500"       },
  { id: "highRisk", label: "Zona Risiko", emoji: "🔴", activeColor: "bg-red-600 text-white border-red-500"       },
];

const SEV: Record<Report["severity"], { label: string; dot: string; badge: string }> = {
  critical: { label: "Kritis",  dot: "bg-red-500",    badge: "bg-red-500/15 text-red-400 border-red-500/30"         },
  high:     { label: "Tinggi",  dot: "bg-orange-500", badge: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  medium:   { label: "Sedang",  dot: "bg-yellow-400", badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  low:      { label: "Rendah",  dot: "bg-green-500",  badge: "bg-green-500/15 text-green-400 border-green-500/30"    },
};

const STATUS_LABEL: Record<Report["status"], string> = {
  active: "Sedang ditangani", pending: "Menunggu respons", resolved: "Selesai",
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)   return `${s} detik lalu`;
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  return `${Math.floor(s / 3600)} jam lalu`;
}

export default function MapPage() {
  const { reports } = useReports();
  const { devices } = useDevices();

  const [filters, setFilters]           = useState<FilterLayer[]>(["all"]);
  const [sideOpen, setSideOpen]         = useState(false);   // desktop: right panel; mobile: bottom sheet
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [legendOpen, setLegendOpen]     = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [cameraDevice, setCameraDevice] = useState<Device | null>(null);

  const toggleFilter = useCallback((id: FilterLayer) => {
    if (id === "all") { setFilters(["all"]); return; }
    setFilters((prev) => {
      const without = prev.filter((f) => f !== "all" && f !== id);
      const next    = prev.includes(id) ? without : [...without, id];
      return next.length === 0 ? ["all"] : next;
    });
  }, []);

  const handleSelectDevice = useCallback((d: Device) => {
    setSelectedDevice(d);
    setSelectedReport(null);
    if (d.type === "camera" && d.ip) setCameraDevice(d);
  }, []);

  const handleSelectReport = useCallback((r: Report) => {
    setSelectedReport(r);
    setSelectedDevice(null);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedReport(null);
    setSelectedDevice(null);
  }, []);

  const activeFilterCount = filters.includes("all") ? 0 : filters.length;

  return (
    <div className="bg-slate-950 text-white">

      {/* ══════════════════════════════════════════════════════════════════
          TOP BAR — fixed below the navbar
          Mobile : [icon + title]  ···  [filter btn]  [panel btn]
          Desktop: [icon + title + subtitle]  [pills…]  [panel btn]
      ══════════════════════════════════════════════════════════════════ */}
      <div className="fixed top-14 left-0 right-0 z-20 flex items-center gap-2 px-3 sm:px-4 h-12 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">

        {/* Title */}
        <div className="flex items-center gap-1.5 font-bold text-white flex-shrink-0">
          <MapPin size={14} className="text-emerald-400" />
          <span className="text-sm">Peta Monitoring</span>
          <span className="hidden sm:inline text-[10px] font-normal text-slate-500 ml-0.5">
            Kabupaten Klaten
          </span>
        </div>

        {/* Desktop filter pills — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1.5 flex-1 overflow-x-auto scrollbar-none mx-2">
          {FILTERS.map((f) => {
            const active = filters.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggleFilter(f.id)}
                className={`flex-shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  active ? f.activeColor : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{f.emoji}</span>
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Spacer on mobile */}
        <div className="flex-1 sm:hidden" />

        {/* Mobile: filter button with badge */}
        <button
          onClick={() => setFilterSheetOpen(true)}
          className="sm:hidden relative flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
        >
          <SlidersHorizontal size={13} />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full text-[9px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Legend button — mobile only */}
        <button
          onClick={() => setLegendOpen((o) => !o)}
          className="sm:hidden p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
          title="Legenda"
        >
          <Info size={14} />
        </button>

        {/* Panel toggle */}
        <button
          onClick={() => setSideOpen((o) => !o)}
          title={sideOpen ? "Tutup panel" : "Buka panel"}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          {sideOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          BODY
      ══════════════════════════════════════════════════════════════════ */}
      <div className="fixed top-26 left-0 right-0 bottom-0 flex overflow-hidden">

        {/* ── Map ── */}
        <div className="relative flex-1 overflow-hidden" style={{ isolation: "isolate", minHeight: 0 }}>
          <MainMap
            devices={devices}
            reports={reports}
            filters={filters}
            onSelectDevice={handleSelectDevice}
            onSelectReport={handleSelectReport}
          />

          {/* Legend — desktop always visible, mobile toggled */}
          <AnimatePresence>
            {(legendOpen || true) && (
              <motion.div
                initial={false}
                className={`absolute bottom-4 left-3 z-10 flex-col gap-2 pointer-events-none
                  hidden sm:flex`}
              >
                <div className="bg-gray-950/90 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2.5 text-xs">
                  <p className="font-semibold text-gray-300 mb-2 text-[11px] uppercase tracking-wide">Legenda</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {[["🚦","Traffic Light"],["💡","Lampu Jalan"],["🏫","ZoSS"],["📷","Kamera"],["🚨","Kecelakaan"],["⚠️","Laporan"]].map(([e,l]) => (
                      <div key={l} className="flex items-center gap-1.5">
                        <span className="text-sm">{e}</span>
                        <span className="text-gray-400 text-[10px]">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-950/90 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2.5 text-xs">
                  <p className="font-semibold text-gray-300 mb-2 text-[11px] uppercase tracking-wide">Zona Risiko</p>
                  {[{c:"bg-red-500",l:"Kritis"},{c:"bg-orange-500",l:"Tinggi"},{c:"bg-yellow-400",l:"Sedang"},{c:"bg-green-500",l:"Aman"}].map((item) => (
                    <div key={item.l} className="flex items-center gap-2 mb-1 last:mb-0">
                      <span className={`w-3 h-3 rounded-full opacity-75 flex-shrink-0 ${item.c}`} />
                      <span className="text-gray-400 text-[10px]">{item.l}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile legend popup */}
          <AnimatePresence>
            {legendOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="sm:hidden absolute bottom-16 left-3 z-20 bg-gray-900 border border-white/10 rounded-xl p-3 text-xs shadow-2xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-200 text-[11px] uppercase tracking-wide">Legenda & Zona Risiko</p>
                  <button onClick={() => setLegendOpen(false)} className="p-0.5 hover:bg-white/10 rounded">
                    <X size={12} className="text-gray-400" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-5 gap-y-1 mb-3">
                  {[["🚦","Traffic Light"],["💡","Lampu Jalan"],["🏫","ZoSS"],["📷","Kamera"],["🚨","Kecelakaan"],["⚠️","Laporan"]].map(([e,l]) => (
                    <div key={l} className="flex items-center gap-1.5">
                      <span>{e}</span><span className="text-gray-400">{l}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  {[{c:"bg-red-500",l:"Kritis"},{c:"bg-orange-500",l:"Tinggi"},{c:"bg-yellow-400",l:"Sedang"},{c:"bg-green-500",l:"Aman"}].map((item) => (
                    <div key={item.l} className="flex items-center gap-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.c}`} />
                      <span className="text-gray-400 text-[10px]">{item.l}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Desktop side panel (right column, ≥ sm) ── */}
        <AnimatePresence initial={false}>
          {sideOpen && (
            <motion.aside
              key="side-desktop"
              initial={{ width: 0 }}
              animate={{ width: 280 }}
              exit={{ width: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="hidden sm:flex flex-shrink-0 border-l border-white/10 bg-gray-950 overflow-hidden flex-col relative z-10"
            >
              <div className="w-[280px] flex flex-col h-full overflow-hidden">
                <AnimatePresence>
                  {cameraDevice?.ip && (
                    <motion.div
                      key="cam"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex-shrink-0 overflow-hidden"
                    >
                      <div className="p-3 pb-0">
                        <CameraWindow
                          ip={cameraDevice.ip}
                          deviceName={cameraDevice.name}
                          aiPort={AI_PORT}
                          onClose={() => setCameraDevice(null)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex-1 overflow-y-auto">
                  <MapSidePanel
                    reports={reports}
                    devices={devices}
                    onSelectReport={handleSelectReport}
                    onSelectDevice={handleSelectDevice}
                  />
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE FILTER BOTTOM SHEET
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {filterSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="sm:hidden fixed inset-0 z-40 bg-black/60"
              onClick={() => setFilterSheetOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-white/10 rounded-t-2xl p-4"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-sm">Filter Layer</p>
                <button onClick={() => setFilterSheetOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 pb-2">
                {FILTERS.map((f) => {
                  const active = filters.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleFilter(f.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        active ? f.activeColor : "bg-white/5 border-white/10 text-gray-300"
                      }`}
                    >
                      <span className="text-base">{f.emoji}</span>
                      <span>{f.label}</span>
                      {active && <span className="ml-auto text-[10px] opacity-70">✓</span>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE SIDE PANEL BOTTOM SHEET
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {sideOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="sm:hidden fixed inset-0 z-30 bg-black/40"
              onClick={() => setSideOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950 border-t border-white/10 rounded-t-2xl flex flex-col"
              style={{ maxHeight: "70vh" }}
              // stop any touch event on the sheet from reaching the map below
              onTouchMove={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex-shrink-0 pt-3 pb-1 flex justify-center">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              {/* Camera window on mobile */}
              {cameraDevice?.ip && (
                <div className="flex-shrink-0 px-3 pb-2">
                  <CameraWindow
                    ip={cameraDevice.ip}
                    deviceName={cameraDevice.name}
                    aiPort={AI_PORT}
                    onClose={() => setCameraDevice(null)}
                  />
                </div>
              )}
              {/* Scrollable content — overscroll-contain keeps scroll inside the sheet */}
              <div
                className="flex-1 overflow-y-auto overscroll-contain"
                style={{ touchAction: "pan-y" }}
              >
                <MapSidePanel
                  reports={reports}
                  devices={devices}
                  onSelectReport={handleSelectReport}
                  onSelectDevice={handleSelectDevice}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          DETAIL DRAWER
          Mobile  : bottom sheet, max 85vh, scrollable
          Desktop : right-anchored card
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {(selectedReport || selectedDevice) && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:pr-6 sm:pb-6 bg-black/50 backdrop-blur-sm"
            onClick={closeDetail}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:w-96 shadow-2xl overflow-y-auto"
              style={{ maxHeight: "85vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile drag handle */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              {selectedReport && <ReportDetail report={selectedReport} onClose={closeDetail} />}
              {selectedDevice && (
                <DeviceDetail
                  device={selectedDevice}
                  onClose={closeDetail}
                  onOpenCamera={(d) => { setCameraDevice(d); setSideOpen(true); closeDetail(); }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Report detail ──────────────────────────────────────────────────────────
function ReportDetail({ report: r, onClose }: { report: Report; onClose: () => void }) {
  return (
    <div className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="font-bold text-base text-white">{r.type}</h3>
          <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
            <MapPin size={11} /> {r.location}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${SEV[r.severity].badge}`}>
            {SEV[r.severity].label}
          </span>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X size={15} className="text-gray-400" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed mb-4 bg-white/5 rounded-xl p-3">{r.description}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <InfoCell icon={<Clock size={11} />}         label="Waktu"     value={formatDate(r.timestamp)} />
        <InfoCell icon={<AlertTriangle size={11} />} label="Status"    value={STATUS_LABEL[r.status]} />
        <InfoCell icon={<MapPin size={11} />}        label="Koordinat" value={`${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`} />
        <InfoCell icon={<span className={`w-2 h-2 rounded-full ${SEV[r.severity].dot}`} />} label="Tingkat" value={SEV[r.severity].label} />
      </div>
      {r.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.imageUrl} alt="Bukti" className="w-full rounded-xl object-cover max-h-36 mt-4" />
      )}
    </div>
  );
}

// ── Device detail ──────────────────────────────────────────────────────────
function DeviceDetail({ device: d, onClose, onOpenCamera }: {
  device: Device; onClose: () => void; onOpenCamera: (d: Device) => void;
}) {
  const online = d.status === "active";
  return (
    <div className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="font-bold text-base text-white">{d.name}</h3>
          <p className="text-gray-400 text-xs capitalize mt-0.5">{d.type.replace("-", " ")}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            online ? "bg-green-500/15 text-green-400 border-green-500/30"
                   : "bg-gray-500/15 text-gray-400 border-gray-500/30"
          }`}>
            {online ? <Wifi size={10} /> : <WifiOff size={10} />}
            {online ? "Online" : "Offline"}
          </span>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X size={15} className="text-gray-400" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
        <InfoCell icon={<MapPin size={11} />} label="Koordinat"      value={`${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}`} />
        <InfoCell icon={<Clock size={11} />}  label="Terakhir aktif" value={timeAgo(d.lastSeen)} />
        {d.ip && <InfoCell icon={<Wifi size={11} />} label="IP Address" value={d.ip} />}
      </div>
      {d.type === "camera" && d.ip && (
        <button
          onClick={() => onOpenCamera(d)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
        >
          <Camera size={14} /> Buka Live Stream <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}

// ── Shared ─────────────────────────────────────────────────────────────────
function InfoCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-2.5">
      <div className="flex items-center gap-1 text-gray-500 text-[10px] mb-1">{icon} {label}</div>
      <p className="text-white text-xs font-medium truncate">{value}</p>
    </div>
  );
}
