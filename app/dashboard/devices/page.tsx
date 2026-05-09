"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, Camera, Lightbulb, TrafficCone, Wifi, WifiOff,
  Search, X, RefreshCw, Eye, Power, ChevronRight,
  Clock, MapPin, Shield, Plus, Pencil, Trash2, Save,
} from "lucide-react";
import { useDevices } from "@/hooks/useDevices";
import { useAppStore, Device } from "@/store/appStore";
import CameraStream from "@/components/ui/CameraStream";
import { formatDate } from "@/lib/utils";
import { toggleDevicePin } from "@/lib/esp32";

const TYPE_META: Record<Device["type"], { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  camera:          { label: "Kamera",        icon: Camera,      color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/20"   },
  lamp:            { label: "Lampu Jalan",   icon: Lightbulb,   color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
  "traffic-light": { label: "Traffic Light", icon: TrafficCone, color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/20"  },
  sensor:          { label: "ZoSS / Sensor", icon: Cpu,         color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
};

const STATUS_META = {
  active:  { label: "Online",  dot: "bg-green-400",  badge: "bg-green-400/10 text-green-400 border-green-400/20"   },
  offline: { label: "Offline", dot: "bg-red-400",    badge: "bg-red-400/10 text-red-400 border-red-400/20"         },
  pending: { label: "Pending", dot: "bg-yellow-400", badge: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" },
};

const FILTER_TYPES: (Device["type"] | "all")[] = ["all", "camera", "lamp", "traffic-light", "sensor"];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35 } }),
};

// ── Inline map picker (Leaflet, client-only) ───────────────────────
const KLATEN: [number, number] = [-7.7059, 110.6010];

function MapPicker({ lat, lng, onChange }: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef    = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef      = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current) return;
    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;
      LRef.current = L;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      const center: [number, number] = lat !== null && lng !== null ? [lat, lng] : KLATEN;
      const map = L.map(containerRef.current!, { center, zoom: 13, zoomControl: true });
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 0);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap", maxZoom: 19,
      }).addTo(map);
      if (lat !== null && lng !== null) {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        if (markerRef.current) markerRef.current.remove();
        markerRef.current = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        onChange(e.latlng.lat, e.latlng.lng);
      });
    });
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-white/10"
      style={{ height: 220, isolation: "isolate" }}
    />
  );
}

