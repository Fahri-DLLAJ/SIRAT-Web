"use client";
import { useState } from "react";
import { X, Video, Camera, AlertCircle, Maximize2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  ip: string;
  deviceName?: string;
  aiPort?: number;
  onClose: () => void;
}

type Mode = "stream" | "snapshot";

export default function CameraWindow({ ip, deviceName, onClose }: Props) {
  const [mode, setMode]         = useState<Mode>("stream");
  const [error, setError]       = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [snapKey, setSnapKey]   = useState(0);

  // Stream: load the device's own HTML viewer page in an iframe.
  // This avoids all CORS/mixed-content issues — the browser loads a page
  // from the device itself, which then loads the stream from the same origin.
  // Snapshot: direct img request to port 81 (one-shot GETs are not blocked).
  const src =
    mode === "stream"
      ? `http://${ip}/`
      : `http://${ip}:81/capture?t=${snapKey}`;

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
        {/* Header - Glassmorphic */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
            </span>
            <span className="text-sm font-semibold truncate max-w-[160px] text-white">{deviceName ?? ip}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Mode toggle */}
            <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 mr-1">
              <ModeBtn active={mode === "stream"} onClick={() => { setMode("stream"); setError(false); }} icon={<Video size={13} strokeWidth={2} />} label="Live" />
              <ModeBtn active={mode === "snapshot"} onClick={() => { setMode("snapshot"); setError(false); setSnapKey(k => k + 1); }} icon={<Camera size={13} strokeWidth={2} />} label="Foto" />
            </div>
            {mode === "snapshot" && (
              <button
                onClick={() => setSnapKey(k => k + 1)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 text-slate-400 hover:text-white"
                title="Refresh snapshot"
              >
                <RefreshCw size={15} strokeWidth={2} />
              </button>
            )}
            <button 
              onClick={() => setFullscreen(f => !f)} 
              className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 text-slate-400 hover:text-white"
              title="Toggle fullscreen"
            >
              <Maximize2 size={15} strokeWidth={2} />
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition-all duration-200 text-slate-400"
              title="Close"
            >
              <X size={15} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Stream area */}
        <div className="relative bg-black flex-1 flex items-center justify-center" style={{ minHeight: 200 }}>
          {error ? (
            <div className="flex flex-col items-center gap-3 text-slate-500 p-6">
              <div className="p-4 rounded-full bg-rose-500/10">
                <AlertCircle size={32} className="text-rose-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-center text-slate-300 font-medium">Tidak dapat terhubung</p>
              <p className="text-xs text-center text-slate-500">{ip}</p>
              <button
                onClick={() => { setError(false); setSnapKey(k => k + 1); }}
                className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline transition-colors mt-2"
              >
                Coba lagi
              </button>
            </div>
          ) : mode === "stream" ? (
            <iframe
              key={src}
              src={src}
              className="w-full h-full border-0"
              title={`Stream ${ip}`}
              onError={() => setError(true)}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={`Snapshot ${ip}`}
              className="w-full h-full object-contain"
              onError={() => setError(true)}
            />
          )}

          {/* Mode label overlay - Glassmorphic */}
          <div className="absolute top-3 left-3">
            <span className="bg-black/60 backdrop-blur-md text-[10px] text-white font-medium px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
              {mode === "stream" ? "🔴 MJPEG Live" : "📸 Snapshot"}
            </span>
          </div>
        </div>

        {/* Footer - Glassmorphic */}
        <div className="px-4 py-2.5 border-t border-white/5 bg-white/[0.02]">
          <span className="text-[10px] text-slate-500 font-mono">{ip}</span>
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
