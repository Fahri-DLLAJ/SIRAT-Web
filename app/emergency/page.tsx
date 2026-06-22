"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, AlertTriangle, Navigation, MapPin, Loader2,
  CheckCircle2, X, ShieldAlert, Truck, Flame, Building2,
  ExternalLink, Copy, Check,
} from "lucide-react";

// ── Leaflet map loaded client-side only ───────────────────────────
const HospitalMap = dynamic(() => import("@/components/map/HospitalMap"), { ssr: false });

// ── Quick-dial contacts ───────────────────────────────────────────
const CONTACTS = [
  {
    label: "Polisi",
    number: "110",
    icon: ShieldAlert,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    glow: "shadow-blue-900/40",
    btn: "bg-blue-600 hover:bg-blue-700 shadow-blue-900/30",
    desc: "Kecelakaan, kejahatan, ketertiban umum",
  },
  {
    label: "Ambulans",
    number: "118",
    icon: Truck,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    glow: "shadow-green-900/40",
    btn: "bg-green-600 hover:bg-green-700 shadow-green-900/30",
    desc: "Korban luka, kondisi medis darurat",
  },
  {
    label: "Dinas Perhubungan",
    number: "0272-322241",
    icon: Navigation,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    glow: "shadow-yellow-900/40",
    btn: "bg-yellow-600 hover:bg-yellow-700 shadow-yellow-900/30",
    desc: "Gangguan lalu lintas, rambu rusak",
  },
  {
    label: "Pemadam Kebakaran",
    number: "113",
    icon: Flame,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    glow: "shadow-red-900/40",
    btn: "bg-red-600 hover:bg-red-700 shadow-red-900/30",
    desc: "Kebakaran, penyelamatan, bahan berbahaya",
  },
];

// ── Nearest hospitals (static — Klaten area) ─────────────────────
export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  type: "RS Umum" | "RS Swasta" | "Puskesmas";
  distance?: string; // filled after GPS
}

const HOSPITALS: Hospital[] = [
  {
    id: "h1",
    name: "RSUD Bagas Waras Klaten",
    address: "Jl. Suharto No.1, Klaten Utara",
    phone: "0272-321012",
    lat: -7.7063,
    lng: 110.5997,
    type: "RS Umum",
  },
  {
    id: "h2",
    name: "RS Islam Klaten",
    address: "Jl. Raya Klaten–Solo KM 4",
    phone: "0272-322252",
    lat: -7.7120,
    lng: 110.6080,
    type: "RS Swasta",
  },
  {
    id: "h3",
    name: "RS Cakra Husada",
    address: "Jl. Pemuda No.12, Klaten Tengah",
    phone: "0272-323456",
    lat: -7.7085,
    lng: 110.6010,
    type: "RS Swasta",
  },
  {
    id: "h4",
    name: "Puskesmas Klaten Tengah",
    address: "Jl. Merbabu No.5, Klaten",
    phone: "0272-321789",
    lat: -7.7010,
    lng: 110.6050,
    type: "Puskesmas",
  },
  {
    id: "h5",
    name: "Puskesmas Pedan",
    address: "Jl. Raya Pedan, Klaten Selatan",
    phone: "0272-551234",
    lat: -7.7350,
    lng: 110.5900,
    type: "Puskesmas",
  },
];

type LocState = "idle" | "loading" | "done" | "error";

