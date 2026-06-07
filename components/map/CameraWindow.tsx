"use client";
import { useState } from "react";
import { X, Video, Camera, AlertCircle, Maximize2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  ip: string;
  deviceName?: string;
  streamPort?: number;  // port MJPEG ESP32-CAM (default 81)
  aiPort?: number;      // port Python AI server (default 5000)
  onClose: () => void;
}

type Mode = "stream" | "snapshot";

export default function CameraWindow({ ip, deviceName, streamPort = 81, aiPort = 5000, onClose }: Props) {
  const [mode, setMode]             = useState<Mode>("stream");
  const [error, setError]           = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [snapKey, setSnapKey]       = useState(0);

  // Stream MJPEG: langsung ke ESP32-CAM dari browser (ESP32 hanya 1 koneksi)
  // Snapshot: lewat proxy Next.js
  const src =
    mode === "stream"
      ? `http://${ip}:${streamPort}/stream`
      : `/api/camera/snapshot?ip=${encodeURIComponent(ip)}&port=${streamPort}&t=${snapKey}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/30 flex flex-col ${
          fullscreen ? "fixed inset-4 z-[9999]" : "w-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
            </span>
            <span className="text-sm font-semibold truncate max-w-[160px] text-white">{deviceName ?? ip}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 mr-1">
              <ModeBtn active={mode === "stream"}   onClick={() => { setMode("stream");   setError(false); }} icon={<Video  size={13} strokeWidth={2} />} label="Live" />
              <ModeBtn active={mode === "snapshot"} onClick={() => { setMode("snapshot"); setError(false); setSnapKey(k => k + 1); }} icon={<Camera size={13} strokeWidth={2} />} label="Foto" />
            </div>
            {mode === "snapshot" && (
              <button onClick={() => setSnapKey(k => k + 1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 text-slate-400 hover:text-white" title="Refresh">
                <RefreshCw size={15} strokeWidth={2} />
              </button>
            )}
            <button onClick={() => setFullscreen(f => !f)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 text-slate-400 hover:text-white" title="Fullscreen">
              <Maximize2 size={15} strokeWidth={2} />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition-all duration-200 text-slate-400" title="Tutup">
              <X size={15} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Frame */}
        <div className="relative bg-black flex-1 flex items-center justify-center" style={{ minHeight: 200 }}>
          {error ? (
            <div className="flex flex-col items-center gap-3 text-slate-500 p-6">
              <div className="p-4 rounded-full bg-rose-500/10">
                <AlertCircle size={32} className="text-rose-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-center text-slate-300 font-medium">Tidak dapat terhubung</p>
              <p className="text-xs text-center text-slate-500 font-mono">{ip}:{streamPort}</p>
              <button onClick={() => setError(false)} className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline transition-colors mt-2">
                Coba lagi
              </button>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={`Stream ${ip}`}
              className="w-full h-full object-contain"
              onError={() => setError(true)}
            />
          )}
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="bg-black/60 backdrop-blur-md text-[10px] text-white font-medium px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
              {mode === "stream" ? "🔴 MJPEG Live" : "📸 Snapshot"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">{ip}</span>
          <span className="text-[10px] text-slate-600">port {streamPort}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ModeBtn({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${
        active
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}{label}
    </button>
  );
}
