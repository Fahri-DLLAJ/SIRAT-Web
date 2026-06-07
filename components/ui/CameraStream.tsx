"use client";
import { useState } from "react";
import { Video, Camera, AlertCircle } from "lucide-react";

interface Props {
  ip: string;
  streamPort?: number;  // port MJPEG ESP32-CAM (default 81)
  aiPort?: number;      // port Python AI server (default 5000)
  deviceName?: string;
  className?: string;
}

type Mode = "stream" | "snapshot";

export default function CameraStream({ ip, streamPort = 81, aiPort = 5000, deviceName, className = "" }: Props) {
  const [mode, setMode]       = useState<Mode>("stream");
  const [error, setError]     = useState(false);
  const [snapKey, setSnapKey] = useState(0);

  // Stream MJPEG: langsung ke ESP32-CAM dari browser
  // ESP32-CAM hanya bisa 1 koneksi stream — jangan proxy lewat server
  // Snapshot: lewat proxy Next.js (agar bisa refresh & tidak CORS issue)
  const src =
    mode === "stream"
      ? `http://${ip}:${streamPort}/stream`
      : `/api/camera/snapshot?ip=${encodeURIComponent(ip)}&port=${streamPort}&t=${snapKey}`;

  return (
    <div className={`bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-black/20 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2.5 text-sm font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
          </span>
          <span className="text-white">{deviceName ?? ip}</span>
        </div>
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
          <ModeButton active={mode === "stream"}   onClick={() => { setMode("stream");   setError(false); }} icon={<Video  size={14} strokeWidth={2} />} label="Live" />
          <ModeButton active={mode === "snapshot"} onClick={() => { setMode("snapshot"); setError(false); setSnapKey(k => k + 1); }} icon={<Camera size={14} strokeWidth={2} />} label="Foto" />
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
            <p className="text-xs text-slate-500 font-mono">{ip}:{streamPort}</p>
            <button onClick={() => setError(false)} className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline transition-colors mt-2">
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
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-[10px] text-white font-medium px-3 py-1.5 rounded-full border border-white/10 shadow-lg pointer-events-none">
          {mode === "stream" ? "🔴 MJPEG Live" : "📸 Snapshot"}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 text-[11px] text-slate-500 flex justify-between border-t border-white/5 bg-white/[0.02]">
        <span className="font-mono">{ip}</span>
        <span className="text-slate-600">port {streamPort}</span>
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, icon, label }: {
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
