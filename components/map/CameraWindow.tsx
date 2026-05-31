"use client";
import { useEffect, useState, useCallback } from "react";
import { getMjpegStreamUrl, getProcessedStreamUrl, getSnapshotUrl, getConfigPortalUrl } from "@/lib/esp32";
import { X, Video, Cpu, Camera, AlertCircle, Loader2, Maximize2, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  ip: string;
  deviceName?: string;
  aiPort?: number;
  onClose: () => void;
}

type Mode = "stream" | "ai" | "snapshot";

export default function CameraWindow({ ip, deviceName, aiPort = 5000, onClose }: Props) {
  const [mode, setMode]         = useState<Mode>("stream");
  const [error, setError]       = useState(false);
  const [aiReady, setAiReady]   = useState(false);
  const [checking, setChecking] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // ── Wake the Python vision server when this window opens ──────────────────
  useEffect(() => {
    fetch("/api/camera", { method: "POST", body: JSON.stringify({ action: "wake" }), headers: { "Content-Type": "application/json" } })
      .catch(() => {});

    // Poll health until AI is ready (max 15s)
    let attempts = 0;
    setChecking(true);
    const poll = setInterval(async () => {
      attempts++;
      try {
        const res  = await fetch("/api/camera");
        const data = await res.json();
        if (data.active) {
          setAiReady(true);
          setChecking(false);
          clearInterval(poll);
        }
      } catch { /* server not up yet */ }
      if (attempts >= 15) {
        setChecking(false);
        clearInterval(poll);
      }
    }, 1000);

    // ── Sleep the server when this window closes ───────────────────────────
    return () => {
      clearInterval(poll);
      fetch("/api/camera", { method: "POST", body: JSON.stringify({ action: "sleep" }), headers: { "Content-Type": "application/json" } })
        .catch(() => {});
    };
  }, []);

  const src = useCallback(() => {
    if (mode === "stream")   return getMjpegStreamUrl(ip);
    if (mode === "ai")       return getProcessedStreamUrl(ip, aiPort);
    return getSnapshotUrl(ip);
  }, [mode, ip, aiPort]);

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
            {/* Mode buttons */}
            <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 mr-1">
              <ModeBtn active={mode === "stream"} onClick={() => { setMode("stream"); setError(false); }} icon={<Video size={12} />} label="Live" />
              <ModeBtn
                active={mode === "ai"}
                onClick={() => { setMode("ai"); setError(false); }}
                icon={checking ? <Loader2 size={12} className="animate-spin" /> : <Cpu size={12} />}
                label="AI"
                disabled={!aiReady && !checking}
                title={!aiReady ? "Python server belum siap" : undefined}
              />
              <ModeBtn active={mode === "snapshot"} onClick={() => { setMode("snapshot"); setError(false); }} icon={<Camera size={12} />} label="Foto" />
            </div>
            <a
              href={getConfigPortalUrl(ip)}
              target="_blank"
              rel="noopener noreferrer"
              title="Open device config portal"
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Settings size={14} className="text-gray-400" />
            </a>
            <button onClick={() => setFullscreen((f) => !f)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
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
              <button onClick={() => setError(false)} className="text-xs text-blue-400 hover:underline">
                Coba lagi
              </button>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src()}
              src={src()}
              alt={`Stream ${ip}`}
              className="w-full h-full object-contain"
              onError={() => setError(true)}
            />
          )}

          {/* Overlay badges */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            <span className="bg-black/70 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded-full">
              {mode === "stream" ? "MJPEG Live" : mode === "ai" ? "AI Detection" : "Snapshot"}
            </span>
            {mode === "ai" && checking && (
              <span className="bg-yellow-900/80 text-yellow-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Loader2 size={9} className="animate-spin" /> Menghubungkan…
              </span>
            )}
            {mode === "ai" && !checking && !aiReady && (
              <span className="bg-red-900/80 text-red-300 text-[10px] px-2 py-0.5 rounded-full">
                Server tidak aktif
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] text-gray-500">{ip}</span>
          {mode === "ai" && (
            <span className="text-[10px] text-purple-400">Python · port {aiPort}</span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ModeBtn({
  active, onClick, icon, label, disabled, title,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode;
  label: string; disabled?: boolean; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
      }`}
    >
      {icon}{label}
    </button>
  );
}
