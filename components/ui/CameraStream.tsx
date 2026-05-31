"use client";
import { useState } from "react";
import { getMjpegStreamUrl, getProcessedStreamUrl, getSnapshotUrl } from "@/lib/esp32";
import { Video, Cpu, Camera, AlertCircle } from "lucide-react";

interface Props {
  ip: string;
  /** Port the Python AI server listens on (default 5000) */
  aiPort?: number;
  deviceName?: string;
  className?: string;
}

type Mode = "stream" | "processed" | "snapshot";

export default function CameraStream({ ip, aiPort = 5000, deviceName, className = "" }: Props) {
  const [mode, setMode] = useState<Mode>("stream");
  const [error, setError] = useState(false);

  const src =
    mode === "stream"
      ? getMjpegStreamUrl(ip)
      : mode === "processed"
      ? getProcessedStreamUrl(ip, aiPort)
      : getSnapshotUrl(ip);

  return (
    <div className={`bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-black/20 ${className}`}>
      {/* Header - Glassmorphic */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2.5 text-sm font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
          </span>
          <span className="text-white">{deviceName ?? ip}</span>
        </div>
        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
          <ModeButton active={mode === "stream"} onClick={() => { setMode("stream"); setError(false); }} icon={<Video size={14} strokeWidth={2} />} label="Live" />
          <ModeButton active={mode === "processed"} onClick={() => { setMode("processed"); setError(false); }} icon={<Cpu size={14} strokeWidth={2} />} label="AI" />
          <ModeButton active={mode === "snapshot"} onClick={() => { setMode("snapshot"); setError(false); }} icon={<Camera size={14} strokeWidth={2} />} label="Foto" />
        </div>
      </div>

      {/* Stream / image */}
      <div className="relative aspect-video bg-black flex items-center justify-center">
        {error ? (
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="p-4 rounded-full bg-rose-500/10">
              <AlertCircle size={36} className="text-rose-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-slate-300 font-medium">Tidak dapat terhubung</p>
            <p className="text-xs text-slate-500">{ip}</p>
            <button
              onClick={() => setError(false)}
              className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline transition-colors mt-2"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={`Stream dari ${ip}`}
            className="w-full h-full object-contain"
            onError={() => setError(true)}
          />
        )}

        {/* Mode label overlay - Glassmorphic */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-[10px] text-white font-medium px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
          {mode === "stream" ? "🔴 MJPEG Live" : mode === "processed" ? "🤖 AI Detection" : "📸 Snapshot"}
        </div>
      </div>

      {/* Footer info - Glassmorphic */}
      <div className="px-4 py-2.5 text-[11px] text-slate-500 flex justify-between border-t border-white/5 bg-white/[0.02]">
        <span className="font-mono">{ip}</span>
        {mode === "processed" && <span className="text-purple-400 font-medium">Python · port {aiPort}</span>}
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${
        active 
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" 
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
