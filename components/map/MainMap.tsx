"use client";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Layer, Circle } from "leaflet";
import { Device, Report } from "@/store/appStore";

export type FilterLayer = "all" | "reports" | "devices" | "cameras" | "highRisk";

interface Props {
  devices: Device[];
  reports: Report[];
  filters: FilterLayer[];
  onSelectDevice: (d: Device) => void;
  onSelectReport: (r: Report) => void;
}

// ── Klaten Regency, Central Java ───────────────────────────────────────────
const KLATEN_CENTER: [number, number] = [-7.7059, 110.6010];
const KLATEN_ZOOM = 13;

// ── Styled pin icon: colored circle + emoji ────────────────────────────────
function pinIcon(L: typeof import("leaflet"), emoji: string, bg: string, size = 38) {
  const half = size / 2;
  return L.divIcon({
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:${bg};
        border:3px solid rgba(255,255,255,0.9);
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 4px 12px rgba(0,0,0,0.5), 0 0 0 2px rgba(0,0,0,0.1);
        display:flex;align-items:center;justify-content:center;
        transition: all 0.2s ease;
      ">
        <span style="transform:rotate(45deg);font-size:${size * 0.45}px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">${emoji}</span>
      </div>`,
    className: "map-pin-icon",
    iconSize:   [size, size],
    iconAnchor: [half, size],
    popupAnchor:[0, -(size + 6)],
  });
}

const DEVICE_PIN: Record<Device["type"], { emoji: string; bg: string }> = {
  "traffic-light": { emoji: "🚦", bg: "#16a34a" },
  lamp:            { emoji: "💡", bg: "#ca8a04" },
  sensor:          { emoji: "🏫", bg: "#7c3aed" },
  camera:          { emoji: "📷", bg: "#2563eb" },
};

const REPORT_PIN: Record<string, { emoji: string; bg: string }> = {
  Kecelakaan:   { emoji: "🚨", bg: "#dc2626" },
  Banjir:       { emoji: "🌊", bg: "#0284c7" },
  "Jalan Rusak":{ emoji: "⚠️", bg: "#d97706" },
  default:      { emoji: "⚠️", bg: "#d97706" },
};

const SEVERITY_HEAT: Record<Report["severity"], { color: string; radius: number; opacity: number }> = {
  critical: { color: "#ef4444", radius: 500, opacity: 0.30 },
  high:     { color: "#f97316", radius: 380, opacity: 0.24 },
  medium:   { color: "#eab308", radius: 260, opacity: 0.20 },
  low:      { color: "#22c55e", radius: 180, opacity: 0.16 },
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)   return `${s} detik lalu`;
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  return `${Math.floor(s / 3600)} jam lalu`;
}

// ── Popup styles (injected once) ───────────────────────────────────────────
const POPUP_CSS = `
  .s-popup { font-family: system-ui, sans-serif; min-width: 220px; color: #f1f5f9; }
  .s-popup-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; letter-spacing: -0.01em; }
  .s-popup-sub   { font-size: 11px; color: #94a3b8; margin-bottom: 12px; }
  .s-popup-row   { display:flex; align-items:center; gap:7px; font-size:11px; margin-bottom:6px; color:#cbd5e1; }
  .s-popup-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px;
                   border-radius:999px; font-size:10px; font-weight:600; border:1px solid; }
  .leaflet-popup-content-wrapper { 
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%) !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 16px !important;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1) inset !important;
    padding: 4px !important;
  }
  .leaflet-popup-content { margin: 12px 14px !important; }
  .leaflet-popup-tip { 
    background: rgba(15, 23, 42, 0.98) !important;
    box-shadow: 0 0 10px rgba(0,0,0,0.3) !important;
  }
  .leaflet-popup-close-button { 
    color: #94a3b8 !important;
    font-size: 18px !important;
    top: 10px !important;
    right: 10px !important;
    width: 24px !important;
    height: 24px !important;
    border-radius: 6px !important;
    transition: all 0.2s !important;
  }
  .leaflet-popup-close-button:hover {
    background: rgba(255,255,255,0.1) !important;
    color: #fff !important;
  }
`;

export default function MainMap({ devices, reports, filters, onSelectDevice, onSelectReport }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<LeafletMap | null>(null);
  const markersRef   = useRef<Layer[]>([]);
  const heatRef      = useRef<Circle[]>([]);
  // Keep latest props accessible inside the async init callback
  const propsRef = useRef({ devices, reports, filters, onSelectDevice, onSelectReport });
  useEffect(() => { propsRef.current = { devices, reports, filters, onSelectDevice, onSelectReport }; });

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current) return;

    // Inject popup CSS once
    if (!document.getElementById("s-popup-css")) {
      const style = document.createElement("style");
      style.id = "s-popup-css";
      style.textContent = POPUP_CSS;
      document.head.appendChild(style);
    }

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(containerRef.current, {
        center: KLATEN_CENTER,
        zoom:   KLATEN_ZOOM,
        zoomControl: false,
        attributionControl: true,
      });
      mapRef.current = map;

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Render markers immediately after map is ready using latest props
      renderMarkers(L, map, markersRef, heatRef, propsRef.current);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Re-render markers/heat when data or filters change ────────────────────
  useEffect(() => {
    if (!mapRef.current) return; // map not ready yet — init effect handles first render
    import("leaflet").then((L) => {
      renderMarkers(L, mapRef.current!, markersRef, heatRef, { devices, reports, filters, onSelectDevice, onSelectReport });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices, reports, filters]);

  return <div ref={containerRef} className="w-full h-full" style={{ isolation: "isolate" }} />;
}

// ── Extracted render logic ─────────────────────────────────────────────────
function renderMarkers(
  L: typeof import("leaflet"),
  map: import("leaflet").Map,
  markersRef: React.MutableRefObject<Layer[]>,
  heatRef: React.MutableRefObject<import("leaflet").Circle[]>,
  { devices, reports, filters, onSelectDevice, onSelectReport }: {
    devices: Device[];
    reports: Report[];
    filters: FilterLayer[];
    onSelectDevice: (d: Device) => void;
    onSelectReport: (r: Report) => void;
  }
) {
  markersRef.current.forEach((l) => map.removeLayer(l));
  heatRef.current.forEach((l)   => map.removeLayer(l));
  markersRef.current = [];
  heatRef.current    = [];

  const all         = filters.includes("all");
  const showReports = all || filters.includes("reports");
  const showDevices = all || filters.includes("devices");
  const showCameras = all || filters.includes("cameras");
  const showHeat    = all || filters.includes("highRisk");

  if (showHeat) {
    reports.forEach((r) => {
      const h = SEVERITY_HEAT[r.severity];
      const c = L.circle([r.lat, r.lng], {
        radius: h.radius, color: "transparent",
        fillColor: h.color, fillOpacity: h.opacity,
      }).addTo(map);
      heatRef.current.push(c);
    });
  }

  if (showDevices || showCameras) {
    devices.forEach((d) => {
      if (d.type === "camera" && !showCameras && !all) return;
      if (d.type !== "camera" && !showDevices && !all) return;
      const pin = DEVICE_PIN[d.type] ?? DEVICE_PIN.camera;
      const m = L.marker([d.lat, d.lng], { icon: pinIcon(L, pin.emoji, pin.bg) })
        .addTo(map)
        .bindPopup(devicePopup(d), { maxWidth: 280, className: "" });
      m.on("click", () => onSelectDevice(d));
      markersRef.current.push(m);
    });
  }

  if (showReports) {
    reports.filter((r) => !r.hidden).forEach((r) => {
      const pin = REPORT_PIN[r.type] ?? REPORT_PIN.default;
      const m = L.marker([r.lat, r.lng], { icon: pinIcon(L, pin.emoji, pin.bg) })
        .addTo(map)
        .bindPopup(reportPopup(r), { maxWidth: 280, className: "" });
      m.on("click", () => onSelectReport(r));
      markersRef.current.push(m);
    });
  }
}

// ── Popup builders ─────────────────────────────────────────────────────────
function statusBadge(status: Device["status"]) {
  const map = {
    active:  { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)", label: "● Online"   },
    offline: { color: "#64748b", bg: "rgba(100,116,139,0.15)", border: "rgba(100,116,139,0.3)", label: "● Offline"  },
    pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)", label: "● Menunggu" },
  };
  const s = map[status] ?? map.offline;
  return `<span class="s-popup-badge" style="color:${s.color};background:${s.bg};border-color:${s.border}">${s.label}</span>`;
}

function sevBadge(sev: Report["severity"]) {
  const map = {
    critical: { color: "#f43f5e", bg: "rgba(244,63,94,0.15)", border: "rgba(244,63,94,0.3)", label: "Kritis"  },
    high:     { color: "#f97316", bg: "rgba(249,115,22,0.15)", border: "rgba(249,115,22,0.3)", label: "Tinggi"  },
    medium:   { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)", label: "Sedang"  },
    low:      { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)", label: "Rendah"  },
  };
  const s = map[sev];
  return `<span class="s-popup-badge" style="color:${s.color};background:${s.bg};border-color:${s.border}">${s.label}</span>`;
}

function devicePopup(d: Device): string {
  const typeLabel: Record<Device["type"], string> = {
    "traffic-light": "Traffic Light", lamp: "Lampu Jalan", sensor: "ZoSS / Sensor", camera: "Kamera",
  };
  return `<div class="s-popup">
    <div class="s-popup-title">${d.name}</div>
    <div class="s-popup-sub">${typeLabel[d.type]}</div>
    <div class="s-popup-row">📍 <span style="color:#cbd5e1">${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}</span></div>
    <div class="s-popup-row">Status: ${statusBadge(d.status)}</div>
    <div class="s-popup-row">🕐 <span style="color:#94a3b8">${timeAgo(d.lastSeen)}</span></div>
    ${d.ip ? `<div class="s-popup-row">🌐 <span style="color:#64748b">${d.ip}</span></div>` : ""}
  </div>`;
}

function reportPopup(r: Report): string {
  const statusMap: Record<Report["status"], string> = {
    active: "Sedang ditangani", pending: "Menunggu respons", resolved: "Selesai",
  };
  return `<div class="s-popup">
    <div class="s-popup-title">${r.type}</div>
    <div class="s-popup-sub">📍 ${r.location}</div>
    <div class="s-popup-row">Tingkat: ${sevBadge(r.severity)}</div>
    <div class="s-popup-row">Status: <span style="color:#cbd5e1">${statusMap[r.status]}</span></div>
    <div class="s-popup-row">🕐 <span style="color:#94a3b8">${timeAgo(r.timestamp)}</span></div>
    <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#94a3b8;line-height:1.5">${r.description}</div>
  </div>`;
}
