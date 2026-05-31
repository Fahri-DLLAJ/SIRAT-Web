"use client";
import { useState } from "react";
import { X, Video, Camera, AlertCircle, Maximize2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  ip: string;
  deviceName?: string;
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
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className={`bg-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col ${
          fullscreen ? "fixed inset-4 z-[9999]" : "w-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-semibold truncate max-w-[140px]">{deviceName ?? ip}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 mr-1">
              <ModeBtn active={mode === "stream"} onClick={() => { setMode("stream"); setError(false); }} icon={<Video size={12} />} label="Live" />
              <ModeBtn active={mode === "snapshot"} onClick={() => { setMode("snapshot"); setError(false); setSnapKey(k => k + 1); }} icon={<Camera size={12} />} label="Foto" />
            </div>
            {mode === "snapshot" && (
              <button
                onClick={() => setSnapKey(k => k + 1)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title="Refresh snapshot"
              >
                <RefreshCw size={14} className="text-gray-400" />
              </button>
            )}
            <button onClick={() => setFullscreen(f => !f)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <Maximize2 size={14} className="text-gray-400" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X size={14} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Stream area */}
        <div className="relative bg-black flex-1 flex items-center justify-center" style={{ minHeight: 200 }}>
          {error ? (
            <div className="flex flex-col items-center gap-2 text-gray-500 p-6">
              <AlertCircle size={28} />
              <p className="text-xs text-center">Tidak dapat terhubung ke {ip}</p>
              <button
                onClick={() => { setError(false); setSnapKey(k => k + 1); }}
                className="text-xs text-blue-400 hover:underline"
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

          <div className="absolute top-2 left-2">
            <span className="bg-black/70 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded-full">
              {mode === "stream" ? "MJPEG Live" : "Snapshot"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/10">
          <span className="text-[10px] text-gray-500">{ip}</span>
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
      className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors ${
        active ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
      }`}
    >
      {icon}{label}
    </button>
  );
}