// ── Device Form Modal ──────────────────────────────────────────────
function DeviceModal({ initial, onSave, onClose, saving }: {
  initial?: Device;
  onSave: (data: Partial<Device>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name:        initial?.name        ?? "",
    type:        initial?.type        ?? "camera" as Device["type"],
    lat:         initial?.lat  ?? null as number | null,
    lng:         initial?.lng  ?? null as number | null,
    status:      initial?.status      ?? "active" as Device["status"],
    ip:          initial?.ip          ?? "",
    description: initial?.description ?? "",
  });

  const valid = form.name.trim() && form.lat !== null && form.lng !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">{initial ? "Edit Perangkat" : "Tambah Perangkat"}</h3>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>

        <div className="space-y-3">
          {/* Text fields */}
          {[
            { label: "Nama *", key: "name", placeholder: "Nama perangkat..." },
            { label: "IP Address", key: "ip", placeholder: "192.168.1.x" },
            { label: "Deskripsi", key: "description", placeholder: "Keterangan tambahan..." },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <p className="text-[11px] font-semibold text-gray-400 mb-1">{label}</p>
              <input
                value={(form as Record<string, unknown>)[key] as string}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          ))}

          {/* Type & Status selects */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-1">Tipe *</p>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as Device["type"] })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="camera" className="bg-gray-900">Kamera</option>
                <option value="lamp" className="bg-gray-900">Lampu Jalan</option>
                <option value="traffic-light" className="bg-gray-900">Traffic Light</option>
                <option value="sensor" className="bg-gray-900">ZoSS / Sensor</option>
              </select>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-1">Status *</p>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Device["status"] })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="active" className="bg-gray-900">Online</option>
                <option value="offline" className="bg-gray-900">Offline</option>
                <option value="pending" className="bg-gray-900">Pending</option>
              </select>
            </div>
          </div>

          {/* Map picker */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 mb-1">
              Lokasi * <span className="font-normal text-gray-600">(klik pada peta untuk memilih)</span>
            </p>
            <MapPicker
              lat={form.lat}
              lng={form.lng}
              onChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))}
            />
            {form.lat !== null && form.lng !== null ? (
              <p className="text-[11px] text-blue-400 mt-1.5 font-mono text-center">
                {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
              </p>
            ) : (
              <p className="text-[11px] text-yellow-500/80 mt-1.5 text-center flex items-center justify-center gap-1">
                <MapPin size={11} /> Belum ada lokasi dipilih
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => valid && onSave({ ...form, lat: form.lat!, lng: form.lng! })}
          disabled={!valid || saving}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          Simpan
        </button>
      </motion.div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────
function DeleteConfirm({ name, onConfirm, onClose, saving }: {
  name: string; onConfirm: () => void; onClose: () => void; saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-red-500/10 rounded-xl"><Trash2 size={18} className="text-red-400" /></div>
          <p className="font-semibold">Hapus perangkat ini?</p>
        </div>
        <p className="text-sm text-gray-400 mb-1"><span className="text-white font-medium">{name}</span></p>
        <p className="text-xs text-gray-500 mb-4">Tindakan ini tidak dapat dibatalkan.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">Batal</button>
          <button onClick={onConfirm} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {saving ? <RefreshCw size={14} className="animate-spin mx-auto" /> : "Hapus"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function DevicesPage() {
  const { devices, activeCount, systemStatus } = useDevices();
  const { setDevices } = useAppStore();

  const [search, setSearch]             = useState("");
  const [typeFilter, setTypeFilter]     = useState<Device["type"] | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Device["status"] | "all">("all");
  const [cameraDevice, setCameraDevice] = useState<Device | null>(null);
  const [toggling, setToggling]         = useState<string | null>(null);
  const [editDevice, setEditDevice]     = useState<Device | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [saving, setSaving]             = useState(false);

  const filtered = devices.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || (d.ip ?? "").includes(search);
    const matchType   = typeFilter === "all" || d.type === typeFilter;
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  async function handleToggle(device: Device) {
    if (!device.ip) return;
    setToggling(device.id);
    const newStatus = device.status === "active" ? "offline" : "active";
    await toggleDevicePin(device.ip, 2, newStatus === "active");
    const res = await fetch("/api/admin/devices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: device.id, status: newStatus }),
    });
    const data = await res.json();
    if (data.ok) setDevices(devices.map((d) => d.id === device.id ? data.device : d));
    setToggling(null);
  }

  async function handleSave(formData: Partial<Device>) {
    setSaving(true);
    if (editDevice === "new") {
      const res = await fetch("/api/admin/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.ok) setDevices([...devices, data.device]);
    } else if (editDevice) {
      const res = await fetch("/api/admin/devices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editDevice.id, ...formData }),
      });
      const data = await res.json();
      if (data.ok) setDevices(devices.map((d) => d.id === editDevice.id ? data.device : d));
    }
    setSaving(false);
    setEditDevice(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    await fetch("/api/admin/devices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    setDevices(devices.filter((d) => d.id !== deleteTarget.id));
    setSaving(false);
    setDeleteTarget(null);
  }

  async function refreshDevices() {
    const res = await fetch("/api/admin/devices");
    const data = await res.json();
    if (data.ok) setDevices(data.devices);
  }

  const offlineCount = devices.length - activeCount;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-white/10 bg-gray-950/80 backdrop-blur-sm sticky top-16 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-medium mb-0.5">
              <Shield size={13} /> Manajemen Perangkat
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold">Perangkat IoT</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditDevice("new")}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              <Plus size={13} /> Tambah
            </button>
            <button onClick={refreshDevices} className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-colors">
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {systemStatus.map((s, i) => {
            const meta = TYPE_META[s.type];
            const Icon = meta.icon;
            const pct  = s.total === 0 ? 0 : Math.round((s.online / s.total) * 100);
            const bar  = pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
            return (
              <motion.div key={s.type} custom={i} initial="hidden" animate="show" variants={fadeUp}
                className={`border rounded-2xl p-4 flex flex-col gap-2 ${meta.bg} ${meta.border}`}>
                <div className={`p-2 rounded-xl bg-white/10 w-fit ${meta.color}`}><Icon size={15} /></div>
                <p className={`text-2xl font-extrabold ${meta.color}`}>{s.online}<span className="text-sm font-normal text-gray-500">/{s.total}</span></p>
                <div>
                  <p className="text-xs font-semibold text-white leading-tight">{meta.label}</p>
                  <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className={`h-full rounded-full ${bar}`} initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 + i * 0.05 }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-green-400/10 border border-green-400/20 text-green-400 rounded-xl px-3 py-1.5">
              <Wifi size={12} /><span className="text-xs font-bold">{activeCount}</span><span className="text-[11px] font-medium">Online</span>
            </div>
            <div className="flex items-center gap-1.5 bg-red-400/10 border border-red-400/20 text-red-400 rounded-xl px-3 py-1.5">
              <WifiOff size={12} /><span className="text-xs font-bold">{offlineCount}</span><span className="text-[11px] font-medium">Offline</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-400 rounded-xl px-3 py-1.5">
              <Cpu size={12} /><span className="text-xs font-bold">{devices.length}</span><span className="text-[11px] font-medium">Total</span>
            </div>
          </div>
          <div className="hidden sm:block w-px h-6 bg-white/10 flex-shrink-0" />
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau IP..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="-mx-4 sm:mx-0 sm:flex-1 min-w-0">
            <div className="flex gap-2 overflow-x-auto px-4 sm:px-0 pb-1 sm:pb-0 scrollbar-none">
              {FILTER_TYPES.map((t) => {
                const active = typeFilter === t;
                const meta   = t !== "all" ? TYPE_META[t] : null;
                return (
                  <button key={t} onClick={() => setTypeFilter(t)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      active ? "bg-blue-600 border-blue-500 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}>
                    {meta ? <meta.icon size={13} /> : <Cpu size={13} />}
                    {t === "all" ? "Semua" : meta!.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-shrink-0 grid grid-cols-3 gap-1 bg-white/5 border border-white/10 rounded-xl p-1 sm:w-52">
            {(["all", "active", "offline"] as const).map((s) => {
              const active = statusFilter === s;
              const dotColor = s === "active" ? "bg-green-400" : s === "offline" ? "bg-red-400" : "";
              return (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    active ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
                  }`}>
                  {s !== "all" && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />}
                  {s === "all" ? "Semua" : s === "active" ? "Online" : "Offline"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Device grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
            <Cpu size={36} className="opacity-30" />
            <p className="text-sm">Tidak ada perangkat ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((device, i) => {
              const meta     = TYPE_META[device.type];
              const sMeta    = STATUS_META[device.status];
              const Icon     = meta.icon;
              const isCamera = device.type === "camera";
              const canToggle = (device.type === "lamp" || device.type === "traffic-light") && !!device.ip;

              return (
                <motion.div key={device.id} custom={i} initial="hidden" animate="show" variants={fadeUp}
                  className={`border rounded-2xl p-4 flex flex-col gap-3 bg-white/5 ${meta.border} hover:bg-white/8 transition-colors`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className={`p-2.5 rounded-xl ${meta.bg} ${meta.color} flex-shrink-0`}><Icon size={16} /></div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditDevice(device)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Edit">
                        <Pencil size={12} className="text-gray-400" />
                      </button>
                      <button onClick={() => setDeleteTarget(device)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors" title="Hapus">
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${sMeta.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sMeta.dot} ${device.status === "active" ? "animate-pulse" : ""}`} />
                        {sMeta.label}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{device.name}</p>
                    <p className={`text-[11px] font-medium mt-0.5 ${meta.color}`}>{meta.label}</p>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-gray-400">
                    {device.ip && (
                      <div className="flex items-center gap-1.5"><Wifi size={11} className="flex-shrink-0" /><span className="font-mono">{device.ip}</span></div>
                    )}
                    <div className="flex items-center gap-1.5"><MapPin size={11} className="flex-shrink-0" /><span>{device.lat.toFixed(4)}, {device.lng.toFixed(4)}</span></div>
                    <div className="flex items-center gap-1.5"><Clock size={11} className="flex-shrink-0" /><span>{formatDate(device.lastSeen)}</span></div>
                  </div>

                  <div className="flex items-center gap-2 mt-auto pt-1 border-t border-white/8">
                    {isCamera && device.ip && (
                      <button onClick={() => setCameraDevice(device)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/20 rounded-xl py-1.5 transition-colors">
                        <Eye size={12} /> Live View
                      </button>
                    )}
                    {canToggle && (
                      <button onClick={() => handleToggle(device)} disabled={toggling === device.id}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium rounded-xl py-1.5 border transition-colors ${
                          device.status === "active"
                            ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                            : "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20"
                        } disabled:opacity-50`}>
                        {toggling === device.id ? <RefreshCw size={12} className="animate-spin" /> : <Power size={12} />}
                        {device.status === "active" ? "Matikan" : "Nyalakan"}
                      </button>
                    )}
                    {!isCamera && !canToggle && (
                      <span className="text-[10px] text-gray-600 flex items-center gap-1"><ChevronRight size={11} /> Tidak ada IP</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Camera stream modal */}
      <AnimatePresence>
        {cameraDevice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setCameraDevice(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-white">{cameraDevice.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{cameraDevice.ip}</p>
                </div>
                <button onClick={() => setCameraDevice(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <CameraStream ip={cameraDevice.ip!} deviceName={cameraDevice.name}
                aiPort={Number(process.env.NEXT_PUBLIC_AI_STREAM_PORT) || 5000} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit modal */}
      <AnimatePresence>
        {editDevice && (
          <DeviceModal
            initial={editDevice === "new" ? undefined : editDevice}
            onSave={handleSave}
            onClose={() => setEditDevice(null)}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirm
            name={deleteTarget.name}
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