const TYPE_CFG = {
  "RS Umum":   { color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20"   },
  "RS Swasta": { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  "Puskesmas": { color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20"  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4 } }),
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Main page ─────────────────────────────────────────────────────
export default function EmergencyPage() {
  const [locState, setLocState]       = useState<LocState>("idle");
  const [locError, setLocError]       = useState<string | null>(null);
  const [coords, setCoords]           = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [hospitals, setHospitals]     = useState<Hospital[]>(HOSPITALS);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [copied, setCopied]           = useState<string | null>(null);

  // Sort hospitals by distance once we have coords
  useEffect(() => {
    if (!coords) return;
    const sorted = [...HOSPITALS]
      .map((h) => {
        const km = haversineKm(coords.lat, coords.lng, h.lat, h.lng);
        return { ...h, distance: km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km` };
      })
      .sort((a, b) => {
        const da = haversineKm(coords.lat, coords.lng, a.lat, a.lng);
        const db = haversineKm(coords.lat, coords.lng, b.lat, b.lng);
        return da - db;
      });
    setHospitals(sorted);
  }, [coords]);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError("Perangkat Anda tidak mendukung GPS.");
      return;
    }
    setLocState("loading");
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          setLocationLabel(data.display_name?.split(",").slice(0, 3).join(", ") ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setLocationLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        setLocState("done");
      },
      (err) => {
        setLocState("error");
        if (err.code === 1) setLocError("Izin lokasi ditolak. Buka pengaturan browser dan izinkan akses lokasi.");
        else if (err.code === 2) setLocError("Lokasi tidak tersedia. Pastikan GPS aktif.");
        else setLocError("Waktu habis saat mendeteksi lokasi. Coba lagi.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  function copyNumber(number: string) {
    navigator.clipboard.writeText(number).catch(() => {});
    setCopied(number);
    setTimeout(() => setCopied(null), 2000);
  }

  const shareLocation = useCallback(() => {
    if (!coords) return;
    const text = `🚨 Lokasi Darurat SIRAT\n📍 ${locationLabel ?? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}\n🗺️ https://maps.google.com/?q=${coords.lat},${coords.lng}`;
    if (navigator.share) {
      navigator.share({ title: "Lokasi Darurat", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopied("location");
      setTimeout(() => setCopied(null), 2000);
    }
  }, [coords, locationLabel]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <title>Kontak Darurat & Panduan Keselamatan — SIRAT</title>
      <meta name="description" content="Akses cepat nomor bantuan darurat, bagikan lokasi GPS secara real-time, dan temukan rumah sakit terdekat dengan layanan darurat SIRAT." />

      {/* ── Sticky header ── */}
      <div className="border-b border-white/10 bg-gray-950/80 backdrop-blur-sm sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-400 text-xs font-medium mb-0.5">
              <AlertTriangle size={13} /> Kontak Darurat
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold">Bantuan Darurat</h1>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">

        {/* ══════════════════════════════════════════════════════════════
            QUICK DIAL BUTTONS
        ══════════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-1">
            <Phone size={14} /> Tombol Cepat
          </div>
          <h2 className="text-xl font-bold mb-5">Hubungi Sekarang</h2>

          {/* Desktop: 4-col | Mobile: 2-col */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {CONTACTS.map((c, i) => (
              <motion.div
                key={c.label}
                custom={i}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className={`relative border rounded-2xl p-4 sm:p-5 flex flex-col gap-3 ${c.bg} ${c.border}`}
              >
                {/* Icon + label */}
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl bg-white/10 ${c.color} flex-shrink-0`}>
                    <c.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white leading-tight">{c.label}</p>
                    <p className={`text-xs font-mono font-semibold ${c.color}`}>{c.number}</p>
                  </div>
                </div>

                {/* Description — hidden on very small screens */}
                <p className="text-[11px] text-gray-400 leading-relaxed hidden sm:block">{c.desc}</p>

                {/* Action row */}
                <div className="flex gap-2 mt-auto">
                  <a
                    href={`tel:${c.number}`}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-white font-bold text-xs py-2.5 rounded-xl transition-colors shadow-lg ${c.btn} ${c.glow}`}
                  >
                    <Phone size={13} />
                    Hubungi
                  </a>
                  <button
                    onClick={() => copyNumber(c.number)}
                    title="Salin nomor"
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors flex-shrink-0"
                  >
                    {copied === c.number
                      ? <Check size={13} className="text-green-400" />
                      : <Copy size={13} className="text-gray-400" />
                    }
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SHARE EMERGENCY LOCATION
        ══════════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-1">
            <MapPin size={14} /> Lokasi Darurat
          </div>
          <h2 className="text-xl font-bold mb-5">Bagikan Lokasi Saya</h2>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-5">
              {/* Left: description */}
              <div className="flex-1">
                <p className="font-semibold text-white mb-1">Kirim koordinat GPS Anda ke petugas</p>
                <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
                  Tekan tombol di bawah untuk mendeteksi lokasi Anda secara otomatis, lalu bagikan tautan Google Maps kepada petugas atau keluarga terdekat.
                </p>

                {/* Location result */}
                <AnimatePresence>
                  {locState === "done" && locationLabel && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2.5"
                    >
                      <MapPin size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-300 leading-relaxed">{locationLabel}</p>
                    </motion.div>
                  )}
                  {locState === "error" && locError && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5"
                    >
                      <AlertTriangle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-300 leading-relaxed">{locError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right: buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-52 flex-shrink-0">
                {locState !== "done" ? (
                  <button
                    onClick={getLocation}
                    disabled={locState === "loading"}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm shadow-lg shadow-blue-900/30"
                  >
                    {locState === "loading"
                      ? <><Loader2 size={15} className="animate-spin" /> Mendeteksi…</>
                      : <><Navigation size={15} /> Deteksi Lokasi Saya</>
                    }
                  </button>
                ) : (
                  <>
                    <button
                      onClick={shareLocation}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm shadow-lg shadow-blue-900/30"
                    >
                      {copied === "location"
                        ? <><Check size={15} /> Tersalin!</>
                        : <><ExternalLink size={15} /> Bagikan Lokasi</>
                      }
                    </button>
                    {coords && (
                      <a
                        href={`https://maps.google.com/?q=${coords.lat},${coords.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
                      >
                        <MapPin size={15} /> Buka di Maps
                      </a>
                    )}
                    <button
                      onClick={() => { setLocState("idle"); setCoords(null); setLocationLabel(null); }}
                      className="flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
                    >
                      <X size={12} /> Reset lokasi
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            NEAREST HOSPITALS
        ══════════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-1">
            <Building2 size={14} /> Fasilitas Kesehatan
          </div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold">Rumah Sakit Terdekat</h2>
            {coords && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-green-400" /> Diurutkan berdasarkan jarak
              </span>
            )}
          </div>

          {/* Desktop: map left + list right | Mobile: list then map */}
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Map — full width on mobile, fixed width on desktop */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 order-2 lg:order-1"
            >
              <div className="rounded-2xl overflow-hidden border border-white/10 h-72 sm:h-80 lg:h-full lg:min-h-[420px]">
                <HospitalMap
                  hospitals={hospitals}
                  userCoords={coords}
                  selected={selectedHospital}
                  onSelect={setSelectedHospital}
                />
              </div>
            </motion.div>

            {/* List */}
            <div className="flex-1 space-y-2.5 order-1 lg:order-2">
              {hospitals.map((h, i) => {
                const cfg = TYPE_CFG[h.type];
                const isSelected = selectedHospital?.id === h.id;
                return (
                  <motion.div
                    key={h.id}
                    custom={i}
                    initial="hidden"
                    animate="show"
                    variants={fadeUp}
                    onClick={() => setSelectedHospital(isSelected ? null : h)}
                    className={`bg-white/5 border rounded-2xl p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500/50 bg-blue-500/5"
                        : "border-white/10 hover:bg-white/8 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Rank badge */}
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                        i === 0 ? "bg-green-500/20 text-green-400" : "bg-white/10 text-gray-400"
                      }`}>
                        {i + 1}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <p className="font-semibold text-sm text-white leading-snug">{h.name}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                            {h.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                          <MapPin size={10} className="flex-shrink-0" />{h.address}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <a
                            href={`tel:${h.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Phone size={11} />{h.phone}
                          </a>
                          {h.distance && (
                            <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                              <Navigation size={10} />{h.distance}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Open maps */}
                      <a
                        href={`https://maps.google.com/?q=${h.lat},${h.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl bg-white/8 hover:bg-white/15 transition-colors flex-shrink-0"
                        title="Buka di Google Maps"
                      >
                        <ExternalLink size={13} className="text-gray-400" />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
